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
    # How Genie got to the answer. The SQL appears as soon as Genie has written it
    # (before the query runs); the rest may be empty depending on the space.
    sql: Optional[str] = None
    sql_parameters: Optional[List[Dict[str, Any]]] = None  # [{keyword, sql_type, value}]
    query_title: Optional[str] = None
    query_description: Optional[str] = None
    thoughts: Optional[List[Dict[str, str]]] = None  # [{type, content}], type e.g. "data_sourcing"
    suggested_questions: Optional[List[str]] = None

class FeedbackRequest(BaseModel):
    conversation_id: str
    message_id: str
    rating: str = Field(..., description="Either 'POSITIVE' or 'NEGATIVE'")
