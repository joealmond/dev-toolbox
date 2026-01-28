#!/bin/bash
# Configure Continue extension for Ollama

set -e

echo "🔧 Configuring Continue for Ollama..."

# Create Continue config directory
mkdir -p ~/.continue

# Create Continue config
cat > ~/.continue/config.json << 'EOF'
{
  "models": [
    {
      "title": "Qwen 2.5 Coder 7B",
      "provider": "ollama",
      "model": "qwen2.5-coder:7b",
      "apiBase": "http://localhost:11434"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Qwen 2.5 Coder 7B",
    "provider": "ollama",
    "model": "qwen2.5-coder:7b",
    "apiBase": "http://localhost:11434"
  },
  "embeddingsProvider": {
    "provider": "ollama",
    "model": "nomic-embed-text",
    "apiBase": "http://localhost:11434"
  },
  "slashCommands": [
    {
      "name": "edit",
      "description": "Edit selected code"
    },
    {
      "name": "comment",
      "description": "Write comments for code"
    },
    {
      "name": "share",
      "description": "Export chat history"
    },
    {
      "name": "cmd",
      "description": "Generate shell command"
    }
  ],
  "contextProviders": [
    {
      "name": "code",
      "params": {}
    },
    {
      "name": "docs",
      "params": {}
    },
    {
      "name": "diff",
      "params": {}
    },
    {
      "name": "terminal",
      "params": {}
    },
    {
      "name": "problems",
      "params": {}
    },
    {
      "name": "folder",
      "params": {}
    },
    {
      "name": "codebase",
      "params": {}
    }
  ],
  "allowAnonymousTelemetry": false,
  "disableIndexing": false
}
EOF

echo "✅ Continue configured:"
echo "   - Model: qwen2.5-coder:7b"
echo "   - API: http://localhost:11434"
echo "   - Autocomplete: enabled"
echo ""
echo "💡 Usage:"
echo "   Ctrl+L (Cmd+L)  - Open Continue chat"
echo "   Ctrl+I (Cmd+I)  - Inline edit"
echo "   @codebase       - Ask about entire codebase"
echo "   @src/file.js    - Ask about specific file"
