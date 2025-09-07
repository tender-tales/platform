"""Tests for the logging configuration module."""

import io
import logging
import logging.config
import sys
from unittest.mock import MagicMock, patch

from tender_tales.shared.logging_config import (
    log_startup_info,
    setup_logging,
    setup_module_logger,
    setup_structured_logging,
    silence_noisy_loggers,
)


class TestSetupLogging:
    """Test cases for setup_logging function."""

    def test_setup_logging_default_parameters(self):
        """Test setup_logging with default parameters."""
        logger = setup_logging()

        assert logger.level == logging.INFO
        assert len(logger.handlers) == 1
        assert isinstance(logger.handlers[0], logging.StreamHandler)
        assert logger.handlers[0].stream == sys.stdout

    def test_setup_logging_with_level(self):
        """Test setup_logging with different log levels."""
        test_cases = [
            ("DEBUG", logging.DEBUG),
            ("INFO", logging.INFO),
            ("WARNING", logging.WARNING),
            ("ERROR", logging.ERROR),
            ("CRITICAL", logging.CRITICAL),
        ]

        for level_str, expected_level in test_cases:
            logger = setup_logging(
                level=level_str, logger_name=f"test_{level_str.lower()}"
            )
            assert logger.level == expected_level

    def test_setup_logging_with_logger_name(self):
        """Test setup_logging with a specific logger name."""
        logger_name = "test.logger"
        logger = setup_logging(logger_name=logger_name)

        assert logger.name == logger_name
        assert logger.propagate is False

    def test_setup_logging_root_logger_propagation(self):
        """Test that root logger propagation is not modified."""
        logger = setup_logging()
        # For root logger, propagate should remain True (default)
        assert hasattr(logger, "propagate")

    def test_setup_logging_removes_existing_handlers(self):
        """Test that existing handlers are removed to avoid duplicates."""
        logger_name = "test.duplicate.handlers"

        # First setup
        logger1 = setup_logging(logger_name=logger_name)
        initial_handler_count = len(logger1.handlers)

        # Second setup on same logger
        logger2 = setup_logging(logger_name=logger_name)

        # Should be same logger instance and same handler count
        assert logger1 is logger2
        assert len(logger2.handlers) == initial_handler_count

    def test_setup_logging_debug_format(self):
        """Test that debug mode affects formatter configuration."""
        logger_debug = setup_logging(debug=True, logger_name="test.debug")
        logger_normal = setup_logging(debug=False, logger_name="test.normal")

        # Both should have handlers with formatters
        assert len(logger_debug.handlers) == 1
        assert len(logger_normal.handlers) == 1
        assert logger_debug.handlers[0].formatter is not None
        assert logger_normal.handlers[0].formatter is not None

    def test_setup_logging_timestamp_formatting(self):
        """Test timestamp formatting options."""
        # With timestamp
        logger_with_ts = setup_logging(show_timestamp=True, logger_name="test.with_ts")
        # Without timestamp
        logger_without_ts = setup_logging(
            show_timestamp=False, logger_name="test.without_ts"
        )

        # Both should have formatters
        assert logger_with_ts.handlers[0].formatter is not None
        assert logger_without_ts.handlers[0].formatter is not None


class TestSetupStructuredLogging:
    """Test cases for setup_structured_logging function."""

    def test_setup_structured_logging_default(self):
        """Test setup_structured_logging with default parameters."""
        with patch("logging.config.dictConfig") as mock_dict_config:
            setup_structured_logging()

            # Verify dictConfig was called once
            mock_dict_config.assert_called_once()

            # Verify the structure of the config passed
            config = mock_dict_config.call_args[0][0]
            assert config["version"] == 1
            assert config["disable_existing_loggers"] is False
            assert "formatters" in config
            assert "handlers" in config
            assert "loggers" in config

    def test_setup_structured_logging_debug_mode(self):
        """Test setup_structured_logging with debug mode enabled."""
        with patch("logging.config.dictConfig") as mock_dict_config:
            setup_structured_logging(debug=True)

            config = mock_dict_config.call_args[0][0]

            # Check that debug mode affects handler configuration
            detailed_handler = config["handlers"]["detailed_console"]
            assert detailed_handler["level"] == "DEBUG"
            assert detailed_handler["formatter"] == "colored_detailed"

            # Check root logger level
            root_logger = config["loggers"][""]
            assert root_logger["level"] == "DEBUG"

    def test_setup_structured_logging_production_mode(self):
        """Test setup_structured_logging with debug mode disabled."""
        with patch("logging.config.dictConfig") as mock_dict_config:
            setup_structured_logging(debug=False)

            config = mock_dict_config.call_args[0][0]

            # Check that production mode affects handler configuration
            detailed_handler = config["handlers"]["detailed_console"]
            assert detailed_handler["level"] == "INFO"
            assert detailed_handler["formatter"] == "colored"

            # Check root logger level
            root_logger = config["loggers"][""]
            assert root_logger["level"] == "INFO"

    def test_setup_structured_logging_logger_configuration(self):
        """Test that all expected loggers are configured."""
        with patch("logging.config.dictConfig") as mock_dict_config:
            setup_structured_logging()

            config = mock_dict_config.call_args[0][0]
            loggers = config["loggers"]

            # Check that all expected application loggers are present
            expected_loggers = [
                "",  # root
                "api",
                "mcp_server",
                "services",
                "shared",
                "uvicorn",
                "uvicorn.access",
                "httpx",
                "earthengine",
            ]

            for logger_name in expected_loggers:
                assert logger_name in loggers

    def test_setup_structured_logging_uvicorn_access_disabled(self):
        """Test that uvicorn access logs are disabled."""
        with patch("logging.config.dictConfig") as mock_dict_config:
            setup_structured_logging()

            config = mock_dict_config.call_args[0][0]
            uvicorn_access = config["loggers"]["uvicorn.access"]

            assert uvicorn_access["handlers"] == []
            assert uvicorn_access["level"] == "WARNING"


