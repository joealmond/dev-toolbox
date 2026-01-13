# Devcontainer Setup Guide

This devcontainer provides a stable, reproducible Node 24 development environment with automatic dotfiles sync, PM2 process management, and non-blocking validation checks.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Host Machine (macOS/Linux)                              │
│  ├── /Users/mandulaj/dev/dev01 (project)               │
│  ├── /Users/mandulaj/dev/dev01dot (dotfiles)           │
│  ├── ~/.ssh (SSH keys)                                  │
│  └── Ollama Server (port 11434)                         │
└─────────────────────────────────────────────────────────┘
                         │
                    (mounted)
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Devcontainer (Node 24 + Tools)                          │
│                                                          │
│  postCreateCommand → setup-tools.sh                     │
│    ├── dotfiles-setup.sh (chezmoi apply)               │
│    ├── verify global tools (PM2, kodu, backlog)        │
│    └── npm install (project dependencies)              │
│                                                          │
│  postStartCommand → pm2-run.sh                          │
│    ├── env-detect.sh (auto-detect OLLAMA_HOST)         │
│    ├── ssh-validate.sh (non-blocking SSH checks)       │
│    └── pm2 start ecosystem.config.js                   │
│                                                          │
│  Running:                                                │
│    └── PM2 → watcher.js (with auto-restart on changes) │
└─────────────────────────────────────────────────────────┘
```

## 📂 File Structure

```
.devcontainer/
├── devcontainer.json       # Main configuration (mounts, lifecycle)
├── Dockerfile              # Node 24 image with pre-installed tools
├── setup-tools.sh          # postCreateCommand orchestrator
├── ssh_config              # Container-specific SSH overrides
├── scripts/                # Modular provisioning scripts
│   ├── env-detect.sh       # Auto-detect OLLAMA_HOST
│   ├── ssh-validate.sh     # Non-blocking SSH validation
│   ├── dotfiles-setup.sh   # Apply dotfiles via chezmoi
│   └── pm2-run.sh          # Start PM2 with checks
└── SETUP-GUIDE.md          # This file
```

## 🚀 Quick Start

### Prerequisites on Host

1. **Dotfiles repository** at `/Users/mandulaj/dev/dev01dot`
2. **SSH keys** in `~/.ssh/` (id_rsa or id_ed25519)
3. **Ollama running** on host: `brew services start ollama` (macOS) or `systemctl start ollama` (Linux)

### Open in Container

```bash
# From VS Code
# 1. Open /Users/mandulaj/dev/dev01 in VS Code
# 2. Command Palette → "Dev Containers: Reopen in Container"
# 3. Wait for postCreateCommand + postStartCommand to complete
```

### Verify Setup

```bash
# Check PM2 status
pm2 list

# View logs
pm2 logs ticket-processor

# Check Ollama connectivity
echo $OLLAMA_HOST
ollama list

# Test SSH (should show no errors)
ssh -T git@github.com
```

## 🔧 Configuration

### Dotfiles

Dotfiles are applied from `/Users/mandulaj/dev/dev01dot` (mounted as read-only) via chezmoi:

```bash
# Dotfiles source priority:
1. Local mount: /workspaces/dev01dot (if exists)
2. Remote repo: $CHEZMOI_REPO (fallback)

# Applied configs:
- ~/.gitconfig
- ~/.ssh/config
- ~/.bash_aliases
- ~/.zshrc (if using zsh)
```

#### Chezmoi config location & template variables

- The container copies `/workspaces/dev01dot/.chezmoi.toml` into `~/.config/chezmoi/chezmoi.toml`.
- Chezmoi template data may appear as top-level keys (e.g., `name`, `email`) or under a `[data]` section.
- To keep templates resilient, prefer this form in templates:

```
[user]
  name = {{ or .data.name .name }}
  email = {{ or .data.email .email }}
```

- If you only use top-level keys, you can use:

```
[user]
  name = {{ .name }}
  email = {{ .email }}
```

- Ensure `~/.config/chezmoi/chezmoi.toml` has the values you expect:

```
[data]
  name = "Your Name"
  email = "your@email"

[data.ssh]
  nas_host = "nas"
  mint_hostname = "192.168.0.10"
```

- Debug template data:

```bash
/home/node/.local/bin/chezmoi data
```

### Ollama Host Detection

`OLLAMA_HOST` is auto-detected on container start:

```bash
# Detection order:
1. config.json → ollama.baseUrl (highest priority)
2. host.docker.internal:11434 (OrbStack/Docker Desktop)
3. 172.17.0.1:11434 (standard Docker bridge)
4. localhost:11434 (fallback)

