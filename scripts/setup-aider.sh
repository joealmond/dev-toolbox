#!/bin/bash

# ============================================================================
# Aider Setup Script
# ============================================================================
# This script configures Aider to use a local Ollama instance.
# Aider is a terminal-based AI coding assistant with excellent Ollama support.
#
# Usage:
#   bash scripts/setup-aider.sh
#
# Environment Variables:
#   OLLAMA_HOST  - Ollama server URL (default: http://localhost:11434)
#   AIDER_MODEL  - Model to use (default: qwen2.5-coder:7b)
# ============================================================================

set -e

# Configuration
CONFIG_DIR="$HOME/.aider"
CONFIG_FILE="$CONFIG_DIR/.aider.conf.yml"

# Ollama settings
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
AIDER_MODEL="${AIDER_MODEL:-ollama/qwen2.5-coder:7b}"

echo "🔧 Aider Setup"
echo "=============="

# Check Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    exit 1
fi
echo "✅ Python 3: $(python3 --version)"

# Install aider if needed
if ! command -v aider &> /dev/null; then
    echo "📦 Installing aider-chat..."
    pip3 install --user aider-chat==0.86.1
    export PATH="$HOME/.local/bin:$PATH"
fi
echo "✅ Aider: $(aider --version 2>/dev/null || echo 'installed')"

# Create config
mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_FILE" << CONF
model: $AIDER_MODEL
auto-commits: true
dark-mode: true
stream: true
CONF

echo "✅ Config: $CONFIG_FILE"
echo ""
echo "🎉 Setup complete! Run: aider"
