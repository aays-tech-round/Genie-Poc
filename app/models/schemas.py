from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Any, Dict, List

class AskRequest(BaseModel):
    content: str = Field(..., description="The prompt or question to ask Genie")
    conversation_id: Optional[str] = Field(None, description="Provide this to continue an existing conversation")

class AskResponse(BaseModel):
    message_id: str
    conversation_id: str

class StatusResponse(BaseModel):
    status: str  # Genie's MessageStatus code, e.g. FETCHING_METADATA, EXECUTING_QUERY, COMPLETED
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

class ChatMessage(StatusResponse):
    """One question and Genie's answer to it, as returned when a chat is opened."""
    message_id: str
    content: str  # the question

class ChatUpdate(BaseModel):
    """New title and/or pin state for a chat; fields left out stay as they are."""
    title: Optional[str] = Field(None, max_length=200)
    is_pinned: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value):
        if value is None:
            return value
        value = " ".join(value.split())
        if not value:
            raise ValueError("Title can't be empty.")
        return value

    @model_validator(mode="after")
    def something_to_change(self):
        if self.title is None and self.is_pinned is None:
            raise ValueError("Provide a title and/or is_pinned.")
        return self

class ChatSummary(BaseModel):
    """One entry of the signed-in user's chat list."""
    id: str
    conversation_id: str
    title: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
