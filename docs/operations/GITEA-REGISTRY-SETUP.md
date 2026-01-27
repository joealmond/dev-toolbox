# Gitea Container Registry Setup (Synology NAS)

This guide shows how to enable Gitea Container Registry on your Synology NAS and push the dev-toolbox-devcontainer image.

## Prerequisites

- Gitea running as Docker container on Synology NAS
- SSH access to NAS
- `docker` CLI available on NAS (or use Synology container manager)

## Step 1: Enable Container Registry in Gitea

### Find Gitea app.ini

Since Gitea is running as a Docker container on Synology, the config is typically at:

```bash
ssh admin@192.168.1.100
# Option A: If using Docker volume mount
docker inspect gitea | grep -i volume  # Find mount path
# Example output: "/volume1/docker/gitea/data"

# Option B: Common Synology paths
ls -la /volume1/docker/gitea/data/
# OR
ls -la /var/lib/docker/volumes/gitea_data/_data/
```

### Enable Registry in app.ini

Edit Gitea configuration:

```bash
# SSH into NAS
ssh admin@192.168.1.100

# Stop Gitea container first
docker stop gitea
# OR via Synology UI: Container Manager → Gitea → Stop

# Edit app.ini
sudo nano /volume1/docker/gitea/data/gitea/conf/app.ini
# OR your path from Step 1

# Add or update these sections:
```

**Add to `app.ini`:**

```ini
[packages]
ENABLED = true
ENABLE_CONTAINER = true

[service]
ALLOW_ONLY_EXTERNAL_REGISTRATION = false

# Optional: Set container registry domain
[container]
REGISTRY_ENDPOINT = https://git.mandulaj.stream
# Or use IP: http://192.168.1.100:3000
```

**Example app.ini location for Docker on Synology:**
```
/volume1/docker/gitea/data/gitea/conf/app.ini
```

### Restart Gitea

```bash
# SSH into NAS
docker start gitea
# OR via Synology UI: Container Manager → Gitea → Start

# Verify registry is enabled
curl -k https://git.mandulaj.stream/v2/ -u admin:password
# Should return 200 OK, not 404
```

## Step 2: Configure Docker Login on Dev Machine

### Login to Gitea Registry (from your dev machine or container)

```bash
docker login git.mandulaj.stream -u mandulaj
# Prompts for password (use Gitea password or PAT)
```

Or in devcontainer, use credential file:

```bash
# In devcontainer, create ~/.docker/config.json
mkdir -p ~/.docker
cat > ~/.docker/config.json << 'EOF'
{
  "auths": {
    "git.mandulaj.stream": {
      "auth": "base64(admin:password)"
    }
  }
}
EOF

# Or use credential-ecr-login helper (cleaner)
docker login git.mandulaj.stream
```

## Step 3: Build and Tag Image

### Image Naming Convention

Gitea container registry requires this format:
```
{registry}/{owner}/{image}:{tag}
```

- **registry**: `git.mandulaj.stream` (your Gitea domain)
- **owner**: `mandulaj` (your Gitea username)
- **image**: `dev-toolbox-devcontainer` (image name)
- **tag**: `latest` (or version like `v1.0.0`)

**Reference**: [Gitea Container Registry Docs](https://docs.gitea.com/usage/packages/container#image-naming-convention)

### Build Image

```bash
# On your dev machine (or in devcontainer)
docker build -f .devcontainer/Dockerfile -t git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:latest .
```

### Verify Image

```bash
docker images | grep dev-toolbox-devcontainer
# Output: git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer   latest   <image-id>
```

## Step 4: Push to Gitea Registry

```bash
docker push git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:latest
```

**Monitor push:**
```bash
# Watch Gitea web UI
# https://git.mandulaj.stream/admin/packages → Container
# Should show dev-toolbox-devcontainer:latest
```

## Step 5: Update devcontainer.json to Use Registry Image

Instead of building from Dockerfile, use the pre-built image:

### Option A: Use Registry Image (Recommended for CI/CD)

Edit `.devcontainer/devcontainer.json`:

```jsonc
{
  // Instead of:
  // "dockerFile": "./Dockerfile",
  
  // Use:
  "image": "git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:latest",
  
  "remoteEnv": {
    "CHEZMOI_REPO": "https://git.mandulaj.stream/mandulaj/dev-toolbox-dotfiles.git"
  },
  "containerEnv": {
    "OLLAMA_HOST": "http://host.docker.internal:11434"
  }
}
```

### Option B: Keep Dockerfile Locally

Keep `.devcontainer/devcontainer.json` as-is for local development, use registry image for CI/CD or team builds.

## Step 6: Verify Container Registry Access

### From Gitea Web UI

1. Navigate to `https://git.mandulaj.stream/admin/packages`
2. Go to "Container" tab
3. Should see `dev-toolbox-devcontainer:latest`
4. Click package to see image details, pull commands, etc.

### Pull Image from Another Machine

```bash
# After docker login git.mandulaj.stream
docker pull git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:latest

# Use in devcontainer.json:
# "image": "git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:latest"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `403 Forbidden` when pushing | Gitea registry not enabled in app.ini, or user lacks permissions |
| `404 Not Found` on `/v2/` endpoint | Registry disabled; re-enable in app.ini and restart Gitea |
| `connection refused` to NAS | Check NAS IP, Gitea running, firewall allows port 3000/443 |
| Auth fails with `denied: unauthorized` | Re-run `docker login git.mandulaj.stream` or fix `~/.docker/config.json` |
| Docker push timeout | Check NAS disk space: `df -h` on NAS |

## Optional: Automate Pushes with CI/CD

If you add GitHub Actions or Gitea Runners, use:

```yaml
- name: Build and push to Gitea Registry
  run: |
    docker login git.mandulaj.stream -u mandulaj -p ${{ secrets.GITEA_TOKEN }}
    docker build -f .devcontainer/Dockerfile -t git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:${{ github.sha }} .
    docker push git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:${{ github.sha }}
    docker tag git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:${{ github.sha }} git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:latest
    docker push git.mandulaj.stream/mandulaj/dev-toolbox-devcontainer:latest
```

## References

- [Gitea Container Registry Docs](https://docs.gitea.io/en-us/packages/container/)
- [Docker Registry API](https://docs.docker.com/registry/spec/api/)
- [Synology Docker Guide](https://kb.synology.com/en-us/DSM/tutorial/How_to_build_your_own_docker_image)
