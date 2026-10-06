"""Tests for Projects Directory & Project Detail APIs (Phase 2E)."""

from __future__ import annotations

from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.domain_semantics import get_project_family
from app.main import create_application
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
# Projects Directory API Tests
# ==============================================================================


def test_list_projects_default(seeded_client: TestClient):
    """Test retrieving all canonical projects in the default directory view."""
    response = seeded_client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()

    # Portfolio Summary
    summary = data["portfolio_summary"]
    assert summary["total_projects"] == 4
    assert summary["total_families"] == 2
    assert summary["total_target_units"] == 1250
    assert summary["total_available_units"] == 1092
    assert summary["total_booked_units"] == 158
    assert summary["total_booking_value_inr"] > 1_000_000_000

    # Items & Pagination
    assert data["pagination"]["total"] == 4
    assert len(data["items"]) == 4

    # Verify project identifiers and families
    item_names = [i["name"] for i in data["items"]]
    assert "Skyfinia Phase 1" in item_names
    assert "Skyfinia Phase 2" in item_names
    assert "Infinia Phase 1" in item_names
    assert "Infinia Phase 2" in item_names

    for item in data["items"]:
        assert item["project_family"] in ("Skyfinia", "Infinia")
        assert item["metrics"]["target_units"] > 0
        assert item["metrics"]["available_units"] > 0
        assert item["metrics"]["booked_units"] > 0
        assert item["metrics"]["inventory_utilization_pct"] > 0
        assert item["metrics"]["total_leads"] > 0
        assert item["metrics"]["valid_leads"] > 0
        assert item["metrics"]["completed_visits"] > 0
        assert item["metrics"]["confirmed_bookings"] > 0
        assert item["metrics"]["gross_booking_value_inr"] > 0


def test_list_projects_family_filter_skyfinia(seeded_client: TestClient):
    """Test filtering projects by Skyfinia family."""
    response = seeded_client.get("/api/v1/projects?family=Skyfinia")
    assert response.status_code == 200
    data = response.json()

    assert data["pagination"]["total"] == 2
    assert len(data["items"]) == 2
    for item in data["items"]:
        assert item["project_family"] == "Skyfinia"
        assert "Skyfinia" in item["name"]


def test_list_projects_family_filter_infinia(seeded_client: TestClient):
    """Test filtering projects by Infinia family."""
    response = seeded_client.get("/api/v1/projects?family=infinia")
    assert response.status_code == 200
    data = response.json()

    assert data["pagination"]["total"] == 2
    assert len(data["items"]) == 2
    for item in data["items"]:
        assert item["project_family"] == "Infinia"
        assert "Infinia" in item["name"]


def test_list_projects_search_by_name(seeded_client: TestClient):
    """Test partial search by project name."""
    res_phase2 = seeded_client.get("/api/v1/projects?search=Phase+2")
    assert res_phase2.status_code == 200
    data_phase2 = res_phase2.json()
    assert data_phase2["pagination"]["total"] == 2
    assert all("Phase 2" in item["name"] for item in data_phase2["items"])


def test_list_projects_search_by_code(seeded_client: TestClient):
    """Test search by project business code."""
    res_code = seeded_client.get("/api/v1/projects?search=PRJ-SKY-P1")
    assert res_code.status_code == 200
    data_code = res_code.json()
    assert data_code["pagination"]["total"] == 1
    assert data_code["items"][0]["id"] == "prj-sky-p1"
    assert data_code["items"][0]["project_code"] == "PRJ-SKY-P1"


def test_list_projects_status_filter(seeded_client: TestClient):
    """Test filtering projects by lifecycle status."""
    res_active = seeded_client.get("/api/v1/projects?status=Active")
    assert res_active.status_code == 200
    assert res_active.json()["pagination"]["total"] == 4

    res_completed = seeded_client.get("/api/v1/projects?status=Completed")
    assert res_completed.status_code == 200
    assert res_completed.json()["pagination"]["total"] == 0
    assert res_completed.json()["items"] == []


def test_list_projects_sorting(seeded_client: TestClient):
    """Test sorting projects by various criteria with deterministic secondary tie-breaker."""
    # Target units
    res_units = seeded_client.get("/api/v1/projects?sort_by=target_units")
    assert res_units.status_code == 200
    units = [i["target_units"] for i in res_units.json()["items"]]
    assert units == sorted(units, reverse=True)

    # Available units
    res_avail = seeded_client.get("/api/v1/projects?sort_by=available_units")
    assert res_avail.status_code == 200
    avail = [i["available_units"] for i in res_avail.json()["items"]]
    assert avail == sorted(avail, reverse=True)

    # Booked units
    res_booked = seeded_client.get("/api/v1/projects?sort_by=booked_units")
    assert res_booked.status_code == 200
    booked = [i["metrics"]["booked_units"] for i in res_booked.json()["items"]]
    assert booked == sorted(booked, reverse=True)

    # Booking value
    res_val = seeded_client.get("/api/v1/projects?sort_by=booking_value")
    assert res_val.status_code == 200
    vals = [i["metrics"]["gross_booking_value_inr"] for i in res_val.json()["items"]]
    assert vals == sorted(vals, reverse=True)

    # Name
    res_name = seeded_client.get("/api/v1/projects?sort_by=name")
    assert res_name.status_code == 200
    names = [i["name"] for i in res_name.json()["items"]]
    assert names == sorted(names)


