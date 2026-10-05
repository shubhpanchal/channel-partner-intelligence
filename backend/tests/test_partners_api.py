"""Tests for Channel Partners API endpoints and performance KPI calculations.

Validates list directory, pagination, filtering (tier, active, city, multi-field search),
deterministic sorting, partner detail metrics, recent leads & bookings, 404 handling,
and edge case KPI calculations (direct bookings, multiple visits, zero leads) against
both canonical SEED=42 dataset and isolated test fixtures.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import create_application
from app.models.entities import (
    Booking,
    BookingStatus,
    ChannelPartner,
    Lead,
    LeadStatus,
    Salesperson,
    SiteVisit,
    SiteVisitStatus,
)
from app.seed.generator import generate_synthetic_dataset, seed_database


@pytest.fixture(scope="module")
def seeded_db_engine():
    """Provide an in-memory SQLite database engine pre-populated with SEED=42."""
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
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=seeded_db_engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def seeded_client(seeded_db_session: Session) -> Generator[TestClient, None, None]:
    """Provide a TestClient with overridden get_db dependency pointing to seeded data."""
    app = create_application()

    def override_get_db():
        try:
            yield seeded_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==============================================================================
# Partner List Directory Tests
# ==============================================================================


def test_list_partners_default_pagination(seeded_client: TestClient):
    """Test GET /api/v1/partners returns 200 with default 20 items and total 175."""
    response = seeded_client.get("/api/v1/partners")
    assert response.status_code == 200
    data = response.json()

    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) == 20
    assert data["pagination"]["total"] == 175
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["page_size"] == 20
    assert data["pagination"]["total_pages"] == 9

    # Verify first item shape
    first_item = data["items"][0]
    assert "id" in first_item
    assert "partner_code" in first_item
    assert "name" in first_item
    assert "tier" in first_item
    assert "summary_stats" in first_item
    assert "total_leads" in first_item["summary_stats"]
    assert "qualified_leads" in first_item["summary_stats"]
    assert "completed_visits" in first_item["summary_stats"]
    assert "confirmed_bookings" in first_item["summary_stats"]
    assert "visit_to_booking_rate_pct" in first_item["summary_stats"]
    assert "overall_conversion_rate_pct" in first_item["summary_stats"]


def test_list_partners_page_navigation(seeded_client: TestClient):
    """Test pagination navigation between page 1 and page 2 returns distinct records."""
    res_p1 = seeded_client.get("/api/v1/partners?page=1&page_size=10")
    assert res_p1.status_code == 200
    p1_data = res_p1.json()
    assert len(p1_data["items"]) == 10
    assert p1_data["pagination"]["total_pages"] == 18

    res_p2 = seeded_client.get("/api/v1/partners?page=2&page_size=10")
    assert res_p2.status_code == 200
    p2_data = res_p2.json()
    assert len(p2_data["items"]) == 10

    p1_ids = {p["id"] for p in p1_data["items"]}
    p2_ids = {p["id"] for p in p2_data["items"]}
    assert p1_ids.isdisjoint(p2_ids)


def test_list_partners_max_page_size(seeded_client: TestClient):
    """Test page_size cap and custom page sizing."""
    res = seeded_client.get("/api/v1/partners?page_size=100")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 100
    assert data["pagination"]["page_size"] == 100


def test_list_partners_filter_tier(seeded_client: TestClient):
    """Test filtering by tier returns only partners of that tier."""
    for tier_val in ["Tier 1", "Tier 2", "Tier 3"]:
        res = seeded_client.get(f"/api/v1/partners?tier={tier_val}")
        assert res.status_code == 200
        data = res.json()
        assert data["pagination"]["total"] > 0
        for item in data["items"]:
            assert item["tier"] == tier_val


def test_list_partners_filter_active(seeded_client: TestClient):
    """Test filtering by active=true and active=false."""
    res_active = seeded_client.get("/api/v1/partners?active=true")
    assert res_active.status_code == 200
    active_data = res_active.json()
    for item in active_data["items"]:
        assert item["active"] is True

    res_inactive = seeded_client.get("/api/v1/partners?active=false")
    assert res_inactive.status_code == 200
    inactive_data = res_inactive.json()
    for item in inactive_data["items"]:
        assert item["active"] is False

    assert active_data["pagination"]["total"] + inactive_data["pagination"]["total"] == 175


def test_list_partners_filter_city(seeded_client: TestClient):
    """Test filtering by city is case-insensitive."""
    res = seeded_client.get("/api/v1/partners?city=pune")
    assert res.status_code == 200
    data = res.json()
    assert data["pagination"]["total"] > 0
    for item in data["items"]:
        assert item["city"].lower() == "pune"


def test_list_partners_search_by_name(seeded_client: TestClient):
    """Test partial search by partner name."""
    res = seeded_client.get("/api/v1/partners?search=apex")
    assert res.status_code == 200
    data = res.json()
    assert data["pagination"]["total"] > 0
    for item in data["items"]:
        matched = (
            "apex" in item["name"].lower()
            or "apex" in item["contact_person"].lower()
            or "apex" in item["partner_code"].lower()
        )
        assert matched


def test_list_partners_search_by_contact_person(seeded_client: TestClient):
    """Test search by contact person name."""
    # Find a contact person from the first page
    res_init = seeded_client.get("/api/v1/partners?page_size=5")
    contact_person = res_init.json()["items"][0]["contact_person"]
    first_name = contact_person.split()[0]

    res = seeded_client.get(f"/api/v1/partners?search={first_name}")
    assert res.status_code == 200
    data = res.json()
    assert data["pagination"]["total"] >= 1


def test_list_partners_search_by_code(seeded_client: TestClient):
    """Test search by partner code."""
    res = seeded_client.get("/api/v1/partners?search=CP-1001")
    assert res.status_code == 200
    data = res.json()
    assert data["pagination"]["total"] >= 1
    assert any(item["partner_code"] == "CP-1001" for item in data["items"])


def test_list_partners_sorting(seeded_client: TestClient):
    """Test sorting by name, onboarding_date, and tier."""
    # Sort by name
    res_name = seeded_client.get("/api/v1/partners?sort_by=name&page_size=20")
    assert res_name.status_code == 200
    names = [item["name"] for item in res_name.json()["items"]]
    assert names == sorted(names)

    # Sort by onboarding_date (descending newest first)
    res_date = seeded_client.get("/api/v1/partners?sort_by=onboarding_date&page_size=20")
    assert res_date.status_code == 200
    dates = [item["onboarding_date"] for item in res_date.json()["items"]]
    assert dates == sorted(dates, reverse=True)

    # Sort by tier
    res_tier = seeded_client.get("/api/v1/partners?sort_by=tier&page_size=50")
    assert res_tier.status_code == 200
    tiers = [item["tier"] for item in res_tier.json()["items"]]
    assert tiers == sorted(tiers)


def test_list_partners_combined_filters(seeded_client: TestClient):
    """Test combining tier, active, city, and search."""
    res = seeded_client.get("/api/v1/partners?tier=Tier%201&active=true&city=pune")
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["tier"] == "Tier 1"
        assert item["active"] is True
        assert item["city"].lower() == "pune"


def test_list_partners_empty_search(seeded_client: TestClient):
    """Test search query matching no records returns empty list and total 0."""
    res = seeded_client.get("/api/v1/partners?search=NonExistentAgencyXYZ999")
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["pagination"]["total"] == 0
    assert data["pagination"]["total_pages"] == 0


# ==============================================================================
# Partner Detail Tests
# ==============================================================================


def test_get_partner_detail_success(seeded_client: TestClient):
    """Test GET /api/v1/partners/{id} returns complete profile and metrics for valid partner."""
    # First get an ID from list
    list_res = seeded_client.get("/api/v1/partners?page_size=1")
    partner_id = list_res.json()["items"][0]["id"]

    res = seeded_client.get(f"/api/v1/partners/{partner_id}")
    assert res.status_code == 200
    data = res.json()

    assert data["id"] == partner_id
    assert "partner_code" in data
    assert "name" in data
    assert "tier" in data
    assert "assigned_salesperson" in data
    if data["assigned_salesperson"]:
        assert "id" in data["assigned_salesperson"]
        assert "name" in data["assigned_salesperson"]
        assert "email" in data["assigned_salesperson"]

    metrics = data["metrics"]
    assert "total_leads" in metrics
    assert "qualified_leads" in metrics
    assert "qualification_rate_pct" in metrics
    assert "scheduled_site_visits" in metrics
    assert "completed_site_visits" in metrics
    assert "visit_completion_rate_pct" in metrics
    assert "unique_visited_leads" in metrics
    assert "qualified_lead_to_visit_rate_pct" in metrics
    assert "confirmed_bookings" in metrics
    assert "visit_to_booking_rate_pct" in metrics
    assert "overall_conversion_rate_pct" in metrics
    assert "gross_booking_value_inr" in metrics

    # Verify monthly trends
    assert "monthly_trends" in data
    assert len(data["monthly_trends"]) == 12
    months_expected = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]
    assert [m["month"] for m in data["monthly_trends"]] == months_expected
    for m in data["monthly_trends"]:
        assert "leads" in m
        assert "completed_visits" in m
        assert "bookings" in m
        assert m["leads"] >= 0
        assert m["completed_visits"] >= 0
        assert m["bookings"] >= 0

    # Verify project contribution
    assert "project_contribution" in data
    assert isinstance(data["project_contribution"], list)
    if data["project_contribution"]:
        # Verify descending order by bookings
        bookings_counts = [pc["bookings"] for pc in data["project_contribution"]]
        assert bookings_counts == sorted(bookings_counts, reverse=True)
        pc_0 = data["project_contribution"][0]
        assert "project_id" in pc_0
        assert "project_name" in pc_0
        assert "bookings" in pc_0
        assert "booking_value_inr" in pc_0

    # Verify recent leads list
    assert "recent_leads" in data
    assert len(data["recent_leads"]) <= 10
    if data["recent_leads"]:
        lead_0 = data["recent_leads"][0]
        assert "lead_code" in lead_0
        assert "customer_name" in lead_0
        assert "project_name" in lead_0
        assert "status" in lead_0
        assert "created_at" in lead_0

    # Verify recent bookings list
    assert "recent_bookings" in data
    assert len(data["recent_bookings"]) <= 10
    if data["recent_bookings"]:
        bk_0 = data["recent_bookings"][0]
        assert "booking_reference" in bk_0
        assert "customer_name" in bk_0
        assert "project_name" in bk_0
        assert "booking_value" in bk_0
        assert "created_at" in bk_0


def test_get_partner_detail_analytics_isolated(fresh_session: Session):
    """Test monthly trends and project contribution analytics aggregation in isolated scenario."""
    from app.models.entities import Project
    from app.services.partner_service import get_partner_by_id

    salesperson = Salesperson(
        id="sp-analytics-1",
        name="Sales Lead",
        email="lead@sales.com",
        phone="+91 99999 11111",
        active=True,
    )
    partner = ChannelPartner(
        id="cp-analytics-1",
        partner_code="CP-ANL-1",
        name="Analytics Realty",
        contact_person="Anita Rao",
        phone="+91 99999 22222",
        email="anita@analytics.com",
        city="Pune",
        location="Kalyani Nagar",
        onboarding_date=date(2026, 1, 1),
        active=True,
        tier="Tier 1",
        channel_type="Corporate Agency",
        assigned_salesperson_id=salesperson.id,
    )
    p1 = Project(
        id="prj-anl-1",
        name="Alpha Heights",
        project_code="ALPHA",
        city="Pune",
        location="Kalyani Nagar",
        project_type="Residential",
        target_units=100,
        available_units=50,
        starting_price=10000000.0,
    )
    p2 = Project(
        id="prj-anl-2",
        name="Beta Enclave",
        project_code="BETA",
        city="Pune",
        location="Baner",
        project_type="Residential",
        target_units=100,
        available_units=50,
        starting_price=15000000.0,
    )
    fresh_session.add_all([salesperson, partner, p1, p2])
    fresh_session.flush()

    # Jan: 2 leads (1 valid, 1 invalid) -> monthly trend leads should be 1
    l_valid = Lead(
        id="lead-jan-1",
        lead_code="LD-JAN-1",
        customer_name="Jan Valid",
        customer_phone="+91 91111 00001",
        channel_partner_id=partner.id,
        project_id=p1.id,
        status=LeadStatus.QUALIFIED.value,
        created_at=datetime(2026, 1, 10, 10, 0),
    )
    l_invalid = Lead(
        id="lead-jan-2",
        lead_code="LD-JAN-2",
        customer_name="Jan Invalid",
        customer_phone="+91 91111 00002",
        channel_partner_id=partner.id,
        project_id=p1.id,
        status=LeadStatus.INVALID.value,
        created_at=datetime(2026, 1, 12, 10, 0),
    )
    # Feb: 1 completed visit, 1 scheduled visit -> monthly trend completed_visits should be 1
    l_feb = Lead(
        id="lead-feb-1",
        lead_code="LD-FEB-1",
        customer_name="Feb Client",
        customer_phone="+91 91111 00003",
        channel_partner_id=partner.id,
        project_id=p2.id,
        status=LeadStatus.SITE_VISIT_COMPLETED.value,
        created_at=datetime(2026, 2, 5, 10, 0),
    )
    v_completed = SiteVisit(
        id="vis-feb-1",
        visit_code="SV-FEB-1",
        lead_id=l_feb.id,
        channel_partner_id=partner.id,
        project_id=p2.id,
        status=SiteVisitStatus.COMPLETED.value,
        scheduled_at=datetime(2026, 2, 10, 11, 0),
        visited_at=datetime(2026, 2, 10, 11, 0),
    )
    v_scheduled = SiteVisit(
        id="vis-feb-2",
        visit_code="SV-FEB-2",
        lead_id=l_valid.id,
        channel_partner_id=partner.id,
        project_id=p1.id,
        status=SiteVisitStatus.SCHEDULED.value,
        scheduled_at=datetime(2026, 2, 12, 11, 0),
    )
    # Mar: 2 Bookings for p1, 1 Booking for p2
    bk1 = Booking(
        id="bk-p1-1",
        booking_reference="BK-P1-1",
        lead_id=l_valid.id,
        project_id=p1.id,
        channel_partner_id=partner.id,
        salesperson_id=salesperson.id,
        unit_number="101",
        unit_type="3BHK",
        booking_date=date(2026, 3, 15),
        booking_status=BookingStatus.CONFIRMED.value,
        booking_value=12000000.0,
        token_amount=500000.0,
        commission_rate_pct=2.0,
        commission_amount=240000.0,
        created_at=datetime(2026, 3, 15, 12, 0),
    )
    bk2 = Booking(
        id="bk-p1-2",
        booking_reference="BK-P1-2",
        lead_id=l_feb.id,
        project_id=p1.id,
        channel_partner_id=partner.id,
        salesperson_id=salesperson.id,
        unit_number="102",
        unit_type="3BHK",
        booking_date=date(2026, 3, 20),
        booking_status=BookingStatus.COMPLETED.value,
        booking_value=13000000.0,
        token_amount=500000.0,
        commission_rate_pct=2.0,
        commission_amount=260000.0,
        created_at=datetime(2026, 3, 20, 12, 0),
    )
    bk3 = Booking(
        id="bk-p2-1",
        booking_reference="BK-P2-1",
        lead_id=l_feb.id,
        project_id=p2.id,
        channel_partner_id=partner.id,
        salesperson_id=salesperson.id,
        unit_number="201",
        unit_type="2BHK",
        booking_date=date(2026, 3, 22),
        booking_status=BookingStatus.CONFIRMED.value,
        booking_value=9000000.0,
        token_amount=500000.0,
        commission_rate_pct=2.0,
        commission_amount=180000.0,
        created_at=datetime(2026, 3, 22, 12, 0),
    )
    fresh_session.add_all([l_valid, l_invalid, l_feb, v_completed, v_scheduled, bk1, bk2, bk3])
    fresh_session.commit()

    detail = get_partner_by_id(fresh_session, partner.id)
    assert len(detail.monthly_trends) == 12

    # Jan trend: 1 valid lead, 0 visits, 0 bookings
    jan_trend = detail.monthly_trends[0]
    assert jan_trend.month == "Jan"
    assert jan_trend.leads == 1
    assert jan_trend.completed_visits == 0
    assert jan_trend.bookings == 0

    # Feb trend: 1 valid lead, 1 completed visit, 0 bookings
    feb_trend = detail.monthly_trends[1]
    assert feb_trend.month == "Feb"
    assert feb_trend.leads == 1
    assert feb_trend.completed_visits == 1
    assert feb_trend.bookings == 0

    # Mar trend: 0 leads, 0 visits, 3 bookings
    mar_trend = detail.monthly_trends[2]
    assert mar_trend.month == "Mar"
    assert mar_trend.leads == 0
    assert mar_trend.completed_visits == 0
    assert mar_trend.bookings == 3

    # Project contribution: p1 (2 bookings, 25M value), p2 (1 booking, 9M value)
    assert len(detail.project_contribution) == 2
    assert detail.project_contribution[0].project_name == "Alpha Heights"
    assert detail.project_contribution[0].bookings == 2
    assert detail.project_contribution[0].booking_value_inr == 25000000.0

    assert detail.project_contribution[1].project_name == "Beta Enclave"
    assert detail.project_contribution[1].bookings == 1
    assert detail.project_contribution[1].booking_value_inr == 9000000.0


def test_get_partner_detail_not_found(seeded_client: TestClient):
    """Test GET /api/v1/partners/{id} with invalid ID returns standard 404."""
    res = seeded_client.get("/api/v1/partners/cp-9999999-invalid")
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


# ==============================================================================
# Isolated KPI Semantics & Edge Cases Tests
# ==============================================================================


@pytest.fixture
def fresh_session():
    """Create a completely clean in-memory database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_partner_metrics_direct_bookings_not_in_visit_rate(fresh_session: Session):
    """Test direct bookings without a completed visit do NOT inflate visit_to_booking_rate."""
    from app.models.entities import Project
    from app.services.partner_service import get_partner_by_id, get_partners_directory

    # Create partner & salesperson & project
    salesperson = Salesperson(
        id="sp-test-1",
        name="Test Manager",
        email="sp@test.com",
        phone="+91 99999 00001",
        active=True,
    )
    partner = ChannelPartner(
        id="cp-isolated-1",
        partner_code="CP-ISO-1",
        name="Direct Booking Agency",
        contact_person="Rohan Mehta",
        phone="+91 99999 00002",
        email="rohan@isolated.com",
        city="Pune",
        location="Baner",
        onboarding_date=date(2026, 1, 15),
        active=True,
        tier="Tier 1",
        channel_type="Corporate Agency",
        assigned_salesperson_id=salesperson.id,
    )
    project = Project(
        id="prj-test-1",
        name="Skyline Towers",
        project_code="SKYT",
        city="Pune",
        location="Baner",
        project_type="Residential",
        target_units=100,
        available_units=50,
        starting_price=10000000.0,
    )
    fresh_session.add_all([salesperson, partner, project])
    fresh_session.flush()

    # Lead 1: Completed visit, no booking
    lead_visited = Lead(
        id="lead-vis-1",
        lead_code="LD-TEST-1",
        customer_name="Visited Customer",
        customer_phone="+91 98888 11111",
        channel_partner_id=partner.id,
        project_id=project.id,
        assigned_salesperson_id=salesperson.id,
        status=LeadStatus.SITE_VISIT_COMPLETED.value,
        qualified_at=datetime(2026, 2, 1, 10, 0),
        created_at=datetime(2026, 2, 1, 9, 0),
        updated_at=datetime(2026, 2, 1, 10, 0),
    )
    visit = SiteVisit(
        id="vis-1",
        visit_code="SV-TEST-1",
        lead_id=lead_visited.id,
        channel_partner_id=partner.id,
        project_id=project.id,
        salesperson_id=salesperson.id,
        scheduled_at=datetime(2026, 2, 5, 10, 0),
        visited_at=datetime(2026, 2, 5, 12, 0),
        status=SiteVisitStatus.COMPLETED.value,
        created_at=datetime(2026, 2, 5, 12, 0),
    )

    # Lead 2: DIRECT BOOKING (No completed site visit)
    lead_direct = Lead(
        id="lead-dir-2",
        lead_code="LD-TEST-2",
        customer_name="Direct Buyer",
        customer_phone="+91 98888 22222",
        channel_partner_id=partner.id,
        project_id=project.id,
        assigned_salesperson_id=salesperson.id,
        status=LeadStatus.CONVERTED.value,
        qualified_at=datetime(2026, 2, 2, 10, 0),
        converted_at=datetime(2026, 2, 6, 15, 0),
        created_at=datetime(2026, 2, 2, 9, 0),
        updated_at=datetime(2026, 2, 6, 15, 0),
    )
    booking_direct = Booking(
        id="bk-dir-1",
        booking_reference="BK-DIR-1",
        lead_id=lead_direct.id,
        channel_partner_id=partner.id,
        project_id=project.id,
        salesperson_id=salesperson.id,
        unit_number="A-501",
        unit_type="3BHK",
        booking_date=date(2026, 2, 6),
        booking_status=BookingStatus.CONFIRMED.value,
        booking_value=15000000.0,
        token_amount=500000.0,
        commission_rate_pct=2.0,
        commission_amount=300000.0,
        created_at=datetime(2026, 2, 6, 15, 0),
    )

    fresh_session.add_all([lead_visited, visit, lead_direct, booking_direct])
    fresh_session.commit()

    # Query through service
    detail = get_partner_by_id(fresh_session, partner.id)
    assert detail.metrics.total_leads == 2
    assert detail.metrics.qualified_leads == 2
    assert detail.metrics.completed_site_visits == 1
    assert detail.metrics.unique_visited_leads == 1
    assert detail.metrics.confirmed_bookings == 1
    # Crucial assertion: Visited lead did NOT book. Direct lead booked.
    # Therefore, confirmed bookings from visited leads = 0 -> visit_to_booking_rate = 0.0%
    assert detail.metrics.visit_to_booking_rate_pct == 0.0
    # Overall conversion = 1 / 2 = 50.0%
    assert detail.metrics.overall_conversion_rate_pct == 50.0
    assert detail.metrics.gross_booking_value_inr == 15000000.0

    # Test directory summary stats
    list_res = get_partners_directory(fresh_session)
    assert len(list_res.items) == 1
    item = list_res.items[0]
    assert item.summary_stats.total_leads == 2
    assert item.summary_stats.qualified_leads == 2
    assert item.summary_stats.completed_visits == 1
    assert item.summary_stats.confirmed_bookings == 1
    assert item.summary_stats.visit_to_booking_rate_pct == 0.0
    assert item.summary_stats.overall_conversion_rate_pct == 50.0


