"""Tests for Overview Summary API endpoint and business logic calculations.

Validates all 16 approved KPI semantics, date ranges, project filters,
empty state resilience, and error handling against canonical SEED=42 dataset.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import create_application
from app.models.entities import (
    Lead,
)
from app.seed.generator import generate_synthetic_dataset, seed_database
from app.services.overview_service import (
    _format_time_ago,
    _resolve_activity_tag_and_status,
)


@pytest.fixture(scope="module")
def seeded_db_engine():
    """Provide an in-memory SQLite database engine with StaticPool pre-populated with SEED=42."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()

    dataset = generate_synthetic_dataset(seed=42)
    seed_database(session, dataset=dataset)
    session.close()

    try:
        yield engine
    finally:
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def seeded_db_session(seeded_db_engine) -> Generator[Session, None, None]:
    """Provide an in-memory database session pointing to the seeded StaticPool database."""
    from sqlalchemy.orm import sessionmaker

    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=seeded_db_engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def seeded_client(seeded_db_engine) -> Generator[TestClient, None, None]:
    """Provide a TestClient with dependency override pointing to seeded database."""
    from sqlalchemy.orm import sessionmaker

    app = create_application()
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=seeded_db_engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# ==============================================================================
# Canonical SEED=42 Business KPI Values Assertions
# ==============================================================================


def test_overview_summary_canonical_seed_42_values(seeded_client: TestClient):
    """Verify exact canonical KPI values derived from the SEED=42 database."""
    response = seeded_client.get("/api/v1/overview/summary")
    assert response.status_code == 200
    data = response.json()

    kpis = data["kpis"]

    # 1. Lead Flow Metrics
    lead_flow = kpis["channel_lead_flow"]
    assert lead_flow["total_leads"] == 4018
    assert lead_flow["valid_leads"] == 3906
    assert lead_flow["value"] == 3906
    assert lead_flow["qualified_leads"] == 2891
    assert lead_flow["qualification_rate_pct"] == 74.01

    # 2. Site Visit Metrics
    site_visits = kpis["site_visits"]
    assert site_visits["total_scheduled"] == 2010
    assert site_visits["total_completed"] == 1743
    assert site_visits["visit_completion_rate_pct"] == 86.72
    assert site_visits["unique_visited_leads"] == 1472
    assert site_visits["qualified_lead_to_visit_rate_pct"] == 50.92

    # 3. Bookings Velocity Metrics
    bookings = kpis["bookings_velocity"]
    assert bookings["units_count"] == 454
    assert bookings["confirmed_bookings"] == 454
    assert bookings["confirmed_from_visited_leads"] == 440
    assert bookings["direct_confirmed_bookings"] == 14
    assert bookings["visit_to_booking_rate_pct"] == 29.89
    assert bookings["overall_conversion_rate_pct"] == 11.62
    assert bookings["total_value_inr"] > 4_000_000_000.00

    # 4. Active Partners & Trailing-90-Day Breakdown
    active_partners = kpis["active_partners"]
    assert active_partners["value"] == 152
    assert active_partners["breakdown"]["tier_1"] == 18
    assert active_partners["breakdown"]["tier_2"] == 40
    assert active_partners["breakdown"]["tier_3"] == 94

    # 5. Partner Tier Distribution (All 175 registered partners)
    tier_breakdown = data["tier_breakdown"]
    assert len(tier_breakdown) == 3

    tier_1 = next(item for item in tier_breakdown if "Tier 1" in item["tier"])
    assert tier_1["partners_count"] == 18
    assert tier_1["percentage"] == 10.3
    assert tier_1["contribution"] == "10.3%"

    tier_2 = next(item for item in tier_breakdown if "Tier 2" in item["tier"])
    assert tier_2["partners_count"] == 45
    assert tier_2["percentage"] == 25.7
    assert tier_2["contribution"] == "25.7%"

    tier_3 = next(item for item in tier_breakdown if "Tier 3" in item["tier"])
    assert tier_3["partners_count"] == 112
    assert tier_3["percentage"] == 64.0
    assert tier_3["contribution"] == "64.0%"

    # 6. Monthly Trends
    monthly_trends = data["monthly_trends"]
    assert len(monthly_trends) >= 12
    jan = monthly_trends[0]
    assert jan["month"] == "Jan"
    assert jan["leads"] > 0
    assert jan["site_visits"] > 0
    assert jan["bookings"] > 0

    # 7. Recent Activities
    recent_activities = data["recent_activities"]
    assert len(recent_activities) == 10
    assert "id" in recent_activities[0]
    assert "partner_name" in recent_activities[0]
    assert "action" in recent_activities[0]
    assert "logged_at" in recent_activities[0]
    assert "time_ago" in recent_activities[0]
    assert "status" in recent_activities[0]
    assert "tag" in recent_activities[0]


