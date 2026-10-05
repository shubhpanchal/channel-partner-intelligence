#!/usr/bin/env bash
set -e
echo "=========================================="
echo "Running Backend Tests & Coverage Check..."
echo "=========================================="
cd "$(dirname "$0")/../backend"
source .venv/bin/activate || source .venv/Scripts/activate
pytest tests --cov=app --cov-report=term-missing --cov-fail-under=85

echo ""
echo "=========================================="
echo "Running Frontend Tests & Coverage Check..."
echo "=========================================="
cd "$(dirname "$0")/../frontend"
npm run test:coverage

echo ""
echo "All Quality Gates Passed (>85% Coverage)!"
