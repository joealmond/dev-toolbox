#!/bin/bash
# Build semantic search index

set -e

echo "[INIT] Building semantic search index..."

cd /workspaces/dev01

# Build the index
npm run build:index

echo "[INIT] Semantic index built successfully"
