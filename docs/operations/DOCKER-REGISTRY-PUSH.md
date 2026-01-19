# Docker Image Push to Gitea Container Registry

## Problem: Cloudflare 100MB Upload Limit

When pushing large Docker images (>100MB layers) through a Cloudflare Tunnel to a Gitea Container Registry, the push fails with "unknown:" error and retries indefinitely. This is because:

- Cloudflare's Free/Pro plans enforce a **100MB upload limit** per request body
- Docker pushes image layers as single HTTP requests
- Cloudflare cuts the connection when uploads exceed 100MB
- Docker retries endlessly, never succeeding

**No amount of Gitea or Nginx configuration can fix this** — the block happens at Cloudflare's edge before traffic reaches your NAS.

## Solution: Push Directly to Local NAS IP

Instead of pushing through the public domain (`git.mandulaj.stream`), push directly to your NAS IP address on the local network (`192.168.0.5:3000`). This keeps traffic on your LAN and bypasses Cloudflare entirely.

### Prerequisites

- NAS IP address (e.g., `192.168.0.5`)
- Gitea running on port `3000` (or your configured port)
- Access to the local network

### Step 1: Configure Docker Daemon

On your **host machine** (not in the dev container), configure Docker to allow insecure (HTTP) connections to the local registry.

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

**On macOS/Windows (Docker Desktop):**
1. Open Docker Desktop → **Settings** (gear icon)
2. Go to **Docker Engine** tab
3. Add to the JSON configuration:
```json
{
  "insecure-registries": [
    "192.168.0.5:3000"
  ]
}
```
4. Click **Apply & Restart**

### Step 2: Tag the Image for Local Registry

```bash
docker tag git.mandulaj.stream/mandulaj/dev01-devcontainer:latest 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

### Step 3: Create Gitea Personal Access Token

1. Navigate to `http://192.168.0.5:3000` (local NAS access)
2. Go to **Settings** → **Applications**
3. Click **Create New Token**
4. Give it a name (e.g., `docker-push`)
5. Copy the generated token

### Step 4: Login to Local Registry

```bash
docker login 192.168.0.5:3000
```

When prompted:
- **Username:** `mandulaj`
- **Password:** Paste the Personal Access Token (not your Gitea password)

### Step 5: Push the Image

```bash
docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

The large layers (3GB+) should now upload successfully over your local network without hitting Cloudflare limits.

## Why This Works

1. **Local Network:** Traffic stays on your LAN, avoiding Cloudflare entirely
2. **No HTTP Limit:** Your local network has no 100MB upload restriction
3. **Faster:** Local network transfers are much faster than internet
4. **Same Registry:** The image is stored in the same Gitea instance, just accessed via a different endpoint

## Verification

After push completes, verify the image in Gitea:

- Navigate to `http://192.168.0.5:3000/mandulaj/dev01-devcontainer` (local)
- Or `https://git.mandulaj.stream/mandulaj/dev01-devcontainer` (public)

Both endpoints show the same container registry data.

## Troubleshooting

### "HTTPS client" Error

```
Error: Get "https://192.168.0.5:3000/v2/": http: server gave HTTP response to HTTPS client
```

**Fix:** Ensure Docker daemon config includes `insecure-registries` and Docker was restarted.

### "unauthorized: Failed to authenticate user"

```
Error response from daemon: Get "http://192.168.0.5:3000/v2/": unauthorized: Failed to authenticate user
```

**Fix:** 
- Verify you're using the Personal Access Token, not your Gitea password
- Confirm the token was copied correctly (no extra spaces)
- Generate a new token if needed

### "unauthorized: reqPackageAccess"

```
unauthorized: reqPackageAccess
```

**Fix:** Login to the registry first:
```bash
docker login 192.168.0.5:3000
```

## Remote Access Alternative

If you need to push from outside your local network:

1. **Use Tailscale/WireGuard:** Set up a VPN on your NAS to create a secure tunnel that behaves like a local network
2. **Upgrade Cloudflare:** Cloudflare Business plan supports 200MB, Enterprise supports unlimited (not cost-effective)

For most setups, pushing locally is the simplest and fastest solution.
