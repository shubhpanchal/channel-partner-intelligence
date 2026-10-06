from fastapi import APIRouter

from app.api.v1.customers import router as customers_router
from app.api.v1.health import router as health_router
from app.api.v1.overview import router as overview_router
from app.api.v1.partners import router as partners_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(overview_router, prefix="/overview", tags=["Overview"])
api_router.include_router(partners_router, prefix="/partners", tags=["Partners"])
api_router.include_router(customers_router, prefix="/customers", tags=["Customers"])

