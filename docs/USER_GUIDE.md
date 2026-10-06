# User Guide — Channel Partner Intelligence

## Welcome to Channel Partner Intelligence

**Channel Partner Intelligence** is an enterprise management platform built for sales leaders, channel heads, and executive decision-makers. It provides end-to-end visibility into channel partner networks, lead pipelines, site visits, and booking velocity.

---

## 1. Product Purpose

Real estate developers and distribution businesses rely heavily on channel partners (brokers, agencies, and independent advisors). However, managing these partner networks often suffers from:
- Lack of visibility into partner productivity and engagement.
- Unclear lead attribution and conversion leakage.
- Delayed follow-ups on high-intent customer site visits.
- Difficulties in identifying top-performing brokers vs. at-risk partners.

**Channel Partner Intelligence** solves these challenges by combining real-time data feeds, automated performance tiering, and proactive recommendations into a single, clean executive dashboard.

---

## 2. Navigating the Platform

The platform features a clean left-hand navigation bar and top header that allows seamless movement across core operational areas.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Channel Partner Intelligence                                  [Admin] │
├───────────────┬────────────────────────────────────────────────────────┤
│ Overview      │  Executive Overview                                    │
│ Partners *    │  ----------------------------------------------------  │
│ Leads *       │  [ KPI 1 ]   [ KPI 2 ]   [ KPI 3 ]   [ KPI 4 ]         │
│ Site Visits * │                                                        │
│ Bookings *    │  [ Pipeline Velocity Chart ]   [ Partner Tiers ]       │
│ Projects *    │                                                        │
│ Action Ctr ** │  [ Recent Channel Activity ]   [ Attention Center ]    │
│ Reports **    │                                                        │
│ Settings      │                                                        │
└───────────────┴────────────────────────────────────────────────────────┘
* Scheduled for Phase 2 | ** Scheduled for Phase 3
```

---

## 3. Platform Modules Overview

### 3.1 Executive Overview *(Phase 2D — Harivishva Demo Environment)*
The **Executive Overview** is your real-time command center for monitoring Harivishva's Tathawade channel partner network, project funnel velocity (Skyfinia & Infinia), and operational audit stream.

> [!NOTE]
> **Demo Environment Indicator**: A subtle, persistent indicator (`Demo Environment · Synthetic Data`) informs stakeholders that all data is mathematically synthesized for simulation and preview purposes.

- **Key Performance Indicators (KPI Cards)**:
  - **Active Partners (30)**: Active brokers who logged $\ge 1$ qualifying activity within the trailing 90-day window, broken down by performance tier (Tier 1: 6, Tier 2: 8, Tier 3: 16).
  - **Channel Lead Flow (1,238)**: Valid leads received from partners across Skyfinia and Infinia, showing milestone qualification count (956 qualified leads) and overall qualification efficiency (77.2%).
  - **Visit Conversion (53.4%)**: Percentage of qualified leads who completed at least one verified property site visit in Tathawade (510 unique visited prospects out of 625 completed visits).
  - **Bookings Velocity (156 Units / ₹155.8 Cr)**: Total confirmed unit closures generated through the channel network, showing visit-to-booking efficiency (29.6%) and total revenue value.
- **Pipeline Velocity Trends**: Real-time month-by-month progression comparing inbound lead volume against completed property tours and finalized bookings across 2026.
- **Partner Tier Breakdown**: Live distribution of all 36 registered partner firms across performance tiers: Tier 1 Elite (6 firms, 16.7%), Tier 2 Growth (10 firms, 27.8%), and Tier 3 Active (20 firms, 55.6%).
- **Recent Channel Activity**: Live stream of verified actions (lead submissions, site visits, booking tokens, and tier changes) logged in the database audit ledger for Skyfinia and Infinia.
- **Attention Center**: Deterministic operational notices highlighting key pipeline events (such as direct bookings executed without prior completed visits).

---

### 3.2 Channel Partners Portfolio & Analytics *(Phase 2D — Live Database-Backed)*
A focused enterprise management view of 36 channel partners servicing Harivishva's Tathawade developments, powered by real-time database queries, portfolio-first card presentation, and in-depth visual analytics.

- **Portfolio Summary Context Strip**:
  - Live network-wide metrics displayed above the partner deck: Total Partners (36), Trailing 90-Day Active Partners (30), Tier 1 Elite (6), Tier 2 Growth (10), and Tier 3 Active (20).
- **Cards vs. List View Toggle**:
  - **Cards View (Default)**: Visual portfolio grid (3 cards/row desktop, 2 cards/row tablet, 1 card/row mobile) designed for executive scanning. Each card surfaces identity, tier badge, active status, operational city/locality (Tathawade, Wakad, Hinjawadi, Ravet, Punawale, Baner), assigned relationship manager, lead/visit/booking volume chips, overall conversion percentage, and visit-to-booking efficiency.
  - **List View**: High-density operational data table providing tabular comparison and granular column alignment.
- **Search & Multi-Criteria Filtering**:
  - **Debounced Global Search**: Instantly find partners by commercial agency name, principal contact person, or unique partner code (e.g. `CP-1001`).
  - **Tier Filter**: Filter by business performance classification (Tier 1 Elite, Tier 2 Growth, Tier 3 Active).
  - **Account Status Filter**: Switch between Active and Inactive partner accounts.
  - **Operational Locality Filter**: Slice partner networks by Pune micro-market (Tathawade, Wakad, Hinjawadi, Ravet, Punawale, Baner).
  - **Deterministic Sorting**: Sort partner records by Name (A-Z), Onboarding Date (Newest first), or Tier.
- **Server-Side API Pagination**: Fast page transitions through real API pagination (`page` and `page_size`) across both Cards and List views.
- **Partner Detail & Visual Analytics**:
  - Clicking any partner card or row navigates to the dedicated **Partner Detail View**.
  - **Sticky Sidebar & Ergonomics**: Desktop sidebar remains permanently pinned and accessible during vertical scrolling without page-level horizontal overflow.
  - **Profile & Relationship Manager**: Verified contact information, office neighborhood, onboarding timestamp, and assigned internal developer sales manager (`@harivishva.com`).
  - **KPI Summary**: 4 primary volume cards (Total Leads, Milestone-Qualified Leads, Completed Site Visits, Confirmed Bookings).
  - **4-Stage Funnel Flow**: Visual progression through *Inbound Leads → Qualified Leads → Visited Prospects → Confirmed Bookings*, highlighting drop-offs and stage conversion ratios.
  - **Visual Analytics Section**:
    - **Partner Funnel Trend (Area Chart)**: 12-month chronological progression comparing valid leads, completed visits, and confirmed unit bookings across 2026.
    - **Project Booking Contribution (Horizontal Bar Chart)**: Real-time unit closure contribution per developer project (Skyfinia Phase 1, Skyfinia Phase 2, Infinia Phase 1, Infinia Phase 2), sorted in descending order of confirmed bookings.
  - **Conversion Rates Matrix**: Instant breakdown of Lead Qualification Rate, Visit Completion Rate, Qualified Lead → Visit Rate, Site Visit → Booking Rate, and Overall Conversion Rate.
  - **Bounded Activity Viewports**:
    - **Recent Inbound Leads**: Bounded internal viewport (`max-h-[270px]`) showing the latest 10 inbound customer leads with sticky table headers and internal vertical scrolling.
    - **Recent Booking Closures**: Bounded internal viewport (`max-h-[270px]`) showing the latest 10 booking closures with compact columns, preventing horizontal overflow.
  - **Back Navigation**: Quick return button to directory while preserving previous pagination and filter state.

---

### 3.3 Channel Leads Pipeline *(Scheduled for Phase 2)*
Monitors every customer lead brought in by partners.
- **Source Attribution**: Instant tracking of which broker generated each prospect.
- **Pipeline Stages**: Real-time status stages (Fresh, Contacted, Qualified, Site Visit Scheduled, Closed).
- **Follow-up SLA Tracking**: Identification of stagnant leads requiring immediate developer intervention.

---

### 3.4 Site Visits & Verification *(Scheduled for Phase 2)*
Tracks customer footfall and property visits.
- **Visit Verification**: Digital token/OTP check-ins at project sales centers to eliminate attribution disputes.
- **Visit Outcomes**: Positive interest, revisit scheduled, or cold status.
- **Partner Conversion Ratios**: Comparison of visit-to-booking efficiency across brokers.

---

### 3.5 Bookings & Revenue *(Scheduled for Phase 2)*
Financial and unit closure tracking.
- **Unit Closures**: Confirmed bookings, token payments, and agreement registrations.
- **Broker Commissions**: Real-time commission accruals, payout milestones, and settlement timelines.

---

### 3.6 Projects Portfolio & Project Detail *(Phase 2E — Live Database-Backed)*
Development project inventory, funnel velocity, and partner channel contributions across Harivishva's Tathawade developments.

- **Portfolio Summary Context Strip**:
  - Surfaces total canonical projects (4), project families (2: Skyfinia & Infinia), planned target units (1,250), available unsold inventory (1,092), confirmed bookings (158), and gross sales value (₹158.34 Cr).
- **Projects Directory Deck**:
  - Visual cards representing all 4 development assets: *Skyfinia Phase 1*, *Skyfinia Phase 2*, *Infinia Phase 1*, and *Infinia Phase 2*.
  - Displays project family badge, status, location (`Tathawade, Pune`), starting price floor (synthetic), target/available/booked units, lead volume, completed visits, confirmed bookings, and sales volume.
- **Search & Multi-Criteria Filtering**:
  - **Debounced Search**: Filter by project name or code (e.g. `prj-sky-p1`).
  - **Family Filter**: Slices developments by family (`Skyfinia`, `Infinia`).
  - **Status Filter**: Filters by development state (`Active`, `Nearly Sold Out`, `Upcoming`, `Completed`).
  - **Deterministic Sorting**: Sort by Name (A-Z), Target Units, Available Units, Booked Units, or Gross Sales Value.
- **Project Detail View**:
  - Clicking **View Project →** opens the project detail page.
  - **Header & Inventory Box**: Identity badges, location, launch date, starting price floor, and inventory allocation progress bar (Target, Available, Booked, % Utilization).
  - **6-KPI Performance Strip**: Valid Leads, Milestone-Qualified Leads, Completed Site Visits, Confirmed Bookings, Gross Booking Value (INR), and Overall Lead → Booking Conversion Rate.
  - **4-Stage Funnel Flow**: *Valid Leads → Qualified Leads → Visited Prospects → Confirmed Bookings* with stage conversion rates.
  - **12-Month Pipeline Velocity Chart**: Chronological Recharts area visualization tracking valid leads, completed site visits, and confirmed bookings across 2026.
  - **Top Contributing Channel Partners Table**: Top 10 brokerage firms delivering verified leads and confirmed bookings for this project, with direct navigation to the partner's profile.
  - **Recent Project Bookings Table**: Bounded internal viewport (`max-h-[300px]`) detailing the latest confirmed unit closures.

---

### 3.7 Global Customer Search & Customer Lifecycle Investigation *(Phase 2 QA/UX)*

The top application header includes a global customer search field:

`Search customer, lead, phone...`

#### How to Search for a Customer
1. Type at least **2 characters** into the search field (e.g. `Aarav`, `9822099901`, `aarav.mehta@example.com`, or `LD-2026-000067`).
2. A lightweight result popover appears beneath the search bar within 300ms, showing:
   - Customer Full Name
   - Lead Business Reference (e.g. `LD-2026-000067`)
   - Current Status Badge (e.g. `Converted`, `Qualified`)
   - Assigned Project (e.g. `Skyfinia Phase 1`)
   - Referring Channel Partner (e.g. `Elite Realty Partners`)
3. Click any result item to navigate immediately to the dedicated **Customer Detail View** at `/customers/[leadId]`.

#### How to Inspect Customer Booking Lifecycle & Replacement History
On the Customer Detail page:
- **Customer Identity**: View full contact info (phone, email, budget range, requirement type) and lead status.
- **Attribution**: Inspect assigned developer project, relationship manager (`@harivishva.com`), and click the referring channel partner badge to view the broker's performance profile.
- **Site Visit History**: Review all scheduled and completed property tours, verification methods, and visit outcomes.
- **Booking & Lifecycle History**:
  - **Three-Event Chronological Timeline**: Visually renders the complete lifecycle journey:
    1. **Booking Attempted** (Nov 17, 2026 · 08:48 AM) — `BK-2026-000014`, `Unit 773`, `3 BHK Luxury`, `Skyfinia Phase 1`.
    2. **Booking Cancelled** (Nov 19, 2026 · 09:54 AM) — `BK-2026-000014`, `Unit 773`, *Cancellation recorded*.
    3. **Replacement Booking Confirmed** (Nov 22, 2026 · 09:01 PM) — `BK-2026-000015`, `Unit 1706`, `3 BHK Luxury`, `Skyfinia Phase 1`, *Status: Confirmed*.
  - **Raw Booking Records Table**: Displayed beneath the timeline, detailing underlying database transactions, token amounts, commission calculations, and contract values.

---

### 3.8 Action Center *(Scheduled for Phase 3)*
Intelligent decision-support engine.
- **Automated Alerts**: Proactive notifications for at-risk partners slipping in activity.
- **Targeted Campaigns**: Recommended incentives for brokers with high customer pipelines.

---

### 3.9 Reports & Analytics Studio *(Scheduled for Phase 3)*
Custom report builder and export center.
- **Executive Summaries**: Scheduled weekly PDF digests delivered directly to stakeholders.
- **Custom Exports**: Filtered CSV data exports for external accounting and CRM synchronization.

---

### 3.10 Settings & System Diagnostics *(Configuration)*
System administrator settings, API connectivity indicators, and role permissions.

---

## 4. Current Status Notice

> **Note**: The platform has completed **Phase 1 (Foundation & UI System)**, **Phase 2A (Business Domain & KPI Specification)**, **Phase 2B (Database Models & Deterministic Seeding)**, **Phase 2C (Executive Overview & Channel Partners Portfolio Slice)**, **Phase 2D (Harivishva Demo Personalization)**, and **Phase 2 QA/UX (Global Customer Search & Deterministic Booking Lifecycle)**.

