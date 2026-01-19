#!/bin/bash
# Webhook server startup script
# Starts the Gitea webhook listener for PR automation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/webhook-server.log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Webhook Server..."
echo "Log file: $LOG_FILE"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# The watcher.js file includes webhook server functionality
# It will be started by PM2 or the main service

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Webhook server setup complete"
