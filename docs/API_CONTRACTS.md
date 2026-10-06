# API Contracts Specification (Phase 2C Blueprint)

**Project**: Channel Partner Intelligence  
**Document Version**: 2.2.0 (Phase 2A Final Funnel & Booking Semantics Correction)  
**Status**: Contract Drafted for Phase 2C Implementation  

---

## 1. Global API Standards

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Date/Time Format**: ISO-8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`)
- **Pagination**: 1-indexed query parameters (`page` default 1, `page_size` default 20, max 100).
- **Error Response Structure**:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Channel Partner with ID 'CP-9999' was not found.",
    "details": {},
    "timestamp": "2026-10-05T14:30:00Z"
  }
}
```

---

## 2. Endpoints Specification

### 2.1 Overview & Dashboard Summary

#### `GET /api/v1/overview/summary`
Retrieves consolidated executive indicators, velocity trends, partner tier distributions, recent audit activity, and deterministic attention alerts.

- **Query Parameters**:
  - `start_date` (optional, `YYYY-MM-DD`): Analytical window start.
  - `end_date` (optional, `YYYY-MM-DD`): Analytical window end.
  - `project_id` (optional, UUID/string): Filter summary by specific development project.
- **Success Response (`200 OK`)**:
```json
{
  "kpis": {
    "active_partners": {
      "value": 28,
      "growth_pct": null,
      "breakdown": {
        "tier_1": 6,
        "tier_2": 8,
        "tier_3": 14
      }
    },
    "channel_lead_flow": {
      "value": 1211,
      "total_leads": 1230,
      "valid_leads": 1211,
      "qualified_leads": 919,
      "qualification_rate_pct": 75.89,
      "growth_pct": null
    },
    "site_visits": {
      "total_scheduled": 704,
      "total_completed": 606,
      "visit_completion_rate_pct": 86.08,
      "unique_visited_leads": 507,
      "qualified_lead_to_visit_rate_pct": 55.17,
      "growth_pct": null
    },
    "bookings_velocity": {
      "units_count": 139,
      "confirmed_bookings": 139,
      "confirmed_from_visited_leads": 129,
      "direct_confirmed_bookings": 10,
      "total_value_inr": 1236100000.0,
      "visit_to_booking_rate_pct": 25.44,
      "overall_conversion_rate_pct": 11.48,
      "growth_pct": null
    }
  },
  "tier_breakdown": [
    {
      "tier": "Tier 1 (Elite)",
      "partners_count": 6,
      "percentage": 16.7,
      "contribution": "16.7%"
    },
    {
      "tier": "Tier 2 (Growth)",
      "partners_count": 10,
      "percentage": 27.8,
      "contribution": "27.8%"
    },
    {
      "tier": "Tier 3 (Active)",
      "partners_count": 20,
      "percentage": 55.6,
      "contribution": "55.6%"
    }
  ],
  "monthly_trends": [
    {
      "month": "Jan",
      "leads": 108,
      "site_visits": 52,
      "bookings": 12
    },
    {
      "month": "Feb",
      "leads": 98,
      "site_visits": 48,
      "bookings": 11
    }
  ],
  "recent_activities": [
    {
      "id": "act-e89c...",
      "partner_name": "Apex Realty Partners",
      "action": "Conducted completed site visit for lead LD-2026-0842 at Skyfinia Phase 1",
      "logged_at": "2026-12-28T18:24:00Z",
      "time_ago": "3d ago",
      "status": "success",
      "tag": "Site Visit"
    }
  ],
  "attention_alerts": [
    {
      "id": "alert-direct-bookings",
      "title": "Direct Bookings Detected",
      "description": "10 confirmed bookings occurred directly without prior completed site visit.",
      "severity": "info"
    }
  ]
}
```

---

### 2.2 Channel Partners

#### `GET /api/v1/partners`
Lists registered channel partners with pagination, tier filters, status filters, and search.

