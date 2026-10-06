# Business Domain, Data Model & KPI Specification

**Project**: Channel Partner Intelligence  
**Document Version**: 2.2.0 (Phase 2A Final Funnel & Booking Semantics Correction)  
**Status**: Specification Approved  

---

## 1. Product Purpose & Executive Principles

### 1.1 Core Mission
**Channel Partner Intelligence** is a specialized analytical and decision-support platform designed for real estate developers (e.g., Harivishva) and distribution heads. It provides executive visibility into channel partner (broker/agency) networks, inbound lead attribution, property site visit conversions, and booking velocity.

### 1.2 The Intelligence Loop
Unlike a transactional customer relationship management (CRM) tool that focuses on individual record entry and sales rep workflows, Channel Partner Intelligence transforms transactional data into executive clarity:

```
┌──────────┐     ┌────────────┐     ┌───────────────┐     ┌──────────┐     ┌────────┐
│   DATA   │ ──> │ VISIBILITY │ ──> │ UNDERSTANDING │ ──> │ DECISION │ ──> │ ACTION │
└──────────┘     └────────────┘     └───────────────┘     └──────────┘     └────────┘
  Partners         Real-time           Conversion            Executive        Targeted
  Leads            Dashboards          Bottlenecks &         Resource         Partner
  Site Visits      & Activity          Partner Trends        Allocation       Interventions
  Bookings         Feeds
```

### 1.3 Strategic Business Questions Answered
1. **Network Health**: How many channel partners are actively engaged vs. dormant?
2. **Attribution & Flow**: Which partner tiers are driving qualified lead flow into specific projects?
3. **Funnel Friction**: At which stage (Lead $\rightarrow$ Site Visit $\rightarrow$ Booking) is conversion momentum lost?
4. **Partner Efficiency**: Which partners exhibit high visit-to-booking conversion ratios vs. those generating high-volume but low-intent leads?
5. **Project Velocity**: How is project demand distributed across residential and commercial developments?
6. **Network Risk**: Which previously high-performing partners are exhibiting leading indicators of disengagement?

---

## 2. Domain Entities Specification

```
                          ┌─────────────────┐
                          │   Salesperson   │
                          └────────┬────────┘
                                   │ 1
                                   │
                                   │ 0..* assigned
                                   ▼
┌──────────────────┐ 1        0..* ┌─────────────────┐ 0..*        1 ┌─────────────────┐
│ Channel Partner  ├──────────────>│      Lead       │<──────────────┤     Project     │
└────────┬─────────┘               └────────┬────────┘               └────────┬────────┘
         │ 1                                │ 1                               │ 1
         │                                  │                                 │
         │ 0..*                             │ 0..*                            │ 0..*
         ▼                                  ▼                                 ▼
┌──────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│ Partner Activity │               │   Site Visit    │               │ Booking Record  │
└──────────────────┘               └────────┬────────┘               └─────────────────┘
                                            │ 1                               ▲
                                            │                                 │
                                            └─────────────────────────────────┘
                                                0..1 verified path (typical)
```

---

### 2.1 Channel Partner (`channel_partners`)
Represents an external brokerage, real estate consultant, or independent agent authorized to source and refer buyers.

- **Primary Key**: `id` (String UUID or Integer ID)
- **Business Identifier**: `partner_code` (e.g., `CP-1001`)
- **Key Attributes**:
  - `name`: Commercial/operating name of the brokerage (e.g., "Apex Realty Partners").
  - `legal_name`: Registered legal entity name for agreements and tax filings.
  - `contact_person`: Primary point of contact / principal broker.
  - `phone`: Primary verified phone number (E.164 format).
  - `email`: Primary business email address.
  - `city`: Operating city / metropolitan area.
  - `location`: Specific sub-market or locality (e.g., "Baner, Pune").
  - `onboarding_date`: Date the partner was formally registered.
  - `active`: Boolean flag indicating whether the partnership agreement is active.
  - `tier`: Business classification tier (`Tier 1`, `Tier 2`, `Tier 3`).
  - `channel_type`: Source category (`Independent Broker`, `Corporate Agency`, `Direct Referral`, `Digital Channel Partner`).
  - `assigned_salesperson_id`: Foreign key to internal developer sales manager.
  - `notes`: Executive and operational notes.
  - `created_at`, `updated_at`: ISO-8601 UTC timestamps.

