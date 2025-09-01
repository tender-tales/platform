"""Logging configuration for the backend services."""

import logging
import sys
from typing import Optional

import colorlog


def setup_logging(
    level: str = "INFO", show_timestamp: bool = True, logger_name: Optional[str] = None
) -> logging.Logger:
    """
    Set up colorized logging for backend services.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        show_timestamp: Whether to include timestamps in log output
        logger_name: Name for the logger (defaults to root logger)

    Returns
    -------
        Configured logger instance
    """
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

    # Create formatter
    if show_timestamp:
        format_string = (
            "%(log_color)s%(asctime)s%(reset)s | "
            "%(log_color)s%(levelname)-8s%(reset)s | "
            "%(name)s | "
            "%(message_log_color)s%(message)s%(reset)s"
        )
        date_format = "%H:%M:%S"
    else:
        format_string = (
            "%(log_color)s%(levelname)-8s%(reset)s | "
            "%(name)s | "
            "%(message_log_color)s%(message)s%(reset)s"
        )
        date_format = None

    # Create colored formatter
    formatter = colorlog.ColoredFormatter(
        format_string,
        datefmt=date_format,
        log_colors=log_colors,
        secondary_log_colors=secondary_log_colors,
        style="%",
    )

    # Set up handler
    handler = colorlog.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Configure logger
    logger = logging.getLogger(logger_name) if logger_name else logging.getLogger()

    # Remove existing handlers to avoid duplicates
    for existing_handler in logger.handlers[:]:
        logger.removeHandler(existing_handler)

    logger.addHandler(handler)
    logger.setLevel(getattr(logging, level.upper()))

    # Prevent propagation to avoid duplicate logs
    if logger_name:
        logger.propagate = False

    return logger


def setup_module_logger(module_name: str, level: str = "INFO") -> logging.Logger:
    """
    Set up a module-specific logger with consistent formatting.

    Args:
        module_name: Name of the module (e.g., "kadal.services.earth_engine")
        level: Logging level

    Returns
    -------
        Configured logger for the module
    """
    return setup_logging(level=level, logger_name=module_name)


def silence_noisy_loggers() -> None:
    """Silence commonly noisy third-party loggers."""
    # Reduce noise from common libraries
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)
    logging.getLogger("google.auth._default").setLevel(logging.WARNING)
    logging.getLogger("google.auth.transport.requests").setLevel(logging.WARNING)
    logging.getLogger("googleapiclient.discovery").setLevel(logging.WARNING)
    logging.getLogger("googleapiclient.discovery_cache").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
