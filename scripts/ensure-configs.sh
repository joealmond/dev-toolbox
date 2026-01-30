#!/bin/bash
# scripts/ensure-configs.sh
# Ensures that user configuration files in the home directory are correct.
# This fixes issues where DevContainer volumes persist old/broken configs.

set -e

# --- Aider Config ---
# Enforce the correct 'yes-always' syntax and other settings
echo "Configuring Aider..."
cat > ~/.aider.conf.yml << 'EOF'
model: ollama/qwen2.5-coder:7b
auto-commits: false
git: false
gitignore: false
yes-always: true
check-update: false
EOF
echo "✓ ~/.aider.conf.yml updated"

# Disable release notes opening
mkdir -p "$HOME/.aider"
touch "$HOME/.aider/analytics"
echo "✓ Aider analytics disabled"

# --- Continue Config Check ---
# Continue runs on host, but we can verify if the user is confused
if [ ! -d "$HOME/.continue" ] && [ "$Container" == "" ]; then
    # We are likely on host or non-container env, harmless check
    true
fi

# --- Continue Config (Container) ---
# We create this just in case VS Code or an extension looks for it here
mkdir -p "$HOME/.continue/configs"
cat > "$HOME/.continue/configs/config.yaml" << 'EOF'
name: Local Config
version: 1.0.0
schema: v1
models:
  - name: Autodetect
    provider: ollama
    model: AUTODETECT
    apiBase: http://localhost:11434
    roles:
      - chat
      - edit
      - apply
      - autocomplete
EOF
echo "✓ ~/.continue/configs/config.yaml ensure"