def test_partner_metrics_multiple_visits_deduplication(fresh_session: Session):
    """Test multiple completed site visits for one lead deduplicate in unique_visited_leads."""
    from app.models.entities import Project
    from app.services.partner_service import get_partner_by_id

    partner = ChannelPartner(
        id="cp-multi-vis",
        partner_code="CP-MV-1",
        name="Multi Visit Agency",
        contact_person="Anita Deshmukh",
        phone="+91 99999 00003",
        email="anita@multivis.com",
        city="Mumbai",
        location="Bandra",
        onboarding_date=date(2026, 3, 1),
        active=True,
        tier="Tier 2",
        channel_type="Boutique Firm",
    )
    project = Project(
        id="prj-test-2",
        name="Ocean Heights",
        project_code="OCH",
        city="Mumbai",
        location="Bandra",
        project_type="Residential",
        target_units=50,
        available_units=20,
        starting_price=25000000.0,
    )
    fresh_session.add_all([partner, project])
    fresh_session.flush()

    lead = Lead(
        id="lead-multi-vis-1",
        lead_code="LD-MV-1",
        customer_name="Frequent Visitor",
        customer_phone="+91 98888 33333",
        channel_partner_id=partner.id,
        project_id=project.id,
        status=LeadStatus.SITE_VISIT_COMPLETED.value,
        qualified_at=datetime(2026, 3, 2, 10, 0),
        created_at=datetime(2026, 3, 2, 9, 0),
        updated_at=datetime(2026, 3, 10, 15, 0),
    )
    # 3 Completed visits for the same lead
    v1 = SiteVisit(
        id="mv-1",
        visit_code="SV-MV-1",
        lead_id=lead.id,
        channel_partner_id=partner.id,
        project_id=project.id,
        scheduled_at=datetime(2026, 3, 5, 10, 0),
        visited_at=datetime(2026, 3, 5, 11, 0),
        status=SiteVisitStatus.COMPLETED.value,
        created_at=datetime(2026, 3, 5, 11, 0),
    )
    v2 = SiteVisit(
        id="mv-2",
        visit_code="SV-MV-2",
        lead_id=lead.id,
        channel_partner_id=partner.id,
        project_id=project.id,
        scheduled_at=datetime(2026, 3, 8, 13, 0),
        visited_at=datetime(2026, 3, 8, 14, 0),
        status=SiteVisitStatus.COMPLETED.value,
        created_at=datetime(2026, 3, 8, 14, 0),
    )
    v3 = SiteVisit(
        id="mv-3",
        visit_code="SV-MV-3",
        lead_id=lead.id,
        channel_partner_id=partner.id,
        project_id=project.id,
        scheduled_at=datetime(2026, 3, 12, 10, 0),
        visited_at=None,
        status=SiteVisitStatus.CANCELLED.value,  # Cancelled visit
        created_at=datetime(2026, 3, 12, 10, 0),
    )
    fresh_session.add_all([lead, v1, v2, v3])
    fresh_session.commit()

    detail = get_partner_by_id(fresh_session, partner.id)
    assert detail.metrics.total_leads == 1
    assert detail.metrics.scheduled_site_visits == 3
    assert detail.metrics.completed_site_visits == 2
    assert detail.metrics.unique_visited_leads == 1
    assert detail.metrics.visit_completion_rate_pct == round((2 / 3) * 100, 2)


