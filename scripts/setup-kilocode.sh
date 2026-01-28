#!/bin/bash

# ============================================================================
# Kilo Code CLI Setup Script
# ============================================================================
# This script configures @kilocode/cli to use a local Ollama instance.
#
# KNOWN ISSUE (as of Jan 2026):
# Versions v0.13.0+ have a bug with the Ollama provider that causes:
# - "Model not found" errors (even when model exists)
# - Hanging on "Thinking..." with no response
# - Incorrect HTTP methods to Ollama API (GET instead of POST)
#
# See: https://github.com/Kilo-Org/kilocode/issues/4434
#
# WORKAROUND: Use v0.12.1 which is the last known working version for Ollama.
# ============================================================================

set -e

# Configuration
CONFIG_DIR="$HOME/.kilocode/cli"
CONFIG_FILE="$CONFIG_DIR/config.json"

# Ollama settings (customize these)
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-glmcoder:latest}"
OLLAMA_CTX="${OLLAMA_CTX:-16384}"

# Version to install (v0.12.1 is last known working for Ollama)
# Set USE_LATEST=1 to install latest (buggy with Ollama)
KILOCODE_VERSION="${KILOCODE_VERSION:-0.12.1}"
USE_LATEST="${USE_LATEST:-0}"

echo "🔧 Kilo Code CLI Setup"
echo "======================"

# Check/install kilocode
if ! command -v kilocode &> /dev/null; then
    echo "📦 Installing @kilocode/cli..."
    if [[ "$USE_LATEST" == "1" ]]; then
        npm install -g @kilocode/cli
        echo "   ⚠️  Installed latest version (Ollama provider may be buggy)"
    else
        npm install -g @kilocode/cli@$KILOCODE_VERSION
        echo "   ✅ Installed v$KILOCODE_VERSION (last known working for Ollama)"
    fi
else
    INSTALLED_VERSION=$(kilocode --version 2>/dev/null || echo "unknown")
    echo "📦 kilocode already installed: $INSTALLED_VERSION"
    if [[ "$USE_LATEST" != "1" ]] && [[ "$INSTALLED_VERSION" != "$KILOCODE_VERSION" ]]; then
        echo "   ⚠️  Consider: npm install -g @kilocode/cli@$KILOCODE_VERSION"
    fi
fi

# Verify Ollama is accessible
echo ""
echo "🔍 Checking Ollama at $OLLAMA_URL..."
if curl -s --connect-timeout 5 "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo "   ✅ Ollama is reachable"
    # List available models
    MODELS=$(curl -s "$OLLAMA_URL/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -5)
    if [[ -n "$MODELS" ]]; then
        echo "   📋 Available models: $(echo $MODELS | tr '\n' ', ')"
    fi
else
    echo "   ⚠️  Could not reach Ollama at $OLLAMA_URL"
    echo "   Make sure Ollama is running: ollama serve"
fi

# Create config directory
mkdir -p "$CONFIG_DIR"

# Generate config JSON
# Schema fields discovered via source code analysis of @kilocode/cli
cat > "$CONFIG_FILE" << EOF
{
  "version": "1.0.0",
  "mode": "code",
  "telemetry": false,
  "provider": "default",
  "providers": [
    {
      "id": "default",
      "provider": "ollama",
      "ollamaBaseUrl": "$OLLAMA_URL",
      "ollamaModelId": "$OLLAMA_MODEL",
      "ollamaNumCtx": $OLLAMA_CTX
    }
  ],
  "autoApproval": {
    "enabled": true,
    "read": { "enabled": true, "outside": false },
    "write": { "enabled": true, "outside": true, "protected": false },
    "browser": { "enabled": false },
    "retry": { "enabled": true, "delay": 10 },
    "mcp": { "enabled": true },
    "mode": { "enabled": true },
    "subtasks": { "enabled": true },
    "execute": {
      "enabled": true,
      "allowed": ["ls", "cat", "echo", "pwd", "git", "npm", "node"],
      "denied": ["rm -rf", "sudo rm", "mkfs", "dd if="]
    },
    "question": { "enabled": false, "timeout": 60 },
    "todo": { "enabled": true }
  }
}
EOF

echo ""
echo "📄 Configuration written to: $CONFIG_FILE"
echo ""
echo "✅ Kilo Code CLI configured!"
echo "   • Provider: Ollama"
echo "   • Model: $OLLAMA_MODEL"  
echo "   • Context: $OLLAMA_CTX tokens"
echo "   • URL: $OLLAMA_URL"
echo ""
echo "Usage:"
echo "  kilocode                      # Interactive TUI mode"
echo "  kilocode chat 'Hello'         # Quick chat"
echo "  kilocode --auto 'Fix bug'     # Autonomous mode"
echo ""
echo "Troubleshooting:"
echo "  • If stuck on 'Thinking...', downgrade: npm i -g @kilocode/cli@0.12.1"
echo "  • Check logs: cat ~/.kilocode/cli/logs/cli.txt"
echo "  • Edit config: kilocode config"
