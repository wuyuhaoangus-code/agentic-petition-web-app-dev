from __future__ import annotations

import uuid
from typing import Iterable, List, Optional, Set

from sqlalchemy.orm import Session

from app.features.documents.models import (
    PetitionRun,
    UserCriteriaDraft,
    UserExhibit,
    UserExhibitItem,
    UserPetitionDraft,
    UserPetitionDocument,
)


class ExhibitRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user(self, user_id: uuid.UUID, application_id: uuid.UUID | None = None) -> List[UserExhibit]:
        query = self.db.query(UserExhibit).filter(UserExhibit.user_id == user_id)
        if application_id:
            query = query.filter(UserExhibit.application_id == application_id)
        return query.order_by(UserExhibit.created_at.desc()).all()

    def get_latest_for_user(self, user_id: uuid.UUID, application_id: uuid.UUID | None = None) -> Optional[UserExhibit]:
        query = self.db.query(UserExhibit).filter(UserExhibit.user_id == user_id)
        if application_id:
            query = query.filter(UserExhibit.application_id == application_id)
        return query.order_by(UserExhibit.created_at.desc()).first()

    def get_by_run(self, user_id: uuid.UUID, run_id: uuid.UUID) -> List[UserExhibit]:
        return (
            self.db.query(UserExhibit)
            .filter(UserExhibit.user_id == user_id, UserExhibit.run_id == run_id)
            .order_by(UserExhibit.exhibit_number)
            .all()
        )

    def get_by_run_and_criteria(self, user_id: uuid.UUID, run_id: uuid.UUID, criteria_id: str) -> List[UserExhibit]:
        return (
            self.db.query(UserExhibit)
            .filter(
                UserExhibit.user_id == user_id,
                UserExhibit.run_id == run_id,
                UserExhibit.criteria_id == criteria_id,
            )
            .order_by(UserExhibit.exhibit_number)
            .all()
        )

    def distinct_criteria_for_run(self, user_id: uuid.UUID, run_id: uuid.UUID) -> List[str]:
        rows = (
            self.db.query(UserExhibit.criteria_id)
            .filter(UserExhibit.user_id == user_id, UserExhibit.run_id == run_id)
            .distinct()
            .all()
        )
        return [r[0] for r in rows]

    def has_personal_info(self, user_id: uuid.UUID, run_ids: Iterable[uuid.UUID]) -> bool:
        return (
            self.db.query(UserExhibit)
            .filter(
                UserExhibit.user_id == user_id,
                UserExhibit.run_id.in_(list(run_ids)),
                UserExhibit.criteria_id == "personal_info",
            )
            .first()
            is not None
        )

    def get_items_for_exhibit(self, exhibit_id: uuid.UUID) -> List[UserExhibitItem]:
        return (
            self.db.query(UserExhibitItem)
            .filter(UserExhibitItem.exhibit_id == exhibit_id)
            .all()
        )

    def get_items_for_exhibit_ordered(self, exhibit_id: uuid.UUID) -> List[UserExhibitItem]:
        return (
            self.db.query(UserExhibitItem)
            .filter(UserExhibitItem.exhibit_id == exhibit_id)
            .order_by(UserExhibitItem.item_suffix)
            .all()
        )

    def get_last_run_exhibit(self, user_id: uuid.UUID, run_id: uuid.UUID) -> Optional[UserExhibit]:
        return (
            self.db.query(UserExhibit)
            .filter(UserExhibit.user_id == user_id, UserExhibit.run_id == run_id)
            .order_by(UserExhibit.created_at.desc())
            .first()
        )

    def get_by_id(self, exhibit_id: uuid.UUID, user_id: uuid.UUID) -> Optional[UserExhibit]:
        return (
            self.db.query(UserExhibit)
            .filter(UserExhibit.id == exhibit_id, UserExhibit.user_id == user_id)
            .first()
        )

    def get_by_id_any(self, exhibit_id: uuid.UUID) -> Optional[UserExhibit]:
        return self.db.query(UserExhibit).filter(UserExhibit.id == exhibit_id).first()

    def get_latest_by_criteria(self, user_id: uuid.UUID, criteria_id: str) -> Optional[UserExhibit]:
        return (
            self.db.query(UserExhibit)
            .filter(UserExhibit.user_id == user_id, UserExhibit.criteria_id == criteria_id)
            .order_by(UserExhibit.created_at.desc())
            .first()
        )

    def get_latest_by_number(self, user_id: uuid.UUID, exhibit_number: int) -> Optional[UserExhibit]:
        return (
            self.db.query(UserExhibit)
            .filter(UserExhibit.user_id == user_id, UserExhibit.exhibit_number == exhibit_number)
            .order_by(UserExhibit.created_at.desc())
            .first()
        )

    def list_for_criteria(
        self,
        user_id: uuid.UUID,
        criteria_id: str,
        application_id: uuid.UUID | None = None,
        run_id: uuid.UUID | None = None,
    ) -> List[UserExhibit]:
        query = self.db.query(UserExhibit).filter(
            UserExhibit.user_id == user_id,
            UserExhibit.criteria_id == criteria_id,
        )
        if application_id:
            query = query.filter(UserExhibit.application_id == application_id)
        if run_id:
            query = query.filter(UserExhibit.run_id == run_id)
        return query.all()

    def delete_items_for_exhibit(self, exhibit_id: uuid.UUID) -> None:
        self.db.query(UserExhibitItem).filter(UserExhibitItem.exhibit_id == exhibit_id).delete()

    def delete_items_for_file(self, file_id: uuid.UUID) -> None:
        self.db.query(UserExhibitItem).filter(UserExhibitItem.file_id == file_id).delete()

    def delete_exhibit(self, exhibit: UserExhibit) -> None:
        self.db.delete(exhibit)


class PetitionDraftRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_intro(self, run_id: uuid.UUID) -> Optional[UserPetitionDraft]:
        return (
            self.db.query(UserPetitionDraft)
            .filter(UserPetitionDraft.run_id == run_id, UserPetitionDraft.section == "intro")
            .first()
        )

    def get_conclusion(self, run_id: uuid.UUID) -> Optional[UserPetitionDraft]:
        return (
            self.db.query(UserPetitionDraft)
            .filter(UserPetitionDraft.run_id == run_id, UserPetitionDraft.section == "conclusion")
            .order_by(UserPetitionDraft.created_at.desc())
            .first()
        )

    def upsert_intro(self, draft: UserPetitionDraft) -> None:
        self.db.add(draft)

    def upsert_conclusion(self, draft: UserPetitionDraft) -> None:
        self.db.add(draft)


class CriteriaDraftRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_latest_for_user_criteria(self, user_id: uuid.UUID, criteria_id: str) -> Optional[UserCriteriaDraft]:
        return (
            self.db.query(UserCriteriaDraft)
            .filter(UserCriteriaDraft.user_id == user_id, UserCriteriaDraft.criteria_id == criteria_id)
            .order_by(UserCriteriaDraft.created_at.desc())
            .first()
        )

    def get_by_run_and_criteria(self, run_id: uuid.UUID, criteria_id: str) -> Optional[UserCriteriaDraft]:
        return (
            self.db.query(UserCriteriaDraft)
            .filter(UserCriteriaDraft.run_id == run_id, UserCriteriaDraft.criteria_id == criteria_id)
            .first()
        )

    def list_by_runs(self, user_id: uuid.UUID, run_ids: List[uuid.UUID]) -> List[UserCriteriaDraft]:
        if not run_ids:
            return []
        return (
            self.db.query(UserCriteriaDraft)
            .filter(UserCriteriaDraft.user_id == user_id, UserCriteriaDraft.run_id.in_(run_ids))
            .order_by(UserCriteriaDraft.created_at.asc())
            .all()
        )

    def add(self, draft: UserCriteriaDraft) -> None:
        self.db.add(draft)


class PetitionDocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: uuid.UUID, application_id: uuid.UUID | None = None) -> List[UserPetitionDocument]:
        query = self.db.query(UserPetitionDocument).filter(UserPetitionDocument.user_id == user_id)
        if application_id is not None:
            query = query.filter(UserPetitionDocument.application_id == application_id)
        return query.order_by(UserPetitionDocument.created_at.asc()).all()

    def get_petition(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Optional[UserPetitionDocument]:
        return (
            self.db.query(UserPetitionDocument)
            .filter(
                UserPetitionDocument.id == document_id,
                UserPetitionDocument.user_id == user_id,
                UserPetitionDocument.document_type == "petition",
            )
            .first()
        )

    def get_by_id(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Optional[UserPetitionDocument]:
        return (
            self.db.query(UserPetitionDocument)
            .filter(UserPetitionDocument.id == document_id, UserPetitionDocument.user_id == user_id)
            .first()
        )

    def list_cover_letters_for_run(self, run_id: uuid.UUID, user_id: uuid.UUID) -> Optional[UserPetitionDocument]:
        return (
            self.db.query(UserPetitionDocument)
            .filter(
                UserPetitionDocument.run_id == run_id,
                UserPetitionDocument.user_id == user_id,
                UserPetitionDocument.document_type == "cover_letter",
            )
            .first()
        )

    def add(self, doc: UserPetitionDocument) -> None:
        self.db.add(doc)

    def distinct_run_ids_for_user(self, user_id: uuid.UUID) -> Set[uuid.UUID]:
        rows = (
            self.db.query(UserPetitionDocument.run_id)
            .filter(UserPetitionDocument.user_id == user_id)
            .distinct()
            .all()
        )
        return {r[0] for r in rows}


class PetitionRunRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, run_id: uuid.UUID, user_id: uuid.UUID) -> Optional[PetitionRun]:
        return (
            self.db.query(PetitionRun)
            .filter(PetitionRun.id == run_id, PetitionRun.user_id == user_id)
            .first()
        )

    def list_by_status(self, user_id: uuid.UUID, statuses: List[str], application_id: uuid.UUID | None = None) -> List[PetitionRun]:
        query = self.db.query(PetitionRun).filter(PetitionRun.user_id == user_id, PetitionRun.status.in_(statuses))
        if application_id is not None:
            query = query.filter(PetitionRun.application_id == application_id)
        return query.order_by(PetitionRun.created_at.desc()).all()
