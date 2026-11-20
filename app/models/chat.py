import uuid
from datetime import datetime

from sqlalchemy import Boolean, Unicode, text
from sqlalchemy.dialects.mssql import DATETIME2, UNIQUEIDENTIFIER
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class Chat(Base):
    """One row per Genie conversation, recording which signed-in user owns it (ppm.genie_chats)."""

    __tablename__ = "genie_chats"
    __table_args__ = {"schema": "ppm"}

    id: Mapped[uuid.UUID] = mapped_column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(Unicode(64))  # Microsoft Entra `oid`
    genie_conversation_id: Mapped[str] = mapped_column(Unicode(64), unique=True)
    space_id: Mapped[str] = mapped_column(Unicode(64))
    title: Mapped[str] = mapped_column(Unicode(200))
    is_pinned: Mapped[bool] = mapped_column(Boolean, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(DATETIME2(3), server_default=text("SYSUTCDATETIME()"))
    updated_at: Mapped[datetime] = mapped_column(DATETIME2(3), server_default=text("SYSUTCDATETIME()"))
