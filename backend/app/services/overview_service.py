"""Overview summary service for executive dashboard analytics.

Implements all approved Phase 2 KPI definitions, milestone-based qualification,
date filtering, project scoping, monthly trend aggregation, and recent activity logging.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy import and_, distinct, func, not_
from sqlalchemy.orm import Session

from app.core.domain_semantics import (
    calculate_overall_lead_to_booking_rate,
    calculate_qualified_lead_to_visit_rate,
    calculate_visit_completion_rate,
    calculate_visit_to_booking_rate,
)
from app.models.entities import (
    Booking,
    BookingStatus,
    ChannelPartner,
    Lead,
    PartnerActivity,
    PartnerTier,
    Project,
    SiteVisit,
    SiteVisitStatus,
)
from app.schemas.overview import (
    ActivePartnersBreakdown,
    ActivePartnersKpi,
    AttentionAlertItem,
    BookingsVelocityKpi,
    ChannelLeadFlowKpi,
    MonthlyTrendItem,
    OverviewKpis,
    OverviewSummaryResponse,
    PartnerTierDistributionItem,
    RecentActivityItem,
    SiteVisitsKpi,
)


def _format_time_ago(dt: datetime, reference_dt: Optional[datetime] = None) -> str:
    """Generate human-readable relative time string."""
    ref = reference_dt or datetime.utcnow()
    diff = ref - dt if ref >= dt else timedelta(0)
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "just now"
    if seconds < 3600:
        minutes = seconds // 60
        return f"{minutes}m ago"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours}h ago"
    if seconds < 604800:
        days = seconds // 86400
        return f"{days}d ago"
    return dt.strftime("%b %d, %Y")


def _resolve_activity_tag_and_status(activity_type: str, entity_type: str) -> tuple[str, str]:
    """Determine UI tag and status badge for a partner activity."""
    act_lower = activity_type.lower()
    if "booking" in act_lower:
        if "confirm" in act_lower or "complete" in act_lower:
            return "Booking", "success"
        return "Booking Initiated", "info"
    if "visit" in act_lower:
        if "complete" in act_lower:
            return "Site Visit", "success"
        return "Site Visit", "info"
    if "lead" in act_lower:
        return "Lead Batch", "info"
    if "tier" in act_lower:
        return "Tier Update", "neutral"
    if "meeting" in act_lower or "follow_up" in act_lower:
        return "Engagement", "neutral"
    return entity_type.replace("_", " ").title(), "neutral"


def get_overview_summary(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    project_id: Optional[str] = None,
) -> OverviewSummaryResponse:
    """Compute and consolidate executive dashboard indicators for the requested window."""
    # 1. Parameter Validation
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be greater than end_date.",
        )

    if project_id is not None:
        project_exists = db.query(Project.id).filter(Project.id == project_id).scalar()
        if not project_exists:
            raise HTTPException(
                status_code=404,
                detail=f"Project with ID '{project_id}' was not found.",
            )

    # 2. DateTime Boundary Construction
    start_dt: Optional[datetime] = (
        datetime.combine(start_date, time.min) if start_date else None
    )
    end_dt: Optional[datetime] = (
        datetime.combine(end_date, time.max) if end_date else None
    )

    # Base Filter Criteria Builders
    lead_filters = []
    visit_filters = []
    booking_filters = []

    if project_id:
        lead_filters.append(Lead.project_id == project_id)
        visit_filters.append(SiteVisit.project_id == project_id)
        booking_filters.append(Booking.project_id == project_id)

    if start_dt:
        lead_filters.append(Lead.created_at >= start_dt)
        visit_filters.append(SiteVisit.scheduled_at >= start_dt)
        booking_filters.append(Booking.booking_date >= start_date)

    if end_dt:
        lead_filters.append(Lead.created_at <= end_dt)
        visit_filters.append(SiteVisit.scheduled_at <= end_dt)
        booking_filters.append(Booking.booking_date <= end_date)

    # 3. Lead KPIs
    total_leads = (
        db.query(func.count(Lead.id)).filter(*lead_filters).scalar() or 0
    )
    valid_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.status != "Invalid", *lead_filters)
        .scalar()
        or 0
    )
    qualified_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.qualified_at.isnot(None), *lead_filters)
        .scalar()
        or 0
    )
    qualification_rate_pct = (
        round((qualified_leads / valid_leads) * 100.0, 2) if valid_leads > 0 else 0.0
    )

    # 4. Site Visit KPIs
    total_scheduled_visits = (
        db.query(func.count(SiteVisit.id)).filter(*visit_filters).scalar() or 0
    )
    total_completed_visits = (
        db.query(func.count(SiteVisit.id))
        .filter(SiteVisit.status == SiteVisitStatus.COMPLETED.value, *visit_filters)
        .scalar()
        or 0
    )
    visit_completion_rate_pct = calculate_visit_completion_rate(
        completed_visits=total_completed_visits,
        scheduled_visits=total_scheduled_visits,
    )

    # Unique Visited Leads (Distinct lead IDs with >= 1 completed visit)
    unique_visited_leads = (
        db.query(func.count(distinct(SiteVisit.lead_id)))
        .filter(SiteVisit.status == SiteVisitStatus.COMPLETED.value, *visit_filters)
        .scalar()
        or 0
    )

    # Unique Qualified Visited Leads (Distinct qualified lead IDs with >= 1 completed visit)
    qual_visit_lead_query = (
        db.query(func.count(distinct(Lead.id)))
        .join(SiteVisit, SiteVisit.lead_id == Lead.id)
        .filter(
            Lead.qualified_at.isnot(None),
            SiteVisit.status == SiteVisitStatus.COMPLETED.value,
            *lead_filters,
        )
    )
    unique_qual_visited_leads = qual_visit_lead_query.scalar() or 0
    qualified_lead_to_visit_rate_pct = calculate_qualified_lead_to_visit_rate(
        unique_visited_qualified_leads=unique_qual_visited_leads,
        total_qualified_leads=qualified_leads,
    )

    # 5. Bookings KPIs
    confirmed_statuses = [BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value]
    confirmed_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.booking_status.in_(confirmed_statuses), *booking_filters)
        .scalar()
        or 0
    )

    # Visited Lead IDs subquery for attributing bookings to site visits
    visited_lead_ids_subquery = (
        db.query(SiteVisit.lead_id)
        .filter(SiteVisit.status == SiteVisitStatus.COMPLETED.value)
        .distinct()
    )
    if project_id:
        visited_lead_ids_subquery = visited_lead_ids_subquery.filter(
            SiteVisit.project_id == project_id
        )

    confirmed_from_visited = (
        db.query(func.count(Booking.id))
        .filter(
            Booking.booking_status.in_(confirmed_statuses),
            Booking.lead_id.in_(visited_lead_ids_subquery),
            *booking_filters,
        )
        .scalar()
        or 0
    )

    direct_confirmed = (
        db.query(func.count(Booking.id))
        .filter(
            Booking.booking_status.in_(confirmed_statuses),
            not_(Booking.lead_id.in_(visited_lead_ids_subquery)),
            *booking_filters,
        )
        .scalar()
        or 0
    )

    total_value_raw = (
        db.query(func.sum(Booking.booking_value))
        .filter(Booking.booking_status.in_(confirmed_statuses), *booking_filters)
        .scalar()
    )
    total_value_inr = float(total_value_raw) if total_value_raw is not None else 0.0

    visit_to_booking_rate_pct = calculate_visit_to_booking_rate(
        confirmed_bookings_from_visited_leads=confirmed_from_visited,
        unique_visited_leads=unique_visited_leads,
    )
    overall_conversion_rate_pct = calculate_overall_lead_to_booking_rate(
        confirmed_bookings=confirmed_bookings,
        total_valid_leads=valid_leads,
    )

    # 6. Active Partners (Trailing 90 days relative to analytical end date)
    if end_dt:
        anchor_dt = end_dt
    else:
        max_activity_dt = db.query(func.max(PartnerActivity.logged_at)).scalar()
        anchor_dt = max_activity_dt or datetime.utcnow()

    cutoff_90d = anchor_dt - timedelta(days=90)

    # Query active partner IDs with >=1 activity in [cutoff_90d, anchor_dt]
    active_partners_q = (
        db.query(ChannelPartner.id, ChannelPartner.tier)
        .join(PartnerActivity, PartnerActivity.channel_partner_id == ChannelPartner.id)
        .filter(
            and_(
                ChannelPartner.active.is_(True),
                PartnerActivity.logged_at >= cutoff_90d,
                PartnerActivity.logged_at <= anchor_dt,
            )
        )
        .distinct()
    )
    active_partner_rows = active_partners_q.all()
    active_partners_count = len(active_partner_rows)

    active_tier_1 = sum(1 for row in active_partner_rows if row.tier == PartnerTier.TIER_1.value)
    active_tier_2 = sum(1 for row in active_partner_rows if row.tier == PartnerTier.TIER_2.value)
    active_tier_3 = sum(1 for row in active_partner_rows if row.tier == PartnerTier.TIER_3.value)

    # 7. Partner Tier Distribution (All registered partners)
    all_partners_q = (
        db.query(ChannelPartner.tier, func.count(ChannelPartner.id))
        .group_by(ChannelPartner.tier)
        .all()
    )
    tier_counts = {row[0]: row[1] for row in all_partners_q}
    total_all_partners = sum(tier_counts.values())

    tier_labels = [
        (PartnerTier.TIER_1.value, "Tier 1 (Elite)"),
        (PartnerTier.TIER_2.value, "Tier 2 (Growth)"),
        (PartnerTier.TIER_3.value, "Tier 3 (Active)"),
    ]

    tier_breakdown: List[PartnerTierDistributionItem] = []
    for tier_enum_val, label in tier_labels:
        count = tier_counts.get(tier_enum_val, 0)
        pct = round((count / total_all_partners * 100.0), 1) if total_all_partners > 0 else 0.0
        tier_breakdown.append(
            PartnerTierDistributionItem(
                tier=label,
                partners_count=count,
                percentage=pct,
                contribution=f"{pct:.1f}%",
            )
        )

    # 8. Monthly Trends Aggregation
    # Group leads, completed visits, and confirmed bookings by YYYY-MM
    lead_monthly_q = (
        db.query(
            func.strftime("%Y-%m", Lead.created_at).label("m"),
            func.count(Lead.id),
        )
        .filter(Lead.status != "Invalid", *lead_filters)
        .group_by("m")
        .all()
    )

    visit_monthly_q = (
        db.query(
            func.strftime("%Y-%m", SiteVisit.visited_at).label("m"),
            func.count(SiteVisit.id),
        )
        .filter(SiteVisit.status == SiteVisitStatus.COMPLETED.value, *visit_filters)
        .group_by("m")
        .all()
    )

    booking_monthly_q = (
        db.query(
            func.strftime("%Y-%m", Booking.booking_date).label("m"),
            func.count(Booking.id),
        )
        .filter(Booking.booking_status.in_(confirmed_statuses), *booking_filters)
        .group_by("m")
        .all()
    )

    monthly_dict: Dict[str, Dict[str, int]] = {}
    for m, cnt in lead_monthly_q:
        if m:
            entry = monthly_dict.setdefault(m, {"leads": 0, "site_visits": 0, "bookings": 0})
            entry["leads"] = cnt
    for m, cnt in visit_monthly_q:
        if m:
            entry = monthly_dict.setdefault(m, {"leads": 0, "site_visits": 0, "bookings": 0})
            entry["site_visits"] = cnt
    for m, cnt in booking_monthly_q:
        if m:
            entry = monthly_dict.setdefault(m, {"leads": 0, "site_visits": 0, "bookings": 0})
            entry["bookings"] = cnt

    monthly_trends: List[MonthlyTrendItem] = []
    for ym in sorted(monthly_dict.keys()):
        try:
            m_label = datetime.strptime(ym, "%Y-%m").strftime("%b")
        except ValueError:
            m_label = ym
        monthly_trends.append(
            MonthlyTrendItem(
                month=m_label,
                leads=monthly_dict[ym]["leads"],
                site_visits=monthly_dict[ym]["site_visits"],
                bookings=monthly_dict[ym]["bookings"],
            )
        )

    # 9. Recent Activities
    recent_act_query = (
        db.query(PartnerActivity)
        .join(ChannelPartner, ChannelPartner.id == PartnerActivity.channel_partner_id)
        .order_by(PartnerActivity.logged_at.desc())
        .limit(10)
    )
    activities_rows = recent_act_query.all()
    recent_activities: List[RecentActivityItem] = []
    for act in activities_rows:
        tag, status = _resolve_activity_tag_and_status(act.activity_type, act.entity_type)
        time_ago = _format_time_ago(act.logged_at, reference_dt=anchor_dt)
        recent_activities.append(
            RecentActivityItem(
                id=act.id,
                partner_name=act.channel_partner.name if act.channel_partner else "Unknown Partner",
                action=act.description,
                logged_at=act.logged_at,
                time_ago=time_ago,
                status=status,
                tag=tag,
            )
        )

    # 10. Deterministic Attention Alerts
    # Check for genuine deterministic alerts from current database state
    attention_alerts: List[AttentionAlertItem] = []
    projects = db.query(Project).all()
    for prj in projects:
        if prj.target_units > 0 and (prj.available_units / prj.target_units) <= 0.10:
            pct_rem = round((prj.available_units / prj.target_units) * 100, 1)
            attention_alerts.append(
                AttentionAlertItem(
                    id=f"alert-inv-{prj.id}",
                    title=f"Low Inventory: {prj.name}",
                    description=(
                        f"{prj.name} has only {prj.available_units} units "
                        f"({pct_rem}%) remaining in sales inventory."
                    ),
                    severity="warning",
                )
            )

    # 11. Assemble Response
    kpis = OverviewKpis(
        active_partners=ActivePartnersKpi(
            value=active_partners_count,
            growth_pct=None,
            breakdown=ActivePartnersBreakdown(
                tier_1=active_tier_1,
                tier_2=active_tier_2,
                tier_3=active_tier_3,
            ),
        ),
        channel_lead_flow=ChannelLeadFlowKpi(
            value=valid_leads,
            total_leads=total_leads,
            valid_leads=valid_leads,
            qualified_leads=qualified_leads,
            qualification_rate_pct=qualification_rate_pct,
            growth_pct=None,
        ),
        site_visits=SiteVisitsKpi(
            total_scheduled=total_scheduled_visits,
            total_completed=total_completed_visits,
            visit_completion_rate_pct=visit_completion_rate_pct,
            unique_visited_leads=unique_visited_leads,
            qualified_lead_to_visit_rate_pct=qualified_lead_to_visit_rate_pct,
            growth_pct=None,
        ),
        bookings_velocity=BookingsVelocityKpi(
            units_count=confirmed_bookings,
            confirmed_bookings=confirmed_bookings,
            confirmed_from_visited_leads=confirmed_from_visited,
            direct_confirmed_bookings=direct_confirmed,
            total_value_inr=total_value_inr,
            visit_to_booking_rate_pct=visit_to_booking_rate_pct,
            overall_conversion_rate_pct=overall_conversion_rate_pct,
            growth_pct=None,
        ),
    )

    return OverviewSummaryResponse(
        kpis=kpis,
        tier_breakdown=tier_breakdown,
        monthly_trends=monthly_trends,
        recent_activities=recent_activities,
        attention_alerts=attention_alerts,
    )
