import asyncio
import hashlib
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Any
from enum import Enum

from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from supabase.client import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)

class EB1ACriteria(str, Enum):
    AWARDS = "awards"
    MEMBERSHIP = "membership"
    PRESS = "press"
    PUBLISHED_MATERIAL = "published_material"
    JUDGING = "judging"
    CONTRIBUTIONS = "contributions"
    SCHOLARLY = "scholarly"
    EXHIBITIONS = "exhibitions"
    LEADING = "leading"
    SALARY = "salary"
    COMMERCIAL = "commercial"

class AAOMetadata(BaseModel):
    criteria_id: List[EB1ACriteria] = Field(description="The EB-1A criteria discussed in the decision")
    outcome: str = Field(description="The final ruling: sustained, dismissed, or remanded")
    field: str = Field(description="The petitioner's field of endeavor")
    denial_reason: str = Field(description="One concise sentence explaining why the criteria were not met")

class AAOIngestionService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0,
            google_api_key=settings.GOOGLE_API_KEY
        )
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GOOGLE_API_KEY
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,
            chunk_overlap=800,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type(Exception) # In production, narrow this to specific API errors
    )
    async def _extract_metadata_async(self, text: str) -> AAOMetadata:
        """Uses Gemini to extract structured metadata with Pydantic parsing."""
        prompt = f"""
        ### SYSTEM INSTRUCTION
        You are a Senior Legal Analyst specialized in U.S. Administrative Appeals Office (AAO) decisions for EB-1A Extraordinary Ability petitions. Your task is to extract highly accurate, structured metadata from decision text.

        ### EB-1A CRITERIA DEFINITIONS
        - 'awards': Lesser nationally/internationally recognized prizes for excellence.
        - 'membership': Associations requiring outstanding achievements of their members.
        - 'press': Published material in major media about the alien and their work.
        - 'judging': Judging the work of others (peer review, thesis committees).
        - 'contributions': Original contributions of major significance to the field.
        - 'scholarly': Authorship of scholarly articles in professional publications.
        - 'exhibitions': Work displayed at artistic exhibitions or showcases.
        - 'leading': Leading or critical role for distinguished organizations.
        - 'salary': High salary or remuneration relative to others in the field.
        - 'commercial': Commercial successes in the performing arts.

        ### EXTRACTION STEPS
        1. Analyze: Read the text and identify which of the 10 criteria the Director or the AAO analyzed.
        2. Determine Outcome: Look for the final sentence or the "Conclusion" section to find the ruling (sustained, dismissed, or remanded).
        3. Summarize Denial: Identify the primary reason the criteria were not met.

        ### TEXT TO ANALYZE
        {text[:8000]}
        """
        
        structured_llm = self.llm.with_structured_output(AAOMetadata)
        return await structured_llm.ainvoke(prompt)

    def _get_content_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()

    async def process_pdf(self, pdf_path: Path) -> int:
        """Processes a single PDF: extracts text, metadata, generates embeddings, and saves to DB."""
        try:
            loader = PyPDFLoader(str(pdf_path))
            # PyPDFLoader.load is synchronous, but we can wrap it or use it as is in this async context
            pages = await asyncio.to_thread(loader.load)
            
            if not pages:
                logger.warning(f"No pages found in {pdf_path}")
                return 0

            # Extract metadata from the beginning of the doc
            full_text_sample = " ".join([p.page_content for p in pages[:5]])
            metadata = await self._extract_metadata_async(full_text_sample)
            
            # Split into chunks
            chunks = self.text_splitter.split_documents(pages)
            texts = [chunk.page_content for chunk in chunks]
            
            # Generate embeddings in batch for this file
            # GoogleGenerativeAIEmbeddings.aembed_documents is available
            embeddings_list = await self.embeddings.aembed_documents(texts)
            
            records = []
            for i, (text, embedding) in enumerate(zip(texts, embeddings_list)):
                content_hash = self._get_content_hash(f"{pdf_path.name}_{i}_{text[:100]}")
                
                meta_dict = metadata.model_dump()
                meta_dict.update({
                    "source": pdf_path.name,
                    "chunk_index": i
                })
                
                records.append({
                    "content": text,
                    "metadata": meta_dict,
                    "embedding": embedding,
                    "content_hash": content_hash
                })
            
            # Batch insert into Supabase
            if records:
                # Use upsert with on_conflict to handle deduplication via content_hash
                self.supabase.table("aao_precedents").upsert(
                    records, 
                    on_conflict="content_hash"
                ).execute()
                
            logger.info(f"Successfully processed {pdf_path.name} with {len(records)} chunks")
            return len(records)

        except Exception as e:
            logger.error(f"Error processing {pdf_path.name}: {str(e)}")
            return 0

    async def ingest_directory(self, directory_path: str):
        """Processes all PDFs in a directory concurrently with controlled throughput."""
        path = Path(directory_path)
        if not path.exists():
            logger.error(f"Directory {directory_path} not found.")
            return

        pdf_files = sorted(list(path.glob("*.pdf")))
        logger.info(f"Starting ingestion of {len(pdf_files)} files from {directory_path}")

        # Use a semaphore to limit concurrency and avoid hitting rate limits too hard
        semaphore = asyncio.Semaphore(5) 

        async def sem_process(file_path):
            async with semaphore:
                return await self.process_pdf(file_path)

        tasks = [sem_process(f) for f in pdf_files]
        results = await asyncio.gather(*tasks)
        
        total_chunks = sum(results)
        logger.info(f"Ingestion complete. Total chunks added: {total_chunks}")
        return total_chunks
