"""API routes for satellite data analysis."""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.earth_engine import (
    BoundingBox,
    earth_engine_service,
)


logger = logging.getLogger("api.routes")

router = APIRouter()


class SimilarityHeatmapRequest(BaseModel):
    """Request model for similarity heatmap generation."""

    bounds: BoundingBox
    reference_year: int
    target_year: int


class EmbeddingsRequest(BaseModel):
    """Request model for satellite embeddings."""

    bounds: BoundingBox
    year: int
    num_points: Optional[int] = 50


class ErrorResponse(BaseModel):
    """Error response model."""

    success: bool = False
    error: str
    message: str
    error_type: str


@router.get("/similarity-heatmap")
async def get_similarity_heatmap(
    north: float = Query(..., description="Northern boundary"),
    south: float = Query(..., description="Southern boundary"),
    east: float = Query(..., description="Eastern boundary"),
    west: float = Query(..., description="Western boundary"),
    reference_year: int = Query(2022, description="Reference year"),
    target_year: int = Query(2023, description="Target year for comparison"),
) -> Dict[str, Any]:
    """
    Get similarity heatmap between two years for a given geographic area.

    This endpoint computes cosine similarity between satellite embeddings
    from two different years and returns a grid of similarity values.
    """
    logger.info(f"🗺️  Similarity heatmap requested: {reference_year} vs {target_year}")
    logger.debug(f"📍 Bounds: N{north}, S{south}, E{east}, W{west}")

    try:
        if not earth_engine_service.is_initialized():
            raise HTTPException(
                status_code=503,
                detail={
                    "success": False,
                    "error": "Earth Engine not configured",
                    "message": "Earth Engine authentication credentials are not set up",
                    "error_type": "AUTHENTICATION_ERROR",
                },
            )

        bounds = BoundingBox(north=north, south=south, east=east, west=west)

        # Validate bounds
        if north <= south or east <= west:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid bounds",
                    "message": "North must be greater than south, east must be greater than west",
                    "error_type": "VALIDATION_ERROR",
                },
            )

        heatmap_data = await earth_engine_service.fetch_similarity_heatmap(
            bounds=bounds, reference_year=reference_year, target_year=target_year
        )

        return {
            "success": True,
            "mode": "similarity_heatmap",
            "data": heatmap_data,
            "reference_year": reference_year,
            "target_year": target_year,
            "message": f"Similarity heatmap computed between {reference_year} and {target_year}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating similarity heatmap: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Internal server error",
                "message": str(e),
                "error_type": "SERVER_ERROR",
            },
        ) from e


@router.post("/similarity-heatmap")
async def post_similarity_heatmap(request: SimilarityHeatmapRequest) -> Dict[str, Any]:
    """POST version of similarity heatmap endpoint for complex requests."""
    try:
        if not earth_engine_service.is_initialized():
            raise HTTPException(
                status_code=503,
                detail={
                    "success": False,
                    "error": "Earth Engine not configured",
                    "message": "Earth Engine authentication credentials are not set up",
                    "error_type": "AUTHENTICATION_ERROR",
                },
            )

        heatmap_data = await earth_engine_service.fetch_similarity_heatmap(
            bounds=request.bounds,
            reference_year=request.reference_year,
            target_year=request.target_year,
        )

        return {
            "success": True,
            "mode": "similarity_heatmap",
            "data": heatmap_data,
            "reference_year": request.reference_year,
            "target_year": request.target_year,
            "message": f"Similarity heatmap computed between {request.reference_year} and {request.target_year}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating similarity heatmap: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Internal server error",
                "message": str(e),
                "error_type": "SERVER_ERROR",
            },
        ) from e


