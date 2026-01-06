# Complete Gitea Container Registry Setup & Docker Image Push Guide

## ⚠️ IMPORTANT: Cloudflare 100MB Limitation

**If your Gitea instance is behind a Cloudflare Tunnel** (free/pro plans):
- Cloudflare enforces a **100MB upload limit** per request
- Docker pushes large layers (1GB+) as single HTTP requests
- Cloudflare will cut the connection, causing endless retries with "unknown:" error
- **NO Gitea/Nginx configuration can fix this** — it's a Cloudflare edge limit

**SOLUTION:** Always push to your **local NAS IP** (`192.168.0.5:3000`) instead of the public domain (`git.mandulaj.stream`). This keeps traffic on your local network and bypasses Cloudflare entirely.

---

## Part 1: Gitea Configuration

### 1.1 Enable Container Registry in Gitea

Edit your Gitea configuration file (typically at `/volume1/docker/gitea/gitea/gitea/conf/app.ini`):

```ini
[packages]
ENABLED = true
ENABLE_CONTAINER = true
LIMIT_TOTAL_OWNER_SIZE = -1
LIMIT_SIZE_CONTAINER = -1
CHUNKED_UPLOAD_PATH = tmp/package-upload
```

**Key Settings:**
- `ENABLED = true` — Enables the packages system (container registry is part of this)
- `ENABLE_CONTAINER = true` — Specifically enables OCI container image support
- `LIMIT_TOTAL_OWNER_SIZE = -1` — Unlimited total storage per user (no size restrictions)
- `LIMIT_SIZE_CONTAINER = -1` — Unlimited per-container size (allows large layers)
- `CHUNKED_UPLOAD_PATH` — Temporary directory for large uploads during transfer

### 1.2 Configure Server Settings for Local Network Access

In the same `app.ini`, ensure the `[server]` section has:

```ini
[server]
PROTOCOL = http
HTTP_PORT = 3000
ROOT_URL = https://git.mandulaj.stream/
DOMAIN = git.mandulaj.stream
```

**Explanation:**
- `PROTOCOL = http` — Gitea runs on HTTP internally
- `ROOT_URL = https://...` — External users access via HTTPS (Cloudflare Tunnel)
- This allows Gitea to generate correct URLs for both local and remote access

### 1.3 Trust Reverse Proxy (if using Cloudflare Tunnel or similar)

In the `[security]` section:

```ini
[security]
REVERSE_PROXY_TRUSTED_PROXIES = *
```

This tells Gitea to trust headers from the reverse proxy/tunnel.

### 1.4 Restart Gitea

After editing `app.ini`:

```bash
docker restart gitea
```

Wait 10-15 seconds for Gitea to fully restart and apply changes.

---

## Part 2: Create Personal Access Token (PAT) for Docker Login

### 2.1 Access Gitea Settings

1. Open Gitea in your browser: `http://192.168.0.5:3000` (local) or `https://git.mandulaj.stream` (remote)
2. Click your **user avatar** (top-right corner)
3. Select **Settings**

### 2.2 Generate Token

1. Go to **Settings** → **Applications** (or **Applications** tab)
2. Scroll to **Personal Access Tokens**
3. Click **Generate Token**
4. Fill in:
   - **Token Name:** `docker-push` (or any name you prefer)
   - **Scopes:** Check `write:package` (or all scopes for simplicity)
5. Click **Generate Token**
6. **Copy the token immediately** — you won't see it again

**Important:** This token is your password for Docker login. Keep it secure.

---

## Part 3: Create the Docker Image

### 3.1 Build from Dockerfile

From your project root (where `.devcontainer/Dockerfile` exists):

```bash
docker build -f .devcontainer/Dockerfile -t git.mandulaj.stream/mandulaj/dev01-devcontainer:latest .
```

**What this does:**
- Reads the Dockerfile from `.devcontainer/Dockerfile`
- Builds the image with tag `git.mandulaj.stream/mandulaj/dev01-devcontainer:latest`
- Caches layers for faster rebuilds

**Expected output:**
```
Successfully built abc123def456
Successfully tagged git.mandulaj.stream/mandulaj/dev01-devcontainer:latest
```

### 3.2 Verify Image Was Built

```bash
docker images | grep dev01-devcontainer
```

Should show your image with size (e.g., `5.2GB`).

---

## Part 4: Tag for Local Registry

Create a second tag pointing to your local NAS IP (to bypass Cloudflare):

