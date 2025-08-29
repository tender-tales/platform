# Tender Tales Backend

Python FastAPI backend for satellite data analysis and similarity mapping using Google Earth Engine.

## Features

- **Similarity Heatmaps**: Compare satellite embeddings between two years
- **Satellite Embeddings**: Extract and analyze satellite embedding vectors
- **Land Use Classification**: Classify land use types from satellite data
- **REST API**: Clean, documented API endpoints

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Similarity Analysis
- `GET /api/similarity-heatmap` - Generate similarity heatmap between two years
- `POST /api/similarity-heatmap` - Complex similarity analysis requests

### Embeddings
- `GET /api/embeddings` - Get satellite embeddings for an area
- `POST /api/embeddings` - Complex embedding requests

### Utilities
- `GET /api/demo-locations` - Get predefined demo locations
- `GET /api/analysis-types` - Get supported analysis types

## Environment Variables

Required:
- `EARTH_ENGINE_SERVICE_ACCOUNT_EMAIL` - Google Earth Engine service account email
- `EARTH_ENGINE_PRIVATE_KEY` - Google Earth Engine private key
- `EARTH_ENGINE_PROJECT_ID` - Google Earth Engine project ID

Optional:
- `BACKEND_PORT` - Backend port (default: 8000)
- `FRONTEND_PORT` - Frontend port (default: 3000)
- `DEBUG` - Enable debug mode

## Development

```bash
# Install dependencies
uv sync --dev

# Run development server
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
uv run pytest

# Format code
uv run black .
uv run flake8 .
```

## Docker

```bash
docker build -t tender-tales-backend .
docker run -p 8000:8000 \
  -e EARTH_ENGINE_SERVICE_ACCOUNT_EMAIL="your-email@project.iam.gserviceaccount.com" \
  -e EARTH_ENGINE_PRIVATE_KEY="your-private-key" \
  tender-tales-backend
```

## Google Earth Engine Setup

1. Create a Google Cloud Project
2. Enable the Earth Engine API
3. Create a service account
4. Download the service account key
5. Set environment variables from the key file