#### Partner Tier Classification (Phase 2 Semantics)
*Note: In Phase 2, tiering represents a deterministic business classification, not an ML/AI score.*
- **Tier 1 (Elite)**: High-conviction partner relationships with consistent monthly bookings and executive-level collaboration.
- **Tier 2 (Growth)**: Active brokerages with consistent lead submission and emerging site visit momentum.
- **Tier 3 (Active)**: Broad base of registered partners referring occasional prospects.

---

### 2.2 Project (`projects`)
Represents a real estate development asset being marketed and sold by the developer.

- **Primary Key**: `id` (UUID or Integer ID)
- **Business Identifier**: `project_code` (e.g., `PRJ-SOLARIS`)
- **Key Attributes**:
  - `name`: Commercial project name (e.g., "Solaris Residences").
  - `project_type`: Development classification (`Residential`, `Commercial`, `Mixed-Use`, `Plotted`).
  - `location`: Micro-market/suburb (e.g., "Kharadi").
  - `city`: Metropolitan city (e.g., "Pune").
  - `status`: Lifecycle stage (`Upcoming`, `Active`, `Nearly Sold Out`, `Completed`, `On Hold`).
  - `launch_date`: Official commercial launch date.
  - `target_units`: Total saleable units planned in the project.
  - `available_units`: Current unsold unit inventory count.
  - `starting_price`: Base starting unit price for financial context.
  - `created_at`, `updated_at`: ISO-8601 UTC timestamps.

#### Project Status Lifecycle
- `Upcoming`: Pre-launch phase; gathering early interest.
- `Active`: Under active sales and marketing; units available for site visits and booking.
- `Nearly Sold Out`: Less than 10% inventory remaining; high urgency.
- `Completed`: 100% units booked/sold out; archived from primary sales view.
- `On Hold`: Project temporarily paused for regulatory or construction reasons.

---

### 2.3 Salesperson (`salespeople`)
Represents an internal sales team member or partner relationship manager employed by the developer.

- **Primary Key**: `id` (UUID or Integer ID)
- **Key Attributes**:
  - `name`: Full name of the sales manager.
  - `email`: Corporate email address.
  - `phone`: Mobile contact number.
  - `team`: Internal sales division (e.g., "East Pune Cluster", "Luxury Residential Team").
  - `active`: Boolean flag indicating active employment.
  - `created_at`, `updated_at`: ISO-8601 UTC timestamps.

---

### 2.4 Lead (`leads`)
Represents a prospective buyer referred by a channel partner for a specific development project.

- **Primary Key**: `id` (UUID or Integer ID)
- **Business Identifier**: `lead_code` (e.g., `LD-2026-0842`)
- **Key Attributes**:
  - `customer_name`: Full name of the prospective buyer.
  - `customer_phone`: Contact phone number.
  - `customer_email`: Contact email address (optional).
  - `project_id`: Foreign key to `projects.id` (**Required**).
  - `channel_partner_id`: Foreign key to `channel_partners.id` (**Required**).
  - `assigned_salesperson_id`: Foreign key to `salespeople.id` (Optional/Assigned).
  - `status`: Current lifecycle state (`New`, `Contacted`, `Qualified`, `Site Visit Scheduled`, `Site Visit Completed`, `Booking Initiated`, `Converted`, `Lost`, `Invalid`).
  - `budget_range`: Target ticket size (e.g., "80L - 1.2Cr").
  - `requirement_type`: Desired configuration (e.g., "2 BHK", "3 BHK", "Penthouse", "Retail Shop").
  - `lost_reason`: Categorized failure reason if status is `Lost` (`Budget Mismatch`, `Location Unsuitable`, `Bought with Competitor`, `Follow-up Expired`, `Loan Eligibility Issue`).
  - `created_at`: Exact timestamp when lead entered the system (**Lead Ingestion Date**).
  - `qualified_at`: Milestone timestamp when lead passed qualification checks (Nullable).
  - `converted_at`: Timestamp when lead reached finalized booking (Nullable).
  - `lost_at`: Timestamp when lead was marked lost (Nullable).
  - `updated_at`: ISO-8601 UTC timestamp.

