#!/usr/bin/env bash
set -e
echo "Starting Channel Partner Intelligence Backend on http://127.0.0.1:8000..."
cd "$(dirname "$0")/../backend"
source .venv/bin/activate || source .venv/Scripts/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
