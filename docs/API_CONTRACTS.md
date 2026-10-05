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
      "value": 152,
      "growth_pct": null,
      "breakdown": {
        "tier_1": 18,
        "tier_2": 40,
        "tier_3": 94
      }
    },
    "channel_lead_flow": {
      "value": 3906,
      "total_leads": 4018,
      "valid_leads": 3906,
      "qualified_leads": 2891,
      "qualification_rate_pct": 74.01,
      "growth_pct": null
    },
    "site_visits": {
      "total_scheduled": 2010,
      "total_completed": 1743,
      "visit_completion_rate_pct": 86.72,
      "unique_visited_leads": 1472,
      "qualified_lead_to_visit_rate_pct": 50.92,
      "growth_pct": null
    },
    "bookings_velocity": {
      "units_count": 454,
      "confirmed_bookings": 454,
      "confirmed_from_visited_leads": 440,
      "direct_confirmed_bookings": 14,
      "total_value_inr": 4385100000.0,
      "visit_to_booking_rate_pct": 29.89,
      "overall_conversion_rate_pct": 11.62,
      "growth_pct": null
    }
  },
  "tier_breakdown": [
    {
      "tier": "Tier 1 (Elite)",
      "partners_count": 18,
      "percentage": 10.3,
      "contribution": "10.3%"
    },
    {
      "tier": "Tier 2 (Growth)",
      "partners_count": 45,
      "percentage": 25.7,
      "contribution": "25.7%"
    },
    {
      "tier": "Tier 3 (Active)",
      "partners_count": 112,
      "percentage": 64.0,
      "contribution": "64.0%"
    }
  ],
  "monthly_trends": [
    {
      "month": "Jan",
      "leads": 353,
      "site_visits": 152,
      "bookings": 41
    },
    {
      "month": "Feb",
      "leads": 312,
      "site_visits": 139,
      "bookings": 36
    }
  ],
  "recent_activities": [
    {
      "id": "act-e89c...",
      "partner_name": "Apex Realty Advisory",
      "action": "Conducted completed site visit for lead LD-2024-8891",
      "logged_at": "2027-01-21T18:24:00Z",
      "time_ago": "12m ago",
      "status": "success",
      "tag": "Site Visit"
    }
  ],
  "attention_alerts": [
    {
      "id": "alert-direct-bookings",
      "title": "Direct Bookings Detected",
      "description": "14 confirmed bookings occurred directly without prior completed site visit.",
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
        "total_leads": 340,
        "qualified_leads": 280,
        "completed_visits": 142,
        "confirmed_bookings": 38,
        "visit_to_booking_rate_pct": 26.76,
        "overall_conversion_rate_pct": 11.18
      }
    }
  ],
  "pagination": {
    "total": 175,
    "page": 1,
    "page_size": 20,
    "total_pages": 9
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
    "email": "rohit.d@hariwishwa.com",
    "phone": "+919823098765"
  },
  "metrics": {
    "total_leads": 340,
    "qualified_leads": 280,
    "qualification_rate_pct": 82.35,
    "scheduled_site_visits": 170,
    "completed_site_visits": 142,
    "visit_completion_rate_pct": 83.53,
    "unique_visited_leads": 142,
    "qualified_lead_to_visit_rate_pct": 50.71,
    "confirmed_bookings": 38,
    "visit_to_booking_rate_pct": 26.76,
    "overall_conversion_rate_pct": 11.18,
    "gross_booking_value_inr": 385000000.00
  },
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
      "id": "prj-101",
      "project_code": "PRJ-SOLARIS",
      "name": "Solaris Residences",
      "project_type": "Residential",
      "location": "Kharadi",
      "city": "Pune",
      "status": "Active",
      "launch_date": "2025-06-01",
      "target_units": 450,
      "available_units": 185,
      "starting_price": 8500000.00,
      "summary_stats": {
        "leads_count": 1250,
        "visits_count": 580,
        "bookings_count": 142
      }
    }
  ],
  "total": 5
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
  - `commission_rate_pct` (2.0%) and `commission_amount` are demo sample values and do NOT represent Hariwishwa's actual commission policy.
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
