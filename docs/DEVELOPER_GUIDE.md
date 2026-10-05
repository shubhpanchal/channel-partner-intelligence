# Developer Guide — Channel Partner Intelligence

## 1. Project Purpose & Overview

**Channel Partner Intelligence** is an enterprise-grade analytics and decision-support platform designed to monitor, analyze, and optimize channel partner (broker/agent) performance across real estate and multi-tier distribution networks.

### Current Status: Phase 2D — Harivishva Demo Personalization
- **Phase 1 Complete**: Light B2B SaaS UI foundation, design tokens, reusable states, and test quality gates established.
- **Phase 2A Complete**: Formally defined business domain model ([`docs/BUSINESS_DOMAIN.md`](file:///c:/Users/User/OneDrive/Desktop/channel-partner-intelligence/docs/BUSINESS_DOMAIN.md)) and REST API contracts ([`docs/API_CONTRACTS.md`](file:///c:/Users/User/OneDrive/Desktop/channel-partner-intelligence/docs/API_CONTRACTS.md)).
- **Phase 2B Complete**: SQLAlchemy 2.0 database models, SQLite schema with foreign keys and partial unique indexes, deterministic synthetic data generator (`SEED = 42`), comprehensive data-integrity validator, and backend CLI management tools.
- **Phase 2C-1 Complete**: First end-to-end vertical slice connecting `GET /api/v1/overview/summary` to the Next.js frontend via TanStack Query, eliminating mock data and rendering 100% database-backed metrics.
- **Phase 2C-2 Complete**: Second end-to-end vertical slice delivering `GET /api/v1/partners` and `GET /api/v1/partners/{id}`, real-time filtering, debounced multi-field search, zero N+1 batch-grouped SQL queries, pagination, and Partner Detail view with 4-stage conversion funnels and transaction logs.
- **Phase 2D Complete**: Personalized synthetic demo tailored specifically to Harivishva's Tathawade (Pune) residential portfolio across 2 project families (Skyfinia Phase 1 & 2, Infinia Phase 1 & 2), 5 sales managers, 36 partners (6 T1, 10 T2, 20 T3), ~1,262 leads, ~728 visits, and ~156 bookings, accompanied by subtle synthetic demo context indicators.
- Strict quality gates enforced across both backend (>96% coverage) and frontend (>99% coverage).

---

## 2. System Architecture

```
Channel Partner Intelligence
│
├── frontend/                     # Next.js 14 (App Router) + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/                  # App Router entry points, layout, globals.css, providers
│   │   ├── components/
│   │   │   ├── common/           # Reusable state components (Empty, Loading, Error)
│   │   │   ├── dashboard/        # Overview view & Phase roadmap views
│   │   │   ├── layout/           # AppShell, Sidebar, Header
│   │   │   └── ui/               # shadcn/ui primitives (Button, Card, Badge, Table, etc.)
│   │   ├── hooks/                # TanStack Query custom hooks (useOverviewSummary)
│   │   ├── lib/                  # Utility functions (cn, formatting) & API clients (overviewApi)
│   │   └── __tests__/            # Vitest unit & component test suites
│   ├── e2e/                      # Playwright end-to-end test suites
│   ├── vitest.config.ts          # Vitest + V8 coverage configuration (>85% thresholds)
│   └── package.json
│
├── backend/                      # FastAPI + Pydantic + SQLAlchemy 2.0 + SQLite
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/               # Versioned API routes (overview, health check)
│   │   ├── core/                 # Config (BaseSettings), Database engine & domain semantics
│   │   ├── models/               # SQLAlchemy 2.0 entities (Salesperson, Project, ChannelPartner, Lead, SiteVisit, Booking, PartnerActivity)
│   │   ├── schemas/              # Pydantic v2 validation & response contracts (overview.py)
│   │   ├── services/             # Analytics & query services (overview_service.py)
│   │   ├── seed/                 # Deterministic synthetic data generator (seed=42) & integrity validator
│   │   ├── cli.py                # Database management and seeding CLI commands
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── tests/                    # Pytest unit & integration test suites
│   ├── pyproject.toml            # Pytest + Coverage config (>85% fail-under)
│   └── requirements.txt          # Python dependencies
│
├── docs/                         # Documentation (Domain, API contracts, Data generation, Guides)
├── scripts/                      # Startup & quality validation scripts
├── .env.example                  # Environment template
└── README.md                     # Project overview & quickstart
```

---

## 3. Overview Summary API Architecture (Phase 2C-1)

### 3.1 Service & Query Flow
The Overview Summary endpoint (`GET /api/v1/overview/summary`) adheres to clean layered architecture:
```
Client (TanStack Query) 
  ↓ HTTP GET /api/v1/overview/summary?start_date=...&end_date=...&project_id=...
FastAPI Router (backend/app/api/v1/overview.py)
  ↓ Query parameter validation (date bounds, project existence)
OverviewService (backend/app/services/overview_service.py)
  ↓ Optimized SQLAlchemy 2.0 aggregate queries + domain_semantics calculations
SQLite Database (channel_partner_intelligence.db)
  ↓
OverviewSummaryResponse (Pydantic v2 Schema in backend/app/schemas/overview.py)
```

### 3.2 Key Analytical Invariants
1. **Milestone-Based Qualification**: Counts leads where `qualified_at IS NOT NULL`, preserving historical accuracy regardless of current lead state.
2. **Visit-to-Booking Exclusion**: Direct bookings without prior completed visits (14 units in SEED=42) are excluded from the Visit-to-Booking denominator and numerator, preventing metric distortion.
3. **Trailing 90-Day Active Partners**: Considers a partner active only if `active == True` AND the partner logged $\ge 1$ `PartnerActivity` within the trailing 90 days relative to the analytical window cutoff.
4. **Deterministic Alerts**: Only surfacing verified business anomalies (e.g. direct booking notices) without unverified AI hallucinations.

### 3.3 Frontend TanStack Query Integration
- **API Client**: `frontend/src/lib/api/overview.ts` provides typed `getOverviewSummary(filters)`.
- **Query Hook**: `frontend/src/hooks/use-overview-summary.ts` exposes `useOverviewSummary(filters)` with `staleTime: 60_000` (1 minute cache).
- **Graceful States**: `OverviewView` handles initial loading with `LoadingState` skeletons, network/query errors with `ErrorState` + retry callback, and empty collections with `EmptyState`.

---

## 4. Partners API, Directory & Analytics Architecture (Phase 2C-2)

### 4.1 Service & Aggregation Approach (Zero N+1)
To prevent N+1 query degradation when rendering 20 to 100 partners per page or drilling down into individual partner performance, `PartnerService` executes a batched grouped aggregation strategy:
1. **Paginated Entities**: Selects the matching page of `ChannelPartner` entities with eager joined loading of `assigned_salesperson`.
2. **Batch Lead Statistics**: Aggregates `total_leads`, `valid_leads` (`status != 'Invalid'`), and `qualified_leads` (`qualified_at IS NOT NULL`) in a single query grouped by `channel_partner_id`.
3. **Batch Site Visit Statistics**: Groups completed site visits and unique visited lead IDs across all page partner IDs.
4. **Direct Booking Isolation**: Fetches confirmed/completed booking lead IDs and evaluates them against the partner's unique visited lead set in memory, ensuring that direct bookings without site visits do not artificially inflate `visit_to_booking_rate_pct`.
5. **Memory Synthesis**: Merges database aggregates in O(N) linear time, ensuring exactly 4 database queries per paginated request regardless of page size.

### 4.2 Partner Analytics Aggregation (Funnel Trends & Project Contribution)
When retrieving partner detail (`GET /api/v1/partners/{id}`), `PartnerService` performs partner-isolated database aggregations for real-time visual charts:
- **Monthly Funnel Trends (`monthly_trends`)**: Computes 12-month chronological progression across 2026 (Jan–Dec) by grouping:
  - Valid Inbound Leads (`Lead.status != 'Invalid'`) by month of `created_at`.
  - Completed Site Visits (`SiteVisit.status == 'Completed'`) by month of `visited_at`.
  - Confirmed Bookings (`Booking.booking_status IN ('Confirmed', 'Completed')`) by month of `booking_date`.
- **Project Booking Contribution (`project_contribution`)**: Joins `Booking` with `Project`, filtering by partner ID and confirmed/completed statuses, grouping by project and ordering descending by booking count. Projects with zero bookings for that partner are cleanly omitted.

### 4.3 Multi-Field Search & Stable Sorting
- **Multi-Field Partial Search**: Matches across `name`, `contact_person`, and `partner_code` using case-insensitive SQL `LIKE` queries.
- **Deterministic Sort Ordering**: Ties in `name`, `onboarding_date`, and `tier` sort orders are broken using secondary deterministic columns (`id` / `partner_code`), preventing unstable pagination drift across page transitions.

### 4.4 Sticky Sidebar & Responsive Layout Architecture
To ensure enterprise ergonomics across large screens while preserving mobile drawer agility:
- **Root Viewport Pinning**: `AppShell` defines `flex h-screen overflow-hidden bg-background text-foreground`, ensuring that the outer page boundary never scrolls.
- **Fixed Desktop Sidebar**: `Sidebar` is styled with `lg:h-screen lg:shrink-0` to remain permanently fixed and accessible during long vertical scrolls.
- **Independent Content Scrolling**: The main content wrapper `<main className="flex-1 overflow-y-auto min-w-0">` maintains independent vertical scrollability.
- **Mobile Drawer Agility**: Preserves the slide-out sheet drawer (`aria-label="Open sidebar"`) triggered by the mobile hamburger menu without horizontal overflow.

### 4.5 Bounded Activity Viewport Pattern
To prevent data-heavy lists from bloating page height and causing horizontal overflow:
- **Internal Viewport Height**: Recent Inbound Leads and Recent Booking Closures use bounded containers (`max-h-[270px] overflow-y-auto`).
- **Sticky Table Headers**: Table headers are configured with `sticky top-0 bg-slate-50 z-10 shadow-xs` to keep column context visible during internal scrolling.
- **Compact Desktop Columns**: High-priority fields (Booking Ref, Customer / Unit, Project, Value, Status) are styled to fit seamlessly within card boundaries without horizontal scrollbars.
- **Mobile Responsive Presentation**: On mobile viewports (<640px), compact stacked badges and truncated identifiers ensure zero page-level horizontal overflow.

### 4.6 Cards vs List Portfolio Architecture
- **Cards View (Default)**: Renders a 3-column desktop / 2-column tablet / 1-column mobile portfolio grid optimized for rapid executive scanning (Identity, Tier badge, Active status, Assigned Manager, Leads/Visits/Bookings chips, and conversion percentages).
- **List View**: Dense operational table for bulk sorting and comparative analysis.
- **Portfolio Summary Strip**: Integrates live network-wide metrics (Total Partners, Trailing 90-Day Active Partners, Tier 1/2/3 breakdown) fetched seamlessly via `useOverviewSummary()`.
- **API Pagination**: Pagination (`page`, `page_size`) operates at the server level for both Cards and List views.

### 4.7 Frontend TanStack Query Integration
- **API Client**: `frontend/src/lib/api/partners.ts` provides typed `fetchPartners(filters)` and `fetchPartnerById(id)`.
- **Query Hooks**: `frontend/src/hooks/use-partners.ts` provides `usePartners(filters)` and `usePartnerDetail(partnerId)` with automated query key caching and 60-second background freshness.
- **UI Components**:
  - `PartnersDirectoryView`: Top controls (debounced search, tier/status/city dropdowns, sorting), view switcher (`Cards | List`), Portfolio summary strip, cards grid, dense operational table, and pagination controls.
  - `PartnerDetailView`: Partner header with relationship manager card, 4 performance summary cards, 4-stage funnel flow, Recharts monthly funnel trend and project contribution charts, conversion rates matrix, and bounded viewports for recent leads and bookings.

---

## 5. Harivishva Demo Personalization & Synthetic Architecture (Phase 2D)

### 5.1 Geographic & Portfolio Specialization
The demo dataset is strictly personalized for Harivishva's **Tathawade, Pune** residential presence:
- **2 Project Families**: `Skyfinia` and `Infinia`.
- **4 Projects**: `Skyfinia Phase 1` (`PRJ-SKY-P1`), `Skyfinia Phase 2` (`PRJ-SKY-P2`), `Infinia Phase 1` (`PRJ-INF-P1`), and `Infinia Phase 2` (`PRJ-INF-P2`).
- **5 Internal Sales/Relationship Managers**: Sales leads under the `@harivishva.com` domain.
- **36 Channel Partners**: Scaled realistically for a mid-market regional developer (6 Tier 1 Elite, 10 Tier 2 Growth, 20 Tier 3 Active).

### 5.2 Determinism & Seed Behavior
- Canonical generator seed: `SEED = 42`.
- Generates 1,252 leads (1,232 valid, 963 qualified), 735 scheduled site visits (625 completed), 158 confirmed/completed bookings, and 7 cancelled booking attempts with explicit replacement chronology and unit replacement support.
- Project affinities (Skyfinia specialists, Infinia specialists, dual portfolio elite) ensure meaningful project booking contribution charts on individual partner detail pages.

### 5.3 Synthetic vs. Production Separation
- The application remains 100% reusable and cloud-native.
- No company names or business logic are hardcoded into core calculation engines or SQL models.
- Transparent badges (`Demo Environment · Synthetic Data`) provide clear executive disclosure.

---

## 6. Database Architecture & SQLite Configuration

### 6.1 SQLAlchemy 2.0 Models
All database models are implemented using typed SQLAlchemy 2.0 declarative definitions in [`backend/app/models/entities.py`](file:///c:/Users/User/OneDrive/Desktop/channel-partner-intelligence/backend/app/models/entities.py):
- **`Salesperson`** (`salespeople`): 5 internal relationship managers.
- **`Project`** (`projects`): 4 Harivishva projects across Skyfinia and Infinia.
- **`ChannelPartner`** (`channel_partners`): 36 brokerages and consultants partitioned into Tier 1 (6), Tier 2 (10), and Tier 3 (20).
- **`Lead`** (`leads`): Customer prospects with milestone qualification (`qualified_at`).
- **`SiteVisit`** (`site_visits`): Scheduled and completed physical tours in Tathawade.
- **`Booking`** (`bookings`): Transaction records with active vs terminal status tracking.
- **`PartnerActivity`** (`partner_activities`): Historical touchpoint audit ledger.

### 6.2 SQLite Foreign Keys & Partial Unique Indexes
- **Foreign Key Enforcement**: SQLite does not enable foreign keys by default. An engine event listener automatically executes `PRAGMA foreign_keys=ON;` upon establishing every connection.
- **Active Booking Invariant**: To guarantee that a lead never has more than one concurrent active booking, a SQLite partial unique index is defined:
  ```python
  Index(
      "idx_one_active_booking_per_lead",
      "lead_id",
      unique=True,
      sqlite_where=text("booking_status IN ('Initiated', 'Confirmed')"),
  )
  ```
  Terminal bookings (`Completed`, `Cancelled`) do not conflict with active bookings.

---

## 5. Database Management & Seeding CLI

A dedicated CLI is provided in [`backend/app/cli.py`](file:///c:/Users/User/OneDrive/Desktop/channel-partner-intelligence/backend/app/cli.py):

```bash
# Navigate to backend directory or run with python -m app.cli
cd backend

# 1. Initialize schema (creates tables if missing)
python -m app.cli init-db

# 2. Seed database with deterministic dataset (SEED=42)
python -m app.cli seed-db --seed 42

# 3. Validate dataset integrity, foreign keys, and funnel semantics
python -m app.cli validate-db

# 4. Drop, recreate, and reseed clean development database
python -m app.cli reset-db --seed 42
```

---

## 6. Prerequisites

- **Python**: 3.10+ (tested on Python 3.11.9)
- **Node.js**: 18.17+ / 20+ / 24+ (tested on Node v24.15.0)
- **npm**: 9+ / 10+ / 11+
- **Git**: 2.30+

---

## 7. Environment Setup

### 7.1 Backend Virtual Environment (`backend/.venv`)

```bash
# Navigate to the backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate virtual environment (Linux / macOS / Git Bash)
source .venv/bin/activate

# Upgrade pip and install development dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
```

### 7.2 Frontend Dependencies

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies via npm
npm install
```

### 7.3 Environment Variables

Copy `.env.example` at the repository root to create `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PROJECT_NAME` | `Channel Partner Intelligence` | Application name |
| `ENVIRONMENT` | `development` | Runtime mode (`development`, `production`, `test`) |
| `DEBUG` | `true` | Debug flag for interactive API documentation |
| `DATABASE_URL` | `sqlite:///./channel_partner_intelligence.db` | SQLAlchemy connection string |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000","http://127.0.0.1:3000"]` | Allowed frontend origins |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL for frontend client |

---

## 8. Running the Application Locally

### 8.1 Starting the Backend Server

```bash
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Root: `http://127.0.0.1:8000/`
- Health Endpoint: `http://127.0.0.1:8000/health` (and `http://127.0.0.1:8000/api/v1/health`)
- Interactive Swagger UI: `http://127.0.0.1:8000/api/v1/docs`

### 8.2 Starting the Frontend Server

```bash
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:3000`

---

## 9. Testing & Quality Gates

Quality gates enforce that code coverage never drops below **85%**. Current project status: **>98% coverage** on both backend and frontend.

### 9.1 Backend Tests & Coverage

```bash
cd backend
python -m pytest tests --cov=app --cov-report=term-missing
```

### 9.2 Backend Linter (Ruff)

```bash
cd backend
python -m ruff check .
```

### 9.3 Frontend Tests & Coverage

```bash
cd frontend
npm run test:coverage
```

### 9.4 Frontend Linter & Build

```bash
cd frontend
npm run lint
npm run build
```

### 9.5 End-to-End Tests (Playwright)

```bash
cd frontend
npx playwright test
```
