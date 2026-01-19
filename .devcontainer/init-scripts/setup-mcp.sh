#!/bin/bash
# Setup MCP server configuration

set -e

echo "[INIT] Setting up MCP server..."

# Create MCP config directory
mkdir -p ~/.config/Code/User/globalStorage/mcp

# Create mcp.json configuration
cat > ~/.config/Code/User/globalStorage/mcp/mcp.json << 'EOF'
{
  "mcpServers": {
    "ticket-processor": {
      "command": "node",
      "args": ["/workspaces/dev01/scripts/mcp-server.js"],
      "disabled": false,
      "env": {
        "NODE_ENV": "development",
        "OLLAMA_HOST": "http://host.docker.internal:11434"
      }
    }
  }
}
EOF

echo "[INIT] MCP configuration created at ~/.config/Code/User/globalStorage/mcp/mcp.json"

# Create VS Code settings for MCP
mkdir -p ~/.config/Code/User
if [ ! -f ~/.config/Code/User/settings.json ]; then
  echo "{}" > ~/.config/Code/User/settings.json
fi

echo "[INIT] MCP setup complete"