#### Milestone-Based Qualification Rule
> **Milestone Rule**: A lead is defined as **historically qualified** if and only if `qualified_at IS NOT NULL`.  
> Funnel and cohort analytics must use the milestone timestamp (`qualified_at`) rather than the transient `status` column.  
> If a lead progresses: `New` $\rightarrow$ `Qualified` $\rightarrow$ `Site Visit Scheduled` $\rightarrow$ `Site Visit Completed` $\rightarrow$ `Lost`, the lead **retains its historical qualification status and timestamp**, ensuring historical qualified funnel metrics remain accurate.

---

### 2.5 Site Visit (`site_visits`)
Represents an in-person or verified virtual tour of the project site conducted by the prospect.

- **Primary Key**: `id` (UUID or Integer ID)
- **Business Identifier**: `visit_code` (e.g., `SV-2026-0194`)
- **Key Attributes**:
  - `lead_id`: Foreign key to `leads.id` (**Required**).
  - `project_id`: Foreign key to `projects.id` (**Required**; must match `lead.project_id`).
  - `channel_partner_id`: Foreign key to `channel_partners.id` (Inherited/Attributed).
  - `salesperson_id`: Foreign key to `salespeople.id` who hosted the tour.
  - `scheduled_at`: Planned date and time for the visit.
  - `visited_at`: Actual completed timestamp of visit (**Visit Execution Date**).
  - `status`: Execution state (`Scheduled`, `Completed`, `Cancelled`, `No Show`).
  - `verification_type`: Security verification (`Digital Token OTP`, `Physical Entry Log`, `Sales Center QR`).
  - `outcome`: Qualitative outcome (`Positive / Intent to Book`, `Revisit Planned`, `Neutral / Exploring`, `Not Interested`).
  - `feedback_notes`: Internal salesperson notes post-visit.
  - `created_at`, `updated_at`: ISO-8601 UTC timestamps.

---

### 2.6 Booking (`bookings`)
Represents an executed transactional agreement and token payment for a specific unit.

- **Primary Key**: `id` (UUID or Integer ID)
- **Business Identifier**: `booking_reference` (e.g., `BK-2026-0089`)
- **Key Attributes**:
  - `lead_id`: Foreign key to `leads.id` (**Required**; cardinality `1` lead to `0..*` booking records, with at most one active booking at any time).
  - `project_id`: Foreign key to `projects.id` (**Required**).
  - `channel_partner_id`: Foreign key to `channel_partners.id` (**Required**).
  - `salesperson_id`: Foreign key to `salespeople.id` (**Required**).
  - `unit_number`: Physical unit descriptor (e.g., "Tower A - Unit 1402").
  - `unit_type`: Unit configuration (e.g., "3 BHK Premium").
  - `booking_date`: Business date of the booking attempt creation (**Booking Date**).
  - `booking_status`: Transaction status (`Initiated`, `Confirmed`, `Cancelled`, `Completed`).
  - `booking_value`: Agreed agreement value in INR (e.g., `12500000` = ₹1.25 Cr).
  - `token_amount`: Earnest token amount received (e.g., `200000` = ₹2 Lakh).
  - `commission_rate_pct`: Brokerage commission percentage (e.g., `2.0` = 2.0%).
  - `commission_amount`: Computed commission amount in INR (e.g., `250000`).
  - `cancelled_at`: Exact timestamp when booking attempt was cancelled (Nullable; populated for `Cancelled` status).
  - `created_at`, `updated_at`: ISO-8601 UTC timestamps (`created_at` represents booking attempt creation).

#### Booking Status Classification
- **ACTIVE_BOOKING_STATUSES**:
  - `Initiated`: Booking token / form submitted; pending clearance or confirmation.
  - `Confirmed`: Token cleared; unit officially reserved in inventory.
- **TERMINAL_BOOKING_STATUSES**:
  - `Completed`: Full agreement and registration finalized; active demand milestone schedule.
  - `Cancelled`: Booking cancelled by buyer or developer; unit restored to inventory.