- **Query Parameters**:
  - `page` (integer, default `1`)
  - `page_size` (integer, default `20`)
  - `tier` (optional, string: `Tier 1`, `Tier 2`, `Tier 3`)
  - `active` (optional, boolean: `true`/`false`)
  - `city` (optional, string)
  - `search` (optional, string: matches name, contact person, or partner code)
  - `sort_by` (optional, string: `name`, `onboarding_date`, `tier`)
- **Success Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "cp-1001",
      "partner_code": "CP-1001",
      "name": "Apex Realty Partners",
      "legal_name": "Apex Realty Advisory Pvt Ltd",
      "contact_person": "Vikram Malhotra",
      "phone": "+919822012345",
      "email": "vikram@apexrealty.in",
      "city": "Pune",
      "location": "Baner",
      "onboarding_date": "2024-03-15",
      "active": true,
      "tier": "Tier 1",
      "channel_type": "Corporate Agency",
      "assigned_salesperson": {
        "id": "sp-101",
        "name": "Rohit Deshmukh"
      },
      "summary_stats": {
        "total_leads": 120,
        "qualified_leads": 95,
        "completed_visits": 58,
        "confirmed_bookings": 16,
        "visit_to_booking_rate_pct": 27.59,
        "overall_conversion_rate_pct": 13.33
      }
    }
  ],
  "pagination": {
    "total": 36,
    "page": 1,
    "page_size": 20,
    "total_pages": 2
  }
}
```

#### `GET /api/v1/partners/{id}`
Retrieves detailed profile, assigned sales manager, and comprehensive performance metrics for a specific partner.

- **Success Response (`200 OK`)**:
```json
{
  "id": "cp-1001",
  "partner_code": "CP-1001",
  "name": "Apex Realty Partners",
  "legal_name": "Apex Realty Advisory Pvt Ltd",
  "contact_person": "Vikram Malhotra",
  "phone": "+919822012345",
  "email": "vikram@apexrealty.in",
  "city": "Pune",
  "location": "Baner",
  "onboarding_date": "2024-03-15",
  "active": true,
  "tier": "Tier 1",
  "channel_type": "Corporate Agency",
  "assigned_salesperson": {
    "id": "sp-101",
    "name": "Rohit Deshmukh",
    "email": "rohit.deshmukh@harivishva.com",
    "phone": "+919822011111"
  },
  "metrics": {
    "total_leads": 120,
    "qualified_leads": 95,
    "qualification_rate_pct": 79.17,
    "scheduled_site_visits": 68,
    "completed_site_visits": 58,
    "visit_completion_rate_pct": 85.29,
    "unique_visited_leads": 58,
    "qualified_lead_to_visit_rate_pct": 61.05,
    "confirmed_bookings": 16,
    "visit_to_booking_rate_pct": 27.59,
    "overall_conversion_rate_pct": 13.33,
    "gross_booking_value_inr": 145000000.00
  },
  "monthly_trends": [
    {
      "month": "Jan",
      "leads": 12,
      "completed_visits": 6,
      "bookings": 2
    },
    {
      "month": "Feb",
      "leads": 10,
      "completed_visits": 5,
      "bookings": 1
    }
  ],
  "project_contribution": [
    {
      "project_id": "prj-sky-p1",
      "project_name": "Skyfinia Phase 1",
      "bookings": 9
    },
    {
      "project_id": "prj-sky-p2",
      "project_name": "Skyfinia Phase 2",
      "bookings": 5
    },
    {
      "project_id": "prj-inf-p1",
      "project_name": "Infinia Phase 1",
      "bookings": 2
    }
  ],
  "recent_leads": [],
  "recent_bookings": []
}
```

---

### 2.3 Projects

#### `GET /api/v1/projects`
Lists developer project portfolio and unit inventory status.

- **Query Parameters**:
  - `status` (optional, string: `Upcoming`, `Active`, `Nearly Sold Out`, `Completed`, `On Hold`)
  - `city` (optional, string)
  - `project_type` (optional, string: `Residential`, `Commercial`, `Mixed-Use`, `Plotted`)
- **Success Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "prj-sky-p1",
      "project_code": "PRJ-SKY-P1",
      "name": "Skyfinia Phase 1",
      "project_type": "Residential",
      "location": "Tathawade",
      "city": "Pune",
      "status": "Active",
      "launch_date": "2025-06-01",
      "target_units": 320,
      "available_units": 140,
      "starting_price": 8800000.00,
      "summary_stats": {
        "leads_count": 480,
        "visits_count": 240,
        "bookings_count": 55
      }
    }
  ],
  "total": 4
}
```

