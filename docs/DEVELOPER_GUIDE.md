# Developer Guide — Channel Partner Intelligence

## 1. Project Purpose & Overview

**Channel Partner Intelligence** is an enterprise-grade analytics and decision-support platform designed to monitor, analyze, and optimize channel partner (broker/agent) performance across real estate and multi-tier distribution networks.

### Current Status: Phase 1 — Foundation, Design System & Quality Gates
Phase 1 establishes a rock-solid, production-quality foundation with:
- Strict separation between frontend and backend.
- A light, enterprise B2B SaaS design system (no dark theme).
- Modern component primitives built with shadcn/ui principles.
- Purposeful motion and layout transitions.
- Reusable state patterns (Loading, Empty, Error).
- Automated test suites with **>85% coverage quality gates**.
- Standardized environment handling and configuration.

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
├── backend/                      # FastAPI + Pydantic + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/               # Versioned API routes (health, future analytics)
│   │   ├── core/                 # Config (BaseSettings), Database session & health
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── tests/                    # Pytest unit & integration test suites
│   ├── pyproject.toml            # Pytest + Coverage config (>85% fail-under)
│   └── requirements.txt          # Python dependencies
│
├── docs/                         # Documentation (Developer Guide, User Guide)
├── data/                         # SQLite databases & future dataset storage
├── scripts/                      # Startup & quality validation scripts
├── .env.example                  # Environment template
└── README.md                     # Project overview & quickstart
```

---

## 3. Prerequisites

- **Python**: 3.10+ (tested on Python 3.11.9)
- **Node.js**: 18.17+ / 20+ / 24+ (tested on Node v24.15.0)
- **npm**: 9+ / 10+ / 11+
- **Git**: 2.30+

---

## 4. Environment Setup

### 4.1 Backend Virtual Environment (`backend/.venv`)

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

### 4.2 Frontend Dependencies

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies via npm
npm install
```

### 4.3 Environment Variables

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

## 5. Running the Application Locally

### 5.1 Starting the Backend Server

```bash
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Root: `http://127.0.0.1:8000/`
- Health Endpoint: `http://127.0.0.1:8000/health` (and `http://127.0.0.1:8000/api/v1/health`)
- Interactive Swagger UI: `http://127.0.0.1:8000/api/v1/docs`

### 5.2 Starting the Frontend Server

```bash
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:3000`

### 5.3 Using Convenient Helper Scripts

```bash
# Start backend (PowerShell)
.\scripts\run_backend.ps1

# Start frontend (PowerShell)
.\scripts\run_frontend.ps1
```

---

## 6. Testing & Quality Gates

Quality gates are enforced to ensure that code coverage never drops below **85%** (targeting 90%+).

### 6.1 Backend Tests & Coverage

```bash
cd backend
.\.venv\Scripts\python.exe -m pytest tests --cov=app --cov-report=term-missing --cov-fail-under=85
```
*Current result: 100% tests pass, **96.12% line coverage**.*

### 6.2 Frontend Tests & Coverage

```bash
cd frontend
npm run test:coverage
```
*Current result: 18/18 tests pass, **99.69% line coverage**, **94.62% branch coverage**.*

### 6.3 End-to-End Tests (Playwright)

```bash
cd frontend
npm run test:e2e
```

### 6.4 Unified Test Script

```bash
.\scripts\run_tests.ps1
```

---

## 7. Linting & Type Safety

### 7.1 Backend Linting (Ruff)

```bash
cd backend
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\ruff.exe format .
```

### 7.2 Frontend Linting & Typecheck (ESLint & TypeScript)

```bash
cd frontend
npm run lint
npm run build
```

---

## 8. Design System & UI Architecture

### 8.1 Visual Philosophy
- **Light Theme Only**: High contrast, crisp white cards (`#ffffff`), light slate background (`#f8fafc`). Dark theme is intentionally omitted to maintain an analytical enterprise aesthetic.
- **Primary Accent**: Refined royal navy / sapphire blue (`#2563eb`).
- **Semantic Statuses**:
  - `success`: Emerald (`#10b981` / bg `#ecfdf5`)
  - `warning`: Amber (`#f59e0b` / bg `#fffbeb`)
  - `danger`: Rose (`#ef4444` / bg `#fef2f2`)
  - `info`: Sky (`#0284c7` / bg `#f0f9ff`)
  - `neutral`: Slate (`#64748b` / bg `#f1f5f9`)

### 8.2 Motion Guidelines
- Purposeful, subtle animations only (page entrance, tab switching, card hover).
- Respect `prefers-reduced-motion`.
- Avoid decorative loops, excessive bounces, or heavy 3D elements.

### 8.3 Standard Reusable UI States
Every asynchronous component or data view must support:
- `LoadingState` (`@/components/common/loading-state`): Supports spinner or skeleton variant.
- `EmptyState` (`@/components/common/empty-state`): Displays illustrative icon, title, description, and action CTA.
- `ErrorState` (`@/components/common/error-state`): Displays error message and retry trigger.

---

## 9. Future Phase Roadmap

- **Phase 2**: Partner registry, lead pipeline attribution, site visit logs, bookings velocity, SQLite schema expansion, and synthetic dataset generation.
- **Phase 3**: Action Center algorithmic triggers, AI assistant integration, advanced churn warning indicators, and reporting studio.

---

## 10. Troubleshooting

- **Port Conflict (8000 or 3000)**: Check if another service is using the port or pass `--port 8001` to uvicorn.
- **Vitest Missing Canvas/ResizeObserver in JSDOM**: `frontend/vitest.setup.ts` automatically polyfills `ResizeObserver` and `matchMedia` for Recharts.
- **CORS Issues**: Ensure `BACKEND_CORS_ORIGINS` in `.env` includes your frontend port (`http://localhost:3000`).
