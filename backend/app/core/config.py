from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_ID: str = ""
    DATABASE_URL: str = ""
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "user-files"
    
    # AI Configuration
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = ""
    GEMINI_PRO_MODEL: str = "" # Stable high-reasoning model for Bouncer

    # Stripe Configuration
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    # Optional JSON: {"price_id":"plan_name"}
    STRIPE_PRICE_PLAN_MAP: str = ""
    
    # Environment config
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
