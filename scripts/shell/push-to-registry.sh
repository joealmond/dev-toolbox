#!/bin/bash
# Push image to either local NAS or remote Cloudflare registry
# Usage: ./push-to-registry.sh [local|remote]

set -e

REGISTRY=${1:-local}  # Default to "local"
IMAGE="mandulaj/dev-toolbox-devcontainer:latest"

if [ "$REGISTRY" = "local" ]; then
  REGISTRY_URL="192.168.0.5:3000"
  COLOR_EMOJI="🏠"
  COLOR="Local NAS"
elif [ "$REGISTRY" = "remote" ]; then
  REGISTRY_URL="git.mandulaj.stream"
  COLOR_EMOJI="☁️"
  COLOR="Cloudflare Tunnel"
else
  echo "❌ Invalid registry: $REGISTRY"
  echo ""
  echo "Usage: $0 [local|remote]"
  echo ""
  echo "Examples:"
  echo "  $0 local   # Push to NAS at 192.168.0.5:3000 (recommended for large images)"
  echo "  $0 remote  # Push to git.mandulaj.stream (only for images <100MB per layer)"
  echo ""
  echo "ℹ️  Default is 'local' if no argument provided."
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          Docker Image Push to Git Registry            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "  $COLOR_EMOJI  Registry: $COLOR ($REGISTRY_URL)"
echo "  📦 Image:    $IMAGE"
echo ""

# Tag the image
echo "[1/3] 🏷️  Tagging image for $REGISTRY_URL..."
if docker tag git.mandulaj.stream/$IMAGE $REGISTRY_URL/$IMAGE; then
  echo "     ✅ Tagged successfully"
else
  echo "     ❌ Failed to tag image"
  exit 1
fi

echo ""

# Login
echo "[2/3] 🔐 Logging in to $REGISTRY_URL..."
if docker login $REGISTRY_URL; then
  echo "     ✅ Login successful"
else
  echo "     ❌ Login failed"
  exit 1
fi

echo ""

# Push
echo "[3/3] ⬆️  Pushing to $REGISTRY_URL..."
echo "     (Large images may take several minutes...)"
echo ""

if docker push $REGISTRY_URL/$IMAGE; then
  echo ""
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║                   ✅ Push Complete!                   ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo ""
  
  if [ "$REGISTRY" = "local" ]; then
    echo "📍 View in Gitea (local network only):"
    echo "   http://192.168.0.5:3000/mandulaj/dev01-devcontainer"
  else
    echo "📍 View in Gitea:"
    echo "   https://git.mandulaj.stream/mandulaj/dev01-devcontainer"
  fi
  
  echo ""
  echo "🎉 Your Docker image is now in the registry!"
  echo ""
else
  echo ""
  echo "❌ Push failed. Check the error above."
  exit 1
fi
