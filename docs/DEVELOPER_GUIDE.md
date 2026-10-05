# Developer Guide — Channel Partner Intelligence

## 1. Project Purpose & Overview

**Channel Partner Intelligence** is an enterprise-grade analytics and decision-support platform designed to monitor, analyze, and optimize channel partner (broker/agent) performance across real estate and multi-tier distribution networks.

### Current Status: Phase 2B — Database Implementation & Deterministic Synthetic Data
- **Phase 1 Complete**: Light B2B SaaS UI foundation, design tokens, reusable states, and test quality gates established.
- **Phase 2A Complete**: Formally defined business domain model ([`docs/BUSINESS_DOMAIN.md`](file:///c:/Users/User/OneDrive/Desktop/channel-partner-intelligence/docs/BUSINESS_DOMAIN.md)) and REST API contracts ([`docs/API_CONTRACTS.md`](file:///c:/Users/User/OneDrive/Desktop/channel-partner-intelligence/docs/API_CONTRACTS.md)).
- **Phase 2B Complete**: SQLAlchemy 2.0 database models, SQLite schema with foreign keys and partial unique indexes, deterministic synthetic data generator (`SEED = 42`), comprehensive data-integrity validator, and backend CLI management tools.
- Strict quality gates enforced across both backend (>99% coverage) and frontend (>99% coverage).

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
│   │   ├── lib/                  # Utility functions (cn helper, formatting)
│   │   └── __tests__/            # Vitest unit & component test suites
│   ├── e2e/                      # Playwright end-to-end test suites
│   ├── vitest.config.ts          # Vitest + V8 coverage configuration (>85% thresholds)
│   └── package.json
│
├── backend/                      # FastAPI + Pydantic + SQLAlchemy 2.0 + SQLite
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/               # Versioned API routes (health check)
│   │   ├── core/                 # Config (BaseSettings), Database engine & domain semantics
│   │   ├── models/               # SQLAlchemy 2.0 entities (Salesperson, Project, ChannelPartner, Lead, SiteVisit, Booking, PartnerActivity)
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

## 3. Database Architecture & SQLite Configuration

### 3.1 SQLAlchemy 2.0 Models
All database models are implemented using typed SQLAlchemy 2.0 declarative definitions in [`backend/app/models/entities.py`](file:///c:/Users/User/OneDrive/Desktop/channel-partner-intelligence/backend/app/models/entities.py):
- **`Salesperson`** (`salespeople`): Internal developer sales managers and team clusters.
- **`Project`** (`projects`): Real estate assets with dynamic unit inventory tracking.
- **`ChannelPartner`** (`channel_partners`): Brokerages and consultants partitioned into Tier 1 (18), Tier 2 (45), and Tier 3 (112).
- **`Lead`** (`leads`): Customer prospects with milestone qualification (`qualified_at`).
- **`SiteVisit`** (`site_visits`): Scheduled and completed physical or digital tours.
- **`Booking`** (`bookings`): Transaction records with active vs terminal status tracking.
- **`PartnerActivity`** (`partner_activities`): Historical touchpoint audit ledger.

### 3.2 SQLite Foreign Keys & Partial Unique Indexes
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

## 4. Database Management & Seeding CLI

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

## 5. Prerequisites

- **Python**: 3.10+ (tested on Python 3.11.9)
- **Node.js**: 18.17+ / 20+ / 24+ (tested on Node v24.15.0)
- **npm**: 9+ / 10+ / 11+
- **Git**: 2.30+

---

## 6. Environment Setup

### 6.1 Backend Virtual Environment (`backend/.venv`)

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

### 6.2 Frontend Dependencies

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies via npm
npm install
```

### 6.3 Environment Variables

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

## 7. Running the Application Locally

### 7.1 Starting the Backend Server

```bash
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Root: `http://127.0.0.1:8000/`
- Health Endpoint: `http://127.0.0.1:8000/health` (and `http://127.0.0.1:8000/api/v1/health`)
- Interactive Swagger UI: `http://127.0.0.1:8000/api/v1/docs`

### 7.2 Starting the Frontend Server

```bash
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:3000`

---

## 8. Testing & Quality Gates

Quality gates enforce that code coverage never drops below **85%**. Current project status: **>99% coverage** on both backend and frontend.

### 8.1 Backend Tests & Coverage

```bash
cd backend
python -m pytest tests --cov=app --cov-report=term-missing
```

### 8.2 Backend Linter (Ruff)

```bash
cd backend
python -m ruff check .
```

### 8.3 Frontend Tests & Coverage

```bash
cd frontend
npm run test:coverage
```

### 8.4 Frontend Linter & Build

```bash
cd frontend
npm run lint
npm run build
```