#### `GET /api/v1/projects/{id}`
Retrieves detailed project profile, pricing, and channel partner engagement distribution.

---

### 2.4 Leads

#### `GET /api/v1/leads`
Lists inbound channel partner leads with multi-factor filters.

- **Query Parameters**:
  - `page` (integer, default `1`)
  - `page_size` (integer, default `20`)
  - `project_id` (optional, string UUID)
  - `channel_partner_id` (optional, string UUID)
  - `status` (optional, string: `New`, `Qualified`, `Site Visit Scheduled`, `Site Visit Completed`, `Booking Initiated`, `Converted`, `Lost`, `Invalid`)
  - `start_date` (optional, `YYYY-MM-DD`)
  - `end_date` (optional, `YYYY-MM-DD`)
- **Success Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "ld-842",
      "lead_code": "LD-2026-0842",
      "customer_name": "Ananya Sharma",
      "customer_phone": "+9198231*****",
      "customer_email": "a.sharma@example.com",
      "project": {
        "id": "prj-101",
        "name": "Solaris Residences"
      },
      "channel_partner": {
        "id": "cp-1001",
        "name": "Apex Realty Partners",
        "tier": "Tier 1"
      },
      "assigned_salesperson": {
        "id": "sp-101",
        "name": "Rohit Deshmukh"
      },
      "status": "Site Visit Completed",
      "budget_range": "1.2Cr - 1.5Cr",
      "requirement_type": "3 BHK Premium",
      "created_at": "2026-09-12T10:30:00Z",
      "qualified_at": "2026-09-12T14:15:00Z"
    }
  ],
  "pagination": {
    "total": 3860,
    "page": 1,
    "page_size": 20,
    "total_pages": 193
  }
}
```

---

### 2.5 Site Visits

#### `GET /api/v1/site-visits`
Retrieves property visit logs, execution status, and partner attribution.

- **Query Parameters**:
  - `page`, `page_size`
  - `project_id`
  - `channel_partner_id`
  - `status` (`Scheduled`, `Completed`, `Cancelled`, `No Show`)
  - `start_date`, `end_date`
- **Success Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "sv-194",
      "visit_code": "SV-2026-0194",
      "lead_id": "ld-842",
      "customer_name": "Ananya Sharma",
      "project_name": "Solaris Residences",
      "channel_partner_name": "Apex Realty Partners",
      "salesperson_name": "Rohit Deshmukh",
      "scheduled_at": "2026-09-15T11:00:00Z",
      "visited_at": "2026-09-15T11:30:00Z",
      "status": "Completed",
      "verification_type": "Digital Token OTP",
      "outcome": "Positive / Intent to Book",
      "feedback_notes": "Client shortlisted Tower B Unit 802. Discussion on payment schedule."
    }
  ],
  "pagination": {
    "total": 1872,
    "page": 1,
    "page_size": 20,
    "total_pages": 94
  }
}
```

---

### 2.6 Bookings

#### `GET /api/v1/bookings`
Lists executed bookings and unit closure transactions.

- **Query Parameters**:
  - `page`, `page_size`
  - `project_id`
  - `channel_partner_id`
  - `booking_status` (`Initiated`, `Confirmed`, `Cancelled`, `Completed`)
  - `start_date`, `end_date`
- **Cardinality & Status Invariant**:
  - `Lead 1 -> 0..* Booking Records`.
  - `ACTIVE_BOOKING_STATUSES`: `Initiated`, `Confirmed` (at most 1 active booking per lead at any time).
  - `TERMINAL_BOOKING_STATUSES`: `Completed`, `Cancelled` (historical records; do not count as concurrent active bookings).
