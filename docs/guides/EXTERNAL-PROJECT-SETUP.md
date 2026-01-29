# External Project Setup Guide

Use dev-toolbox tooling with any project while keeping your project directory clean from tooling files.

## Overview

This guide shows how to use dev-toolbox as a **hidden tooling layer** for your projects. Your application code stays clean - no dev-toolbox files are visible in your project workspace.

```
Your Project (What You See)          Container (What's Really There)
─────────────────────────────        ─────────────────────────────────
📁 my-app/                           /workspaces/my-app/  ← Your app
  📁 src/                              📁 src/
  📄 package.json                      📄 package.json
  📁 .devcontainer/                    📁 .devcontainer/
    📄 devcontainer.json               
                                     /opt/tooling/        ← Hidden tooling
                                       📁 scripts/
                                       📁 templates/
                                       📄 config.json
```

## Quick Start

### Option 1: Automated Setup Script (Recommended)

Run the setup script from the dev-toolbox directory:

```bash
# Create a new Node.js project
./scripts/new-project.sh my-new-api

# Create a new Python project
./scripts/new-project.sh my-python-app --type python

# Create at a specific location
./scripts/new-project.sh my-app ~/work/my-app
```

Then open in VS Code and "Reopen in Container".

### Option 2: Manual Setup

1. **Create your project directory:**

   ```bash
   mkdir -p ~/projects/my-app/.devcontainer
   cd ~/projects/my-app
   ```

2. **Copy the devcontainer template:**

   ```bash
   cp /path/to/dev-toolbox/templates/devcontainer-external.json \
      .devcontainer/devcontainer.json
   ```

3. **Edit the template - replace placeholders:**

   - `{{PROJECT_NAME}}` → Your project name (e.g., `my-app`)
   - `{{TOOLING_ROOT}}` → Absolute path to ticket-processor (e.g., `/home/user/dev/dev-toolbox`)

4. **Open in VS Code and reopen in container**

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VS Code (Your Laptop)                    │
│                           │                                  │
│                      SSH Remote                              │
│                           ▼                                  │
├─────────────────────────────────────────────────────────────┤
│                  Remote Linux PC                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Dev Container                      │    │
│  │                                                      │    │
│  │  /workspaces/my-app/     ← Your clean project       │    │
│  │    📁 src/                                          │    │
│  │    📄 package.json                                  │    │
│  │                                                      │    │
│  │  /opt/tooling/           ← Hidden, in $PATH         │    │
│  │    📁 scripts/                                      │    │
│  │    📁 templates/                                    │    │
│  │    📄 config.json                                   │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                    host.containers.internal                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Ollama (GPU)                         │    │
│  │                 RTX 3090                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Available Commands

Once inside the container, these commands are available in your `$PATH`:

| Command | Description |
|---------|-------------|
| `create-task.js` | Create a new task interactively |
| `create-spec.js` | Create a spec-driven task with requirements |
| `watcher.js` | Start the task processor watcher |
| `approval-handler.js` | Manage approval workflows |
| `git-auto-commit.js` | Auto-commit with smart messages |
| `semantic-indexer.js` | Index codebase for semantic search |
| `query-search.js` | Search codebase semantically |
| `mcp-server.js` | Start MCP server for VS Code integration |

### Example Usage

```bash
# Check current directory - it's your clean project
pwd
# /workspaces/my-app

# Create a task
node /opt/tooling/scripts/create-task.js

# Or since scripts are in PATH:
create-task.js

# Start the watcher for your project
WORKSPACE_ROOT=/workspaces/my-app node /opt/tooling/scripts/watcher.js
```

## Configuration

### Project-Specific Config

Create a `dev-toolbox.json` in your project root to override default settings:

```json
{
  "models": {
    "default": "qwen2.5-coder:7b"
  },
  "backlog": {
    "rootDir": "./backlog"
  }
}
```

### Environment Variables

Set these in your `.devcontainer/devcontainer.json`:

```jsonc
{
  "remoteEnv": {
    "OLLAMA_HOST": "http://host.containers.internal:11434",
    "TOOLING_HOME": "/opt/tooling",
    "WORKSPACE_ROOT": "/workspaces/${localWorkspaceFolderBasename}"
  }
}
```

## Per-Project Backlog

By default, the backlog is shared across all projects at `/opt/tooling/backlog`. 

To use a **project-specific backlog**:

1. Create a backlog folder in your project:

   ```bash
   mkdir -p backlog/{todo,doing,review,completed,failed}
   ```

