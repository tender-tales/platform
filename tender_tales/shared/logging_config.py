"""Unified logging configuration for the Tender Tales platform."""

import logging
import logging.config
import sys
from typing import Any, Dict, Optional

import colorlog


def setup_logging(
    level: str = "INFO",
    show_timestamp: bool = True,
    logger_name: Optional[str] = None,
    debug: bool = False,
) -> logging.Logger:
    """Set up colorized logging for platform services.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        show_timestamp: Whether to include timestamps in log output
        logger_name: Name for the logger (defaults to root logger)
        debug: Whether debug mode is enabled (affects detailed formatting)

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

    # Create formatter based on debug mode and timestamp preference
    if show_timestamp:
        if debug:
            format_string = (
                "%(log_color)s%(asctime)s%(reset)s | "
                "%(log_color)s%(levelname)-8s%(reset)s | "
                "%(name)s:%(lineno)d | "
                "%(message_log_color)s%(message)s%(reset)s"
            )
        else:
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


def setup_structured_logging(debug: bool = False) -> None:
    """Set up structured logging configuration with colors for FastAPI apps.

    This provides a more comprehensive logging setup suitable for web applications.

    Args:
        debug: Whether debug mode is enabled
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
                "level": "DEBUG" if debug else "INFO",
                "formatter": "colored_detailed" if debug else "colored",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            # Root logger
            "": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if debug else "INFO",
                "propagate": False,
            },
            # Our application loggers
            "api": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if debug else "INFO",
                "propagate": False,
            },
            "mcp_server": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if debug else "INFO",
                "propagate": False,
            },
            "services": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if debug else "INFO",
                "propagate": False,
            },
            "shared": {
                "handlers": ["detailed_console"],
                "level": "DEBUG" if debug else "INFO",
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


def setup_module_logger(
    module_name: str, level: str = "INFO", debug: bool = False
) -> logging.Logger:
    """Set up a module-specific logger with consistent formatting.

    Args:
        module_name: Name of the module (e.g., "tender_tales.services.earth_engine")
        level: Logging level
        debug: Whether debug mode is enabled

    Returns
    -------
        Configured logger for the module
    """
    return setup_logging(level=level, logger_name=module_name, debug=debug)


def silence_noisy_loggers() -> None:
    """Silence commonly noisy third-party loggers."""
    # Reduce noise from common libraries
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)
    logging.getLogger("google.auth._default").setLevel(logging.WARNING)
    logging.getLogger("google.auth.transport.requests").setLevel(logging.WARNING)
    logging.getLogger("googleapiclient.discovery").setLevel(logging.WARNING)
    logging.getLogger("googleapiclient.discovery_cache").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def log_startup_info(service_name: str, port: int, debug: bool = False) -> None:
    """Log startup information for a service.

    Args:
        service_name: Name of the service (e.g., "api", "mcp_server")
        port: Port the service is running on
        debug: Whether debug mode is enabled
    """
    logger = logging.getLogger(f"tender_tales.{service_name}.startup")
    logger.info("Logging system initialized")
    logger.info(f"Debug mode: {'ENABLED' if debug else 'DISABLED'}")
    logger.info(f"{service_name.title()} running on port: {port}")