def test_list_projects_pagination(seeded_client: TestClient):
    """Test pagination bounds and slicing."""
    res_p1 = seeded_client.get("/api/v1/projects?page=1&page_size=2")
    assert res_p1.status_code == 200
    data_p1 = res_p1.json()
    assert data_p1["pagination"]["total"] == 4
    assert data_p1["pagination"]["page"] == 1
    assert data_p1["pagination"]["page_size"] == 2
    assert data_p1["pagination"]["total_pages"] == 2
    assert len(data_p1["items"]) == 2

    res_p2 = seeded_client.get("/api/v1/projects?page=2&page_size=2")
    assert res_p2.status_code == 200
    data_p2 = res_p2.json()
    assert len(data_p2["items"]) == 2
    assert data_p2["items"][0]["id"] != data_p1["items"][0]["id"]


# ==============================================================================
# Project Detail API Tests
# ==============================================================================


def test_get_project_detail_skyfinia_phase_1(seeded_client: TestClient):
    """Test retrieving detailed metrics, funnel, top partners, and closures for Skyfinia Phase 1."""
    response = seeded_client.get("/api/v1/projects/prj-sky-p1")
    assert response.status_code == 200
    data = response.json()

    # Identity
    assert data["id"] == "prj-sky-p1"
    assert data["project_code"] == "PRJ-SKY-P1"
    assert data["name"] == "Skyfinia Phase 1"
    assert data["project_family"] == "Skyfinia"
    assert data["location"] == "Tathawade"
    assert data["city"] == "Pune"
    assert data["status"] == "Active"
    assert data["target_units"] == 320
    assert data["available_units"] == 280
    assert data["starting_price"] == 8800000.0

    # Inventory
    inv = data["inventory"]
    assert inv["target_units"] == 320
    assert inv["available_units"] == 280
    assert inv["booked_units"] == 40
    assert inv["inventory_utilization_pct"] == 12.5

    # Lead metrics
    lm = data["lead_metrics"]
    assert lm["total_leads"] > 0
    assert lm["valid_leads"] > 0
    assert lm["qualified_leads"] > 0
    assert lm["qualification_rate_pct"] > 50.0

    # Site visit metrics
    svm = data["site_visit_metrics"]
    assert svm["scheduled_visits"] > 0
    assert svm["completed_visits"] > 0
    assert svm["unique_visited_leads"] > 0
    assert svm["visit_completion_rate_pct"] > 50.0

    # Booking metrics (Verify direct booking isolation)
    bm = data["booking_metrics"]
    assert bm["confirmed_bookings"] == 40
    assert bm["gross_booking_value_inr"] == 387100000.0
    direct_plus_visited = bm["confirmed_from_visited_leads"] + bm["direct_confirmed_bookings"]
    assert direct_plus_visited == bm["confirmed_bookings"]
    assert bm["visit_to_booking_rate_pct"] > 0.0
    assert bm["overall_lead_to_booking_rate_pct"] > 0.0

    # Partner metrics
    pm = data["partner_metrics"]
    assert pm["contributing_lead_partners"] > 0
    assert pm["contributing_booking_partners"] > 0

    # Monthly trends (12 months of 2026)
    trends = data["monthly_trends"]
    assert len(trends) == 12
    assert trends[0]["month"] == "Jan"
    assert trends[11]["month"] == "Dec"
    assert sum(t["bookings"] for t in trends) == 40

    # Top channel partners
    top_p = data["top_partners"]
    assert len(top_p) > 0
    assert len(top_p) <= 10
    # Verify deterministic sorting (bookings DESC)
    b_counts = [p["confirmed_bookings"] for p in top_p]
    assert b_counts == sorted(b_counts, reverse=True)

    # Recent bookings
    recent_b = data["recent_bookings"]
    assert len(recent_b) > 0
    assert len(recent_b) <= 10
    for bk in recent_b:
        assert bk["booking_status"] in ("Confirmed", "Completed")
        assert bk["booking_value"] > 0
        assert bk["customer_name"] != "Unknown Customer"
        assert bk["channel_partner_name"] != "Unknown Partner"


def test_get_project_detail_by_code(seeded_client: TestClient):
    """Test retrieving project detail using project code case-insensitively."""
    response = seeded_client.get("/api/v1/projects/PRJ-INF-P1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "prj-inf-p1"
    assert data["name"] == "Infinia Phase 1"
    assert data["project_family"] == "Infinia"
    assert data["inventory"]["target_units"] == 350
    assert data["inventory"]["booked_units"] == 33


def test_get_project_detail_not_found(seeded_client: TestClient):
    """Test retrieving non-existent project returns 404."""
    response = seeded_client.get("/api/v1/projects/non-existent-prj-id")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_project_family_mapping_helper():
    """Test authoritative project family derivation function."""
    assert get_project_family("Skyfinia Phase 1", "PRJ-SKY-P1") == "Skyfinia"
    assert get_project_family("Skyfinia Phase 2", "PRJ-SKY-P2") == "Skyfinia"
    assert get_project_family("Infinia Phase 1", "PRJ-INF-P1") == "Infinia"
    assert get_project_family("Infinia Phase 2", "PRJ-INF-P2") == "Infinia"
    assert get_project_family("Unknown Tower", "PRJ-UNK") == "Other"
