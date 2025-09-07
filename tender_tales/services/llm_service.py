"""LLM service for intelligent query processing."""

import json
from typing import Any, Dict, List

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel

from api.config import settings
from shared.logging_config import setup_module_logger


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
            # Return error when LLM is not available - no manual fallback
            raise ValueError(
                "LLM service is not available. Please configure ANTHROPIC_API_KEY."
            )

        logger.info(f"Analyzing query with LLM: {query}")

        system_prompt = """You are an expert in Google Earth Engine and geospatial analysis.

Your task is to analyze user queries and determine:
1. Whether the query is within scope for Earth Engine analysis
2. Which Earth Engine tools should be used
3. What parameters to pass to those tools

Currently available Earth Engine tools:
- geocode_location: Convert location names to coordinates for navigation (USE THIS for "Go to [location]" queries)

CURRENTLY SUPPORTED (IN SCOPE) queries:
- Location search and navigation requests
- "Go to [location]" requests - ALWAYS use geocode_location tool for these
- "Show me [location]" requests
- "Navigate to [location]" requests
- "Find [location]" requests

PLANNED BUT NOT YET IMPLEMENTED (OUT OF SCOPE for now):
- Elevation, terrain, topography analysis
- Land cover analysis and changes
- Satellite imagery requests
- Environmental monitoring
- Dataset searches
- Geographic statistics

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

PARAMETER VALIDATION:
- NEVER pass empty strings to location_name
- ALWAYS extract the actual place name from the query
- Remove articles like "the" but keep full place names

OUT OF SCOPE queries include:
- Weather forecasting
- Real-time data requests
- Non-geospatial requests
- Personal information requests
- General web searches
- Elevation/terrain analysis (not yet implemented)
- Satellite imagery requests (not yet implemented)
- Land cover analysis (not yet implemented)
- Environmental monitoring (not yet implemented)

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
            # Re-raise the exception since we don't have a fallback
            raise RuntimeError(f"Failed to analyze query with LLM: {str(e)}") from e
