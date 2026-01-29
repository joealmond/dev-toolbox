#!/bin/bash
# Setup Continue extension config on HOST machine
# 
# Continue extension runs on the host (where VS Code runs), NOT in containers.
# This script configures Continue to use local Ollama without requiring an account.
#
# Usage: ./setup-continue-host.sh

set -e

CONTINUE_DIR="$HOME/.continue/configs"
CONFIG_FILE="$CONTINUE_DIR/config.yaml"

echo "Setting up Continue extension for local Ollama..."

# Create directory if needed
mkdir -p "$CONTINUE_DIR"

# Check if config already exists
if [ -f "$CONFIG_FILE" ]; then
    echo "Config already exists at $CONFIG_FILE"
    echo "Backing up to $CONFIG_FILE.bak"
    cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
fi

# Write the config
cat > "$CONFIG_FILE" << 'EOF'
name: Local Config
version: 1.0.0
schema: v1
models:
  - name: Autodetect
    provider: ollama
    model: AUTODETECT
    apiBase: http://localhost:11434
    roles:
      - chat
      - edit
      - apply
      - autocomplete
EOF

echo "✓ Created Continue config at $CONFIG_FILE"
echo ""
echo "Next steps:"
echo "1. Make sure Ollama is running: ollama serve"
echo "2. Reload VS Code: Ctrl+Shift+P → 'Developer: Reload Window'"
echo "3. Open Continue panel - your Ollama models should appear"
