"""
Central application configuration.
Loaded from environment variables / .env file at startup.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "AI-Powered E-Commerce Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Security ---
    SECRET_KEY: str = "insecure-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Database ---
    DATABASE_URL: str = "postgresql://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce_db"

    # --- Cache ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # --- AI ---
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    AI_PROVIDER: str = "openai"  # "openai" or "anthropic"
    AI_MODEL_OPENAI: str = "gpt-4o-mini"
    AI_MODEL_ANTHROPIC: str = "claude-sonnet-4-6"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
