from sqlalchemy.orm import Session
from app.features.documents.models import UserFile, UserEvidenceContent
from app.features.documents.repositories import DocumentRepository
from app.features.petitions.repositories import ExhibitRepository
from app.features.document_ai.vision import vision_service
from app.core.config import settings
from app.core.storage import SupabaseStorageGateway, get_supabase_storage_gateway
from app.core.observability import log_event
import uuid
import hashlib
import logging

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(
        self,
        supabase_storage: SupabaseStorageGateway | None = None,
    ):
        self.supabase_storage = supabase_storage or get_supabase_storage_gateway()

    def calculate_hash(self, file_bytes: bytes) -> str:
        """Generates a SHA-256 fingerprint of the file content."""
        return hashlib.sha256(file_bytes).hexdigest()

    def _download_supabase_bytes(self, file_path: str, bucket_name: str = None) -> bytes:
        """Downloads a stored file from Supabase Storage using service role credentials."""
        if not file_path:
            raise ValueError("Missing file path for Supabase download")

        bucket = bucket_name or settings.SUPABASE_STORAGE_BUCKET
        if bucket != settings.SUPABASE_STORAGE_BUCKET:
            # Use a one-off gateway for non-default buckets.
            temp_gateway = SupabaseStorageGateway(bucket=bucket)
            data = temp_gateway.download(file_path)
        else:
            data = self.supabase_storage.download(file_path)

        if not data:
            raise RuntimeError("Failed to download file bytes from Supabase Storage")

        return data

    async def _extract_and_save_evidence_content(
        self,
        db: Session,
        user_id: uuid.UUID,
        file_id: uuid.UUID,
        title: str,
        file_bytes: bytes,
        application_id: uuid.UUID = None,
        category: str = None,
        criteria: str = None,
        update_existing: bool = True,
    ) -> uuid.UUID | None:
        """Runs Vision OCR and stores/updates user_evidence_content for a file."""
        full_text = ""
        async for page_data in vision_service.extract_text_stream(file_bytes):
            if "text" in page_data:
                full_text += page_data["text"] + "\n"
            elif "error" in page_data:
                logger.error(f"Vision API error during OCR processing: {page_data['error']}")

        if not full_text.strip():
            return None
        repo = DocumentRepository(db)
        existing_evidence = repo.get_evidence_for_file(user_id, file_id, evidence_type="file")

        if existing_evidence and update_existing:
            existing_evidence.application_id = application_id
            existing_evidence.title = title
            existing_evidence.content = full_text.strip()
            existing_evidence.category = category
            existing_evidence.criteria = criteria
            try:
                db.commit()
            except Exception as commit_err:
                db.rollback()
                logger.error(f"Failed to update evidence content: {commit_err}")
                raise
            db.refresh(existing_evidence)
            return existing_evidence.id

        evidence_content = UserEvidenceContent(
            user_id=user_id,
            application_id=application_id,
            file_id=file_id,
            title=title,
            content=full_text.strip(),
            category=category,
            criteria=criteria,
            type="file"
        )
        repo.add_evidence(evidence_content)
        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to create evidence content: {commit_err}")
            raise
        db.refresh(evidence_content)
        return evidence_content.id

    async def handle_upload(
        self, 
        db: Session, 
        file_bytes: bytes, 
        filename: str, 
        user_id: uuid.UUID,
        application_id: uuid.UUID = None,
        category: str = None,
        criteria: str = None,
        file_size: int = None,
        file_type: str = None,
        is_sensitive: bool = False
    ) -> uuid.UUID:
        """
        Coordinates the upload: checks for duplicate content first,
        otherwise uploads to Supabase Storage and saves metadata.
        Also extracts text content via Vision API and saves to user_evidence_content.
        """
        # 1. Generate fingerprint
        file_hash = self.calculate_hash(file_bytes)

        # 2. Check if this USER already uploaded this EXACT file
        repo = DocumentRepository(db)
        existing_file = repo.get_file_by_hash(user_id, file_hash)

        storage_path = ""
        uploaded_new = False
        log_event(logger, "document_upload_start", user_id=user_id, filename=filename, file_size=file_size or len(file_bytes))

        try:
            if existing_file:
                # DEDUPLICATION: Point to the same storage object
                storage_path = existing_file.file_url
            else:
                # 3. New file: Generate unique path and upload to Supabase Storage
                unique_filename = f"users/{user_id}/{uuid.uuid4()}-{filename}"
                content_type = file_type or "application/octet-stream"
                self.supabase_storage.upload(unique_filename, file_bytes, content_type)
                storage_path = unique_filename
                uploaded_new = True

            # 4. Save to Supabase (via SQLAlchemy)
            db_file = UserFile(
                user_id=user_id,
                application_id=application_id,
                file_url=storage_path,
                file_name=filename,
                file_size=file_size or len(file_bytes),
                file_type=file_type,
                is_sensitive=is_sensitive,
                category=category,
                criteria=criteria,
                content_hash=file_hash
            )
            repo.add_file(db_file)
            db.commit()
            db.refresh(db_file)
            log_event(logger, "document_upload_committed", user_id=user_id, file_id=db_file.id, storage_path=storage_path)
        except Exception:
            db.rollback()
            if uploaded_new and storage_path:
                try:
                    self.supabase_storage.delete(storage_path)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup storage object after DB failure: {cleanup_error}")
            raise

        # 5. Extract text content via Vision API
        try:
            await self._extract_and_save_evidence_content(
                db=db,
                user_id=user_id,
                file_id=db_file.id,
                title=filename,
                file_bytes=file_bytes,
                application_id=application_id,
                category=category,
                criteria=criteria,
                update_existing=True,
            )
        except Exception as e:
            logger.error(f"Failed to process vision content for {filename}: {e}")
        
        return db_file.id

    async def add_manual_evidence(
        self,
        db: Session,
        user_id: uuid.UUID,
        title: str,
        content: str,
        application_id: uuid.UUID = None,
        category: str = None,
        criteria: str = None
    ) -> uuid.UUID:
        """Adds a manually entered evidence description to user_evidence_content."""
        repo = DocumentRepository(db)
        evidence = UserEvidenceContent(
            user_id=user_id,
            application_id=application_id,
            title=title,
            content=content,
            category=category,
            criteria=criteria,
            type="manual"
        )
        repo.add_evidence(evidence)
        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to create manual evidence: {commit_err}")
            raise
        db.refresh(evidence)
        return evidence.id

    def get_user_files(self, db: Session, user_id: uuid.UUID, application_id: uuid.UUID = None):
        """Retrieves all files uploaded by a specific user from Supabase metadata."""
        repo = DocumentRepository(db)
        return repo.list_files(user_id, application_id)

    def get_user_evidence_content(self, db: Session, user_id: uuid.UUID, application_id: uuid.UUID = None):
        """Retrieves all evidence content (file-based and manual) for a specific user."""
        repo = DocumentRepository(db)
        return repo.list_evidence(user_id, application_id)

    def update_metadata(
        self, 
        db: Session, 
        user_id: uuid.UUID, 
        document_id: uuid.UUID,
        application_id: uuid.UUID = None,
        category: str = None,
        criteria: str = None
    ) -> UserFile:
        """Updates the metadata (category or criteria) for a specific user file."""
        repo = DocumentRepository(db)
        db_file = repo.get_file(user_id, document_id, application_id)
        
        if not db_file:
            return None
            
        if category is not None:
            db_file.category = category
        if criteria is not None:
            db_file.criteria = criteria
        
        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to update file metadata: {commit_err}")
            raise
        db.refresh(db_file)

        # Also update corresponding evidence content metadata
        evidence = repo.get_evidence_for_file(user_id, document_id, evidence_type="file")
        if evidence:
            if category is not None:
                evidence.category = category
            if criteria is not None:
                evidence.criteria = criteria
            try:
                db.commit()
            except Exception as commit_err:
                db.rollback()
                logger.error(f"Failed to update evidence metadata: {commit_err}")
                raise

        return db_file

    def update_manual_evidence(
        self,
        db: Session,
        user_id: uuid.UUID,
        evidence_id: uuid.UUID,
        title: str = None,
        content: str = None,
        category: str = None,
        criteria: str = None
    ) -> UserEvidenceContent:
        """Updates a manually entered evidence description."""
        repo = DocumentRepository(db)
        evidence = repo.get_evidence(user_id, evidence_id, evidence_type="manual")

        if not evidence:
            return None

        if title is not None:
            evidence.title = title
        if content is not None:
            evidence.content = content
        if category is not None:
            evidence.category = category
        if criteria is not None:
            evidence.criteria = criteria

        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to update manual evidence: {commit_err}")
            raise
        db.refresh(evidence)
        return evidence

    def delete_document(self, db: Session, user_id: uuid.UUID, document_id: uuid.UUID, application_id: uuid.UUID = None) -> bool:
        """Deletes a document from the database and storage, and cleans up exhibit items."""
        repo = DocumentRepository(db)
        db_file = repo.get_file(user_id, document_id, application_id)
        
        if not db_file:
            return False
            
        # 1. Delete from storage
        try:
            if db_file.file_url:
                self.supabase_storage.delete(db_file.file_url)
        except Exception as e:
            logger.warning(f"Failed to delete storage object: {e}")

        # 2. Delete associated exhibit items
        exhibit_repo = ExhibitRepository(db)
        exhibit_repo.delete_items_for_file(document_id)

        # 3. Delete from Database (CASCADE will handle user_evidence_content)
        repo.delete_file(db_file)
        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to delete document metadata: {commit_err}")
            raise
        return True

    def delete_manual_evidence(self, db: Session, user_id: uuid.UUID, evidence_id: uuid.UUID) -> bool:
        """Deletes a manual evidence entry."""
        repo = DocumentRepository(db)
        evidence = repo.get_evidence(user_id, evidence_id, evidence_type="manual")

        if not evidence:
            return False

        repo.delete_evidence(evidence)
        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to delete manual evidence: {commit_err}")
            raise
        return True

    async def process_supabase_document_ocr(
        self,
        db: Session,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
        application_id: uuid.UUID = None,
        bucket_name: str = None,
        force_reextract: bool = False,
    ) -> uuid.UUID | None:
        """
        For files already stored in Supabase Storage:
        1) download bytes from storage
        2) run Google Vision OCR
        3) create/update file-based user_evidence_content
        """
        repo = DocumentRepository(db)
        db_file = repo.get_file(user_id, document_id, application_id)

        if not db_file:
            return None

        if not force_reextract:
            existing_evidence = repo.get_evidence_for_file(user_id, document_id, evidence_type="file")
            if existing_evidence:
                return existing_evidence.id

        file_url = db_file.file_url or ""
        if not file_url:
            raise ValueError("Document has no storage path")

        file_bytes = self._download_supabase_bytes(file_url, bucket_name=bucket_name)
        return await self._extract_and_save_evidence_content(
            db=db,
            user_id=user_id,
            file_id=db_file.id,
            title=db_file.file_name,
            file_bytes=file_bytes,
            application_id=db_file.application_id,
            category=db_file.category,
            criteria=db_file.criteria,
            update_existing=True,
        )

    def get_file_bytes(self, db: Session, user_id: uuid.UUID, file_id: uuid.UUID) -> tuple[bytes, str]:
        """
        Returns (file_bytes, file_name) for a user file. Uses Supabase storage.
        """
        repo = DocumentRepository(db)
        db_file = repo.get_file(user_id, file_id)
        if not db_file:
            raise ValueError(f"File {file_id} not found for user")
        file_path = db_file.file_url or ""
        if not file_path:
            raise ValueError("File has no storage path")
        file_bytes = self._download_supabase_bytes(file_path)
        return file_bytes, db_file.file_name or "document"


document_service = DocumentService()