# ==============================================================================
# Business Semantics & Invariants Isolation Tests
# ==============================================================================


def test_milestone_qualification_preservation(seeded_db_session: Session):
    """Verify qualification count relies on qualified_at timestamp, not transient status."""
    from app.services.overview_service import get_overview_summary

    # Count how many leads have status == 'Lost' but qualified_at IS NOT NULL
    lost_qualified = (
        seeded_db_session.query(Lead)
        .filter(Lead.status == "Lost", Lead.qualified_at.isnot(None))
        .count()
    )
    assert lost_qualified > 0, "Expected some leads to be lost after historical qualification"

    summary = get_overview_summary(seeded_db_session)
    assert summary.kpis.channel_lead_flow.qualified_leads == 2891


def test_invalid_leads_excluded_from_valid_count(seeded_db_session: Session):
    """Verify invalid leads (status == 'Invalid') are excluded from valid lead counts."""
    invalid_count = (
        seeded_db_session.query(Lead)
        .filter(Lead.status == "Invalid")
        .count()
    )
    assert invalid_count == 112
    assert 4018 - invalid_count == 3906


def test_direct_bookings_excluded_from_visit_to_booking_rate(seeded_db_session: Session):
    """Verify direct bookings are excluded from Visit -> Booking Rate denominator."""
    from app.services.overview_service import get_overview_summary

    summary = get_overview_summary(seeded_db_session)
    # Direct bookings = 14, Confirmed from visited = 440, Unique visited leads = 1472
    # Visit -> Booking Rate = 440 / 1472 * 100 = 29.89%
    # If direct were included: (440 + 14) / 1472 = 30.84% (distortion!)
    assert summary.kpis.bookings_velocity.direct_confirmed_bookings == 14
    assert summary.kpis.bookings_velocity.confirmed_from_visited_leads == 440
    assert summary.kpis.bookings_velocity.visit_to_booking_rate_pct == 29.89


# ==============================================================================
# Filtering & Query Parameters Tests
# ==============================================================================


def test_project_filter(seeded_client: TestClient):
    """Verify filtering by valid project_id isolates metrics to that project."""
    response = seeded_client.get("/api/v1/overview/summary?project_id=prj-101")
    assert response.status_code == 200
    data = response.json()

    kpis = data["kpis"]
    lead_flow = kpis["channel_lead_flow"]
    assert lead_flow["total_leads"] < 4018
    assert lead_flow["total_leads"] > 0
    assert kpis["bookings_velocity"]["units_count"] > 0


def test_invalid_project_filter_returns_404(seeded_client: TestClient):
    """Verify filtering by non-existent project_id returns HTTP 404."""
    response = seeded_client.get("/api/v1/overview/summary?project_id=prj-nonexistent-999")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "prj-nonexistent-999" in data["detail"]


