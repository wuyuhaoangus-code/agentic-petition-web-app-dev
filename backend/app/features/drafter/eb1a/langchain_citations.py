from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.features.documents.models import Citation
from app.features.documents.repositories import CitationRepository
from app.features.petitions.repositories import ExhibitRepository
from app.features.drafter.eb1a.langchain_grounding import resolve_organic_url

logger = logging.getLogger(__name__)


async def save_citations(db: Session, exhibit_id, response: Any) -> None:
    """Extracts chunks from LangChain response and saves to citations table."""
    exhibit_repo = ExhibitRepository(db)
    exhibit = exhibit_repo.get_by_id_any(exhibit_id)
    if not exhibit or not exhibit.application_id:
        return

    metadata_dict = getattr(response, "response_metadata", {})
    metadata = metadata_dict.get("prompt_feedback", {}).get("grounding_metadata") or \
        metadata_dict.get("grounding_metadata")

    if not metadata:
        return

    chunks = metadata.get("grounding_chunks") or metadata.get("groundingChunks", [])
    if not chunks:
        return

    citation_repo = CitationRepository(db)
    citation_repo.delete_for_exhibit(exhibit_id)

    # Limit to 4 sources as per award_drafter logic
    for i, chunk in enumerate(chunks[:4]):
        web = chunk.get("web", {})
        if not web or not web.get("uri"):
            continue

        organic_url = resolve_organic_url(web.get("uri"))
        title = web.get("title") or f"Official Source {i+1}"

        citation_repo.add(Citation(
            application_id=exhibit.application_id,
            exhibit_id=exhibit_id,
            url=organic_url,
            title=title,
            snippet=f"[{i+1}]"
        ))
    try:
        db.commit()
    except Exception as commit_err:
        db.rollback()
        logger.error(f"Failed to persist citations: {commit_err}")
        raise
