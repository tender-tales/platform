"""LLM service for intelligent query processing."""

import json
from typing import Any, Dict, List, Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from pydantic import BaseModel

from api.config import settings
from shared.logging_config import setup_module_logger


logger = setup_module_logger("kadal.services.llm")


class ToolCall(BaseModel):
    """Model for tool call decisions."""

    tool_name: str
    parameters: Dict[str, Any]
    reasoning: str


class SatelliteImageryRequirement(BaseModel):
    """Model for satellite imagery requirements."""

    enabled: bool
    visualization: str


class QueryAnalysis(BaseModel):
    """Model for query analysis results."""

    in_scope: bool
    reasoning: str
    tool_calls: List[ToolCall]
    response_template: str
    requires_satellite_imagery: SatelliteImageryRequirement


class LLMQueryProcessor:
    """LLM-powered query processor for Earth Engine operations."""

    def __init__(self) -> None:
        """Initialize the LLM query processor."""
        if not settings.anthropic_api_key:
            logger.warning("Anthropic API key not configured - LLM features disabled")
            self.llm = None
        else:
            self.llm = ChatAnthropic(
                model="claude-sonnet-4-0",  # Use alias for latest Sonnet 4
                api_key=settings.anthropic_api_key,
                temperature=0.0,  # Use 0.0 for deterministic tool selection
                max_tokens=1024,  # Limit response size for tool selection
            )
            logger.info(
                "LLM query processor initialized with Claude Sonnet 4 (claude-sonnet-4-0)"
            )

    async def analyze_query(
        self,
        query: str,
        region: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> QueryAnalysis:
        """Analyze a user query and determine appropriate Earth Engine operations."""
        if not self.llm:
            # Return error when LLM is not available - no manual fallback
            raise ValueError(
                "LLM service is not available. Please configure ANTHROPIC_API_KEY."
            )

        logger.info(f"Analyzing query with LLM: {query}")

        # Build proper conversation history for LangChain
        messages: List[BaseMessage] = []

        # Add conversation history if available
        if conversation_history:
            logger.info(
                f"Processing {len(conversation_history)} conversation history messages"
            )
            for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                if msg.get("role") == "user" and msg.get("content"):
                    messages.append(HumanMessage(content=msg["content"]))
                    logger.debug(f"Added user message: {msg['content'][:50]}...")
                elif msg.get("role") == "assistant" and msg.get("content"):
                    messages.append(AIMessage(content=msg["content"]))
                    logger.debug(f"Added assistant message: {msg['content'][:50]}...")

        system_prompt = """You are Kadal, an expert conversational AI assistant for Google Earth Engine and geospatial analysis.

Your task is to analyze user queries and determine:
1. Whether the query is within scope for Earth Engine analysis
2. Which Earth Engine tool(s) should be used
3. What parameters to pass to that tool

You have access to conversation history, so you can:
- Reference previous queries and responses
- Understand context like "show me the same thing here" or "apply that visualization to this area"
- Remember recent locations and visualizations discussed
- Provide contextual responses based on the ongoing conversation

CRITICAL PRINCIPLE: USE TOOLS BASED ON USER'S INTENT AND CONVERSATIONAL CONTEXT.
- Navigation requests = geocode_location ONLY
- Satellite imagery with specific location names = geocode_location FIRST, then get_satellite_imagery
- Satellite imagery for current viewport = get_satellite_imagery ONLY (with bounds from region)
- Context-aware requests = analyze previous conversation for intent and preferences

Currently available Earth Engine tools:
- geocode_location: Convert location names to coordinates for navigation
- get_satellite_imagery: Retrieve Sentinel-2 satellite imagery for any region

INTELLIGENT QUERY INTERPRETATION:

VIEWPORT-BASED QUERIES (use get_satellite_imagery with current region bounds):
- "Show false color here" → get_satellite_imagery with current region bounds
- "Apply NDVI to this area" → get_satellite_imagery with current region bounds
- "I want to see false color for this view" → get_satellite_imagery with current region bounds
- "Show me NDVI of the current area" → get_satellite_imagery with current region bounds
- "What does this area look like in false color?" → get_satellite_imagery with current region bounds
- "Same visualization but here" → get_satellite_imagery with current region bounds
- "Show satellite imagery for this region" → get_satellite_imagery with current region bounds

NAVIGATION + IMAGERY QUERIES (use geocode_location FIRST, then satellite imagery):
- "Show me NDVI for Central Park" → geocode_location + satellite imagery
- "Display the Amazon rainforest in false color" → geocode_location + satellite imagery
- "Take me to California and show satellite view" → geocode_location + satellite imagery

NAVIGATION ONLY QUERIES (use geocode_location ONLY):
- "Go to [location]" → geocode_location ONLY
- "Navigate to [location]" → geocode_location ONLY
- "Take me to [location]" → geocode_location ONLY
- "Find [location]" → geocode_location ONLY
- "Where is [location]" → geocode_location ONLY

STEP-BY-STEP ANALYSIS:

1. ANALYZE USER INTENT:
   - Are they asking about a SPECIFIC LOCATION (place name)? → Use geocode_location
   - Are they asking about CURRENT VIEW/AREA/REGION? → Use get_satellite_imagery with region bounds
   - Are they using context words like "here", "this area", "current view"? → Viewport-based query

2. DETERMINE VISUALIZATION TYPE from keywords:
   - "false color" → visualization: "false_color"
   - "NDVI" → visualization: "ndvi"
   - "from space", "satellite" → visualization: "rgb"
   - No specific mention → visualization: "rgb"

3. CHOOSE CORRECT TOOL BASED ON INTENT:
   - Specific location mentioned → geocode_location (+ imagery if requested)
   - Viewport/area reference → get_satellite_imagery with region bounds
   - Navigation only → geocode_location only

CONCRETE EXAMPLES:

Query: "Show me NDVI for Central Park"
→ Intent: Specific location + imagery
→ Tool: geocode_location with location_name="Central Park"
→ requires_satellite_imagery: {{enabled: true, visualization: "ndvi"}}

Query: "Show false color here" (after panning to Amazon)
→ Intent: Current viewport + imagery
→ Tool: get_satellite_imagery with bounds from region
→ requires_satellite_imagery: {{enabled: true, visualization: "false_color"}}

Query: "What does this area look like in NDVI?"
→ Intent: Current viewport + NDVI
→ Tool: get_satellite_imagery with bounds from region
→ requires_satellite_imagery: {{enabled: true, visualization: "ndvi"}}

Query: "Go to Tokyo"
→ Intent: Navigation only
→ Tool: geocode_location with location_name="Tokyo"
→ requires_satellite_imagery: {{enabled: false, visualization: "rgb"}}

TOOL PARAMETERS:

geocode_location tool:
- location_name (string, required): The place name to geocode
- Example: {{"location_name": "Paris"}}

get_satellite_imagery tool:
- bounds (object, required for viewport queries): {{"north": float, "south": float, "east": float, "west": float}}
- visualization (string, optional): "rgb" | "false_color" | "ndvi" | "agriculture"
- start_date (string, optional): "YYYY-MM-DD" format
- end_date (string, optional): "YYYY-MM-DD" format
- cloud_coverage_max (number, optional): 0-100

IMPORTANT CONSTRAINTS:
- For viewport-based queries: ALWAYS use get_satellite_imagery WITH bounds from region parameter
- For location-based queries: use geocode_location first, then get_satellite_imagery WITHOUT bounds
- Navigation-only queries should NEVER automatically trigger satellite imagery
- Pay attention to context words: "here", "this", "current", "area", "region" indicate viewport queries

CURRENTLY SUPPORTED (IN SCOPE) queries:
- Location navigation and geocoding
- Satellite imagery display and visualization (both location-based and viewport-based)
- Context-aware imagery requests

OUT OF SCOPE queries include:
- Weather forecasting
- Real-time data requests
- Non-geospatial requests
- Personal information requests
- General web searches
- Time series analysis
- Elevation/terrain analysis
- Land cover classification
- Environmental monitoring

RESPONSE FORMAT - ONLY valid JSON (no markdown):
{{
  "in_scope": boolean,
  "reasoning": "explanation of why query is in/out of scope and which tool is appropriate",
  "tool_calls": [
    {{
      "tool_name": "exact_tool_name",
      "parameters": {{"param": "value"}},
      "reasoning": "why this specific tool matches the user's request"
    }}
  ],
  "response_template": "template for formatting the response to user",
  "requires_satellite_imagery": {{
    "enabled": boolean,
    "visualization": "rgb|false_color|ndvi|agriculture"
  }}
}}"""

        # Add current query as the latest human message
        current_human_message = f"""User query: "{query}"

IMPORTANT CONTEXT:
- The user is currently viewing this geographic region: {json.dumps(region)}
- This region represents the user's CURRENT map viewport bounds
- If the query mentions a specific place name, that place is the TARGET for navigation
- If the query refers to "here", "this area", "current view", use the region bounds for imagery
- Pay attention to context clues and previous conversation that indicate whether they want imagery for current view vs a new location

Analyze this query and determine the appropriate Earth Engine operations."""

        messages.append(HumanMessage(content=current_human_message))

        # Log conversation length for debugging
        logger.info(f"Using conversation history with {len(messages)} total messages")

        try:
            response = await self.llm.ainvoke(messages, system=system_prompt)

            # Parse the JSON response with better error handling
            response_text = str(response.content).strip()
            logger.debug(f"Raw LLM response: {response_text}")

            # Clean and extract JSON response
            cleaned_response = self._extract_json_from_response(response_text)
            result_json = json.loads(cleaned_response)

            # Validate required fields
            required_fields = [
                "in_scope",
                "reasoning",
                "tool_calls",
                "response_template",
                "requires_satellite_imagery",
            ]
            for field in required_fields:
                if field not in result_json:
                    raise ValueError(
                        f"Missing required field '{field}' in LLM response"
                    )

            # Validate tool calls structure
            tool_calls = []
            for tc in result_json["tool_calls"]:
                if not isinstance(tc, dict):
                    raise ValueError("Invalid tool call format")
                if "tool_name" not in tc or "parameters" not in tc:
                    raise ValueError("Tool call missing required fields")
                tool_calls.append(ToolCall(**tc))

            # Log the analysis result for debugging
            logger.info(
                f"Query analysis complete - In scope: {result_json['in_scope']}, "
                f"Tool calls: {len(tool_calls)}"
            )

            return QueryAnalysis(
                in_scope=result_json["in_scope"],
                reasoning=result_json["reasoning"],
                tool_calls=tool_calls,
                response_template=result_json["response_template"],
                requires_satellite_imagery=SatelliteImageryRequirement(
                    **result_json["requires_satellite_imagery"]
                ),
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            logger.error(f"Raw response: {response_text}")
            raise RuntimeError("LLM returned invalid JSON response") from e
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            raise RuntimeError(f"Failed to analyze query with LLM: {str(e)}") from e

    def _extract_json_from_response(self, response_text: str) -> str:
        """Extract clean JSON from LLM response text."""
        # Remove markdown code blocks if present
        if "```json" in response_text:
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            if end != -1:
                return response_text[start:end].strip()
        elif response_text.startswith("```") and response_text.endswith("```"):
            return response_text[3:-3].strip()

        # Try to find JSON object boundaries
        start = response_text.find("{")
        end = response_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return response_text[start : end + 1]

        # Return as-is if no obvious JSON boundaries found
        return response_text
