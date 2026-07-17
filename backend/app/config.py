"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Central configuration loaded from .env or environment variables."""

    # MongoDB
    mongodb_uri: str = Field(..., alias="MONGODB_URI")
    mongodb_db_name: str = Field("openscoutai", alias="MONGODB_DB_NAME")

    # Clerk Authentication
    clerk_secret_key: str = Field("", alias="CLERK_SECRET_KEY")
    clerk_domain: str = Field("", alias="CLERK_DOMAIN")
    clerk_webhook_secret: str = Field("", alias="CLERK_WEBHOOK_SECRET")
    clerk_publishable_key: str = Field("", alias="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")

    # GitHub
    github_app_token: str = Field("", alias="GITHUB_APP_TOKEN")

    # LLM / AI
    gemini_api_key: str = Field("", alias="GEMINI_API_KEY")

    # App
    frontend_url: str = Field("http://localhost:3000", alias="FRONTEND_URL")
    backend_port: int = Field(8000, alias="BACKEND_PORT")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }


# Singleton instance
settings = Settings()
