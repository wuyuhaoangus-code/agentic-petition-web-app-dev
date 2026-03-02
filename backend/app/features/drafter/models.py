from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid

class PetitionDraft(Base):
    """
    Stores AI-generated petition drafts.
    """
    __tablename__ = "petition_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    petition_type = Column(String, nullable=False) # e.g., "EB1A", "NIW"
    content = Column(Text, nullable=False)
    status = Column(String, default="draft") # draft, complete
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
