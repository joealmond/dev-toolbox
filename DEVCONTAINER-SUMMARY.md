# Devcontainer & Registry Summary

Latest updates and current state of the dev01 development environment.

## 📦 Current Versions

- **Node.js**: 24 (base image: `node:24-bookworm`)
- **npm**: 11.7.0 (pinned)
- **Dockerfile**: Builds on Node 24 with npm pre-configured

## 🔧 What's Installed in Container

### Pre-installed (Docker image, cached once)
- ✅ Ollama CLI (binary from ollama.com)
- ✅ cloudflared (SSH tunneling binary)
- ✅ PM2 (process manager)
- ✅ backlog.md (task CLI)
- ✅ @kilocode/cli (Kilo Code, command: `kilocode`)

### Installed on Container Start (setup-tools.sh)
- ✅ chezmoi (dotfile manager)
- ✅ Dotfiles from `https://git.mandulaj.stream/mandulaj/dev01-dotfiles.git`
- ✅ SSH config with cloudflared tunneling support
- ✅ Project dependencies from package.json

## 🌐 SSH Tunneling Setup

**cloudflared** is pre-installed for SSH ProxyCommand tunneling.

### Configuration Files
- **`.devcontainer/ssh_config`** - Container-specific SSH overrides (currently empty, dotfiles handle everything)
- **Dotfiles SSH config** - Host-level SSH config (via chezmoi)
  - Applied from: `https://git.mandulaj.stream/mandulaj/dev01-dotfiles.git`
  - Contains all SSH host definitions (nas, mint, oci)
  - Mounted from host: `~/.ssh` → `/home/node/.ssh` (read-write)

### SSH Hosts Available
```bash
# NAS via cloudflared tunnel
ssh nas  # mandulaj@ssh.mandulaj.stream:2299

# Linux Mint (local network)
ssh mint  # mandulaj@192.168.0.10:22

# OCI via jump host
ssh oci  # Jumps through mint to OCI instance
```

### Important: SSH Config Requirements
Your dotfiles SSH config must include:
- **User** field for each host
- **Port** field if non-standard (not 22)
- Proper newlines between entries (syntax errors will break SSH)

**Example nas host config:**
```
Host nas
  Hostname ssh.mandulaj.stream
  User mandulaj
  Port 2299
  ProxyCommand /usr/local/bin/cloudflared access ssh --hostname %h
  ForwardAgent yes
```

### Troubleshooting
- **"invalid quotes" error**: Missing newline between SSH config entries
- **Password prompts**: SSH keys not set up, use `ssh-copy-id nas` to add keys
- **Connection refused**: Check hostname/port in SSH config
- **cloudflared not found**: Rebuild container to install binary

## 📚 Documentation

| File | Purpose |
|------|---------|
| [.devcontainer/README.md](.devcontainer/README.md) | Quick start & tool guide |
| [DEVCONTAINER-SETUP.md](DEVCONTAINER-SETUP.md) | Complete setup details (Mac/Linux) |
| [GITEA-REGISTRY-SETUP.md](GITEA-REGISTRY-SETUP.md) | Push container image to Gitea Registry |
| [package.json](package.json) | Requires Node 24, npm 11.7.0 |

## 🚀 Rebuilding Container

After any changes to `.devcontainer/`:

**VS Code:**
- Command Palette → "Dev Containers: Rebuild Container"

**CLI:**
```bash
devcontainer rebuild --workspace-folder .
```

**Docker directly:**
```bash
docker build -f .devcontainer/Dockerfile -t dev01-devcontainer:latest .
```

## 🔄 Next Steps

### Option 1: Test Container Locally
Everything works now. Continue development in the current container.

### Option 2: Push to Gitea Container Registry
Once container is stable, push to your NAS registry:

**Correct naming format** (owner is required):
```bash
# Build with proper naming: {registry}/{owner}/{image}:{tag}
docker build -f .devcontainer/Dockerfile -t git.mandulaj.stream/mandulaj/dev01-devcontainer:latest .

# Login to registry
docker login git.mandulaj.stream -u mandulaj

# Push to registry
docker push git.mandulaj.stream/mandulaj/dev01-devcontainer:latest
```

**Reference**: [Gitea Container Registry Naming Convention](https://docs.gitea.com/usage/packages/container#image-naming-convention)

**Then update devcontainer.json:**
```jsonc
{
  "image": "git.mandulaj.stream/mandulaj/dev01-devcontainer:latest",
  // Remove: "dockerFile": "./Dockerfile",
}
```

All team members can then pull from registry instead of building locally.

### Option 3: Enable Container Registry on NAS
If not already enabled:
1. Follow [GITEA-REGISTRY-SETUP.md](GITEA-REGISTRY-SETUP.md)
2. Enable `[packages]` and `[container]` sections in Gitea app.ini
3. Restart Gitea container
4. Verify: `curl -k https://git.mandulaj.stream/v2/`

## ✅ Verified Features

- ✅ Node 24 & npm 11.7.0 pinned
- ✅ Ollama CLI available
- ✅ cloudflared binary installed
- ✅ All npm tools available (PM2, backlog.md, kilocode)
- ✅ chezmoi dotfiles sync (graceful offline fallback)
- ✅ SSH config from dotfiles (includes nas, mint, oci hosts)
- ✅ SSH tunneling via cloudflared working (`ssh nas` connects)
- ✅ Project dependencies caching (package-lock.json)
- ✅ Host `~/.ssh` mounted (read-write) for SSH keys and config

## ⚠️ Known Limitations & Solutions

| Issue | Solution |
|-------|----------|
| **SSH password prompts** | Run `ssh-copy-id nas` to add public key to NAS authorized_keys |
| **SSH "invalid quotes" error** | Check dotfiles SSH config for missing newlines between entries |
| **Offline first run** | Requires internet to download npm packages (cached after) |
| **~/.cloudflared not found warning** | Normal if not using Access; ignore if direct SSH works |
| **Ollama unreachable** | Container can access host Ollama, not run standalone models |
| **Gitea keychain prompt** | Click "Always Allow" or use PAT instead of password |

## 📝 Recent Changes

- Updated Node from 20 → 24
- Pinned npm to 11.7.0 (in Dockerfile)
- Added cloudflared binary installation
- Mounted host `~/.ssh` for SSH keys and config (read-write)
- Removed `.devcontainer/ssh_config` override (dotfiles handle everything)
- Fixed SSH config syntax errors (missing newlines, User/Port fields)
- Created SSH tunneling documentation
- Added Gitea Container Registry setup guide with correct naming convention
- Verified SSH working: `ssh nas`, `ssh mint`, `ssh oci` all functional
