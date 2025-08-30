# Tender Tales API Documentation

The Tender Tales API provides endpoints for satellite data analysis and similarity mapping using Google Earth Engine.

## Base URL

```
http://localhost:8000
```

## Authentication

The API requires Google Earth Engine credentials to be configured. See the [Earth Engine Setup Guide](earth-engine-setup.md) for configuration details.

## Common Response Format

All API responses follow a consistent format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  ...additional_fields
}
```

### Error Responses

```json
{
  "success": false,
  "error": string,
  "message": string,
  "error_type": string
}
```

## Endpoints

### Health Check

Check the API service status and Earth Engine connectivity.

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy" | "degraded",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "earth_engine": {
      "configured": boolean,
      "initialized": boolean,
      "project_id": string
    }
  },
  "environment": {
    "debug": boolean,
    "backend_port": number,
    "frontend_port": number
  }
}
```

### Root

Basic API information.

```http
GET /
```

**Response:**

```json
{
  "message": "Tender Tales API",
  "version": "1.0.0"
}
```

### Similarity Heatmap

Generate similarity heatmaps between two years for change detection analysis.

#### GET Request

```http
GET /api/similarity-heatmap?north={north}&south={south}&east={east}&west={west}&reference_year={year}&target_year={year}
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `north` | float | Yes | - | Northern boundary (latitude) |
| `south` | float | Yes | - | Southern boundary (latitude) |
| `east` | float | Yes | - | Eastern boundary (longitude) |
| `west` | float | Yes | - | Western boundary (longitude) |
| `reference_year` | integer | No | 2022 | Reference year for comparison |
| `target_year` | integer | No | 2023 | Target year for comparison |

**Example:**

```bash
curl "http://localhost:8000/api/similarity-heatmap?north=37.0&south=36.0&east=-120.5&west=-121.5&reference_year=2022&target_year=2023"
```

#### POST Request

```http
POST /api/similarity-heatmap
Content-Type: application/json
```

**Request Body:**

```json
{
  "bounds": {
    "north": 37.0,
    "south": 36.0,
    "east": -120.5,
    "west": -121.5
  },
  "reference_year": 2022,
  "target_year": 2023
}
```

**Response:**

```json
{
  "success": true,
  "mode": "similarity_heatmap",
  "data": {
    "grid": [[float]],
    "bounds": {
      "north": float,
      "south": float,
      "east": float,
      "west": float
    },
    "resolution": {
      "lat": float,
      "lon": float
    }
  },
  "reference_year": integer,
  "target_year": integer,
  "message": "Similarity heatmap computed between {reference_year} and {target_year}"
}
```

### Satellite Embeddings

Extract satellite embedding vectors for analysis and visualization.

#### GET Request

```http
GET /api/embeddings?north={north}&south={south}&east={east}&west={west}&year={year}&num_points={points}
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `north` | float | Yes | - | Northern boundary (latitude) |
| `south` | float | Yes | - | Southern boundary (latitude) |
| `east` | float | Yes | - | Eastern boundary (longitude) |
| `west` | float | Yes | - | Western boundary (longitude) |
| `year` | integer | No | 2023 | Year for embeddings |
| `num_points` | integer | No | 50 | Number of sample points (1-1000) |

**Example:**

```bash
curl "http://localhost:8000/api/embeddings?north=37.0&south=36.0&east=-120.5&west=-121.5&year=2023&num_points=100"
```

#### POST Request

```http
POST /api/embeddings
Content-Type: application/json
```

**Request Body:**

```json
{
  "bounds": {
    "north": 37.0,
    "south": 36.0,
    "east": -120.5,
    "west": -121.5
  },
  "year": 2023,
  "num_points": 100
}
```

**Response:**

```json
{
  "success": true,
  "mode": "embeddings",
  "data": [
    {
      "longitude": float,
      "latitude": float,
      "embedding": [float],
      "similarity": float,
      "land_use": string
    }
  ],
  "bounds": {
    "north": float,
    "south": float,
    "east": float,
    "west": float
  },
  "year": integer,
  "count": integer,
  "message": "Retrieved {count} embedding points for year {year}"
}
```

### Demo Locations

Get predefined locations for testing and demonstration purposes.

```http
GET /api/demo-locations
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "Amazon Rainforest",
      "longitude": -60.0,
      "latitude": -3.0,
      "bounds": {
        "north": -2.0,
        "south": -4.0,
        "east": -59.0,
        "west": -61.0
      },
      "description": "Deforestation monitoring in the Amazon Basin"
    }
  ],
  "count": integer,
  "message": "Retrieved demo locations for similarity analysis"
}
```

### Analysis Types

Get information about supported analysis types and their parameters.

```http
GET /api/analysis-types
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "type": "similarity_heatmap",
      "name": "Similarity Heatmap",
      "description": "Compare satellite embeddings between two years to identify changes",
      "parameters": ["bounds", "reference_year", "target_year"]
    }
  ],
  "count": integer,
  "message": "Retrieved supported analysis types"
}
```

## Data Models

### BoundingBox

```json
{
  "north": float,    // Northern latitude boundary
  "south": float,    // Southern latitude boundary
  "east": float,     // Eastern longitude boundary
  "west": float      // Western longitude boundary
}
```

### Embedding Point

```json
{
  "longitude": float,        // Point longitude
  "latitude": float,         // Point latitude
  "embedding": [float],      // 768-dimensional embedding vector
  "similarity": float,       // Similarity score (0-1)
  "land_use": string        // Classified land use type
}
```

## Error Codes

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request parameters |
| 503 | AUTHENTICATION_ERROR | Earth Engine not configured |
| 500 | SERVER_ERROR | Internal server error |

## Rate Limiting

The API does not currently implement rate limiting, but requests may be limited by Google Earth Engine quotas and processing time.

## Examples

### Basic Similarity Analysis

```bash
# Get similarity heatmap for California Central Valley
curl -X GET "http://localhost:8000/api/similarity-heatmap" \
  -G \
  -d "north=37.0" \
  -d "south=36.0" \
  -d "east=-120.5" \
  -d "west=-121.5" \
  -d "reference_year=2022" \
  -d "target_year=2023"
```

### Extract Embeddings

```bash
# Get 200 embedding points for Dubai area
curl -X GET "http://localhost:8000/api/embeddings" \
  -G \
  -d "north=25.5" \
  -d "south=24.9" \
  -d "east=55.6" \
  -d "west=54.9" \
  -d "year=2023" \
  -d "num_points=200"
```

### Using POST with Complex Data

```bash
curl -X POST "http://localhost:8000/api/similarity-heatmap" \
  -H "Content-Type: application/json" \
  -d '{
    "bounds": {
      "north": -2.0,
      "south": -4.0,
      "east": -59.0,
      "west": -61.0
    },
    "reference_year": 2020,
    "target_year": 2023
  }'
```
