# Tender Tales API Documentation

The Tender Tales API provides endpoints for location-based queries using LLM-powered analysis.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses Anthropic's Claude API for query analysis. Configure the `ANTHROPIC_API_KEY` environment variable to enable intelligent query processing.

## Endpoints

### MCP Query

Process location queries using LLM-powered analysis with MCP (Model Context Protocol) tools.

```http
POST /mcp/query
Content-Type: application/json
```

**Request Body:**

```json
{
  "query": "string",
  "region": {
    "north": float,
    "south": float,
    "east": float,
    "west": float
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | The location query to process |
| `region` | object | Yes | Bounding box for the query region |
| `region.north` | float | Yes | Northern boundary (latitude) |
| `region.south` | float | Yes | Southern boundary (latitude) |
| `region.east` | float | Yes | Eastern boundary (longitude) |
| `region.west` | float | Yes | Western boundary (longitude) |

**Response:**

```json
{
  "status": "success" | "out_of_scope" | "service_unavailable" | "analysis_failed",
  "response": "string",
  "data": [
    {
      "tool": "string",
      "result": object,
      "reasoning": "string"
    }
  ],
  "analysis": {
    "reasoning": "string",
    "tools_used": ["string"]
  },
  "original_query": "string"
}
```

**Status Types:**

- `success`: Query processed successfully
- `out_of_scope`: Query is outside the supported scope
- `service_unavailable`: AI assistant unavailable (missing API key)
- `analysis_failed`: LLM analysis failed

**Example:**

```bash
curl -X POST "http://localhost:8000/mcp/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find the coordinates of San Francisco",
    "region": {
      "north": 37.8,
      "south": 37.7,
      "east": -122.3,
      "west": -122.5
    }
  }'
```

## Environment Configuration

The API requires the following environment variables:

- `ANTHROPIC_API_KEY`: Required for LLM query analysis
- `GOOGLE_MAPS_API_KEY`: Optional, for enhanced geocoding capabilities

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `500`: Internal server error

All responses include a `status` field indicating the result of the operation.
