"""Projects API route definitions."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.projects import ProjectDetailResponse, ProjectListResponse
from app.services.project_service import get_project_detail, get_projects_directory

router = APIRouter()


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List Projects Portfolio",
    description=(
        "Retrieves a paginated directory of real estate development projects with "
        "portfolio summary indicators, inventory utilization, funnel metrics, "
        "family filtering, status filtering, and multi-field search."
    ),
    responses={
        200: {
            "description": "Paginated projects directory successfully retrieved.",
            "model": ProjectListResponse,
        },
    },
)
def list_projects(
    page: int = Query(1, ge=1, description="Page number (1-indexed).", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=100, description="Number of items per page.", examples=[20]
    ),
    search: Optional[str] = Query(
        None,
        description="Search matching project name or project code.",
        examples=["Skyfinia"],
    ),
    family: Optional[str] = Query(
        None,
        description="Filter by project family ('Skyfinia', 'Infinia').",
        examples=["Skyfinia"],
    ),
    status: Optional[str] = Query(
        None,
        description=(
            "Filter by project lifecycle status "
            "('Upcoming', 'Active', 'Nearly Sold Out', 'Completed', 'On Hold')."
        ),
        examples=["Active"],
    ),
    sort_by: Optional[str] = Query(
        None,
        description=(
            "Sort ordering field ('name', 'target_units', 'booked_units', "
            "'available_units', 'booking_value')."
        ),
        examples=["name"],
    ),
    db: Session = Depends(get_db),
) -> ProjectListResponse:
    """List projects with pagination, multi-criteria filtering, and summary statistics."""
    return get_projects_directory(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        family=family,
        status=status,
        sort_by=sort_by,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectDetailResponse,
    summary="Get Project Details",
    description=(
        "Retrieves comprehensive project identity, inventory utilization, "
        "lead-to-booking funnel conversion metrics, 12-month 2026 timeline progression, "
        "top contributing channel partners, and recent confirmed booking closures."
    ),
    responses={
        200: {
            "description": "Project details and metrics successfully retrieved.",
            "model": ProjectDetailResponse,
        },
        404: {
            "description": "Requested project ID was not found.",
        },
    },
)
def get_project(
    project_id: str = Path(
        ...,
        description="Unique project identifier or code (e.g. 'prj-sky-p1' or 'PRJ-SKY-P1').",
        examples=["prj-sky-p1"],
    ),
    db: Session = Depends(get_db),
) -> ProjectDetailResponse:
    """Retrieve detailed project profile, funnels, top partners, and recent closures."""
    return get_project_detail(db=db, project_id=project_id)
