"""API routes."""

import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.llm_service import LLMQueryProcessor
from shared.logging_config import setup_module_logger


logger = setup_module_logger("kadal.api.routes")
llm_processor = LLMQueryProcessor()

router = APIRouter()


class MCPElevationRequest(BaseModel):
    """Request model for MCP elevation queries."""

    region: dict[str, Any]
    scale: int = 1000


class MCPQueryRequest(BaseModel):
    """Request model for general MCP queries."""

    query: str
    region: dict[str, Any]


@router.post("/mcp/elevation")
async def get_elevation_data(request: MCPElevationRequest) -> dict[str, Any]:
    """Get elevation data for a region using the MCP server."""
    logger.info(f"Processing elevation request for region: {request.region}")

    try:
        # Call the MCP server to get elevation statistics
        result = await call_mcp_server(
            "get_image_statistics",
            {
                "dataset_id": "USGS/SRTMGL1_003",
                "region": request.region,
                "scale": request.scale,
            },
        )

        logger.info("Elevation data retrieved successfully")
        return {
            "status": "success",
            "statistics": result.get("statistics", {}),
            "region": request.region,
            "scale": request.scale,
            "dataset": "USGS/SRTMGL1_003",
        }

    except Exception as e:
        logger.error(f"Failed to get elevation data: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process elevation request: {str(e)}"
        ) from e


@router.post("/mcp/query")
async def process_mcp_query(request: MCPQueryRequest) -> dict[str, Any]:
    """Process any Earth Engine query using LLM-powered analysis."""
    logger.info(f"Processing query with LLM: {request.query}")

    try:
        # Use LLM to analyze the query and determine appropriate actions
        analysis = await llm_processor.analyze_query(request.query, request.region)

        if not analysis.in_scope:
            logger.info(f"Query out of scope: {analysis.reasoning}")
            return {
                "status": "out_of_scope",
                "response": analysis.response_template,
                "reasoning": analysis.reasoning,
                "data": None,
            }

        # Execute the tool calls determined by the LLM
        results = []
        for tool_call in analysis.tool_calls:
            logger.info(f"Executing {tool_call.tool_name}: {tool_call.reasoning}")

            try:
                result = await call_mcp_server(
                    tool_call.tool_name, tool_call.parameters
                )
                results.append(
                    {
                        "tool": tool_call.tool_name,
                        "result": result,
                        "reasoning": tool_call.reasoning,
                    }
                )
                logger.info(f"Tool {tool_call.tool_name} result: {result}")  # Debug log
            except Exception as e:
                logger.error(f"Tool {tool_call.tool_name} failed: {e}")
                results.append(
                    {
                        "tool": tool_call.tool_name,
                        "error": str(e),
                        "reasoning": tool_call.reasoning,
                    }
                )

        # Format the response using the LLM's template and actual data
        response_text = await _format_response(
            analysis.response_template, results, request.query
        )

        return {
            "status": "success",
            "response": response_text,
            "data": results,
            "analysis": {
                "reasoning": analysis.reasoning,
                "tools_used": [tc.tool_name for tc in analysis.tool_calls],
            },
            "original_query": request.query,
        }

    except Exception as e:
        logger.error(f"Failed to process MCP query: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process query: {str(e)}"
        ) from e


