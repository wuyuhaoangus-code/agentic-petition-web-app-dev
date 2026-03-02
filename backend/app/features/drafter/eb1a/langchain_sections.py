from __future__ import annotations

import logging
import re
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import or_
from langchain_core.prompts import ChatPromptTemplate

from app.features.documents.models import UserEvidenceContent
from app.features.documents.repositories import DocumentRepository
from app.features.petitions.repositories import ExhibitRepository
from app.features.drafter.eb1a.langchain_context import get_user_context
from app.features.drafter.eb1a.langchain_text import coerce_llm_text
from app.features.drafter.eb1a.langchain_grounding import apply_grounding
from app.features.drafter.eb1a.langchain_utils import get_last_name, normalize_criteria_id
from app.features.drafter.eb1a.langchain_citations import save_citations

logger = logging.getLogger(__name__)


async def draft_section(
    *,
    db: Session,
    user_id,
    exhibit_id,
    user_name: str,
    precedent_context: str,
    llm,
    prompt_registry,
) -> str:
    exhibit_repo = ExhibitRepository(db)
    exhibit = exhibit_repo.get_by_id(exhibit_id, user_id)
    if not exhibit:
        logger.error(f"Exhibit {exhibit_id} not found")
        raise Exception("Exhibit not found")

    field_context = await get_user_context(db, user_id)

    profile = None
    try:
        from app.features.users.repositories import ProfileRepository
        profile = ProfileRepository(db).get_by_id(user_id)
    except Exception:
        profile = None

    user_field = profile.field if profile and profile.field else field_context[:300]
    user_occupation = profile.occupation if profile and profile.occupation else "Petitioner"
    user_name = profile.full_name if profile and profile.full_name else user_name

    items = exhibit_repo.get_items_for_exhibit(exhibit_id)
    logger.info(f"Found {len(items)} items for exhibit {exhibit_id}")

    item_map = {str(i.file_id or i.content_id): i.item_suffix for i in items}

    repo = DocumentRepository(db)
    content_entries = repo.evidence_query().filter(
        or_(
            UserEvidenceContent.file_id.in_([i.file_id for i in items if i.file_id]) if any(i.file_id for i in items) else False,
            UserEvidenceContent.id.in_([i.content_id for i in items if i.content_id]) if any(i.content_id for i in items) else False
        )
    ).all()
    logger.info(f"Found {len(content_entries)} content entries for exhibit {exhibit_id}")

    exhibit_content = "\n\n".join([
        f"[EXHIBIT {exhibit.exhibit_number}({item_map.get(str(c.file_id or c.id), '?')}) - {c.title}]: {c.content[:4000]}"
        for c in content_entries
    ])

    if not exhibit_content:
        logger.warning(f"No content found for exhibit {exhibit_id}. Drafting might be poor quality.")

    criteria_key = normalize_criteria_id(exhibit.criteria_id or "awards")
    config = prompt_registry.get(criteria_key, prompt_registry.get("awards"))
    if not config:
        logger.error(f"No prompt configuration found for criteria: {criteria_key}")
        raise Exception(f"No prompt configuration found for criteria: {criteria_key}")

    prompt = ChatPromptTemplate.from_messages([
        ("system", config["persona"]),
        ("human", config["exhibit_task"])
    ])

    logger.info(f"Invoking LLM for exhibit {exhibit.exhibit_number} (criteria: {criteria_key})")
    chain = prompt | llm
    response = await chain.ainvoke({
        "user_name": user_name,
        "last_name": profile.last_name if profile and profile.last_name else get_last_name(user_name),
        "exhibit_title": exhibit.title,
        "exhibit_number": exhibit.exhibit_number,
        "field_context": field_context,
        "exhibit_content": exhibit_content,
        "precedent_context": precedent_context or "No specific case law found; rely on standard regulatory criteria.",
        "occupation": user_occupation
    })
    logger.info(f"LLM response received for exhibit {exhibit.exhibit_number}")

    raw_text = coerce_llm_text(response.content)
    clean_text = apply_grounding(raw_text, response)
    await save_citations(db, exhibit_id, response)

    clean_text = re.sub(r"(?i)^EXHIBIT TITLE:.*?\n", "", clean_text).strip()
    clean_text = clean_text.replace("```", "").replace("**", "")

    if not clean_text:
        logger.error(f"Draft content for exhibit {exhibit_id} is empty after cleanup!")
        clean_text = raw_text.strip()

    exhibit.draft_content = clean_text
    try:
        db.commit()
    except Exception as commit_err:
        db.rollback()
        logger.error(f"Failed to persist draft content for exhibit {exhibit_id}: {commit_err}")
        raise

    logger.info(f"Draft content saved for exhibit {exhibit_id} (length: {len(clean_text)})")
    return clean_text
