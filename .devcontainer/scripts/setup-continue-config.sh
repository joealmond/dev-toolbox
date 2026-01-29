#!/bin/bash
# Configure Continue extension for Ollama
# Based on: https://docs.continue.dev/guides/ollama-guide

set -e

echo "🔧 Configuring Continue for Ollama..."

# Create Continue config directory
mkdir -p ~/.continue/configs

# Create Continue config (YAML format - config.json is deprecated)
cat > ~/.continue/configs/config.yaml << 'EOF'
##########################################################
# Continue configuration for Ollama
# https://docs.continue.dev/reference
##########################################################
name: Local Ollama Config
version: 0.0.1
schema: v1

models:
  # Main chat model
  - name: Qwen 2.5 Coder 7B
    provider: ollama
    model: qwen2.5-coder:7b
    apiBase: http://localhost:11434
    roles:
      - chat
      - edit
      - apply
    defaultCompletionOptions:
      temperature: 0.7
      maxTokens: 2048

  # Autocomplete model (smaller for speed)
  - name: Qwen 2.5 Coder 7B (Autocomplete)
    provider: ollama
    model: qwen2.5-coder:7b
    apiBase: http://localhost:11434
    roles:
      - autocomplete
    autocompleteOptions:
      debounceDelay: 300
      maxPromptTokens: 1024

  # Autodetect additional Ollama models
  - name: Autodetect Ollama
    provider: ollama
    model: AUTODETECT
    apiBase: http://localhost:11434

# Context providers
context:
  - provider: file
  - provider: code
  - provider: diff
  - provider: terminal
  - provider: folder

# Rules for AI behavior
rules:
  - Write clean, readable code
  - Prefer TypeScript over JavaScript when applicable
  - Add appropriate error handling
  - Include helpful comments for complex logic
EOF

echo "✅ Continue configured:"
echo "   - Config: ~/.continue/configs/config.yaml"
echo "   - Model: qwen2.5-coder:7b"
echo "   - API: http://localhost:11434"
echo "   - Autodetect: enabled"
echo ""
echo "💡 Usage:"
echo "   Ctrl+L (Cmd+L)  - Open Continue chat"
echo "   Ctrl+I (Cmd+I)  - Inline edit"
echo "   @codebase       - Ask about entire codebase"
echo "   @src/file.js    - Ask about specific file"
