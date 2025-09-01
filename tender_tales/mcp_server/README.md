# Kadal Earth Engine MCP Server

A Model Context Protocol (MCP) server that provides Google Earth Engine capabilities to AI assistants for geospatial analysis and environmental monitoring.

## Features

- **Dataset Information**: Get detailed information about Earth Engine datasets
- **Dataset Search**: Find relevant datasets by keywords with conservation focus
- **Image Statistics**: Calculate statistical summaries over geographic regions
- **Image Visualization**: Generate thumbnail visualizations of Earth Engine images
- **Land Cover Analysis**: Analyze forest cover changes and environmental impacts

## Available Tools

### `get_dataset_info`
Get detailed information about a specific Earth Engine dataset.

**Parameters:**
- `dataset_id` (string): The Earth Engine dataset ID (e.g., 'LANDSAT/LC08/C02/T1_L2')

### `search_datasets`
Search for Earth Engine datasets by keywords, focusing on conservation themes.

**Parameters:**
- `keywords` (string): Keywords to search for
- `limit` (integer, optional): Maximum results to return (default: 10)

### `get_image_statistics`
Calculate statistics for an Earth Engine image over a specified region.

**Parameters:**
- `dataset_id` (string): The Earth Engine image dataset ID
- `region` (object): Region definition with type "rectangle" and coordinates [west, south, east, north]
- `scale` (number, optional): Scale in meters (default: 1000)

### `visualize_image`
Create a visualization URL for an Earth Engine image.

**Parameters:**
- `dataset_id` (string): The Earth Engine image dataset ID
- `region` (object): Region definition
- `visualization` (object, optional): Visualization parameters (bands, min, max, palette)

### `analyze_land_cover_change`
Analyze land cover changes between two time periods using Hansen Global Forest Change data.

**Parameters:**
- `region` (object): Region definition
- `start_date` (string): Start date in YYYY-MM-DD format
- `end_date` (string): End date in YYYY-MM-DD format

## Authentication

The server requires Google Earth Engine authentication. Set the following environment variables:

- `EARTH_ENGINE_PROJECT_ID`: Your Google Cloud project ID with Earth Engine enabled
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account credentials JSON file

## Running Locally

```bash
# Install dependencies
pip install -e .

# Set environment variables
export EARTH_ENGINE_PROJECT_ID="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"

# Run the server
python -m main
```

## Docker Deployment

```bash
# Build the image
docker build -t kadal-mcp-server .

# Run the container
docker run -p 8001:8001 \
  -e EARTH_ENGINE_PROJECT_ID="your-project-id" \
  -v /path/to/credentials.json:/app/credentials.json:ro \
  kadal-mcp-server
```

## Health Check

The server provides a health check endpoint at `/health` that verifies Earth Engine connectivity.
