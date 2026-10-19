from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from app.models import AskRequest, AskResponse, StatusResponse, FeedbackRequest
from app.services.databricks_client import DatabricksGenieClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple dependency injection for the client
def get_genie_client():
    try:
        return DatabricksGenieClient()
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
            space_id=request.space_id,
            content=request.content,
            conversation_id=request.conversation_id
        )
        return AskResponse(**res)
    except Exception as e:
        logger.error(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{message_id}", response_model=StatusResponse)
async def get_status(
    message_id: str,
    space_id: str = Query(..., description="The Genie Space ID"),
    conversation_id: str = Query(..., description="The Genie Conversation ID"),
    client: DatabricksGenieClient = Depends(get_genie_client)
):
    """
    Polls the Databricks API for the current message status and formats it for the UI.
    """
    try:
        status_info = client.get_status(
            space_id=space_id,
            conversation_id=conversation_id,
            message_id=message_id
        )
        return StatusResponse(**status_info)
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
            space_id=request.space_id,
            conversation_id=request.conversation_id,
            message_id=request.message_id,
            rating=request.rating
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Error in /feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