```bash
docker tag git.mandulaj.stream/mandulaj/dev01-devcontainer:latest 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

**Verify both tags exist:**

```bash
docker images | grep dev01-devcontainer
```

Should show:
```
git.mandulaj.stream/mandulaj/dev01-devcontainer:latest
192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

---

## Part 5: Configure Docker Daemon for Insecure Registry

### 5.1 On Linux Host

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

### 5.2 On macOS with Docker Desktop

1. Open **Docker Desktop** application
2. Click the **Settings gear icon** (top-right)
3. Go to **Docker Engine** tab
4. Find or add this configuration:
```json
{
  "insecure-registries": [
    "192.168.0.5:3000"
  ]
}
```
5. Click **Apply & Restart**

### 5.3 On macOS with Orbstack

1. Open **Orbstack** application
2. Click the **Settings gear icon** (or menu)
3. Go to **Docker Engine** or **Configuration** section
4. Find the Docker daemon configuration (often at `~/.orbstack/config/docker.json`)
5. Add or edit:
```json
{
  "insecure-registries": [
    "192.168.0.5:3000"
  ]
}
```
6. Restart Orbstack

Or edit directly:

```bash
mkdir -p ~/.orbstack/config
cat > ~/.orbstack/docker.json << 'EOF'
{
  "insecure-registries": [
    "192.168.0.5:3000"
  ]
}
EOF
```

Then restart Orbstack from the menu.

### 5.4 On Windows with Docker Desktop

1. Open **Docker Desktop** application
2. Click the **Settings gear icon** (bottom-right system tray)
3. Go to **Docker Engine** tab
4. Find or add this configuration:
```json
{
  "insecure-registries": [
    "192.168.0.5:3000"
  ]
}
```
5. Click **Apply & Restart**

Alternatively, edit `C:\Users\<YourUsername>\AppData\Roaming\Docker\daemon.json` directly.

**Why?** Your local NAS uses HTTP (not HTTPS), so Docker needs permission to connect insecurely over the local network.

---

## Part 6: Login to Registry

### 6.1 Docker Login Command

```bash
docker login 192.168.0.5:3000
```

### 6.2 Enter Credentials

When prompted:
```
Username: mandulaj
Password: <paste your Personal Access Token here>
```

**Important:** Use the **Personal Access Token** from Part 2, not your Gitea password.

### 6.3 Verify Login Success

If successful, you'll see:
```
Login Succeeded
```

Docker has now saved your credentials and you can push to the registry.

---

## Part 7: Push the Image to Gitea

### 7.1 Push Command

