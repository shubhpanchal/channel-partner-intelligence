"""Tests for deterministic synthetic data generation and lifecycle semantics."""

from app.models import ChannelPartner, Lead, LeadStatus, PartnerTier
from app.seed.constants import TARGET_PARTNER_DISTRIBUTION
from app.seed.generator import generate_synthetic_dataset, seed_database


def test_synthetic_data_generator_deterministic_output():
    """Verify that running the generator with SEED=42 produces identical data across runs."""
    data1 = generate_synthetic_dataset(seed=42)
    data2 = generate_synthetic_dataset(seed=42)

    assert len(data1["projects"]) == len(data2["projects"])
    assert len(data1["salespeople"]) == len(data2["salespeople"])
    assert len(data1["channel_partners"]) == len(data2["channel_partners"])
    assert len(data1["leads"]) == len(data2["leads"])
    assert len(data1["site_visits"]) == len(data2["site_visits"])
    assert len(data1["bookings"]) == len(data2["bookings"])
    assert len(data1["partner_activities"]) == len(data2["partner_activities"])

    # Sample check equality of first and last IDs and properties
    assert data1["projects"][0]["id"] == data2["projects"][0]["id"]
    assert data1["projects"][0]["name"] == data2["projects"][0]["name"]
    assert data1["channel_partners"][0]["name"] == data2["channel_partners"][0]["name"]
    assert data1["leads"][0]["customer_name"] == data2["leads"][0]["customer_name"]
    assert data1["bookings"][0]["booking_value"] == data2["bookings"][0]["booking_value"]


def test_synthetic_dataset_target_ranges():
    """Verify generated counts meet Phase 2B target range requirements."""
    data = generate_synthetic_dataset(seed=42)

    assert len(data["projects"]) == 5
    assert len(data["salespeople"]) == 10
    assert len(data["channel_partners"]) == 175

    # Tier breakdown
    t1_count = sum(1 for p in data["channel_partners"] if p["tier"] == PartnerTier.TIER_1.value)
    t2_count = sum(1 for p in data["channel_partners"] if p["tier"] == PartnerTier.TIER_2.value)
    t3_count = sum(1 for p in data["channel_partners"] if p["tier"] == PartnerTier.TIER_3.value)

    assert t1_count == TARGET_PARTNER_DISTRIBUTION[PartnerTier.TIER_1.value]  # 18
    assert t2_count == TARGET_PARTNER_DISTRIBUTION[PartnerTier.TIER_2.value]  # 45
    assert t3_count == TARGET_PARTNER_DISTRIBUTION[PartnerTier.TIER_3.value]  # 112

    # Target ranges for leads (3,800-4,200), site visits (1,800-2,200), confirmed bookings (400-500)
    assert 3800 <= len(data["leads"]) <= 4200
    assert 1800 <= len(data["site_visits"]) <= 2200

    confirmed_bookings = sum(1 for b in data["bookings"] if b["booking_status"] == "Confirmed")
    assert 400 <= confirmed_bookings <= 500


def test_partner_archetypes_and_dormant_isolation():
    """Verify that dormant partners have no leads or bookings."""
    data = generate_synthetic_dataset(seed=42)

    # In our generator, Tier 3 has 6 dormant partners (indices 106-111 of T3)
    # They have active=False
    dormant_partners = [p for p in data["channel_partners"] if not p["active"]]
    assert len(dormant_partners) == 6

    dormant_ids = {p["id"] for p in dormant_partners}
    dormant_leads = [ld for ld in data["leads"] if ld["channel_partner_id"] in dormant_ids]
    assert len(dormant_leads) == 0

    dormant_bookings = [b for b in data["bookings"] if b["channel_partner_id"] in dormant_ids]
    assert len(dormant_bookings) == 0


def test_milestone_qualification_retention():
    """Verify that leads that were qualified retain qualified_at even when lost."""
    data = generate_synthetic_dataset(seed=42)

    lost_leads_with_qualification = [
        ld for ld in data["leads"] if ld["status"] == "Lost" and ld.get("qualified_at") is not None
    ]
    assert len(lost_leads_with_qualification) > 0

    # Ensure qualified_at is always set if status was qualified or beyond
    for lead in data["leads"]:
        if lead["status"] in [
            "Qualified",
            "Site Visit Scheduled",
            "Site Visit Completed",
            "Booking Initiated",
            "Converted",
        ]:
            assert lead["qualified_at"] is not None


def test_lead_status_enum_has_no_booking_confirmed():
    """Verify that 'Booking Confirmed' is not in the LeadStatus enum."""
    lead_status_values = [status.value for status in LeadStatus]
    assert "Booking Confirmed" not in lead_status_values
    assert "Converted" in lead_status_values
    assert "Booking Initiated" in lead_status_values


