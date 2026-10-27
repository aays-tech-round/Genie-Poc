from fastapi import APIRouter, HTTPException, Query, Depends
from functools import lru_cache
from typing import Optional
from models import AskRequest, AskResponse, StatusResponse, FeedbackRequest
from services.databricks_client import DatabricksGenieClient
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter()

def get_space_id() -> str:
    space_id = os.getenv("GENIE_SPACE_ID")
    if not space_id:
        logger.error("GENIE_SPACE_ID is not set")
        raise HTTPException(status_code=500, detail="GENIE_SPACE_ID is not configured on the server.")
    return space_id

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
async def ask_genie(request: AskRequest, client: DatabricksGenieClient = Depends(get_genie_client)):
    """
    Submits a message to Databricks Genie immediately and returns IDs to allow async polling.
    """
    try:
        res = client.ask(
            space_id=get_space_id(),
            content=request.content,
            conversation_id=request.conversation_id
        )
        return AskResponse(**res)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{message_id}", response_model=StatusResponse)
async def get_status(
    message_id: str,
    conversation_id: str = Query(..., description="The Genie Conversation ID"),
    client: DatabricksGenieClient = Depends(get_genie_client)
):
    """
    Polls the Databricks API for the current message status and formats it for the UI.
    """
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
async def submit_feedback(request: FeedbackRequest, client: DatabricksGenieClient = Depends(get_genie_client)):
    """
    Sends POSITIVE/NEGATIVE feedback.
    """
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
