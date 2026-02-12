#!/usr/bin/env bash
set -euo pipefail

REQUIRED_MAJOR=22

echo "==> Checking Node.js version..."

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "  Install Node $REQUIRED_MAJOR via nvm:  nvm install $REQUIRED_MAJOR"
  exit 1
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -lt "$REQUIRED_MAJOR" ]; then
  echo "ERROR: Node.js $REQUIRED_MAJOR+ is required (found $NODE_VERSION)."
  echo "  Upgrade via nvm:  nvm install $REQUIRED_MAJOR && nvm use $REQUIRED_MAJOR"
  exit 1
fi

echo "    Node.js $NODE_VERSION — OK"

echo "==> Installing dependencies..."
npm install

echo "==> Node setup complete."
