#!/usr/bin/env bash
set -euo pipefail

echo "==> Stopping and removing DynamoDB Local container..."
podman-compose down dynamodb-local 2>/dev/null || true

echo "==> Starting fresh DynamoDB Local container..."
podman-compose up -d dynamodb-local

echo "    Waiting for DynamoDB Local to be ready..."
sleep 2

echo "==> Creating tables..."
npx tsx scripts/init-db-schema.ts

echo "==> Database cleaned and reinitialized."
