"""Logging configuration for the API."""

import logging.config
import sys
from typing import Any, Dict

from api.config import settings


def setup_logging() -> None:
    """Set up structured logging configuration."""
    # Define log format
    log_format = "%(asctime)s | %(levelname)8s | %(name)s | %(message)s"

    # Configure logging
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": log_format,
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "detailed": {
                "format": "%(asctime)s | %(levelname)8s | %(name)s:%(lineno)d | %(funcName)s | %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "standard",
                "stream": sys.stdout,
            },
            "detailed_console": {
                "class": "logging.StreamHandler",
                "level": "DEBUG" if settings.debug else "INFO",
                "formatter": "detailed" if settings.debug else "standard",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            # Root logger
            "": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if settings.debug else "INFO",
                "propagate": False,
            },
            # Our application loggers
            "api": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if settings.debug else "INFO",
                "propagate": False,
            },
            "services": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if settings.debug else "INFO",
                "propagate": False,
            },
            # Third-party loggers (reduce noise)
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": [],  # Disable access logs for cleaner output
                "level": "WARNING",
                "propagate": False,
            },
            "httpx": {
                "handlers": ["console"],
                "level": "WARNING",
                "propagate": False,
            },
            "earthengine": {
                "handlers": ["console"],
                "level": "WARNING",
                "propagate": False,
            },
        },
    }

    # Apply logging configuration
    logging.config.dictConfig(logging_config)

    # Log startup message
    logger = logging.getLogger("api.startup")
    logger.info("🚀 Logging system initialized")
    logger.info(f"🔧 Debug mode: {'ENABLED' if settings.debug else 'DISABLED'}")
    logger.info(f"🌐 Backend running on port: {settings.backend_port}")
