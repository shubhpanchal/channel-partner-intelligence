"""Tests for dataset integrity validation and rule enforcement."""

import io
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from app.models import (
    Booking,
    BookingStatus,
    ChannelPartner,
    Lead,
    LeadStatus,
    PartnerTier,
    Project,
    ProjectStatus,
    Salesperson,
    SiteVisit,
    SiteVisitStatus,
)
from app.seed.generator import seed_database
from app.seed.validator import ValidationReport, print_validation_report, validate_dataset


def test_validator_on_seeded_database(db_session):
    """Test that validate_dataset runs cleanly on freshly seeded database."""
    seed_database(db_session, seed=42)

    report = validate_dataset(db_session)
    assert report.passed is True
    assert len(report.errors) == 0

    # Test printing formatted report
    captured = io.StringIO()
    sys_stdout = sys.stdout
    try:
        sys.stdout = captured
        print_validation_report(report)
    finally:
        sys.stdout = sys_stdout

    output = captured.getvalue()
    assert "DATASET VALIDATION REPORT" in output
    assert "ALL CHECKS PASSED" in output
    assert "Projects Count" in output
    assert "Partners Count & Tiers" in output


def test_validator_detects_count_errors(db_session):
    """Test validator catches empty/missing entity records."""
    report = validate_dataset(db_session)

    assert report.passed is False
    assert any("Projects Count" in e for e in report.errors)
    assert any("Salespeople Count" in e for e in report.errors)


def test_validator_detects_cross_entity_mismatch(db_session):
    """Test validator catches when a visit/booking references a different project/partner."""
    sp = Salesperson(id="SP-0001", name="Aarav", email="a@t.com", phone="123", team="Sales")
    p1 = Project(
        id="PRJ-0001",
        project_code="P1",
        name="P1",
        project_type="Residential",
        location="L1",
        city="Pune",
        status=ProjectStatus.ACTIVE.value,
        launch_date=date(2024, 1, 1),
        target_units=100,
        available_units=80,
        starting_price=Decimal("5000000.00"),
    )
    p2 = Project(
        id="PRJ-0002",
        project_code="P2",
        name="P2",
        project_type="Residential",
        location="L2",
        city="Pune",
        status=ProjectStatus.ACTIVE.value,
        launch_date=date(2024, 1, 1),
        target_units=100,
        available_units=80,
        starting_price=Decimal("5000000.00"),
    )
    cp1 = ChannelPartner(
        id="CP-0001",
        partner_code="CP-0001",
        name="C1",
        tier=PartnerTier.TIER_1.value,
        city="Pune",
        location="Baner",
        contact_person="P",
        email="e1@test.com",
        phone="1",
    )
    cp2 = ChannelPartner(
        id="CP-0002",
        partner_code="CP-0002",
        name="C2",
        tier=PartnerTier.TIER_1.value,
        city="Pune",
        location="Kothrud",
        contact_person="P",
        email="e2@test.com",
        phone="2",
    )

    lead = Lead(
        id="LD-000001",
        lead_code="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        assigned_salesperson_id="SP-0001",
        customer_name="Vikram",
        customer_phone="123",
        status=LeadStatus.SITE_VISIT_COMPLETED.value,
    )
    # Mismatch: Visit references PRJ-0002 instead of lead's PRJ-0001
    visit = SiteVisit(
        id="SV-000001",
        visit_code="SV-000001",
        lead_id="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0002",
        salesperson_id="SP-0001",
        status=SiteVisitStatus.COMPLETED.value,
        scheduled_at=datetime.now(timezone.utc),
        visited_at=datetime.now(timezone.utc),
    )
    # Mismatch: Booking references CP-0002 instead of lead's CP-0001
    booking = Booking(
        id="BK-000001",
        booking_reference="BK-000001",
        lead_id="LD-000001",
        channel_partner_id="CP-0002",
        project_id="PRJ-0001",
        salesperson_id="SP-0001",
        unit_number="A-101",
        unit_type="2BHK",
        booking_date=date.today(),
        booking_value=Decimal("5000000.00"),
        token_amount=Decimal("100000.00"),
        booking_status=BookingStatus.CONFIRMED.value,
        commission_rate_pct=Decimal("2.00"),
        commission_amount=Decimal("100000.00"),
        created_at=datetime.now(timezone.utc),
    )

    db_session.add_all([sp, p1, p2, cp1, cp2, lead, visit, booking])
    db_session.commit()

    report = validate_dataset(db_session)
    assert report.passed is False
    assert any("Site Visit Entity Consistency" in e for e in report.errors)
    assert any("Booking Entity Consistency" in e for e in report.errors)


def test_validator_detects_temporal_inconsistencies(db_session):
    """Test validator catches impossible date sequences."""
    sp = Salesperson(id="SP-0001", name="Aarav", email="a@t.com", phone="123", team="Sales")
    p1 = Project(
        id="PRJ-0001",
        project_code="P1",
        name="P1",
        project_type="Residential",
        location="L1",
        city="Pune",
        status=ProjectStatus.ACTIVE.value,
        launch_date=date(2024, 1, 1),
        target_units=100,
        available_units=80,
        starting_price=Decimal("5000000.00"),
    )
    cp1 = ChannelPartner(
        id="CP-0001",
        partner_code="CP-0001",
        name="C1",
        tier=PartnerTier.TIER_1.value,
        city="Pune",
        location="Baner",
        contact_person="P",
        email="e@test.com",
        phone="1",
    )

    now = datetime.now(timezone.utc)
    # Lead created today with qualified_at and converted_at in the past
    lead = Lead(
        id="LD-000001",
        lead_code="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        customer_name="Vikram",
        customer_phone="123",
        status=LeadStatus.CONVERTED.value,
        created_at=now,
        qualified_at=now - timedelta(days=5),  # Error: before created_at
        converted_at=now - timedelta(days=2),  # Error: before created_at
    )
    # Visit with scheduled_at before lead created_at and visited_at before scheduled_at
    visit = SiteVisit(
        id="SV-000001",
        visit_code="SV-000001",
        lead_id="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        salesperson_id="SP-0001",
        status=SiteVisitStatus.COMPLETED.value,
        scheduled_at=now - timedelta(days=3),  # Error: before lead created_at
        visited_at=now - timedelta(days=4),    # Error: before scheduled_at
    )
    db_session.add_all([sp, p1, cp1, lead, visit])
    db_session.commit()

    report = validate_dataset(db_session)
    assert report.passed is False
    assert any("Temporal Order Consistency" in e for e in report.errors)


def test_print_validation_report_failed():
    """Test printing failed report outputs error details."""
    report = ValidationReport()
    report.add_check("Check 1", False, "Failed due to mismatch")

    captured = io.StringIO()
    sys_stdout = sys.stdout
    try:
        sys.stdout = captured
        print_validation_report(report)
    finally:
        sys.stdout = sys_stdout

    output = captured.getvalue()
    assert "VALIDATION FAILED" in output
    assert "Failed due to mismatch" in output
