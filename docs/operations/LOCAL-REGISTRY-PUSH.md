# Local Registry Push to NAS

Push Docker images directly to your Gitea registry on the NAS at `192.168.0.5:3000`. This approach:
- **Bypasses Cloudflare** entirely (no 100MB upload limits)
- **Much faster** transfers on local LAN
- **Reliable** for large images (6GB+)

## Prerequisites

- NAS accessible at `192.168.0.5:3000` on your local network
- Docker daemon configured to allow insecure registry (HTTP)
- Gitea credentials (username/password or Personal Access Token)

## Step 1: Configure Docker for Insecure Local Registry

**On macOS (Docker Desktop):**

1. Open **Docker Desktop** → **Settings** (gear icon)
2. Go to **Docker Engine** tab
3. Add this to the JSON configuration:
```json
{
  "insecure-registries": [
    "192.168.0.5:3000"
  ]
}
```
4. Click **Apply & Restart**

**On Linux:**
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "insecure-registries": [
    "192.168.0.5:3000"
  ]
}
EOF
sudo systemctl restart docker
```

## Step 2: Login to Local Registry

```bash
docker login 192.168.0.5:3000 -u mandulaj
```

When prompted for password, use:
- Your Gitea password, OR
- A Personal Access Token (recommended):
  1. Go to `http://192.168.0.5:3000` (local NAS access)
  2. Settings → Applications → Create New Token
  3. Copy and paste the token as your password

## Step 3: Tag Your Image

```bash
# If you have an image ID:
docker tag <IMAGE_ID> 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest

# Example:
docker tag 3d30efddb4d1 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

## Step 4: Push to Local Registry

```bash
docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

The image will upload quickly over your local network.

## Verify Upload

Check the image in Gitea:
- Local: `http://192.168.0.5:3000/mandulaj/dev01-devcontainer`
- Public: `https://git.mandulaj.stream/mandulaj/dev01-devcontainer`

Both show the same registry (accessible via different endpoints).

## Quick Command: push-local.sh

Use the dedicated local push script for a streamlined workflow:

```bash
# View all available images
./scripts/push-local.sh

# Push a specific image by ID
./scripts/push-local.sh 3d30efddb4d1
```

**What it does:**
1. Tags your image for the local registry
2. Pushes to `192.168.0.5:3000/mandulaj/dev01-devcontainer:latest`
3. Shows success/failure with registry URLs

**Example output:**
```
╔════════════════════════════════════════════════════════╗
║        Push to Local NAS Registry (192.168.0.5)        ║
╚════════════════════════════════════════════════════════╝

🏗️  Tagging image...
   ✅ Tagged: 3d30efddb4d1 → 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest

🚀 Pushing to 192.168.0.5:3000...

✅ Push successful!

📍 Image available at:
   Local:  http://192.168.0.5:3000/mandulaj/dev01-devcontainer
   Public: https://git.mandulaj.stream/mandulaj/dev01-devcontainer
```

### Alternative: Use existing push-to-registry.sh

```bash
# Push to local NAS
./scripts/push-to-registry.sh local

# Or manually tag and push a specific image:
docker tag <IMAGE_ID> 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

## Troubleshooting

**Error: "connection refused"**
- Ensure NAS is accessible: `ping 192.168.0.5`
- Ensure Gitea is running on NAS: `curl http://192.168.0.5:3000`

**Error: "unknown: unsupported"**
- Docker daemon not restarted after adding insecure registry
- Restart Docker Desktop or systemd service

**Error: "unauthorized"**
- Re-login: `docker logout 192.168.0.5:3000` then `docker login 192.168.0.5:3000 -u mandulaj`