#### Booking Lifecycle Chronology & Unit Replacement
1. **Multi-Record History (`0..*`)**: A single lead may have multiple historical booking records (e.g., an initial booking attempt that was `Cancelled`, followed by a subsequent replacement booking that was `Confirmed`, or multiple completed past transactions).
2. **Explicit Cancellation Chronology**:
   - For every cancelled booking: `created_at < cancelled_at` and `booking_date == created_at.date()`.
   - The creation timestamp and business booking date represent the attempt creation; the cancellation timestamp `cancelled_at` represents the subsequent status-transition event.
3. **Sequential Replacement Chronology**:
   - For a replacement booking following a cancellation: `replacement.created_at > previous.cancelled_at`.
4. **Unit Replacement Flexibility**:
   - Sequential booking attempts for the same lead may specify different unit numbers (e.g., Unit 286 cancelled $\rightarrow$ Unit 811 confirmed). Distinct unit inventory across sequential attempts is fully valid.
5. **Active Booking Invariant**: A lead may not have more than **one concurrent active booking** (status `Initiated` or `Confirmed`).
6. **Terminal Records**: `Completed` and `Cancelled` records are historical/terminal records and do **NOT** count as concurrent active bookings.
7. **Booking Record vs. Booking Lifecycle Event**:
   - **Booking Record** (`bookings` database table): Persistent relational storage capturing commercial terms, allocated unit, and financial ledger status. In a cancellation + replacement scenario, exactly **2 booking records** exist in the database (Record A: Unit 773 `Cancelled`, Record B: Unit 1706 `Confirmed`). No fake 3rd database record is created.
   - **Booking Lifecycle Event** (`CustomerLifecycleEvent` derived representation): Discrete chronological business events representing customer journey transitions. The same scenario produces **3 distinct lifecycle events**:
     1. `BOOKING_CREATED` (Booking Attempted) — emitted at `booking_a.created_at` for Unit 773.
     2. `BOOKING_CANCELLED` (Booking Cancelled) — emitted at `booking_a.cancelled_at` for Unit 773.
     3. `BOOKING_CONFIRMED` (Replacement Booking Confirmed) — emitted at `booking_b.created_at` for Unit 1706 (`is_replacement = True`).
8. **Commission Assumption Disclaimer**:
   > **Synthetic Data Notice**: The default `2.0%` base commission rate and computed commission amounts are synthetic sample/demo data assumptions used for analytical pipeline modeling only. They do **NOT** represent Harivishva's actual commercial commission policy or partner contract terms.

---

### 2.7 Partner Activity (`partner_activities`)
A normalized historical audit ledger capturing all meaningful touchpoints and milestones generated across the partner network.

- **Primary Key**: `id` (UUID or Integer ID)
- **Key Attributes**:
  - `channel_partner_id`: Foreign key to `channel_partners.id` (**Required**).
  - `activity_type`: Event category (`lead_submitted`, `site_visit_scheduled`, `site_visit_completed`, `booking_initiated`, `booking_confirmed`, `tier_updated`, `review_logged`).
  - `entity_type`: Target entity class (`lead`, `site_visit`, `booking`, `partner`).
  - `entity_id`: Foreign identifier of the related record.
  - `description`: Human-readable activity narrative (e.g., "Apex Realty submitted 6 qualified leads for Project Solaris").
  - `logged_at`: Exact timestamp of event occurrence.

---

## 3. Entity Relationships & Cardinality Graph

| Source Entity | Target Entity | Cardinality | Business Rule |
|---|---|---|---|
| `channel_partners` | `leads` | `1` to `0..*` | A partner can submit multiple leads. Each lead belongs to exactly one partner. |
| `projects` | `leads` | `1` to `0..*` | A project receives multiple leads. Each lead is scoped to one project. |
| `salespeople` | `leads` | `1` to `0..*` | A salesperson can be assigned to multiple leads. |
| `leads` | `site_visits` | `1` to `0..*` | A lead can have zero, one, or multiple site visits (re-visits). |
| `leads` | `bookings` | `1` to `0..*` | A lead may have multiple historical booking records, but at most one concurrent active booking (`Initiated` or `Confirmed`). |
| `projects` | `site_visits` | `1` to `0..*` | Site visits occur at a designated project location. |
| `projects` | `bookings` | `1` to `0..*` | Bookings reserve units within a designated project. |
| `channel_partners` | `bookings` | `1` to `0..*` | Bookings are attributed to the referring partner. |
| `channel_partners` | `partner_activities`| `1` to `0..*` | All major partner touchpoints stream into activity logs. |

