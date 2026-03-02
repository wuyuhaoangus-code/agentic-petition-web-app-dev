import asyncio
import logging
import sys
from pathlib import Path

# Add the current directory to sys.path so we can import 'app'
sys.path.append(str(Path(__file__).parent))

from app.features.rag.services import AAOIngestionService

# Setup beautiful logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ingest-script")

async def run_ingestion():
    # Path to your PDFs
    # If running locally, use your local path
    # If running in Docker, use /app/aao_eb1a_decisions
    directory = "./aao_eb1a_decisions"
    
    if not Path(directory).exists():
        logger.error(f"❌ Directory not found: {directory}")
        return

    logger.info(f"🚀 Starting ingestion from: {directory}")
    service = AAOIngestionService()
    
    try:
        total_chunks = await service.ingest_directory(directory)
        logger.info(f"✅ Ingestion complete! Total chunks added: {total_chunks}")
    except Exception as e:
        logger.error(f"💥 Fatal error during ingestion: {e}")

if __name__ == "__main__":
    asyncio.run(run_ingestion())