```bash
docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

### 7.2 Monitor Progress

You should see output like:

```
The push refers to repository [192.168.0.5:3000/mandulaj/dev01-devcontainer]
d2550d1e9678: Layer already exists
ce8e74ad5c7e: Layer already exists
...
8781ce1759cc: Pushed
834fb8b283e2: Pushed
...
latest: digest: sha256:abc123def456... size: 5234567890
```

**Large layers (1GB+) will take several minutes.** Be patient.

### 7.3 Handle "unauthorized: reqPackageAccess" Error

If you get:
```
unauthorized: reqPackageAccess
```

**Solution:** Login again (credentials may have expired):

```bash
docker logout 192.168.0.5:3000
docker login 192.168.0.5:3000
docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
```

---

## Part 8: Verify Push Success

### 8.1 Check in Gitea Web UI

**Local access:**
```
http://192.168.0.5:3000/mandulaj/dev01-devcontainer
```

**Remote access:**
```
https://git.mandulaj.stream/mandulaj/dev01-devcontainer
```

You should see:
- Package name: `dev01-devcontainer`
- Tags: `latest`
- Layers and digest information
- Last pushed timestamp

### 8.2 View All Packages in Admin Panel

As an admin, you can view all packages (containers, npm, pypi, etc.) in your Gitea instance:

**Local access:**
```
http://192.168.0.5:3000/-/admin/packages
```

**Remote access:**
```
https://git.mandulaj.stream/-/admin/packages
```

This shows:
- All packages across all users
- Package types (container, npm, pypi, generic, etc.)
- Storage usage per package
- Cleanup and management options
- Package statistics

### 8.3 Pull and Run Locally (Optional Test)

```bash
docker pull 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest
docker run -it 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest /bin/bash
```

---

## Complete Setup Checklist

- [ ] **Gitea Config Updated**
  - [ ] `[packages]` section enabled
  - [ ] `ENABLE_CONTAINER = true`
  - [ ] `LIMIT_SIZE_CONTAINER = -1`
  - [ ] Gitea restarted

- [ ] **Personal Access Token Created**
  - [ ] Generated in Gitea Settings → Applications
  - [ ] Token copied and saved securely
  - [ ] Has `write:package` scope

- [ ] **Docker Image Built**
  - [ ] `docker build` completed successfully
  - [ ] Image tagged: `git.mandulaj.stream/mandulaj/dev01-devcontainer:latest`

- [ ] **Local Registry Tag Created**
  - [ ] `docker tag` command run
  - [ ] Image also tagged: `192.168.0.5:3000/mandulaj/dev01-devcontainer:latest`

- [ ] **Docker Daemon Configured**
  - [ ] `insecure-registries` set for `192.168.0.5:3000`
  - [ ] Docker daemon restarted

- [ ] **Registry Login Successful**
  - [ ] `docker login 192.168.0.5:3000` completed
  - [ ] Used PAT as password

- [ ] **Image Pushed**
  - [ ] `docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest` completed
  - [ ] Large layers uploaded successfully
  - [ ] Final digest shown

- [ ] **Verified in Gitea**
  - [ ] Image visible in Gitea web UI
  - [ ] Layers and tags displayed correctly

---

## Troubleshooting

### Problem: "http: server gave HTTP response to HTTPS client"

**Cause:** Docker daemon not configured to allow insecure registry

**Fix:** 
1. Add `192.168.0.5:3000` to `insecure-registries` in Docker daemon config
2. Restart Docker daemon
3. Retry login

### Problem: "Failed to authenticate user"

**Cause:** Using Gitea password instead of Personal Access Token

**Fix:**
1. Generate a new Personal Access Token in Gitea Settings
2. Use token as password in `docker login`

### Problem: "Retrying in X seconds" / "unknown:" error during push

**Cause:** Usually Cloudflare 100MB limit (if using domain instead of local IP)

**Fix:**
1. Use local NAS IP: `192.168.0.5:3000` instead of `git.mandulaj.stream`
2. Tag image for local IP
3. Push to local IP

### Problem: Push takes very long or stalls

**Cause:** Large layers (1GB+) take time to transfer

**Fix:**
- Don't interrupt the push
- Check network connectivity
- Monitor with: `docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest 2>&1 | tail -f`

---

## Part 9: Easy Registry Switching (Optional)

Instead of managing two different URLs (`192.168.0.5:3000` for local vs `git.mandulaj.stream` for remote), you can use one of these approaches:

### Option A: Shell Script for Manual Switching

Create a script that handles registry switching automatically.

**Script:** `scripts/push-to-registry.sh`

```bash
#!/bin/bash
# Push image to either local NAS or remote Cloudflare registry

REGISTRY=${1:-local}  # Default to "local"
IMAGE="mandulaj/dev01-devcontainer:latest"

if [ "$REGISTRY" = "local" ]; then
  REGISTRY_URL="192.168.0.5:3000"
  echo "🏠 Pushing to LOCAL NAS (192.168.0.5:3000)..."
elif [ "$REGISTRY" = "remote" ]; then
  REGISTRY_URL="git.mandulaj.stream"
  echo "☁️  Pushing to REMOTE (Cloudflare Tunnel)..."
else
  echo "Usage: $0 [local|remote]"
  echo ""
  echo "Examples:"
  echo "  $0 local   # Push to NAS (recommended for large images)"
  echo "  $0 remote  # Push to Cloudflare domain (small images only)"
  exit 1
fi

echo ""
echo "📦 Image: $IMAGE"
echo "🎯 Registry: $REGISTRY_URL"
echo ""

# Tag the image
echo "[1/3] Tagging image..."
docker tag git.mandulaj.stream/$IMAGE $REGISTRY_URL/$IMAGE || exit 1

# Login
echo "[2/3] Logging in to $REGISTRY_URL..."
docker login $REGISTRY_URL || exit 1

# Push
echo "[3/3] Pushing to $REGISTRY_URL..."
docker push $REGISTRY_URL/$IMAGE || exit 1

echo ""
echo "✅ Push complete!"
echo ""
echo "View in Gitea:"
if [ "$REGISTRY" = "local" ]; then
  echo "  http://192.168.0.5:3000/mandulaj/dev01-devcontainer"
else
  echo "  https://git.mandulaj.stream/mandulaj/dev01-devcontainer"
fi
```

**Usage:**
```bash
chmod +x scripts/push-to-registry.sh

# Push to local NAS (recommended for large images)
./scripts/push-to-registry.sh local

