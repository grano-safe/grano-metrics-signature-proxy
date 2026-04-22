#!/bin/bash

set -euo pipefail

required="25.9.0"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed or not available in PATH." >&2
  exit 1
fi

current="$(node -v | sed 's/^v//')"

if ! printf '%s\n%s\n' "$required" "$current" | sort -V -C; then
  echo "Error: Node.js version ${current} is too old. Required version is >= ${required}." >&2
  exit 1
fi

yarn build

echo Creating bundle...
esbuild dist/index.js --bundle --platform=node --format=cjs --minify --outfile=dist/bundle/index.js

mkdir dist/bin

node --build-sea sea-config.json

