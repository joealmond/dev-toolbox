#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 Rebuilding semantic search index..."
cd "$PROJECT_ROOT"

node scripts/semantic-indexer.js build

echo "✅ Index rebuilt successfully!"
