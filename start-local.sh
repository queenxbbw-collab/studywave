#!/bin/bash
echo "========================================"
echo " StudyWave - Local Startup"
echo "========================================"
echo

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "ERROR: .env file not found!"
  echo "Copy .env.example to .env and fill in your database details."
  exit 1
fi

# Load .env
export $(grep -v '^#' .env | xargs)

# Install dependencies
echo "Installing dependencies..."
pnpm install || { echo "ERROR: pnpm install failed"; exit 1; }

# Push database schema
echo
echo "Setting up database..."
cd lib/db && npm run push-force
cd ../..

# Build frontend
echo
echo "Building frontend..."
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/studywave run build

# Build API server
echo
echo "Building API server..."
pnpm --filter @workspace/api-server run build

# Start
echo
echo "========================================"
echo " Starting StudyWave on http://localhost:${PORT:-3000}"
echo "========================================"
echo
NODE_ENV=production pnpm --filter @workspace/api-server run start
