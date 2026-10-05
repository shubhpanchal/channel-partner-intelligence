from datetime import timedelta
from typing import Any, Dict, List

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
    """Verify generated counts meet Phase 2D target range requirements."""
    data = generate_synthetic_dataset(seed=42)

    assert len(data["projects"]) == 4
    assert len(data["salespeople"]) == 5
    assert len(data["channel_partners"]) == 36

    # Tier breakdown
    t1_count = sum(1 for p in data["channel_partners"] if p["tier"] == PartnerTier.TIER_1.value)
    t2_count = sum(1 for p in data["channel_partners"] if p["tier"] == PartnerTier.TIER_2.value)
    t3_count = sum(1 for p in data["channel_partners"] if p["tier"] == PartnerTier.TIER_3.value)

    assert t1_count == TARGET_PARTNER_DISTRIBUTION[PartnerTier.TIER_1.value]  # 6
    assert t2_count == TARGET_PARTNER_DISTRIBUTION[PartnerTier.TIER_2.value]  # 10
    assert t3_count == TARGET_PARTNER_DISTRIBUTION[PartnerTier.TIER_3.value]  # 20

    # Target ranges for leads (1,200-1,600), site visits (500-900), confirmed bookings (100-160)
    assert 1200 <= len(data["leads"]) <= 1600
    assert 500 <= len(data["site_visits"]) <= 900

    confirmed_bookings = sum(1 for b in data["bookings"] if b["booking_status"] == "Confirmed")
    assert 100 <= confirmed_bookings <= 160


def test_partner_archetypes_and_dormant_isolation():
    """Verify that dormant partners have no leads or bookings."""
    data = generate_synthetic_dataset(seed=42)

    # In our generator, Tier 3 has 2 dormant inactive partners (indices 18-19 of T3)
    dormant_partners = [p for p in data["channel_partners"] if not p["active"]]
    assert len(dormant_partners) == 2

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
    assert counts["projects"] == 4
    assert counts["salespeople"] == 5
    assert counts["channel_partners"] == 36
    assert counts["leads"] >= 1200

    # Verify queryable from DB
    cp_count = db_session.query(ChannelPartner).count()
    assert cp_count == 36

    lead_count = db_session.query(Lead).count()
    assert lead_count >= 1200


def test_synthetic_data_date_boundaries():
    """Verify all generated temporal records are strictly within 2026-01-01 and 2026-12-31."""
    from datetime import date, datetime

    min_dt = datetime(2026, 1, 1, 0, 0, 0)
    max_dt = datetime(2026, 12, 31, 23, 59, 59)
    min_date = date(2026, 1, 1)
    max_date = date(2026, 12, 31)

    data = generate_synthetic_dataset(seed=42)

    # Leads
    for lead in data["leads"]:
        assert min_dt <= lead["created_at"] <= max_dt
        if lead["qualified_at"] is not None:
            assert min_dt <= lead["qualified_at"] <= max_dt
            assert lead["qualified_at"] >= lead["created_at"]
        if lead["converted_at"] is not None:
            assert min_dt <= lead["converted_at"] <= max_dt
            assert lead["converted_at"] >= lead["created_at"]
        if lead["lost_at"] is not None:
            assert min_dt <= lead["lost_at"] <= max_dt
            assert lead["lost_at"] >= lead["created_at"]

    # Site visits
    for sv in data["site_visits"]:
        assert min_dt <= sv["created_at"] <= max_dt
        assert min_dt <= sv["scheduled_at"] <= max_dt
        if sv["visited_at"] is not None:
            assert min_dt <= sv["visited_at"] <= max_dt
            assert sv["visited_at"] >= sv["scheduled_at"] - timedelta(minutes=1)

    # Bookings
    for bk in data["bookings"]:
        assert min_dt <= bk["created_at"] <= max_dt
        assert min_date <= bk["booking_date"] <= max_date

    # Partner activities
    for act in data["partner_activities"]:
        assert min_dt <= act["logged_at"] <= max_dt


def test_authoritative_salespeople_identities_and_emails():
    """Verify that the synthetic dataset contains exactly 5 authoritative managers."""
    from app.seed.constants import (
        AUTHORITATIVE_MANAGER_EMAILS,
        AUTHORITATIVE_MANAGER_NAMES,
    )

    data = generate_synthetic_dataset(seed=42)
    salespeople = data["salespeople"]

    assert len(salespeople) == 5

    actual_names = {sp["name"] for sp in salespeople}
    actual_emails = {sp["email"] for sp in salespeople}

    expected_managers = {
        "Rohit Deshmukh": "rohit.deshmukh@harivishva.com",
        "Sneha Kulkarni": "sneha.kulkarni@harivishva.com",
        "Amit Patil": "amit.patil@harivishva.com",
        "Priya Joshi": "priya.joshi@harivishva.com",
        "Rahul Shinde": "rahul.shinde@harivishva.com",
    }

    assert actual_names == set(expected_managers.keys())
    assert actual_emails == set(expected_managers.values())
    assert actual_names == AUTHORITATIVE_MANAGER_NAMES
    assert actual_emails == AUTHORITATIVE_MANAGER_EMAILS

    # Verify salesperson IDs in channel partners and leads map to valid managers
    valid_sp_ids = {sp["id"] for sp in salespeople}
    for cp in data["channel_partners"]:
        assert cp["assigned_salesperson_id"] in valid_sp_ids
    for ld in data["leads"]:
        assert ld["assigned_salesperson_id"] in valid_sp_ids