@router.get("/embeddings")
async def get_embeddings(
    north: float = Query(..., description="Northern boundary"),
    south: float = Query(..., description="Southern boundary"),
    east: float = Query(..., description="Eastern boundary"),
    west: float = Query(..., description="Western boundary"),
    year: int = Query(2023, description="Year for embeddings"),
    num_points: int = Query(50, description="Number of sample points"),
) -> Dict[str, Any]:
    """
    Get satellite embeddings for a given geographic area and year.

    This endpoint samples satellite embedding vectors from the specified
    area and returns them with computed similarity metrics and land use classifications.
    """
    logger.info(f"🛰️  Embeddings requested for year {year} with {num_points} points")
    logger.debug(f"📍 Bounds: N{north}, S{south}, E{east}, W{west}")

    try:
        if not earth_engine_service.is_initialized():
            raise HTTPException(
                status_code=503,
                detail={
                    "success": False,
                    "error": "Earth Engine not configured",
                    "message": "Earth Engine authentication credentials are not set up",
                    "error_type": "AUTHENTICATION_ERROR",
                },
            )

        bounds = BoundingBox(north=north, south=south, east=east, west=west)

        # Validate bounds
        if north <= south or east <= west:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid bounds",
                    "message": "North must be greater than south, east must be greater than west",
                    "error_type": "VALIDATION_ERROR",
                },
            )

        # Validate num_points
        if num_points < 1 or num_points > 1000:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid num_points",
                    "message": "Number of points must be between 1 and 1000",
                    "error_type": "VALIDATION_ERROR",
                },
            )

        embeddings = await earth_engine_service.fetch_satellite_embeddings(
            bounds=bounds, year=year, num_points=num_points
        )

        return {
            "success": True,
            "mode": "embeddings",
            "data": [embedding.dict() for embedding in embeddings],
            "bounds": bounds.dict(),
            "year": year,
            "count": len(embeddings),
            "message": f"Retrieved {len(embeddings)} embedding points for year {year}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching embeddings: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Internal server error",
                "message": str(e),
                "error_type": "SERVER_ERROR",
            },
        ) from e


@router.post("/embeddings")
async def post_embeddings(request: EmbeddingsRequest) -> Dict[str, Any]:
    """POST version of embeddings endpoint for complex requests."""
    try:
        if not earth_engine_service.is_initialized():
            raise HTTPException(
                status_code=503,
                detail={
                    "success": False,
                    "error": "Earth Engine not configured",
                    "message": "Earth Engine authentication credentials are not set up",
                    "error_type": "AUTHENTICATION_ERROR",
                },
            )

        embeddings = await earth_engine_service.fetch_satellite_embeddings(
            bounds=request.bounds,
            year=request.year,
            num_points=request.num_points or 50,
        )

        return {
            "success": True,
            "mode": "embeddings",
            "data": [embedding.dict() for embedding in embeddings],
            "bounds": request.bounds.dict(),
            "year": request.year,
            "count": len(embeddings),
            "message": f"Retrieved {len(embeddings)} embedding points for year {request.year}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching embeddings: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Internal server error",
                "message": str(e),
                "error_type": "SERVER_ERROR",
            },
        ) from e


@router.get("/demo-locations")
async def get_demo_locations() -> Dict[str, Any]:
    """Get predefined demo locations for testing similarity analysis."""
    demo_locations = [
        {
            "name": "Amazon Rainforest",
            "longitude": -60.0,
            "latitude": -3.0,
            "bounds": {"north": -2.0, "south": -4.0, "east": -59.0, "west": -61.0},
            "description": "Deforestation monitoring in the Amazon Basin",
        },
        {
            "name": "California Central Valley",
            "longitude": -121.0,
            "latitude": 36.5,
            "bounds": {"north": 37.0, "south": 36.0, "east": -120.5, "west": -121.5},
            "description": "Agricultural expansion and water usage patterns",
        },
        {
            "name": "Dubai Urban Development",
            "longitude": 55.2708,
            "latitude": 25.2048,
            "bounds": {"north": 25.5, "south": 24.9, "east": 55.6, "west": 54.9},
            "description": "Rapid urban expansion in the desert",
        },
        {
            "name": "Greenland Ice Sheet",
            "longitude": -42.0,
            "latitude": 72.0,
            "bounds": {"north": 72.5, "south": 71.5, "east": -41.5, "west": -42.5},
            "description": "Glacial retreat and climate change impacts",
        },
    ]

    return {
        "success": True,
        "data": demo_locations,
        "count": len(demo_locations),
        "message": "Retrieved demo locations for similarity analysis",
    }


@router.get("/analysis-types")
async def get_analysis_types() -> Dict[str, Any]:
    """Get supported analysis types and their descriptions."""
    analysis_types = [
        {
            "type": "similarity_heatmap",
            "name": "Similarity Heatmap",
            "description": "Compare satellite embeddings between two years to identify changes",
            "parameters": ["bounds", "reference_year", "target_year"],
        },
        {
            "type": "embeddings",
            "name": "Satellite Embeddings",
            "description": "Extract satellite embedding vectors for a specific area and year",
            "parameters": ["bounds", "year", "num_points"],
        },
        {
            "type": "land_use_classification",
            "name": "Land Use Classification",
            "description": "Classify land use types from embedding characteristics",
            "parameters": ["bounds", "year"],
        },
    ]

    return {
        "success": True,
        "data": analysis_types,
        "count": len(analysis_types),
        "message": "Retrieved supported analysis types",
    }
