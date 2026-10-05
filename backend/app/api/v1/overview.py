"""Overview and dashboard summary API routes."""

from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.overview import OverviewSummaryResponse
from app.services.overview_service import get_overview_summary

router = APIRouter()


@router.get(
    "/summary",
    response_model=OverviewSummaryResponse,
    summary="Get Overview Dashboard Summary",
    description=(
        "Retrieves consolidated executive indicators, funnel conversion metrics, "
        "partner tier distributions, monthly velocity trends, and recent channel activity."
    ),
    responses={
        200: {
            "description": "Consolidated overview summary successfully retrieved.",
            "model": OverviewSummaryResponse,
        },
        400: {
            "description": "Invalid query parameters (e.g. start_date > end_date).",
        },
        404: {
            "description": "Requested project_id does not exist.",
        },
    },
)
def get_summary(
    start_date: Optional[date] = Query(
        None,
        description="Analytical window start date in YYYY-MM-DD format.",
        examples=["2026-01-01"],
    ),
    end_date: Optional[date] = Query(
        None,
        description="Analytical window end date in YYYY-MM-DD format.",
        examples=["2026-12-31"],
    ),
    project_id: Optional[str] = Query(
        None,
        description="Filter metrics by a specific development project identifier.",
        examples=["prj-101"],
    ),
    db: Session = Depends(get_db),
) -> OverviewSummaryResponse:
    """Retrieve executive overview summary with approved Phase 2 business KPI metrics."""
    return get_overview_summary(
        db=db,
        start_date=start_date,
        end_date=end_date,
        project_id=project_id,
    )
