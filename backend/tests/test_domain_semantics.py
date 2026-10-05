"""Unit tests for Phase 2A Domain Semantics and KPI Calculation Corrections.

Test Coverage:
1. Lead remains historically qualified after status becomes 'Lost' (`qualified_at IS NOT NULL`).
2. Scheduled vs. completed visit rate calculation (`completed / scheduled * 100`).
3. Qualified-lead-to-visit rate calculation (`unique_visited / qualified * 100`).
4. Visit-to-booking rate calculation (`confirmed_bookings / unique_visited * 100`).
5. Cancelled booking followed by confirmed booking (valid multi-record history for a single lead).
6. Validation rule enforcing at most one active/confirmed booking per lead.
7. Commission assumption disclaimer validation.
"""

from __future__ import annotations

from backend.app.core.domain_semantics import (
    calculate_overall_lead_to_booking_rate,
    calculate_qualified_lead_to_visit_rate,
    calculate_synthetic_demo_commission,
    calculate_visit_completion_rate,
    calculate_visit_to_booking_rate,
    is_lead_historically_qualified,
    validate_lead_booking_records,
)


class TestLeadQualificationMilestone:
    """Test 1: Lead remains historically qualified after status becomes Lost."""

    def test_lead_remains_historically_qualified_after_status_becomes_lost(self) -> None:
        """A lead moving New -> Qualified -> Site Visit -> Lost retains qualified_at timestamp

        and remains in historical qualified lead counts.
        """
        # Lead at Lost stage but with historical qualified_at timestamp
        lost_lead = {
            "id": "ld-101",
            "lead_code": "LD-2026-0101",
            "customer_name": "Rohan Gupta",
            "status": "Lost",
            "lost_reason": "Budget Mismatch",
            "created_at": "2026-03-01T10:00:00Z",
            "qualified_at": "2026-03-02T14:30:00Z",
            "lost_at": "2026-03-15T18:00:00Z",
        }
        assert is_lead_historically_qualified(lost_lead) is True

    def test_unqualified_lead_not_historically_qualified(self) -> None:
        """A lead marked Lost before ever qualifying has qualified_at=None."""
        unqualified_lost_lead = {
            "id": "ld-102",
            "lead_code": "LD-2026-0102",
            "customer_name": "Invalid Prospect",
            "status": "Lost",
            "lost_reason": "Invalid Phone",
            "created_at": "2026-03-01T10:00:00Z",
            "qualified_at": None,
            "lost_at": "2026-03-01T11:00:00Z",
        }
        assert is_lead_historically_qualified(unqualified_lost_lead) is False

    def test_active_qualified_leads(self) -> None:
        """Qualified leads at active stages evaluate to True."""
        active_lead = {
            "id": "ld-103",
            "status": "Site Visit Scheduled",
            "qualified_at": "2026-04-10T09:00:00Z",
        }
        assert is_lead_historically_qualified(active_lead) is True

    def test_empty_string_qualified_at_evaluates_false(self) -> None:
        """Empty string qualified_at evaluates to False."""
        empty_lead = {
            "id": "ld-104",
            "status": "New",
            "qualified_at": "  ",
        }
        assert is_lead_historically_qualified(empty_lead) is False


