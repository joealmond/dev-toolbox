#!/bin/bash
# MCP Server startup script
# Starts the Model Context Protocol server for VS Code integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT_PATH="$PROJECT_ROOT/scripts/mcp-server.js"
LOG_FILE="$PROJECT_ROOT/logs/mcp-server.log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting MCP Server..."
echo "Script path: $SCRIPT_PATH"
echo "Log file: $LOG_FILE"

# Run MCP server with error handling
node "$SCRIPT_PATH" >> "$LOG_FILE" 2>&1 &
MCP_PID=$!

echo "[$(date '+%Y-%m-%d %H:%M:%S')] MCP Server started with PID $MCP_PID"
echo "MCP_PID=$MCP_PID" > "$PROJECT_ROOT/.mcp-pid"

# Wait for server to be ready
sleep 2

if kill -0 $MCP_PID 2>/dev/null; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ MCP Server is running"
  exit 0
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ MCP Server failed to start"
  exit 1
fi
