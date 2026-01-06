# Devcontainer Guide

## Quick Start
- **VS Code**: Command Palette → "Reopen in Container"
- **CLI**: `devcontainer up --workspace-folder .` then `devcontainer exec --workspace-folder . bash`
- **Requirements**:
  - Docker/Podman socket at `/var/run/docker.sock`
  - Ollama server running on host at `http://host.docker.internal:11434` (or Linux: `localhost:11434`)
  - Ports 3000/3001 exposed if needed

## How It Works

### Docker Build (One-time)
The `Dockerfile` builds the container with:
- **Base Image**: `node:24-bookworm` (Debian Linux)
- **Node/npm**: Node 24 with npm 11.7.0 (pinned for stability)
- **System Tools**: git, curl, openssh-client, cloudflared (for SSH tunneling)
- **Ollama CLI**: Binary installation only (no models downloaded)
- **Global npm tools**: PM2, backlog.md, @kilocode/cli (pre-installed and cached)
- **npm Dependencies**: Copied and installed from `package*.json`

### Container Setup (Every creation)
When the container starts, `setup-tools.sh` runs:
1. **Installs chezmoi** - Dotfile manager
2. **Clones dotfiles** from `CHEZMOI_REPO` (HTTPS) 
3. **Applies configs** - git user/email, SSH, bash aliases
4. **Fixes npm cache** - Resolves permission issues
5. **Installs global tools** - PM2, backlog.md, kodu
6. **Runs npm install** - Project dependencies

## Dotfiles with chezmoi

### Setup chezmoi Repo
1. Create a **private** dotfiles repo on Gitea or GitHub:
   ```bash
   chezmoi init ~/.local/share/chezmoi-dev01
   chezmoi add ~/.gitconfig ~/.bash_aliases
   chezmoi add ~/.ssh/config  # Optional, use templates for IPs
   cd ~/.local/share/chezmoi-dev01
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Essential files to include**:
   - `.gitconfig` - User/email for commits (required for git operations)
   - `.bash_aliases` - Project shortcuts and aliases
   - `.ssh/config` - SSH hosts (optional, use templates for sensitive IPs)

### Configure Devcontainer
Update `.devcontainer/devcontainer.json`:
```jsonc
"remoteEnv": {
  "CHEZMOI_REPO": "https://git.mandulaj.stream/mandulaj/dev01-dotfiles.git"
}
```

**Why HTTPS?** Avoids needing SSH key setup in the ephemeral container. If the dotfiles repo is private, ensure:
- SSH keys are accessible on the host (mounted via `~/.ssh`)
- OR use GitHub PAT with HTTPS URL
- OR use Gitea with HTTPS

### Update Dotfiles
```bash
# On host, update a config
chezmoi add ~/.gitconfig
cd ~/.local/share/chezmoi-dev01 && git push

# In container, pull latest
chezmoi update
```

## SSH Tunneling with cloudflared

### Setup
- **cloudflared** is pre-installed in the container for SSH ProxyCommand tunneling
- **SSH config** is applied from dotfiles via chezmoi, then merged with container-specific overrides from `.devcontainer/ssh_config`

### Host prerequisites (per machine)
- Install cloudflared on the host and authenticate to your Access app so that `~/.cloudflared` contains the cert/token.
- Keep `~/.cloudflared` **out of git/dotfiles**; it is secret and machine-specific.
- The devcontainer mounts host `~/.cloudflared` read-only into the container (`/home/node/.cloudflared`).

### Configuration
Update `.devcontainer/ssh_config` with your NAS IP:
```bash
Host nas
  HostName 192.168.1.100  # Change to your NAS IP
  User admin              # Change to your username
  Port 22
  StrictHostKeyChecking accept-new
