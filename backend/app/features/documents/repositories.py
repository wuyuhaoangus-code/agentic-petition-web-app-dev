from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.features.documents.models import UserEvidenceContent, UserFile, Citation


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_file_by_hash(self, user_id: uuid.UUID, content_hash: str) -> Optional[UserFile]:
        return (
            self.db.query(UserFile)
            .filter(UserFile.user_id == user_id, UserFile.content_hash == content_hash)
            .first()
        )

    def get_file_by_id(self, file_id: uuid.UUID) -> Optional[UserFile]:
        return self.db.query(UserFile).filter(UserFile.id == file_id).first()

    def get_file(self, user_id: uuid.UUID, file_id: uuid.UUID, application_id: uuid.UUID | None = None) -> Optional[UserFile]:
        query = self.db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user_id)
        if application_id:
            query = query.filter(UserFile.application_id == application_id)
        return query.first()

    def list_files(self, user_id: uuid.UUID, application_id: uuid.UUID | None = None) -> List[UserFile]:
        query = self.db.query(UserFile).filter(UserFile.user_id == user_id)
        if application_id:
            query = query.filter(UserFile.application_id == application_id)
        return query.order_by(UserFile.created_at.desc()).all()

    def add_file(self, file: UserFile) -> None:
        self.db.add(file)

    def delete_file(self, file: UserFile) -> None:
        self.db.delete(file)

    def list_evidence(self, user_id: uuid.UUID, application_id: uuid.UUID | None = None) -> List[UserEvidenceContent]:
        query = self.db.query(UserEvidenceContent).filter(UserEvidenceContent.user_id == user_id)
        if application_id:
            query = query.filter(UserEvidenceContent.application_id == application_id)
        return query.order_by(UserEvidenceContent.created_at.desc()).all()

    def get_evidence_for_file(self, user_id: uuid.UUID, file_id: uuid.UUID, evidence_type: str = "file") -> Optional[UserEvidenceContent]:
        return (
            self.db.query(UserEvidenceContent)
            .filter(
                UserEvidenceContent.user_id == user_id,
                UserEvidenceContent.file_id == file_id,
                UserEvidenceContent.type == evidence_type,
            )
            .first()
        )

    def get_evidence_for_file_any(self, file_id: uuid.UUID, evidence_type: str = "file") -> Optional[UserEvidenceContent]:
        return (
            self.db.query(UserEvidenceContent)
            .filter(UserEvidenceContent.file_id == file_id, UserEvidenceContent.type == evidence_type)
            .first()
        )

    def get_evidence_by_id(self, evidence_id: uuid.UUID) -> Optional[UserEvidenceContent]:
        return self.db.query(UserEvidenceContent).filter(UserEvidenceContent.id == evidence_id).first()

    def get_evidence(self, user_id: uuid.UUID, evidence_id: uuid.UUID, evidence_type: str | None = None) -> Optional[UserEvidenceContent]:
        query = self.db.query(UserEvidenceContent).filter(
            UserEvidenceContent.id == evidence_id,
            UserEvidenceContent.user_id == user_id,
        )
        if evidence_type:
            query = query.filter(UserEvidenceContent.type == evidence_type)
        return query.first()

    def add_evidence(self, evidence: UserEvidenceContent) -> None:
        self.db.add(evidence)

    def delete_evidence(self, evidence: UserEvidenceContent) -> None:
        self.db.delete(evidence)

    def files_query(self):
        return self.db.query(UserFile)

    def evidence_query(self):
        return self.db.query(UserEvidenceContent)


class CitationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_exhibit(self, exhibit_id: uuid.UUID) -> List[Citation]:
        return (
            self.db.query(Citation)
            .filter(Citation.exhibit_id == exhibit_id)
            .order_by(Citation.id)
            .all()
        )

    def delete_for_exhibit(self, exhibit_id: uuid.UUID) -> None:
        self.db.query(Citation).filter(Citation.exhibit_id == exhibit_id).delete()

    def add(self, citation: Citation) -> None:
        self.db.add(citation)
