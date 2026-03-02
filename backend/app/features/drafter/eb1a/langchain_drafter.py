import logging
import uuid
import re
import asyncio
import requests
import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.runnables import RunnablePassthrough
from supabase.client import create_client, Client

from google.genai import types

from app.features.documents.models import UserExhibit, Citation, UserExhibitItem, UserEvidenceContent, UserFile
from app.features.documents.repositories import DocumentRepository, CitationRepository
from app.features.users.repositories import ProfileRepository
from app.features.petitions.repositories import (
    CriteriaDraftRepository,
    ExhibitRepository,
    PetitionDraftRepository,
    PetitionRunRepository,
)
from app.features.users.models import Profile
from app.core.config import settings
from app.features.drafter.eb1a.langchain_schemas import (
    DraftedSection,
    SectionIntro,
    SectionConclusion,
)
from app.features.drafter.eb1a.langchain_prompts import load_prompt_registry, PROMPT_REGISTRY
from app.features.drafter.eb1a.langchain_text import coerce_llm_text
from app.features.drafter.eb1a.langchain_grounding import apply_grounding
from app.features.drafter.eb1a.langchain_utils import (
    clean_reg_text,
    format_possessive_name,
    get_last_name,
    normalize_criteria_id,
)
from app.features.drafter.eb1a.langchain_context import get_user_context, extract_user_criteria
from app.features.drafter.eb1a.langchain_rag import get_legal_precedents, RAGFetcher
from app.features.drafter.eb1a.langchain_citations import save_citations
from app.features.drafter.eb1a.langchain_sections import draft_section as build_section
from app.features.drafter.eb1a.langchain_petition import (
    draft_petition_intro as build_petition_intro,
    draft_petition_conclusion as build_petition_conclusion,
)
from app.features.drafter.eb1a.langchain_exhibits import (
    draft_exhibit_intro as build_exhibit_intro,
    draft_exhibit_conclusion as build_exhibit_conclusion,
)

logger = logging.getLogger(__name__)

class LangChainDrafterAgent:
    def __init__(self):
        # 1. Initialize the base LLM
        llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.1,
            convert_system_message_to_human=True
        )

        # 2. Define the Google Search tool using the 2026 standard for Gemini 2.0
        grounding_tool = types.Tool(
            google_search=types.GoogleSearch()
        )

        # 3. Bind the tool to the LLM
        self.llm_with_grounding = llm.bind_tools([grounding_tool])

        # 4. Initialize Supabase client and Embeddings for RAG
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        # gemini-embedding-001 supports flexible dimensions (128-3072)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GOOGLE_API_KEY,
            output_dimensionality=1536
        )
        self._rag_locks = {} # Prevent parallel RAG race conditions
        self.rag_fetcher = RAGFetcher(self.embeddings, self.supabase, self._rag_locks)

    async def _get_user_profile(self, db: Session, user_id: uuid.UUID) -> Optional[Profile]:
        """Retrieves the user's structured profile."""
        repo = ProfileRepository(db)
        return repo.get_by_id(user_id)

    async def draft_petition_intro(self, db: Session, user_id: uuid.UUID, user_name: str = "The Petitioner") -> str:
        global PROMPT_REGISTRY
        if not PROMPT_REGISTRY:
            PROMPT_REGISTRY = load_prompt_registry()
        if "petition_intro" not in PROMPT_REGISTRY:
            PROMPT_REGISTRY = load_prompt_registry()
        profile = await self._get_user_profile(db, user_id)
        return await build_petition_intro(
            db=db,
            user_id=user_id,
            user_name=user_name,
            llm=self.llm_with_grounding,
            profile=profile,
            prompt_registry=PROMPT_REGISTRY,
        )

    async def draft_petition_conclusion(
        self,
        db: Session,
        user_id: uuid.UUID,
        run_ids: Optional[List[uuid.UUID]] = None,
        user_name: str = "The Petitioner"
    ) -> str:
        global PROMPT_REGISTRY
        if not PROMPT_REGISTRY:
            PROMPT_REGISTRY = load_prompt_registry()
        if "petition_conclusion" not in PROMPT_REGISTRY:
            PROMPT_REGISTRY = load_prompt_registry()
        profile = await self._get_user_profile(db, user_id)
        return await build_petition_conclusion(
            db=db,
            user_id=user_id,
            user_name=user_name,
            run_ids=run_ids,
            llm=self.llm_with_grounding,
            profile=profile,
            prompt_registry=PROMPT_REGISTRY,
        )
    async def draft_section(self, db: Session, user_id: uuid.UUID, exhibit_id: uuid.UUID, user_name: str = "The Petitioner", precedent_context: str = "") -> str:
        global PROMPT_REGISTRY
        if not PROMPT_REGISTRY:
            PROMPT_REGISTRY = load_prompt_registry()
        return await build_section(
            db=db,
            user_id=user_id,
            exhibit_id=exhibit_id,
            user_name=user_name,
            precedent_context=precedent_context,
            llm=self.llm_with_grounding,
            prompt_registry=PROMPT_REGISTRY,
        )

    async def draft_exhibit_conclusion(self, db: Session, user_id: uuid.UUID, exhibits: List[UserExhibit], user_name: str = "The Petitioner") -> str:
        return await build_exhibit_conclusion(
            db=db,
            user_id=user_id,
            exhibits=exhibits,
            user_name=user_name,
            llm=self.llm_with_grounding,
            prompt_registry=PROMPT_REGISTRY,
        )

    async def draft_exhibit_intro(self, db: Session, user_id: uuid.UUID, exhibits: List[UserExhibit], user_name: str = "The Petitioner") -> str:
        return await build_exhibit_intro(
            db=db,
            user_id=user_id,
            exhibits=exhibits,
            user_name=user_name,
            llm=self.llm_with_grounding,
            prompt_registry=PROMPT_REGISTRY,
        )

# Singleton instance
langchain_drafter = LangChainDrafterAgent()
