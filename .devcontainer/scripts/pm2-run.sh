#!/bin/bash
# pm2-run.sh — Start PM2 with environment detection and validation

set -e

echo "🚀 Starting PM2 with environment checks..."

# Run environment detection first
if [ -f /workspaces/dev01/.devcontainer/scripts/env-detect.sh ]; then
  source /workspaces/dev01/.devcontainer/scripts/env-detect.sh
else
  echo "⚠️  Warning: env-detect.sh not found, using default OLLAMA_HOST"
fi

# Run SSH validation (non-blocking)
if [ -f /workspaces/dev01/.devcontainer/scripts/ssh-validate.sh ]; then
  bash /workspaces/dev01/.devcontainer/scripts/ssh-validate.sh || true
fi

# Change to project directory
cd /workspaces/dev01

# Ensure logs directory exists
mkdir -p logs

# Check if PM2 is already running this app
if pm2 list | grep -q "ticket-processor"; then
  echo "✓ PM2 app already running, reloading..."
  pm2 reload ecosystem.config.js --update-env
else
  echo "✓ Starting PM2 app for the first time..."
  pm2 start ecosystem.config.js
fi

# Save PM2 process list for resurrection
pm2 save

# Show status
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "✅ PM2 started successfully"
echo "   → View logs: pm2 logs ticket-processor"
echo "   → Monitor: pm2 monit"
echo "   → Restart: pm2 restart ticket-processor"
echo "   → Stop: pm2 stop ticket-processor"
