"""Channel Partners API route definitions."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.partners import PartnerDetailResponse, PartnerListResponse
from app.services.partner_service import get_partner_by_id, get_partners_directory

router = APIRouter()


@router.get(
    "",
    response_model=PartnerListResponse,
    summary="List Channel Partners Directory",
    description=(
        "Retrieves a paginated directory of registered channel partners with "
        "database-derived performance KPIs, tier filtering, status filtering, "
        "and multi-field search."
    ),
    responses={
        200: {
            "description": "Paginated channel partners directory successfully retrieved.",
            "model": PartnerListResponse,
        },
    },
)
def list_partners(
    page: int = Query(1, ge=1, description="Page number (1-indexed).", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=100, description="Number of items per page.", examples=[20]
    ),
    tier: Optional[str] = Query(
        None,
        description="Filter by partner performance tier ('Tier 1', 'Tier 2', 'Tier 3').",
        examples=["Tier 1"],
    ),
    active: Optional[bool] = Query(
        None,
        description="Filter by partner account active status.",
        examples=[True],
    ),
    city: Optional[str] = Query(
        None,
        description="Filter by partner operational city.",
        examples=["Pune"],
    ),
    search: Optional[str] = Query(
        None,
        description="Partial search matching partner name, contact person, or partner code.",
        examples=["Apex"],
    ),
    sort_by: Optional[str] = Query(
        None,
        description="Sort ordering field ('name', 'onboarding_date', 'tier').",
        examples=["name"],
    ),
    db: Session = Depends(get_db),
) -> PartnerListResponse:
    """List channel partners with pagination, multi-criteria filtering, and summary statistics."""
    return get_partners_directory(
        db=db,
        page=page,
        page_size=page_size,
        tier=tier,
        active=active,
        city=city,
        search=search,
        sort_by=sort_by,
    )


@router.get(
    "/{partner_id}",
    response_model=PartnerDetailResponse,
    summary="Get Channel Partner Details",
    description=(
        "Retrieves complete profile, assigned sales relationship manager, "
        "comprehensive conversion funnel metrics, recent leads, and recent bookings for a partner."
    ),
    responses={
        200: {
            "description": "Partner detail profile and metrics successfully retrieved.",
            "model": PartnerDetailResponse,
        },
        404: {
            "description": "Requested partner ID was not found.",
        },
    },
)
def get_partner(
    partner_id: str = Path(
        ...,
        description="Unique channel partner identifier (e.g. 'cp-1001').",
        examples=["cp-1001"],
    ),
    db: Session = Depends(get_db),
) -> PartnerDetailResponse:
    """Retrieve detailed partner profile and end-to-end performance metrics."""
    return get_partner_by_id(db=db, partner_id=partner_id)