def test_initiated_booking_lifecycle_semantics():
    """Verify that leads with Initiated bookings have status='Booking Initiated'."""
    data = generate_synthetic_dataset(seed=42)
    lead_lookup = {ld["id"]: ld for ld in data["leads"]}

    initiated_bookings = [b for b in data["bookings"] if b["booking_status"] == "Initiated"]
    assert len(initiated_bookings) > 0, "Dataset should contain initiated bookings"

    for booking in initiated_bookings:
        lead = lead_lookup[booking["lead_id"]]
        assert lead["status"] == "Booking Initiated"
        assert lead["converted_at"] is None


def test_confirmed_and_completed_booking_lifecycle_semantics():
    """Verify that leads with Confirmed or Completed bookings have status='Converted'."""
    data = generate_synthetic_dataset(seed=42)
    lead_lookup = {ld["id"]: ld for ld in data["leads"]}

    closed_bookings = [
        b for b in data["bookings"] if b["booking_status"] in ("Confirmed", "Completed")
    ]
    assert len(closed_bookings) > 0

    for booking in closed_bookings:
        lead = lead_lookup[booking["lead_id"]]
        assert lead["status"] == "Converted"
        assert lead["converted_at"] is not None
        assert lead["converted_at"].date() == booking["booking_date"]


def test_cancelled_historical_booking_does_not_falsely_convert_lead():
    """Verify that cancelled bookings do not cause a lead to be falsely marked Converted."""
    data = generate_synthetic_dataset(seed=42)
    lead_lookup = {ld["id"]: ld for ld in data["leads"]}

    # Find leads with cancelled bookings
    leads_with_cancelled_bookings = {
        b["lead_id"] for b in data["bookings"] if b["booking_status"] == "Cancelled"
    }
    assert len(leads_with_cancelled_bookings) > 0

    for lead_id in leads_with_cancelled_bookings:
        lead_bookings = [b for b in data["bookings"] if b["lead_id"] == lead_id]
        active_bookings = [
            b for b in lead_bookings
            if b["booking_status"] in ("Initiated", "Confirmed", "Completed")
        ]

        lead = lead_lookup[lead_id]
        if not active_bookings:
            # Only has cancelled booking: should not be Converted
            assert lead["status"] != "Converted"
            assert lead["converted_at"] is None
        else:
            active_b = active_bookings[0]
            if active_b["booking_status"] == "Initiated":
                assert lead["status"] == "Booking Initiated"
                assert lead["converted_at"] is None
            elif active_b["booking_status"] in ("Confirmed", "Completed"):
                assert lead["status"] == "Converted"
                assert lead["converted_at"] is not None


def test_direct_bookings_isolation_and_converted_status():
    """Verify direct bookings exist and their leads are genuinely Converted."""
    data = generate_synthetic_dataset(seed=42)
    lead_lookup = {ld["id"]: ld for ld in data["leads"]}

    leads_with_completed_visits = {
        v["lead_id"] for v in data["site_visits"] if v["status"] == "Completed"
    }

    direct_bookings = [
        b
        for b in data["bookings"]
        if b["booking_status"] == "Confirmed"
        and b["lead_id"] not in leads_with_completed_visits
    ]
    visited_bookings = [
        b
        for b in data["bookings"]
        if b["booking_status"] == "Confirmed"
        and b["lead_id"] in leads_with_completed_visits
    ]

    assert len(direct_bookings) > 0, "Dataset must include realistic direct bookings"
    assert len(visited_bookings) > 0
    assert len(direct_bookings) + len(visited_bookings) == sum(
        1 for b in data["bookings"] if b["booking_status"] == "Confirmed"
    )

    # Check direct booking leads are genuinely Converted
    for booking in direct_bookings:
        lead = lead_lookup[booking["lead_id"]]
        assert lead["status"] == "Converted"
        assert lead["converted_at"] is not None


def test_synthetic_commission_flag():
    """Verify all generated bookings have synthetic commission metadata."""
    data = generate_synthetic_dataset(seed=42)
    for booking in data["bookings"]:
        assert float(booking["commission_rate_pct"]) == 2.0
        assert booking["is_synthetic_commission"] is True
        expected_amount = round(float(booking["booking_value"]) * 0.02, 2)
        assert float(booking["commission_amount"]) == expected_amount


def test_seed_database_execution(db_session):
    """Test seeding records into a database session."""
    counts = seed_database(db_session, seed=42)
    assert counts["projects"] == 5
    assert counts["salespeople"] == 10
    assert counts["channel_partners"] == 175
    assert counts["leads"] >= 3800

    # Verify queryable from DB
    cp_count = db_session.query(ChannelPartner).count()
    assert cp_count == 175

    lead_count = db_session.query(Lead).count()
    assert lead_count >= 3800
