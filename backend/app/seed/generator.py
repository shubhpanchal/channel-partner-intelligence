"""Deterministic Synthetic Data Generator for Channel Partner Intelligence.

Seed: 42 (Guarantees bit-level reproducibility)
Target Dataset:
- 5 Projects (Inventory dynamically tracked)
- 10 Salespeople (3 Regional Clusters)
- 175 Channel Partners (18 Tier 1 Elite, 45 Tier 2 Growth, 112 Tier 3 Active)
- ~3,800 to 4,200 Leads with milestone qualification (`qualified_at`)
- ~1,800 to 2,200 Site Visits (including multi-visit revisits and cancellations)
- ~400 to 500 Confirmed Bookings (including multi-record histories and direct bookings)
- Partner Activities supporting live feed and active partner calculations
"""

from __future__ import annotations

import random
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.models.entities import (
    Booking,
    ChannelPartner,
    Lead,
    PartnerActivity,
    Project,
    Salesperson,
    SiteVisit,
)
from app.seed.constants import (
    BUDGET_RANGES,
    FIRST_NAMES,
    LAST_NAMES,
    LOST_REASONS,
    PARTNER_PREFIXES,
    PARTNER_SUFFIXES,
    PROJECT_TEMPLATES,
    PUNE_LOCALITIES,
    SALESPEOPLE_TEMPLATES,
    SEED,
)


