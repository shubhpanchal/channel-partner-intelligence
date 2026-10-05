# Test Infrastructure & Quality Gates

This directory documents the multi-layered test infrastructure for **Channel Partner Intelligence**.

## Test Architecture

The test suite is organized into three distinct layers with strict quality gates:

1. **Backend Tests (`backend/tests/`)**
   - **Framework**: `pytest`, `pytest-cov`, `pytest-asyncio`, `httpx`
   - **Scope**: API endpoints, configuration parser, database session management, error handling.
   - **Quality Gate**: Minimum 85% branch and line coverage (configured in `backend/pyproject.toml`).
   - **Command**: `cd backend && .\.venv\Scripts\python.exe -m pytest tests --cov=app --cov-report=term-missing --cov-fail-under=85`

2. **Frontend Unit & Component Tests (`frontend/src/__tests__/`)**
   - **Framework**: `Vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `v8`
   - **Scope**: Application shell, navigation state, sidebar responsiveness, header controls, overview dashboard, placeholder scope views, reusable empty/loading/error states, and UI primitives.
   - **Quality Gate**: Minimum 85% statements, lines, and functions coverage (configured in `frontend/vitest.config.ts`).
   - **Command**: `cd frontend && npm run test:coverage`

3. **End-to-End Tests (`frontend/e2e/`)**
   - **Framework**: `Playwright`
   - **Scope**: Cross-browser end-to-end user navigation journeys and dashboard rendering.
   - **Command**: `cd frontend && npm run test:e2e`

## Quality Gate Execution

To run all quality gates at once:

```bash
# PowerShell
.\scripts\run_tests.ps1

# Bash / Linux / macOS
./scripts/run_tests.sh
```
