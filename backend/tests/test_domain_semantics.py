"""Unit tests for Phase 2A Domain Semantics and KPI Calculation Corrections.

Test Coverage:
1. Lead remains historically qualified after status becomes 'Lost' (`qualified_at IS NOT NULL`).
2. Scheduled vs. completed visit rate calculation (`completed / scheduled * 100`).
3. Qualified-lead-to-visit rate calculation (`unique_visited / qualified * 100`).
4. Visit-to-booking rate calculation (`confirmed_from_visited / unique_visited * 100`).
5. Direct bookings without visits do NOT affect Visit -> Booking Rate (e.g. 30/100 = 30%, not 35%).
6. Active vs Terminal booking status invariant:
   - Cancelled + Initiated = valid
   - Cancelled + Confirmed = valid
   - Completed + Initiated = valid
   - Initiated + Confirmed = invalid
   - Confirmed + Confirmed = invalid
   - Completed + Completed = valid under active booking invariant
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
    """Tests for distinct visit completion, qualified-to-visit, and visit-to-booking rates."""

    def test_scheduled_vs_completed_visit_rate(self) -> None:
        """Visit Completion Rate = Completed Visits / Scheduled Visits * 100.

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
        """Qualified Lead -> Visit Rate.

        Formula: Unique Qualified Leads with >=1 Visit / Qualified Leads * 100.
        1,377 unique visited leads / 2,840 qualified leads = 48.49%.
        """
        unique_visited_leads = 1377
        qualified_leads = 2840
        rate = calculate_qualified_lead_to_visit_rate(unique_visited_leads, qualified_leads)
        assert rate == 48.49

    def test_qualified_lead_to_visit_rate_zero_denominator(self) -> None:
        """Gracefully handle 0 qualified leads."""
        assert calculate_qualified_lead_to_visit_rate(0, 0) == 0.0

    def test_visit_to_booking_rate(self) -> None:
        """Site Visit -> Booking Rate.

        Formula: Confirmed Bookings from Visited Leads / Unique Visited Leads * 100.
        446 confirmed bookings / 1,377 unique visited leads = 32.39%.
        """
        confirmed_bookings_from_visited = 446
        unique_visited_leads = 1377
        rate = calculate_visit_to_booking_rate(
            confirmed_bookings_from_visited, unique_visited_leads
        )
        assert rate == 32.39

    def test_direct_bookings_do_not_affect_visit_to_booking_rate(self) -> None:
        """Proves direct bookings without site visits do NOT inflate Visit -> Booking Rate.

        Example:
        - 100 unique leads with completed visits
        - 30 confirmed bookings from visited leads
        - 5 direct confirmed bookings without visits (Total Confirmed Bookings = 35)

        Expected Visit -> Booking Rate = 30 / 100 = 30.0% (NOT 35 / 100 = 35.0%).
        """
        unique_visited_leads = 100
        confirmed_from_visited_leads = 30
        direct_confirmed_bookings = 5
        total_confirmed_bookings = confirmed_from_visited_leads + direct_confirmed_bookings

        # Correct metric computation using visited cohort
        visit_booking_rate = calculate_visit_to_booking_rate(
            confirmed_from_visited_leads, unique_visited_leads
        )
        assert visit_booking_rate == 30.0

        # Demonstrating incorrect naive calculation would have yielded 35.0%
        naive_rate = (total_confirmed_bookings / unique_visited_leads) * 100.0
        assert naive_rate == 35.0
        assert visit_booking_rate != naive_rate

    def test_visit_to_booking_rate_zero_denominator(self) -> None:
        """Gracefully handle 0 visited leads."""
        assert calculate_visit_to_booking_rate(0, 0) == 0.0

    def test_overall_lead_to_booking_rate(self) -> None:
        """Overall Funnel Conversion: 446 confirmed bookings / 3,860 valid leads = 11.55%."""
        rate = calculate_overall_lead_to_booking_rate(446, 3860)
        assert rate == 11.55
        assert calculate_overall_lead_to_booking_rate(0, 0) == 0.0


