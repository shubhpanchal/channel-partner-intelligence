"""Customer query and lifecycle investigation service."""

from __future__ import annotations

from typing import List

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.entities import Booking, Lead, SiteVisit
from app.schemas.customers import (
    CustomerBookingItem,
    CustomerDetailResponse,
    CustomerSearchItem,
    CustomerSearchResponse,
    CustomerSiteVisitItem,
)


def search_customers(
    db: Session,
    query: str = "",
    page_size: int = 10,
) -> CustomerSearchResponse:
    """Search customers by name, phone, email, or lead code with case-insensitive partial match."""
    cleaned_query = query.strip() if query else ""
    if len(cleaned_query) < 2:
        return CustomerSearchResponse(items=[], total=0)

    # Sanitize and bound page size
    effective_page_size = max(1, min(page_size, 50))
    search_pattern = f"%{cleaned_query}%"

    filter_condition = or_(
        Lead.customer_name.ilike(search_pattern),
        Lead.customer_phone.ilike(search_pattern),
        Lead.customer_email.ilike(search_pattern),
        Lead.lead_code.ilike(search_pattern),
    )

    # Total matching count
    total = db.scalar(
        select(func.count(Lead.id)).where(filter_condition)
    ) or 0

    if total == 0:
        return CustomerSearchResponse(items=[], total=0)

    # Fetch eager-loaded matching leads
    leads = db.scalars(
        select(Lead)
        .options(
            joinedload(Lead.project),
            joinedload(Lead.channel_partner),
            joinedload(Lead.assigned_salesperson),
        )
        .where(filter_condition)
        .order_by(Lead.created_at.desc(), Lead.id.desc())
        .limit(effective_page_size)
    ).all()

    items: List[CustomerSearchItem] = [
        CustomerSearchItem(
            lead_id=ld.id,
            lead_code=ld.lead_code,
            customer_name=ld.customer_name,
            customer_phone=ld.customer_phone,
            customer_email=ld.customer_email,
            project_id=ld.project_id,
            project_name=ld.project.name if ld.project else "Unknown Project",
            lead_status=ld.status,
            channel_partner_id=ld.channel_partner_id,
            channel_partner_name=(
                ld.channel_partner.name if ld.channel_partner else "Unknown Partner"
            ),
            salesperson_id=ld.assigned_salesperson_id,
            salesperson_name=(
                ld.assigned_salesperson.name if ld.assigned_salesperson else None
            ),
        )
        for ld in leads
    ]

    return CustomerSearchResponse(items=items, total=total)


def get_customer_detail(
    db: Session,
    lead_id: str,
) -> CustomerDetailResponse:
    """Retrieve full customer profile, attribution, site visit logs, and booking history."""
    # Find by ID or lead_code
    lead = db.scalar(
        select(Lead)
        .options(
            joinedload(Lead.project),
            joinedload(Lead.channel_partner),
            joinedload(Lead.assigned_salesperson),
        )
        .where(or_(Lead.id == lead_id, Lead.lead_code == lead_id))
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail=f"Customer lead '{lead_id}' not found",
        )

    # Query all site visits for this lead chronologically
    site_visit_records = db.scalars(
        select(SiteVisit)
        .where(SiteVisit.lead_id == lead.id)
        .order_by(SiteVisit.scheduled_at.asc(), SiteVisit.id.asc())
    ).all()

    site_visits = [
        CustomerSiteVisitItem(
            id=sv.id,
            visit_code=sv.visit_code,
            scheduled_at=sv.scheduled_at,
            visited_at=sv.visited_at,
            status=sv.status,
            verification_type=sv.verification_type,
            outcome=sv.outcome,
            feedback_notes=sv.feedback_notes,
            created_at=sv.created_at,
        )
        for sv in site_visit_records
    ]

    # Query all bookings for this lead chronologically by lifecycle event
    booking_records = db.scalars(
        select(Booking)
        .options(joinedload(Booking.project))
        .where(Booking.lead_id == lead.id)
        .order_by(
            func.coalesce(Booking.cancelled_at, Booking.created_at).asc(),
            Booking.id.asc(),
        )
    ).all()

    bookings = [
        CustomerBookingItem(
            id=bk.id,
            booking_reference=bk.booking_reference,
            unit_number=bk.unit_number,
            unit_type=bk.unit_type,
            project_id=bk.project_id,
            project_name=bk.project.name if bk.project else "Unknown Project",
            booking_date=bk.booking_date,
            booking_status=bk.booking_status,
            booking_value=float(bk.booking_value),
            token_amount=float(bk.token_amount),
            commission_rate_pct=float(bk.commission_rate_pct),
            commission_amount=float(bk.commission_amount),
            cancelled_at=bk.cancelled_at,
            created_at=bk.created_at,
        )
        for bk in booking_records
    ]

    return CustomerDetailResponse(
        lead_id=lead.id,
        lead_code=lead.lead_code,
        customer_name=lead.customer_name,
        customer_phone=lead.customer_phone,
        customer_email=lead.customer_email,
        lead_status=lead.status,
        budget_range=lead.budget_range,
        requirement_type=lead.requirement_type,
        lost_reason=lead.lost_reason,
        created_at=lead.created_at,
        qualified_at=lead.qualified_at,
        converted_at=lead.converted_at,
        lost_at=lead.lost_at,
        project_id=lead.project_id,
        project_name=lead.project.name if lead.project else "Unknown Project",
        channel_partner_id=lead.channel_partner_id,
        channel_partner_name=(
            lead.channel_partner.name if lead.channel_partner else "Unknown Partner"
        ),
        channel_partner_code=(
            lead.channel_partner.partner_code if lead.channel_partner else None
        ),
        channel_partner_tier=(
            lead.channel_partner.tier if lead.channel_partner else None
        ),
        salesperson_id=lead.assigned_salesperson_id,
        salesperson_name=(
            lead.assigned_salesperson.name if lead.assigned_salesperson else None
        ),
        salesperson_email=(
            lead.assigned_salesperson.email if lead.assigned_salesperson else None
        ),
        salesperson_phone=(
            lead.assigned_salesperson.phone if lead.assigned_salesperson else None
        ),
        site_visits=site_visits,
        bookings=bookings,
    )
