# Business Domain, Data Model & KPI Specification

**Project**: Channel Partner Intelligence  
**Document Version**: 2.0.0 (Phase 2A)  
**Status**: Specification Approved  

---

## 1. Product Purpose & Executive Principles

### 1.1 Core Mission
**Channel Partner Intelligence** is a specialized analytical and decision-support platform designed for real estate developers (e.g., Hariwishwa) and distribution heads. It provides executive visibility into channel partner (broker/agency) networks, inbound lead attribution, property site visit conversions, and booking velocity.

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
│ Partner Activity │               │   Site Visit    │               │     Booking     │
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
  - `created_at`: Exact timestamp when lead entered the system (**Lead Date**).
  - `qualified_at`: Timestamp when lead passed qualification checks (Nullable).
  - `converted_at`: Timestamp when lead reached finalized booking (Nullable).
  - `lost_at`: Timestamp when lead was marked lost (Nullable).
  - `updated_at`: ISO-8601 UTC timestamp.

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
  - `visited_at`: Actual completed timestamp of visit (**Visit Date**).
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
  - `lead_id`: Foreign key to `leads.id` (**Required**; unique per active booking).
  - `project_id`: Foreign key to `projects.id` (**Required**).
  - `channel_partner_id`: Foreign key to `channel_partners.id` (**Required**).
  - `salesperson_id`: Foreign key to `salespeople.id` (**Required**).
  - `unit_number`: Physical unit descriptor (e.g., "Tower A - Unit 1402").
  - `unit_type`: Unit configuration (e.g., "3 BHK Premium").
  - `booking_date`: Official date of token receipt and booking signing (**Booking Date**).
  - `booking_status`: Transaction status (`Initiated`, `Confirmed`, `Cancelled`, `Completed`).
  - `booking_value`: Agreed agreement value in INR (e.g., `12500000` = ₹1.25 Cr).
  - `token_amount`: Earnest token amount received (e.g., `200000` = ₹2 Lakh).
  - `commission_rate_pct`: Brokerage commission percentage (e.g., `2.0` = 2.0%).
  - `commission_amount`: Computed commission amount in INR (e.g., `250000`).
  - `created_at`, `updated_at`: ISO-8601 UTC timestamps.

#### Booking Status Lifecycle
- `Initiated`: Booking form filled and token cheque/gateway transaction submitted; pending bank clearance.
- `Confirmed`: Token cleared; unit officially reserved in developer inventory. **Counts towards core booking KPIs.**
- `Cancelled`: Customer or developer cancelled reservation; unit returned to available inventory.
- `Completed`: Full agreement registered; demand milestone schedule active.

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
| `leads` | `bookings` | `1` to `0..1` | A lead can have at most one active/confirmed booking. |
| `projects` | `site_visits` | `1` to `0..*` | Site visits occur at a designated project location. |
| `projects` | `bookings` | `1` to `0..*` | Bookings reserve units within a designated project. |
| `channel_partners` | `bookings` | `1` to `0..*` | Bookings are attributed to the referring partner. |
| `channel_partners` | `partner_activities`| `1` to `0..*` | All major partner touchpoints stream into activity logs. |

---

## 4. Funnel Definition & Progression Logic

### 4.1 The 4-Stage Official Funnel

```
Stage 1: TOTAL LEADS
  │
  │  (Qualification Filter: Status >= Qualified)
  ▼
Stage 2: QUALIFIED LEADS
  │
  │  (Visit Verification: Status = 'Completed')
  ▼
Stage 3: COMPLETED SITE VISITS
  │
  │  (Transaction Confirmation: Booking Status IN ('Confirmed', 'Completed'))
  ▼
Stage 4: CONFIRMED BOOKINGS
```

### 4.2 Edge Cases and Exception Handling

