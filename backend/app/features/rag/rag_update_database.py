import os
import json
import time
import hashlib
from pathlib import Path
from typing import List, Dict
from tqdm import tqdm

# LangChain & AI Imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client, Client
from dotenv import load_dotenv

# 1. Setup Environment & Clients
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
directory_path = "./aao_eb1a_decisions_testing"

if not all([supabase_url, supabase_key, os.environ["GOOGLE_API_KEY"]]):
    print("❌ Error: Missing environment variables.")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)
# Using gemini-2.0-flash as confirmed working in this environment
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0)
# Using text-embedding-004 for 1536-dim vectors
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

# 2. Metadata Extraction Function
def extract_metadata(text: str) -> Dict:
    """Uses Gemini to extract structured metadata from legal decision text."""
    prompt = f"""
### SYSTEM INSTRUCTION
You are a Senior Legal Analyst specialized in U.S. Administrative Appeals Office (AAO) decisions for EB-1A Extraordinary Ability petitions. Your task is to extract highly accurate, structured metadata from decision text.

### CONSTRAINTS
1. **Source Grounding:** Extract information ONLY from the provided text. If a field is not explicitly mentioned, return "not_specified".
2. **Criteria Mapping:** You must map the discussed evidence strictly to the 10 regulatory criteria provided below.
3. **Outcome Rigor:** The 'outcome' must reflect the final ruling (sustained, dismissed, or remanded).

### EB-1A CRITERIA DEFINITIONS
- 'awards': Lesser nationally/internationally recognized prizes for excellence.
- 'membership': Associations requiring outstanding achievements of their members.
- 'press': Published material in major media about the alien and their work.
- 'judging': Judging the work of others (peer review, thesis committees).
- 'contributions': Original contributions of major significance to the field.
- 'scholarly_articles': Authorship of scholarly articles in professional publications.
- 'display': Work displayed at artistic exhibitions or showcases.
- 'critical_role': Leading or critical role for distinguished organizations.
- 'high_salary': High salary or remuneration relative to others in the field.
- 'commercial_ Farrsuccess': Commercial successes in the performing arts.

### EXTRACTION STEPS
1. **Analyze:** Read the text and identify which of the 10 criteria the Director or the AAO analyzed.
2. **Determine Outcome:** Look for the final sentence or the "Conclusion" section to find the ruling.
3. **Summarize Denial:** Identify the *primary* reason the criteria were not met (e.g., lack of field-wide impact, internal-only recognition).

### OUTPUT FORMAT
Return ONLY a single JSON object with this schema:
{{
  "criteria_id": ["string"],
  "outcome": "sustained" | "dismissed" | "remanded",
  "field": "string",
  "denial_reason": "string (1 concise sentence)"
}}

### TEXT TO ANALYZE
{text[:6000]}
    """
    try:
        response = llm.invoke(prompt)
        content = response.content
        if isinstance(content, list):
            content = " ".join([part.get("text", "") if isinstance(part, dict) else str(part) for part in content])
        
        json_str = content.replace('```json', '').replace('```', '').strip()
        data = json.loads(json_str)
        
        if isinstance(data, list) and len(data) > 0:
            data = data[0]
        
        if 'criteria_id' in data and isinstance(data['criteria_id'], str):
            data['criteria_id'] = [data['criteria_id']]
            
        return data
    except Exception as e:
        return {"criteria_id": ["unknown"], "outcome": "unknown", "field": "unknown", "denial_reason": f"Extraction error: {str(e)}"}

# 3. Process PDF Files in Batches
def process_all_files():
    path = Path(directory_path)
    if not path.exists():
        print(f"Directory {directory_path} not found.")
        return

    pdf_files = sorted(list(path.glob("*.pdf")))
    print(f"🚀 Starting processing of {len(pdf_files)} files...")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=4000,
        chunk_overlap=800,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    # Process files one by one to avoid memory issues and handle rate limits
    for pdf_path in tqdm(pdf_files, desc="Processing PDFs"):
        try:
            loader = PyPDFLoader(str(pdf_path))
            pages = loader.load()
            
            # Extract metadata from the beginning of the doc
            full_text_sample = " ".join([p.page_content for p in pages[:3]])
            meta_tags = extract_metadata(full_text_sample)
            
            # Split into chunks
            chunks = text_splitter.split_documents(pages)
            
            texts = []
            metadatas = []
            for chunk in chunks:
                chunk.metadata.update(meta_tags)
                chunk.metadata["source"] = pdf_path.name
                texts.append(chunk.page_content)
                metadatas.append(chunk.metadata)
            
            # Generate embeddings for this file's chunks
            embeddings_list = embeddings.embed_documents(texts)
            
            # Prepare records
            records = []
            for i in range(len(texts)):
                content = texts[i]
                content_hash = hashlib.sha256(content.encode()).hexdigest()
                records.append({
                    "content": content,
                    "metadata": metadatas[i],
                    "embedding": embeddings_list[i],
                    "content_hash": content_hash
                })
            
            # Upload to Supabase
            # Use ON CONFLICT (content_hash) DO NOTHING to skip duplicates
            supabase.table("aao_precedents_eb1a").upsert(records, on_conflict="content_hash").execute()
            
            # Small sleep to respect rate limits (RPM)
            time.sleep(1)
            
        except Exception as e:
            print(f"\n❌ Error processing {pdf_path.name}: {e}")
            continue

    print("\n✅ All files processed and stored in Supabase.")

if __name__ == "__main__":
    process_all_files()
