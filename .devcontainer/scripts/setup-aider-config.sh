#!/bin/bash
# Configure Aider for the current user with Ollama

set -e

echo "🔧 Configuring Aider for Ollama..."

# Create Aider config directory
mkdir -p ~/.aider

# Create Aider config
cat > ~/.aider/.aider.conf.yml << 'EOF'
# Aider configuration for Ollama
model: ollama/qwen2.5-coder:7b

# Don't ask to create git repo
auto-commits: false

# Use Ollama API
api-base: http://localhost:11434

# Editor settings
editor: code --wait

# File watching
watch-files: true
EOF

echo "✅ Aider configured:"
echo "   - Model: ollama/qwen2.5-coder:7b"
echo "   - API: http://localhost:11434"
echo "   - Auto-commits: disabled"
echo ""
echo "💡 Usage:"
echo "   aider                          # Interactive mode"
echo "   aider --message 'your prompt'  # One-shot mode"
echo "   aider file.js                  # Edit specific file"
