import asyncio
import logging
from app.features.rag.services import AAOIngestionService
from app.core.config import settings
from supabase.client import create_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_rag_setup():
    logger.info("🚀 Starting RAG Setup Test")
    
    # 1. Test Supabase Connection
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        res = supabase.table("aao_precedents").select("count", count="exact").limit(1).execute()
        logger.info(f"✅ Supabase connection successful. Current record count: {res.count}")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
        return

    # 2. Test Embedding Generation
    service = AAOIngestionService()
    try:
        test_text = "Retrieve a case where the petitioner is in the gaming industry and received a prestigious award for their work."
        embedding = await service.embeddings.aembed_query(test_text)
        logger.info(f"✅ Embedding generation successful. Vector dimension: {len(embedding)}")
    except Exception as e:
        logger.error(f"❌ Embedding generation failed: {e}")
        return

    # 3. Test Vector Search Function (match_precedents)
    try:
        # We search for the embedding we just generated
        search_res = supabase.rpc("match_precedents", {
            "query_embedding": embedding,
            "match_threshold": 0.5,
            "match_count": 5
        }).execute()
        logger.info(f"✅ Vector search RPC call successful. Found {len(search_res.data)} matches.")
        for i, match in enumerate(search_res.data):
            logger.info(f"   Match {i+1}: Similarity {match['similarity']:.4f} - Source: {match['metadata'].get('source', 'unknown')}")
    except Exception as e:
        logger.error(f"❌ Vector search RPC call failed: {e}")
        logger.info("💡 Tip: Ensure you have run the SQL migration in the Supabase SQL Editor.")

if __name__ == "__main__":
    asyncio.run(test_rag_setup())
