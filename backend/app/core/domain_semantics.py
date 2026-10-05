"""Domain semantics and KPI calculation helper functions.

Phase 2A Domain Semantics Specification:
- Milestone-based lead qualification (`qualified_at IS NOT NULL`).
- Distinct visit & conversion metrics (Visit Completion Rate,
  Qualified Lead to Visit Rate, Site Visit to Booking Rate).
- Booking cardinality: Lead 1 -> 0..* Booking Records with at most 1 active booking.
- Active booking statuses: Initiated, Confirmed.
- Terminal booking statuses: Completed, Cancelled.
- Commission policy disclaimer: 2.0% base rate is synthetic demo data only.
"""

from __future__ import annotations

from typing import Any

ACTIVE_BOOKING_STATUSES = frozenset({"Initiated", "Confirmed"})
TERMINAL_BOOKING_STATUSES = frozenset({"Completed", "Cancelled"})
DEFAULT_DEMO_COMMISSION_RATE_PCT = 2.0


def is_lead_historically_qualified(lead_data: dict[str, Any]) -> bool:
    """Determine if a lead is historically qualified based on the milestone timestamp.

    Business Rule:
    Qualification is defined by the milestone event `qualified_at IS NOT NULL`.
    A lead that moves `New -> Qualified -> Site Visit -> Lost` retains its historical
    qualification timestamp and remains counted in historical qualified cohorts.
    """
    qualified_at = lead_data.get("qualified_at")
    if qualified_at is None:
        return False
    if isinstance(qualified_at, str) and not qualified_at.strip():
        return False
    return True


def calculate_visit_completion_rate(
    completed_visits: int,
    scheduled_visits: int,
    precision: int = 2,
) -> float:
    """Calculate the Visit Completion Rate: Completed Visits / Scheduled Visits * 100.

    Measures visit execution reliability (e.g. 1,872 completed / 2,240 scheduled = 83.57%).
    """
    if scheduled_visits <= 0:
        return 0.0
    return round((completed_visits / scheduled_visits) * 100.0, precision)


def calculate_qualified_lead_to_visit_rate(
    unique_visited_qualified_leads: int,
    total_qualified_leads: int,
    precision: int = 2,
) -> float:
    """Calculate Qualified Lead -> Visit Rate:
    Unique Qualified Leads with >=1 Visit / Qualified Leads * 100.

    Measures conversion from qualification to property visit attendance
    (e.g. 1,377 unique visited leads / 2,840 qualified leads = 48.49%).
    """
    if total_qualified_leads <= 0:
        return 0.0
    return round((unique_visited_qualified_leads / total_qualified_leads) * 100.0, precision)


def calculate_visit_to_booking_rate(
    confirmed_bookings_from_visited_leads: int,
    unique_visited_leads: int,
    precision: int = 2,
) -> float:
    """Calculate Site Visit -> Booking Rate:
    Confirmed Bookings whose lead has >=1 Completed Site Visit /
    Unique Leads with >=1 Completed Site Visit * 100.

    Ensures direct bookings without site visits do not affect or inflate
    the visit close rate metric.
    """
    if unique_visited_leads <= 0:
        return 0.0
    return round((confirmed_bookings_from_visited_leads / unique_visited_leads) * 100.0, precision)


def calculate_overall_lead_to_booking_rate(
    confirmed_bookings: int,
    total_valid_leads: int,
    precision: int = 2,
) -> float:
    """Calculate Overall Lead -> Booking Rate: Confirmed Bookings / Total Valid Leads * 100.

    Measures end-to-end channel pipeline efficiency
    (e.g. 446 confirmed bookings / 3,860 valid leads = 11.55%).
    """
    if total_valid_leads <= 0:
        return 0.0
    return round((confirmed_bookings / total_valid_leads) * 100.0, precision)


def validate_lead_booking_records(
    bookings: list[dict[str, Any]],
) -> tuple[bool, str | None]:
    """Validate booking records for a lead against active booking rules.

    Business Invariant:
    A lead may not have more than one concurrent active booking
    (status 'Initiated' or 'Confirmed').
    Terminal booking records ('Completed' and 'Cancelled') are historical
    records and do not count as concurrent active bookings.
    """
    active_bookings = [
        b for b in bookings if b.get("booking_status") in ACTIVE_BOOKING_STATUSES
    ]
    if len(active_bookings) > 1:
        statuses = [b.get("booking_status") for b in active_bookings]
        return (
            False,
            (
                f"Lead has {len(active_bookings)} concurrent active bookings "
                f"({statuses}). At most 1 active booking is allowed at any time."
            ),
        )
    return True, None


def calculate_synthetic_demo_commission(
    booking_value: float,
    rate_pct: float = DEFAULT_DEMO_COMMISSION_RATE_PCT,
) -> dict[str, Any]:
    """Compute demo commission amount with explicit synthetic data disclaimer.

    DISCLAIMER:
    The 2.0% base commission assumption is synthetic/demo data only and is NOT
    Harivishva's actual commercial commission policy or partner agreement structure.
    """
    if booking_value <= 0 or rate_pct < 0:
        return {
            "commission_rate_pct": max(0.0, rate_pct),
            "commission_amount": 0.0,
            "is_synthetic_assumption": True,
        }
    amount = round((booking_value * rate_pct) / 100.0, 2)
    return {
        "commission_rate_pct": rate_pct,
        "commission_amount": amount,
        "is_synthetic_assumption": True,
    }
