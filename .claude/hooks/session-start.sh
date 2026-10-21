#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

NODE_MAJOR="$(cat "$CLAUDE_PROJECT_DIR/.nvmrc")"
NODE_DIR="/opt/node${NODE_MAJOR}"

if [ ! -x "$NODE_DIR/bin/node" ]; then
  NODE_VERSION="$(curl -fsSL https://nodejs.org/dist/index.json \
    | python3 -c "import json,sys; print(next(v['version'] for v in json.load(sys.stdin) if v['version'].startswith('v${NODE_MAJOR}.')))")"
  mkdir -p "$NODE_DIR"
  curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz" \
    | tar -xJ -C "$NODE_DIR" --strip-components=1
fi

export PATH="$NODE_DIR/bin:$PATH"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable --install-directory "$NODE_DIR/bin"

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export PATH=\"$NODE_DIR/bin:\$PATH\""
    echo "export COREPACK_ENABLE_DOWNLOAD_PROMPT=0"
    echo "export WRANGLER_SEND_METRICS=false"
  } >> "$CLAUDE_ENV_FILE"
fi

cd "$CLAUDE_PROJECT_DIR"
pnpm install --prefer-offline
