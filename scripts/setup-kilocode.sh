#!/bin/bash

# Configuration
CONFIG_DIR="$HOME/.kilocode"
CONFIG_FILE="$CONFIG_DIR/config.json"

# Check if kilocode is installed
if ! command -v kilocode &> /dev/null; then
    echo "❌ kilocode CLI not found. Installing..."
    npm install -g @kilocode/cli
fi

# Create config directory
mkdir -p "$CONFIG_DIR"

# Write config file
cat > "$CONFIG_FILE" <<EOF
{
  "id": "default",
  "provider": "ollama",
  "ollamaBaseUrl": "http://host.containers.internal:11434",
  "ollamaModelId": "glmcoder",
  "ollamaNumCtx": 16384
}
EOF

echo "✅ Kilo Code CLI configured!"
echo "   - Provider: Ollama"
echo "   - Model: glmcoder"
echo "   - Context: 16384"
echo "   - URL: http://host.containers.internal:11434"
echo ""
echo "Try it now: kilocode chat 'Hello world'"