2. Modify your devcontainer.json mounts:

   ```jsonc
   "mounts": [
     // ... other mounts ...
     // Replace the shared backlog mount with:
     "source=${localWorkspaceFolder}/backlog,target=/opt/tooling/backlog,type=bind"
   ]
   ```

## Troubleshooting

### VS Code Copilot Extension Incompatible

If you see "Chat failed to load because the installed version of the Copilot Chat extension is not compatible":

1. Rebuild container without cache: `Ctrl+Shift+P` → `Dev Containers: Rebuild Container Without Cache`
2. The devcontainer template includes auto-update settings to prevent this

### Aider Not Connecting to Ollama

If Aider can't reach Ollama:

```bash
# Check if Ollama is running on host
curl http://localhost:11434/api/tags

# If above fails, start Ollama on host
sudo systemctl start ollama  # Linux
brew services start ollama    # macOS

# Test from container (if network=host)
curl http://localhost:11434/api/tags

# Verify Aider config
cat ~/.aider.conf.yml
# Should show:
# model: ollama/qwen2.5-coder:7b
# auto-commits: false
# git: false
# gitignore: false
# yes: true
# check-update: false
```

### Continue Extension Not Working

Continue runs on the **HOST machine** (where VS Code runs), not inside containers!

```bash
# On your HOST machine (not container), run:
./install/setup-continue-host.sh

# Or manually create config at ~/.continue/configs/config.yaml
mkdir -p ~/.continue/configs
cat > ~/.continue/configs/config.yaml << 'EOF'
name: Local Config
version: 1.0.0
schema: v1
models:
  - name: Autodetect
    provider: ollama
    model: AUTODETECT
    apiBase: http://localhost:11434
    roles:
      - chat
      - edit
      - apply
      - autocomplete
EOF

# Then reload VS Code: Ctrl+Shift+P → "Developer: Reload Window"
```

### Tools Not Found in PATH

If commands like `create-task.js` aren't found:

```bash
# Check the PATH
echo $PATH

# Manually add to PATH for current session
export PATH="/opt/tooling/scripts:$PATH"

# Or run directly
node /opt/tooling/scripts/create-task.js
```

### Ollama Connection Issues

```bash
# Test Ollama connectivity
curl http://host.containers.internal:11434/api/tags

# If using Docker instead of Podman, try:
curl http://host.docker.internal:11434/api/tags
```

### Permission Issues

If you see permission errors on mounted volumes:

```bash
# Check your user mapping
id

# Should show: uid=1000(node) gid=1000(node)
# The --userns=keep-id flag should handle this
```

### Container Won't Start

Check that the tooling path exists:

```bash
# On the host machine
ls -la /home/user/dev/dev-toolbox/.devcontainer/Dockerfile
```

## Pre-Configured Tools

The dev-toolbox container includes these pre-configured tools:

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Aider** | AI coding assistant (terminal) | `~/.aider/.aider.conf.yml` - pre-configured for Ollama |
| **Continue** | AI coding assistant (VS Code) | Auto-configured via extension |
| **pm2** | Process manager | Run watcher and services |
| **Git** | Version control | Uses mounted SSH keys |
| **Node.js 24** | Runtime | Alpine-based for Podman compatibility |

### Aider CLI Commands

```bash
# Interactive mode with current directory
aider

# With specific files
aider src/index.js src/utils.js

# Single prompt
aider --message "add error handling to the login function"

# List available models
aider --models

# Use different model
aider --model ollama/qwen2.5-coder:14b
```

### Continue Extension

Continue is automatically configured when the container starts. Use it via:
- `Ctrl+L` (or `Cmd+L` on macOS) - Open Continue chat
- `Ctrl+I` (or `Cmd+I` on macOS) - Inline edit

## Shared Agents

The dev-toolbox provides 5 reusable VS Code Copilot agents, automatically mounted to `.github/agents/`:

| Agent | Purpose |
|-------|---------|
| `@architect` | System design, architecture decisions |
| `@planner` | Task breakdown, sprint planning |
| `@coder` | Implementation, bug fixes, tests |
| `@reviewer` | Code review, security checks |
| `@debugger` | Troubleshooting, debugging |

Use them in Copilot Chat: `@architect how should I structure the authentication?`

## Related Documentation

- [INSTALLATION.md](./INSTALLATION.md) - Full installation guide
- [USAGE.md](./USAGE.md) - Task creation and workflow examples
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design overview
- [TROUBLESHOOTING.md](../operations/TROUBLESHOOTING.md) - Common issues and solutions
