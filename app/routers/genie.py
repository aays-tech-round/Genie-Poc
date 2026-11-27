from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import timezone
from functools import lru_cache
from typing import Optional
import uuid
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from models import (
    AskRequest, AskResponse, StatusResponse, FeedbackRequest, Chat, ChatMessage, ChatSummary, ChatUpdate,
    GenieChatMessage,
)
from services.databricks_client import DatabricksGenieClient
from auth import CurrentUser, get_current_user
from db import get_db
import logging
import os

logger = logging.getLogger(__name__)

# Every Genie route requires a signed-in user (see auth.py).
router = APIRouter(dependencies=[Depends(get_current_user)])

def get_space_id() -> str:
    space_id = os.getenv("GENIE_SPACE_ID")
    if not space_id:
        logger.error("GENIE_SPACE_ID is not set")
        raise HTTPException(status_code=500, detail="GENIE_SPACE_ID is not configured on the server.")
    return space_id

def require_owner(db: Session, user: CurrentUser, conversation_id: str) -> uuid.UUID:
    """404 unless this conversation is in the signed-in user's own chat list. Returns the chat's id."""
    owned = db.scalar(
        select(Chat.id).where(Chat.user_id == user.oid, Chat.genie_conversation_id == conversation_id)
    )
    # End the read transaction now so the connection isn't held while we wait on Databricks.
    db.rollback()
    if owned is None:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return owned

def title_from(content: str) -> str:
    # Same rule as the frontend used for a new chat's title: the first 40 characters of the question.
    text = " ".join(content.split())
    return text if len(text) <= 40 else text[:40].strip() + "…"

def save_question(db: Session, chat_id: uuid.UUID, user: CurrentUser, genie_message_id: str, question: str) -> None:
    """
    Records a question Genie has accepted in ppm.genie_chat_messages, for analytics. Only the question
    is stored, never Genie's answer. Genie already has the question, so a failure here is logged and
    swallowed rather than failing /ask (which would make the user ask it again). Saving the same
    (chat, Genie message) twice is a no-op, so a retry never creates a duplicate row.
    """
    if genie_message_id.startswith("fallback_msg_"):
        # DatabricksGenieClient.ask() made this up because Genie's reply had no message ID; it isn't unique.
        logger.error(f"Question not saved for analytics: Genie returned no message ID (chat {chat_id}).")
        return
    try:
        exists = db.scalar(
            select(GenieChatMessage.id).where(
                GenieChatMessage.chat_id == chat_id, GenieChatMessage.genie_message_id == genie_message_id
            )
        )
        if exists is None:
            db.add(GenieChatMessage(
                chat_id=chat_id,
                user_id=user.oid,
                email_id=user.email,
                genie_message_id=genie_message_id,
                question=question,
            ))
        db.commit()
    except IntegrityError:
        # A concurrent save of the same question won the race on UQ_genie_chat_messages_chat_genie_message.
        db.rollback()
        logger.info(f"Question for Genie message {genie_message_id} (chat {chat_id}) was already saved.")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            f"Failed to save question for analytics (chat {chat_id}, Genie message {genie_message_id}, "
            f"user {user.oid}): {e}"
        )

def chat_summary(chat: Chat) -> ChatSummary:
    return ChatSummary(
        id=str(chat.id),
        conversation_id=chat.genie_conversation_id,
        title=chat.title,
        is_pinned=bool(chat.is_pinned),
        # SQL Server hands back naive UTC datetimes; mark them as UTC so browsers read them correctly.
        created_at=chat.created_at.replace(tzinfo=timezone.utc),
        updated_at=chat.updated_at.replace(tzinfo=timezone.utc),
    )

# One shared client for the process. Building a WorkspaceClient and fetching its OAuth
# token takes ~4s, which made every /status poll that slow; the SDK refreshes the token
# itself. A failed init isn't cached, so the next request retries.
@lru_cache(maxsize=1)
def _shared_client() -> DatabricksGenieClient:
    return DatabricksGenieClient()

def get_genie_client():
    try:
        return _shared_client()
    except Exception as e:
        logger.error(f"Failed to initialize Databricks client: {e}")
        raise HTTPException(status_code=500, detail="Internal server error connecting to Databricks.")