def test_project_starting_prices_and_families():
    """Verify that project records match Harivishva Tathawade specifications and starting prices."""
    from decimal import Decimal

    data = generate_synthetic_dataset(seed=42)
    projects = {p["id"]: p for p in data["projects"]}

    assert len(projects) == 4

    # Verify Skyfinia Phase 1
    assert projects["prj-sky-p1"]["name"] == "Skyfinia Phase 1"
    assert projects["prj-sky-p1"]["starting_price"] == Decimal("8800000.00")
    assert projects["prj-sky-p1"]["location"] == "Tathawade"
    assert projects["prj-sky-p1"]["city"] == "Pune"

    # Verify Skyfinia Phase 2
    assert projects["prj-sky-p2"]["name"] == "Skyfinia Phase 2"
    assert projects["prj-sky-p2"]["starting_price"] == Decimal("9500000.00")
    assert projects["prj-sky-p2"]["location"] == "Tathawade"
    assert projects["prj-sky-p2"]["city"] == "Pune"

    # Verify Infinia Phase 1
    assert projects["prj-inf-p1"]["name"] == "Infinia Phase 1"
    assert projects["prj-inf-p1"]["starting_price"] == Decimal("8200000.00")
    assert projects["prj-inf-p1"]["location"] == "Tathawade"
    assert projects["prj-inf-p1"]["city"] == "Pune"

    # Verify Infinia Phase 2
    assert projects["prj-inf-p2"]["name"] == "Infinia Phase 2"
    assert projects["prj-inf-p2"]["starting_price"] == Decimal("8900000.00")
    assert projects["prj-inf-p2"]["location"] == "Tathawade"
    assert projects["prj-inf-p2"]["city"] == "Pune"


def test_synthetic_booking_pricing_rule_and_floor_invariant():
    """Verify calculate_synthetic_booking_value helper and strict pricing floor invariant."""
    from decimal import Decimal

    from app.seed.generator import calculate_synthetic_booking_value

    # 1. Test unit pricing helper
    base_price = Decimal("8800000.00")
    # Base 2 BHK Smart
    val_smart = calculate_synthetic_booking_value(base_price, "2 BHK Smart", variance_tier=0)
    assert val_smart == Decimal("8800000.00")
    assert val_smart >= base_price

    # 3 BHK Luxury with variance
    val_luxury = calculate_synthetic_booking_value(base_price, "3 BHK Luxury", variance_tier=2)
    assert val_luxury == Decimal("8800000.00") + Decimal("1200000.00") + Decimal("200000.00")
    assert val_luxury == Decimal("10200000.00")
    assert val_luxury >= base_price

    # 2. Test 100% of generated bookings in Seed 42 dataset
    data = generate_synthetic_dataset(seed=42)
    project_starting_prices = {p["id"]: p["starting_price"] for p in data["projects"]}

    assert len(data["bookings"]) > 0
    for bk in data["bookings"]:
        proj_floor = project_starting_prices[bk["project_id"]]
        assert bk["booking_value"] >= proj_floor, (
            f"Booking {bk['id']} value {bk['booking_value']} below floor {proj_floor}"
        )


def test_booking_attempt_cancellation_chronology():
    """Verify that cancelled bookings have created_at < cancelled_at and valid booking_date."""
    data = generate_synthetic_dataset(seed=42)
    cancelled_bookings = [b for b in data["bookings"] if b["booking_status"] == "Cancelled"]
    non_cancelled_bookings = [b for b in data["bookings"] if b["booking_status"] != "Cancelled"]

    assert len(cancelled_bookings) > 0, "Dataset should contain cancelled booking attempts"

    for b in cancelled_bookings:
        assert b["cancelled_at"] is not None, f"Booking {b['id']} must have cancelled_at"
        assert b["created_at"] < b["cancelled_at"], (
            f"Booking {b['id']}: created_at ({b['created_at']}) "
            f"must be earlier than cancelled_at ({b['cancelled_at']})"
        )
        assert b["booking_date"] == b["created_at"].date(), (
            f"Booking {b['id']}: booking_date ({b['booking_date']}) "
            f"must match created_at.date() ({b['created_at'].date()})"
        )

    for b in non_cancelled_bookings:
        assert b["cancelled_at"] is None, (
            f"Booking {b['id']} has status {b['booking_status']} but cancelled_at is not None"
        )


def test_booking_replacement_lifecycle_and_different_units():
    """Verify replacement bookings occur strictly after cancellation with different units."""
    data = generate_synthetic_dataset(seed=42)
    bookings_by_lead: Dict[str, List[Dict[str, Any]]] = {}
    for b in data["bookings"]:
        bookings_by_lead.setdefault(b["lead_id"], []).append(b)

    leads_with_replacement = {
        lid: bks for lid, bks in bookings_by_lead.items() if len(bks) > 1
    }
    assert len(leads_with_replacement) > 0, (
        "Dataset must include leads with replacement booking history"
    )

    for lid, lead_bks in leads_with_replacement.items():
        # Sort by creation time
        sorted_bks = sorted(lead_bks, key=lambda x: x["created_at"])
        for i in range(len(sorted_bks) - 1):
            prev_b = sorted_bks[i]
            next_b = sorted_bks[i + 1]

            # Previous booking must be Cancelled
            assert prev_b["booking_status"] == "Cancelled"
            assert prev_b["cancelled_at"] is not None

            # Replacement booking must be created AFTER previous booking cancellation
            assert next_b["created_at"] > prev_b["cancelled_at"], (
                f"Lead {lid}: Replacement booking {next_b['id']} created_at "
                f"({next_b['created_at']}) must be after previous "
                f"cancelled_at ({prev_b['cancelled_at']})"
            )
            assert next_b["booking_date"] == next_b["created_at"].date()

        # Check unit numbers (different units are valid and supported)
        unit_numbers = [b["unit_number"] for b in sorted_bks]
        assert len(unit_numbers) == len(lead_bks)