```

The container automatically applies this after chezmoi dotfiles sync, so `ssh nas` will work with your configured ProxyCommand.

### Test
```bash
# Inside container
ssh nas ls ~  # Should list your NAS home directory
```

### Using a new host
1. On the host, run `cloudflared access ssh --hostname ssh.mandulaj.stream` (or your hostname) to refresh the cert in `~/.cloudflared`.
2. Reopen/rebuild the devcontainer so the mount picks up the refreshed certs.
3. Inside the container, verify `ls ~/.cloudflared` then `ssh -vvv nas`.

## Ollama Integration

### Setup
- **Host**: Run Ollama server (`ollama serve` or systemd service)
- **Container**: Ollama CLI is pre-installed, environment variable points to host:
  ```jsonc
  "containerEnv": {
    "OLLAMA_HOST": "http://host.docker.internal:11434"  // Mac/Windows
    // On Linux: "localhost:11434"
  }
  ```

### Verify
```bash
# Inside container
ollama --version                          # Check CLI installed
curl $OLLAMA_HOST/api/tags                # Test host connection
```

### Usage
```bash
# In container, pull/run models from host
ollama pull mistral
ollama run mistral "Hello"
```

## Offline Usage

The devcontainer is designed to work offline after the first build:

### What's Pre-built (Docker image layer - cached, offline-friendly)
- **Ollama CLI** - Installed during Docker build
- **cloudflared** - SSH tunneling binary for ProxyCommand in SSH config
- **Global npm tools** - PM2, backlog.md, @kilocode/cli (installed in Dockerfile, cached)
- **Base system tools** - git, curl, openssh-client
- **Node.js 24** and **npm 11.7.0** (pinned in Dockerfile)

These only download once and are cached in the Docker image.

### What's Dynamic (Container startup - may need internet)
- **Dotfiles from repo** - Via chezmoi (skipped gracefully if offline)
- **Project dependencies** - `npm install` (uses `package-lock.json`)

### Offline Workflow

**First time (with internet):**
```bash
# Build the image once - caches everything
docker build -t dev01-devcontainer .devcontainer/
```

**Subsequent runs (offline or online):**
```bash
# Container starts, skips failed dotfile sync if offline
# Project dependencies use cached node_modules or package-lock.json
```

**If you work offline frequently:**
1. Pre-pull dotfiles: `git clone <repo> ~/.local/share/chezmoi-dev01` before going offline
2. Keep `package-lock.json` committed (ensures `npm ci` works offline)
3. Consider pre-creating `.gitconfig` and `.ssh/config` locally if needed
- **Copy to another project**: `cp -r .devcontainer/ /path/to/other-project/`
- **Customize**: Edit `Dockerfile` to add system packages or `setup-tools.sh` for different tools
- **Publish as template**: Build & push image to registry, replace `"dockerFile"` with `"image": "ghcr.io/you/dev-image:latest"` in `devcontainer.json`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| npm install fails with EACCES | Already fixed in setup script (`chmod -R u+w ~/.npm`), but if persists: clear `.npm` folder |
| chezmoi clone fails | Check CHEZMOI_REPO URL is valid and reachable (HTTPS works without keys) |
| Can't reach Ollama on host | Verify Ollama running, check `OLLAMA_HOST` env var matches host IP/port |
| SSH to GitHub fails | Mount `~/.ssh` from host (already configured in `devcontainer.json`), ensure key has permissions 600 |

- Add a minimal README in the target project describing host expectations and how to start (`devcontainer up` or VS Code).

## Compose Option (if you add services)
- Create a `docker-compose.dev.yml` with your services.
- In `devcontainer.json`, set `"dockerComposeFile": "docker-compose.dev.yml"` and `"service": "dev"` (or the service name).
- The devcontainer CLI/VS Code will start the compose stack and attach to the chosen service.

## Typical Commands
- Start/build: `devcontainer up --workspace-folder .`
- Open shell: `devcontainer exec --workspace-folder . bash`
- Rebuild after edits: `devcontainer build --workspace-folder .`

## Tool Auto-Installation
- `setup-tools.sh` checks and installs required tools on container creation:
  - Ollama CLI (client for host server)
  - PM2 (process manager)
  - Backlog.md CLI
  - Kilo Code CLI (kodu)
  - Project npm dependencies
- Runs via `postCreateCommand`; idempotent (safe to run multiple times).
- To add more tools, edit `.devcontainer/setup-tools.sh`.

## Notes
- `postCreateCommand` runs inside the container after build; keep it idempotent.
- NPM cache is persisted via the named volume `ticket-processor-npm-cache`.
- Host Docker/Podman socket is mounted; ensure your user can access it on the host.
