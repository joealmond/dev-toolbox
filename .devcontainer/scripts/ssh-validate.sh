#!/bin/bash
# ssh-validate.sh — Non-blocking SSH environment validation

echo "🔐 Validating SSH configuration (non-blocking)..."

WARNINGS=0

# Check if SSH keys exist
if [ ! -d ~/.ssh ] || [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
  echo "⚠️  Warning: No SSH keys found in ~/.ssh/"
  echo "   → Generate with: ssh-keygen -t ed25519 -C 'your_email@example.com'"
  echo "   → Or ensure host ~/.ssh is mounted correctly"
  ((WARNINGS++))
else
  echo "✓ SSH keys found"
fi

# Check SSH config syntax (basic validation)
if [ -f ~/.ssh/config ]; then
  # Very basic syntax check: look for common errors
  if grep -q "^Host.*Host" ~/.ssh/config; then
    echo "⚠️  Warning: Possible SSH config syntax error (missing newline between Host entries)"
    ((WARNINGS++))
  else
    echo "✓ SSH config exists and passed basic syntax check"
  fi
else
  echo "⚠️  Warning: No ~/.ssh/config found (will be created by dotfiles if configured)"
  ((WARNINGS++))
fi

# Check if cloudflared is available (for SSH tunneling)
if ! command -v cloudflared &>/dev/null; then
  echo "⚠️  Warning: cloudflared not found (required for SSH tunneling to nas/oci)"
  echo "   → Install with: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared"
  ((WARNINGS++))
else
  echo "✓ cloudflared is installed"
  
  # Check if .cloudflared directory exists (optional but recommended)
  if [ ! -d ~/.cloudflared ]; then
    echo "⚠️  Warning: ~/.cloudflared directory not found (required for Cloudflare Access authentication)"
    echo "   → This is optional if not using Cloudflare Access tunnels"
    echo "   → Mount from host with: \"${localEnv:HOME}/.cloudflared:/home/node/.cloudflared:ro\""
    ((WARNINGS++))
  else
    echo "✓ .cloudflared directory found"
  fi
fi

# Test SSH connectivity to known hosts (non-blocking)
if [ -f ~/.ssh/config ]; then
  SSH_HOSTS=$(grep "^Host " ~/.ssh/config | awk '{print $2}' | grep -v "\*" | head -3)
  if [ -n "$SSH_HOSTS" ]; then
    echo "Testing SSH connectivity to configured hosts..."
    for host in $SSH_HOSTS; do
      if timeout 3 ssh -o BatchMode=yes -o ConnectTimeout=3 -o StrictHostKeyChecking=no "$host" exit 2>/dev/null; then
        echo "✓ SSH to $host: OK"
      else
        echo "⚠️  Warning: Cannot connect to $host (check keys, network, or host availability)"
        ((WARNINGS++))
      fi
    done
  fi
fi

# Summary
if [ $WARNINGS -eq 0 ]; then
  echo "✅ SSH validation passed with no warnings"
else
  echo "⚠️  SSH validation completed with $WARNINGS warning(s) — container will continue"
  echo "   → Fix warnings for full SSH functionality"
fi

# Always exit 0 (non-blocking)
exit 0
