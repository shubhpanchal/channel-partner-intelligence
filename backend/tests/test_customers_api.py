"""Tests for Global Customer Search and Customer Detail APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import create_application
from app.seed.constants import CANONICAL_DEMO_CUSTOMER
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
# Customer Search API Tests
# ==============================================================================


def test_search_customer_by_name_canonical(seeded_client: TestClient):
    """Test searching for canonical demo customer by full name."""
    name = CANONICAL_DEMO_CUSTOMER["customer_name"]
    response = seeded_client.get(f"/api/v1/customers/search?q={name}")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 1
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["customer_name"] == "Aarav Mehta"
    assert item["lead_code"] == "LD-2026-000067"
    assert item["lead_id"] == "ld-000067"
    assert item["project_name"] == "Skyfinia Phase 1"
    assert item["channel_partner_name"] == "Elite Realty Partners"
    assert item["salesperson_name"] == "Rohit Deshmukh"
    assert item["lead_status"] == "Converted"


def test_search_customer_case_insensitive_partial(seeded_client: TestClient):
    """Test case-insensitive partial name matching."""
    response = seeded_client.get("/api/v1/customers/search?q=aarav+meh")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] >= 1
    assert any(i["customer_name"] == "Aarav Mehta" for i in data["items"])


def test_search_customer_by_phone(seeded_client: TestClient):
    """Test search matching customer contact phone."""
    phone = CANONICAL_DEMO_CUSTOMER["customer_phone"]
    response = seeded_client.get(f"/api/v1/customers/search?q={phone}")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["customer_name"] == "Aarav Mehta"


def test_search_customer_by_email(seeded_client: TestClient):
    """Test search matching customer email."""
    email = CANONICAL_DEMO_CUSTOMER["customer_email"]
    response = seeded_client.get(f"/api/v1/customers/search?q={email}")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["customer_name"] == "Aarav Mehta"


def test_search_customer_by_lead_code(seeded_client: TestClient):
    """Test search matching lead business code."""
    response = seeded_client.get("/api/v1/customers/search?q=LD-2026-000067")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["lead_code"] == "LD-2026-000067"


def test_search_customer_minimum_query_length(seeded_client: TestClient):
    """Test search with single char or empty query returns empty list without error."""
    res_single = seeded_client.get("/api/v1/customers/search?q=a")
    assert res_single.status_code == 200
    assert res_single.json()["items"] == []
    assert res_single.json()["total"] == 0

    res_empty = seeded_client.get("/api/v1/customers/search?q=")
    assert res_empty.status_code == 200
    assert res_empty.json()["items"] == []
    assert res_empty.json()["total"] == 0

    res_spaces = seeded_client.get("/api/v1/customers/search?q=   ")
    assert res_spaces.status_code == 200
    assert res_spaces.json()["items"] == []
    assert res_spaces.json()["total"] == 0


def test_search_customer_non_existent(seeded_client: TestClient):
    """Test searching for a non-existent customer returns 0 items."""
    response = seeded_client.get("/api/v1/customers/search?q=NonExistentCustomerXYZ99")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_search_customer_page_size_limit(seeded_client: TestClient):
    """Test page_size parameter limits returned items."""
    response = seeded_client.get("/api/v1/customers/search?q=Mehta&page_size=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) <= 3
    assert data["total"] >= len(data["items"])


# ==============================================================================
# Customer Detail API Tests
# ==============================================================================


def test_get_customer_detail_canonical_demo(seeded_client: TestClient):
    """Test retrieving full customer profile and booking replacement history for Aarav Mehta."""
    response = seeded_client.get("/api/v1/customers/ld-000067")
    assert response.status_code == 200
    data = response.json()

    # Identity
    assert data["lead_id"] == "ld-000067"
    assert data["lead_code"] == "LD-2026-000067"
    assert data["customer_name"] == "Aarav Mehta"
    assert data["customer_phone"] == "+919822099901"
    assert data["customer_email"] == "aarav.mehta@example.com"
    assert data["lead_status"] == "Converted"

    # Attribution
    assert data["project_id"] == "prj-sky-p1"
    assert data["project_name"] == "Skyfinia Phase 1"
    assert data["channel_partner_id"] == "cp-1001"
    assert data["channel_partner_name"] == "Elite Realty Partners"
    assert data["salesperson_id"] == "sp-101"
    assert data["salesperson_name"] == "Rohit Deshmukh"

    # Site Visits
    assert len(data["site_visits"]) >= 1
    sv = data["site_visits"][0]
    assert sv["status"] == "Completed"
    assert sv["outcome"] in ("Positive / Intent to Book", "Revisit Planned")

    # Bookings (Must have exactly 2: 1 Cancelled + 1 Confirmed replacement)
    bookings = data["bookings"]
    assert len(bookings) == 2

    # Chronological lifecycle order: Attempt A (Cancelled) then Attempt B (Confirmed)
    bk_cancelled = bookings[0]
    bk_confirmed = bookings[1]

    assert bk_cancelled["booking_status"] == "Cancelled"
    assert bk_cancelled["cancelled_at"] is not None
    assert bk_cancelled["unit_number"] == "Unit 773"

    assert bk_confirmed["booking_status"] == "Confirmed"
    assert bk_confirmed["cancelled_at"] is None
    assert bk_confirmed["unit_number"] == "Unit 1706"

    # Strict lifecycle chronology verification
    dt_created_a = datetime.fromisoformat(bk_cancelled["created_at"])
    dt_cancelled_a = datetime.fromisoformat(bk_cancelled["cancelled_at"])
    dt_created_b = datetime.fromisoformat(bk_confirmed["created_at"])

    assert dt_created_a < dt_cancelled_a
    assert dt_created_b > dt_cancelled_a
    assert bk_cancelled["unit_number"] != bk_confirmed["unit_number"]

    # Lifecycle Events: Three-Event Timeline Verification (Issue #12)
    lifecycle_events = data["lifecycle_events"]
    assert len(lifecycle_events) == 3

    ev1 = lifecycle_events[0]
    ev2 = lifecycle_events[1]
    ev3 = lifecycle_events[2]

    # Event 1: Booking Attempted / Created
    assert ev1["event_type"] == "BOOKING_CREATED"
    assert ev1["booking_id"] == "bk-000014"
    assert ev1["booking_reference"] == "BK-2026-000014"
    assert ev1["unit_number"] == "Unit 773"
    assert ev1["is_replacement"] is False
    assert ev1["event_at"] == bk_cancelled["created_at"]

    # Event 2: Booking Cancelled
    assert ev2["event_type"] == "BOOKING_CANCELLED"
    assert ev2["booking_id"] == "bk-000014"
    assert ev2["booking_reference"] == "BK-2026-000014"
    assert ev2["unit_number"] == "Unit 773"
    assert ev2["is_replacement"] is False
    assert ev2["event_at"] == bk_cancelled["cancelled_at"]

    # Event 3: Replacement Booking Confirmed
    assert ev3["event_type"] == "BOOKING_CONFIRMED"
    assert ev3["booking_id"] == "bk-000015"
    assert ev3["booking_reference"] == "BK-2026-000015"
    assert ev3["unit_number"] == "Unit 1706"
    assert ev3["is_replacement"] is True
    assert ev3["event_at"] == bk_confirmed["created_at"]

    # Invariants
    assert ev1["booking_id"] == ev2["booking_id"]
    assert ev3["booking_id"] != ev1["booking_id"]
    assert ev1["unit_number"] == ev2["unit_number"]
    assert ev3["unit_number"] != ev1["unit_number"]

    # Chronology
    dt_ev1 = datetime.fromisoformat(ev1["event_at"])
    dt_ev2 = datetime.fromisoformat(ev2["event_at"])
    dt_ev3 = datetime.fromisoformat(ev3["event_at"])
    assert dt_ev1 < dt_ev2 < dt_ev3


def test_get_customer_detail_by_lead_code(seeded_client: TestClient):
    """Test retrieving customer detail using lead_code LD-2026-000067."""
    response = seeded_client.get("/api/v1/customers/LD-2026-000067")
    assert response.status_code == 200
    data = response.json()
    assert data["lead_id"] == "ld-000067"
    assert data["customer_name"] == "Aarav Mehta"


def test_get_customer_detail_single_confirmed_booking(seeded_client: TestClient):
    """Test customer with standard single booking produces 1 lifecycle event."""
    # Search for a customer with confirmed lead status
    search_res = seeded_client.get("/api/v1/customers/search?q=Sharma&page_size=10")
    assert search_res.status_code == 200
    items = search_res.json()["items"]

    # Find any lead with a single booking
    for item in items:
        detail_res = seeded_client.get(f"/api/v1/customers/{item['lead_id']}")
        if detail_res.status_code == 200:
            d = detail_res.json()
            if len(d["bookings"]) == 1 and d["bookings"][0]["booking_status"] == "Confirmed":
                assert len(d["lifecycle_events"]) == 1
                ev = d["lifecycle_events"][0]
                assert ev["event_type"] == "BOOKING_CONFIRMED"
                assert ev["is_replacement"] is False
                break


def test_get_customer_detail_no_bookings(seeded_client: TestClient):
    """Test customer without bookings returns empty lifecycle_events list."""
    # Search for a qualified or fresh lead
    search_res = seeded_client.get("/api/v1/customers/search?q=Patil&page_size=20")
    assert search_res.status_code == 200
    items = search_res.json()["items"]

    found_unbooked = False
    for item in items:
        detail_res = seeded_client.get(f"/api/v1/customers/{item['lead_id']}")
        if detail_res.status_code == 200:
            d = detail_res.json()
            if len(d["bookings"]) == 0:
                assert d["lifecycle_events"] == []
                found_unbooked = True
                break
    assert found_unbooked


def test_get_customer_detail_404_not_found(seeded_client: TestClient):
    """Test retrieving non-existent customer returns 404."""
    response = seeded_client.get("/api/v1/customers/non-existent-lead-id")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()

