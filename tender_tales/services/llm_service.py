"""LLM service for intelligent query processing."""

import json
from typing import Any, Dict, List

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel

from api.config import settings
from services.logging_config import setup_module_logger


logger = setup_module_logger("kadal.services.llm")


class ToolCall(BaseModel):
    """Model for tool call decisions."""

    tool_name: str
    parameters: Dict[str, Any]
    reasoning: str


class QueryAnalysis(BaseModel):
    """Model for query analysis results."""

    in_scope: bool
    reasoning: str
    tool_calls: List[ToolCall]
    response_template: str


class LLMQueryProcessor:
    """LLM-powered query processor for Earth Engine operations."""

    def __init__(self) -> None:
        """Initialize the LLM query processor."""
        if not settings.anthropic_api_key:
            logger.warning("Anthropic API key not configured - LLM features disabled")
            self.llm = None
        else:
            self.llm = ChatAnthropic(
                model="claude-3-5-sonnet-20241022",
                api_key=settings.anthropic_api_key,
                temperature=0.1,
            )
            logger.info("LLM query processor initialized with Claude 3.5 Sonnet")

    async def analyze_query(self, query: str, region: Dict[str, Any]) -> QueryAnalysis:
        """Analyze a user query and determine appropriate Earth Engine operations."""
        if not self.llm:
            # Fallback for when LLM is not available
            return self._fallback_analysis(query, region)

        logger.info(f"Analyzing query with LLM: {query}")

        system_prompt = """You are an expert in Google Earth Engine and geospatial analysis.

Your task is to analyze user queries and determine:
1. Whether the query is within scope for Earth Engine analysis
2. Which Earth Engine tools should be used
3. What parameters to pass to those tools

Available Earth Engine tools:
- get_dataset_info: Get information about a specific Earth Engine dataset
- search_datasets: Search for datasets by keywords
- get_image_statistics: Calculate statistics for an image over a region
- analyze_land_cover_change: Analyze land cover changes over time
- visualize_image: Create visualization URLs for images
- get_sentinel_image: Get Sentinel-2 satellite imagery for a region
- geocode_location: Convert location names to coordinates for navigation (USE THIS for "Go to [location]" queries)

IN SCOPE queries include:
- Elevation, terrain, topography analysis
- Land cover analysis and changes
- Satellite imagery requests (especially Sentinel-2)
- Environmental monitoring
- Dataset searches
- Geographic statistics
- Location search and navigation requests
- "Go to [location]" requests - ALWAYS use geocode_location tool for these
- "Show satellite data/imagery for this area" requests - use get_sentinel_image for these

CRITICAL LOCATION EXTRACTION RULES:
- "Go to Toronto" → extract "Toronto" → use geocode_location with {"location_name": "Toronto"}
- "Go to New York City" → extract "New York City" → use geocode_location with {"location_name": "New York City"}
- "Navigate to Amazon rainforest" → extract "Amazon rainforest" → use geocode_location with {"location_name": "Amazon rainforest"}
- "Show me Paris" → extract "Paris" → use geocode_location with {"location_name": "Paris"}

LOCATION EXTRACTION PATTERNS:
- "Go to X" → location_name = "X"
- "Navigate to X" → location_name = "X"
- "Show me X" → location_name = "X"
- "Take me to X" → location_name = "X"

SATELLITE IMAGERY:
- "Show satellite data" = use get_sentinel_image tool
- "Show satellite imagery" = use get_sentinel_image tool

PARAMETER VALIDATION:
- NEVER pass empty strings to location_name
- ALWAYS extract the actual place name from the query
- Remove articles like "the" but keep full place names

OUT OF SCOPE queries include:
- Weather forecasting
- Real-time data (Earth Engine is historical)
- Non-geospatial requests
- Personal information requests
- General web searches

Respond with JSON in this exact format:
{
  "in_scope": boolean,
  "reasoning": "explanation of why query is in/out of scope",
  "tool_calls": [
    {
      "tool_name": "tool_name",
      "parameters": {"param1": "value1"},
      "reasoning": "why this tool is appropriate"
    }
  ],
  "response_template": "template for formatting the response to user"
}"""

        human_prompt = f"""User query: "{query}"

Geographic region: {json.dumps(region)}

Analyze this query and determine the appropriate Earth Engine operations."""

        try:
            response = await self.llm.ainvoke(
                [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=human_prompt),
                ]
            )

            # Parse the JSON response
            result_json = json.loads(str(response.content))

            return QueryAnalysis(
                in_scope=result_json["in_scope"],
                reasoning=result_json["reasoning"],
                tool_calls=[ToolCall(**tc) for tc in result_json["tool_calls"]],
                response_template=result_json["response_template"],
            )

        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            # Fallback to rule-based analysis
            return self._fallback_analysis(query, region)

    def _fallback_analysis(self, query: str, region: Dict[str, Any]) -> QueryAnalysis:
        """Fallback analysis when LLM is not available."""
        query_lower = query.lower()

        # Simple rule-based scope checking
        earth_engine_keywords = [
            "elevation",
            "terrain",
            "satellite",
            "land cover",
            "forest",
            "vegetation",
            "ndvi",
            "temperature",
            "precipitation",
            "dataset",
            "image",
            "analysis",
            "statistics",
            "visualization",
            "topography",
            "go to",
            "show me",
            "navigate",
            "location",
            "sentinel",
            "imagery",
        ]

        location_keywords = ["go to", "navigate to", "find", "location"]
        satellite_keywords = [
            "satellite",
            "sentinel",
            "imagery",
            "image",
            "show satellite",
            "show me satellite",
            "show me imagery",
        ]

        in_scope = any(keyword in query_lower for keyword in earth_engine_keywords)

        if not in_scope:
            return QueryAnalysis(
                in_scope=False,
                reasoning="Query does not relate to Earth Engine geospatial analysis capabilities",
                tool_calls=[],
                response_template="I can help with Earth Engine analysis like elevation data, land cover, satellite imagery, location search, and environmental monitoring. Please ask about geospatial or environmental data.",
            )

        # Check for location-based queries
        if any(keyword in query_lower for keyword in location_keywords):
            # Extract location name (improved approach)
            location_name = ""

            # Try patterns like "go to Toronto", "navigate to Paris"
            if "go to " in query_lower:
                location_name = query_lower.split("go to ", 1)[1].strip()
            elif "navigate to " in query_lower:
                location_name = query_lower.split("navigate to ", 1)[1].strip()
            else:
                # Fallback: extract everything after common location words
                words = query.split()
                for i, word in enumerate(words):
                    if word.lower() in ["to", "me"] and i + 1 < len(words):
                        location_name = " ".join(words[i + 1 :])
                        break

            if not location_name:
                location_name = query.strip()  # fallback to entire query

            return QueryAnalysis(
                in_scope=True,
                reasoning=f"Location search query for: {location_name}",
                tool_calls=[
                    ToolCall(
                        tool_name="geocode_location",
                        parameters={"location_name": location_name.strip()},
                        reasoning="Geocoding location to navigate map viewport",
                    )
                ],
                response_template="Navigating to {location}",
            )

        # Check for satellite imagery queries
        if any(keyword in query_lower for keyword in satellite_keywords):
            return QueryAnalysis(
                in_scope=True,
                reasoning="Satellite imagery request for current area",
                tool_calls=[
                    ToolCall(
                        tool_name="get_sentinel_image",
                        parameters={
                            "region": region,
                            "start_date": "2024-01-01",
                            "end_date": "2024-12-31",
                            "cloud_cover": 30,
                        },
                        reasoning="Fetching Sentinel-2 satellite imagery for the region",
                    )
                ],
                response_template="Showing Sentinel-2 satellite imagery for this area with {image_count} images available",
            )

        # Default to elevation analysis for other in-scope queries
        return QueryAnalysis(
            in_scope=True,
            reasoning="Query relates to geospatial analysis - using elevation data as example",
            tool_calls=[
                ToolCall(
                    tool_name="get_image_statistics",
                    parameters={
                        "dataset_id": "USGS/SRTMGL1_003",
                        "region": region,
                        "scale": 1000,
                    },
                    reasoning="Elevation analysis provides foundational terrain information",
                )
            ],
            response_template="Elevation analysis: {mean:.1f}m average height in this region",
        )
