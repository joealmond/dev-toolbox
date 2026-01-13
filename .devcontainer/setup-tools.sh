#!/bin/bash
# setup-tools.sh — Main provisioning script (runs on postCreateCommand)
# Delegates to modular scripts for maintainability

echo "🔧 Setting up development tools..."

# Set workspace root
WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspaces/dev01}"
SCRIPTS_DIR="$WORKSPACE_ROOT/.devcontainer/scripts"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Apply dotfiles (non-blocking)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Dotfiles Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$SCRIPTS_DIR/dotfiles-setup.sh" ]; then
    bash "$SCRIPTS_DIR/dotfiles-setup.sh" || {
        echo "⚠️  Warning: Dotfiles setup failed (continuing anyway)"
    }
else
    echo "⚠️  Warning: dotfiles-setup.sh not found, skipping..."
fi

# 2. Verify global tools (PM2, Backlog, Kilo Code) - already in Docker image
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Verify Global Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ollama CLI
if command_exists ollama; then
    echo "✅ Ollama CLI available"
else
    echo "⚠️  Ollama CLI not found"
fi

# PM2
if command_exists pm2; then
    echo "✅ PM2 available"
else
    echo "⚠️  PM2 not found - installing..."
    npm install -g pm2 || echo "❌ PM2 install failed (offline?)"
fi

# Backlog.md CLI
if command_exists backlog; then
    echo "✅ Backlog.md CLI available"
else
    echo "⚠️  Backlog.md CLI not found - installing..."
    npm install -g backlog.md || echo "❌ Backlog.md install failed (offline?)"
fi

# Kilo Code CLI (kilo) - pre-installed in Dockerfile, check availability
if command_exists kilo; then
    echo "✅ Kilo Code CLI (kilo) available - version $(kilo --version 2>/dev/null || echo 'unknown')"
else
    echo "⚠️  Kilo Code CLI not found (should be pre-installed in Dockerfile)"
    echo "   Binary name: 'kilo' (not 'kodu')"
fi

# 3. Install project dependencies
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Project Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$WORKSPACE_ROOT/package.json" ]; then
    echo "📦 Installing npm dependencies..."
    cd "$WORKSPACE_ROOT"
    npm install || {
        echo "❌ npm install failed"
        exit 1  # Critical failure - can't continue without dependencies
    }
    echo "✅ Dependencies installed"
else
    echo "⚠️  No package.json found, skipping npm install"
fi

# 4. Fix npm cache permissions (common issue)
if [ -d "$HOME/.npm" ]; then
    chmod -R u+w "$HOME/.npm" 2>/dev/null || true
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tool setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  → PM2 will start automatically via postStartCommand"
echo "  → View logs: pm2 logs ticket-processor"
echo "  → Monitor: pm2 monit"
echo ""

