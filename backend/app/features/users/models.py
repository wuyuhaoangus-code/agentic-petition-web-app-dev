from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid

class Profile(Base):
    """
    Extends Supabase auth.users with application-specific data.
    """
    __tablename__ = "profiles"

    # Match the UUID from auth.users
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    field = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
