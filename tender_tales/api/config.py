"""Configuration settings for the API."""

import os
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Server configuration
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    frontend_port: int = int(os.getenv("FRONTEND_PORT", "3000"))

    # Earth Engine configuration
    earth_engine_project_id: Optional[str] = os.getenv("EARTH_ENGINE_PROJECT_ID")
    google_application_credentials: Optional[str] = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    # API configuration
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    class Config:
        """Pydantic configuration."""

        env_file = ".env"


settings = Settings()