def generate_synthetic_dataset(seed: int = SEED) -> Dict[str, List[Dict[str, Any]]]:
    """Generate the complete deterministic synthetic dataset as a dictionary of entity records."""
    rng = random.Random(seed)

    # 1. Salespeople (10)
    salespeople = [dict(sp) for sp in SALESPEOPLE_TEMPLATES]

    # 2. Projects (5)
    projects = []
    for pt in PROJECT_TEMPLATES:
        p_dict = dict(pt)
        p_dict.pop("unit_types", None)
        p_dict["available_units"] = p_dict["target_units"]  # Adjusted after bookings
        p_dict["launch_date"] = datetime.strptime(p_dict["launch_date"], "%Y-%m-%d").date()
        projects.append(p_dict)

    # 3. Channel Partners (175 total: 18 Tier 1, 45 Tier 2, 112 Tier 3)
    channel_partners = []
    partner_archetypes: Dict[str, str] = {}

    partner_id_counter = 1001

    # Tier 1: 18 partners
    for i in range(18):
        cp_id = f"cp-{partner_id_counter}"
        partner_code = f"CP-{partner_id_counter}"
        prefix = rng.choice(PARTNER_PREFIXES)
        suffix = rng.choice(PARTNER_SUFFIXES)
        name = f"{prefix} {suffix}"
        contact_person = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        locality = rng.choice(PUNE_LOCALITIES)
        assigned_sp = salespeople[i % len(salespeople)]["id"]

        # Archetype assignment
        if i < 10:
            archetype = "elite_core"
        elif i < 15:
            archetype = "high_volume_moderate_conversion"
        else:
            archetype = "boutique_luxury"
        partner_archetypes[cp_id] = archetype

        channel_partners.append({
            "id": cp_id,
            "partner_code": partner_code,
            "name": name,
            "legal_name": f"{name} Pvt Ltd",
            "contact_person": contact_person,
            "phone": f"+919822{partner_id_counter:06d}"[:13],
            "email": f"contact@{prefix.lower()}{suffix.split()[0].lower()}.in",
            "city": "Pune",
            "location": locality,
            "onboarding_date": date(2024, 1 + (i % 12), 1 + (i % 25)),
            "active": True,
            "tier": "Tier 1",
            "channel_type": "Corporate Agency" if i % 2 == 0 else "Independent Broker",
            "assigned_salesperson_id": assigned_sp,
            "notes": f"Tier 1 key relationship. Archetype: {archetype}.",
        })
        partner_id_counter += 1

    # Tier 2: 45 partners
    for i in range(45):
        cp_id = f"cp-{partner_id_counter}"
        partner_code = f"CP-{partner_id_counter}"
        prefix = rng.choice(PARTNER_PREFIXES)
        suffix = rng.choice(PARTNER_SUFFIXES)
        name = f"{prefix} {suffix}"
        contact_person = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        locality = rng.choice(PUNE_LOCALITIES)
        assigned_sp = salespeople[(18 + i) % len(salespeople)]["id"]

        # Archetype assignment
        if i < 15:
            archetype = "emerging_growth"
        elif i < 30:
            archetype = "moderate_steady"
        elif i < 40:
            archetype = "high_volume_low_conversion"
        else:
            archetype = "declining_at_risk"
        partner_archetypes[cp_id] = archetype

        channel_partners.append({
            "id": cp_id,
            "partner_code": partner_code,
            "name": name,
            "legal_name": f"{name} LLP",
            "contact_person": contact_person,
            "phone": f"+919823{partner_id_counter:06d}"[:13],
            "email": f"info@{prefix.lower()}{suffix.split()[0].lower()}.com",
            "city": "Pune",
            "location": locality,
            "onboarding_date": date(2024, 1 + (i % 12), 1 + (i % 25)),
            "active": True,
            "tier": "Tier 2",
            "channel_type": "Independent Broker" if i % 3 != 0 else "Corporate Agency",
            "assigned_salesperson_id": assigned_sp,
            "notes": f"Tier 2 growth account. Archetype: {archetype}.",
        })
        partner_id_counter += 1

    # Tier 3: 112 partners
    for i in range(112):
        cp_id = f"cp-{partner_id_counter}"
        partner_code = f"CP-{partner_id_counter}"
        prefix = rng.choice(PARTNER_PREFIXES)
        suffix = rng.choice(PARTNER_SUFFIXES)
        name = f"{prefix} {suffix}"
        contact_person = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        locality = rng.choice(PUNE_LOCALITIES)
        assigned_sp = salespeople[(18 + 45 + i) % len(salespeople)]["id"]

        # Archetype assignment
        if i < 80:
            archetype = "broad_active"
        elif i < 100:
            archetype = "infrequent_sporadic"
        else:
            archetype = "dormant"
        partner_archetypes[cp_id] = archetype

        channel_partners.append({
            "id": cp_id,
            "partner_code": partner_code,
            "name": name,
            "legal_name": f"{name} Enterprises",
            "contact_person": contact_person,
            "phone": f"+919824{partner_id_counter:06d}"[:13],
            "email": f"sales@{prefix.lower()}{suffix.split()[0].lower()}.in",
            "city": "Pune",
            "location": locality,
            "onboarding_date": date(2024 if i < 60 else 2025, 1 + (i % 12), 1 + (i % 25)),
            "active": False if archetype == "dormant" and i >= 106 else True,
            "tier": "Tier 3",
            "channel_type": "Independent Broker" if i % 4 != 0 else "Digital Channel Partner",
            "assigned_salesperson_id": assigned_sp,
            "notes": f"Tier 3 partner. Archetype: {archetype}.",
        })
        partner_id_counter += 1

    # 4. Leads, Site Visits, Bookings, and Partner Activities
    leads = []
    site_visits = []
    bookings = []
    partner_activities = []

    lead_id_counter = 1
    visit_id_counter = 1
    booking_id_counter = 1
    activity_id_counter = 1

    # Historical timeline: 2026-01-01 to 2026-12-31
    base_start_date = datetime(2026, 1, 1, 9, 0, 0)
    max_boundary_dt = datetime(2026, 12, 31, 23, 59, 59)
    days_in_year = 365

    def advance_dt(
        current_dt: datetime,
        min_seconds: int,
        max_seconds: int,
    ) -> datetime:
        """Safely advance datetime ensuring it never exceeds max_boundary_dt."""
        if current_dt >= max_boundary_dt:
            return max_boundary_dt
        rem_seconds = int((max_boundary_dt - current_dt).total_seconds())
        if rem_seconds <= 60:
            return max_boundary_dt
        desired_seconds = rng.randint(min_seconds, max_seconds)
        if desired_seconds >= rem_seconds:
            scaled = int(rem_seconds * rng.uniform(0.35, 0.85))
            actual_seconds = max(60 if rem_seconds > 120 else 1, min(scaled, rem_seconds))
        else:
            actual_seconds = desired_seconds
        next_dt = current_dt + timedelta(seconds=actual_seconds)
        if next_dt > max_boundary_dt:
            next_dt = max_boundary_dt
        return next_dt

    # Project lookup for configuration & pricing
    project_lookup = {p["id"]: p for p in projects}
    project_templates_lookup = {p["id"]: p for p in PROJECT_TEMPLATES}

    # Generate leads by partner according to archetype
    for partner in channel_partners:
        cp_id = partner["id"]
        archetype = partner_archetypes[cp_id]
        assigned_sp = partner["assigned_salesperson_id"]

        # Number of leads per partner based on archetype
        if archetype == "elite_core":
            num_leads = rng.randint(46, 54)
        elif archetype == "high_volume_moderate_conversion":
            num_leads = rng.randint(40, 48)
        elif archetype == "boutique_luxury":
            num_leads = rng.randint(20, 26)
        elif archetype == "emerging_growth":
            num_leads = rng.randint(24, 32)
        elif archetype == "moderate_steady":
            num_leads = rng.randint(18, 24)
        elif archetype == "high_volume_low_conversion":
            num_leads = rng.randint(26, 34)
        elif archetype == "declining_at_risk":
            num_leads = rng.randint(10, 16)
        elif archetype == "broad_active":
            num_leads = rng.randint(22, 28)
        elif archetype == "infrequent_sporadic":
            num_leads = rng.randint(3, 7)
        else:  # dormant
            num_leads = 0 if not partner["active"] else rng.randint(0, 1)

        for _ in range(num_leads):
            # Lead creation date
            if archetype == "declining_at_risk":
                # Only active in first 180 days (H1)
                day_offset = rng.randint(0, 175)
            elif archetype == "emerging_growth":
                # Skewed toward second half
                day_offset = rng.randint(90, days_in_year - 1)
            elif archetype == "dormant":
                # Only at start of year
                day_offset = rng.randint(0, 45)
            else:
                day_offset = rng.randint(0, days_in_year - 1)

            created_at = base_start_date + timedelta(
                days=day_offset,
                hours=rng.randint(0, 8),
                minutes=rng.randint(0, 59),
            )
            if created_at > max_boundary_dt - timedelta(hours=6):
                created_at = max_boundary_dt - timedelta(
                    hours=rng.randint(6, 18), minutes=rng.randint(0, 59)
                )

            # Assign project
            if archetype == "boutique_luxury":
                # Prefers Luxury Solaris or Zenith Commercial
                project_id = rng.choice(["prj-101", "prj-103"])
            else:
                project_id = rng.choice(list(project_lookup.keys()))

            proj_tmpl = project_templates_lookup[project_id]
            unit_types = proj_tmpl.get("unit_types", ["2 BHK", "3 BHK"])

            lead_id = f"ld-{lead_id_counter:06d}"
            lead_code = f"LD-2026-{lead_id_counter:06d}"
            customer_name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
            customer_phone = f"+9198{rng.randint(10000000, 99999999)}"
            customer_email = f"{customer_name.lower().replace(' ', '.')}@example.com"
            budget_range = rng.choice(BUDGET_RANGES)
            req_type = rng.choice(unit_types)

            # Determine lifecycle path
            # Milestone qualification probability
            if archetype in ("elite_core", "boutique_luxury"):
                is_invalid = rng.random() < 0.01
                qualifies = not is_invalid and rng.random() < 0.88
            elif archetype == "high_volume_low_conversion":
                is_invalid = rng.random() < 0.05
                qualifies = not is_invalid and rng.random() < 0.55
            elif archetype == "dormant":
                is_invalid = False
                qualifies = False
            else:
                is_invalid = rng.random() < 0.03
                qualifies = not is_invalid and rng.random() < 0.74

            if is_invalid:
                status = "Invalid"
                qualified_at = None
                converted_at = None
                lost_at = None
                lost_reason = None
            elif not qualifies:
                status_choices = ["New", "Contacted", "Lost"]
                status = rng.choice(status_choices)
                qualified_at = None
                converted_at = None
                if status == "Lost":
                    lost_at = advance_dt(created_at, 86400 * 1, 86400 * 10)
                    lost_reason = rng.choice(["Budget Mismatch", "Location Unsuitable"])
                else:
                    lost_at = None
                    lost_reason = None
            else:
                # Lead is Qualified!
                qualified_at = advance_dt(created_at, 3600 * 1, 3600 * 36)
                # Next stage decisions
                # Check for direct booking without site visit (~0.8% of qualified leads)
                is_direct_booking = rng.random() < 0.008

                if is_direct_booking:
                    status = "Converted"
                    converted_at = advance_dt(qualified_at, 86400 * 2, 86400 * 12)
                    lost_at = None
                    lost_reason = None
                else:
                    # Will this qualified lead schedule a site visit?
                    visit_prob = 0.74 if archetype in ("elite_core", "boutique_luxury") else 0.58
                    schedules_visit = rng.random() < visit_prob

                    if not schedules_visit:
                        # Stays qualified or marked lost
                        if rng.random() < 0.60:
                            status = "Qualified"
                            converted_at = None
                            lost_at = None
                            lost_reason = None
                        else:
                            status = "Lost"
                            converted_at = None
                            lost_at = advance_dt(qualified_at, 86400 * 5, 86400 * 25)
                            lost_reason = rng.choice(LOST_REASONS)
                    else:
                        status = "Site Visit Scheduled"
                        converted_at = None
                        lost_at = None
                        lost_reason = None

            lead_record = {
                "id": lead_id,
                "lead_code": lead_code,
                "customer_name": customer_name,
                "customer_phone": customer_phone,
                "customer_email": customer_email,
                "project_id": project_id,
                "channel_partner_id": cp_id,
                "assigned_salesperson_id": assigned_sp,
                "status": status,
                "budget_range": budget_range,
                "requirement_type": req_type,
                "lost_reason": lost_reason,
                "created_at": created_at,
                "qualified_at": qualified_at,
                "converted_at": converted_at,
                "lost_at": lost_at,
                "notes": f"Referred by {partner['name']}.",
            }
            leads.append(lead_record)

            # Partner activity for lead submission
            lead_sub_desc = (
                f"{partner['name']} submitted lead {customer_name} for {proj_tmpl['name']}."
            )
            partner_activities.append({
                "id": f"act-{activity_id_counter}",
                "channel_partner_id": cp_id,
                "activity_type": "lead_submitted",
                "entity_type": "lead",
                "entity_id": lead_id,
                "description": lead_sub_desc,
                "metadata_json": None,
                "logged_at": created_at,
            })
            activity_id_counter += 1

            # Handle Direct Booking Creation
            if is_invalid:
                lead_id_counter += 1
                continue

            if qualifies and is_direct_booking:
                # Direct booking record
                booking_id = f"bk-{booking_id_counter:06d}"
                booking_ref = f"BK-2026-{booking_id_counter:06d}"
                booking_date = converted_at.date()
                booking_val = proj_tmpl["starting_price"] + Decimal(str(rng.randint(0, 5) * 500000))
                token_amt = Decimal("200000.00")
                comm_pct = Decimal("2.0")
                comm_amt = Decimal(str(round((float(booking_val) * 2.0) / 100.0, 2)))

                bookings.append({
                    "id": booking_id,
                    "booking_reference": booking_ref,
                    "lead_id": lead_id,
                    "project_id": project_id,
                    "channel_partner_id": cp_id,
                    "salesperson_id": assigned_sp,
                    "unit_number": f"Unit {rng.randint(101, 1805)}",
                    "unit_type": req_type,
                    "booking_date": booking_date,
                    "booking_status": "Confirmed",
                    "booking_value": booking_val,
                    "token_amount": token_amt,
                    "commission_rate_pct": comm_pct,
                    "commission_amount": comm_amt,
                    "is_synthetic_commission": True,
                    "created_at": converted_at,
                })
                booking_id_counter += 1

                partner_activities.append({
                    "id": f"act-{activity_id_counter}",
                    "channel_partner_id": cp_id,
                    "activity_type": "booking_confirmed",
                    "entity_type": "booking",
                    "entity_id": booking_id,
                    "description": f"Direct booking confirmed for {customer_name} ({booking_ref}).",
                    "metadata_json": None,
                    "logged_at": converted_at,
                })
                activity_id_counter += 1
                lead_id_counter += 1
                continue

            # Handle Site Visit Lifecycle for scheduled visits
            if status == "Site Visit Scheduled":
                raw_sched = advance_dt(qualified_at, 86400 * 1, 86400 * 10)
                target_hour = rng.randint(10, 16)
                target_min = rng.randint(0, 59)
                candidate_sched = raw_sched.replace(hour=target_hour, minute=target_min, second=0)
                if candidate_sched <= qualified_at:
                    candidate_sched = advance_dt(qualified_at, 3600 * 2, 3600 * 6)
                if candidate_sched > max_boundary_dt:
                    candidate_sched = max_boundary_dt - timedelta(minutes=rng.randint(30, 180))
                visit_sched_at = candidate_sched

                # Visit execution outcome probability
                visit_status_roll = rng.random()
                if visit_status_roll < 0.835:
                    sv_status = "Completed"
                    visited_at = advance_dt(visit_sched_at, 300, 1800)
                    outcome_roll = rng.random()
                    if outcome_roll < 0.40:
                        outcome = "Positive / Intent to Book"
                    elif outcome_roll < 0.70:
                        outcome = "Revisit Planned"
                    elif outcome_roll < 0.88:
                        outcome = "Neutral / Exploring"
                    else:
                        outcome = "Not Interested"
                elif visit_status_roll < 0.93:
                    sv_status = "Cancelled"
                    visited_at = None
                    outcome = None
                else:
                    sv_status = "No Show"
                    visited_at = None
                    outcome = None

                visit_id = f"sv-{visit_id_counter:06d}"
                visit_code = f"SV-2026-{visit_id_counter:06d}"
                visit_created_at = max(
                    qualified_at,
                    visit_sched_at - timedelta(hours=rng.randint(1, 12)),
                )

                site_visits.append({
                    "id": visit_id,
                    "visit_code": visit_code,
                    "lead_id": lead_id,
                    "project_id": project_id,
                    "channel_partner_id": cp_id,
                    "salesperson_id": assigned_sp,
                    "scheduled_at": visit_sched_at,
                    "visited_at": visited_at,
                    "status": sv_status,
                    "verification_type": rng.choice([
                        "Digital Token OTP", "Physical Entry Log", "Sales Center QR"
                    ]),
                    "outcome": outcome,
                    "feedback_notes": f"Site visit for {customer_name} at {proj_tmpl['name']}.",
                    "created_at": visit_created_at,
                })
                visit_id_counter += 1

                sv_act_type = (
                    "site_visit_completed" if sv_status == "Completed" else "site_visit_scheduled"
                )
                partner_activities.append({
                    "id": f"act-{activity_id_counter}",
                    "channel_partner_id": cp_id,
                    "activity_type": sv_act_type,
                    "entity_type": "site_visit",
                    "entity_id": visit_id,
                    "description": f"Site visit {sv_status.lower()} for {customer_name}.",
                    "metadata_json": None,
                    "logged_at": visited_at or visit_sched_at,
                })
                activity_id_counter += 1

                # If completed, check for multiple visits (re-visit)
                if sv_status == "Completed":
                    lead_record["status"] = "Site Visit Completed"
                    last_visited_dt = visited_at

                    # ~20% chance of a second visit
                    if rng.random() < 0.20:
                        revisit_sched_raw = advance_dt(visited_at, 86400 * 3, 86400 * 10)
                        if revisit_sched_raw <= max_boundary_dt:
                            revisit_sched = revisit_sched_raw
                        else:
                            revisit_sched = max_boundary_dt - timedelta(
                                minutes=rng.randint(30, 90)
                            )
                        if revisit_sched <= visited_at:
                            revisit_sched = advance_dt(visited_at, 1800, 7200)
                        revisit_visited = advance_dt(revisit_sched, 600, 1500)
                        revisit_created_at = max(visited_at, revisit_sched - timedelta(hours=6))

                        revisit_id = f"sv-{visit_id_counter:06d}"
                        revisit_code = f"SV-2026-{visit_id_counter:06d}"
                        site_visits.append({
                            "id": revisit_id,
                            "visit_code": revisit_code,
                            "lead_id": lead_id,
                            "project_id": project_id,
                            "channel_partner_id": cp_id,
                            "salesperson_id": assigned_sp,
                            "scheduled_at": revisit_sched,
                            "visited_at": revisit_visited,
                            "status": "Completed",
                            "verification_type": "Sales Center QR",
                            "outcome": "Positive / Intent to Book",
                            "feedback_notes": f"Revisit for {customer_name}.",
                            "created_at": revisit_created_at,
                        })
                        visit_id_counter += 1
                        last_visited_dt = revisit_visited

                    # Conversion from completed visit to Booking
                    is_elite = archetype in ("elite_core", "boutique_luxury")
                    booking_close_prob = 0.52 if is_elite else 0.42
                    positive_outcome = outcome in ("Positive / Intent to Book", "Revisit Planned")
                    books_unit = positive_outcome and (rng.random() < booking_close_prob)

                    if books_unit:
                        booking_date_dt = advance_dt(last_visited_dt, 86400 * 2, 86400 * 14)

                        # Earlier cancelled booking attempt (~6% of booking leads)
                        if rng.random() < 0.06:
                            # 1st Booking: Cancelled
                            bk_cancelled_id = f"bk-{booking_id_counter:06d}"
                            bk_cancelled_ref = f"BK-2026-{booking_id_counter:06d}"
                            val_cancelled = proj_tmpl["starting_price"]
                            comm_canc = Decimal(
                                str(round((float(val_cancelled) * 2.0) / 100.0, 2))
                            )
                            bk_cancelled_dt = max(
                                last_visited_dt,
                                booking_date_dt - timedelta(days=rng.randint(1, 5)),
                            )
                            if bk_cancelled_dt >= booking_date_dt:
                                bk_cancelled_dt = max(
                                    last_visited_dt,
                                    booking_date_dt - timedelta(hours=2),
                                )

                            bookings.append({
                                "id": bk_cancelled_id,
                                "booking_reference": bk_cancelled_ref,
                                "lead_id": lead_id,
                                "project_id": project_id,
                                "channel_partner_id": cp_id,
                                "salesperson_id": assigned_sp,
                                "unit_number": f"Unit {rng.randint(101, 805)}",
                                "unit_type": req_type,
                                "booking_date": bk_cancelled_dt.date(),
                                "booking_status": "Cancelled",
                                "booking_value": val_cancelled,
                                "token_amount": Decimal("100000.00"),
                                "commission_rate_pct": Decimal("2.0"),
                                "commission_amount": comm_canc,
                                "is_synthetic_commission": True,
                                "created_at": bk_cancelled_dt,
                            })
                            booking_id_counter += 1

                        # Active / Confirmed / Completed Booking
                        booking_id = f"bk-{booking_id_counter:06d}"
                        booking_ref = f"BK-2026-{booking_id_counter:06d}"
                        val_add = Decimal(str(rng.randint(0, 6) * 400000))
                        booking_val = proj_tmpl["starting_price"] + val_add
                        token_amt = Decimal("250000.00")
                        comm_pct = Decimal("2.0")
                        comm_amt = Decimal(str(round((float(booking_val) * 2.0) / 100.0, 2)))

                        # 90% Confirmed, 7% Completed, 3% Initiated
                        status_roll = rng.random()
                        if status_roll < 0.90:
                            b_status = "Confirmed"
                        elif status_roll < 0.97:
                            b_status = "Completed"
                        else:
                            b_status = "Initiated"

                        # Map lead status according to booking lifecycle semantics
                        if b_status == "Initiated":
                            lead_record["status"] = "Booking Initiated"
                            lead_record["converted_at"] = None
                        else:  # "Confirmed" or "Completed"
                            lead_record["status"] = "Converted"
                            lead_record["converted_at"] = booking_date_dt

                        bookings.append({
                            "id": booking_id,
                            "booking_reference": booking_ref,
                            "lead_id": lead_id,
                            "project_id": project_id,
                            "channel_partner_id": cp_id,
                            "salesperson_id": assigned_sp,
                            "unit_number": f"Unit {rng.randint(201, 1905)}",
                            "unit_type": req_type,
                            "booking_date": booking_date_dt.date(),
                            "booking_status": b_status,
                            "booking_value": booking_val,
                            "token_amount": token_amt,
                            "commission_rate_pct": comm_pct,
                            "commission_amount": comm_amt,
                            "is_synthetic_commission": True,
                            "created_at": booking_date_dt,
                        })
                        booking_id_counter += 1

                        is_conf = b_status in ("Confirmed", "Completed")
                        b_act_type = "booking_confirmed" if is_conf else "booking_initiated"
                        partner_activities.append({
                            "id": f"act-{activity_id_counter}",
                            "channel_partner_id": cp_id,
                            "activity_type": b_act_type,
                            "entity_type": "booking",
                            "entity_id": booking_id,
                            "description": f"Booking {b_status.lower()} for {customer_name}.",
                            "metadata_json": None,
                            "logged_at": booking_date_dt,
                        })
                        activity_id_counter += 1
                    else:
                        # Lead did not book: either stays Site Visit Completed or moves to Lost
                        if rng.random() < 0.50:
                            lead_record["status"] = "Lost"
                            lead_record["lost_at"] = advance_dt(visited_at, 86400 * 7, 86400 * 30)
                            lead_record["lost_reason"] = rng.choice(LOST_REASONS)
                else:
                    # Visit was cancelled or no show
                    if rng.random() < 0.65:
                        lead_record["status"] = "Lost"
                        lead_record["lost_at"] = advance_dt(visit_sched_at, 86400 * 2, 86400 * 10)
                        lead_record["lost_reason"] = "Follow-up Expired"

            lead_id_counter += 1

    # Adjust project available units according to confirmed / completed bookings
    confirmed_counts_by_project: Dict[str, int] = {}
    for b in bookings:
        if b["booking_status"] in ("Confirmed", "Completed"):
            pid = b["project_id"]
            confirmed_counts_by_project[pid] = confirmed_counts_by_project.get(pid, 0) + 1

    for p in projects:
        sold = confirmed_counts_by_project.get(p["id"], 0)
        p["available_units"] = max(0, p["target_units"] - sold)

    # Return complete dataset dictionary
    return {
        "salespeople": salespeople,
        "projects": projects,
        "channel_partners": channel_partners,
        "leads": leads,
        "site_visits": site_visits,
        "bookings": bookings,
        "partner_activities": partner_activities,
    }


