from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.features.documents.models import UserEvidenceContent, UserFile
from app.features.documents.repositories import DocumentRepository
from app.features.documents.document_builder import CRITERIA_INFO
from app.features.petitions.repositories import ExhibitRepository, CriteriaDraftRepository, PetitionDraftRepository
from app.features.drafter.eb1a.langchain_context import get_user_context, extract_user_criteria
from app.features.drafter.eb1a.langchain_utils import (
    clean_reg_text,
    format_possessive_name,
    get_last_name,
    normalize_criteria_id,
)
from app.features.drafter.eb1a.langchain_schemas import PetitionIntro, PetitionConclusion

logger = logging.getLogger(__name__)


def _criteria_contains(column, criteria_id: str):
    return cast(column, String).ilike(f"%{criteria_id}%")


def _get_ordinal_date_string(dt: datetime) -> str:
    day = dt.day
    if 4 <= day <= 20 or 24 <= day <= 30:
        suffix = "th"
    else:
        suffix = ["st", "nd", "rd"][day % 10 - 1]
    return dt.strftime(f"%B {day}{suffix}, %Y")


async def draft_petition_intro(
    *,
    db: Session,
    user_id,
    user_name: str,
    llm,
    profile,
    prompt_registry,
) -> str:
    logger.info(f"Drafting petition intro for user {user_id}")

    config = prompt_registry.get("petition_intro")
    if not config:
        logger.error("Missing petition_intro prompt configuration.")
        raise Exception("Missing petition_intro prompt configuration.")

    field_context = await get_user_context(db, user_id)

    user_field = profile.field if profile and profile.field else "the field of endeavor"
    user_occupation = profile.occupation if profile and profile.occupation else "petitioner"
    user_name = profile.full_name if profile and profile.full_name else user_name
    last_name = profile.last_name if profile and profile.last_name else get_last_name(user_name)
    first_name = profile.first_name if profile and profile.first_name else ""
    display_name = user_name if user_name else "The Petitioner"

    personal_categories = [
        "basicInfo",
        "Personal Information",
        "resumeCV",
        "graduation_certificates",
        "employment_verification",
        "other_personalinfo",
    ]
    repo = DocumentRepository(db)
    personal_files = repo.files_query().filter(
        UserFile.user_id == user_id,
        or_(
            UserFile.category.in_(personal_categories),
            _criteria_contains(UserFile.criteria, "personal_info"),
        )
    ).all()
    personal_content = repo.evidence_query().filter(
        UserEvidenceContent.user_id == user_id,
        or_(
            UserEvidenceContent.category.in_(personal_categories),
            _criteria_contains(UserEvidenceContent.criteria, "personal_info"),
        )
    ).all()

    logger.info(f"Found {len(personal_files)} personal files and {len(personal_content)} personal content entries")

    if not personal_content and not personal_files:
        logger.info("No personal info found with category tags, trying fallback search")
        personal_content = repo.evidence_query().filter(
            UserEvidenceContent.user_id == user_id,
            or_(
                UserEvidenceContent.category == "others",
                UserEvidenceContent.category.is_(None)
            ),
            or_(
                UserEvidenceContent.title.ilike("%resume%"),
                UserEvidenceContent.title.ilike("%cv%"),
                UserEvidenceContent.title.ilike("%bio%"),
                UserEvidenceContent.title.ilike("%personal%")
            )
        ).all()
        logger.info(f"Fallback search found {len(personal_content)} content entries")

    # Ensure OCR content linked to selected personal files is included even if its own
    # category/criteria tags are sparse or legacy.
    personal_file_ids = {f.id for f in personal_files}
    if personal_file_ids:
        linked_file_content = repo.evidence_query().filter(
            UserEvidenceContent.user_id == user_id,
            UserEvidenceContent.file_id.in_(list(personal_file_ids))
        ).all()
        seen_content_ids = {c.id for c in personal_content}
        for content in linked_file_content:
            if content.id not in seen_content_ids:
                personal_content.append(content)

    personal_info_context = []
    for content in personal_content:
        if content.content:
            content_text = content.content[:3000] if len(content.content) > 3000 else content.content
            personal_info_context.append(f"[{content.title or 'Untitled'}]: {content_text}")

    for file in personal_files:
        file_content = repo.get_evidence_for_file_any(file.id)
        if file_content and file_content.content:
            content_text = file_content.content[:3000] if len(file_content.content) > 3000 else file_content.content
            personal_info_context.append(f"[{file_content.title or file.file_name}]: {content_text}")
        elif not file_content:
            personal_info_context.append(f"[{file.file_name}]: Personal document uploaded")

    personal_info_text = "\n\n".join(personal_info_context) if personal_info_context else field_context
    logger.info(f"Built personal info context with {len(personal_info_context)} items, total length: {len(personal_info_text)}")

    if not personal_info_text or len(personal_info_text.strip()) < 10:
        logger.warning(f"No substantial personal information found for user {user_id}. Using minimal context.")
        personal_info_text = f"EB-1A Petitioner: {display_name}, Field: {user_field}, Occupation: {user_occupation}"

    all_criteria_ids = extract_user_criteria(db, user_id)
    criteria_ids = [c for c in all_criteria_ids if c not in ["recommendation", "future_work", "personal_info"]]
    criteria_list = ", ".join(
        CRITERIA_INFO.get(normalize_criteria_id(c), {}).get("header", c.replace("_", " ").title())
        for c in criteria_ids
    ) if criteria_ids else "the criteria set forth below"

    parser = PydanticOutputParser(pydantic_object=PetitionIntro)
    prompt = ChatPromptTemplate.from_messages([
        ("system", config.get("system_prompt", "")),
        ("human", config.get("human_prompt", ""))
    ])

    logger.info(f"Invoking LLM for petition intro (user: {display_name}, criteria: {criteria_list})")
    chain = prompt | llm
    response = await chain.ainvoke({
        "field_context": personal_info_text,
        "display_name": display_name,
        "user_field": user_field,
        "user_occupation": user_occupation,
        "criteria_list": criteria_list,
        "format_instructions": parser.get_format_instructions()
    })
    logger.info(f"LLM response received for petition intro (type: {type(response.content)})")
    response_preview = str(response.content)[:500] if response.content else "None"
    logger.info(f"LLM response preview: {response_preview}...")

    parsed = None
    content_to_parse = response.content
    if isinstance(response.content, list):
        logger.info(f"Response is a list with {len(response.content)} items, extracting first item")
        if response.content:
            content_to_parse = response.content[0]
        else:
            logger.error("Response is an empty list")
            raise Exception("LLM returned empty list response")

    if isinstance(content_to_parse, dict):
        logger.info("Response is a dict, parsing directly")
        parsed = PetitionIntro(
            opening_paragraph=str(content_to_parse.get("opening_paragraph", "")).strip(),
            qualification_paragraphs=[
                str(p).strip()
                for p in content_to_parse.get("qualification_paragraphs", [])
                if str(p).strip()
            ]
        )
    elif isinstance(content_to_parse, str):
        logger.info("Response is a string, attempting JSON parse")
        try:
            content_str = content_to_parse.strip()
            if "```json" in content_str:
                start = content_str.find("```json") + 7
                end = content_str.find("```", start)
                if end > start:
                    content_str = content_str[start:end].strip()
            elif "```" in content_str:
                start = content_str.find("```") + 3
                end = content_str.find("```", start)
                if end > start:
                    content_str = content_str[start:end].strip()

            json_data = json.loads(content_str)
            logger.info("Successfully parsed JSON from string")
            parsed = PetitionIntro(
                opening_paragraph=str(json_data.get("opening_paragraph", "")).strip(),
                qualification_paragraphs=[
                    str(p).strip()
                    for p in json_data.get("qualification_paragraphs", [])
                    if str(p).strip()
                ]
            )
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error: {e}")
            logger.warning(f"Response content (first 1000 chars): {content_to_parse[:1000] if content_to_parse else 'None'}")
            logger.info("Attempting regex-based extraction as fallback")
            try:
                opening_match = re.search(r'"opening_paragraph"\s*:\s*"([^"]+)"', content_to_parse, re.DOTALL)
                qual_matches = re.findall(r'"qualification_paragraphs"\s*:\s*\[(.*?)\]', content_to_parse, re.DOTALL)
                opening = opening_match.group(1) if opening_match else ""
                qualifications = []
                if qual_matches:
                    para_pattern = r'"([^"]+)"'
                    qualifications = re.findall(para_pattern, qual_matches[0])
                if opening or qualifications:
                    parsed = PetitionIntro(
                        opening_paragraph=opening.replace('\\n', '\n').replace('\\"', '"'),
                        qualification_paragraphs=[q.replace('\\n', '\n').replace('\\"', '"') for q in qualifications]
                    )
                    logger.info("Successfully extracted using regex fallback")
            except Exception as regex_error:
                logger.error(f"Regex extraction also failed: {regex_error}")
                parsed = None

    if not parsed:
        logger.error(f"Failed to parse LLM response for petition intro. Response type: {type(response.content)}")
        logger.error(f"Content to parse type: {type(content_to_parse)}")
        logger.error(f"Response content (first 2000 chars): {str(response.content)[:2000] if response.content else 'None'}")
        raise Exception("Failed to parse petition intro response from LLM")

    # Enforce prompt contract: 2-3 qualification paragraphs.
    # Some model responses collapse into a single block; split/repair deterministically.
    repaired_quals = [q.strip() for q in (parsed.qualification_paragraphs or []) if q and q.strip()]
    if len(repaired_quals) == 1:
        only = repaired_quals[0]
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', only) if s and s.strip()]
        if len(sentences) >= 4:
            mid = max(2, len(sentences) // 2)
            repaired_quals = [
                " ".join(sentences[:mid]).strip(),
                " ".join(sentences[mid:]).strip(),
            ]
    if len(repaired_quals) < 2:
        repaired_quals.append(
            f"In addition, {display_name} has developed substantial professional expertise in {user_field} "
            f"through sustained work as a {user_occupation}, with documented evidence tied to the criteria "
            f"addressed in this petition."
        )
    parsed.qualification_paragraphs = repaired_quals[:3]

    sections: List[str] = []
    date_str = _get_ordinal_date_string(datetime.now())
    re_name = f"{last_name.upper()}, {first_name}" if last_name and first_name else display_name
    header_sections = [
        date_str,
        "USCIS",
        "Attn: I-140",
        "P.O. Box 660128",
        "Dallas, TX 75266-0128",
        f"Re:     Immigrant Petition for {re_name}, as Alien of Extraordinary Ability\nPursuant to Section 203(b)(1)(a) of the Immigration and Naturalization Act.",
        "Dear Sir/ Madam:"
    ]
    sections.extend(header_sections)

    if parsed.opening_paragraph:
        sections.append(parsed.opening_paragraph)

    if parsed.qualification_paragraphs:
        possessive_name = format_possessive_name(display_name)
        sections.append(f"INTRODUCTION OF {possessive_name.upper()} QUALIFICATION")
        sections.extend(parsed.qualification_paragraphs)

    exhibit_repo = ExhibitRepository(db)
    exhibit_1 = exhibit_repo.get_latest_by_criteria(user_id, "personal_info")
    if exhibit_1:
        sections.append("<<INSERT_EXHIBIT_1_FROM_DB>>")

    sections.append("LEGAL AUTHORITY")

    legal_authority_tail_template = config.get("legal_authority_tail_template", "")
    if legal_authority_tail_template:
        legal_tail = legal_authority_tail_template.format(
            display_name=display_name,
            user_field=user_field,
            criteria_list=criteria_list
        )
        sections.append(legal_tail)

    criteria_ids = [cid for cid in all_criteria_ids if cid not in ["recommendation", "future_work", "personal_info"]]
    if criteria_ids:
        sections.append("ARGUMENT")
        sections.append(
            f"{display_name} hereby submits evidence to establish and demonstrate the following {len(criteria_ids)} key criteria:"
        )
        criteria_lines = []
        for criteria_id in criteria_ids:
            normalized_criteria_id = normalize_criteria_id(criteria_id)
            info = CRITERIA_INFO.get(normalized_criteria_id, {})
            reg_text = clean_reg_text(info.get("reg_text", ""))
            if reg_text:
                display_name_possessive = format_possessive_name(display_name)
                formatted_text = re.sub(r'\bthe Petitioner[’\']s\b', display_name_possessive, reg_text, flags=re.IGNORECASE)
                formatted_text = re.sub(r'\bthe Petitioner\b', display_name, formatted_text, flags=re.IGNORECASE)
                criteria_lines.append(formatted_text)
            else:
                criteria_lines.append(f"Evidence related to {normalized_criteria_id.replace('_', ' ')}.")
        sections.extend(criteria_lines)
    else:
        sections.append("ARGUMENT")
        sections.append(
            f"{display_name} hereby submits evidence to establish and demonstrate qualifying criteria under 8 C.F.R. §204.5(h)(3)."
        )

    formatted_sections: List[str] = []
    for item in sections:
        if item is None:
            continue
        if isinstance(item, dict):
            logger.warning(f"Found dict in sections, converting to string: {item}")
            formatted_sections.append(str(item).strip())
        elif isinstance(item, str):
            if item.strip():
                cleaned_item = item.strip()
                cleaned_item = re.sub(r'\s+', ' ', cleaned_item)
                formatted_sections.append(cleaned_item)
        else:
            str_item = str(item).strip()
            if str_item:
                formatted_sections.append(str_item)

    formatted_intro = "\n\n".join(formatted_sections)
    logger.info(f"Formatted petition intro with {len(sections)} sections, total length: {len(formatted_intro)}")
    return formatted_intro


async def draft_petition_conclusion(
    *,
    db: Session,
    user_id,
    user_name: str,
    run_ids: Optional[List[uuid.UUID]],
    llm,
    profile,
    prompt_registry,
) -> str:
    logger.info(f"Drafting petition conclusion for user {user_id} with runs: {run_ids}")

    config = prompt_registry.get("petition_conclusion")
    if not config:
        logger.error("Missing petition_conclusion prompt configuration.")
        raise Exception("Missing petition_conclusion prompt configuration.")

    field_context = await get_user_context(db, user_id)

    display_name = profile.full_name if profile and profile.full_name else user_name
    user_field = profile.field if profile and profile.field else "the field of endeavor"
    user_occupation = profile.occupation if profile and profile.occupation else "petitioner"

    if not run_ids:
        exhibit_repo = ExhibitRepository(db)
        latest_exhibit = exhibit_repo.get_latest_for_user(user_id)
        if latest_exhibit and latest_exhibit.run_id:
            run_ids = [latest_exhibit.run_id]
        else:
            run_ids = []

    exhibits = []
    if run_ids:
        exhibit_repo = ExhibitRepository(db)
        exhibits = []
        for run_id in run_ids:
            exhibits.extend(exhibit_repo.get_by_run(user_id, run_id))
        exhibits = [e for e in exhibits if e.criteria_id != "personal_info"]
        exhibits.sort(key=lambda e: e.exhibit_number or 0)

    criteria_drafts = []
    if run_ids:
        criteria_repo = CriteriaDraftRepository(db)
        criteria_drafts = criteria_repo.list_by_runs(user_id, run_ids)

    intro_draft_text = ""
    if run_ids:
        draft_repo = PetitionDraftRepository(db)
        intro_draft = draft_repo.get_intro(run_ids[0])
        if intro_draft and intro_draft.section_content:
            intro_draft_text = intro_draft.section_content[:4000]

    exhibit_digest_lines = []
    for ex in exhibits:
        summary = (ex.summary or "").strip()
        draft_preview = (ex.draft_content or "").strip().replace("\n", " ")
        draft_preview = draft_preview[:400]
        exhibit_digest_lines.append(
            f"[EXHIBIT {ex.exhibit_number}] {ex.title} | Summary: {summary} | Draft Preview: {draft_preview}"
        )
    exhibit_digest = "\n".join(exhibit_digest_lines) if exhibit_digest_lines else "No exhibits available."

    section_conclusion_lines = []
    for draft in criteria_drafts:
        if draft.section_conclusion and draft.section_conclusion.strip():
            section_conclusion_lines.append(
                f"[{draft.criteria_id}] {draft.section_conclusion.strip()[:700]}"
            )
    section_conclusions = "\n".join(section_conclusion_lines) if section_conclusion_lines else "No section conclusions available."

    criteria_ids_from_drafts = list({d.criteria_id for d in criteria_drafts if d.criteria_id})
    criteria_ids_from_drafts = [c for c in criteria_ids_from_drafts if c not in ["recommendation", "future_work", "personal_info"]]
    criteria_list = ", ".join(
        CRITERIA_INFO.get(normalize_criteria_id(c), {}).get("header", c.replace("_", " ").title())
        for c in criteria_ids_from_drafts
    ) if criteria_ids_from_drafts else "the evidence criteria set forth in this petition"

    parser = PydanticOutputParser(pydantic_object=PetitionConclusion)
    prompt = ChatPromptTemplate.from_messages([
        ("system", config.get("system_prompt", "")),
        ("human", config.get("human_prompt", ""))
    ])

    chain = prompt | llm
    response = await chain.ainvoke({
        "display_name": display_name,
        "user_field": user_field,
        "user_occupation": user_occupation,
        "field_context": field_context[:5000],
        "intro_context": intro_draft_text,
        "exhibit_digest": exhibit_digest,
        "section_conclusions": section_conclusions,
        "criteria_list": criteria_list,
        "format_instructions": parser.get_format_instructions()
    })

    parsed = None
    content_to_parse = response.content
    if isinstance(content_to_parse, list):
        content_to_parse = content_to_parse[0] if content_to_parse else None

    if isinstance(content_to_parse, dict):
        parsed = PetitionConclusion(
            heading=str(content_to_parse.get("heading", "CONCLUSION")).strip() or "CONCLUSION",
            conclusion_paragraphs=[
                str(p).strip()
                for p in content_to_parse.get("conclusion_paragraphs", [])
                if str(p).strip()
            ]
        )
    elif isinstance(content_to_parse, str):
        content_str = content_to_parse.strip()
        try:
            if "```json" in content_str:
                start = content_str.find("```json") + 7
                end = content_str.find("```", start)
                if end > start:
                    content_str = content_str[start:end].strip()
            elif "```" in content_str:
                start = content_str.find("```") + 3
                end = content_str.find("```", start)
                if end > start:
                    content_str = content_str[start:end].strip()

            json_data = json.loads(content_str)
            parsed = PetitionConclusion(
                heading=str(json_data.get("heading", "CONCLUSION")).strip() or "CONCLUSION",
                conclusion_paragraphs=[
                    str(p).strip()
                    for p in json_data.get("conclusion_paragraphs", [])
                    if str(p).strip()
                ]
            )
        except Exception:
            parsed = None

    if not parsed:
        logger.error("Failed to parse petition conclusion response from LLM")
        raise Exception("Failed to parse petition conclusion response from LLM")

    sections = [parsed.heading]
    sections.extend([p for p in parsed.conclusion_paragraphs if p.strip()])
    return "\n\n".join(sections)