# Override in config.json:
{
  "ollama": {
    "baseUrl": "http://custom-host:11434"
  }
}
```

### PM2 Watch Mode

PM2 automatically restarts on code changes (configured in `ecosystem.config.js`):

```javascript
watch: true,
ignore_watch: [
  'node_modules', '.git', 'logs', 'backlog',
  'repos', '*.log', '*.md', '.devcontainer'
]
```

**Restart on changes to:**
- `scripts/*.js`
- `config.json`
- `package.json`

**Ignores changes to:**
- Task markdown files (`backlog/**/*.md`)
- Logs (`logs/**`)
- Git operations (`.git/`)

## 🛠️ Provisioning Scripts

### dotfiles-setup.sh

Applies dotfiles using chezmoi from local or remote source.

**Features:**
- Prefers local `/workspaces/dev01dot` if available
- Falls back to `$CHEZMOI_REPO` remote URL
- Non-blocking: continues on failure with warning
- Appends container-specific SSH config from `.devcontainer/ssh_config`

### env-detect.sh

Auto-detects container runtime and sets `OLLAMA_HOST`.

**Features:**
- Tests connectivity to `host.docker.internal`
- Falls back to Docker bridge or localhost
- Respects `config.json` override
- Persists to `~/.bashrc` and `~/.zshrc`
- Tests Ollama connectivity with warning if unreachable

### ssh-validate.sh

Non-blocking SSH environment validation.

**Checks:**
- SSH keys exist (`~/.ssh/id_rsa` or `~/.ssh/id_ed25519`)
- SSH config syntax (basic validation)
- `cloudflared` binary availability
- `~/.cloudflared` directory (optional)
- Connectivity to configured SSH hosts

**All failures are warnings only** — container continues regardless.

### pm2-run.sh

Orchestrates PM2 startup with environment checks.

**Flow:**
1. Source `env-detect.sh` to set `OLLAMA_HOST`
2. Run `ssh-validate.sh` (non-blocking)
3. Start or reload PM2 app
4. Save PM2 process list for resurrection
5. Display status and helpful commands

## 📝 Common Tasks

### Restart PM2

```bash
# Reload with zero-downtime
pm2 reload ticket-processor

# Hard restart
pm2 restart ticket-processor

# Stop
pm2 stop ticket-processor

# View real-time logs
pm2 logs ticket-processor --lines 100
```

### Update Dotfiles

```bash
# If using local dotfiles mount
cd /workspaces/dev01dot
git pull
chezmoi apply --source=/workspaces/dev01dot

# If using remote dotfiles
chezmoi update
```

### Re-run Setup

```bash
# Re-run all provisioning scripts
bash /workspaces/dev01/.devcontainer/setup-tools.sh

# Re-run specific script
bash /workspaces/dev01/.devcontainer/scripts/env-detect.sh
bash /workspaces/dev01/.devcontainer/scripts/ssh-validate.sh
```

### Change Ollama Model

```bash
# Check available models
ollama list

# Pull a new model
ollama pull codellama

# Update config.json
vim config.json  # Set "defaultModel": "ollama/codellama"

# Restart PM2 to pick up changes
pm2 restart ticket-processor
```

## 🐛 Troubleshooting

### PM2 Not Starting

```bash
# Check PM2 status
pm2 status

# View startup logs
pm2 logs ticket-processor --err --lines 50

# Manually start
bash /workspaces/dev01/.devcontainer/scripts/pm2-run.sh
```

### Ollama Not Reachable

```bash
# Check OLLAMA_HOST
echo $OLLAMA_HOST

# Test connectivity
curl $OLLAMA_HOST/api/tags

# Re-detect
bash /workspaces/dev01/.devcontainer/scripts/env-detect.sh
source ~/.bashrc

# Verify host Ollama is running
# On host: brew services list | grep ollama
#       or: systemctl status ollama
```

### SSH Connection Issues

```bash
# Run validation
bash /workspaces/dev01/.devcontainer/scripts/ssh-validate.sh

# Check SSH config
cat ~/.ssh/config

# Test specific host
ssh -v your-host
```

### Dotfiles Not Applied

```bash
# Check if local mount exists
ls -la /workspaces/dev01dot

# Check chezmoi status
chezmoi doctor

# Manually apply
bash /workspaces/dev01/.devcontainer/scripts/dotfiles-setup.sh

# View what would be applied
chezmoi diff --source=/workspaces/dev01dot
```

## 🔒 Security Notes

- **SSH keys are mounted from host** — never commit keys to dotfiles repo
- **cloudflared credentials** are host-specific and optional (`.cloudflared/` mount)
- **Git credentials** are applied via dotfiles (`.gitconfig`)
- **Ollama has no authentication** — assumes trusted local/network access

## 📚 Related Documentation

- [INSTALLATION.md](../INSTALLATION.md) — Host setup and prerequisites
- [USAGE.md](../USAGE.md) — How to use the ticket processor
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) — Common issues and solutions
- [CONFIG.md](../CONFIG.md) — Configuration reference
