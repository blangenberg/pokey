#!/usr/bin/env bash
set -euo pipefail

echo "==> Starting DynamoDB Local container..."

# Use docker/podman — the alias handles the mapping
docker compose up -d dynamodb-local 2>/dev/null || docker-compose up -d dynamodb-local

echo "    Waiting for DynamoDB Local to be ready..."
sleep 2

echo "==> Creating tables..."
npx tsx packages/pokey-backend/src/tables/setup.ts

echo "==> Database initialization complete."