# Push to remote (only for small images <100MB)
./scripts/push-to-registry.sh remote
```

**Benefits:**
- Single command to switch registries
- Automatic tagging and login
- Clear feedback on what's happening
- Works immediately, no configuration needed

---

### Option B: DNS Split-Brain (Long-term Solution)

**Problem:** You need to use different URLs for local vs remote, which is inconvenient.

**Solution:** Configure a local DNS server to return different IPs based on location:
- **From your local network:** `git.mandulaj.stream` → `192.168.0.5` (direct connection, bypasses Cloudflare)
- **From outside your network:** `git.mandulaj.stream` → Cloudflare Tunnel IP (public access)

Then you can use the **same URL everywhere** and it automatically uses the correct endpoint.

#### Setup DNS Split-Brain on Synology NAS

**Prerequisites:**
- Local DNS server running on NAS (e.g., PiHole, Adguard Home, or Synology DNS)
- Your local devices configured to use NAS as DNS server

**Step 1: Install DNS Server on NAS**

If using **Synology DNS Server** (built-in):
1. SSH into NAS: `ssh admin@192.168.0.5`
2. Check if DNS is running: `ps aux | grep -i dns`

If using **PiHole** (recommended):
1. SSH into NAS
2. Run: `docker run -d --name pihole -p 53:53/udp -p 53:53/tcp -p 80:80 pihole/pihole:latest`

**Step 2: Configure Local DNS Record**

For **Synology DNS Server:**
1. Go to NAS web UI → **DNS Server**
2. Add a **Local Zone**: `mandulaj.stream`
3. Add **A Record**: `git.mandulaj.stream` → `192.168.0.5`

For **PiHole:**
1. Go to PiHole web UI (http://192.168.0.5/admin)
2. **Local DNS Records** section
3. Add: `git.mandulaj.stream` → `192.168.0.5`

**Step 3: Configure Your Router**

1. Access your router's admin panel (usually `192.168.0.1` or `192.168.1.1`)
2. Go to **DHCP Settings**
3. Set **DNS Server** to your NAS IP: `192.168.0.5`

Now all devices on your network will resolve `git.mandulaj.stream` to `192.168.0.5`.

**Step 4: Test DNS Resolution**

```bash
# Should resolve to 192.168.0.5 when on local network
nslookup git.mandulaj.stream

# Should resolve to Cloudflare IP when off network (via phone hotspot, VPN, etc)
```

**Step 5: Update Docker Configuration**

You now only need `insecure-registries` for the Cloudflare domain (which won't work for large images anyway):

```json
{
  "insecure-registries": []
}
```

**Step 6: Push Using Same URL Everywhere**

```bash
# From local network: automatically connects to 192.168.0.5
docker tag app git.mandulaj.stream/mandulaj/dev01-devcontainer:latest
docker login git.mandulaj.stream
docker push git.mandulaj.stream/mandulaj/dev01-devcontainer:latest

# From remote: automatically connects via Cloudflare Tunnel
# (Same commands, but limited to <100MB per layer)
```

**Benefits:**
- Single URL everywhere (`git.mandulaj.stream`)
- Local network: fast, no Cloudflare limits, no special config
- Remote network: Cloudflare Tunnel with 100MB limit (only for small images)
- Automatic failover based on location
- Cleaner, more professional setup

**Limitations:**
- Requires DNS server on NAS
- Requires router configuration access
- Remote users still hit Cloudflare 100MB limit for large pushes
- If Cloudflare Tunnel goes down, only local access works

---

## Comparison: When to Use Each Approach

| Approach | Local Push | Remote Push | Setup Time | Complexity |
|----------|-----------|------------|-----------|-----------|
| **Manual Switching** (Option A) | Simple (1 command) | Simple (1 command) | 5 min | Low |
| **DNS Split-Brain** (Option B) | Transparent | Limited (100MB) | 30 min | Medium |
| **No Solution** (Current) | Two URLs needed | Cloudflare fails | 0 min | Low |

**Recommendation:**
- Start with **Option A** (shell script) for immediate convenience
- Move to **Option B** (DNS split-brain) later for a more professional setup



```bash
# Build image
docker build -f .devcontainer/Dockerfile -t git.mandulaj.stream/mandulaj/dev01-devcontainer:latest .

# Tag for local registry
docker tag git.mandulaj.stream/mandulaj/dev01-devcontainer:latest 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest

# Login
docker login 192.168.0.5:3000

# Push to local NAS
docker push 192.168.0.5:3000/mandulaj/dev01-devcontainer:latest

# Verify in Gitea
curl -u mandulaj:$PAT http://192.168.0.5:3000/api/v1/user/packages
```

Replace `$PAT` with your Personal Access Token for API verification.
