from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.overview import router as overview_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(overview_router, prefix="/overview", tags=["Overview"])

