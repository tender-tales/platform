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


class MCPQueryRequest(BaseModel):
    """Request model for general MCP queries."""

    query: str
    region: dict[str, Any]


@router.post("/mcp/query")
async def process_mcp_query(request: MCPQueryRequest) -> dict[str, Any]:
    """Process location queries using LLM-powered analysis."""
    logger.info(f"Processing query: {request.query}")

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

    except ValueError as e:
        # Handle missing API key
        logger.error(f"LLM service unavailable: {e}")
        return {
            "status": "service_unavailable",
            "response": "AI assistant is currently unavailable. Please configure ANTHROPIC_API_KEY to enable intelligent query processing.",
            "error": str(e),
            "data": None,
        }
    except RuntimeError as e:
        # Handle LLM processing errors
        logger.error(f"LLM analysis failed: {e}")
        return {
            "status": "analysis_failed",
            "response": "Failed to analyze your query. Please try rephrasing your request or check the system configuration.",
            "error": str(e),
            "data": None,
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

        # Apply template formatting
        try:
            return template.format(**format_data)
        except KeyError:
            # If template formatting fails, return a contextual response
            if format_data.get("location"):
                return f"Navigating to {format_data['location']} ({format_data.get('latitude', 0):.4f}, {format_data.get('longitude', 0):.4f})"
            return "Location query completed successfully"

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
            "geocode_location": _handle_geocode_location,
        }

        handler = tool_handlers.get(tool_name)
        if handler:
            return await handler(params)

        raise Exception(f"Unknown tool: {tool_name}")

    except Exception as e:
        logger.error(f"MCP server simulation error: {e}")
        raise


async def _handle_geocode_location(params: dict[str, Any]) -> dict[str, Any]:
    """Handle geocoding requests."""
    location_name = params.get("location_name", "")

    # Try Google Geocoding API
    google_result = await _try_google_geocoding(location_name)
    if google_result:
        return google_result

    # No fallback - return not found
    return {
        "found": False,
        "location": location_name,
        "error": f"Location '{location_name}' not found. Please ensure you have a valid Google Maps API key configured.",
    }


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
        logger.warning(f"Google Geocoding API failed: {e}")
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