- **Synthetic Data Disclaimer**:
  - `commission_rate_pct` (2.0%) and `commission_amount` are demo sample values and do NOT represent Harivishva's actual commission policy.
- **Success Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "bk-089",
      "booking_reference": "BK-2026-0089",
      "lead_id": "ld-842",
      "customer_name": "Ananya Sharma",
      "project_name": "Solaris Residences",
      "channel_partner_name": "Apex Realty Partners",
      "unit_number": "Tower B - Unit 802",
      "unit_type": "3 BHK Premium",
      "booking_date": "2026-09-22",
      "booking_status": "Confirmed",
      "booking_value": 13500000.00,
      "token_amount": 500000.00,
      "commission_rate_pct": 2.0,
      "commission_amount": 270000.00
    }
  ],
  "pagination": {
    "total": 446,
    "page": 1,
    "page_size": 20,
    "total_pages": 23
  }
}
```

---

### 2.7 Customers & Global Customer Search (Phase 2 QA/UX)

#### `GET /api/v1/customers/search`
Performs lightweight, case-insensitive partial search across customer leads by name, phone, email, or lead business code.

- **Query Parameters**:
  - `q` (required, string, minimum 2 characters): Search query.
  - `page_size` (optional, integer, default 10, maximum 50): Maximum result records to return.
- **Success Response (`200 OK`)**:
```json
{
  "items": [
    {
      "lead_id": "ld-000067",
      "lead_code": "LD-2026-000067",
      "customer_name": "Aarav Mehta",
      "customer_phone": "+919822099901",
      "customer_email": "aarav.mehta@example.com",
      "project_id": "prj-sky-p1",
      "project_name": "Skyfinia Phase 1",
      "lead_status": "Converted",
      "channel_partner_id": "cp-1001",
      "channel_partner_name": "Elite Realty Partners",
      "salesperson_id": "sp-101",
      "salesperson_name": "Rohit Deshmukh"
    }
  ],
  "total": 1
}
```

#### `GET /api/v1/customers/{lead_id}`
Retrieves full customer identity, attribution, site visit logs, and complete chronological booking transaction history (including cancelled and replacement booking lifecycle).

- **Path Parameters**:
  - `lead_id` (required, string): Customer lead identifier (e.g. `ld-000067`).
- **Success Response (`200 OK`)**:
```json
{
  "lead_id": "ld-000067",
  "lead_code": "LD-2026-000067",
  "customer_name": "Aarav Mehta",
  "customer_phone": "+919822099901",
  "customer_email": "aarav.mehta@example.com",
  "lead_status": "Converted",
  "budget_range": "₹1.5 Cr - ₹2.0 Cr",
  "requirement_type": "3 BHK Luxury",
  "lost_reason": null,
  "created_at": "2026-11-10T14:22:10Z",
  "qualified_at": "2026-11-12T16:05:00Z",
  "converted_at": "2026-11-22T21:01:31Z",
  "lost_at": null,
  "project_id": "prj-sky-p1",
  "project_name": "Skyfinia Phase 1",
  "channel_partner_id": "cp-1001",
  "channel_partner_name": "Elite Realty Partners",
  "channel_partner_code": "CP-1001",
  "channel_partner_tier": "Tier 1 (Elite)",
  "salesperson_id": "sp-101",
  "salesperson_name": "Rohit Deshmukh",
  "salesperson_email": "rohit.deshmukh@harivishva.com",
  "salesperson_phone": "+91 98220 11001",
  "site_visits": [
    {
      "id": "sv-000045",
      "visit_code": "SV-2026-000045",
      "scheduled_at": "2026-11-14T11:00:00Z",
      "visited_at": "2026-11-14T11:35:00Z",
      "status": "Completed",
      "verification_type": "Digital Token OTP",
      "outcome": "Positive",
      "feedback_notes": "Client shortlisted 3 BHK Luxury unit in Tower A.",
      "created_at": "2026-11-12T16:10:00Z"
    }
  ],
  "bookings": [
    {
      "id": "bk-000014",
      "booking_reference": "BK-2026-000014",
      "unit_number": "Unit 773",
      "unit_type": "3 BHK Luxury",
      "project_id": "prj-sky-p1",
      "project_name": "Skyfinia Phase 1",
      "booking_date": "2026-11-17",
      "booking_status": "Cancelled",
      "booking_value": 18500000.00,
      "token_amount": 100000.00,
      "commission_rate_pct": 2.0,
      "commission_amount": 370000.00,
      "cancelled_at": "2026-11-19T09:54:32Z",
      "created_at": "2026-11-17T08:48:05Z"
    },
    {
      "id": "bk-000015",
      "booking_reference": "BK-2026-000015",
      "unit_number": "Unit 1706",
      "unit_type": "3 BHK Luxury",
      "project_id": "prj-sky-p1",
      "project_name": "Skyfinia Phase 1",
      "booking_date": "2026-11-22",
      "booking_status": "Confirmed",
      "booking_value": 18500000.00,
      "token_amount": 100000.00,
      "commission_rate_pct": 2.0,
      "commission_amount": 370000.00,
      "cancelled_at": null,
      "created_at": "2026-11-22T21:01:31Z"
    }
  ],
  "lifecycle_events": [
    {
      "event_id": "bk-000014-created",
      "event_type": "BOOKING_CREATED",
      "event_at": "2026-11-17T08:48:05Z",
      "booking_id": "bk-000014",
      "booking_reference": "BK-2026-000014",
      "unit_number": "Unit 773",
      "unit_type": "3 BHK Luxury",
      "project_id": "prj-sky-p1",
      "project_name": "Skyfinia Phase 1",
      "booking_status": "Cancelled",
      "booking_value": 18500000.0,
      "is_replacement": false,
      "description": "Booking attempted for Unit 773 (3 BHK Luxury)"
    },
    {
      "event_id": "bk-000014-cancelled",
      "event_type": "BOOKING_CANCELLED",
      "event_at": "2026-11-19T09:54:32Z",
      "booking_id": "bk-000014",
      "booking_reference": "BK-2026-000014",
      "unit_number": "Unit 773",
      "unit_type": "3 BHK Luxury",
      "project_id": "prj-sky-p1",
      "project_name": "Skyfinia Phase 1",
      "booking_status": "Cancelled",
      "booking_value": 18500000.0,
      "is_replacement": false,
      "description": "Booking cancelled for Unit 773 (3 BHK Luxury)"
    },
    {
      "event_id": "bk-000015-created",
      "event_type": "BOOKING_CONFIRMED",
      "event_at": "2026-11-22T21:01:31Z",
      "booking_id": "bk-000015",
      "booking_reference": "BK-2026-000015",
      "unit_number": "Unit 1706",
      "unit_type": "3 BHK Luxury",
      "project_id": "prj-sky-p1",
      "project_name": "Skyfinia Phase 1",
      "booking_status": "Confirmed",
      "booking_value": 18500000.0,
      "is_replacement": true,
      "description": "Replacement booking confirmed for Unit 1706 (3 BHK Luxury)"
    }
  ]
}
```

---

### 2.4 Projects & Developments (Phase 2E)

#### `GET /api/v1/projects`
Retrieves paginated projects directory with portfolio summary strip, search, family, and status filters.

- **Query Parameters**:
  - `page` (optional, default `1`): Page number (1-indexed).
  - `page_size` (optional, default `20`, max `100`): Items per page.
  - `search` (optional, string): Filters by project name or project code (case-insensitive substring match).
  - `family` (optional, string): Filter by project family (`Skyfinia`, `Infinia`).
  - `status` (optional, string): Filter by development status (`Active`, `Upcoming`, `Nearly Sold Out`, `Completed`, `On Hold`).
  - `sort_by` (optional, string): Sort field (`name`, `target_units`, `available_units`, `booked_units`, `booking_value`). Defaults to `name` ascending with `id` tie-breaker.
- **Success Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "prj-sky-p1",
      "project_code": "prj-sky-p1",
      "name": "Skyfinia Phase 1",
      "project_family": "Skyfinia",
      "project_type": "Residential High-Rise",
      "location": "Tathawade",
      "city": "Pune",
      "status": "Active",
      "launch_date": "2026-01-01",
      "target_units": 320,
      "available_units": 280,
      "starting_price": 8800000.0,
      "metrics": {
        "target_units": 320,
        "available_units": 280,
        "booked_units": 40,
        "inventory_utilization_pct": 12.5,
        "total_leads": 315,
        "valid_leads": 310,
        "qualified_leads": 242,
        "qualification_rate_pct": 78.06,
        "completed_visits": 158,
        "confirmed_bookings": 40,
        "gross_booking_value_inr": 400780000.0,
        "overall_conversion_rate_pct": 12.9
      }
    }
  ],
  "pagination": {
    "total": 4,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  },
  "portfolio_summary": {
    "total_projects": 4,
    "total_families": 2,
    "total_target_units": 1250,
    "total_available_units": 1092,
    "total_booked_units": 158,
    "total_booking_value_inr": 1583400000.0
  }
}
```