---

## 4. Funnel Definition & Progression Logic

### 4.1 The 4-Stage Official Funnel

```
Stage 1: TOTAL VALID LEADS
  │  (Filter: leads.status != 'Invalid')
  │
  │  (Milestone Filter: leads.qualified_at IS NOT NULL)
  ▼
Stage 2: HISTORICALLY QUALIFIED LEADS
  │
  │  (Execution Filter: site_visits.status = 'Completed')
  ▼
Stage 3: COMPLETED SITE VISITS (Unique Visited Leads)
  │
  │  (Transaction Filter: bookings.booking_status IN ('Confirmed', 'Completed'))
  ▼
Stage 4: CONFIRMED BOOKINGS
```

### 4.2 Edge Cases and Exception Handling

| Edge Case Scenario | Funnel Treatment | KPI Impact |
|---|---|---|
| **Lead Qualified then Lost** (`New` $\rightarrow$ `Qualified` $\rightarrow$ `Site Visit` $\rightarrow$ `Lost`) | Retains `qualified_at` timestamp. Lead is preserved in Stage 1 and Stage 2. | Stage 2 (Qualified Leads) accurately reflects all prospects who qualified, preventing historical funnel shrinkage. |
| **Direct Booking without Site Visit** | Prospect books immediately (e.g., NRI investor). | Lead counted in Stage 1, Stage 2, and Stage 4. Excluded from Stage 3 (Site Visits) and excluded from the numerator of the Site Visit $\rightarrow$ Booking Rate. Prevents direct bookings from distorting the visit close rate. |
| **Multiple Site Visits for Single Lead** | Lead visits project 3 times before deciding. | Total Completed Site Visits = 3. Unique Leads with $\ge 1$ Visit = 1. Funnel conversion rate uses unique lead attribution to prevent >100% ratios. |
| **Cancelled Booking followed by Re-booking** | Initial booking cancelled; lead later books another unit. | Lead has 2 booking records (`Cancelled` + `Confirmed`). Validated under `0..*` cardinality; at most 1 active booking. Contributes 1 Confirmed Booking to Stage 4. |
| **Cancelled / No-Show Site Visit** | Visit is scheduled but customer does not attend. | Counted in `Total Scheduled Visits`, excluded from `Completed Site Visits`. |
| **Invalid / Duplicate Lead** | Wrong contact number or duplicate referral. | Flagged as `status = 'Invalid'`. Excluded from qualification and conversion rate denominators. |

---

## 5. Formal KPI Definitions & Formulas

### 5.1 Volume & Count KPIs

#### KPI 01: Total Partners
- **Definition**: Total number of channel partner brokerages onboarded in the system.
- **Formula**:
  $$\text{Total Partners} = \text{COUNT}(\text{channel\_partners})$$
- **Inclusion**: All registered partner records.

#### KPI 02: Active Partners
- **Definition**: Channel partners who are flagged as active AND have recorded at least one qualifying activity (lead submission, site visit, booking, or review) within the trailing 90 days.
- **Formula**:
  $$\text{Active Partners} = \text{COUNT}(\text{partner } p \mid p.\text{active} = \text{true} \land \exists a \in \text{activities}(p) \text{ where } a.\text{logged\_at} \ge \text{NOW}() - 90\text{ days})$$

#### KPI 03: Total Leads
- **Definition**: Total valid prospects introduced by channel partners.
- **Formula**:
  $$\text{Total Leads} = \text{COUNT}(\text{leads } l \mid l.\text{status} \ne \text{'Invalid'})$$

#### KPI 04: Qualified Leads (Milestone-Based)
- **Definition**: Prospects who passed developer qualification checks at any point in their lifecycle (`qualified_at IS NOT NULL`).
- **Formula**:
  $$\text{Qualified Leads} = \text{COUNT}(\text{leads } l \mid l.\text{qualified\_at IS NOT NULL})$$
- **Inclusion**: All leads with `qualified_at IS NOT NULL`. Leads that subsequently transitioned to `Lost` remain counted in historical qualified cohorts.

#### KPI 05: Completed Site Visits
- **Definition**: Verified on-site or digital property visits actually conducted with customer attendance.
- **Formula**:
  $$\text{Completed Site Visits} = \text{COUNT}(\text{site\_visits } sv \mid sv.\text{status} = \text{'Completed'})$$

