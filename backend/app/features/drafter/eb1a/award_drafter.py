import logging
import uuid
import json
import re
import requests
from urllib.parse import urlparse
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.features.documents.models import UserExhibit, Citation, UserExhibitItem, UserEvidenceContent
from app.features.documents.repositories import DocumentRepository, CitationRepository
from app.features.petitions.repositories import ExhibitRepository
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

class AwardDrafterAgent:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    def _resolve_organic_url(self, url: str) -> str:
        """Helper to extract clean organic URL from Google redirect wrappers."""
        try:
            import requests
            from urllib.parse import unquote, urlparse, parse_qs
            
            # 1. First try string parsing (fastest)
            decoded = unquote(url)
            parsed = urlparse(decoded)
            params = parse_qs(parsed.query)
            for key in ['url', 'q', 'u', 'link']:
                if key in params and params[key]:
                    candidate = params[key][0]
                    if candidate.startswith("http"):
                        return candidate
            
            # 2. If it's a Vertex AI proxy, follow the redirect (reliable)
            if "vertexaisearch.cloud.google.com" in url:
                # We use head() to avoid downloading the whole page
                response = requests.head(url, allow_redirects=True, timeout=3)
                final_url = response.url
                # Basic safety check to ensure we didn't land on another google page
                if "google.com" not in final_url or "google.com/url" not in final_url:
                    return final_url
                    
        except Exception as e:
            logger.warning(f"Failed to resolve organic URL {url}: {e}")
            
        return url

    def _apply_grounding(self, text: str, metadata: Any) -> str:
        """
        Injects [N] markers based on Gemini's grounding metadata.
        Ensures each source is cited exactly ONCE at its first appearance.
        """
        if not metadata or not hasattr(metadata, 'grounding_supports') or not metadata.grounding_supports:
            return text

        # 1. Map each source index to its EARLIEST end_index in the text
        # We only care about sources 1-4
        first_mentions = {} # {source_idx: earliest_offset}
        
        for support in metadata.grounding_supports:
            indices = getattr(support, 'grounding_chunk_indices', []) or getattr(support, 'groundingChunkIndices', [])
            end = getattr(support.segment, 'end_index', None) or getattr(support.segment, 'endIndex', None)
            
            if end is not None and indices:
                idx = indices[0] + 1
                if idx <= 4:
                    # If we haven't seen this source yet, or this mention is earlier
                    if idx not in first_mentions or end < first_mentions[idx]:
                        first_mentions[idx] = end

        # 2. Sort unique first mentions by offset DESCENDING to avoid breaking character offsets
        sorted_citations = sorted(first_mentions.items(), key=lambda x: x[1], reverse=True)
        
        modified_text = text
        for idx, end in sorted_citations:
            citation_tag = f" [{idx}]"
            modified_text = modified_text[:end] + citation_tag + modified_text[end:]

        return modified_text

    async def _get_user_context(self, db: Session, user_id: uuid.UUID) -> str:
        """Helper to fetch Petitioner's background (field, profile) from Basic Info."""
        repo = DocumentRepository(db)
        basics = repo.evidence_query().filter(
            UserEvidenceContent.user_id == user_id,
            UserEvidenceContent.criteria.like("%basic%")
        ).all()
        
        if not basics:
            return "EB-1A Petitioner"
            
        context = "\n".join([f"[{b.title}]: {b.content[:1000]}" for b in basics])
        return context

    async def draft_award_section(self, db: Session, user_id: uuid.UUID, exhibit_id: uuid.UUID, user_name: str = "The Petitioner") -> str:
        """
        Drafts paragraphs with precise inline grounding metadata.
        """
        exhibit_repo = ExhibitRepository(db)
        exhibit = exhibit_repo.get_by_id(exhibit_id, user_id)

        if not exhibit:
            raise Exception("Exhibit not found")

        # 1. Fetch Basic Info for field context
        field_context = await self._get_user_context(db, user_id)

        items = exhibit_repo.get_items_for_exhibit(exhibit_id)
        item_map = {str(i.file_id or i.content_id): i.item_suffix for i in items}
        
        file_ids = [i.file_id for i in items if i.file_id]
        manual_ids = [i.content_id for i in items if i.content_id]

        repo = DocumentRepository(db)
        content_entries = repo.evidence_query().filter(
            or_(
                UserEvidenceContent.file_id.in_(file_ids) if file_ids else False,
                UserEvidenceContent.id.in_(manual_ids) if manual_ids else False
            )
        ).all()

        context_parts = []
        for c in content_entries:
            suffix = item_map.get(str(c.file_id or c.id), "?")
            safe_content = c.content[:4000] if c.content else "[No text content extracted]"
            context_parts.append(f"[EXHIBIT {exhibit.exhibit_number}({suffix}) - {c.title}]: {safe_content}")
        
        context_text = "\n\n".join(context_parts)

        prompt = f"""
        You are an expert EB-1A petition strategist specializing in self-petition documentation. 
        Your goal is to draft a formal and highly persuasive legal argument for the following exhibit, presenting {user_name}'s achievements in the most authoritative manner possible to USCIS.
        
        PETITIONER NAME: {user_name}
        EXHIBIT TITLE: {exhibit.title}
        
        PETITIONER PROFILE CONTEXT:
        {field_context}
        
        EXHIBIT DOCUMENT CONTENT (Use these specific details for your draft):
        {context_text}
        
        TASK:
        1. RESEARCH: Find official prestige, selectivity, and reputation data for the achievement: "{exhibit.title}" using Google Search.
        2. DRAFT: Exactly 2-3 formal paragraphs. 
           - Paragraph 1: Detail {user_name}'s specific contribution and how it led to this recognition.
           - Paragraph 2: Explain the prestige and selectivity of the award (nomination counts, judge panels, etc.).
           - Paragraph 3 (Optional): Synthesize how this award demonstrates {user_name} has reached the top of their field.
        3. PARAGRAPH SEPARATION: You MUST separate each paragraph with a double newline (\\n\\n).
        4. PERSUASION: Refer to the Petitioner as "{user_name}" or "Mr./Ms. {user_name.split()[-1]}". Do NOT just use "The Petitioner".
        5. ENGLISH ONLY (PROSE): The generated paragraphs MUST be in professional English. Translate any foreign content into English for the narrative. 
        6. INTERNAL REFERENCES: Use the format "EXHIBIT {exhibit.exhibit_number}(a)". Cite an internal document ONCE per exhibit group.
        7. FORBIDDEN - NO PLACEHOLDERS: NEVER use bracketed placeholders.
        8. FORBIDDEN - MARKDOWN: DO NOT use markdown formatting.
        9. NO CONVERSATION: Return only the legal prose.
        """

        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.1,
                )
            )

            if not response.text: return ""
            
            raw_text = response.text.strip()
            
            # Clean up AI echoes (e.g., "EXHIBIT TITLE: ...")
            raw_text = re.sub(r'^EXHIBIT TITLE:.*?\n+', '', raw_text, flags=re.IGNORECASE).strip()
            raw_text = re.sub(r'^EXHIBIT TITLE:.*', '', raw_text, flags=re.IGNORECASE).strip()
            
            metadata = None
            if response.candidates and len(response.candidates) > 0:
                metadata = response.candidates[0].grounding_metadata

            # Apply "Linker" Logic using metadata offsets
            draft_text = self._apply_grounding(raw_text, metadata)
            
            # Save Citations to DB (Verified URLs from metadata - Limit to 4)
            citation_repo = CitationRepository(db)
            citation_repo.delete_for_exhibit(exhibit_id)
            if metadata and hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                chunks = metadata.grounding_chunks
                
                # 1. Identify which chunks were actually used in the text
                used_indices = set()
                if hasattr(metadata, 'grounding_supports'):
                    for support in metadata.grounding_supports:
                        indices = getattr(support, 'grounding_chunk_indices', []) or getattr(support, 'groundingChunkIndices', [])
                        for idx in indices:
                            if idx < len(chunks):
                                used_indices.add(idx)
                
                # 2. Filter and prioritize used chunks, then limit to 4
                final_chunks = []
                for i, chunk in enumerate(chunks):
                    if i in used_indices and hasattr(chunk, 'web') and chunk.web:
                        final_chunks.append((i, chunk))
                
                # 3. Add to DB in order of their appearance/relevance
                for i, (original_idx, chunk) in enumerate(final_chunks[:4]):
                    # RESOLVE the organic URL
                    organic_url = self._resolve_organic_url(chunk.web.uri)
                    
                    # Clean the title
                    raw_title = chunk.web.title or ""
                    domain = urlparse(organic_url).netloc.replace("www.", "")
                    
                    if not raw_title or raw_title.startswith("http") or ("." in raw_title and " " not in raw_title) or "vertexaisearch" in raw_title.lower():
                        if "vertexaisearch" in domain:
                            raw_title = f"Official Source {i+1}"
                        else:
                            raw_title = f"Official Source from {domain}"
                    
                    citation_repo.add(Citation(
                        application_id=exhibit.application_id,
                        exhibit_id=exhibit_id,
                        url=organic_url,
                        title=raw_title,
                        snippet=f"[{i+1}]" 
                    ))

            exhibit.draft_content = draft_text
            try:
                db.commit()
            except Exception as commit_err:
                db.rollback()
                logger.error(f"Failed to persist award draft: {commit_err}")
                raise
            return draft_text

        except Exception as e:
            logger.error(f"Drafter failed: {e}")
            db.rollback()
            raise

    async def draft_award_conclusion(self, db: Session, user_id: uuid.UUID, exhibits: List[UserExhibit], user_name: str = "The Petitioner") -> str:
        """
        Drafts a synthesized conclusion paragraph based on the content of all exhibits.
        """
        # Fetch field context for synthesis
        field_context = await self._get_user_context(db, user_id)
        
        exhibit_summaries = "\n\n".join([f"EXHIBIT {e.exhibit_number} ({e.title}): {e.draft_content[:1000]}" for e in exhibits if e.draft_content])
        
        prompt = f"""
        You are an expert EB-1A petition strategist. 
        Review the following evidence clusters for the 'Awards' criteria and draft one formal, highly persuasive conclusion paragraph for {user_name}.
        
        PETITIONER NAME: {user_name}
        PETITIONER FIELD CONTEXT:
        {field_context}
        
        EVIDENCE SUMMARIES:
        {exhibit_summaries}
        
        TASK:
        1. SYNTHESIS: Summarize the collective prestige and selective nature of these achievements in {user_name}'s field.
        2. POSITIONING: Explicitly state how these awards, when viewed together, demonstrate that {user_name} has reached the very top of their field of endeavor and enjoys sustained national or international acclaim.
        3. PERSUASION: Refer to the Petitioner as "{user_name}" or "Mr./Ms. {user_name.split()[-1]}".
        4. NO INTRO: Start immediately with the legal argument (e.g., "In summary, the collective evidence of...").
        5. FORBIDDEN: Do NOT use markdown or placeholders.
        6. ENGLISH ONLY.
        """

        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2)
            )
            return response.text.strip() if response.text else ""
        except Exception as e:
            logger.error(f"Conclusion drafting failed: {e}")
            return ""

    async def draft_award_intro(self, db: Session, user_id: uuid.UUID, exhibits: List[UserExhibit], user_name: str = "The Petitioner") -> str:
        """
        Drafts an introductory paragraph connecting all exhibits to the Petitioner's field.
        """
        if not exhibits: return ""
        
        field_context = await self._get_user_context(db, user_id)
        exhibit_list = ", ".join([f"EXHIBIT {e.exhibit_number}" for e in exhibits])
        exhibit_titles = "\n".join([f"- EXHIBIT {e.exhibit_number}: {e.title}" for e in exhibits])
        
        prompt = f"""
        You are an expert EB-1A petition strategist.
        Draft a formal introductory paragraph for the 'Awards' section of a petition letter for {user_name}.
        
        PETITIONER NAME: {user_name}
        FIELD CONTEXT: {field_context}
        
        EXHIBITS TO INTRODUCE:
        {exhibit_titles}
        
        TASK:
        1. PERSUASION: Draft 1-2 formal sentences stating that {exhibit_list} serve as evidence of {user_name}'s receipt of prestigious awards within their sector.
        2. CONNECTION: Connect these awards to {user_name}'s reputation and accomplishments in their specific field.
        3. FORMAT: Refer to the Petitioner as "{user_name}" or "Mr./Ms. {user_name.split()[-1]}".
        4. NO INTRO: Start immediately with the prose (e.g., "{exhibit_list} serve as evidence of...").
        5. ENGLISH ONLY.
        """
        
        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2)
            )
            return response.text.strip() if response.text else ""
        except Exception as e:
            logger.error(f"Intro drafting failed: {e}")
            return ""

award_drafter = AwardDrafterAgent()
