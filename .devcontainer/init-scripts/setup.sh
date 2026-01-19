#!/bin/bash
# Main devcontainer setup script
# Initializes all dependencies and services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "================================"
echo "Ticket Processor - Setup Script"
echo "================================"
echo ""

# Step 1: Install dependencies
echo "[1/5] Installing Node.js dependencies..."
cd "$PROJECT_ROOT"
npm install --legacy-peer-deps || true

# Step 2: Create necessary directories
echo "[2/5] Creating directory structure..."
mkdir -p "$PROJECT_ROOT/backlog/todo"
mkdir -p "$PROJECT_ROOT/backlog/doing"
mkdir -p "$PROJECT_ROOT/backlog/review"
mkdir -p "$PROJECT_ROOT/backlog/completed"
mkdir -p "$PROJECT_ROOT/backlog/failed"
mkdir -p "$PROJECT_ROOT/docs/adr"
mkdir -p "$PROJECT_ROOT/docs/worklogs"
mkdir -p "$PROJECT_ROOT/docs/specs"
mkdir -p "$PROJECT_ROOT/repos"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/.index"
mkdir -p "$PROJECT_ROOT/.github/agents"

# Step 3: Validate configuration
echo "[3/5] Validating configuration..."
if [ -f "$PROJECT_ROOT/config.json" ]; then
  node -e "require('$PROJECT_ROOT/config.json'); console.log('✓ config.json is valid')" || {
    echo "✗ config.json validation failed"
    exit 1
  }
else
  echo "⚠ config.json not found"
fi

# Step 4: Check required tools
echo "[4/5] Checking required tools..."
which node > /dev/null && echo "✓ Node.js $(node --version)" || echo "✗ Node.js not found"
which npm > /dev/null && echo "✓ npm $(npm --version)" || echo "✗ npm not found"

# Step 5: Environment setup
echo "[5/5] Setting up environment..."

# Create .env if it doesn't exist
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  cat > "$PROJECT_ROOT/.env" << EOF
NODE_ENV=development
OLLAMA_HOST=http://host.docker.internal:11434
GITEA_BASE_URL=http://host.docker.internal:3000
LOG_LEVEL=info
EOF
  echo "✓ Created .env file"
fi

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh || true
chmod +x "$PROJECT_ROOT/scripts"/*.sh || true

echo ""
echo "================================"
echo "✓ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Configure .env with your Gitea/Ollama settings"
echo "2. Start the watcher: npm run watch"
echo "3. Check logs: tail -f logs/watcher.log"
echo ""
