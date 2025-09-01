"""Configuration for the MCP server."""

import os
from typing import Optional

from pydantic_settings import BaseSettings


class MCPConfig(BaseSettings):
    """Configuration settings for the MCP server."""

    # Server configuration - Cloud Run uses PORT env var
    mcp_port: int = int(os.getenv("PORT", os.getenv("MCP_PORT", "8001")))

    # Earth Engine configuration
    earth_engine_project_id: Optional[str] = os.getenv("EARTH_ENGINE_PROJECT_ID")
    google_application_credentials: Optional[str] = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    # API configuration
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    class Config:
        """Pydantic configuration."""

        env_file = ".env"


# Global configuration instance
config = MCPConfig()
