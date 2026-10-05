# Channel Partner Intelligence

[![Quality Gate](https://img.shields.io/badge/Quality%20Gate-Passing%20(%3E85%25)-emerald.svg)](#testing--coverage)
[![Phase](https://img.shields.io/badge/Phase-2A%20Domain%20Specification-blue.svg)](#current-status)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014%20%7C%20Tailwind%20CSS-000000.svg)](https://nextjs.org/)

**Channel Partner Intelligence** is a modern, enterprise analytics and decision-support platform engineered to monitor channel partner performance, lead pipelines, site visit conversions, and booking velocity across real estate distribution networks.

---

## Current Status: Phase 2A — Business Domain & Data Specification

The repository currently establishes the foundation and formal domain specification:
- **Phase 1 (Complete)**: Monorepo structure, Next.js 14 App Shell, light B2B SaaS design system, reusable UI states, and full testing quality gates.
- **Phase 2A (Complete)**: Formally defined domain entities, relationships, 4-stage funnel, exact KPI formulas, SQLite relational schema, and Phase 2C API contracts.
- **Phase 2B (Upcoming)**: SQLite database engine instantiation and deterministic synthetic dataset generator (`SEED = 42`).
- **Phase 2C (Upcoming)**: FastAPI CRUD/analytics endpoints and frontend dashboard integration.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Framer Motion, Lucide React, Recharts, TanStack Query |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, SQLite |
| **Testing** | Pytest, Pytest-Cov, Vitest, React Testing Library, JSDOM, Playwright (E2E) |
| **Code Quality** | ESLint, Ruff, TypeScript Strict Mode |

---

## Directory Structure

```
Channel Partner Intelligence/
│
├── frontend/                     # Next.js frontend application
│   ├── src/
│   │   ├── app/                  # Next.js App Router (layout, page, providers)
│   │   ├── components/           # UI primitives, layout shell, dashboard views
│   │   ├── lib/                  # Utilities (clsx, tailwind-merge)
│   │   └── __tests__/            # Component & view test suites
│   ├── e2e/                      # Playwright end-to-end tests
│   └── package.json
│
├── backend/                      # FastAPI backend application
│   ├── app/
│   │   ├── api/v1/               # Versioned API routes (health)
│   │   ├── core/                 # Config, Settings, Database engine & session
│   │   └── main.py               # FastAPI entry point
│   ├── tests/                    # Pytest test suites
│   └── requirements.txt          # Python dependencies
│
├── docs/                         # Detailed guides & specifications
│   ├── BUSINESS_DOMAIN.md        # Entities, funnel, KPIs, data quality & schema
│   ├── API_CONTRACTS.md          # Phase 2C REST API specifications
│   ├── DEVELOPER_GUIDE.md        # Technical developer guide
│   └── USER_GUIDE.md             # Non-technical end-user guide
├── data/                         # Local database & storage placeholder
├── scripts/                      # Startup & test scripts
├── .env.example                  # Environment configuration template
└── README.md
```

---

## Quickstart Guide

### 1. Clone & Configure Environment

```bash
git clone https://github.com/shubhpanchal/channel-partner-intelligence.git
cd channel-partner-intelligence

# Copy environment file
cp .env.example .env
```

### 2. Backend Setup & Startup

```bash
cd backend

# Create & activate Python virtual environment
python -m venv .venv

# On Windows:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
python -m pip install -r requirements-dev.txt

# Start backend server (http://127.0.0.1:8000)
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Health Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **API Documentation**: [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)

### 3. Frontend Setup & Startup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server (http://localhost:3000)
npm run dev
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)

---

## Testing & Quality Gates

The project enforces a strict quality gate: **test coverage must exceed 85%**.

| Component | Test Suite | Line Coverage | Branch Coverage | Quality Gate Threshold | Status |
|---|---|---|---|---|---|
| **Backend** | Pytest (`12 tests`) | **100.00%** | **95.00%** | >= 85.0% | **PASSED** |
| **Frontend** | Vitest (`21 tests`) | **99.70%** | **95.19%** | >= 85.0% | **PASSED** |

### Run Tests Individually

```bash
# Backend tests & coverage
cd backend
.\.venv\Scripts\python.exe -m pytest tests --cov=app --cov-report=term-missing --cov-fail-under=85

# Frontend tests & coverage
cd frontend
npm run test:coverage

# Frontend Lint & Typecheck
npm run lint
npm run build
```

### Run All Tests via Script

```bash
# Windows PowerShell
.\scripts\run_tests.ps1

# Linux / macOS
./scripts/run_tests.sh
```

---

## Documentation Links

- [Business Domain & KPI Specification](file:///docs/BUSINESS_DOMAIN.md)
- [API Contracts Specification](file:///docs/API_CONTRACTS.md)
- [Developer Guide (Architecture, Setup, Conventions)](file:///docs/DEVELOPER_GUIDE.md)
- [User Guide (Product Vision, Modules, Navigation)](file:///docs/USER_GUIDE.md)
- [Test Infrastructure Reference](file:///tests/README.md)

---

## Development Principles

1. **Phase-Gated Evolution**: Business functionality (partner scoring, synthetic data, lead tracking) is deferred to subsequent phases to maintain architectural integrity.
2. **Quality First**: All new code must be accompanied by comprehensive tests satisfying the >85% coverage threshold.
3. **No Paid/Proprietary Dependencies**: The entire stack relies exclusively on open-source libraries (free Motion core, standard shadcn/ui primitives).
4. **Clean Enterprise Light Aesthetics**: Highly readable, high-contrast B2B SaaS interface built for executive clarity.