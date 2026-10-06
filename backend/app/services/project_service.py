"""Project query and portfolio calculation service."""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Set

from fastapi import HTTPException
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.domain_semantics import (
    calculate_overall_lead_to_booking_rate,
    calculate_qualified_lead_to_visit_rate,
    calculate_visit_completion_rate,
    calculate_visit_to_booking_rate,
    get_project_family,
)
from app.models.entities import Booking, ChannelPartner, Lead, Project, SiteVisit
from app.schemas.projects import (
    PaginationMetadata,
    ProjectBookingMetrics,
    ProjectDetailResponse,
    ProjectInventoryMetrics,
    ProjectLeadMetrics,
    ProjectListItem,
    ProjectListResponse,
    ProjectMonthlyTrendItem,
    ProjectPartnerMetrics,
    ProjectPortfolioSummary,
    ProjectRecentBookingItem,
    ProjectSiteVisitMetrics,
    ProjectSummaryMetrics,
    ProjectTopPartnerItem,
)

MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]


def get_projects_directory(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    family: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = None,
) -> ProjectListResponse:
    """Retrieve paginated projects directory with real-time portfolio metrics and KPIs."""
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    elif page_size > 100:
        page_size = 100

    query = select(Project)

    # 1. Filters
    if search:
        search_clean = search.strip().lower()
        search_pattern = f"%{search_clean}%"
        query = query.where(
            or_(
                func.lower(Project.name).like(search_pattern),
                func.lower(Project.project_code).like(search_pattern),
            )
        )

    if family:
        fam_clean = family.strip().lower()
        if fam_clean == "skyfinia":
            query = query.where(
                or_(
                    func.lower(Project.name).like("%skyfinia%"),
                    func.lower(Project.project_code).like("%sky%"),
                )
            )
        elif fam_clean == "infinia":
            query = query.where(
                or_(
                    func.lower(Project.name).like("%infinia%"),
                    func.lower(Project.project_code).like("%inf%"),
                )
            )

    if status:
        query = query.where(Project.status == status.strip())

    # 2. Portfolio-Wide Summary Statistics (across all database projects)
    all_projects = db.scalars(select(Project)).all()
    total_target_units = sum(p.target_units for p in all_projects)
    total_available_units = sum(p.available_units for p in all_projects)

    all_confirmed_bookings = db.scalars(
        select(Booking).where(
            Booking.booking_status.in_(["Confirmed", "Completed"])
        )
    ).all()
    total_booked_units = len(all_confirmed_bookings)
    total_booking_value_inr = sum(
        float(b.booking_value) for b in all_confirmed_bookings
    )

    portfolio_summary = ProjectPortfolioSummary(
        total_projects=len(all_projects),
        total_families=2,
        total_target_units=total_target_units,
        total_available_units=total_available_units,
        total_booked_units=total_booked_units,
        total_booking_value_inr=total_booking_value_inr,
    )

    # 3. Total Matching Count for Filtered Query
    count_subq = query.order_by(None).subquery()
    total = db.scalar(select(func.count()).select_from(count_subq)) or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    # 4. Fetch All Matching Projects for in-memory KPI synthesis
    matched_projects = db.scalars(query).all()
    project_ids = [p.id for p in matched_projects]

    if not project_ids:
        return ProjectListResponse(
            items=[],
            pagination=PaginationMetadata(
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
            ),
            portfolio_summary=portfolio_summary,
        )

    # 5. Batch Aggregations per Project (Zero N+1)
    # 5a. Lead stats per project
    lead_rows = db.execute(
        select(
            Lead.project_id,
            func.count(Lead.id).label("total_leads"),
            func.count(func.nullif(Lead.status, "Invalid")).label("valid_leads"),
            func.count(Lead.qualified_at).label("qualified_leads"),
        )
        .where(Lead.project_id.in_(project_ids))
        .group_by(Lead.project_id)
    ).all()
    lead_stats: Dict[str, dict] = {
        row.project_id: {
            "total_leads": row.total_leads,
            "valid_leads": row.valid_leads,
            "qualified_leads": row.qualified_leads,
        }
        for row in lead_rows
    }

    # 5b. Site visit stats per project
    visit_rows = db.execute(
        select(
            SiteVisit.project_id,
            func.count(SiteVisit.id).label("completed_visits"),
        )
        .where(
            SiteVisit.project_id.in_(project_ids),
            SiteVisit.status == "Completed",
        )
        .group_by(SiteVisit.project_id)
    ).all()
    visit_stats: Dict[str, int] = {
        row.project_id: row.completed_visits for row in visit_rows
    }

    # 5c. Booking stats per project
    booking_rows = db.execute(
        select(
            Booking.project_id,
            func.count(Booking.id).label("confirmed_bookings"),
            func.coalesce(func.sum(Booking.booking_value), 0).label(
                "gross_booking_value"
            ),
        )
        .where(
            Booking.project_id.in_(project_ids),
            Booking.booking_status.in_(["Confirmed", "Completed"]),
        )
        .group_by(Booking.project_id)
    ).all()
    booking_stats: Dict[str, dict] = {
        row.project_id: {
            "confirmed_bookings": row.confirmed_bookings,
            "gross_booking_value": float(row.gross_booking_value),
        }
        for row in booking_rows
    }

    # 6. Synthesize Items
    items: List[ProjectListItem] = []
    for prj in matched_projects:
        l_stat = lead_stats.get(
            prj.id, {"total_leads": 0, "valid_leads": 0, "qualified_leads": 0}
        )
        v_count = visit_stats.get(prj.id, 0)
        b_stat = booking_stats.get(
            prj.id, {"confirmed_bookings": 0, "gross_booking_value": 0.0}
        )

        t_leads = l_stat["total_leads"]
        v_leads = l_stat["valid_leads"]
        q_leads = l_stat["qualified_leads"]
        c_bookings = b_stat["confirmed_bookings"]
        g_val = b_stat["gross_booking_value"]

        q_rate = round((q_leads / v_leads) * 100.0, 2) if v_leads > 0 else 0.0
        util_pct = (
            round((c_bookings / prj.target_units) * 100.0, 2)
            if prj.target_units > 0
            else 0.0
        )
        conv_rate = calculate_overall_lead_to_booking_rate(c_bookings, v_leads)

        summary_metrics = ProjectSummaryMetrics(
            target_units=prj.target_units,
            available_units=prj.available_units,
            booked_units=c_bookings,
            inventory_utilization_pct=util_pct,
            total_leads=t_leads,
            valid_leads=v_leads,
            qualified_leads=q_leads,
            qualification_rate_pct=q_rate,
            completed_visits=v_count,
            confirmed_bookings=c_bookings,
            gross_booking_value_inr=g_val,
            overall_conversion_rate_pct=conv_rate,
        )

        items.append(
            ProjectListItem(
                id=prj.id,
                project_code=prj.project_code,
                name=prj.name,
                project_family=get_project_family(prj.name, prj.project_code),
                project_type=prj.project_type,
                location=prj.location,
                city=prj.city,
                status=prj.status,
                launch_date=prj.launch_date,
                target_units=prj.target_units,
                available_units=prj.available_units,
                starting_price=float(prj.starting_price),
                metrics=summary_metrics,
            )
        )

    # 7. In-memory Sorting with Deterministic Secondary Tie-Breaker
    if sort_by == "target_units":
        items.sort(key=lambda item: (-item.target_units, item.id))
    elif sort_by == "available_units":
        items.sort(key=lambda item: (-item.available_units, item.id))
    elif sort_by == "booked_units":
        items.sort(key=lambda item: (-item.metrics.booked_units, item.id))
    elif sort_by == "booking_value":
        items.sort(
            key=lambda item: (-item.metrics.gross_booking_value_inr, item.id)
        )
    elif sort_by == "name":
        items.sort(key=lambda item: (item.name, item.id))
    else:
        items.sort(key=lambda item: (item.name, item.id))

    # 8. Pagination Slice
    offset = (page - 1) * page_size
    paged_items = items[offset : offset + page_size]

    return ProjectListResponse(
        items=paged_items,
        pagination=PaginationMetadata(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
        portfolio_summary=portfolio_summary,
    )


def get_project_detail(db: Session, project_id: str) -> ProjectDetailResponse:
    """Retrieve detailed project profile, inventory, funnels, top partners, and recent closures."""
    clean_id = project_id.strip() if project_id else ""
    project = db.scalar(
        select(Project).where(
            or_(
                Project.id == clean_id,
                Project.project_code.ilike(clean_id),
            )
        )
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project with identifier '{project_id}' was not found.",
        )

    # 1. Inventory & Booking Statistics
    confirmed_bookings_list = db.scalars(
        select(Booking).where(
            Booking.project_id == project.id,
            Booking.booking_status.in_(["Confirmed", "Completed"]),
        )
    ).all()
    booked_units = len(confirmed_bookings_list)
    gross_booking_val = sum(
        float(b.booking_value) for b in confirmed_bookings_list
    )
    inv_utilization = (
        round((booked_units / project.target_units) * 100.0, 2)
        if project.target_units > 0
        else 0.0
    )

    inventory_metrics = ProjectInventoryMetrics(
        target_units=project.target_units,
        available_units=project.available_units,
        booked_units=booked_units,
        inventory_utilization_pct=inv_utilization,
    )

    # 2. Lead Metrics
    total_leads = (
        db.scalar(
            select(func.count(Lead.id)).where(Lead.project_id == project.id)
        )
        or 0
    )
    valid_leads = (
        db.scalar(
            select(func.count(Lead.id)).where(
                Lead.project_id == project.id, Lead.status != "Invalid"
            )
        )
        or 0
    )
    qualified_leads = (
        db.scalar(
            select(func.count(Lead.id)).where(
                Lead.project_id == project.id, Lead.qualified_at.is_not(None)
            )
        )
        or 0
    )
    qual_rate = (
        round((qualified_leads / valid_leads) * 100.0, 2)
        if valid_leads > 0
        else 0.0
    )

    lead_metrics = ProjectLeadMetrics(
        total_leads=total_leads,
        valid_leads=valid_leads,
        qualified_leads=qualified_leads,
        qualification_rate_pct=qual_rate,
    )

    # 3. Site Visit Metrics
    scheduled_visits = (
        db.scalar(
            select(func.count(SiteVisit.id)).where(
                SiteVisit.project_id == project.id
            )
        )
        or 0
    )
    completed_visits = (
        db.scalar(
            select(func.count(SiteVisit.id)).where(
                SiteVisit.project_id == project.id,
                SiteVisit.status == "Completed",
            )
        )
        or 0
    )
    visit_comp_rate = calculate_visit_completion_rate(
        completed_visits, scheduled_visits
    )

    visited_lead_ids: Set[str] = set(
        db.scalars(
            select(SiteVisit.lead_id)
            .distinct()
            .where(
                SiteVisit.project_id == project.id,
                SiteVisit.status == "Completed",
            )
        ).all()
    )
    unique_visited_leads = len(visited_lead_ids)

    qualified_lead_ids: Set[str] = set(
        db.scalars(
            select(Lead.id)
            .distinct()
            .where(
                Lead.project_id == project.id,
                Lead.qualified_at.is_not(None),
            )
        ).all()
    )
    unique_visited_qualified_leads = len(
        visited_lead_ids.intersection(qualified_lead_ids)
    )
    qual_to_visit_rate = calculate_qualified_lead_to_visit_rate(
        unique_visited_qualified_leads, qualified_leads
    )

    site_visit_metrics = ProjectSiteVisitMetrics(
        scheduled_visits=scheduled_visits,
        completed_visits=completed_visits,
        visit_completion_rate_pct=visit_comp_rate,
        unique_visited_leads=unique_visited_leads,
        qualified_lead_to_visit_rate_pct=qual_to_visit_rate,
    )

    # 4. Booking Conversion Metrics (Direct Bookings Isolation)
    confirmed_from_visited = sum(
        1 for b in confirmed_bookings_list if b.lead_id in visited_lead_ids
    )
    direct_confirmed = booked_units - confirmed_from_visited
    visit_to_booking_rate = calculate_visit_to_booking_rate(
        confirmed_from_visited, unique_visited_leads
    )
    overall_conv_rate = calculate_overall_lead_to_booking_rate(
        booked_units, valid_leads
    )

    booking_metrics = ProjectBookingMetrics(
        confirmed_bookings=booked_units,
        confirmed_from_visited_leads=confirmed_from_visited,
        direct_confirmed_bookings=direct_confirmed,
        visit_to_booking_rate_pct=visit_to_booking_rate,
        overall_lead_to_booking_rate_pct=overall_conv_rate,
        gross_booking_value_inr=gross_booking_val,
    )

    # 5. Partner Metrics
    contributing_lead_partners = (
        db.scalar(
            select(func.count(distinct(Lead.channel_partner_id))).where(
                Lead.project_id == project.id,
                Lead.status != "Invalid",
            )
        )
        or 0
    )
    contributing_booking_partners = (
        db.scalar(
            select(func.count(distinct(Booking.channel_partner_id))).where(
                Booking.project_id == project.id,
                Booking.booking_status.in_(["Confirmed", "Completed"]),
            )
        )
        or 0
    )

    partner_metrics = ProjectPartnerMetrics(
        contributing_lead_partners=contributing_lead_partners,
        contributing_booking_partners=contributing_booking_partners,
    )

    # 6. Monthly Trends (12-month 2026 Chronology)
    # Group leads by month of created_at
    lead_monthly_rows = db.execute(
        select(
            func.strftime("%m", Lead.created_at).label("m"),
            func.count(Lead.id).label("cnt"),
        )
        .where(
            Lead.project_id == project.id,
            Lead.status != "Invalid",
        )
        .group_by("m")
    ).all()
    leads_by_month: Dict[int, int] = {
        int(r.m): r.cnt for r in lead_monthly_rows if r.m
    }

    # Group visits by month of visited_at
    visit_monthly_rows = db.execute(
        select(
            func.strftime("%m", SiteVisit.visited_at).label("m"),
            func.count(SiteVisit.id).label("cnt"),
        )
        .where(
            SiteVisit.project_id == project.id,
            SiteVisit.status == "Completed",
            SiteVisit.visited_at.is_not(None),
        )
        .group_by("m")
    ).all()
    visits_by_month: Dict[int, int] = {
        int(r.m): r.cnt for r in visit_monthly_rows if r.m
    }

    # Group bookings by month of booking_date
    booking_monthly_rows = db.execute(
        select(
            func.strftime("%m", Booking.booking_date).label("m"),
            func.count(Booking.id).label("cnt"),
        )
        .where(
            Booking.project_id == project.id,
            Booking.booking_status.in_(["Confirmed", "Completed"]),
        )
        .group_by("m")
    ).all()
    bookings_by_month: Dict[int, int] = {
        int(r.m): r.cnt for r in booking_monthly_rows if r.m
    }

    monthly_trends: List[ProjectMonthlyTrendItem] = [
        ProjectMonthlyTrendItem(
            month=MONTH_NAMES[m_idx - 1],
            leads=leads_by_month.get(m_idx, 0),
            completed_visits=visits_by_month.get(m_idx, 0),
            bookings=bookings_by_month.get(m_idx, 0),
        )
        for m_idx in range(1, 13)
    ]

    # 7. Top Channel Partners Ranking (Top 10)
    partner_leads_rows = db.execute(
        select(
            Lead.channel_partner_id,
            func.count(Lead.id).label("v_leads"),
        )
        .where(
            Lead.project_id == project.id,
            Lead.status != "Invalid",
        )
        .group_by(Lead.channel_partner_id)
    ).all()
    partner_lead_counts: Dict[str, int] = {
        r.channel_partner_id: r.v_leads for r in partner_leads_rows
    }

    partner_visit_rows = db.execute(
        select(
            SiteVisit.channel_partner_id,
            func.count(SiteVisit.id).label("c_visits"),
        )
        .where(
            SiteVisit.project_id == project.id,
            SiteVisit.status == "Completed",
        )
        .group_by(SiteVisit.channel_partner_id)
    ).all()
    partner_visit_counts: Dict[str, int] = {
        r.channel_partner_id: r.c_visits for r in partner_visit_rows
    }

    partner_booking_rows = db.execute(
        select(
            Booking.channel_partner_id,
            func.count(Booking.id).label("c_bookings"),
            func.coalesce(func.sum(Booking.booking_value), 0).label("g_val"),
        )
        .where(
            Booking.project_id == project.id,
            Booking.booking_status.in_(["Confirmed", "Completed"]),
        )
        .group_by(Booking.channel_partner_id)
    ).all()
    partner_booking_counts: Dict[str, dict] = {
        r.channel_partner_id: {
            "c_bookings": r.c_bookings,
            "g_val": float(r.g_val),
        }
        for r in partner_booking_rows
    }

    active_partner_ids = set(partner_lead_counts.keys()).union(
        partner_booking_counts.keys()
    )
    top_partners_list: List[ProjectTopPartnerItem] = []

    if active_partner_ids:
        partners = db.scalars(
            select(ChannelPartner)
            .options(joinedload(ChannelPartner.assigned_salesperson))
            .where(ChannelPartner.id.in_(active_partner_ids))
        ).all()

        for p in partners:
            p_leads = partner_lead_counts.get(p.id, 0)
            p_visits = partner_visit_counts.get(p.id, 0)
            p_b_data = partner_booking_counts.get(
                p.id, {"c_bookings": 0, "g_val": 0.0}
            )
            p_bookings = p_b_data["c_bookings"]
            p_val = p_b_data["g_val"]
            p_conv = (
                round((p_bookings / p_leads) * 100.0, 2)
                if p_leads > 0
                else 0.0
            )

            top_partners_list.append(
                ProjectTopPartnerItem(
                    partner_id=p.id,
                    partner_code=p.partner_code,
                    partner_name=p.name,
                    tier=p.tier,
                    assigned_salesperson_name=(
                        p.assigned_salesperson.name
                        if p.assigned_salesperson
                        else None
                    ),
                    valid_leads=p_leads,
                    completed_visits=p_visits,
                    confirmed_bookings=p_bookings,
                    booking_value_inr=p_val,
                    overall_conversion_rate_pct=p_conv,
                )
            )

        # Deterministic sorting: Bookings DESC, Value DESC, Leads DESC, Name ASC
        top_partners_list.sort(
            key=lambda item: (
                -item.confirmed_bookings,
                -item.booking_value_inr,
                -item.valid_leads,
                item.partner_name,
            )
        )
        top_partners_list = top_partners_list[:10]

    # 8. Recent Project Bookings (Latest 10 Confirmed/Completed)
    recent_booking_records = db.scalars(
        select(Booking)
        .options(
            joinedload(Booking.lead),
            joinedload(Booking.channel_partner),
        )
        .where(
            Booking.project_id == project.id,
            Booking.booking_status.in_(["Confirmed", "Completed"]),
        )
        .order_by(Booking.booking_date.desc(), Booking.id.desc())
        .limit(10)
    ).all()

    recent_bookings = [
        ProjectRecentBookingItem(
            id=bk.id,
            booking_reference=bk.booking_reference,
            lead_id=bk.lead_id,
            customer_name=bk.lead.customer_name if bk.lead else "Unknown Customer",
            channel_partner_id=bk.channel_partner_id,
            channel_partner_name=(
                bk.channel_partner.name if bk.channel_partner else "Unknown Partner"
            ),
            unit_number=bk.unit_number,
            unit_type=bk.unit_type,
            booking_date=bk.booking_date,
            booking_status=bk.booking_status,
            booking_value=float(bk.booking_value),
        )
        for bk in recent_booking_records
    ]

    return ProjectDetailResponse(
        id=project.id,
        project_code=project.project_code,
        name=project.name,
        project_family=get_project_family(project.name, project.project_code),
        project_type=project.project_type,
        location=project.location,
        city=project.city,
        status=project.status,
        launch_date=project.launch_date,
        target_units=project.target_units,
        available_units=project.available_units,
        starting_price=float(project.starting_price),
        inventory=inventory_metrics,
        lead_metrics=lead_metrics,
        site_visit_metrics=site_visit_metrics,
        booking_metrics=booking_metrics,
        partner_metrics=partner_metrics,
        monthly_trends=monthly_trends,
        top_partners=top_partners_list,
        recent_bookings=recent_bookings,
    )