@router.post("/ask", response_model=AskResponse)
def ask_genie(
    request: AskRequest,
    client: DatabricksGenieClient = Depends(get_genie_client),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a message to Databricks Genie immediately and returns IDs to allow async polling.
    A new conversation is recorded in the user's chat list; a follow-up must be in it already.
    """
    space_id = get_space_id()
    chat_id: Optional[uuid.UUID] = None
    if request.conversation_id:
        chat_id = require_owner(db, user, request.conversation_id)

    try:
        res = AskResponse(**client.ask(
            space_id=space_id,
            content=request.content,
            conversation_id=request.conversation_id
        ))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    if request.conversation_id:
        # Keep the stored email current, but never blank it (e.g. when the token has none)
        values = {"updated_at": func.sysutcdatetime()}
        if user.email:
            values["email_id"] = user.email
        db.execute(
            update(Chat)
            .where(Chat.user_id == user.oid, Chat.genie_conversation_id == res.conversation_id)
            .values(**values)
        )
    else:
        chat = Chat(
            user_id=user.oid,
            email_id=user.email,
            genie_conversation_id=res.conversation_id,
            space_id=space_id,
            title=title_from(request.content),
        )
        db.add(chat)
    db.commit()
    if chat_id is None:
        chat_id = chat.id

    save_question(db, chat_id, user, res.message_id, request.content)
    return res

@router.get("/chats", response_model=list[ChatSummary])
def list_chats(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """The signed-in user's chats for the current Genie space, most recently used first."""
    chats = db.scalars(
        select(Chat)
        .where(Chat.user_id == user.oid, Chat.space_id == get_space_id())
        .order_by(Chat.updated_at.desc())
    ).all()
    return [chat_summary(c) for c in chats]

@router.patch("/chats/{conversation_id}", response_model=ChatSummary)
def update_chat(
    conversation_id: str,
    changes: ChatUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Renames and/or pins one of the signed-in user's chats. Doesn't count as chat activity."""
    chat = db.scalar(
        select(Chat).where(Chat.user_id == user.oid, Chat.genie_conversation_id == conversation_id)
    )
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found.")
    if changes.title is not None:
        chat.title = changes.title
    if changes.is_pinned is not None:
        chat.is_pinned = changes.is_pinned
    db.commit()
    return chat_summary(chat)

@router.delete("/chats/{conversation_id}")
def delete_chat(
    conversation_id: str,
    client: DatabricksGenieClient = Depends(get_genie_client),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently deletes one of the signed-in user's chats, in Genie and in the chat list.
    Genie goes first: if removing our row then fails, a retry finds the conversation already
    gone in Genie and still completes. The other way round could leave a hidden conversation in Genie.
    """
    require_owner(db, user, conversation_id)
    try:
        client.delete_conversation(space_id=get_space_id(), conversation_id=conversation_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation {conversation_id} in Genie: {e}")
        raise HTTPException(status_code=500, detail=f"Could not delete the chat in Genie: {e}")

    db.execute(delete(Chat).where(Chat.user_id == user.oid, Chat.genie_conversation_id == conversation_id))
    db.commit()
    logger.info(f"User {user.oid} deleted conversation {conversation_id}")
    return {"success": True}

@router.get("/chats/{conversation_id}/messages", response_model=list[ChatMessage])
def get_chat_messages(
    conversation_id: str,
    client: DatabricksGenieClient = Depends(get_genie_client),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The questions and Genie's answers of one of the user's chats, read from Genie, oldest first."""
    require_owner(db, user, conversation_id)
    try:
        messages = client.list_messages(space_id=get_space_id(), conversation_id=conversation_id)
        return [ChatMessage(**m) for m in messages]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /chats/{conversation_id}/messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{message_id}", response_model=StatusResponse)
def get_status(
    message_id: str,
    conversation_id: str = Query(..., description="The Genie Conversation ID"),
    client: DatabricksGenieClient = Depends(get_genie_client),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Polls the Databricks API for the current message status and formats it for the UI.
    """
    require_owner(db, user, conversation_id)
    try:
        status_info = client.get_status(
            space_id=get_space_id(),
            conversation_id=conversation_id,
            message_id=message_id
        )
        return StatusResponse(**status_info)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /status: {e}")
        # Depending on how client behaves on timeout/disconnect, we handle standard errors.
        if "Timeout" in str(e) or "Warehouse" in str(e):
            raise HTTPException(status_code=503, detail="Service unavailable or timeout.")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
def submit_feedback(
    request: FeedbackRequest,
    client: DatabricksGenieClient = Depends(get_genie_client),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sends POSITIVE/NEGATIVE feedback.
    """
    require_owner(db, user, request.conversation_id)
    try:
        client.submit_feedback(
            space_id=get_space_id(),
            conversation_id=request.conversation_id,
            message_id=request.message_id,
            rating=request.rating
        )
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
