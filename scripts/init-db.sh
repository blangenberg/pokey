#!/usr/bin/env bash
set -euo pipefail

echo "==> Starting DynamoDB Local container..."

podman-compose up -d dynamodb-local

echo "    Waiting for DynamoDB Local to be ready..."
sleep 2

echo "==> Creating tables..."
npx tsx scripts/init-db-schema.ts

echo "==> Database initialization complete."