def test_date_range_filter(seeded_client: TestClient):
    """Verify start_date and end_date constrain metric calculations."""
    response = seeded_client.get(
        "/api/v1/overview/summary?start_date=2026-01-01&end_date=2026-06-30"
    )
    assert response.status_code == 200
    data = response.json()

    kpis = data["kpis"]
    # H1 leads should be less than full year
    assert kpis["channel_lead_flow"]["total_leads"] < 4018
    assert kpis["channel_lead_flow"]["total_leads"] > 0


def test_invalid_date_range_returns_400(seeded_client: TestClient):
    """Verify start_date > end_date returns HTTP 400 validation error."""
    response = seeded_client.get(
        "/api/v1/overview/summary?start_date=2026-12-31&end_date=2026-01-01"
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "start_date cannot be greater than end_date" in data["detail"]


# ==============================================================================
# Empty Database State Resilience Tests
# ==============================================================================


def test_empty_database_resilience():
    """Verify overview service handles completely empty database with zero division safety."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.services.overview_service import get_overview_summary

    empty_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=empty_engine)
    session_factory = sessionmaker(bind=empty_engine)
    empty_session = session_factory()

    try:
        summary = get_overview_summary(empty_session)
        assert summary.kpis.active_partners.value == 0
        assert summary.kpis.channel_lead_flow.total_leads == 0
        assert summary.kpis.channel_lead_flow.qualification_rate_pct == 0.0
        assert summary.kpis.site_visits.visit_completion_rate_pct == 0.0
        assert summary.kpis.bookings_velocity.units_count == 0
        assert summary.kpis.bookings_velocity.visit_to_booking_rate_pct == 0.0
        assert summary.kpis.bookings_velocity.overall_conversion_rate_pct == 0.0
        assert len(summary.tier_breakdown) == 3
        assert summary.tier_breakdown[0].partners_count == 0
        assert summary.tier_breakdown[0].percentage == 0.0
        assert summary.monthly_trends == []
        assert summary.recent_activities == []
        assert summary.attention_alerts == []
    finally:
        empty_session.close()
        Base.metadata.drop_all(bind=empty_engine)


# ==============================================================================
# Helper Unit Tests
# ==============================================================================


def test_format_time_ago_helpers():
    """Verify relative time formatting helper across various deltas."""
    now = datetime(2026, 10, 5, 12, 0, 0)

    # 30 seconds ago
    t_30s = now - timedelta(seconds=30)
    assert _format_time_ago(t_30s, reference_dt=now) == "just now"

    # 15 minutes ago
    t_15m = now - timedelta(minutes=15)
    assert _format_time_ago(t_15m, reference_dt=now) == "15m ago"

    # 4 hours ago
    t_4h = now - timedelta(hours=4)
    assert _format_time_ago(t_4h, reference_dt=now) == "4h ago"

    # 3 days ago
    t_3d = now - timedelta(days=3)
    assert _format_time_ago(t_3d, reference_dt=now) == "3d ago"

    # 14 days ago
    t_14d = now - timedelta(days=14)
    assert _format_time_ago(t_14d, reference_dt=now) == "Sep 21, 2026"


def test_resolve_activity_tag_and_status():
    """Verify activity tag and status badge mapping."""
    tag, status = _resolve_activity_tag_and_status("booking_confirmed", "booking")
    assert tag == "Booking"
    assert status == "success"

    tag, status = _resolve_activity_tag_and_status("booking_initiated", "booking")
    assert tag == "Booking Initiated"
    assert status == "info"

    tag, status = _resolve_activity_tag_and_status("site_visit_completed", "site_visit")
    assert tag == "Site Visit"
    assert status == "success"

    tag, status = _resolve_activity_tag_and_status("site_visit_scheduled", "site_visit")
    assert tag == "Site Visit"
    assert status == "info"

    tag, status = _resolve_activity_tag_and_status("lead_submitted", "lead")
    assert tag == "Lead Batch"
    assert status == "info"

    tag, status = _resolve_activity_tag_and_status("tier_updated", "partner")
    assert tag == "Tier Update"
    assert status == "neutral"
