# Tender Tales Platform

----------------------------------------------------------------------------------------

[![code checks](https://github.com/tender-tales/platform/actions/workflows/code_checks.yml/badge.svg)](https://github.com/tender-tales/platform/actions/workflows/code_checks.yml)
[![unit tests](https://github.com/tender-tales/platform/actions/workflows/unit_tests.yml/badge.svg)](https://github.com/tender-tales/platform/actions/workflows/unit_tests.yml)
[![docs](https://github.com/tender-tales/platform/actions/workflows/docs.yml/badge.svg)](https://github.com/tender-tales/platform/actions/workflows/docs.yml)
[![codecov](https://codecov.io/github/tender-tales/platform/graph/badge.svg?token=83MYFZ3UPA)](https://codecov.io/github/tender-tales/platform)
![GitHub License](https://img.shields.io/github/license/tender-tales/platform)

A full-stack platform for satellite data analysis and similarity mapping using Google Earth Engine.

## Architecture

- **Frontend (`ui/`)**: Next.js application with TypeScript and Tailwind CSS
- **Backend (`tender_tales/`)**: Python FastAPI backend with Google Earth Engine integration
- **Docker**: Containerized with development and production configurations

## Quick Start

### Development

1. Set up environment:
```bash
cp .env.development .env
# Edit .env with your Google Earth Engine credentials
```

2. Run with Docker Compose:
```bash
docker compose --env-file .env.development -f docker-compose.dev.yml up backend-dev
# In another terminal for frontend:
docker compose --env-file .env.development -f docker-compose.dev.yml --profile frontend up frontend-dev
```


## Environment Variables

### Required
- `EARTH_ENGINE_PROJECT_ID` - Your Google Earth Engine project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to your service account key file

### Optional
- `FRONTEND_PORT` - Frontend port (default: 3000)
- `BACKEND_PORT` - Backend port (default: 8000)
- `DEBUG` - Enable debug mode (default: false)


## Google Earth Engine Setup

1. Create a Google Cloud Project
2. Enable the Earth Engine API
3. Create a service account and download the key file
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the key file
5. Set the `EARTH_ENGINE_PROJECT_ID` environment variable

## Development Commands

### Frontend (ui/)
```bash
cd ui/
npm install
npm run dev
npm run build
npm run lint
```

### Backend (tender_tales/)
```bash
cd tender_tales/
uv sync --dev
uv run uvicorn api.main:app --reload
uv run pytest
```