#### KPI 06: Confirmed Bookings (Bookings Velocity)
- **Definition**: Total customer reservations that have cleared token payment and contract confirmation.
- **Formula**:
  $$\text{Confirmed Bookings} = \text{COUNT}(\text{bookings } b \mid b.\text{booking\_status} \in \{\text{'Confirmed'}, \text{'Completed'}\})$$

#### KPI 07: Total Booking Value (Gross Sales Volume)
- **Definition**: Aggregate monetary agreement value of all confirmed bookings.
- **Formula**:
  $$\text{Total Booking Value} = \sum b.\text{booking\_value} \quad \forall b \text{ where } b.\text{booking\_status} \in \{\text{'Confirmed'}, \text{'Completed'}\}$$

---

### 5.2 Efficiency & Conversion Rate KPIs

#### KPI 08: Lead Qualification Rate
- **Definition**: Proportion of incoming valid channel leads that achieve the qualification milestone.
- **Formula**:
  $$\text{Lead Qualification Rate (\%)} = \left( \frac{\text{COUNT}(\text{leads where } \text{qualified\_at IS NOT NULL})}{\text{Total Valid Leads}} \right) \times 100$$
- **Example Baseline**: $\frac{2,840}{3,860} \times 100 = 73.58\%$

#### KPI 09A: Visit Completion Rate (Visit Execution Reliability)
- **Definition**: Proportion of scheduled site visit appointments that are successfully executed.
- **Formula**:
  $$\text{Visit Completion Rate (\%)} = \left( \frac{\text{Completed Site Visits}}{\text{Scheduled Site Visits}} \right) \times 100$$
- **Example Baseline**: $\frac{1,872}{2,240} \times 100 = 83.57\%$

#### KPI 09B: Qualified Lead $\rightarrow$ Visit Rate (Visit Conversion)
- **Definition**: Proportion of qualified prospects who proceed to conduct at least one verified property tour.
- **Formula**:
  $$\text{Qualified Lead } \rightarrow \text{ Visit Rate (\%)} = \left( \frac{\text{Unique Qualified Leads with } \ge 1 \text{ Completed Visit}}{\text{Qualified Leads}} \right) \times 100$$
- **Example Baseline**: $\frac{1,377}{2,840} \times 100 = 48.49\% \approx 48.5\%$

#### KPI 10: Site Visit $\rightarrow$ Booking Rate (Close Rate)
- **Definition**: Proportion of prospects with completed site visits who finalized a unit booking.
- **Formula**:
  $$\text{Site Visit } \rightarrow \text{ Booking Rate (\%)} = \left( \frac{\text{Confirmed Bookings whose lead has } \ge 1 \text{ Completed Site Visit}}{\text{Unique Leads with } \ge 1 \text{ Completed Site Visit}} \right) \times 100$$
- **Direct Bookings Treatment**: Direct bookings without a completed site visit do **NOT** enter the numerator of this metric.
- **Example**: If 100 unique leads complete site visits, 30 of them yield confirmed bookings, and 5 direct confirmed bookings occur without site visits, the Visit $\rightarrow$ Booking Rate is $\frac{30}{100} \times 100 = 30.0\%$ (NOT $\frac{35}{100} = 35.0\%$).
- **Baseline Modeling**: $\frac{446}{1,377} \times 100 = 32.39\%$

#### KPI 11: Overall Lead $\rightarrow$ Booking Rate (End-to-End Funnel Efficiency)
- **Definition**: Overall channel pipeline conversion from initial lead referral to confirmed sale (including direct bookings).
- **Formula**:
  $$\text{End-to-End Conversion (\%)} = \left( \frac{\text{Confirmed Bookings}}{\text{Total Valid Leads}} \right) \times 100$$
- **Example Baseline**: $\frac{446}{3,860} \times 100 = 11.55\%$

---

## 6. Date Semantics & Analytical Windows

To prevent cohort skew and temporal ambiguity, date attributes are strictly partitioned:

