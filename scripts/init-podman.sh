#!/usr/bin/env bash
set -euo pipefail

echo "==> Checking for Homebrew..."

if ! command -v brew &>/dev/null; then
  echo "ERROR: Homebrew is not installed. Install it from https://brew.sh"
  exit 1
fi

echo "==> Checking for podman..."

if ! command -v podman &>/dev/null; then
  echo "    podman not found — installing via Homebrew..."
  brew install podman
  echo "    podman installed: $(podman --version)"
else
  echo "    podman found: $(podman --version)"
fi

echo "==> Checking for podman-compose..."

if ! command -v podman-compose &>/dev/null; then
  echo "    podman-compose not found — installing via Homebrew..."
  brew install podman-compose
  echo "    podman-compose installed: $(podman-compose --version)"
else
  echo "    podman-compose found: $(podman-compose --version)"
fi

# Ensure the podman machine exists and is running
echo "==> Ensuring podman machine is initialized and running..."

if ! podman machine inspect podman-machine-default &>/dev/null; then
  echo "    Initializing podman machine..."
  podman machine init
fi

if ! podman machine inspect podman-machine-default --format '{{.State}}' 2>/dev/null | grep -qi "running"; then
  echo "    Starting podman machine..."
  podman machine start
else
  echo "    podman machine already running."
fi

# Install the mac helper so the default Docker API socket works with podman
PODMAN_BIN="$(brew --prefix)/Cellar/podman/$(podman --version | awk '{print $NF}')/bin/podman-mac-helper"
if [ -x "$PODMAN_BIN" ]; then
  echo "==> Installing podman-mac-helper (may prompt for sudo password)..."
  sudo "$PODMAN_BIN" install
  echo "    Restarting podman machine to pick up helper..."
  podman machine stop
  podman machine start
else
  echo "    podman-mac-helper not found at $PODMAN_BIN — skipping."
fi

# Append docker -> podman alias to .zshrc if not already present
ZSHRC="$HOME/.zshrc"
ALIAS_LINE='alias docker=podman'

if [ -f "$ZSHRC" ]; then
  if ! grep -qF "$ALIAS_LINE" "$ZSHRC"; then
    echo "" >> "$ZSHRC"
    echo "# Pokey: alias docker to podman" >> "$ZSHRC"
    echo "$ALIAS_LINE" >> "$ZSHRC"
    echo "    Added 'alias docker=podman' to $ZSHRC"
  else
    echo "    docker alias already in $ZSHRC — skipping."
  fi
else
  echo "$ALIAS_LINE" > "$ZSHRC"
  echo "    Created $ZSHRC with docker alias."
fi

echo "==> Pulling amazon/dynamodb-local image..."
podman pull docker.io/amazon/dynamodb-local

echo "==> Podman setup complete."