def test_partner_metrics_zero_leads_edge_case(fresh_session: Session):
    """Test partner with zero leads returns 0 for all rates without ZeroDivisionError."""
    from app.services.partner_service import get_partner_by_id, get_partners_directory

    partner = ChannelPartner(
        id="cp-zero-leads",
        partner_code="CP-ZL-1",
        name="Zero Leads Agency",
        contact_person="Pooja Shah",
        phone="+91 99999 00004",
        email="pooja@zeroleads.com",
        city="Pune",
        location="Kalyani Nagar",
        onboarding_date=date(2026, 4, 1),
        active=False,
        tier="Tier 3",
        channel_type="Individual Broker",
    )
    fresh_session.add(partner)
    fresh_session.commit()

    detail = get_partner_by_id(fresh_session, partner.id)
    assert detail.metrics.total_leads == 0
    assert detail.metrics.qualified_leads == 0
    assert detail.metrics.qualification_rate_pct == 0.0
    assert detail.metrics.completed_site_visits == 0
    assert detail.metrics.visit_completion_rate_pct == 0.0
    assert detail.metrics.confirmed_bookings == 0
    assert detail.metrics.visit_to_booking_rate_pct == 0.0
    assert detail.metrics.overall_conversion_rate_pct == 0.0
    assert detail.metrics.gross_booking_value_inr == 0.0
    assert detail.recent_leads == []
    assert detail.recent_bookings == []

    list_res = get_partners_directory(fresh_session)
    assert len(list_res.items) == 1
    item = list_res.items[0]
    assert item.summary_stats.total_leads == 0
    assert item.summary_stats.visit_to_booking_rate_pct == 0.0
