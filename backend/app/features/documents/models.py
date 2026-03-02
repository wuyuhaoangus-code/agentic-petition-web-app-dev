from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid

class UserFile(Base):
    __tablename__ = "user_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Link to auth.users UUID (Supabase managed)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=True)  # Frontend app context
    file_url = Column(String, nullable=False) # Storage path in Supabase bucket
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True) # Size in bytes
    file_type = Column(String, nullable=True)
    is_sensitive = Column(Boolean, nullable=True, default=False)
    category = Column(String, nullable=True) # e.g. 'degrees', 'evidence'
    criteria = Column(String, nullable=True) # comma-separated list of criteria IDs
    content_hash = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserEvidenceContent(Base):
    __tablename__ = "user_evidence_content"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("user_files.id"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    category = Column(String, nullable=True) # Added: e.g. 'basicInfo', 'evidence'
    criteria = Column(String, nullable=True) # comma-separated list of criteria IDs
    type = Column(String, nullable=False) # 'file' or 'manual'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserExhibit(Base):
    __tablename__ = "user_exhibits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    run_id = Column(UUID(as_uuid=True), ForeignKey("petition_runs.id", ondelete="CASCADE"), nullable=True)
    criteria_id = Column(String, nullable=False)
    section_letter = Column(String, nullable=True) # Added for dynamic sectioning
    exhibit_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    draft_content = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PetitionRun(Base):
    __tablename__ = "petition_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    criteria_id = Column(String, nullable=False)
    status = Column(String, default="generating") # generating, ready, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserCriteriaDraft(Base):
    __tablename__ = "user_criteria_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("petition_runs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    criteria_id = Column(String, nullable=False)
    section_intro = Column(String, nullable=True) # Added
    section_conclusion = Column(String, nullable=True)
    precedent_context = Column(String, nullable=True) # Added for persistent RAG caching
    rag_field = Column(String, nullable=True) # Tied to RAG query
    rag_occupation = Column(String, nullable=True) # Tied to RAG query
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserExhibitItem(Base):
    __tablename__ = "user_exhibit_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    exhibit_id = Column(UUID(as_uuid=True), ForeignKey("user_exhibits.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("user_files.id", ondelete="CASCADE"), nullable=True)
    content_id = Column(UUID(as_uuid=True), ForeignKey("user_evidence_content.id", ondelete="CASCADE"), nullable=True)
    item_suffix = Column(String, nullable=False) # 'a', 'b', 'c'...

class Citation(Base):
    __tablename__ = "citations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    exhibit_id = Column(UUID(as_uuid=True), ForeignKey("user_exhibits.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    snippet = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserPetitionDraft(Base):
    __tablename__ = "user_petition_intro_conclusion_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("petition_runs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    section = Column(String, nullable=False) # 'intro' or 'conclusion'
    section_content = Column(String, nullable=False)
    rag_field = Column(String, nullable=True)
    rag_occupation = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserPetitionDocument(Base):
    __tablename__ = "user_petition_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    run_id = Column(UUID(as_uuid=True), ForeignKey("petition_runs.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String, nullable=False, default="petition")  # 'petition' | 'cover_letter'
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    mime_type = Column(String, nullable=False, default="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    file_size = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="ready")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