def seed_database(
    session: Session,
    dataset: Dict[str, List[Dict[str, Any]]] | None = None,
    seed: int = SEED,
) -> Dict[str, int]:
    """Seed the database with deterministic synthetic data."""
    if dataset is None:
        dataset = generate_synthetic_dataset(seed=seed)

    # Insert Salespeople
    for sp_data in dataset["salespeople"]:
        session.merge(Salesperson(**sp_data))

    # Insert Projects
    for prj_data in dataset["projects"]:
        session.merge(Project(**prj_data))

    # Insert Channel Partners
    for cp_data in dataset["channel_partners"]:
        session.merge(ChannelPartner(**cp_data))

    # Insert Leads
    for ld_data in dataset["leads"]:
        session.merge(Lead(**ld_data))

    # Insert Site Visits
    for sv_data in dataset["site_visits"]:
        session.merge(SiteVisit(**sv_data))

    # Insert Bookings
    for bk_data in dataset["bookings"]:
        session.merge(Booking(**bk_data))

    # Insert Partner Activities
    for act_data in dataset["partner_activities"]:
        session.merge(PartnerActivity(**act_data))

    session.commit()

    return {
        "salespeople": len(dataset["salespeople"]),
        "projects": len(dataset["projects"]),
        "channel_partners": len(dataset["channel_partners"]),
        "leads": len(dataset["leads"]),
        "site_visits": len(dataset["site_visits"]),
        "bookings": len(dataset["bookings"]),
        "partner_activities": len(dataset["partner_activities"]),
    }
