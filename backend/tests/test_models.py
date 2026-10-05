"""Tests for SQLAlchemy database models, constraints, and relationships."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app.models import (
    Booking,
    BookingStatus,
    ChannelPartner,
    Lead,
    LeadStatus,
    PartnerActivity,
    PartnerActivityType,
    PartnerTier,
    Project,
    ProjectStatus,
    Salesperson,
    SiteVisit,
    SiteVisitStatus,
)


def test_create_salesperson(db_session):
    """Test creating and querying a salesperson model."""
    sp = Salesperson(
        id="SP-0001",
        name="Aarav Sharma",
        email="aarav.sharma@hariwishwa.com",
        phone="+91-9876543210",
        team="Sales - Baner",
        active=True,
    )
    db_session.add(sp)
    db_session.commit()

    queried = db_session.query(Salesperson).filter_by(id="SP-0001").first()
    assert queried is not None
    assert queried.name == "Aarav Sharma"
    assert "SP-0001" in repr(queried)


def test_create_project(db_session):
    """Test creating and querying a project model."""
    proj = Project(
        id="PRJ-0001",
        project_code="HWM",
        name="Hariwishwa Meadows",
        project_type="Residential",
        location="Baner, Pune",
        city="Pune",
        status=ProjectStatus.ACTIVE.value,
        launch_date=date(2024, 1, 15),
        target_units=240,
        available_units=180,
        starting_price=Decimal("8500000.00"),
    )
    db_session.add(proj)
    db_session.commit()

    queried = db_session.query(Project).filter_by(id="PRJ-0001").first()
    assert queried is not None
    assert queried.project_code == "HWM"
    assert "PRJ-0001" in repr(queried)


def test_create_channel_partner(db_session):
    """Test creating and querying a channel partner model."""
    cp = ChannelPartner(
        id="CP-0001",
        partner_code="CP-0001",
        name="Apex Realty Partners",
        legal_name="Apex Realty Network Pvt Ltd",
        contact_person="Rohit Mehta",
        phone="+91-9823011223",
        email="rohit@apexrealty.com",
        city="Pune",
        location="Baner",
        tier=PartnerTier.TIER_1.value,
        channel_type="Corporate Agency",
        active=True,
    )
    db_session.add(cp)
    db_session.commit()

    queried = db_session.query(ChannelPartner).filter_by(id="CP-0001").first()
    assert queried is not None
    assert queried.tier == PartnerTier.TIER_1.value
    assert queried.active is True
    assert "CP-0001" in repr(queried)


def test_lead_relationships_and_milestones(db_session):
    """Test lead model creation with milestone timestamps and relations."""
    sp = Salesperson(id="SP-0001", name="Aarav", email="aarav@test.com", phone="123", team="Sales")
    proj = Project(
        id="PRJ-0001",
        project_code="HWM",
        name="Meadows",
        project_type="Residential",
        location="Baner",
        city="Pune",
        status=ProjectStatus.ACTIVE.value,
        launch_date=date(2024, 1, 1),
        target_units=100,
        available_units=80,
        starting_price=Decimal("5000000.00"),
    )
    cp = ChannelPartner(
        id="CP-0001",
        partner_code="CP-0001",
        name="Apex",
        contact_person="Rohit",
        phone="123",
        email="r@a.com",
        city="Pune",
        location="Baner",
        tier=PartnerTier.TIER_1.value,
        channel_type="Broker",
    )
    db_session.add_all([sp, proj, cp])
    db_session.commit()

    now = datetime.now(timezone.utc)
    lead = Lead(
        id="LD-000001",
        lead_code="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        assigned_salesperson_id="SP-0001",
        customer_name="Vikram Seth",
        customer_phone="+91-9890112233",
        customer_email="vikram@example.com",
        status=LeadStatus.QUALIFIED.value,
        budget_range="75L - 1 Cr",
        requirement_type="3BHK",
        created_at=now - timedelta(days=10),
        qualified_at=now - timedelta(days=8),
    )
    db_session.add(lead)
    db_session.commit()

    queried = db_session.query(Lead).filter_by(id="LD-000001").first()
    assert queried is not None
    assert queried.channel_partner.name == "Apex"
    assert queried.project.name == "Meadows"
    assert queried.assigned_salesperson.name == "Aarav"
    assert queried.qualified_at is not None
    assert "LD-000001" in repr(queried)


def test_site_visit_model(db_session):
    """Test site visit creation and associations."""
    sp = Salesperson(id="SP-0001", name="Aarav", email="a@t.com", phone="123", team="Sales")
    proj = Project(
        id="PRJ-0001",
        project_code="HWM",
        name="Meadows",
        project_type="Residential",
        location="Baner",
        city="Pune",
        status=ProjectStatus.ACTIVE.value,
        launch_date=date(2024, 1, 1),
        target_units=100,
        available_units=80,
        starting_price=Decimal("5000000.00"),
    )
    cp = ChannelPartner(
        id="CP-0001",
        partner_code="CP-0001",
        name="Apex",
        contact_person="Rohit",
        phone="123",
        email="r@a.com",
        city="Pune",
        location="Baner",
        tier=PartnerTier.TIER_1.value,
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
    db_session.add_all([sp, proj, cp, lead])
    db_session.commit()

    now = datetime.now(timezone.utc)
    visit = SiteVisit(
        id="SV-000001",
        visit_code="SV-000001",
        lead_id="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        salesperson_id="SP-0001",
        status=SiteVisitStatus.COMPLETED.value,
        verification_type="Digital Token OTP",
        scheduled_at=now - timedelta(days=2),
        visited_at=now - timedelta(days=2),
        feedback_notes="Client loved the floor plan.",
    )
    db_session.add(visit)
    db_session.commit()

    queried = db_session.query(SiteVisit).filter_by(id="SV-000001").first()
    assert queried is not None
    assert queried.lead.customer_name == "Vikram"
    assert queried.status == SiteVisitStatus.COMPLETED.value
    assert "SV-000001" in repr(queried)


def test_booking_model_and_partial_unique_index(db_session):
    """Test partial unique index constraint enforcing at most one active booking per lead."""
    sp = Salesperson(id="SP-0001", name="Aarav", email="a@t.com", phone="123", team="Sales")
    proj = Project(
        id="PRJ-0001",
        project_code="HWM",
        name="Meadows",
        project_type="Residential",
        location="Baner",
        city="Pune",
        status=ProjectStatus.ACTIVE.value,
        launch_date=date(2024, 1, 1),
        target_units=100,
        available_units=80,
        starting_price=Decimal("5000000.00"),
    )
    cp = ChannelPartner(
        id="CP-0001",
        partner_code="CP-0001",
        name="Apex",
        contact_person="Rohit",
        phone="123",
        email="r@a.com",
        city="Pune",
        location="Baner",
        tier=PartnerTier.TIER_1.value,
    )
    lead = Lead(
        id="LD-000001",
        lead_code="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        customer_name="Vikram",
        customer_phone="123",
        status=LeadStatus.BOOKING_CONFIRMED.value,
    )
    db_session.add_all([sp, proj, cp, lead])
    db_session.commit()

    now = datetime.now(timezone.utc)
    # First booking: Cancelled (Terminal)
    b1 = Booking(
        id="BK-000001",
        booking_reference="BK-000001",
        lead_id="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        salesperson_id="SP-0001",
        unit_number="A-101",
        unit_type="2BHK",
        booking_date=date.today(),
        booking_value=Decimal("6500000.00"),
        token_amount=Decimal("100000.00"),
        booking_status=BookingStatus.CANCELLED.value,
        commission_rate_pct=Decimal("2.00"),
        commission_amount=Decimal("130000.00"),
        created_at=now - timedelta(days=20),
    )
    db_session.add(b1)
    db_session.commit()

    # Second booking: Initiated (Active)
    b2 = Booking(
        id="BK-000002",
        booking_reference="BK-000002",
        lead_id="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        salesperson_id="SP-0001",
        unit_number="B-502",
        unit_type="3BHK",
        booking_date=date.today(),
        booking_value=Decimal("8500000.00"),
        token_amount=Decimal("150000.00"),
        booking_status=BookingStatus.INITIATED.value,
        commission_rate_pct=Decimal("2.00"),
        commission_amount=Decimal("170000.00"),
        created_at=now - timedelta(days=5),
    )
    db_session.add(b2)
    db_session.commit()

    assert "BK-000002" in repr(b2)

    # Attempting to add a THIRD booking that is also Confirmed (Active) for LD-000001 should FAIL
    b3 = Booking(
        id="BK-000003",
        booking_reference="BK-000003",
        lead_id="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        salesperson_id="SP-0001",
        unit_number="C-301",
        unit_type="3BHK",
        booking_date=date.today(),
        booking_value=Decimal("8800000.00"),
        token_amount=Decimal("150000.00"),
        booking_status=BookingStatus.CONFIRMED.value,
        commission_rate_pct=Decimal("2.00"),
        commission_amount=Decimal("176000.00"),
        created_at=now,
    )
    db_session.add(b3)
    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()

    # Adding a Completed booking alongside the active one is allowed (Completed is terminal)
    b4 = Booking(
        id="BK-000004",
        booking_reference="BK-000004",
        lead_id="LD-000001",
        channel_partner_id="CP-0001",
        project_id="PRJ-0001",
        salesperson_id="SP-0001",
        unit_number="D-102",
        unit_type="2BHK",
        booking_date=date.today(),
        booking_value=Decimal("6000000.00"),
        token_amount=Decimal("100000.00"),
        booking_status=BookingStatus.COMPLETED.value,
        commission_rate_pct=Decimal("2.00"),
        commission_amount=Decimal("120000.00"),
        created_at=now - timedelta(days=100),
    )
    db_session.add(b4)
    db_session.commit()


def test_partner_activity_model(db_session):
    """Test partner activity logging and retrieval."""
    cp = ChannelPartner(
        id="CP-0001",
        partner_code="CP-0001",
        name="Apex",
        contact_person="Rohit",
        phone="123",
        email="r@a.com",
        city="Pune",
        location="Baner",
        tier=PartnerTier.TIER_1.value,
    )
    db_session.add(cp)
    db_session.commit()

    act = PartnerActivity(
        id="ACT-000001",
        channel_partner_id="CP-0001",
        activity_type=PartnerActivityType.MEETING.value,
        entity_type="channel_partner",
        entity_id="CP-0001",
        description="Discussed H2 targets and luxury inventory.",
        logged_at=datetime.now(timezone.utc),
    )
    db_session.add(act)
    db_session.commit()

    queried = db_session.query(PartnerActivity).filter_by(id="ACT-000001").first()
    assert queried is not None
    assert queried.activity_type == PartnerActivityType.MEETING.value
    assert queried.channel_partner.name == "Apex"
    assert "ACT-000001" in repr(act)
