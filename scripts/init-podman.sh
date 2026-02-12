#!/usr/bin/env bash
set -euo pipefail

echo "==> Checking for podman..."

if ! command -v podman &>/dev/null; then
  echo "ERROR: podman is not installed. Please install podman first:"
  echo "  brew install podman"
  exit 1
fi

echo "    podman found: $(podman --version)"

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
