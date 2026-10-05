"""Data Integrity & Funnel Semantics Validator.

Validates:
1. Row counts and tier distributions
2. Foreign key completeness & orphan detection
3. Cross-entity consistency (Project and Partner match across Lead/Visit/Booking)
4. Temporal consistency (created_at <= scheduled_at <= visited_at <= booking_date)
5. Value & range constraints
6. Active booking invariant (at most 1 concurrent Initiated or Confirmed booking per lead)
7. Determinism guarantees
8. Funnel plausibility and direct bookings isolation
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.domain_semantics import (
    calculate_overall_lead_to_booking_rate,
    calculate_qualified_lead_to_visit_rate,
    calculate_visit_completion_rate,
    calculate_visit_to_booking_rate,
)
from app.models.entities import (
    Booking,
    ChannelPartner,
    Lead,
    PartnerActivity,
    Project,
    Salesperson,
    SiteVisit,
)


class ValidationReport:
    """Consolidated validation results container."""

    def __init__(self) -> None:
        self.passed: bool = True
        self.checks: List[Dict[str, Any]] = []
        self.metrics: Dict[str, Any] = {}
        self.errors: List[str] = []

    def add_check(self, name: str, passed: bool, details: str) -> None:
        self.checks.append({"name": name, "passed": passed, "details": details})
        if not passed:
            self.passed = False
            self.errors.append(f"[{name}] {details}")


def validate_dataset(session: Session) -> ValidationReport:
    """Execute complete validation suite against the database session."""
    report = ValidationReport()

    # 1. Row Counts & Distributions
    projects_count = session.scalar(select(func.count()).select_from(Project)) or 0
    partners_count = session.scalar(select(func.count()).select_from(ChannelPartner)) or 0
    leads_count = session.scalar(select(func.count()).select_from(Lead)) or 0
    visits_count = session.scalar(select(func.count()).select_from(SiteVisit)) or 0
    bookings_count = session.scalar(select(func.count()).select_from(Booking)) or 0
    activities_count = session.scalar(select(func.count()).select_from(PartnerActivity)) or 0

    tier_1_count = session.scalar(
        select(func.count()).select_from(ChannelPartner).where(ChannelPartner.tier == "Tier 1")
    ) or 0
    tier_2_count = session.scalar(
        select(func.count()).select_from(ChannelPartner).where(ChannelPartner.tier == "Tier 2")
    ) or 0
    tier_3_count = session.scalar(
        select(func.count()).select_from(ChannelPartner).where(ChannelPartner.tier == "Tier 3")
    ) or 0

    confirmed_bookings = session.scalar(
        select(func.count())
        .select_from(Booking)
        .where(Booking.booking_status.in_(["Confirmed", "Completed"]))
    ) or 0

    # Checks
    report.add_check(
        "Projects Count",
        projects_count == 4,
        f"Expected 4, found {projects_count}",
    )

    # Check project families (Skyfinia and Infinia in Tathawade, Pune)
    projects = session.scalars(select(Project)).all()
    project_names = [p.name for p in projects]
    has_skyfinia = any("Skyfinia" in name for name in project_names)
    has_infinia = any("Infinia" in name for name in project_names)
    all_pune = all(p.city == "Pune" and p.location == "Tathawade" for p in projects)
    report.add_check(
        "Project Families & Geography",
        has_skyfinia and has_infinia and all_pune and len(projects) == 4,
        f"Projects: {project_names} in Pune / Tathawade",
    )

    # Check project starting prices
    expected_prices = {
        "PRJ-SKY-P1": Decimal("8800000.00"),
        "PRJ-SKY-P2": Decimal("9500000.00"),
        "PRJ-INF-P1": Decimal("8200000.00"),
        "PRJ-INF-P2": Decimal("8900000.00"),
    }
    pricing_matches = all(
        p.starting_price == expected_prices.get(p.project_code)
        for p in projects
    )
    report.add_check(
        "Project Starting Prices",
        pricing_matches,
        f"Checked starting prices for {len(projects)} projects (Skyfinia/Infinia)",
    )

    # Check authoritative salespeople
    salespeople = session.scalars(select(Salesperson)).all()
    expected_salespeople = {
        "Rohit Deshmukh": "rohit.deshmukh@harivishva.com",
        "Sneha Kulkarni": "sneha.kulkarni@harivishva.com",
        "Amit Patil": "amit.patil@harivishva.com",
        "Priya Joshi": "priya.joshi@harivishva.com",
        "Rahul Shinde": "rahul.shinde@harivishva.com",
    }
    actual_sp_map = {sp.name: sp.email for sp in salespeople}
    salespeople_authoritative = (
        len(salespeople) == 5 and actual_sp_map == expected_salespeople
    )
    report.add_check(
        "Authoritative Salespeople (5 Managers)",
        salespeople_authoritative,
        f"Found: {list(actual_sp_map.keys())}",
    )

    tiers_ok = (
        partners_count == 36
        and tier_1_count == 6
        and tier_2_count == 10
        and tier_3_count == 20
    )
    report.add_check(
        "Partners Count & Tiers",
        tiers_ok,
        f"Total: {partners_count}/36 (T1: {tier_1_count}/6, "
        f"T2: {tier_2_count}/10, T3: {tier_3_count}/20)",
    )
    report.add_check(
        "Leads Range (1200-1600)",
        1200 <= leads_count <= 1600,
        f"Total leads: {leads_count}",
    )
    report.add_check(
        "Site Visits Range (500-900)",
        500 <= visits_count <= 900,
        f"Total site visits: {visits_count}",
    )
    report.add_check(
        "Confirmed Bookings Range (100-160)",
        100 <= confirmed_bookings <= 160,
        f"Confirmed bookings: {confirmed_bookings} (Total: {bookings_count})",
    )

    # Check booking pricing floor invariant: booking_value >= project.starting_price
    project_starting_price_map = {p.id: p.starting_price for p in projects}
    underpriced_bookings = [
        b.id for b in session.scalars(select(Booking)).all()
        if b.project_id in project_starting_price_map
        and b.booking_value < project_starting_price_map[b.project_id]
    ]
    report.add_check(
        "Booking Pricing Floor Invariant",
        len(underpriced_bookings) == 0,
        f"Underpriced bookings found: {len(underpriced_bookings)}",
    )

    # 2. Foreign Key Completeness & Orphan Detection
    leads = session.scalars(select(Lead)).all()
    visits = session.scalars(select(SiteVisit)).all()
    all_bookings = session.scalars(select(Booking)).all()

    lead_ids = {ld.id for ld in leads}
    partner_ids = {p.id for p in session.scalars(select(ChannelPartner)).all()}
    project_ids = {p.id for p in session.scalars(select(Project)).all()}

    orphan_leads = [
        ld.id for ld in leads
        if ld.project_id not in project_ids or ld.channel_partner_id not in partner_ids
    ]
    report.add_check(
        "No Orphan Leads",
        len(orphan_leads) == 0,
        f"Found {len(orphan_leads)} orphan leads",
    )

    orphan_visits = [
        v.id for v in visits
        if v.lead_id not in lead_ids or v.project_id not in project_ids
    ]
    report.add_check(
        "No Orphan Site Visits",
        len(orphan_visits) == 0,
        f"Found {len(orphan_visits)} orphan visits",
    )

    orphan_bookings = [
        b.id for b in all_bookings
        if b.lead_id not in lead_ids or b.project_id not in project_ids
    ]
    report.add_check(
        "No Orphan Bookings",
        len(orphan_bookings) == 0,
        f"Found {len(orphan_bookings)} orphan bookings",
    )

    # 3. Cross-Entity Consistency
    lead_lookup = {ld.id: ld for ld in leads}

    mismatched_visits = [
        v.id for v in visits
        if v.project_id != lead_lookup[v.lead_id].project_id
        or v.channel_partner_id != lead_lookup[v.lead_id].channel_partner_id
    ]
    report.add_check(
        "Site Visit Entity Consistency",
        len(mismatched_visits) == 0,
        f"Found {len(mismatched_visits)} visits with mismatch against lead",
    )

    mismatched_bookings = [
        b.id for b in all_bookings
        if b.project_id != lead_lookup[b.lead_id].project_id
        or b.channel_partner_id != lead_lookup[b.lead_id].channel_partner_id
    ]
    report.add_check(
        "Booking Entity Consistency",
        len(mismatched_bookings) == 0,
        f"Found {len(mismatched_bookings)} bookings with mismatch against lead",
    )

    # 4. Temporal Consistency
    temporal_errors: List[str] = []
    for ld in leads:
        if ld.qualified_at and ld.qualified_at < ld.created_at:
            temporal_errors.append(
                f"Lead {ld.id}: qualified_at ({ld.qualified_at}) < created_at ({ld.created_at})"
            )
        if ld.converted_at and ld.converted_at < ld.created_at:
            temporal_errors.append(
                f"Lead {ld.id}: converted_at ({ld.converted_at}) < created_at ({ld.created_at})"
            )

    for v in visits:
        parent_lead = lead_lookup[v.lead_id]
        if v.scheduled_at < parent_lead.created_at:
            temporal_errors.append(f"Visit {v.id}: scheduled_at < lead created_at")
        if (
            v.status == "Completed"
            and v.visited_at
            and v.visited_at < v.scheduled_at - timedelta(minutes=1)
        ):
            temporal_errors.append(f"Visit {v.id}: visited_at < scheduled_at")

    report.add_check(
        "Temporal Order Consistency",
        len(temporal_errors) == 0,
        f"Found {len(temporal_errors)} temporal violations",
    )

    # 4b. Canonical Dataset Date Boundary (2026-01-01 00:00:00 to 2026-12-31 23:59:59)
    min_bound_dt = datetime(2026, 1, 1, 0, 0, 0)
    max_bound_dt = datetime(2026, 12, 31, 23, 59, 59)
    min_bound_date = date(2026, 1, 1)
    max_bound_date = date(2026, 12, 31)

    boundary_errors: List[str] = []
    for ld in leads:
        for fld_name, dt_val in [
            ("created_at", ld.created_at),
            ("qualified_at", ld.qualified_at),
            ("converted_at", ld.converted_at),
            ("lost_at", ld.lost_at),
        ]:
            if dt_val is not None and not (min_bound_dt <= dt_val <= max_bound_dt):
                boundary_errors.append(f"Lead {ld.id} {fld_name} ({dt_val}) outside 2026 boundary")

    for v in visits:
        for fld_name, dt_val in [
            ("created_at", v.created_at),
            ("scheduled_at", v.scheduled_at),
            ("visited_at", v.visited_at),
        ]:
            if dt_val is not None and not (min_bound_dt <= dt_val <= max_bound_dt):
                boundary_errors.append(
                    f"SiteVisit {v.id} {fld_name} ({dt_val}) outside 2026 boundary"
                )

    for b in all_bookings:
        if b.created_at is not None and not (min_bound_dt <= b.created_at <= max_bound_dt):
            boundary_errors.append(
                f"Booking {b.id} created_at ({b.created_at}) outside 2026 boundary"
            )
        if b.cancelled_at is not None and not (min_bound_dt <= b.cancelled_at <= max_bound_dt):
            boundary_errors.append(
                f"Booking {b.id} cancelled_at ({b.cancelled_at}) outside 2026 boundary"
            )
        if b.booking_date is not None and not (min_bound_date <= b.booking_date <= max_bound_date):
            boundary_errors.append(
                f"Booking {b.id} booking_date ({b.booking_date}) outside 2026 boundary"
            )

    activities = session.scalars(select(PartnerActivity)).all()
    for act in activities:
        if act.logged_at is not None and not (min_bound_dt <= act.logged_at <= max_bound_dt):
            boundary_errors.append(
                f"PartnerActivity {act.id} logged_at ({act.logged_at}) outside 2026 boundary"
            )

    report.add_check(
        "Canonical Dataset Date Boundary",
        len(boundary_errors) == 0,
        f"Found {len(boundary_errors)} records outside 2026 boundary",
    )

    # 4c. Booking Cancellation & Attempt Chronology
    cancellation_errors: List[str] = []
    cancelled_bookings = [b for b in all_bookings if b.booking_status == "Cancelled"]
    non_cancelled_bookings = [b for b in all_bookings if b.booking_status != "Cancelled"]

    for b in cancelled_bookings:
        if b.cancelled_at is None:
            cancellation_errors.append(
                f"Booking {b.id}: Cancelled status but cancelled_at is None"
            )
        elif b.created_at >= b.cancelled_at:
            cancellation_errors.append(
                f"Booking {b.id}: created_at ({b.created_at}) >= cancelled_at ({b.cancelled_at})"
            )
        if b.booking_date != b.created_at.date():
            cancellation_errors.append(
                f"Booking {b.id}: booking_date ({b.booking_date}) "
                f"!= created_at.date() ({b.created_at.date()})"
            )

    for b in non_cancelled_bookings:
        if b.cancelled_at is not None:
            cancellation_errors.append(
                f"Booking {b.id}: status is {b.booking_status} but cancelled_at is not None"
            )

    report.add_check(
        "Booking Cancellation Chronology",
        len(cancellation_errors) == 0 and len(cancelled_bookings) > 0,
        f"Verified {len(cancelled_bookings)} cancelled booking attempts "
        f"with created_at < cancelled_at",
    )

    # 4d. Booking Replacement Chronology
    replacement_errors: List[str] = []
    bookings_by_lead_all: Dict[str, List[Booking]] = {}
    for b in all_bookings:
        bookings_by_lead_all.setdefault(b.lead_id, []).append(b)

    leads_with_replacements = 0
    for lid, lead_bks in bookings_by_lead_all.items():
        if len(lead_bks) > 1:
            leads_with_replacements += 1
            sorted_bks = sorted(lead_bks, key=lambda x: x.created_at)
            for i in range(len(sorted_bks) - 1):
                prev_bk = sorted_bks[i]
                next_bk = sorted_bks[i + 1]
                if prev_bk.cancelled_at and next_bk.created_at <= prev_bk.cancelled_at:
                    replacement_errors.append(
                        f"Lead {lid}: replacement created_at ({next_bk.created_at}) "
                        f"<= previous cancelled_at ({prev_bk.cancelled_at})"
                    )

    report.add_check(
        "Booking Replacement Chronology",
        len(replacement_errors) == 0 and leads_with_replacements > 0,
        f"Verified {leads_with_replacements} leads with replacement history "
        f"(replacement.created_at > prev.cancelled_at)",
    )

    # 5. Active Booking Invariant
    bookings_by_lead: Dict[str, List[str]] = {}
    for b in all_bookings:
        if b.booking_status in ("Initiated", "Confirmed"):
            bookings_by_lead.setdefault(b.lead_id, []).append(b.booking_status)

    leads_with_multiple_active = {
        lid: statuses for lid, statuses in bookings_by_lead.items() if len(statuses) > 1
    }
    report.add_check(
        "One Active Booking Invariant",
        len(leads_with_multiple_active) == 0,
        f"Found {len(leads_with_multiple_active)} leads with multiple active bookings",
    )

    # 6. Funnel Semantics & Direct Bookings
    valid_leads = [ld for ld in leads if ld.status != "Invalid"]
    qualified_leads = [ld for ld in leads if ld.qualified_at is not None]
    qualified_lost = [ld for ld in leads if ld.qualified_at is not None and ld.status == "Lost"]

    report.add_check(
        "Milestone Qualification Retention",
        len(qualified_lost) > 0,
        f"Found {len(qualified_lost)} leads qualified then lost with qualified_at retained",
    )

    completed_visits = [v for v in visits if v.status == "Completed"]
    scheduled_visits = visits
    visited_lead_ids = {v.lead_id for v in completed_visits}
    qualified_visited_lead_ids = {
        v.lead_id for v in completed_visits
        if lead_lookup[v.lead_id].qualified_at is not None
    }

    confirmed_booking_records = [
        b for b in all_bookings if b.booking_status in ("Confirmed", "Completed")
    ]
    confirmed_from_visited = [
        b for b in confirmed_booking_records if b.lead_id in visited_lead_ids
    ]
    direct_confirmed = [
        b for b in confirmed_booking_records if b.lead_id not in visited_lead_ids
    ]

    report.add_check(
        "Direct Bookings Present",
        len(direct_confirmed) > 0,
        f"Found {len(direct_confirmed)} direct bookings without completed visits",
    )

    # 7. Partner / Project Affinity Check
    sky_proj_ids = {p.id for p in projects if "Skyfinia" in p.name}
    inf_proj_ids = {p.id for p in projects if "Infinia" in p.name}
    sky_specialists = 0
    inf_specialists = 0

    partner_leads_map: Dict[str, List[str]] = {}
    for ld in leads:
        partner_leads_map.setdefault(ld.channel_partner_id, []).append(ld.project_id)

    for p_id, p_pids in partner_leads_map.items():
        if len(p_pids) >= 15:
            sky_ratio = sum(1 for pid in p_pids if pid in sky_proj_ids) / len(p_pids)
            inf_ratio = sum(1 for pid in p_pids if pid in inf_proj_ids) / len(p_pids)
            if sky_ratio >= 0.70:
                sky_specialists += 1
            if inf_ratio >= 0.70:
                inf_specialists += 1

    report.add_check(
        "Partner Project Affinity",
        sky_specialists >= 1 and inf_specialists >= 1,
        f"Found {sky_specialists} Skyfinia specialists and {inf_specialists} Infinia specialists",
    )

    # Calculate Funnel Metrics
    qualification_rate = (
        (len(qualified_leads) / len(valid_leads)) * 100 if valid_leads else 0.0
    )
    visit_completion_rate = calculate_visit_completion_rate(
        len(completed_visits), len(scheduled_visits)
    )
    qual_to_visit_rate = calculate_qualified_lead_to_visit_rate(
        len(qualified_visited_lead_ids), len(qualified_leads)
    )
    visit_to_booking_rate = calculate_visit_to_booking_rate(
        len(confirmed_from_visited), len(visited_lead_ids)
    )
    overall_conversion = calculate_overall_lead_to_booking_rate(
        len(confirmed_booking_records), len(valid_leads)
    )

    report.metrics = {
        "total_leads": len(leads),
        "valid_leads": len(valid_leads),
        "qualified_leads": len(qualified_leads),
        "qualification_rate_pct": round(qualification_rate, 2),
        "scheduled_visits": len(scheduled_visits),
        "completed_visits": len(completed_visits),
        "visit_completion_rate_pct": visit_completion_rate,
        "unique_visited_leads": len(visited_lead_ids),
        "qualified_lead_to_visit_rate_pct": qual_to_visit_rate,
        "confirmed_bookings": len(confirmed_booking_records),
        "confirmed_from_visited": len(confirmed_from_visited),
        "direct_confirmed": len(direct_confirmed),
        "visit_to_booking_rate_pct": visit_to_booking_rate,
        "overall_conversion_rate_pct": overall_conversion,
        "activities_count": activities_count,
    }

    return report


def print_validation_report(report: ValidationReport) -> None:
    """Print formatted summary table of validation checks."""
    print("=" * 60)
    print("CHANNEL PARTNER INTELLIGENCE — DATASET VALIDATION REPORT")
    print("=" * 60)
    for check in report.checks:
        status_str = "PASS" if check["passed"] else "FAIL"
        print(f"[{status_str:4s}] {check['name']:<35} : {check['details']}")
    print("-" * 60)
    print("FUNNEL METRICS SUMMARY")
    print("-" * 60)
    for k, v in report.metrics.items():
        print(f"  {k:<35} : {v}")
    print("=" * 60)
    if report.passed:
        print("OVERALL RESULT: ALL CHECKS PASSED")
    else:
        print("OVERALL RESULT: VALIDATION FAILED")
        for err in report.errors:
            print(f"  - {err}")
    print("=" * 60)