async def _format_response(
    template: str, results: list[dict[str, Any]], query: str
) -> str:
    """Format the response using the results data."""
    try:
        # Extract key data from results for template formatting
        format_data = {}

        for result_item in results:
            if "result" in result_item:
                result = result_item["result"]

                # Extract geocoding results
                if "found" in result and result["found"]:
                    coords = result.get("coordinates", {})
                    format_data.update(
                        {
                            "location": result.get("location", "Unknown location"),
                            "latitude": coords.get("latitude", 0),
                            "longitude": coords.get("longitude", 0),
                        }
                    )

                # Extract Sentinel imagery results
                if "thumbnail_url" in result:
                    format_data.update(
                        {
                            "image_count": result.get("image_count", 0),
                            "date_range": result.get("date_range", ""),
                            "cloud_cover": result.get("cloud_cover_threshold", 0),
                        }
                    )

                # Extract statistics if available
                if "statistics" in result:
                    stats = result["statistics"]
                    if "elevation" in stats:
                        format_data.update(
                            {
                                "mean": stats["elevation"].get("mean", 0),
                                "min": stats["elevation"].get("min", 0),
                                "max": stats["elevation"].get("max", 0),
                                "stdDev": stats["elevation"].get("stdDev", 0),
                            }
                        )

                # Extract dataset info if available
                if "datasets" in result:
                    format_data["dataset_count"] = result.get("count", 0)
                    format_data["datasets"] = result.get("datasets", [])

        # Apply template formatting
        try:
            return template.format(**format_data)
        except KeyError:
            # If template formatting fails, return a contextual response
            if format_data.get("location"):
                return f"Navigating to {format_data['location']} ({format_data.get('latitude', 0):.4f}, {format_data.get('longitude', 0):.4f})"
            if format_data.get("image_count"):
                return f"Found {format_data['image_count']} Sentinel-2 images for this area. Note: Satellite imagery display requires full Earth Engine integration."
            if format_data.get("mean"):
                return (
                    f"Analysis complete. Average elevation: {format_data['mean']:.1f}m"
                )
            return "Earth Engine analysis completed successfully"

    except Exception as e:
        logger.warning(f"Response formatting failed: {e}")
        return "Earth Engine analysis completed"


async def call_mcp_server(tool_name: str, params: dict[str, Any]) -> dict[str, Any]:
    """Call the MCP server tool and return the result."""
    try:
        # For this POC, we'll simulate MCP server responses with realistic
        # Earth Engine data
        # In production, this would connect to the actual MCP server via MCP protocol
        logger.info(f"Simulating MCP call to {tool_name} with params: {params}")

        tool_handlers = {
            "get_image_statistics": _handle_image_statistics,
            "search_datasets": _handle_search_datasets,
            "get_dataset_info": _handle_dataset_info,
            "geocode_location": _handle_geocode_location,
            "get_sentinel_image": _handle_sentinel_image,
        }

        handler = tool_handlers.get(tool_name)
        if handler:
            return await handler(params)

        raise Exception(f"Unknown tool: {tool_name}")

    except Exception as e:
        logger.error(f"MCP server simulation error: {e}")
        raise


async def _handle_image_statistics(params: dict[str, Any]) -> dict[str, Any]:
    """Handle image statistics requests."""
    region = params.get("region", {})
    coordinates = region.get("coordinates", [])

    if len(coordinates) < 4:
        raise Exception("Invalid coordinates for image statistics")

    center_lon = (coordinates[0] + coordinates[2]) / 2
    center_lat = (coordinates[1] + coordinates[3]) / 2
    base_elevation = 500 + (abs(center_lat) * 20) + (abs(center_lon - 80) * 10)

    return {
        "status": "success",
        "statistics": {
            "elevation": {
                "mean": base_elevation,
                "min": base_elevation - 200,
                "max": base_elevation + 300,
                "stdDev": 150.5,
            }
        },
        "region": region,
        "dataset_id": params.get("dataset_id"),
    }


async def _handle_search_datasets(params: dict[str, Any]) -> dict[str, Any]:
    """Handle dataset search requests."""
    keywords = params.get("keywords", "")
    return {
        "status": "success",
        "count": 3,
        "datasets": [
            {"id": "USGS/SRTMGL1_003", "title": "SRTM Digital Elevation Model"},
            {
                "id": "USGS/GMTED2010",
                "title": "Global Multi-resolution Terrain Elevation",
            },
            {
                "id": "NASA/NASADEM_HGT/001",
                "title": "NASADEM Digital Elevation Model",
            },
        ],
        "keywords": keywords,
    }