| Event Milestone | Exact Field | Semantic Role in Reporting |
|---|---|---|
| **Lead Ingestion** | `leads.created_at` | Determines monthly lead cohort volume. |
| **Lead Qualification** | `leads.qualified_at` | Determines qualification milestone and response SLA. |
| **Site Visit Execution** | `site_visits.visited_at` | Establishes monthly footfall and visit velocity. |
| **Booking Confirmation** | `bookings.booking_date` | Establishes revenue realization and monthly sales closure numbers. |

---

## 7. Data Quality, Integrity & Validation Rules

1. **Foreign Key Completeness**:
   - `leads.project_id` must reference a valid record in `projects`.
   - `leads.channel_partner_id` must reference a valid record in `channel_partners`.
   - `site_visits.lead_id` must reference a valid `leads` record.
   - `bookings.lead_id` must reference a valid `leads` record.
2. **Project Consistency**:
   - `site_visits.project_id` must match `lead.project_id`.
   - `bookings.project_id` must match `lead.project_id`.
3. **Temporal Consistency**:
   - `site_visits.visited_at` $\ge$ `leads.created_at`.
   - `bookings.booking_date` $\ge$ `leads.created_at`.
   - `leads.converted_at` $\ge$ `leads.created_at`.
4. **Value & Range Constraints**:
   - `projects.target_units` $> 0$; `projects.available_units` $\ge 0$.
   - `bookings.booking_value` $> 0$; `bookings.token_amount` $\ge 0$.
   - `bookings.commission_rate_pct` between `0.0` and `10.0%`.
5. **Controlled Enumerations**:
   - All status fields (`partner.tier`, `project.status`, `lead.status`, `site_visit.status`, `booking.status`) must strictly adhere to the defined enums.
6. **Booking Active Status Invariant**:
   - A lead record may not have more than one concurrent active booking (status `Initiated` or `Confirmed`).
   - Terminal booking records (`Completed` and `Cancelled`) are historical records and do not count as concurrent active bookings.

---

## 8. Relational Database Schema Specification (SQLite / SQLAlchemy)

