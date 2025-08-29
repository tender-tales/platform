"""Earth Engine service for satellite data processing."""

import json
import logging
import os
import time
from typing import Any, List, Optional

import ee
import numpy as np
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from pydantic import BaseModel

from api.config import settings


logger = logging.getLogger("services.earth_engine")


class SatelliteEmbedding(BaseModel):
    """Satellite embedding data model."""

    longitude: float
    latitude: float
    embedding: List[float]
    similarity: float
    year: int
    type: str
    analysis_date: Optional[str] = None


class BoundingBox(BaseModel):
    """Geographic bounding box model."""

    north: float
    south: float
    east: float
    west: float


class EarthEngineService:
    """Service for Google Earth Engine operations."""

    def __init__(self) -> None:
        """Initialize the Earth Engine service."""
        self.initialized = False
        self._initialize()

    def _initialize(self) -> None:
        """Initialize Google Earth Engine with OAuth or service account auth."""
        logger.info("🌍 Initializing Google Earth Engine...")

        try:
            if not settings.earth_engine_project_id:
                logger.warning("⚠️  Earth Engine project ID not configured")
                return

            logger.info(f"🔗 Using project ID: {settings.earth_engine_project_id}")

            # Try to initialize with credentials file
            credentials_path = "/app/credentials.json"
            logger.debug(f"🔍 Looking for credentials at: {credentials_path}")

            try:
                if (
                    os.path.exists(credentials_path)
                    and os.path.getsize(credentials_path) > 0
                ):
                    logger.info("📄 Found credentials file, checking format...")
                    if self._try_credentials_file(credentials_path):
                        return

                logger.info(
                    "🔄 No valid credentials file found, trying default authentication..."
                )
                self._initialize_with_default()

            except Exception as e:
                logger.warning(f"⚠️  Failed to use credentials file: {e}")
                logger.info("🔄 Attempting fallback initialization...")

                # Fall back to default initialization
                self._initialize_with_default()
                return

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

            if "type" in creds and creds["type"] == "service_account":
                return self._initialize_with_service_account()

            return False
        except Exception as e:
            logger.warning(f"⚠️  Failed to use credentials file: {e}")
            return False

    def _initialize_with_oauth(self, creds: dict[str, Any]) -> bool:
        """Initialize with OAuth credentials."""
        logger.info("🔑 Using OAuth credentials (from earthengine authenticate)")

        oauth_creds = Credentials(  # type: ignore[no-untyped-call]
            token=None,
            refresh_token=creds["refresh_token"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=creds["client_id"],
            client_secret=creds["client_secret"],
        )

        logger.debug("🔄 Refreshing OAuth access token...")
        oauth_creds.refresh(Request())  # type: ignore[no-untyped-call]
        logger.debug("✅ OAuth token refreshed successfully")

        logger.debug("🚀 Initializing Earth Engine with OAuth credentials...")
        ee.Initialize(
            credentials=oauth_creds,
            project=settings.earth_engine_project_id,
        )

        self.initialized = True
        logger.info("🎉 Earth Engine initialized successfully with OAuth credentials!")
        logger.info(f"📡 Connected to project: {settings.earth_engine_project_id}")
        self._test_connection()
        return True

    def _initialize_with_service_account(self) -> bool:
        """Initialize with service account credentials."""
        logger.info("🔑 Using service account credentials")
        ee.Initialize(project=settings.earth_engine_project_id)
        self.initialized = True
        logger.info("🎉 Earth Engine initialized successfully with service account!")
        logger.info(f"📡 Connected to project: {settings.earth_engine_project_id}")
        self._test_connection()
        return True

    def _initialize_with_default(self) -> None:
        """Initialize with default credentials."""
        ee.Initialize(project=settings.earth_engine_project_id)
        self.initialized = True
        logger.info(
            "🎉 Earth Engine initialized successfully with default credentials!"
        )
        logger.info(f"📡 Connected to project: {settings.earth_engine_project_id}")
        self._test_connection()

    def _log_initialization_error(self, error: Exception) -> None:
        """Log initialization error with troubleshooting info."""
        logger.error(f"❌ Failed to initialize Earth Engine: {error}")
        logger.error("💡 Troubleshooting steps:")
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
            logger.debug("🧪 Testing Earth Engine connection...")

            # Simple test - get info about the SRTM dataset
            dataset = ee.Image("USGS/SRTMGL1_003")  # type: ignore[attr-defined]
            info = dataset.getInfo()

            if info and "bands" in info:
                logger.info("✅ Earth Engine connection test passed!")
                logger.debug(f"🗺️  Test dataset bands: {len(info['bands'])}")
            else:
                logger.warning(
                    "⚠️  Earth Engine connection test returned unexpected data"
                )

        except Exception as e:
            logger.warning(f"⚠️  Earth Engine connection test failed: {e}")
            logger.warning("🔍 This might indicate limited permissions or quota issues")

    def is_initialized(self) -> bool:
        """Check if Earth Engine is properly initialized."""
        return self.initialized

    async def fetch_similarity_heatmap(
        self, bounds: BoundingBox, reference_year: int, target_year: int
    ) -> dict[str, Any]:
        """Optimized similarity heatmap using Earth Engine with minimal API calls."""
        if not self.initialized:
            raise RuntimeError("Earth Engine not initialized")

        area_params = self._calculate_area_parameters(bounds)
        processing_params = self._get_processing_parameters(area_params)

        try:
            geometry = ee.Geometry.Rectangle(  # type: ignore[attr-defined]
                [bounds.west, bounds.south, bounds.east, bounds.north]
            )

            similarity_image = self._create_similarity_image(
                geometry, reference_year, target_year
            )

            visualized = self._create_visualization(
                similarity_image, geometry, processing_params
            )

            image_url, stats_data = await self._execute_earth_engine_batch(
                visualized, similarity_image, geometry, bounds, processing_params
            )

            return self._process_results(
                image_url, stats_data, bounds, processing_params
            )

        except Exception as e:
            logger.error(f"Error computing optimized similarity heatmap: {e}")
            raise RuntimeError(f"Failed to compute similarity heatmap: {e}") from e

    def _calculate_area_parameters(self, bounds: BoundingBox) -> dict[str, Any]:
        """Calculate area size and log processing estimates."""
        area_width = abs(bounds.east - bounds.west)
        area_height = abs(bounds.north - bounds.south)
        area_size = area_width * area_height

        logger.info(
            f"🗺️  Processing heatmap for area: {area_width:.3f}° × {area_height:.3f}° = {area_size:.6f}°²"
        )

        estimated_pixels = (area_width * 111000) * (area_height * 111000) / (10 * 10)
        logger.info(f"📊 Estimated pixels at 10m scale: ~{estimated_pixels:,.0f}")

        self._log_processing_time_estimate(area_size)

        return {
            "width": area_width,
            "height": area_height,
            "size": area_size,
            "estimated_pixels": estimated_pixels,
        }

    def _log_processing_time_estimate(self, area_size: float) -> None:
        """Log estimated processing time based on area size."""
        if area_size > 100:
            logger.warning(
                f"⚠️  Very large area ({area_size:.2f}°²) - processing may take 60+ seconds"
            )
        elif area_size > 25:
            logger.info(
                f"🔥 Large area ({area_size:.2f}°²) - processing may take 30-60 seconds"
            )
        elif area_size > 5:
            logger.info(
                f"📈 Medium area ({area_size:.2f}°²) - processing may take 15-30 seconds"
            )
        else:
            logger.info(
                f"⚡ Small area ({area_size:.2f}°²) - processing should complete in 5-15 seconds"
            )

    def _get_processing_parameters(self, area_params: dict[str, Any]) -> dict[str, Any]:
        """Determine adaptive scaling parameters based on area size."""
        area_size = area_params["size"]

        if area_size > 100:
            scale, dimensions = 2000, 256
        elif area_size > 25:
            scale, dimensions = 1000, 384
        elif area_size > 5:
            scale, dimensions = 500, 512
        elif area_size > 1:
            scale, dimensions = 200, 512
        else:
            scale, dimensions = 100, 512

        max_pixels, stats_scale = self._get_stats_parameters(area_size, scale)
        sample_grid_size = min(5, max(3, int(area_size * 10)))

        logger.info(
            f"📊 Using adaptive scale: {scale}m, dimensions: {dimensions}px for area {area_size:.6f}°²"
        )
        logger.info(
            f"🎯 Strategy: {'Speed-optimized' if area_size > 5 else 'Quality-optimized'}"
        )
        logger.info(f"🔧 MaxPixels: {max_pixels:,.0f}, stats scale: {stats_scale}m")

        return {
            "scale": scale,
            "dimensions": dimensions,
            "max_pixels": max_pixels,
            "stats_scale": stats_scale,
            "sample_grid_size": sample_grid_size,
            "area_size": area_size,
        }

    def _get_stats_parameters(self, area_size: float, scale: int) -> tuple[float, int]:
        """Get statistics computation parameters based on area size."""
        if area_size > 100:
            return 15e6, max(scale * 8, 1000)
        if area_size > 25:
            return 10e6, max(scale * 6, 500)
        if area_size > 5:
            return 5e6, max(scale * 4, 200)
        return 2e6, max(scale * 2, 100)

    def _create_similarity_image(
        self, geometry: Any, reference_year: int, target_year: int
    ) -> Any:
        """Create similarity image from Earth Engine data."""
        embeddings = ee.ImageCollection("GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL")  # type: ignore[attr-defined]

        reference_collection = embeddings.filter(
            ee.Filter.date(f"{reference_year}-01-01", f"{reference_year}-12-31")  # type: ignore[attr-defined]
        ).filterBounds(geometry)
        reference_mosaic = reference_collection.mosaic()

        target_collection = embeddings.filter(
            ee.Filter.date(f"{target_year}-01-01", f"{target_year}-12-31")  # type: ignore[attr-defined]
        ).filterBounds(geometry)
        target_mosaic = target_collection.mosaic()

        embedding_bands = [f"A{i:02d}" for i in range(64)]

        similarity_image = (
            reference_mosaic.select(embedding_bands)
            .multiply(target_mosaic.select(embedding_bands))
            .reduce("sum")
            .rename("similarity")
        )

        logger.info(
            f"📈 Computing pixel-wise similarity between {reference_year} and {target_year}"
        )

        return similarity_image

    def _create_visualization(
        self, similarity_image: Any, geometry: Any, processing_params: dict[str, Any]
    ) -> Any:
        """Create visualization parameters and visualized image."""
        stats = similarity_image.reduceRegion(
            reducer=ee.Reducer.minMax(),  # type: ignore[attr-defined]
            geometry=geometry,
            scale=processing_params["stats_scale"],
            maxPixels=int(processing_params["max_pixels"]),
            bestEffort=True,
        )

        min_val = stats.getNumber("similarity_min")
        max_val = stats.getNumber("similarity_max")

        logger.info(
            f"📈 Similarity range: {min_val.getInfo() if min_val else 'unknown'} to {max_val.getInfo() if max_val else 'unknown'}"
        )

        vis_params = {
            "min": min_val,
            "max": max_val,
            "palette": [
                "000004",
                "2C105C",
                "711F81",
                "B63679",
                "EE605E",
                "FDAE78",
                "FCFDBF",
            ],
        }

        return similarity_image.visualize(**vis_params)

    async def _execute_earth_engine_batch(
        self,
        visualized: Any,
        similarity_image: Any,
        geometry: Any,
        bounds: BoundingBox,
        processing_params: dict[str, Any],
    ) -> tuple[str, dict[str, Any]]:
        """Execute Earth Engine batch processing with fallback handling."""
        thumbnail_params = {
            "region": geometry,
            "dimensions": processing_params["dimensions"],
            "format": "png",
            "crs": "EPSG:4326",
        }

        sample_points = self._create_efficient_sample_grid(
            bounds, processing_params["sample_grid_size"]
        )
        sample_collection = ee.FeatureCollection(sample_points)  # type: ignore[attr-defined]

        sample_scale = max(processing_params["scale"], 30)
        sampled_stats = similarity_image.sampleRegions(
            collection=sample_collection,
            scale=sample_scale,
            projection="EPSG:4326",
            geometries=True,
        )

        logger.debug("⏳ Executing optimized Earth Engine batch...")
        logger.info(
            f"🔧 Using maxPixels: {int(processing_params['max_pixels']):,}, "
            f"stats scale: {processing_params['stats_scale']}m, sample scale: {sample_scale}m"
        )

        start_time = time.time()

        try:
            image_url = visualized.getThumbURL(thumbnail_params)
            stats_data = sampled_stats.getInfo()

        except Exception as e:
            image_url, stats_data = self._handle_processing_fallback(
                e, similarity_image, visualized, geometry, bounds, processing_params
            )

        fetch_time = time.time() - start_time
        logger.info(f"✅ Optimized batch completed in {fetch_time:.2f}s")

        return image_url, stats_data

    def _handle_processing_fallback(
        self,
        error: Exception,
        similarity_image: Any,
        visualized: Any,
        geometry: Any,
        bounds: BoundingBox,
        processing_params: dict[str, Any],
    ) -> tuple[str, dict[str, Any]]:
        """Handle processing errors with emergency fallback."""
        error_str = str(error).lower()

        if not any(
            keyword in error_str for keyword in ["too many pixels", "memory", "timeout"]
        ):
            raise error

        logger.warning(f"⚠️  Processing failed, applying emergency fallback: {error}")

        emergency_scale = max(processing_params["scale"] * 16, 2000)
        emergency_dimensions = max(64, processing_params["dimensions"] // 4)
        logger.info(
            f"🆘 Emergency fallback: scale={emergency_scale}m, dimensions={emergency_dimensions}px"
        )

        try:
            emergency_sample_points = self._create_efficient_sample_grid(bounds, 3)
            emergency_collection = ee.FeatureCollection(emergency_sample_points)  # type: ignore[attr-defined]

            stats_data = similarity_image.sampleRegions(
                collection=emergency_collection,
                scale=emergency_scale,
                projection="EPSG:4326",
                geometries=True,
            ).getInfo()

            image_url = visualized.getThumbURL(
                {
                    "region": geometry,
                    "dimensions": emergency_dimensions,
                    "format": "png",
                    "crs": "EPSG:4326",
                }
            )

            logger.info("⚙️  Emergency fallback successful")
            return image_url, stats_data

        except Exception as fallback_error:
            logger.error(f"❌ Emergency fallback also failed: {fallback_error}")
            raise RuntimeError(
                f"Area too large for processing. Try zooming in or selecting a smaller region. Original error: {error}"
            ) from error

    def _process_results(
        self,
        image_url: str,
        stats_data: dict[str, Any],
        bounds: BoundingBox,
        processing_params: dict[str, Any],
    ) -> dict[str, Any]:
        """Process Earth Engine results into final response format."""
        similarities, heatmap_grid = self._extract_similarity_data(stats_data)
        statistics = self._calculate_statistics(similarities)

        return {
            "type": "similarity_image",
            "image_url": image_url,
            "coordinates": [
                [bounds.west, bounds.north],
                [bounds.east, bounds.north],
                [bounds.east, bounds.south],
                [bounds.west, bounds.south],
            ],
            "grid": heatmap_grid,
            "grid_size": {
                "width": processing_params["sample_grid_size"],
                "height": processing_params["sample_grid_size"],
            },
            "bounds": bounds.dict(),
            "statistics": statistics,
        }

    def _extract_similarity_data(
        self, stats_data: dict[str, Any]
    ) -> tuple[list[float], list[dict[str, Any]]]:
        """Extract similarity values and grid data from stats."""
        similarities: list[float] = []
        heatmap_grid: list[dict[str, Any]] = []

        if not (stats_data and "features" in stats_data):
            logger.warning("⚠️  No valid similarity data points found")
            return similarities, heatmap_grid

        logger.info(f"📊 Processing {len(stats_data['features'])} sample points")

        for feature in stats_data["features"]:
            if not self._is_valid_feature(feature):
                continue

            coords = feature["geometry"]["coordinates"]
            similarity_value = feature["properties"].get("similarity", 0.0)

            if similarity_value is not None and coords and len(coords) >= 2:
                sim_float = float(similarity_value)
                similarities.append(sim_float)

                heatmap_grid.append(
                    {
                        "latitude": coords[1],
                        "longitude": coords[0],
                        "similarity": sim_float,
                        "change_magnitude": abs(sim_float),
                        "change_type": self._classify_change_optimized(sim_float),
                    }
                )

        return similarities, heatmap_grid

    def _is_valid_feature(self, feature: dict[str, Any]) -> bool:
        """Check if feature has required structure."""
        return bool(
            feature
            and "geometry" in feature
            and "properties" in feature
            and feature["geometry"]
            and "coordinates" in feature["geometry"]
        )

    def _calculate_statistics(self, similarities: list[float]) -> dict[str, float]:
        """Calculate similarity statistics."""
        if not similarities:
            return {
                "min_similarity": 0,
                "max_similarity": 0,
                "mean_similarity": 0,
                "std_similarity": 0,
            }

        min_sim, max_sim = min(similarities), max(similarities)
        mean_sim = sum(similarities) / len(similarities)
        variance = sum((x - mean_sim) ** 2 for x in similarities) / len(similarities)
        std_sim = variance**0.5

        logger.info(
            f"📈 Stats: min={min_sim:.3f}, max={max_sim:.3f}, mean={mean_sim:.3f}"
        )

        return {
            "min_similarity": min_sim,
            "max_similarity": max_sim,
            "mean_similarity": mean_sim,
            "std_similarity": std_sim,
        }

    async def fetch_satellite_embeddings(
        self,
        bounds: BoundingBox,
        year: int,
        num_points: int = 25,  # Reduced from 50 for faster processing
    ) -> List[SatelliteEmbedding]:
        """Fetch satellite embeddings for a given area and year."""
        if not self.initialized:
            raise RuntimeError("Earth Engine not initialized")

        try:
            geometry = ee.Geometry.Rectangle(  # type: ignore[attr-defined]
                [bounds.west, bounds.south, bounds.east, bounds.north]
            )

            collection = (
                ee.ImageCollection("GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL")  # type: ignore[attr-defined]
                .filterDate(f"{year}-01-01", f"{year}-12-31")
                .filterBounds(geometry)
            )

            image = collection.first()

            # Create random sample points
            sample_points = self._create_random_sample_points(bounds, num_points)

            # Sample embeddings at these points
            sample_collection = ee.FeatureCollection(sample_points)  # type: ignore[attr-defined]
            samples = image.sampleRegions(
                collection=sample_collection,
                scale=30,  # Increased from 10 for faster processing
                projection="EPSG:4326",
            )

            samples_data = samples.getInfo()

            # Process results
            embeddings = []
            for feature in samples_data["features"]:
                coords = feature["geometry"]["coordinates"]
                props = feature["properties"]

                # Extract 64-dimensional embedding vector
                embedding = []
                for i in range(64):
                    band_name = f"A{i:02d}"
                    embedding.append(float(props.get(band_name, 0)))

                # Calculate similarity score
                similarity = self._calculate_embedding_similarity(embedding)

                # Classify land use type
                land_use_type = self._classify_land_use_from_embedding(embedding)

                embeddings.append(
                    SatelliteEmbedding(
                        longitude=coords[0],
                        latitude=coords[1],
                        embedding=embedding,
                        similarity=min(1.0, similarity),
                        year=year,
                        type=land_use_type,
                        analysis_date=None,
                    )
                )

            return embeddings

        except Exception as e:
            logger.error(f"Error fetching satellite embeddings: {e}")
            raise RuntimeError(f"Failed to fetch satellite embeddings: {e}") from e

    def _create_sample_grid(self, bounds: BoundingBox, grid_size: int) -> List[Any]:
        """Create a grid of sample points."""
        points = []
        for i in range(grid_size):
            for j in range(grid_size):
                lat = bounds.south + (bounds.north - bounds.south) * (i / grid_size)
                lng = bounds.west + (bounds.east - bounds.west) * (j / grid_size)
                points.append(ee.Feature(ee.Geometry.Point([lng, lat])))  # type: ignore[attr-defined]
        return points

    def _create_efficient_sample_grid(
        self, bounds: BoundingBox, grid_size: int
    ) -> List[Any]:
        """Create an optimized grid of sample points with smart spacing."""
        points = []

        # Add corner points for better coverage
        corner_points = [
            [bounds.west, bounds.north],  # top-left
            [bounds.east, bounds.north],  # top-right
            [bounds.east, bounds.south],  # bottom-right
            [bounds.west, bounds.south],  # bottom-left
            [
                (bounds.west + bounds.east) / 2,
                (bounds.north + bounds.south) / 2,
            ],  # center
        ]

        for lng, lat in corner_points:
            points.append(ee.Feature(ee.Geometry.Point([lng, lat])))  # type: ignore[attr-defined]

        # Add regular grid points (reduced count)
        if grid_size > 5:
            step_size = max(2, grid_size // 3)  # Reduce sampling density
            for i in range(0, grid_size, step_size):
                for j in range(0, grid_size, step_size):
                    lat = bounds.south + (bounds.north - bounds.south) * (i / grid_size)
                    lng = bounds.west + (bounds.east - bounds.west) * (j / grid_size)
                    points.append(ee.Feature(ee.Geometry.Point([lng, lat])))  # type: ignore[attr-defined]

        return points

    def _create_random_sample_points(
        self, bounds: BoundingBox, num_points: int
    ) -> List[Any]:
        """Create random sample points within bounds."""
        points = []
        for _ in range(num_points):
            lat = bounds.south + (bounds.north - bounds.south) * np.random.random()
            lng = bounds.west + (bounds.east - bounds.west) * np.random.random()
            points.append(ee.Feature(ee.Geometry.Point([lng, lat])))  # type: ignore[attr-defined]
        return points

    def _classify_change(self, similarity: float) -> str:
        """Classify change type based on similarity score."""
        if similarity >= 0.8:
            return "high_similarity"
        if similarity <= -0.5:
            return "high_dissimilarity"
        return "moderate_change"

    def _classify_change_optimized(self, similarity: float) -> str:
        """Optimized change classification with fewer branches."""
        if similarity >= 0.7:
            return "stable"
        if similarity <= 0.3:
            return "changed"
        return "moderate"

    def _calculate_embedding_similarity(self, embedding: List[float]) -> float:
        """Calculate a simple similarity metric from embedding."""
        return sum(abs(val) for val in embedding) / len(embedding)

    def _classify_land_use_from_embedding(self, embedding: List[float]) -> str:
        """Classify land use type from embedding characteristics."""
        avg_value = np.mean(embedding)
        variance = np.var(embedding)

        if variance > 0.3:
            return "urban_expansion"
        if avg_value > 0.2:
            return "agricultural_change"
        if avg_value < -0.2:
            return "deforestation"
        if variance < 0.1:
            return "coastal_change"
        return "glacial_retreat"


# Global service instance
earth_engine_service = EarthEngineService()
