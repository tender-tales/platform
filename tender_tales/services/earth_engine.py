"""Earth Engine service for connection only."""

import json
import os

import ee
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

from api.config import settings
from services.logging_config import setup_module_logger


logger = setup_module_logger("kadal.services.earth_engine")


class EarthEngineService:
    """Service for Google Earth Engine connection."""

    def __init__(self) -> None:
        """Initialize the Earth Engine service."""
        self.initialized = False
        self._initialize()

    def _initialize(self) -> None:
        """Initialize Google Earth Engine with OAuth or service account auth."""
        logger.info("Initializing Google Earth Engine...")

        try:
            if not settings.earth_engine_project_id:
                logger.warning("Earth Engine project ID not configured")
                return

            logger.info(
                f"Using Earth Engine project: {settings.earth_engine_project_id}"
            )

            # Try to initialize with credentials file (check multiple locations)
            credentials_paths = [
                "/app/credentials.json",  # For Cloud Run deployment
                "/run/secrets/earthengine-credentials",  # For Docker Compose with secrets
                os.path.expanduser(
                    "~/.config/earthengine/credentials"
                ),  # Default EE location
            ]

            credentials_path = None
            for path in credentials_paths:
                logger.debug(f"Checking credentials path: {path}")
                if os.path.exists(path) and os.path.getsize(path) > 0:
                    credentials_path = path
                    logger.info(f"Found credentials file: {path}")
                    break

            if credentials_path:
                try:
                    if self._try_credentials_file(credentials_path):
                        return
                except Exception as e:
                    logger.warning(
                        f"Failed to use credentials file at {credentials_path}: {e}"
                    )
                    # Continue to try other methods

            logger.info(
                "No valid credentials file found, attempting default authentication"
            )
            self._initialize_with_default()

        except Exception as e:
            self._log_initialization_error(e)

    def _try_credentials_file(self, credentials_path: str) -> bool:
        """Try to initialize with credentials file. Returns True if successful."""
        try:
            with open(credentials_path, "r") as f:
                creds = json.load(f)

            # If it's OAuth credentials (has refresh_token), use them
            if "refresh_token" in creds:
                return self._initialize_with_oauth(creds)

            # If it's a service account key (has client_email and private_key)
            if "type" in creds and creds["type"] == "service_account":
                if "client_email" in creds and "private_key" in creds:
                    return self._initialize_with_service_account(credentials_path)
                logger.warning("Service account credentials incomplete")
                return False

            logger.warning("Unrecognized credentials format")
            return False
        except Exception as e:
            logger.warning(f"Failed to use credentials file: {e}")
            return False

    def _initialize_with_oauth(self, creds: dict[str, str]) -> bool:
        """Initialize with OAuth credentials."""
        logger.info("Using OAuth credentials from earthengine authenticate")

        oauth_creds = Credentials(  # type: ignore[no-untyped-call]
            token=None,
            refresh_token=creds["refresh_token"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=creds["client_id"],
            client_secret=creds["client_secret"],
        )

        logger.debug("Refreshing OAuth access token...")
        oauth_creds.refresh(Request())  # type: ignore[no-untyped-call]
        logger.debug("OAuth token refreshed successfully")

        logger.debug("Initializing Earth Engine with OAuth credentials...")
        ee.Initialize(
            credentials=oauth_creds,
            project=settings.earth_engine_project_id,
        )

        self.initialized = True
        logger.info("Earth Engine initialized successfully with OAuth credentials")
        logger.info(
            f"Connected to Earth Engine project: {settings.earth_engine_project_id}"
        )
        self._test_connection()
        return True

    def _initialize_with_service_account(
        self, credentials_path: str = "/app/credentials.json"
    ) -> bool:
        """Initialize with service account credentials."""
        logger.info("Using service account credentials")

        try:
            # Load service account credentials from JSON file
            with open(credentials_path, "r") as f:
                key_data = json.load(f)

            service_account_email = key_data.get("client_email")
            if not service_account_email:
                logger.error("Service account credentials missing client_email")
                return False

            logger.info(f"Service account email: {service_account_email}")
            logger.info(f"Using credentials file: {credentials_path}")

            # Create service account credentials using the JSON key file
            credentials = ee.ServiceAccountCredentials(
                service_account_email, credentials_path
            )

            # Initialize Earth Engine with service account credentials
            ee.Initialize(
                credentials=credentials, project=settings.earth_engine_project_id
            )

            self.initialized = True
            logger.info("Earth Engine initialized successfully with service account")
            logger.info(
                f"Connected to Earth Engine project: {settings.earth_engine_project_id}"
            )
            self._test_connection()
            return True

        except Exception as e:
            logger.error(f"Service account initialization failed: {e}")
            return False

    def _initialize_with_default(self) -> None:
        """Initialize with default credentials."""
        ee.Initialize(project=settings.earth_engine_project_id)
        self.initialized = True
        logger.info("Earth Engine initialized successfully with default credentials")
        logger.info(
            f"Connected to Earth Engine project: {settings.earth_engine_project_id}"
        )
        self._test_connection()

    def _log_initialization_error(self, error: Exception) -> None:
        """Log initialization error with troubleshooting info."""
        logger.error(f"Failed to initialize Earth Engine: {error}")
        logger.error("Troubleshooting steps:")
        logger.error("   1. Run 'earthengine authenticate' on your host machine")
        logger.error(
            "   2. Ensure credentials are properly mounted in Docker container"
        )
        logger.error("   3. Check that EARTH_ENGINE_PROJECT_ID is set correctly")
        logger.error(
            f"   4. Current project ID: {settings.earth_engine_project_id or 'NOT SET'}"
        )
        self.initialized = False

    def _test_connection(self) -> None:
        """Test the Earth Engine connection."""
        try:
            logger.debug("Testing Earth Engine connection...")

            # Simple test - get info about the SRTM dataset
            dataset = ee.Image("USGS/SRTMGL1_003")
            info = dataset.getInfo()

            if info and "bands" in info:
                logger.info("Earth Engine connection test passed")
                logger.debug(f"Test dataset contains {len(info['bands'])} bands")
            else:
                logger.warning("Earth Engine connection test returned unexpected data")

        except Exception as e:
            logger.warning(f"Earth Engine connection test failed: {e}")
            logger.warning("This might indicate limited permissions or quota issues")

    def is_initialized(self) -> bool:
        """Check if Earth Engine is properly initialized."""
        return self.initialized


# Global service instance
earth_engine_service = EarthEngineService()
