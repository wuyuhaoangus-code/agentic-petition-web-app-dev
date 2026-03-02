from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
# Using Service Role Key only for backend administrative tasks if needed.
# For Auth verification, we mainly use the user's JWT.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the Supabase JWT from the Authorization header.
    Returns the user object if valid.
    """
    token = credentials.credentials
    try:
        # get_user() verifies the JWT against Supabase Auth
        res = supabase.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return res.user
    except Exception as e:
        logger.error(f"Supabase auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