class TestVisitMetricSemantics:
    """Tests 2, 3, 4: Distinct visit completion, qualified-to-visit, and visit-to-booking rates."""

    def test_scheduled_vs_completed_visit_rate(self) -> None:
        """Test 2: Visit Completion Rate = Completed Visits / Scheduled Visits * 100.

        1,872 completed / 2,240 scheduled = 83.57%.
        """
        completed = 1872
        scheduled = 2240
        rate = calculate_visit_completion_rate(completed, scheduled)
        assert rate == 83.57

    def test_scheduled_vs_completed_visit_rate_zero_denominator(self) -> None:
        """Gracefully handle 0 scheduled visits without dividing by zero."""
        assert calculate_visit_completion_rate(0, 0) == 0.0
        assert calculate_visit_completion_rate(5, -1) == 0.0

    def test_qualified_lead_to_visit_rate(self) -> None:
        """Test 3: Qualified Lead -> Visit Rate.

        Formula: Unique Qualified Leads with >=1 Visit / Qualified Leads * 100.
        1,377 unique visited leads / 2,840 qualified leads = 48.49%.
        Disentangles and clarifies the previous 48.5% visit conversion metric.
        """
        unique_visited_leads = 1377
        qualified_leads = 2840
        rate = calculate_qualified_lead_to_visit_rate(unique_visited_leads, qualified_leads)
        assert rate == 48.49

    def test_qualified_lead_to_visit_rate_zero_denominator(self) -> None:
        """Gracefully handle 0 qualified leads."""
        assert calculate_qualified_lead_to_visit_rate(0, 0) == 0.0

    def test_visit_to_booking_rate(self) -> None:
        """Test 4: Site Visit -> Booking Rate.

        Formula: Confirmed Bookings / Unique Leads with >=1 Completed Visit * 100.
        446 confirmed bookings / 1,377 unique visited leads = 32.39%.
        """
        confirmed_bookings = 446
        unique_visited_leads = 1377
        rate = calculate_visit_to_booking_rate(confirmed_bookings, unique_visited_leads)
        assert rate == 32.39

    def test_visit_to_booking_rate_zero_denominator(self) -> None:
        """Gracefully handle 0 visited leads."""
        assert calculate_visit_to_booking_rate(0, 0) == 0.0

    def test_overall_lead_to_booking_rate(self) -> None:
        """Overall Funnel Conversion: 446 confirmed bookings / 3,860 valid leads = 11.55%."""
        rate = calculate_overall_lead_to_booking_rate(446, 3860)
        assert rate == 11.55
        assert calculate_overall_lead_to_booking_rate(0, 0) == 0.0


class TestBookingCardinalityAndLifecycle:
    """Tests 5 & 6: Multi-record booking history and single active booking constraint."""

    def test_cancelled_booking_followed_by_confirmed_booking(self) -> None:
        """Test 5: Lead may have an initial cancelled booking attempt followed by a booking."""
        lead_bookings = [
            {
                "id": "bk-001",
                "booking_reference": "BK-2026-0001",
                "lead_id": "ld-842",
                "unit_number": "Tower A - 402",
                "booking_status": "Cancelled",
                "booking_date": "2026-05-10",
                "booking_value": 11000000.0,
            },
            {
                "id": "bk-002",
                "booking_reference": "BK-2026-0089",
                "lead_id": "ld-842",
                "unit_number": "Tower B - 802",
                "booking_status": "Confirmed",
                "booking_date": "2026-06-15",
                "booking_value": 13500000.0,
            },
        ]
        is_valid, error_msg = validate_lead_booking_records(lead_bookings)
        assert is_valid is True
        assert error_msg is None

    def test_no_more_than_one_active_confirmed_booking_per_lead(self) -> None:
        """Test 6: Reject attempts to assign multiple active bookings to the same lead."""
        multiple_active_bookings = [
            {
                "id": "bk-002",
                "booking_reference": "BK-2026-0089",
                "lead_id": "ld-842",
                "unit_number": "Tower B - 802",
                "booking_status": "Confirmed",
            },
            {
                "id": "bk-003",
                "booking_reference": "BK-2026-0095",
                "lead_id": "ld-842",
                "unit_number": "Tower C - 1204",
                "booking_status": "Initiated",
            },
        ]
        is_valid, error_msg = validate_lead_booking_records(multiple_active_bookings)
        assert is_valid is False
        assert error_msg is not None
        assert "At most 1 active booking is allowed" in error_msg

    def test_multiple_cancelled_bookings_allowed(self) -> None:
        """A lead with 2 cancelled bookings and 0 active bookings is valid."""
        cancelled_bookings = [
            {"id": "bk-001", "lead_id": "ld-842", "booking_status": "Cancelled"},
            {"id": "bk-002", "lead_id": "ld-842", "booking_status": "Cancelled"},
        ]
        is_valid, error_msg = validate_lead_booking_records(cancelled_bookings)
        assert is_valid is True
        assert error_msg is None


class TestCommissionAssumptionDisclaimer:
    """Test 7: Verify commission helper flags 2.0% as synthetic demo assumption."""

    def test_commission_calculation_and_disclaimer_flag(self) -> None:
        result = calculate_synthetic_demo_commission(12500000.0, 2.0)
        assert result["commission_rate_pct"] == 2.0
        assert result["commission_amount"] == 250000.0
        assert result["is_synthetic_assumption"] is True

    def test_commission_calculation_zero_or_negative(self) -> None:
        result = calculate_synthetic_demo_commission(0.0, 2.0)
        assert result["commission_amount"] == 0.0
        assert result["is_synthetic_assumption"] is True
