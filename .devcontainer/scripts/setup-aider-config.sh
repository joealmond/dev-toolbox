#!/bin/bash
# Configure Aider for the current user with Ollama
# Based on: https://aider.chat/docs/config/aider_conf.html

set -e

echo "🔧 Configuring Aider for Ollama..."

# Aider looks for .aider.conf.yml in:
# 1. Home directory (~/.aider.conf.yml)
# 2. Git repo root
# 3. Current directory

cat > ~/.aider.conf.yml << 'EOF'
##########################################################
# Aider configuration for Ollama
# https://aider.chat/docs/config/aider_conf.html
##########################################################

# Model to use (Ollama format: ollama/model-name)
model: ollama/qwen2.5-coder:7b

# Disable auto git commits (we manage git separately)
auto-commits: false

# Disable looking for git repo (avoids prompts)
git: false

# Don't add .aider* to .gitignore automatically
gitignore: false

# Editor for /editor command
editor: code --wait

# Enable file watching for ai coding comments
watch-files: false

# Disable pretty output if causing issues
# pretty: false

# Enable streaming responses
stream: true
EOF

# Set Ollama API base via environment variable
# Aider auto-detects Ollama models when using ollama/ prefix
if ! grep -q "OLLAMA_API_BASE" ~/.bashrc 2>/dev/null; then
  echo "" >> ~/.bashrc
  echo "# Aider Ollama configuration" >> ~/.bashrc
  echo "export OLLAMA_API_BASE=http://localhost:11434" >> ~/.bashrc
fi

echo "✅ Aider configured:"
echo "   - Config: ~/.aider.conf.yml"
echo "   - Model: ollama/qwen2.5-coder:7b"
echo "   - API: http://localhost:11434"
echo "   - Auto-commits: disabled"
echo "   - Git prompts: disabled"
echo ""
echo "💡 Usage:"
echo "   aider                          # Interactive mode"
echo "   aider --message 'your prompt'  # One-shot mode"
echo "   aider file.js                  # Edit specific file"
