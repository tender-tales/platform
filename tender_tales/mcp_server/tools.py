"""Earth Engine tools for the MCP server."""

import os
from typing import Any, Optional

import aiohttp
import ee
from shared.logging_config import setup_module_logger

logger = setup_module_logger("kadal.mcp.tools")


class EarthEngineTools:
    """Tools for Google Earth Engine operations via MCP."""

    def __init__(self) -> None:
        """Initialize Earth Engine tools."""
        self.initialized = False
        self._ensure_initialized()

    def _ensure_initialized(self) -> None:
        """Ensure Earth Engine is initialized."""
        if not self.initialized:
            try:
                # Test if already initialized
                ee.Image("USGS/SRTMGL1_003").getInfo()
                self.initialized = True
            except Exception:
                # Not initialized, will be handled by main app
                pass

    async def get_dataset_info(self, dataset_id: str) -> dict[str, Any]:
        """Get information about an Earth Engine dataset."""
        try:
            logger.info(f"📊 Getting info for dataset: {dataset_id}")

            # Handle different dataset types
            if "/" in dataset_id:
                # Try as ImageCollection first, then Image
                try:
                    collection = ee.ImageCollection(dataset_id)
                    info = collection.getInfo()

                    # Get sample image info
                    first_image = collection.first()
                    sample_info = first_image.getInfo() if first_image else None

                    return {
                        "type": "ImageCollection",
                        "id": dataset_id,
                        "collection_info": {
                            "features": info.get("features", []),
                            "size": len(info.get("features", [])),
                        },
                        "sample_image": sample_info,
                    }
                except Exception:
                    # Try as Image
                    image = ee.Image(dataset_id)
                    info = image.getInfo()

                    return {
                        "type": "Image",
                        "id": dataset_id,
                        "bands": info.get("bands", []),
                        "properties": info.get("properties", {}),
                    }
            else:
                return {"error": f"Invalid dataset ID format: {dataset_id}"}

        except Exception as e:
            logger.error(f"Error getting dataset info: {e}")
            return {"error": f"Failed to get dataset info: {str(e)}"}

    async def search_datasets(self, keywords: str, limit: int = 10) -> dict[str, Any]:
        """Search for Earth Engine datasets by keywords."""
        try:
            logger.info(f"🔍 Searching datasets for: {keywords}")

            # Common Earth Engine datasets categorized by conservation themes
            conservation_datasets = {
                "forest": [
                    "MODIS/006/MOD44B",  # Forest cover
                    "UMD/hansen/global_forest_change_2023_v1_11",  # Global forest change
                    "COPERNICUS/Landcover/100m/Proba-V-C3/Global",  # Land cover
                ],
                "water": [
                    "JRC/GSW1_4/GlobalSurfaceWater",  # Global surface water
                    "MODIS/006/MOD44W",  # Water mask
                    "LANDSAT/LC08/C02/T1_L2",  # Landsat for water analysis
                ],
                "climate": [
                    "ECMWF/ERA5_LAND/HOURLY",  # Climate reanalysis
                    "NASA/GLDAS/V021/NOAH/G025/T3H",  # Land data assimilation
                    "MODIS/006/MOD11A1",  # Land surface temperature
                ],
                "agriculture": [
                    "MODIS/006/MCD12Q1",  # Land cover classification
                    "COPERNICUS/S2_SR_HARMONIZED",  # Sentinel-2 for crop monitoring
                    "MODIS/006/MOD13Q1",  # Vegetation indices
                ],
                "urban": [
                    "MODIS/006/MCD12Q1",  # Urban land cover
                    "LANDSAT/LC08/C02/T1_L2",  # Landsat for urban analysis
                    "COPERNICUS/S1_GRD",  # SAR for urban monitoring
                ],
            }

            # Search in categories based on keywords
            keywords_lower = keywords.lower()
            results = []

            for category, datasets in conservation_datasets.items():
                if any(keyword in category for keyword in keywords_lower.split()):
                    for dataset_id in datasets[:limit]:
                        try:
                            # Get basic info about the dataset
                            info = await self.get_dataset_info(dataset_id)
                            results.append(
                                {"id": dataset_id, "category": category, "info": info}
                            )
                            if len(results) >= limit:
                                break
                        except Exception as e:
                            logger.warning(f"Could not get info for {dataset_id}: {e}")
                            continue

                if len(results) >= limit:
                    break

            return {"query": keywords, "results": results, "count": len(results)}

        except Exception as e:
            logger.error(f"Error searching datasets: {e}")
            return {"error": f"Failed to search datasets: {str(e)}"}

    async def get_image_statistics(
        self, dataset_id: str, region: dict[str, Any], scale: int = 1000
    ) -> dict[str, Any]:
        """Calculate statistics for an Earth Engine image over a region."""
        try:
            logger.info(f"📈 Computing statistics for {dataset_id} at scale {scale}m")

            # Create geometry from region
            if region["type"] == "rectangle":
                coords = region["coordinates"]  # [west, south, east, north]
                geometry = ee.Geometry.Rectangle(coords)
            else:
                return {"error": f"Unsupported region type: {region['type']}"}

            # Get the image
            if dataset_id.count("/") >= 2:
                # ImageCollection - get first image
                collection = ee.ImageCollection(dataset_id)
                image = collection.first()
            else:
                # Single image
                image = ee.Image(dataset_id)

            # Compute statistics
            stats = image.reduceRegion(
                reducer=ee.Reducer.mean()
                .combine(reducer2=ee.Reducer.minMax(), sharedInputs=True)
                .combine(reducer2=ee.Reducer.stdDev(), sharedInputs=True),
                geometry=geometry,
                scale=scale,
                maxPixels=1e9,
            )

            stats_result = stats.getInfo()

            return {
                "dataset_id": dataset_id,
                "region": region,
                "scale": scale,
                "statistics": stats_result,
            }

        except Exception as e:
            logger.error(f"Error computing statistics: {e}")
            return {"error": f"Failed to compute statistics: {str(e)}"}

    async def visualize_image(
        self,
        dataset_id: str,
        region: dict[str, Any],
        visualization: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Create a visualization URL for an Earth Engine image."""
        try:
            logger.info(f"🎨 Creating visualization for {dataset_id}")

            # Create geometry from region
            if region["type"] == "rectangle":
                coords = region["coordinates"]  # [west, south, east, north]
                geometry = ee.Geometry.Rectangle(coords)
            else:
                return {"error": f"Unsupported region type: {region['type']}"}

            # Get the image
            if dataset_id.count("/") >= 2:
                # ImageCollection - get first image
                collection = ee.ImageCollection(dataset_id)
                image = collection.first()
            else:
                # Single image
                image = ee.Image(dataset_id)

            # Apply visualization parameters
            vis_params = visualization or {}

            # Default visualization if none provided
            if not vis_params:
                # Get image info to determine default bands
                info = image.getInfo()
                bands = [band["id"] for band in info.get("bands", [])[:3]]
                vis_params = {
                    "bands": bands,
                    "min": 0,
                    "max": 3000,  # Default for many satellite images
                }

            # Create visualization
            vis_image = image.visualize(**vis_params)

            # Get thumbnail URL
            thumbnail_params = {"region": geometry, "dimensions": 512, "format": "png"}

            thumbnail_url = vis_image.getThumbURL(thumbnail_params)

            return {
                "dataset_id": dataset_id,
                "region": region,
                "visualization_params": vis_params,
                "thumbnail_url": thumbnail_url,
            }

        except Exception as e:
            logger.error(f"Error creating visualization: {e}")
            return {"error": f"Failed to create visualization: {str(e)}"}

    async def get_sentinel_image(
        self,
        region: dict[str, Any],
        start_date: str,
        end_date: str,
        cloud_cover: int = 30,
    ) -> dict[str, Any]:
        """Get Sentinel-2 satellite imagery for a region."""
        try:
            logger.info(f"🛰️  Fetching Sentinel-2 data from {start_date} to {end_date}")

            # Create geometry from region
            if region["type"] == "rectangle":
                coords = region["coordinates"]  # [west, south, east, north]
                geometry = ee.Geometry.Rectangle(coords)
            else:
                return {"error": f"Unsupported region type: {region['type']}"}

            # Get Sentinel-2 collection
            sentinel2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")

            # Filter collection
            filtered = (
                sentinel2.filterBounds(geometry)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_cover))
            )

            # Get the median composite
            median_image = filtered.median()

            # Create visualization parameters for natural color
            vis_params = {
                "bands": ["B4", "B3", "B2"],  # RGB
                "min": 0,
                "max": 3000,
                "gamma": 1.4,
            }

            # Create visualization
            vis_image = median_image.visualize(**vis_params)

            # Get thumbnail URL
            thumbnail_params = {"region": geometry, "dimensions": 1024, "format": "png"}

            thumbnail_url = vis_image.getThumbURL(thumbnail_params)

            # Get collection info
            collection_info = filtered.getInfo()
            image_count = len(collection_info.get("features", []))

            return {
                "dataset_id": "COPERNICUS/S2_SR_HARMONIZED",
                "region": region,
                "date_range": f"{start_date} to {end_date}",
                "cloud_cover_threshold": cloud_cover,
                "image_count": image_count,
                "visualization_params": vis_params,
                "thumbnail_url": thumbnail_url,
                "type": "sentinel2_composite",
            }

        except Exception as e:
            logger.error(f"Error getting Sentinel-2 imagery: {e}")
            return {"error": f"Failed to get Sentinel-2 imagery: {str(e)}"}

    async def geocode_location(self, location_name: str) -> dict[str, Any]:
        """Geocode a location name to coordinates using Google Geocoding API."""
        try:
            logger.info(f"🗺️  Geocoding location: {location_name}")

            # Use Google Geocoding API

            api_key = os.getenv("GOOGLE_MAPS_API_KEY")
            if not api_key:
                logger.warning(
                    "Google Maps API key not found, using fallback locations"
                )
                return await self._fallback_geocoding(location_name)

            # Call Google Geocoding API
            base_url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {"address": location_name, "key": api_key}

            async with (
                aiohttp.ClientSession() as session,
                session.get(base_url, params=params) as response,
            ):
                if response.status == 200:
                    data = await response.json()

                    if data["status"] == "OK" and data["results"]:
                        result = data["results"][0]
                        location_data = result["geometry"]["location"]
                        formatted_address = result["formatted_address"]

                        # Determine appropriate zoom level based on location type
                        zoom = self._determine_zoom_level(result.get("types", []))

                        return {
                            "found": True,
                            "location": formatted_address,
                            "coordinates": {
                                "latitude": location_data["lat"],
                                "longitude": location_data["lng"],
                                "zoom": zoom,
                            },
                            "address_components": result.get("address_components", []),
                            "place_types": result.get("types", []),
                        }
                    logger.warning(
                        f"Geocoding failed: {data.get('status', 'Unknown error')}"
                    )
                    return await self._fallback_geocoding(location_name)
                logger.error(f"Geocoding API error: {response.status}")
                return await self._fallback_geocoding(location_name)

        except Exception as e:
            logger.error(f"Error geocoding location: {e}")
            return await self._fallback_geocoding(location_name)

    def _determine_zoom_level(self, place_types: list[str]) -> int:
        """Determine appropriate zoom level based on place types."""
        # Mapping of place types to zoom levels (higher zoom = more specific)
        zoom_mappings = [
            (["street_address", "premise", "point_of_interest"], 15),
            (["neighborhood", "sublocality"], 13),
            (["locality", "administrative_area_level_3"], 11),
            (["administrative_area_level_2", "administrative_area_level_1"], 9),
            (["natural_feature", "park"], 8),
            (["country"], 6),
        ]

        for type_list, zoom in zoom_mappings:
            if any(t in place_types for t in type_list):
                return zoom

        return 10  # Default city-level zoom

    async def _fallback_geocoding(self, location_name: str) -> dict[str, Any]:
        """Fallback geocoding using hardcoded common locations."""
        logger.info(f"Using fallback geocoding for: {location_name}")

        # Essential locations as fallback
        fallback_locations = {
            "toronto": {"latitude": 43.6532, "longitude": -79.3832, "zoom": 10},
            "new york": {"latitude": 40.7128, "longitude": -74.0060, "zoom": 10},
            "nyc": {"latitude": 40.7128, "longitude": -74.0060, "zoom": 10},
            "london": {"latitude": 51.5074, "longitude": -0.1278, "zoom": 10},
            "paris": {"latitude": 48.8566, "longitude": 2.3522, "zoom": 10},
            "tokyo": {"latitude": 35.6762, "longitude": 139.6503, "zoom": 10},
            "sydney": {"latitude": -33.8688, "longitude": 151.2093, "zoom": 10},
            "san francisco": {"latitude": 37.7749, "longitude": -122.4194, "zoom": 10},
            "sf": {"latitude": 37.7749, "longitude": -122.4194, "zoom": 10},
            "los angeles": {"latitude": 34.0522, "longitude": -118.2437, "zoom": 10},
            "la": {"latitude": 34.0522, "longitude": -118.2437, "zoom": 10},
            "mumbai": {"latitude": 19.0760, "longitude": 72.8777, "zoom": 10},
            "delhi": {"latitude": 28.7041, "longitude": 77.1025, "zoom": 10},
            "chennai": {"latitude": 13.0827, "longitude": 80.2707, "zoom": 10},
            "bangalore": {"latitude": 12.9716, "longitude": 77.5946, "zoom": 10},
            "amazon rainforest": {
                "latitude": -3.4653,
                "longitude": -62.2159,
                "zoom": 7,
            },
            "amazon": {"latitude": -3.4653, "longitude": -62.2159, "zoom": 7},
        }

        location_lower = location_name.lower().strip()

        # Exact match
        if location_lower in fallback_locations:
            location = fallback_locations[location_lower]
            return {
                "found": True,
                "location": location_name,
                "coordinates": {
                    "latitude": location["latitude"],
                    "longitude": location["longitude"],
                    "zoom": location["zoom"],
                },
            }

        # Partial match
        for key, value in fallback_locations.items():
            if key in location_lower or location_lower in key:
                return {
                    "found": True,
                    "location": key.title(),
                    "coordinates": {
                        "latitude": value["latitude"],
                        "longitude": value["longitude"],
                        "zoom": value["zoom"],
                    },
                }

        # Not found
        return {
            "found": False,
            "location": location_name,
            "error": f"Location '{location_name}' not found. Try cities like Toronto, New York, London, etc.",
        }

    async def analyze_land_cover_change(
        self, region: dict[str, Any], start_date: str, end_date: str
    ) -> dict[str, Any]:
        """Analyze land cover changes between two time periods."""
        try:
            logger.info(
                f"🌱 Analyzing land cover change from {start_date} to {end_date}"
            )

            # Create geometry from region
            if region["type"] == "rectangle":
                coords = region["coordinates"]  # [west, south, east, north]
                geometry = ee.Geometry.Rectangle(coords)
            else:
                return {"error": f"Unsupported region type: {region['type']}"}

            # Use Hansen Global Forest Change dataset
            hansen = ee.Image("UMD/hansen/global_forest_change_2023_v1_11")

            # Calculate forest loss area
            forest_loss = hansen.select("lossyear")

            # Convert years to match the date range
            start_year = int(start_date[:4])
            end_year = int(end_date[:4])

            # Hansen dataset uses years 2000-2023, encoded as 0-23
            hansen_start = max(0, start_year - 2000)
            hansen_end = min(23, end_year - 2000)

            # Create mask for loss in the period
            loss_in_period = forest_loss.gte(hansen_start).And(
                forest_loss.lte(hansen_end)
            )

            # Calculate statistics
            stats = loss_in_period.reduceRegion(
                reducer=ee.Reducer.sum().combine(
                    reducer2=ee.Reducer.count(), sharedInputs=True
                ),
                geometry=geometry,
                scale=30,  # Hansen is at 30m resolution
                maxPixels=1e9,
            )

            stats_result = stats.getInfo()

            # Calculate areas (30m pixels)
            pixel_area = 30 * 30  # square meters
            loss_pixels = stats_result.get("lossyear_sum", 0)
            total_pixels = stats_result.get("lossyear_count", 0)

            loss_area_ha = (loss_pixels * pixel_area) / 10000  # Convert to hectares
            total_area_ha = (total_pixels * pixel_area) / 10000

            return {
                "analysis_type": "forest_cover_change",
                "region": region,
                "time_period": f"{start_date} to {end_date}",
                "results": {
                    "forest_loss_hectares": round(loss_area_ha, 2),
                    "total_area_hectares": round(total_area_ha, 2),
                    "loss_percentage": round((loss_area_ha / total_area_ha * 100), 2)
                    if total_area_ha > 0
                    else 0,
                    "raw_stats": stats_result,
                },
            }

        except Exception as e:
            logger.error(f"Error analyzing land cover change: {e}")
            return {"error": f"Failed to analyze land cover change: {str(e)}"}
