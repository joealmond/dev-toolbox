#!/bin/bash
# dotfiles-setup.sh — Apply dotfiles using chezmoi

set -e

echo "📦 Setting up dotfiles with chezmoi..."

# Check if CHEZMOI_REPO is set (from environment or config)
CHEZMOI_REPO_URL="${CHEZMOI_REPO:-}"
LOCAL_DOTFILES_PATH="/workspaces/dev01dot"
CHEZMOI_CONFIG_DIR="$HOME/.config/chezmoi"

# Prefer local dotfiles path if mounted, otherwise use remote
if [ -d "$LOCAL_DOTFILES_PATH/.git" ]; then
  echo "✓ Found local dotfiles at $LOCAL_DOTFILES_PATH"
  DOTFILES_SOURCE="$LOCAL_DOTFILES_PATH"
  USE_LOCAL=true
elif [ -n "$CHEZMOI_REPO_URL" ]; then
  echo "✓ Using remote dotfiles repo: $CHEZMOI_REPO_URL"
  DOTFILES_SOURCE="$CHEZMOI_REPO_URL"
  USE_LOCAL=false
else
  echo "⚠️  No dotfiles source configured (set CHEZMOI_REPO or mount /workspaces/dev01dot)"
  echo "   Skipping dotfiles setup..."
  exit 0
fi

# Install chezmoi if not present
if ! command -v chezmoi &>/dev/null; then
  echo "Installing chezmoi..."
  sh -c "$(curl -fsLS get.chezmoi.io)" -- -b ~/.local/bin
  export PATH="$HOME/.local/bin:$PATH"
fi