| Edge Case Scenario | Funnel Treatment | KPI Impact |
|---|---|---|
| **Direct Booking without Site Visit** | Prospect books immediately (e.g., NRI investor). | Lead counted in Stage 1, Stage 2, and Stage 4. Does not inflate Stage 3 (Site Visits). Overall Lead $\rightarrow$ Booking rate accounts for this correctly. |
| **Multiple Site Visits for Single Lead** | Lead visits project 3 times before deciding. | Total Site Visits count = 3. Unique Leads with Visit = 1. Funnel conversion rate uses unique lead attribution to prevent >100% ratios. |
| **Cancelled / No-Show Site Visit** | Visit is scheduled but customer does not attend. | Counted in `Total Scheduled Visits`, excluded from `Completed Site Visits`. |
| **Cancelled Booking after Token** | Token fails or buyer backs out. | Recorded in `Initiated Bookings`, excluded from `Confirmed Bookings`. Unit inventory restored. |
| **Invalid / Duplicate Lead** | Wrong contact number or duplicate referral. | Flagged as `status = 'Invalid'`. Excluded from qualification and conversion rate denominators. |

---

## 5. Formal KPI Definitions & Formulas

### 5.1 Volume & Count KPIs

#### KPI 01: Total Partners
- **Definition**: Total number of channel partner brokerages on boarded in the system.
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

#### KPI 04: Qualified Leads
- **Definition**: Leads that satisfy developer qualification criteria (budget match, timeline match, valid contact).
- **Formula**:
  $$\text{Qualified Leads} = \text{COUNT}(\text{leads } l \mid l.\text{status} \in \{\text{'Qualified'}, \text{'Site Visit Scheduled'}, \text{'Site Visit Completed'}, \text{'Booking Initiated'}, \text{'Converted'}\})$$

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
- **Definition**: Proportion of incoming channel leads that qualify for project engagement.
- **Formula**:
  $$\text{Lead Qualification Rate (\%)} = \left( \frac{\text{Qualified Leads}}{\text{Total Valid Leads}} \right) \times 100$$

#### KPI 09: Qualified Lead to Visit Rate (Visit Conversion)
- **Definition**: Proportion of qualified prospects who proceed to conduct a verified property tour.
- **Formula**:
  $$\text{Visit Conversion (\%)} = \left( \frac{\text{Unique Qualified Leads with } \ge 1 \text{ Completed Visit}}{\text{Qualified Leads}} \right) \times 100$$

#### KPI 10: Site Visit to Booking Rate (Close Conversion)
- **Definition**: Proportion of conducted site visits that result in an executed unit booking.
- **Formula**:
  $$\text{Visit to Booking Rate (\%)} = \left( \frac{\text{Confirmed Bookings}}{\text{Completed Site Visits}} \right) \times 100$$

#### KPI 11: Overall Lead to Booking Rate (End-to-End Funnel Efficiency)
- **Definition**: Overall channel pipeline conversion from initial lead referral to confirmed sale.
- **Formula**:
  $$\text{End-to-End Conversion (\%)} = \left( \frac{\text{Confirmed Bookings}}{\text{Total Valid Leads}} \right) \times 100$$

---

## 6. Date Semantics & Analytical Windows

To prevent cohort skew and temporal ambiguity, date attributes are strictly partitioned:

| Event Milestone | Exact Field | Semantic Role in Reporting |
|---|---|---|
| **Lead Ingestion** | `leads.created_at` | Determines monthly lead cohort volume. |
| **Lead Qualification** | `leads.qualified_at` | Evaluates salesperson/partner response SLA. |
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
    qualified_at TIMESTAMP,
    converted_at TIMESTAMP,
    lost_at TIMESTAMP,
    notes TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leads_partner ON leads(channel_partner_id);
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);

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

-- 6. Bookings
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_reference VARCHAR(30) UNIQUE NOT NULL,
    lead_id VARCHAR(36) UNIQUE NOT NULL REFERENCES leads(id),
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
    channel_partner_id VARCHAR(36) NOT NULL REFERENCES channel_partners(id),
    salesperson_id VARCHAR(36) NOT NULL REFERENCES salespeople(id),
    unit_number VARCHAR(50) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    booking_status VARCHAR(30) NOT NULL, -- Initiated, Confirmed, Cancelled, Completed
    booking_value DECIMAL(14, 2) NOT NULL,
    token_amount DECIMAL(14, 2) NOT NULL,
    commission_rate_pct DECIMAL(5, 2) NOT NULL DEFAULT 2.0,
    commission_amount DECIMAL(14, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bk_partner ON bookings(channel_partner_id);
CREATE INDEX idx_bk_project ON bookings(project_id);
CREATE INDEX idx_bk_status ON bookings(booking_status);
CREATE INDEX idx_bk_date ON bookings(booking_date);

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
