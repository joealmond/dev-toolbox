#!/bin/bash
# env-detect.sh — Auto-detect container runtime and set OLLAMA_HOST

set -e

echo "🔍 Detecting container runtime and setting OLLAMA_HOST..."

# Check if config.json has an explicit ollama.baseUrl override
CONFIG_FILE="${WORKSPACE_ROOT:-/workspaces/dev-toolbox}/config.json"
if [ -f "$CONFIG_FILE" ]; then
  CONFIG_OLLAMA_URL=$(node -p "try { require('$CONFIG_FILE').ollama?.baseUrl || '' } catch(e) { '' }" 2>/dev/null || echo "")
  if [ -n "$CONFIG_OLLAMA_URL" ]; then
    export OLLAMA_HOST="$CONFIG_OLLAMA_URL"
    echo "✓ Using OLLAMA_HOST from config.json: $OLLAMA_HOST"
    echo "export OLLAMA_HOST='$OLLAMA_HOST'" >> ~/.bashrc
    echo "export OLLAMA_HOST='$OLLAMA_HOST'" >> ~/.zshrc 2>/dev/null || true
    exit 0
  fi
fi

# Detect runtime based on connectivity to host.docker.internal
if ping -c 1 -W 1 host.docker.internal &>/dev/null; then
  # OrbStack, Docker Desktop, or Podman with host.docker.internal support
  export OLLAMA_HOST="http://host.docker.internal:11434"
  echo "✓ Detected OrbStack/Docker Desktop runtime"
elif command -v ip &>/dev/null && ip route 2>/dev/null | grep -q "default.*172.17.0.1"; then
  # Standard Docker bridge network (Linux containers)
  export OLLAMA_HOST="http://172.17.0.1:11434"
  echo "✓ Detected standard Docker bridge (172.17.0.1)"
else
  # Fallback to localhost (native Linux or unusual setup)
  export OLLAMA_HOST="http://localhost:11434"
  echo "⚠️  Could not detect runtime; defaulting to localhost:11434"
fi

echo "✓ Set OLLAMA_HOST=$OLLAMA_HOST"

# Persist to shell profiles
echo "export OLLAMA_HOST='$OLLAMA_HOST'" >> ~/.bashrc
echo "export OLLAMA_HOST='$OLLAMA_HOST'" >> ~/.zshrc 2>/dev/null || true

# Test connectivity
echo "Testing Ollama connectivity..."
if curl -s --connect-timeout 3 "$OLLAMA_HOST/api/tags" &>/dev/null; then
  echo "✅ Ollama is reachable at $OLLAMA_HOST"
else
  echo "⚠️  Warning: Ollama not reachable at $OLLAMA_HOST (check if server is running)"
fi