mkdir -p "$CHEZMOI_CONFIG_DIR"
# If a repo-level .chezmoi.toml exists, copy it to the container config location
if [ -f "$LOCAL_DOTFILES_PATH/.chezmoi.toml" ]; then
  echo "Using repo .chezmoi.toml for template data"
  # Sanitize config: remove unsupported sections like [encryption] for chezmoi config
  awk '
    BEGIN { keep=1 }
    /^\[encryption\]/ { keep=0; next }
    keep==0 && /^\[/ { keep=1 }
    keep==1 { print }
  ' "$LOCAL_DOTFILES_PATH/.chezmoi.toml" > "$CHEZMOI_CONFIG_DIR/chezmoi.toml" || cp "$LOCAL_DOTFILES_PATH/.chezmoi.toml" "$CHEZMOI_CONFIG_DIR/chezmoi.toml"

  # Normalize: ensure keys exist in both root (via [data]) and nested (via [data.data]) mapping
  CFG="$CHEZMOI_CONFIG_DIR/chezmoi.toml"
  
  # Check which sections already exist
  HAS_DATA_SECTION=$(grep -E '^\[data\]' "$CFG" || true)
  HAS_DATA_DATA_SECTION=$(grep -E '^\[data\.data\]' "$CFG" || true)
  HAS_DATA_SSH_SECTION=$(grep -E '^\[data\.ssh\]' "$CFG" || true)
  HAS_DATA_DATA_SSH_SECTION=$(grep -E '^\[data\.data\.ssh\]' "$CFG" || true)

  # Extract values (using simplified grep to capture fields from ANY section)
  NAME_VAL=$(grep -E '^\s*name\s*=\s*".*"' "$CFG" | sed -E 's/^\s*name\s*=\s*"(.*)"/\1/' | head -1)
  EMAIL_VAL=$(grep -E '^\s*email\s*=\s*".*"' "$CFG" | sed -E 's/^\s*email\s*=\s*"(.*)"/\1/' | head -1)
  
  # SSH Variables
  NAS_HOST=$(grep -E '^\s*nas_host\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  NAS_USER=$(grep -E '^\s*nas_user\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  NAS_PORT=$(grep -E '^\s*nas_port\s*=\s*([0-9]+)' "$CFG" | sed -E 's/.*=\s*([0-9]+).*/\1/' | head -1)
  CF_TUNNEL=$(grep -E '^\s*cloudflared_tunnel\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  MINT_HOST=$(grep -E '^\s*mint_host\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  MINT_HOSTNAME=$(grep -E '^\s*mint_hostname\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  MINT_USER=$(grep -E '^\s*mint_user\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  OCI_HOST=$(grep -E '^\s*oci_host\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  OCI_HOSTNAME=$(grep -E '^\s*oci_hostname\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)
  OCI_USER=$(grep -E '^\s*oci_user\s*=\s*".*"' "$CFG" | sed -E 's/.*=\s*"(.*)"/\1/' | head -1)

  # 1. Ensure [data] exists (creates {{ .name }}, {{ .email }})
  if [ -z "$HAS_DATA_SECTION" ]; then
    echo "Adding [data] section to chezmoi config"
    {
      echo ""
      echo "[data]"
      [ -n "$NAME_VAL" ] && echo "    name = \"$NAME_VAL\""
      [ -n "$EMAIL_VAL" ] && echo "    email = \"$EMAIL_VAL\""
    } >> "$CFG"
  fi

  # 2. Ensure [data.ssh] exists (creates {{ .ssh.nas_host }})
  if [ -z "$HAS_DATA_SSH_SECTION" ] && ([ -n "$NAS_HOST" ] || [ -n "$MINT_HOST" ]); then
    echo "Adding [data.ssh] section"
    {
      echo ""
      echo "[data.ssh]"
      [ -n "$NAS_HOST" ] && echo "    nas_host = \"$NAS_HOST\""
      [ -n "$NAS_USER" ] && echo "    nas_user = \"$NAS_USER\""
      [ -n "$NAS_PORT" ] && echo "    nas_port = $NAS_PORT"
      [ -n "$CF_TUNNEL" ] && echo "    cloudflared_tunnel = \"$CF_TUNNEL\""
      [ -n "$MINT_HOST" ] && echo "    mint_host = \"$MINT_HOST\""
      [ -n "$MINT_HOSTNAME" ] && echo "    mint_hostname = \"$MINT_HOSTNAME\""
      [ -n "$MINT_USER" ] && echo "    mint_user = \"$MINT_USER\""
      [ -n "$OCI_HOST" ] && echo "    oci_host = \"$OCI_HOST\""
      [ -n "$OCI_HOSTNAME" ] && echo "    oci_hostname = \"$OCI_HOSTNAME\""
      [ -n "$OCI_USER" ] && echo "    oci_user = \"$OCI_USER\""
    } >> "$CFG"
  fi

  # 3. Ensure [data.data] exists (creates {{ .data.name }})
  if [ -z "$HAS_DATA_DATA_SECTION" ]; then
    echo "Adding [data.data] section for legacy template support"
    {
      echo ""
      echo "[data.data]"
      [ -n "$NAME_VAL" ] && echo "    name = \"$NAME_VAL\""
      [ -n "$EMAIL_VAL" ] && echo "    email = \"$EMAIL_VAL\""
    } >> "$CFG"
  fi

  # 4. Ensure [data.data.ssh] exists (creates {{ .data.ssh.nas_host }})
  if [ -z "$HAS_DATA_DATA_SSH_SECTION" ] && ([ -n "$NAS_HOST" ] || [ -n "$MINT_HOST" ]); then
    echo "Adding [data.data.ssh] section for legacy template support"
    {
      echo ""
      echo "[data.data.ssh]"
      [ -n "$NAS_HOST" ] && echo "    nas_host = \"$NAS_HOST\""
      [ -n "$NAS_USER" ] && echo "    nas_user = \"$NAS_USER\""
      [ -n "$NAS_PORT" ] && echo "    nas_port = $NAS_PORT"
      [ -n "$CF_TUNNEL" ] && echo "    cloudflared_tunnel = \"$CF_TUNNEL\""
      [ -n "$MINT_HOST" ] && echo "    mint_host = \"$MINT_HOST\""
      [ -n "$MINT_HOSTNAME" ] && echo "    mint_hostname = \"$MINT_HOSTNAME\""
      [ -n "$MINT_USER" ] && echo "    mint_user = \"$MINT_USER\""
      [ -n "$OCI_HOST" ] && echo "    oci_host = \"$OCI_HOST\""
      [ -n "$OCI_HOSTNAME" ] && echo "    oci_hostname = \"$OCI_HOSTNAME\""
      [ -n "$OCI_USER" ] && echo "    oci_user = \"$OCI_USER\""
    } >> "$CFG"
  fi
fi

# Initialize and apply dotfiles
CHEZMOI_DIR="$HOME/.local/share/chezmoi-dev01"

if [ "$USE_LOCAL" = true ]; then
  # Use local dotfiles
  echo "Initializing chezmoi with local dotfiles..."
  chezmoi init --source="$DOTFILES_SOURCE" --apply=false 2>/dev/null || true
  
  echo "Applying dotfiles from local source..."
  chezmoi apply --force --source="$DOTFILES_SOURCE" 2>/dev/null && {
    echo "✅ Dotfiles applied successfully"
  } || {
    echo "⚠️  Warning: chezmoi apply failed (continuing anyway)"
    echo "   Hint: Ensure ~/.config/chezmoi/chezmoi.toml contains a [data] section"
    echo "   and matches template references (e.g., {{ .data.name }} or {{ .name }})."
  }
else
  # Use remote dotfiles with retry logic
  MAX_RETRIES=3
  RETRY_DELAY=5
  
  for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempting to clone dotfiles (attempt $i/$MAX_RETRIES)..."
    
    if chezmoi init --apply "$DOTFILES_SOURCE" 2>/dev/null; then
      echo "✅ Dotfiles applied successfully"
      break
    else
      if [ $i -lt $MAX_RETRIES ]; then
        echo "⚠️  Failed to apply dotfiles, retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
        RETRY_DELAY=$((RETRY_DELAY * 2))
      else
        echo "⚠️  Warning: Could not apply dotfiles after $MAX_RETRIES attempts"
        echo "   Container will continue without dotfiles configuration"
        echo "   Check network connectivity and repo access"
        exit 0
      fi
    fi
  done
fi

# Append container-specific SSH config if exists
CONTAINER_SSH_CONFIG="/workspaces/dev01/.devcontainer/ssh_config"
if [ -f "$CONTAINER_SSH_CONFIG" ] && [ -s "$CONTAINER_SSH_CONFIG" ]; then
  echo "Appending container-specific SSH config..."
  mkdir -p ~/.ssh
  echo "" >> ~/.ssh/config
  echo "# Container-specific SSH config from .devcontainer/ssh_config" >> ~/.ssh/config
  cat "$CONTAINER_SSH_CONFIG" >> ~/.ssh/config
  chmod 600 ~/.ssh/config
  echo "✓ Appended container SSH config"
fi

# Set correct permissions on SSH directory
if [ -d ~/.ssh ]; then
  chmod 700 ~/.ssh
  chmod 600 ~/.ssh/* 2>/dev/null || true
  chmod 644 ~/.ssh/*.pub 2>/dev/null || true
  echo "✓ Fixed SSH permissions"
fi

echo "✅ Dotfiles setup complete"
