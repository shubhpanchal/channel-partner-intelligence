"""Channel Partner query and performance calculation service."""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Set

from fastapi import HTTPException
from sqlalchemy import case, distinct, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.domain_semantics import (
    calculate_overall_lead_to_booking_rate,
    calculate_qualified_lead_to_visit_rate,
    calculate_visit_completion_rate,
    calculate_visit_to_booking_rate,
)
from app.models.entities import Booking, ChannelPartner, Lead, SiteVisit
from app.schemas.partners import (
    PaginationMetadata,
    PartnerDetailedMetrics,
    PartnerDetailResponse,
    PartnerListItem,
    PartnerListResponse,
    PartnerRecentBookingItem,
    PartnerRecentLeadItem,
    PartnerSummaryStats,
    SalespersonBasic,
    SalespersonDetail,
)


def get_partners_directory(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    tier: Optional[str] = None,
    active: Optional[bool] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
) -> PartnerListResponse:
    """Retrieve paginated channel partners directory with database-derived summary KPIs.

    Uses grouped queries to calculate summary metrics for the current page of partners
    in batch, avoiding N+1 query execution overhead.
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    elif page_size > 100:
        page_size = 100

    query = select(ChannelPartner).options(
        joinedload(ChannelPartner.assigned_salesperson)
    )

    # 1. Filters
    if tier:
        query = query.where(ChannelPartner.tier == tier.strip())
    if active is not None:
        query = query.where(ChannelPartner.active == active)
    if city:
        query = query.where(func.lower(ChannelPartner.city) == city.strip().lower())
    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(ChannelPartner.name).like(search_pattern),
                func.lower(ChannelPartner.contact_person).like(search_pattern),
                func.lower(ChannelPartner.partner_code).like(search_pattern),
            )
        )

    # 2. Total Count
    count_subq = query.order_by(None).subquery()
    total = db.scalar(select(func.count()).select_from(count_subq)) or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    # 3. Sorting with deterministic tie-breaker
    if sort_by == "name":
        query = query.order_by(ChannelPartner.name.asc(), ChannelPartner.id.asc())
    elif sort_by == "onboarding_date":
        query = query.order_by(
            ChannelPartner.onboarding_date.desc(), ChannelPartner.id.asc()
        )
    elif sort_by == "tier":
        query = query.order_by(
            ChannelPartner.tier.asc(),
            ChannelPartner.name.asc(),
            ChannelPartner.id.asc(),
        )
    else:
        query = query.order_by(ChannelPartner.name.asc(), ChannelPartner.id.asc())

    # 4. Pagination
    offset = (page - 1) * page_size
    partners = db.scalars(query.offset(offset).limit(page_size)).all()

    if not partners:
        return PartnerListResponse(
            items=[],
            pagination=PaginationMetadata(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )

    partner_ids = [p.id for p in partners]

    # 5. Batch Aggregation for Summary KPIs
    # 5a. Lead stats per partner
    lead_stats_rows = db.execute(
        select(
            Lead.channel_partner_id,
            func.count(Lead.id).label("total_leads"),
            func.sum(case((Lead.status != "Invalid", 1), else_=0)).label("valid_leads"),
            func.sum(case((Lead.qualified_at.isnot(None), 1), else_=0)).label(
                "qualified_leads"
            ),
        )
        .where(Lead.channel_partner_id.in_(partner_ids))
        .group_by(Lead.channel_partner_id)
    ).all()

    lead_stats_map: Dict[str, Dict[str, int]] = {
        row.channel_partner_id: {
            "total_leads": row.total_leads or 0,
            "valid_leads": row.valid_leads or 0,
            "qualified_leads": row.qualified_leads or 0,
        }
        for row in lead_stats_rows
    }

    # 5b. Site visit stats per partner
    visit_stats_rows = db.execute(
        select(
            SiteVisit.channel_partner_id,
            func.sum(case((SiteVisit.status == "Completed", 1), else_=0)).label(
                "completed_visits"
            ),
            func.count(
                distinct(
                    case((SiteVisit.status == "Completed", SiteVisit.lead_id), else_=None)
                )
            ).label("unique_visited_leads"),
        )
        .where(SiteVisit.channel_partner_id.in_(partner_ids))
        .group_by(SiteVisit.channel_partner_id)
    ).all()

    visit_stats_map: Dict[str, Dict[str, int]] = {
        row.channel_partner_id: {
            "completed_visits": row.completed_visits or 0,
            "unique_visited_leads": row.unique_visited_leads or 0,
        }
        for row in visit_stats_rows
    }

    # 5c. Unique visited lead IDs per partner (to accurately isolate direct bookings)
    visited_leads_rows = db.execute(
        select(SiteVisit.channel_partner_id, SiteVisit.lead_id)
        .where(
            SiteVisit.channel_partner_id.in_(partner_ids),
            SiteVisit.status == "Completed",
        )
        .distinct()
    ).all()

    visited_leads_by_partner: Dict[str, Set[str]] = {}
    for row in visited_leads_rows:
        visited_leads_by_partner.setdefault(row.channel_partner_id, set()).add(
            row.lead_id
        )

    # 5d. Confirmed / Completed Bookings per partner
    bookings_rows = db.execute(
        select(Booking.channel_partner_id, Booking.lead_id)
        .where(
            Booking.channel_partner_id.in_(partner_ids),
            Booking.booking_status.in_(["Confirmed", "Completed"]),
        )
    ).all()

    bookings_by_partner: Dict[str, List[str]] = {}
    for row in bookings_rows:
        bookings_by_partner.setdefault(row.channel_partner_id, []).append(row.lead_id)

    # 6. Build Partner List Items
    items: List[PartnerListItem] = []
    for partner in partners:
        cp_id = partner.id
        l_stat = lead_stats_map.get(
            cp_id, {"total_leads": 0, "valid_leads": 0, "qualified_leads": 0}
        )
        v_stat = visit_stats_map.get(
            cp_id, {"completed_visits": 0, "unique_visited_leads": 0}
        )
        cp_visited_leads = visited_leads_by_partner.get(cp_id, set())
        cp_booking_lead_ids = bookings_by_partner.get(cp_id, [])

        confirmed_count = len(cp_booking_lead_ids)
        confirmed_from_visited = sum(
            1 for lid in cp_booking_lead_ids if lid in cp_visited_leads
        )

        visit_to_booking_rate = calculate_visit_to_booking_rate(
            confirmed_from_visited, v_stat["unique_visited_leads"]
        )
        overall_conversion_rate = calculate_overall_lead_to_booking_rate(
            confirmed_count, l_stat["valid_leads"]
        )

        salesperson_info = None
        if partner.assigned_salesperson:
            salesperson_info = SalespersonBasic(
                id=partner.assigned_salesperson.id,
                name=partner.assigned_salesperson.name,
            )

        summary_stats = PartnerSummaryStats(
            total_leads=l_stat["total_leads"],
            qualified_leads=l_stat["qualified_leads"],
            completed_visits=v_stat["completed_visits"],
            confirmed_bookings=confirmed_count,
            visit_to_booking_rate_pct=visit_to_booking_rate,
            overall_conversion_rate_pct=overall_conversion_rate,
        )

        items.append(
            PartnerListItem(
                id=partner.id,
                partner_code=partner.partner_code,
                name=partner.name,
                legal_name=partner.legal_name,
                contact_person=partner.contact_person,
                phone=partner.phone,
                email=partner.email,
                city=partner.city,
                location=partner.location,
                onboarding_date=partner.onboarding_date,
                active=partner.active,
                tier=partner.tier,
                channel_type=partner.channel_type,
                assigned_salesperson=salesperson_info,
                summary_stats=summary_stats,
            )
        )

    return PartnerListResponse(
        items=items,
        pagination=PaginationMetadata(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


def get_partner_by_id(db: Session, partner_id: str) -> PartnerDetailResponse:
    """Retrieve detailed partner profile, assigned relationship manager, and full funnel metrics."""
    partner = db.scalar(
        select(ChannelPartner)
        .options(joinedload(ChannelPartner.assigned_salesperson))
        .where(ChannelPartner.id == partner_id.strip())
    )

    if not partner:
        raise HTTPException(
            status_code=404,
            detail=f"Channel Partner with ID '{partner_id}' was not found.",
        )

    # 1. Lead funnel metrics
    leads = db.scalars(
        select(Lead).where(Lead.channel_partner_id == partner.id)
    ).all()
    total_leads = len(leads)
    valid_leads = [ld for ld in leads if ld.status != "Invalid"]
    qualified_leads = [ld for ld in leads if ld.qualified_at is not None]
    qualification_rate_pct = (
        round((len(qualified_leads) / len(valid_leads)) * 100.0, 2)
        if valid_leads
        else 0.0
    )

    # 2. Site visit metrics
    visits = db.scalars(
        select(SiteVisit).where(SiteVisit.channel_partner_id == partner.id)
    ).all()
    scheduled_visits = len(visits)
    completed_visits = [v for v in visits if v.status == "Completed"]
    visit_completion_rate_pct = calculate_visit_completion_rate(
        len(completed_visits), scheduled_visits
    )
    visited_lead_ids = {v.lead_id for v in completed_visits}
    unique_visited_leads = len(visited_lead_ids)

    qualified_lead_ids = {ld.id for ld in qualified_leads}
    visited_qualified_lead_ids = visited_lead_ids.intersection(qualified_lead_ids)
    qual_to_visit_rate = calculate_qualified_lead_to_visit_rate(
        len(visited_qualified_lead_ids), len(qualified_leads)
    )

    # 3. Booking metrics & gross volume
    bookings = db.scalars(
        select(Booking).where(Booking.channel_partner_id == partner.id)
    ).all()
    confirmed_bookings = [
        b for b in bookings if b.booking_status in ("Confirmed", "Completed")
    ]
    confirmed_from_visited = [
        b for b in confirmed_bookings if b.lead_id in visited_lead_ids
    ]
    visit_to_booking_rate_pct = calculate_visit_to_booking_rate(
        len(confirmed_from_visited), unique_visited_leads
    )
    overall_conversion_rate_pct = calculate_overall_lead_to_booking_rate(
        len(confirmed_bookings), len(valid_leads)
    )
    gross_booking_value_inr = float(
        sum(b.booking_value for b in confirmed_bookings)
    )

    metrics = PartnerDetailedMetrics(
        total_leads=total_leads,
        qualified_leads=len(qualified_leads),
        qualification_rate_pct=qualification_rate_pct,
        scheduled_site_visits=scheduled_visits,
        completed_site_visits=len(completed_visits),
        visit_completion_rate_pct=visit_completion_rate_pct,
        unique_visited_leads=unique_visited_leads,
        qualified_lead_to_visit_rate_pct=qual_to_visit_rate,
        confirmed_bookings=len(confirmed_bookings),
        visit_to_booking_rate_pct=visit_to_booking_rate_pct,
        overall_conversion_rate_pct=overall_conversion_rate_pct,
        gross_booking_value_inr=gross_booking_value_inr,
    )

    # 4. Recent Leads (limit 10, newest first)
    recent_leads_records = db.scalars(
        select(Lead)
        .options(joinedload(Lead.project))
        .where(Lead.channel_partner_id == partner.id)
        .order_by(Lead.created_at.desc(), Lead.id.desc())
        .limit(10)
    ).all()

    recent_leads = [
        PartnerRecentLeadItem(
            id=ld.id,
            lead_code=ld.lead_code,
            customer_name=ld.customer_name,
            customer_phone=ld.customer_phone,
            customer_email=ld.customer_email,
            project_id=ld.project_id,
            project_name=ld.project.name if ld.project else "Unknown Project",
            status=ld.status,
            budget_range=ld.budget_range,
            requirement_type=ld.requirement_type,
            created_at=ld.created_at,
            qualified_at=ld.qualified_at,
        )
        for ld in recent_leads_records
    ]

    # 5. Recent Bookings (limit 10, newest first)
    recent_bookings_records = db.scalars(
        select(Booking)
        .options(
            joinedload(Booking.project),
            joinedload(Booking.lead),
            joinedload(Booking.salesperson),
        )
        .where(Booking.channel_partner_id == partner.id)
        .order_by(Booking.created_at.desc(), Booking.id.desc())
        .limit(10)
    ).all()

    recent_bookings = [
        PartnerRecentBookingItem(
            id=bk.id,
            booking_reference=bk.booking_reference,
            lead_id=bk.lead_id,
            customer_name=bk.lead.customer_name if bk.lead else "Unknown Client",
            project_id=bk.project_id,
            project_name=bk.project.name if bk.project else "Unknown Project",
            unit_number=bk.unit_number,
            unit_type=bk.unit_type,
            booking_date=bk.booking_date,
            booking_status=bk.booking_status,
            booking_value=float(bk.booking_value),
            token_amount=float(bk.token_amount),
            commission_rate_pct=float(bk.commission_rate_pct),
            commission_amount=float(bk.commission_amount),
            salesperson_name=bk.salesperson.name if bk.salesperson else "Unknown",
            created_at=bk.created_at,
        )
        for bk in recent_bookings_records
    ]

    # 6. Assigned Salesperson Details
    salesperson_detail = None
    if partner.assigned_salesperson:
        salesperson_detail = SalespersonDetail(
            id=partner.assigned_salesperson.id,
            name=partner.assigned_salesperson.name,
            email=partner.assigned_salesperson.email,
            phone=partner.assigned_salesperson.phone,
        )

    return PartnerDetailResponse(
        id=partner.id,
        partner_code=partner.partner_code,
        name=partner.name,
        legal_name=partner.legal_name,
        contact_person=partner.contact_person,
        phone=partner.phone,
        email=partner.email,
        city=partner.city,
        location=partner.location,
        onboarding_date=partner.onboarding_date,
        active=partner.active,
        tier=partner.tier,
        channel_type=partner.channel_type,
        notes=partner.notes,
        assigned_salesperson=salesperson_detail,
        metrics=metrics,
        recent_leads=recent_leads,
        recent_bookings=recent_bookings,
    )
