"""Logging configuration for the API."""

import logging.config
import sys
from typing import Any, Dict

from api.config import settings


def setup_logging() -> None:
    """Set up structured logging configuration with colors."""
    # Color configuration
    log_colors = {
        "DEBUG": "cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "bold_red",
    }

    secondary_log_colors = {
        "message": {
            "DEBUG": "white",
            "INFO": "white",
            "WARNING": "yellow",
            "ERROR": "red",
            "CRITICAL": "bold_red",
        }
    }

    # Configure logging
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "colored": {
                "()": "colorlog.ColoredFormatter",
                "format": (
                    "%(log_color)s%(asctime)s%(reset)s | "
                    "%(log_color)s%(levelname)-8s%(reset)s | "
                    "%(name)s | "
                    "%(message_log_color)s%(message)s%(reset)s"
                ),
                "datefmt": "%H:%M:%S",
                "log_colors": log_colors,
                "secondary_log_colors": secondary_log_colors,
            },
            "colored_detailed": {
                "()": "colorlog.ColoredFormatter",
                "format": (
                    "%(log_color)s%(asctime)s%(reset)s | "
                    "%(log_color)s%(levelname)-8s%(reset)s | "
                    "%(name)s:%(lineno)d | "
                    "%(message_log_color)s%(message)s%(reset)s"
                ),
                "datefmt": "%H:%M:%S",
                "log_colors": log_colors,
                "secondary_log_colors": secondary_log_colors,
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "colored",
                "stream": sys.stdout,
            },
            "detailed_console": {
                "class": "logging.StreamHandler",
                "level": "DEBUG" if settings.debug else "INFO",
                "formatter": "colored_detailed" if settings.debug else "colored",
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
    logger = logging.getLogger("kadal.api.startup")
    logger.info("Logging system initialized")
    logger.info(f"Debug mode: {'ENABLED' if settings.debug else 'DISABLED'}")
    logger.info(f"Backend running on port: {settings.backend_port}")
