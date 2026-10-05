#!/usr/bin/env bash
set -e
echo "Starting Channel Partner Intelligence Frontend on http://localhost:3000..."
cd "$(dirname "$0")/../frontend"
npm run dev
