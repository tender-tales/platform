"""Tests for the config module."""

import os
from unittest.mock import patch

from api.config import Settings


def test_settings_default_values():
    """Test that Settings initializes with correct default values."""
    settings = Settings()

    assert settings.backend_port == 8000
    assert settings.frontend_port == 3000
    assert settings.cors_origins == ["http://localhost:3000", "http://localhost:3001"]
    assert settings.debug is False


def test_settings_with_environment_variables():
    """Test that Settings reads from environment variables."""
    with patch.dict(
        os.environ,
        {
            "BACKEND_PORT": "9000",
            "FRONTEND_PORT": "4000",
            "DEBUG": "true",
            "EARTH_ENGINE_PROJECT_ID": "test-project",
        },
    ):
        settings = Settings()

        assert settings.backend_port == 9000
        assert settings.frontend_port == 4000
        assert settings.debug is True
        assert settings.earth_engine_project_id == "test-project"


def test_debug_setting_case_insensitive():
    """Test that debug setting handles different case values."""
    with patch.dict(os.environ, {"DEBUG": "TRUE"}):
        settings = Settings()
        assert settings.debug is True

    with patch.dict(os.environ, {"DEBUG": "False"}):
        settings = Settings()
        assert settings.debug is False
