#!/usr/bin/env bash
# Wrapper to new location
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/shell/create-from-template.sh" "$@"
