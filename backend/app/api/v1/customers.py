"""Customer search and customer lifecycle detail endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.customers import CustomerDetailResponse, CustomerSearchResponse
from app.services.customer_service import get_customer_detail, search_customers

router = APIRouter()


@router.get(
    "/search",
    response_model=CustomerSearchResponse,
    summary="Global Customer Search",
    description=(
        "Search leads/customers across name, phone, email, and lead code "
        "with case-insensitive partial match."
    ),
)
def search_customers_endpoint(
    q: str = Query(
        "",
        min_length=0,
        description="Search term matching customer name, phone, email, or lead code",
    ),
    page_size: int = Query(
        10,
        ge=1,
        le=50,
        description="Maximum number of customer search results to return",
    ),
    db: Session = Depends(get_db),
) -> CustomerSearchResponse:
    """Execute customer search across lead pipeline."""
    return search_customers(db=db, query=q, page_size=page_size)


@router.get(
    "/{lead_id}",
    response_model=CustomerDetailResponse,
    summary="Get Customer Detail",
    description="Retrieve full customer profile, partner attribution, and booking history.",
)
def get_customer_detail_endpoint(
    lead_id: str,
    db: Session = Depends(get_db),
) -> CustomerDetailResponse:
    """Retrieve customer detail and transaction history by lead ID or lead code."""
    return get_customer_detail(db=db, lead_id=lead_id)
