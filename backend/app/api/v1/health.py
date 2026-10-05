"""Health check endpoint definitions."""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import check_db_health

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    project: str
    version: str
    environment: str
    timestamp: str
    database: Dict[str, Any]


@router.get(
    "",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description="Returns service availability, timestamp, and database connection status.",
)
def get_health() -> HealthResponse:
    """Retrieve service health status."""
    db_healthy = check_db_health()
    overall_status = "healthy" if db_healthy else "degraded"

    return HealthResponse(
        status=overall_status,
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        database={
            "status": "connected" if db_healthy else "disconnected",
            "type": "sqlite" if "sqlite" in settings.DATABASE_URL else "relational",
        },
    )
