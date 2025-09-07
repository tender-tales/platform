"""Sentinel-2 imagery service for satellite data visualization."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import ee

from services.earth_engine import earth_engine_service
from shared.logging_config import setup_module_logger


logger = setup_module_logger("kadal.services.sentinel_imagery")


@dataclass
class ImageryRequest:
    """Request parameters for satellite imagery."""

    bounds: Dict[str, float]  # north, south, east, west
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    cloud_coverage_max: float = 20.0
    visualization: str = "rgb"  # rgb, false_color, ndvi


@dataclass
class ImageryResult:
    """Result containing imagery URLs and metadata."""

    tile_url: str
    map_id: str
    visualization_type: str
    date_range: Dict[str, str]
    cloud_coverage: float
    bounds: Dict[str, float]
    metadata: Dict[str, Any]


class SentinelImageryService:
    """Service for retrieving and processing Sentinel-2 satellite imagery."""

    def __init__(self) -> None:
        """Initialize the Sentinel imagery service."""
        self.collection_id = "COPERNICUS/S2_SR_HARMONIZED"

        # Visualization parameters for different band combinations
        self.viz_params = {
            "rgb": {
                "bands": ["B4", "B3", "B2"],  # Red, Green, Blue
                "min": 0,
                "max": 3000,
                "gamma": 1.4,
            },
            "false_color": {
                "bands": ["B8", "B4", "B3"],  # NIR, Red, Green
                "min": 0,
                "max": 3000,
                "gamma": 1.4,
            },
            "ndvi": {
                "bands": ["NDVI"],
                "min": -1,
                "max": 1,
                "palette": ["red", "yellow", "green"],
            },
            "agriculture": {
                "bands": ["B11", "B8", "B2"],  # SWIR1, NIR, Blue
                "min": 0,
                "max": 3000,
                "gamma": 1.4,
            },
        }

    def get_latest_imagery(self, request: ImageryRequest) -> ImageryResult:
        """Get the latest available Sentinel-2 imagery for the specified region."""
        if not earth_engine_service.is_initialized():
            raise RuntimeError("Earth Engine is not initialized")

        try:
            # Create bounding box
            geometry = ee.Geometry.Rectangle(
                [
                    request.bounds["west"],
                    request.bounds["south"],
                    request.bounds["east"],
                    request.bounds["north"],
                ]
            )

            # Set date range - default to last 30 days if not specified
            end_date = request.end_date or datetime.now().strftime("%Y-%m-%d")
            if request.start_date:
                start_date = request.start_date
            else:
                start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

            logger.info(f"Fetching Sentinel-2 imagery for {start_date} to {end_date}")

            # Filter the Sentinel-2 collection
            collection = (
                ee.ImageCollection(self.collection_id)
                .filterBounds(geometry)
                .filterDate(start_date, end_date)
                .filter(
                    ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", request.cloud_coverage_max)
                )
                .sort("system:time_start", False)
            )  # Sort by date, most recent first

            # Get collection size for logging
            collection_size = collection.size().getInfo()
            logger.info(f"Found {collection_size} images matching criteria")

            if collection_size == 0:
                # Relax cloud coverage constraints if no images found
                logger.info("No images found, relaxing cloud coverage to 50%")
                collection = (
                    ee.ImageCollection(self.collection_id)
                    .filterBounds(geometry)
                    .filterDate(start_date, end_date)
                    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 50))
                    .sort("system:time_start", False)
                )

                collection_size = collection.size().getInfo()
                logger.info(f"Found {collection_size} images with relaxed criteria")

                if collection_size == 0:
                    raise ValueError(
                        "No Sentinel-2 imagery available for the specified region and time period"
                    )

            # Get the most recent image or create a median composite
            if collection_size == 1:
                image = collection.first()
                logger.info("Using single image")
            else:
                # Create median composite from recent images (max 5 for performance)
                recent_images = collection.limit(min(5, collection_size))
                image = recent_images.median()
                logger.info(
                    f"Created median composite from {min(5, collection_size)} images"
                )

            # Calculate NDVI if needed
            if request.visualization == "ndvi":
                image = self._add_ndvi(image)

            # Clip to the region of interest
            image = image.clip(geometry)

            # Get visualization parameters
            viz_params = self.viz_params.get(
                request.visualization, self.viz_params["rgb"]
            )

            # Generate map tiles
            map_id = image.getMapId(viz_params)

            # Get metadata
            if collection_size == 1:
                first_image = collection.first()
                image_info = first_image.getInfo()
                cloud_coverage = first_image.get("CLOUDY_PIXEL_PERCENTAGE").getInfo()
                acquisition_date = datetime.fromtimestamp(
                    first_image.get("system:time_start").getInfo() / 1000
                ).strftime("%Y-%m-%d")
            else:
                cloud_coverage = (
                    request.cloud_coverage_max
                )  # Approximation for composite
                acquisition_date = f"{start_date} to {end_date} (composite)"
                image_info = {
                    "type": "median_composite",
                    "image_count": collection_size,
                }

            result = ImageryResult(
                tile_url=map_id["tile_fetcher"].url_format,
                map_id=map_id["mapid"],
                visualization_type=request.visualization,
                date_range={
                    "start": start_date,
                    "end": end_date,
                    "acquisition": acquisition_date,
                },
                cloud_coverage=float(cloud_coverage) if cloud_coverage else 0.0,
                bounds=request.bounds,
                metadata={
                    "collection_size": collection_size,
                    "image_info": image_info,
                    "viz_params": viz_params,
                },
            )

            logger.info(
                f"Generated imagery tiles for {request.visualization} visualization"
            )
            return result

        except Exception as e:
            logger.error(f"Failed to get Sentinel-2 imagery: {e}")
            raise RuntimeError(f"Failed to retrieve satellite imagery: {str(e)}") from e

    def _add_ndvi(self, image: ee.Image) -> ee.Image:
        """Add NDVI band to the image.

        NDVI = (NIR - Red) / (NIR + Red)
        """
        ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
        return image.addBands(ndvi)

    def get_available_visualizations(self) -> List[Dict[str, Any]]:
        """Get list of available visualization types."""
        return [
            {
                "id": "rgb",
                "name": "True Color",
                "description": "Natural color satellite imagery (RGB)",
                "bands": ["B4", "B3", "B2"],
            },
            {
                "id": "false_color",
                "name": "False Color",
                "description": "False color highlighting vegetation (NIR-Red-Green)",
                "bands": ["B8", "B4", "B3"],
            },
            {
                "id": "ndvi",
                "name": "NDVI",
                "description": "Normalized Difference Vegetation Index",
                "bands": ["NDVI"],
            },
            {
                "id": "agriculture",
                "name": "Agriculture",
                "description": "Agricultural analysis (SWIR1-NIR-Blue)",
                "bands": ["B11", "B8", "B2"],
            },
        ]


# Global service instance
sentinel_imagery_service = SentinelImageryService()