class TestBookingActiveStatusSemantics:
    """Tests for active vs terminal status invariant and multi-record lead booking history."""

    def test_cancelled_plus_initiated_is_valid(self) -> None:
        """Case 1: Cancelled + Initiated = valid (1 active booking)."""
        bookings = [
            {"id": "bk-1", "lead_id": "ld-1", "booking_status": "Cancelled"},
            {"id": "bk-2", "lead_id": "ld-1", "booking_status": "Initiated"},
        ]
        is_valid, err = validate_lead_booking_records(bookings)
        assert is_valid is True
        assert err is None

    def test_cancelled_plus_confirmed_is_valid(self) -> None:
        """Case 2: Cancelled + Confirmed = valid (1 active booking)."""
        bookings = [
            {"id": "bk-1", "lead_id": "ld-1", "booking_status": "Cancelled"},
            {"id": "bk-2", "lead_id": "ld-1", "booking_status": "Confirmed"},
        ]
        is_valid, err = validate_lead_booking_records(bookings)
        assert is_valid is True
        assert err is None

    def test_completed_plus_initiated_is_valid(self) -> None:
        """Case 3: Completed + Initiated = valid under active booking rule

        (Completed is terminal; Initiated is active, total active = 1).
        """
        bookings = [
            {"id": "bk-1", "lead_id": "ld-1", "booking_status": "Completed"},
            {"id": "bk-2", "lead_id": "ld-1", "booking_status": "Initiated"},
        ]
        is_valid, err = validate_lead_booking_records(bookings)
        assert is_valid is True
        assert err is None

    def test_initiated_plus_confirmed_is_invalid(self) -> None:
        """Case 4: Initiated + Confirmed = invalid (2 concurrent active bookings)."""
        bookings = [
            {"id": "bk-1", "lead_id": "ld-1", "booking_status": "Initiated"},
            {"id": "bk-2", "lead_id": "ld-1", "booking_status": "Confirmed"},
        ]
        is_valid, err = validate_lead_booking_records(bookings)
        assert is_valid is False
        assert err is not None
        assert "At most 1 active booking is allowed" in err

    def test_confirmed_plus_confirmed_is_invalid(self) -> None:
        """Case 5: Confirmed + Confirmed = invalid (2 concurrent active bookings)."""
        bookings = [
            {"id": "bk-1", "lead_id": "ld-1", "booking_status": "Confirmed"},
            {"id": "bk-2", "lead_id": "ld-1", "booking_status": "Confirmed"},
        ]
        is_valid, err = validate_lead_booking_records(bookings)
        assert is_valid is False
        assert err is not None
        assert "At most 1 active booking is allowed" in err

    def test_completed_plus_completed_is_valid_under_active_invariant(self) -> None:
        """Case 6: Completed + Completed should NOT be rejected by active booking invariant

        (Both are terminal records, 0 active bookings).
        """
        bookings = [
            {"id": "bk-1", "lead_id": "ld-1", "booking_status": "Completed"},
            {"id": "bk-2", "lead_id": "ld-1", "booking_status": "Completed"},
        ]
        is_valid, err = validate_lead_booking_records(bookings)
        assert is_valid is True
        assert err is None


class TestCommissionAssumptionDisclaimer:
    """Test: Verify commission helper flags 2.0% as synthetic demo assumption."""

    def test_commission_calculation_and_disclaimer_flag(self) -> None:
        result = calculate_synthetic_demo_commission(12500000.0, 2.0)
        assert result["commission_rate_pct"] == 2.0
        assert result["commission_amount"] == 250000.0
        assert result["is_synthetic_assumption"] is True

    def test_commission_calculation_zero_or_negative(self) -> None:
        result = calculate_synthetic_demo_commission(0.0, 2.0)
        assert result["commission_amount"] == 0.0
        assert result["is_synthetic_assumption"] is True
