from __future__ import annotations

import logging
from typing import List

from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.orm import Session

from app.features.documents.models import UserExhibit
from app.features.drafter.eb1a.langchain_context import get_user_context
from app.features.drafter.eb1a.langchain_text import coerce_llm_text
from app.features.drafter.eb1a.langchain_utils import get_last_name, normalize_criteria_id

logger = logging.getLogger(__name__)


async def draft_exhibit_conclusion(
    *,
    db: Session,
    user_id,
    exhibits: List[UserExhibit],
    user_name: str,
    llm,
    prompt_registry,
) -> str:
    logger.info(f"Drafting conclusion for {len(exhibits)} exhibits")
    field_context = await get_user_context(db, user_id)
    summaries = "\n\n".join([f"EXHIBIT {e.exhibit_number}: {e.draft_content[:500]}" for e in exhibits if e.draft_content])

    criteria_key = normalize_criteria_id(exhibits[0].criteria_id if exhibits else "awards")
    config = prompt_registry.get(criteria_key, prompt_registry.get("awards"))
    if not config:
        logger.error(f"No config found for criteria_key: {criteria_key}")
        return ""

    prompt = ChatPromptTemplate.from_messages([
        ("system", config["persona"]),
        ("human", config["conclusion_text"])
    ])

    chain = prompt | llm
    logger.info(f"Invoking LLM for conclusion (criteria: {criteria_key})")
    response = await chain.ainvoke({
        "user_name": user_name,
        "last_name": get_last_name(user_name),
        "field_context": field_context,
        "exhibit_summaries": summaries
    })
    conclusion_text = coerce_llm_text(response.content).strip().replace("```", "")
    logger.info(f"Conclusion drafted (len: {len(conclusion_text)})")
    return conclusion_text


async def draft_exhibit_intro(
    *,
    db: Session,
    user_id,
    exhibits: List[UserExhibit],
    user_name: str,
    llm,
    prompt_registry,
) -> str:
    logger.info(f"Drafting intro for {len(exhibits)} exhibits")
    field_context = await get_user_context(db, user_id)
    ex_list = ", ".join([f"EXHIBIT {e.exhibit_number}" for e in exhibits])

    criteria_key = normalize_criteria_id(exhibits[0].criteria_id if exhibits else "awards")
    config = prompt_registry.get(criteria_key, prompt_registry.get("awards"))
    if not config:
        logger.error(f"No config found for criteria_key: {criteria_key}")
        return ""

    prompt = ChatPromptTemplate.from_messages([
        ("system", config["persona"]),
        ("human", config["intro_task"])
    ])

    chain = prompt | llm
    logger.info(f"Invoking LLM for intro (criteria: {criteria_key})")
    response = await chain.ainvoke({
        "user_name": user_name,
        "last_name": get_last_name(user_name),
        "field_context": field_context,
        "exhibit_list": ex_list
    })
    text = coerce_llm_text(response.content).strip().replace("```", "")
    logger.info(f"Intro drafted (len: {len(text)})")
    return text
