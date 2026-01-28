#!/bin/bash
set -e

echo "🔧 Setting up development tools..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Always write Git "global" config to XDG path to avoid
# read-only bind mount at ~/.gitconfig defined in devcontainer.json
mkdir -p "$HOME/.config/git"
GIT_GLOBAL_FILE="$HOME/.config/git/config"
git_global() {
    git config --global --file "$GIT_GLOBAL_FILE" "$@"
}

# CRITICAL: Prevent git from hanging on credential prompts in non-interactive container
# Container gets SSH keys from ~/.ssh mount, no need for interactive auth
git_global core.askPass /bin/false
git_global credential.helper store
git config --global --add safe.directory '*'  # Needed for mounted repos
echo "✅ Git configured for non-interactive container use (XDG global config)"

# Verify git user config (from mounted .gitconfig or set defaults)
GIT_USER=$(git config --global user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

if [ -z "$GIT_USER" ] || [ -z "$GIT_EMAIL" ]; then
    echo "⚠️  Git user.name or user.email not configured"
    echo "   Setting from environment or defaults..."
    
    # Set from environment variables or use defaults
    git_global user.name "${GIT_AUTHOR_NAME:-Dev Container User}"
    git_global user.email "${GIT_AUTHOR_EMAIL:-dev@container.local}"
    
    echo "   📝 Git configured as: $(git config --global user.name) <$(git config --global user.email)>"
    echo "   💡 To change: Edit remoteEnv in .devcontainer/devcontainer.json"
else
    echo "✅ Git user: $GIT_USER <$GIT_EMAIL>"
fi

# Skip chezmoi/dotfiles sync in containers
# Problem: git.mandulaj.stream is tunneled, causes 4+ minute hang
# Solution: Containers don't need dotfiles - they get SSH keys from ~/.ssh mount
# Dotfiles are only for host machine configuration
echo "📝 Skipping dotfiles sync (containers use mounted SSH keys instead)"

# SSH config is already mounted from ~/.ssh/config - no need to append anything
# The setup script used to append .devcontainer/ssh_config, but since your 
# ssh_config is empty and host config is already mounted, we skip this
if [ -f "/workspaces/dev01/.devcontainer/ssh_config" ] && [ -s "/workspaces/dev01/.devcontainer/ssh_config" ]; then
    echo "🔐 Merging container-specific SSH config..."
    cat /workspaces/dev01/.devcontainer/ssh_config >> ~/.ssh/config 2>/dev/null || true
    chmod 600 ~/.ssh/config 2>/dev/null || true
else
    echo "✅ Using SSH config from host (already mounted)"
fi

# Ensure SSH keys are readable
if [ -d "$HOME/.ssh" ]; then
    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/* 2>/dev/null || true
    echo "✅ SSH keys permissions fixed"
fi

# Source bash aliases from host if available (wake-on-lan, etc.)
if [ -f "$HOME/.bash_aliases" ]; then
    # Add to current session
    source "$HOME/.bash_aliases"
    # Ensure it's sourced in future bash sessions
    if ! grep -q "source ~/.bash_aliases" ~/.bashrc 2>/dev/null; then
        echo "" >> ~/.bashrc
        echo "# Source host aliases" >> ~/.bashrc
        echo "[ -f ~/.bash_aliases ] && source ~/.bash_aliases" >> ~/.bashrc
    fi
    # Cache a copy of host aliases for reliability (in case mount changes later)
    if [ -s "$HOME/.bash_aliases" ]; then
        cp "$HOME/.bash_aliases" "$HOME/.bash_aliases_cache" 2>/dev/null || true
        if ! grep -q "source ~/.bash_aliases_cache" ~/.bashrc 2>/dev/null; then
            echo "[ -f ~/.bash_aliases_cache ] && source ~/.bash_aliases_cache" >> ~/.bashrc
        fi
    fi
    echo "✅ Bash aliases loaded from host and cached"
fi

# Source host bashrc functions if available
if [ -f "$HOME/.bashrc_host" ]; then
    source "$HOME/.bashrc_host"
    echo "✅ Host bashrc functions loaded"
fi

# Ollama CLI verification
if command_exists ollama; then
    echo "✅ Ollama CLI available"
else
    echo "⚠️  Ollama CLI not found"
fi

# Fix npm cache permissions
if [ -d "$HOME/.npm" ]; then
    chmod -R u+w "$HOME/.npm" 2>/dev/null || true
fi

# Verify global tools (don't install - should be in Docker image)
echo "🔍 Verifying global tools..."
for tool in pm2 backlog aider; do
    if command_exists "$tool"; then
        echo "✅ $tool available"
    else
        echo "⚠️  $tool not found"
    fi
done

# Verify Ollama connection with timeout
# Try both Podman and Docker hostnames
echo "🔍 Checking Ollama connection..."

OLLAMA_URLS=(
    "${OLLAMA_HOST:-http://host.containers.internal:11434}"
    "http://host.containers.internal:11434"
    "http://host.docker.internal:11434"
    "http://172.17.0.1:11434"
)

OLLAMA_CONNECTED=false
for url in "${OLLAMA_URLS[@]}"; do
    if timeout 3 curl -s "${url}/api/tags" >/dev/null 2>&1; then
        echo "✅ Ollama reachable at ${url}"
        OLLAMA_CONNECTED=true
        
        # Show available models
        echo "   📋 Available models:"
        curl -s "${url}/api/tags" | jq -r '.models[].name' 2>/dev/null | head -5 | while read model; do
            echo "      - $model"
        done || echo "      (use 'ollama list' on host to see models)"
        
        # Export for later use
        export OLLAMA_HOST="${url}"
        export OLLAMA_API_BASE="${url}"
        break
    fi
done

if [ "$OLLAMA_CONNECTED" = false ]; then
    echo "⚠️  Cannot reach Ollama at any known address"
    echo "   Tried: ${OLLAMA_URLS[*]}"
    echo "   Make sure Ollama is running on host with: OLLAMA_HOST=0.0.0.0:11434"
fi

# Install project dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing npm dependencies..."
    npm install || npm install --legacy-peer-deps || echo "⚠️  npm install had issues"
fi

echo "✅ Setup complete!"
