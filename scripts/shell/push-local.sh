#!/bin/bash
# Push image to local NAS Gitea registry (192.168.0.5:3000)
# Bypasses Cloudflare, much faster for large images

set -e

IMAGE_ID="${1:-}"
REGISTRY="192.168.0.5:3000"
REPO="mandulaj/dev-toolbox-devcontainer"
TAG="latest"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║        Push to Local NAS Registry (192.168.0.5)        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# If no image ID provided, show available images
if [ -z "$IMAGE_ID" ]; then
  echo "📦 Available images:"
  echo ""
  docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}" | head -20
  echo ""
  echo "Usage: $0 <IMAGE_ID>"
  echo ""
  echo "Example:"
  echo "  $0 3d30efddb4d1"
  echo ""
  exit 0
fi

echo "🏗️  Tagging image..."
if docker tag "$IMAGE_ID" "$REGISTRY/$REPO:$TAG"; then
  echo "   ✅ Tagged: $IMAGE_ID → $REGISTRY/$REPO:$TAG"
else
  echo "   ❌ Failed to tag image"
  exit 1
fi

echo ""
echo "🚀 Pushing to $REGISTRY..."
echo ""

if docker push "$REGISTRY/$REPO:$TAG"; then
  echo ""
  echo "✅ Push successful!"
  echo ""
  echo "📍 Image available at:"
  echo "   Local:  http://192.168.0.5:3000/$REPO"
  echo "   Public: https://git.mandulaj.stream/$REPO"
  echo ""
else
  echo ""
  echo "❌ Push failed"
  exit 1
fi
