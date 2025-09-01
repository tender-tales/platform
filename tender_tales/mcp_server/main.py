#!/usr/bin/env python3
"""Kadal Earth Engine MCP Server.

A Model Context Protocol server that provides Google Earth Engine capabilities
for geospatial analysis and environmental monitoring.
"""

import asyncio
import json
import os
import signal
from typing import Any, Optional, cast

import ee
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

from config import MCPConfig
from logging_config import setup_logging, silence_noisy_loggers
from tools import EarthEngineTools

# Set up colorized logging
logger = setup_logging(
    level=os.getenv("LOG_LEVEL", "INFO"), logger_name="kadal.mcp.server"
)
silence_noisy_loggers()

# Initialize configuration and tools
config = MCPConfig()
earth_tools = EarthEngineTools()

# Create MCP server
mcp = FastMCP("Kadal Earth Engine")


class Region(BaseModel):
    """Geographic region model."""

    type: str = "rectangle"
    coordinates: list[float]  # [west, south, east, north]


@mcp.tool()  # type: ignore[misc]
async def get_dataset_info(dataset_id: str) -> dict[str, Any]:
    """Get detailed information about a Google Earth Engine dataset.

    Args:
        dataset_id: The Earth Engine dataset ID (e.g., 'LANDSAT/LC08/C02/T1_L2')

    """
    logger.info(f"Retrieving dataset information for: {dataset_id}")
    result = await earth_tools.get_dataset_info(dataset_id)
    logger.info("Dataset information retrieved successfully")
    return cast(dict[str, Any], result)


@mcp.tool()  # type: ignore[misc]
async def search_datasets(keywords: str, limit: int = 10) -> dict[str, Any]:
    """Search for Earth Engine datasets by keywords with conservation focus.

    Args:
        keywords: Keywords to search for in dataset names and descriptions
        limit: Maximum number of results to return (default: 10)

    """
    logger.info(f"Searching datasets with keywords: {keywords}")
    result = await earth_tools.search_datasets(keywords, limit)
    logger.info(f"Search completed, found {result.get('count', 0)} datasets")
    return cast(dict[str, Any], result)


@mcp.tool()  # type: ignore[misc]
async def get_image_statistics(
    dataset_id: str, region: Region, scale: int = 1000
) -> dict[str, Any]:
    """Calculate statistics for an Earth Engine image over a specified region.

    Args:
        dataset_id: The Earth Engine image dataset ID
        region: Geographic region with type "rectangle" and coordinates [west, south, east, north]
        scale: Scale in meters for the computation (default: 1000)

    """
    logger.info(f"Computing image statistics for {dataset_id} at {scale}m resolution")
    result = await earth_tools.get_image_statistics(dataset_id, region.dict(), scale)
    logger.info("Image statistics computed successfully")
    return cast(dict[str, Any], result)


@mcp.tool()  # type: ignore[misc]
async def analyze_land_cover_change(
    region: Region, start_date: str, end_date: str
) -> dict[str, Any]:
    """Analyze land cover changes between two time periods using Hansen Global Forest Change data.

    Args:
        region: Geographic region to analyze
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format

    """
    logger.info(f"Analyzing land cover changes: {start_date} to {end_date}")

    result = await earth_tools.analyze_land_cover_change(
        region.dict(), start_date, end_date
    )

    # Extract key metrics for logging
    results = result.get("results", {})
    loss_ha = results.get("forest_loss_hectares", 0)
    loss_pct = results.get("loss_percentage", 0)

    logger.info(
        f"Land cover analysis complete: {loss_ha:.1f} hectares lost ({loss_pct:.1f}%)"
    )
    return cast(dict[str, Any], result)