```sql
-- 1. Salespeople
CREATE TABLE salespeople (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    team VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    project_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    project_type VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL, -- Upcoming, Active, Nearly Sold Out, Completed, On Hold
    launch_date DATE NOT NULL,
    target_units INTEGER NOT NULL,
    available_units INTEGER NOT NULL,
    starting_price DECIMAL(14, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Channel Partners
CREATE TABLE channel_partners (
    id VARCHAR(36) PRIMARY KEY,
    partner_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    legal_name VARCHAR(150),
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    onboarding_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1,
    tier VARCHAR(20) NOT NULL, -- Tier 1, Tier 2, Tier 3
    channel_type VARCHAR(50) NOT NULL,
    assigned_salesperson_id VARCHAR(36) REFERENCES salespeople(id),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cp_tier ON channel_partners(tier);
CREATE INDEX idx_cp_active ON channel_partners(active);

-- 4. Leads
CREATE TABLE leads (
    id VARCHAR(36) PRIMARY KEY,
    lead_code VARCHAR(30) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    channel_partner_id VARCHAR(36) NOT NULL REFERENCES channel_partners(id),
    assigned_salesperson_id VARCHAR(36) REFERENCES salespeople(id),
    status VARCHAR(30) NOT NULL, -- New, Contacted, Qualified, Site Visit Scheduled, Site Visit Completed, Booking Initiated, Converted, Lost, Invalid
    budget_range VARCHAR(50),
    requirement_type VARCHAR(50),
    lost_reason VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    qualified_at TIMESTAMP, -- Milestone timestamp for historical qualification
    converted_at TIMESTAMP,
    lost_at TIMESTAMP,
    notes TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leads_partner ON leads(channel_partner_id);
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_leads_qualified ON leads(qualified_at);

-- 5. Site Visits
CREATE TABLE site_visits (
    id VARCHAR(36) PRIMARY KEY,
    visit_code VARCHAR(30) UNIQUE NOT NULL,
    lead_id VARCHAR(36) NOT NULL REFERENCES leads(id),
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    channel_partner_id VARCHAR(36) NOT NULL REFERENCES channel_partners(id),
    salesperson_id VARCHAR(36) REFERENCES salespeople(id),
    scheduled_at TIMESTAMP NOT NULL,
    visited_at TIMESTAMP,
    status VARCHAR(30) NOT NULL, -- Scheduled, Completed, Cancelled, No Show
    verification_type VARCHAR(50) NOT NULL, -- Digital Token, Physical Entry, QR
    outcome VARCHAR(50), -- Positive, Revisit Planned, Neutral, Not Interested
    feedback_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sv_lead ON site_visits(lead_id);
CREATE INDEX idx_sv_partner ON site_visits(channel_partner_id);
CREATE INDEX idx_sv_project ON site_visits(project_id);
CREATE INDEX idx_sv_status ON site_visits(status);

-- 6. Bookings (Lead 1 -> 0..* Booking Records, at most 1 active)
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_reference VARCHAR(30) UNIQUE NOT NULL,
    lead_id VARCHAR(36) NOT NULL REFERENCES leads(id),
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    channel_partner_id VARCHAR(36) NOT NULL REFERENCES channel_partners(id),
    salesperson_id VARCHAR(36) NOT NULL REFERENCES salespeople(id),
    unit_number VARCHAR(50) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    booking_status VARCHAR(30) NOT NULL, -- Initiated, Confirmed, Cancelled, Completed
    booking_value DECIMAL(14, 2) NOT NULL,
    token_amount DECIMAL(14, 2) NOT NULL,
    commission_rate_pct DECIMAL(5, 2) NOT NULL DEFAULT 2.0, -- Synthetic demo assumption
    commission_amount DECIMAL(14, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bk_lead ON bookings(lead_id);
CREATE INDEX idx_bk_partner ON bookings(channel_partner_id);
CREATE INDEX idx_bk_project ON bookings(project_id);
CREATE INDEX idx_bk_status ON bookings(booking_status);
CREATE INDEX idx_bk_date ON bookings(booking_date);

-- Partial index ensuring at most 1 concurrent active booking (Initiated or Confirmed) per lead:
CREATE UNIQUE INDEX idx_one_active_booking_per_lead
ON bookings(lead_id)
WHERE booking_status IN ('Initiated', 'Confirmed');

-- 7. Partner Activities
CREATE TABLE partner_activities (
    id VARCHAR(36) PRIMARY KEY,
    channel_partner_id VARCHAR(36) NOT NULL REFERENCES channel_partners(id),
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    metadata_json TEXT,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pa_partner ON partner_activities(channel_partner_id);
CREATE INDEX idx_pa_logged ON partner_activities(logged_at);
```

---

## 9. Deterministic Synthetic Dataset Specification (Phase 2B Blueprint)

To ensure reproducibility across testing, demoing, and analytics verification, the future synthetic generator will run with a fixed random seed:

```python
SEED = 42
```

### 9.1 Target Dataset Parameters
- **Timeframe**: 12 months historical window (e.g., January 2026 to December 2026).
- **Projects**: 5 distinct developer developments (Luxury Residential, Mid-Market Residential, Plotted Development, Commercial Tech Park).
- **Salespeople**: 10 internal relationship managers across 3 regional sales clusters.
- **Channel Partners**: **175 Total Partners** (18 Tier 1 Elite, 45 Tier 2 Growth, 112 Tier 3 Active).
- **Leads Volume**: ~3,800 to 4,200 leads distributed across the 12 months.
- **Site Visits Volume**: ~1,800 to 2,200 site visits.
- **Bookings Volume**: ~400 to 500 confirmed bookings.

### 9.2 Partner Performance Archetypes
The dataset must realistically model multi-tier behavior without requiring external ML:
1. **Elite Core Partners (Tier 1)**: High lead volume (30-50/mo), high conversion rates (Visit $\rightarrow$ Booking $\approx$ 25-30%), rapid follow-up.
2. **Growth / Emerging Partners (Tier 2)**: Moderate lead volume (10-25/mo), growing site visit activity, conversion rates $\approx$ 15-20%.
3. **Broad Active Base (Tier 3)**: Low frequency (1-5 leads/quarter), variable conversion rates.
4. **High-Intent Boutique Brokers**: Low lead count but very high closing ratio (NRI / Luxury focus).
5. **At-Risk / Declining Partners**: Previously active in Q1/Q2 but zero leads in Q3/Q4 (to validate future churn alerts).
6. **Dormant Partners**: Registered with zero leads or visits in the last 6 months.
