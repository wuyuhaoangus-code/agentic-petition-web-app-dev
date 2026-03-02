from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.features.documents.models import UserEvidenceContent
from app.features.documents.repositories import DocumentRepository
from app.features.petitions.repositories import ExhibitRepository
from app.features.drafter.eb1a.langchain_utils import normalize_criteria_id


async def get_user_context(db: Session, user_id: str) -> str:
    """
    Retrieves basic petitioner context (Resume, Bio, etc.) from content tagged with the 'basicInfo' category.
    """
    repo = DocumentRepository(db)
    basics = repo.evidence_query().filter(
        UserEvidenceContent.user_id == user_id,
        UserEvidenceContent.category == "basicInfo"
    ).all()

    if not basics:
        basics = repo.evidence_query().filter(
            UserEvidenceContent.user_id == user_id,
            or_(
                UserEvidenceContent.category == "others",
                UserEvidenceContent.category.is_(None)
            ),
            or_(
                UserEvidenceContent.title.ilike("%resume%"),
                UserEvidenceContent.title.ilike("%cv%"),
                UserEvidenceContent.title.ilike("%bio%")
            )
        ).all()

    if not basics:
        return "EB-1A Petitioner"

    return "\n".join([f"[{b.title}]: {b.content[:3000]}" for b in basics])


def extract_user_criteria(db: Session, user_id: str, run_id: Optional[uuid.UUID] = None) -> List[str]:
    """Collect criteria IDs that actually have confirmed exhibits, ordered by EB-1A standard."""
    from app.features.documents.document_builder import CRITERIA_INFO

    criteria_set = set()
    exhibit_repo = ExhibitRepository(db)
    target_run_id = run_id
    if not target_run_id:
        latest_exhibit = exhibit_repo.get_latest_for_user(user_id)
        target_run_id = latest_exhibit.run_id if latest_exhibit and latest_exhibit.run_id else None

    if target_run_id:
        criteria_ids = exhibit_repo.distinct_criteria_for_run(user_id, target_run_id)
        for criteria_id in criteria_ids:
            if criteria_id:
                criteria_set.add(normalize_criteria_id(criteria_id))

    standard_order = list(CRITERIA_INFO.keys())
    standard_order.extend(["recommendation", "future_work"])
    return sorted(criteria_set, key=lambda x: standard_order.index(x) if x in standard_order else 999)
