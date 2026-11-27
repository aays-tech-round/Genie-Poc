import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Unicode, UniqueConstraint, text
from sqlalchemy.dialects.mssql import DATETIME2, NVARCHAR, UNIQUEIDENTIFIER
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class Chat(Base):
    """One row per Genie conversation, recording which signed-in user owns it (ppm.genie_chats)."""

    __tablename__ = "genie_chats"
    __table_args__ = {"schema": "ppm"}

    id: Mapped[uuid.UUID] = mapped_column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(Unicode(64))  # Microsoft Entra `oid`
    email_id: Mapped[Optional[str]] = mapped_column(Unicode(320), nullable=True)  # token's `preferred_username`; display only
    genie_conversation_id: Mapped[str] = mapped_column(Unicode(64), unique=True)
    space_id: Mapped[str] = mapped_column(Unicode(64))
    title: Mapped[str] = mapped_column(Unicode(200))
    is_pinned: Mapped[bool] = mapped_column(Boolean, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(DATETIME2(3), server_default=text("SYSUTCDATETIME()"))
    updated_at: Mapped[datetime] = mapped_column(DATETIME2(3), server_default=text("SYSUTCDATETIME()"))


class GenieChatMessage(Base):
    """
    One row per question a user asked Genie, kept for analytics (ppm.genie_chat_messages).
    Only the question is stored; Genie's answers stay in Genie, which remains the source of chat history.
    Rows go when their chat is deleted (ON DELETE CASCADE on chat_id).
    """

    __tablename__ = "genie_chat_messages"
    __table_args__ = (
        UniqueConstraint("chat_id", "genie_message_id", name="UQ_genie_chat_messages_chat_genie_message"),
        {"schema": "ppm"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("NEWID()")
    )
    chat_id: Mapped[uuid.UUID] = mapped_column(
        UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("ppm.genie_chats.id", ondelete="CASCADE")
    )
    user_id: Mapped[str] = mapped_column(Unicode(128))  # Microsoft Entra `oid`
    email_id: Mapped[Optional[str]] = mapped_column(Unicode(256), nullable=True)  # token's `preferred_username`
    genie_message_id: Mapped[str] = mapped_column(Unicode(64))
    question: Mapped[str] = mapped_column(NVARCHAR(None))  # NVARCHAR(MAX)
    created_at: Mapped[datetime] = mapped_column(DATETIME2(3), server_default=text("SYSUTCDATETIME()"))