@mcp.tool()  # type: ignore[misc]
async def visualize_image(
    dataset_id: str,
    region: Region,
    bands: Optional[list[str]] = None,
    min_val: float = 0,
    max_val: float = 3000,
    palette: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Create a visualization URL for an Earth Engine image.

    Args:
        dataset_id: The Earth Engine image dataset ID
        region: Geographic region to visualize
        bands: Band names to visualize (default: first 3 bands)
        min_val: Minimum value for visualization (default: 0)
        max_val: Maximum value for visualization (default: 3000)
        palette: Color palette as hex colors (optional)

    """
    logger.info(f"Creating visualization URL for dataset: {dataset_id}")

    # Prepare visualization parameters
    vis_params = {"bands": bands, "min": min_val, "max": max_val}
    if palette:
        vis_params["palette"] = palette

    result = await earth_tools.visualize_image(dataset_id, region.dict(), vis_params)

    logger.info("Visualization URL generated successfully")
    return cast(dict[str, Any], result)


@mcp.tool()  # type: ignore[misc]
async def get_sentinel_image(
    region: Region,
    start_date: str = "2024-01-01",
    end_date: str = "2024-12-31",
    cloud_cover: int = 30,
) -> dict[str, Any]:
    """Get Sentinel-2 satellite imagery for a region.

    Args:
        region: Geographic region to get imagery for
        start_date: Start date in YYYY-MM-DD format (default: 2024-01-01)
        end_date: End date in YYYY-MM-DD format (default: 2024-12-31)
        cloud_cover: Maximum cloud cover percentage (default: 30)

    """
    logger.info(f"Getting Sentinel-2 imagery: {start_date} to {end_date}")

    result = await earth_tools.get_sentinel_image(
        region.dict(), start_date, end_date, cloud_cover
    )

    if "thumbnail_url" in result:
        logger.info(
            f"Sentinel-2 imagery retrieved with {result.get('image_count', 0)} images"
        )

    return cast(dict[str, Any], result)


@mcp.tool()  # type: ignore[misc]
async def geocode_location(location_name: str) -> dict[str, Any]:
    """Geocode a location name to coordinates.

    Args:
        location_name: Name of the location to geocode (e.g., "Toronto", "New York")

    """
    logger.info(f"Geocoding location: {location_name}")

    result = await earth_tools.geocode_location(location_name)

    if result.get("found"):
        coords = result["coordinates"]
        logger.info(
            f"Location found: {coords['latitude']:.4f}, {coords['longitude']:.4f}"
        )
    else:
        logger.info(f"Location not found: {location_name}")

    return cast(dict[str, Any], result)


def _initialize_earth_engine() -> bool:
    """Initialize Earth Engine with proper authentication."""
    logger.info("Initializing Google Earth Engine...")

    try:
        if not config.earth_engine_project_id:
            logger.warning("Earth Engine project ID not configured")
            return False

        logger.info(f"Using Earth Engine project: {config.earth_engine_project_id}")

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
                if _try_credentials_file(credentials_path):
                    return True
            except Exception as e:
                logger.warning(
                    f"⚠️  Failed to use credentials file at {credentials_path}: {e}"
                )
                # Continue to try other methods

        logger.info(
            "🔄 No valid credentials file found, trying default authentication..."
        )
        _initialize_with_default()
        return True

    except Exception as e:
        _log_initialization_error(e)
        return False


def _try_credentials_file(credentials_path: str) -> bool:
    """Try to initialize with credentials file. Returns True if successful."""
    try:
        with open(credentials_path, "r") as f:
            creds = json.load(f)

        # If it's OAuth credentials (has refresh_token), use them
        if "refresh_token" in creds:
            return _initialize_with_oauth(creds)

        # If it's a service account key (has client_email and private_key)
        if "type" in creds and creds["type"] == "service_account":
            if "client_email" in creds and "private_key" in creds:
                return _initialize_with_service_account(credentials_path)
            logger.warning("Service account credentials incomplete")
            return False

        logger.warning("Unrecognized credentials format")
        return False
    except Exception as e:
        logger.warning(f"Failed to use credentials file: {e}")
        return False


def _initialize_with_oauth(creds: dict[str, Any]) -> bool:
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
        project=config.earth_engine_project_id,
    )

    logger.info("Earth Engine initialized successfully with OAuth credentials")
    logger.info(f"Connected to Earth Engine project: {config.earth_engine_project_id}")
    _test_connection()
    return True


def _initialize_with_service_account(
    credentials_path: str = "/app/credentials.json",
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
        ee.Initialize(credentials=credentials, project=config.earth_engine_project_id)

        logger.info("Earth Engine initialized successfully with service account")
        logger.info(
            f"Connected to Earth Engine project: {config.earth_engine_project_id}"
        )
        _test_connection()
        return True

    except Exception as e:
        logger.error(f"Service account initialization failed: {e}")
        return False


def _initialize_with_default() -> None:
    """Initialize with default credentials."""
    ee.Initialize(project=config.earth_engine_project_id)
    logger.info("Earth Engine initialized successfully with default credentials")
    logger.info(f"Connected to Earth Engine project: {config.earth_engine_project_id}")
    _test_connection()


def _log_initialization_error(error: Exception) -> None:
    """Log initialization error with troubleshooting info."""
    logger.error(f"Failed to initialize Earth Engine: {error}")
    logger.error("Troubleshooting steps:")
    logger.error("   1. Run 'earthengine authenticate' on your host machine")
    logger.error("   2. Ensure credentials are properly mounted in Docker container")
    logger.error("   3. Check that EARTH_ENGINE_PROJECT_ID is set correctly")
    logger.error(
        f"   4. Current project ID: {config.earth_engine_project_id or 'NOT SET'}"
    )


def _test_connection() -> None:
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
            logger.warning("⚠️  Earth Engine connection test returned unexpected data")

    except Exception as e:
        logger.warning(f"Earth Engine connection test failed: {e}")
        logger.warning("This might indicate limited permissions or quota issues")


def main() -> None:
    """Run the MCP server."""
    try:
        # Initialize Earth Engine
        if _initialize_earth_engine():
            logger.info("Earth Engine ready for MCP operations")
        else:
            logger.warning(
                "Earth Engine not available - MCP server will have limited functionality"
            )

        # Run the MCP server
        logger.info("Starting Kadal Earth Engine MCP Server")
        logger.info("MCP server ready for connections")

        # Keep the server running
        async def keep_alive() -> None:
            logger.info("MCP server running, waiting for connections...")
            try:
                while True:
                    await asyncio.sleep(60)
                    logger.debug("MCP server heartbeat")
            except asyncio.CancelledError:
                logger.info("MCP server shutdown requested")

        # Set up signal handlers for graceful shutdown
        def signal_handler(signum: int, frame: Any) -> None:
            logger.info(f"Received signal {signum}, shutting down gracefully")
            raise KeyboardInterrupt

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

        try:
            asyncio.run(keep_alive())
        except KeyboardInterrupt:
            logger.info("MCP server stopped")

    except Exception as e:
        logger.error(f"Failed to start MCP server: {e}")
        raise


if __name__ == "__main__":
    main()
