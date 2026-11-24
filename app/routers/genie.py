from fastapi import APIRouter, HTTPException, Path, Query, Depends, Response
from databricks.sdk.errors import NotFound
from datetime import timezone
from functools import lru_cache
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session
from models import (
    AskRequest, AskResponse, StatusResponse, FeedbackRequest, Chat, ChatMessage, ChatSummary, ChatUpdate,
)
from services.databricks_client import DatabricksGenieClient
from auth import CurrentUser, get_current_user
from db import get_db
import logging
import os

logger = logging.getLogger(__name__)

# Every Genie route requires a signed-in user (see auth.py).
router = APIRouter(dependencies=[Depends(get_current_user)])

_GENIE_ID_PATTERN = r"^[A-Za-z0-9_-]+$"

def get_space_id() -> str:
    space_id = os.getenv("GENIE_SPACE_ID")
    if not space_id:
        logger.error("GENIE_SPACE_ID is not set")
        raise HTTPException(status_code=500, detail="GENIE_SPACE_ID is not configured on the server.")
    return space_id

def require_owner(db: Session, user: CurrentUser, conversation_id: str) -> None:
    """404 unless this conversation is in the signed-in user's own chat list."""
    owned = db.scalar(
        select(Chat.id).where(Chat.user_id == user.oid, Chat.genie_conversation_id == conversation_id)
    )
    # End the read transaction now so the connection isn't held while we wait on Databricks.
    db.rollback()
    if owned is None:
        raise HTTPException(status_code=404, detail="Chat not found.")

def title_from(content: str) -> str:
    # Same rule as the frontend used for a new chat's title: the first 40 characters of the question.
    text = " ".join(content.split())
    return text if len(text) <= 40 else text[:40].strip() + "…"

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
    if request.conversation_id:
        require_owner(db, user, request.conversation_id)

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
        db.add(Chat(
            user_id=user.oid,
            email_id=user.email,
            genie_conversation_id=res.conversation_id,
            space_id=space_id,
            title=title_from(request.content),
        ))
    db.commit()
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

@router.get(
    "/visualization/{message_id}/{attachment_id}",
    response_class=Response,
    responses={200: {"content": {"image/png": {}}, "description": "The chart Genie rendered, as a PNG."}},
)
def get_visualization(
    # Genie IDs are plain tokens; anything else could alter the Databricks URL they are put in.
    message_id: str = Path(..., pattern=_GENIE_ID_PATTERN),
    attachment_id: str = Path(..., pattern=_GENIE_ID_PATTERN),
    conversation_id: str = Query(..., description="The Genie Conversation ID"),
    client: DatabricksGenieClient = Depends(get_genie_client),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Downloads the chart Genie generated for a visualization attachment, so the browser can show
    it without ever holding Databricks credentials. Any failure tells the UI to draw its own chart.
    """
    require_owner(db, user, conversation_id)
    try:
        image = client.download_visualization(
            space_id=get_space_id(),
            conversation_id=conversation_id,
            message_id=message_id,
            attachment_id=attachment_id,
        )
    except HTTPException:
        raise
    except NotFound:
        raise HTTPException(status_code=404, detail="Visualization not found.")
    except Exception as e:
        logger.error(f"Error downloading visualization {attachment_id} of message {message_id}: {e}")
        raise HTTPException(status_code=502, detail="Could not download the visualization from Genie.")

    if not image:
        raise HTTPException(status_code=404, detail="Visualization not found.")
    # A rendered chart never changes, so the browser may reuse it; "private" keeps shared caches out.
    return Response(content=image, media_type="image/png", headers={"Cache-Control": "private, max-age=3600"})

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
