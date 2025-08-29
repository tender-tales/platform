"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.logging_config import setup_logging
from api.routes import router
from services.earth_engine import earth_engine_service


# Load environment variables
load_dotenv()

# Set up logging before anything else
setup_logging()
logger = logging.getLogger("api.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 TENDER TALES API STARTING UP")
    logger.info("=" * 60)
    logger.info(f"📦 Application: {app.title} v{app.version}")
    logger.info(f"🌐 Backend Port: {settings.backend_port}")
    logger.info(f"🖥️  Frontend Port: {settings.frontend_port}")
    logger.info(f"🔧 Debug Mode: {'ENABLED' if settings.debug else 'DISABLED'}")
    logger.info(
        f"🌍 Earth Engine Project: {settings.earth_engine_project_id or 'NOT SET'}"
    )

    # Check Earth Engine initialization
    if earth_engine_service.is_initialized():
        logger.info("✅ Earth Engine service is ready!")
    else:
        logger.warning("⚠️  Earth Engine service failed to initialize")

    logger.info("-" * 60)
    logger.info("🎯 API READY - All systems operational!")
    logger.info("-" * 60)

    yield

    # Shutdown
    logger.info("🛑 Shutting down Tender Tales API...")
    logger.info("👋 Goodbye!")


app = FastAPI(
    title="Tender Tales API",
    description="Backend API for satellite data analysis and similarity mapping",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint."""
    return {"message": "Tender Tales API", "version": "1.0.0"}


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    logger.debug("🏥 Health check requested")

    ee_configured = bool(settings.earth_engine_project_id)
    ee_initialized = earth_engine_service.is_initialized()

    health_status = {
        "status": "healthy" if ee_initialized else "degraded",
        "timestamp": logger.handlers[0].formatter.formatTime(
            logging.LogRecord(
                name="", level=0, pathname="", lineno=0, msg="", args=(), exc_info=None
            )
        )
        if logger.handlers and logger.handlers[0].formatter
        else None,
        "services": {
            "earth_engine": {
                "configured": ee_configured,
                "initialized": ee_initialized,
                "project_id": settings.earth_engine_project_id,
            }
        },
        "environment": {
            "debug": settings.debug,
            "backend_port": settings.backend_port,
            "frontend_port": settings.frontend_port,
        },
    }

    if ee_initialized:
        logger.debug("✅ Health check passed - all services operational")
    else:
        logger.warning("⚠️  Health check degraded - Earth Engine not initialized")

    return health_status