#### `GET /api/v1/projects/{id}`
Retrieves authoritative project profile, inventory utilization, 4-stage funnel conversion, 12-month 2026 trends, top 10 contributing channel partners, and recent confirmed unit closures.

- **Path Parameters**:
  - `id` (required, string): Project ID (e.g. `prj-sky-p1`) or project code.
- **Success Response (`200 OK`)**:
```json
{
  "id": "prj-sky-p1",
  "project_code": "prj-sky-p1",
  "name": "Skyfinia Phase 1",
  "project_family": "Skyfinia",
  "project_type": "Residential High-Rise",
  "location": "Tathawade",
  "city": "Pune",
  "status": "Active",
  "launch_date": "2026-01-01",
  "target_units": 320,
  "available_units": 280,
  "starting_price": 8800000.0,
  "inventory": {
    "target_units": 320,
    "available_units": 280,
    "booked_units": 40,
    "inventory_utilization_pct": 12.5
  },
  "lead_metrics": {
    "total_leads": 315,
    "valid_leads": 310,
    "qualified_leads": 242,
    "qualification_rate_pct": 78.06
  },
  "site_visit_metrics": {
    "scheduled_visits": 185,
    "completed_visits": 158,
    "visit_completion_rate_pct": 85.41,
    "unique_visited_leads": 130,
    "qualified_lead_to_visit_rate_pct": 53.72
  },
  "booking_metrics": {
    "confirmed_bookings": 40,
    "confirmed_from_visited_leads": 39,
    "direct_confirmed_bookings": 1,
    "visit_to_booking_rate_pct": 30.0,
    "overall_lead_to_booking_rate_pct": 12.9,
    "gross_booking_value_inr": 400780000.0
  },
  "partner_metrics": {
    "contributing_lead_partners": 36,
    "contributing_booking_partners": 24
  },
  "monthly_trends": [
    { "month": "Jan", "leads": 26, "completed_visits": 13, "bookings": 3 }
  ],
  "top_partners": [
    {
      "partner_id": "cp-1001",
      "partner_code": "CP-1001",
      "partner_name": "Apex Realty",
      "tier": "Tier 1",
      "assigned_salesperson_name": "Rohit Deshmukh",
      "valid_leads": 18,
      "completed_visits": 12,
      "confirmed_bookings": 4,
      "booking_value_inr": 40500000.0,
      "overall_conversion_rate_pct": 22.22
    }
  ],
  "recent_bookings": [
    {
      "id": "bk-000001",
      "booking_reference": "BK-2026-000001",
      "lead_id": "ld-000012",
      "customer_name": "Rajesh Sharma",
      "channel_partner_id": "cp-1001",
      "channel_partner_name": "Apex Realty",
      "unit_number": "402",
      "unit_type": "2 BHK",
      "booking_date": "2026-02-14",
      "booking_status": "Confirmed",
      "booking_value": 9800000.0
    }
  ]
}
```