class TestSetupModuleLogger:
    """Test cases for setup_module_logger function."""

    def test_setup_module_logger_default(self):
        """Test setup_module_logger with default parameters."""
        module_name = "test.module"
        logger = setup_module_logger(module_name)

        assert logger.name == module_name
        assert logger.level == logging.INFO

    def test_setup_module_logger_with_level_and_debug(self):
        """Test setup_module_logger with custom level and debug mode."""
        module_name = "test.debug.module"
        logger = setup_module_logger(module_name, level="DEBUG", debug=True)

        assert logger.name == module_name
        assert logger.level == logging.DEBUG


class TestSilenceNoisyLoggers:
    """Test cases for silence_noisy_loggers function."""

    def test_silence_noisy_loggers(self):
        """Test that silence_noisy_loggers sets correct levels."""
        # Create mock loggers to test
        noisy_loggers = [
            "urllib3.connectionpool",
            "google.auth._default",
            "google.auth.transport.requests",
            "googleapiclient.discovery",
            "googleapiclient.discovery_cache",
            "uvicorn.access",
        ]

        mock_loggers = {}
        for logger_name in noisy_loggers:
            mock_logger = MagicMock()
            mock_loggers[logger_name] = mock_logger

        with patch(
            "logging.getLogger",
            side_effect=lambda name: mock_loggers.get(name, MagicMock()),
        ):
            silence_noisy_loggers()

            # Verify all noisy loggers were set to WARNING level
            for mock_logger in mock_loggers.values():
                mock_logger.setLevel.assert_called_once_with(logging.WARNING)


class TestLogStartupInfo:
    """Test cases for log_startup_info function."""

    def test_log_startup_info_with_debug_enabled(self):
        """Test log_startup_info with debug mode enabled."""
        service_name = "api"
        port = 8000

        with patch("logging.getLogger") as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger

            log_startup_info(service_name, port, debug=True)

            # Verify logger was retrieved with correct name
            mock_get_logger.assert_called_once_with(
                f"tender_tales.{service_name}.startup"
            )

            # Verify correct log messages
            expected_calls = [
                "Logging system initialized",
                "Debug mode: ENABLED",
                f"{service_name.title()} running on port: {port}",
            ]

            assert mock_logger.info.call_count == 3
            for i, expected_msg in enumerate(expected_calls):
                actual_call = mock_logger.info.call_args_list[i]
                assert actual_call[0][0] == expected_msg

    def test_log_startup_info_with_debug_disabled(self):
        """Test log_startup_info with debug mode disabled."""
        service_name = "mcp_server"
        port = 9000

        with patch("logging.getLogger") as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger

            log_startup_info(service_name, port, debug=False)

            # Check that debug disabled message is logged
            debug_call = mock_logger.info.call_args_list[1]
            assert debug_call[0][0] == "Debug mode: DISABLED"

    def test_log_startup_info_service_name_capitalization(self):
        """Test that service name is properly capitalized in logs."""
        service_name = "test_service"
        port = 5000

        with patch("logging.getLogger") as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger

            log_startup_info(service_name, port)

            # Check service name capitalization
            service_call = mock_logger.info.call_args_list[2]
            assert service_call[0][0] == "Test_Service running on port: 5000"


class TestIntegration:
    """Integration tests for logging configuration."""

    def test_logging_output_capture(self):
        """Test that logging actually produces output."""
        # Create a string buffer to capture output
        log_capture = io.StringIO()

        # Setup logger with our custom stream
        with patch("sys.stdout", log_capture):
            logger = setup_logging(level="INFO", logger_name="test.integration")
            logger.info("Test message")

        # Verify output was captured
        output = log_capture.getvalue()
        assert "Test message" in output
        assert "INFO" in output

    def test_multiple_loggers_independence(self):
        """Test that multiple loggers can be set up independently."""
        logger1 = setup_logging(level="DEBUG", logger_name="test.logger1")
        logger2 = setup_logging(level="ERROR", logger_name="test.logger2")

        assert logger1.name == "test.logger1"
        assert logger2.name == "test.logger2"
        assert logger1.level == logging.DEBUG
        assert logger2.level == logging.ERROR
        assert logger1 is not logger2

    def test_colorlog_formatter_configuration(self):
        """Test that colorlog formatters are properly configured."""
        logger = setup_logging(logger_name="test.colors")

        handler = logger.handlers[0]
        formatter = handler.formatter

        # Verify it's a ColoredFormatter
        assert formatter.__class__.__name__ == "ColoredFormatter"

        # Verify it has the expected attributes (checking actual colorlog attributes)
        assert hasattr(formatter, "log_colors")
        assert hasattr(formatter, "secondary_log_colors")
