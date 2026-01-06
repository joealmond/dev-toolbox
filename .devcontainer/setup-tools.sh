#!/bin/bash
set -e

echo "🔧 Setting up development tools..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to retry commands with exponential backoff
retry_cmd() {
    local max_attempts=3
    local timeout=10
    local attempt=1
    local exitCode=0
    
    while [ $attempt -le $max_attempts ]
    do
        if "$@"
        then
            return 0
        else
            exitCode=$?
        fi
        
        if [ $attempt -lt $max_attempts ]
        then
            local wait=$((timeout * (2 ** ($attempt - 1))))
            echo "⚠️  Attempt $attempt failed. Retrying in ${wait}s..."
            sleep $wait
        fi
        attempt=$((attempt + 1))
    done
    
    return $exitCode
}

# Set default CHEZMOI_REPO if not provided
CHEZMOI_REPO=${CHEZMOI_REPO:-"https://github.com/your-user/dotfiles.git"}

# Install chezmoi for dotfile management
if ! command_exists chezmoi; then
    echo "📦 Installing chezmoi..."
    retry_cmd sh -c "$(curl -fsLS https://chezmoi.io/get)" -- -b ~/.local/bin
    export PATH="$PATH:$HOME/.local/bin"
else
    echo "✅ chezmoi already installed"
fi

# Initialize chezmoi and apply dotfiles
echo "🔍 Applying dotfiles from $CHEZMOI_REPO..."
if [ -n "$CHEZMOI_REPO" ] && [ "$CHEZMOI_REPO" != "https://github.com/your-user/dotfiles.git" ]; then
    chezmoi init --apply "$CHEZMOI_REPO" || {
        echo "⚠️  chezmoi init failed - offline or repo unavailable"
        echo "   Skipping dotfile sync (continue without .gitconfig, .ssh/config)"
    }
else
    echo "⚠️  CHEZMOI_REPO not configured, skipping dotfile sync"
fi

# Apply container-specific SSH config overrides (after chezmoi to override dotfiles config)
if [ -f "/workspaces/dev01/.devcontainer/ssh_config" ]; then
    echo "🔐 Applying container SSH config..."
    cat /workspaces/dev01/.devcontainer/ssh_config >> ~/.ssh/config 2>/dev/null || {
        mkdir -p ~/.ssh
        cat /workspaces/dev01/.devcontainer/ssh_config >> ~/.ssh/config
    }
fi

# Check if cloudflared credentials are mounted (required for SSH tunneling)
if [ ! -d "$HOME/.cloudflared" ]; then
    echo ""
    echo "⚠️  WARNING: ~/.cloudflared not found!"
    echo "   SSH tunneling via cloudflared will not work until you:"
    echo "   1. On host: Run 'cloudflared access ssh --hostname ssh.mandulaj.stream'"
    echo "   2. Verify host ~/.cloudflared exists with cert/token files"
    echo "   3. Uncomment the cloudflared mount in .devcontainer/devcontainer.json"
    echo "   4. Rebuild the devcontainer"
    echo ""
fi

# Ollama CLI is already installed in the Dockerfile
if command_exists ollama; then
    echo "✅ Ollama CLI available"
else
    echo "⚠️  Ollama CLI not found"
fi

# Fix npm cache permissions if needed
if [ -d "$HOME/.npm" ]; then
    chmod -R u+w "$HOME/.npm" 2>/dev/null || true
fi

# Install PM2 globally (already in Docker image, just verify)
if ! command_exists pm2; then
    echo "📦 Installing PM2..."
    npm install -g pm2 || echo "⚠️  PM2 install skipped (offline?)"
else
    echo "✅ PM2 available"
fi

# Install Backlog.md CLI (already in Docker image, just verify)
if ! command_exists backlog; then
    echo "📦 Installing Backlog.md CLI..."
    npm install -g backlog.md || echo "⚠️  Backlog.md install skipped (offline?)"
else
    echo "✅ Backlog.md CLI available"
fi

# Install Kilo Code CLI (already in Docker image, just verify)
if ! command_exists kilocode; then
    echo "📦 Installing Kilo Code CLI..."
    npm install -g @kilocode/cli || echo "⚠️  Kilo Code CLI install skipped (offline?)"
else
    echo "✅ Kilo Code CLI available"
fi

# Verify Ollama connection to host
echo "🔍 Checking Ollama connection..."
if curl -s "${OLLAMA_HOST:-http://host.docker.internal:11434}/api/tags" >/dev/null 2>&1; then
    echo "✅ Ollama host reachable at ${OLLAMA_HOST:-http://host.docker.internal:11434}"
else
    echo "⚠️  Warning: Cannot reach Ollama at ${OLLAMA_HOST:-http://host.docker.internal:11434}"
    echo "   Make sure Ollama is running on your host machine"
fi

# Install project dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "✅ Tool setup complete!"
