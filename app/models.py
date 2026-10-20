from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List

class AskRequest(BaseModel):
    content: str = Field(..., description="The prompt or question to ask Genie")
    conversation_id: Optional[str] = Field(None, description="Provide this to continue an existing conversation")

class AskResponse(BaseModel):
    message_id: str
    conversation_id: str

class StatusResponse(BaseModel):
    status: str
    status_message: str
    trusted_asset: bool = False
    summary: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None

class FeedbackRequest(BaseModel):
    conversation_id: str
    message_id: str
    rating: str = Field(..., description="Either 'POSITIVE' or 'NEGATIVE'")