async def _handle_dataset_info(params: dict[str, Any]) -> dict[str, Any]:
    """Handle dataset info requests."""
    dataset_id = params.get("dataset_id")
    return {
        "status": "success",
        "dataset_info": {
            "id": dataset_id,
            "title": "SRTM Digital Elevation Model 30m",
            "description": "Global digital elevation model with 30-meter resolution",
            "bands": [{"id": "elevation", "data_type": "int16", "units": "meters"}],
        },
    }


async def _handle_geocode_location(params: dict[str, Any]) -> dict[str, Any]:
    """Handle geocoding requests."""
    location_name = params.get("location_name", "")

    # Try Google Geocoding API first
    google_result = await _try_google_geocoding(location_name)
    if google_result:
        return google_result

    # Fallback to predefined locations
    return _get_fallback_location(location_name)


async def _try_google_geocoding(location_name: str) -> dict[str, Any] | None:
    """Try geocoding with Google API."""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return None

    try:
        base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        request_params = {"address": location_name, "key": api_key}

        response = httpx.get(base_url, params=request_params, timeout=10.0)
        if response.status_code != 200:
            return None

        data = response.json()
        if data["status"] != "OK" or not data["results"]:
            return None

        result = data["results"][0]
        location_data = result["geometry"]["location"]
        formatted_address = result["formatted_address"]
        zoom = _determine_zoom_level(result.get("types", []))

        return {
            "found": True,
            "location": formatted_address,
            "coordinates": {
                "latitude": location_data["lat"],
                "longitude": location_data["lng"],
                "zoom": zoom,
            },
        }
    except Exception as e:
        logger.warning(f"Google Geocoding API failed: {e}, using fallback")
        return None


def _determine_zoom_level(place_types: list[str]) -> int:
    """Determine appropriate zoom level based on place types."""
    zoom_mappings = [
        (["street_address", "premise", "point_of_interest"], 15),
        (["neighborhood", "sublocality"], 13),
        (["locality", "administrative_area_level_3"], 11),
        (["administrative_area_level_2", "administrative_area_level_1"], 9),
        (["country"], 6),
    ]

    for type_list, zoom in zoom_mappings:
        if any(t in place_types for t in type_list):
            return zoom

    return 10


def _get_fallback_location(location_name: str) -> dict[str, Any]:
    """Get location from fallback data."""
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
        "amazon rainforest": {"latitude": -3.4653, "longitude": -62.2159, "zoom": 7},
        "amazon": {"latitude": -3.4653, "longitude": -62.2159, "zoom": 7},
    }

    location_lower = location_name.lower().strip()

    if location_lower in fallback_locations:
        location = fallback_locations[location_lower]
        return {
            "found": True,
            "location": location_name,
            "coordinates": location,
        }

    # Try partial match
    for key, value in fallback_locations.items():
        if key in location_lower or location_lower in key:
            return {
                "found": True,
                "location": key.title(),
                "coordinates": value,
            }

    return {
        "found": False,
        "location": location_name,
        "error": (
            f"Location '{location_name}' not found. "
            "Try cities like Toronto, New York, London, etc."
        ),
    }


async def _handle_sentinel_image(params: dict[str, Any]) -> dict[str, Any]:
    """Handle sentinel image requests."""
    region = params.get("region", {})
    start_date = params.get("start_date", "2024-01-01")
    end_date = params.get("end_date", "2024-12-31")
    cloud_cover = params.get("cloud_cover", 30)

    return {
        "dataset_id": "COPERNICUS/S2_SR_HARMONIZED",
        "region": region,
        "date_range": f"{start_date} to {end_date}",
        "cloud_cover_threshold": cloud_cover,
        "image_count": 15,
        "visualization_params": {
            "bands": ["B4", "B3", "B2"],
            "min": 0,
            "max": 3000,
            "gamma": 1.4,
        },
        "type": "sentinel2_composite",
        "status": "simulated",
        "note": ("Satellite imagery display requires full Earth Engine integration"),
    }
