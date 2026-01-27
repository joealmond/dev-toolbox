# Dev-Toolbox - AI-Powered Development Environment

AI-powered development environment container with **spec-driven development** capabilities. Uses **Kilo Code CLI (kodu)** with **Ollama** to process tasks from **Backlog.md** format, with configurable approval workflows, automatic documentation generation, and **VS Code MCP integration**.

## Documentation
- Full documentation index: [docs/INDEX.md](docs/INDEX.md)
- All guides and references live under the [docs/](docs/INDEX.md) folder (install, usage, config, deployment, troubleshooting, security).

### 🖥️ Host Machine Setup (Linux + RTX 3090)
- **[HOST-MACHINE-REFERENCE.md](docs/operations/HOST-MACHINE-REFERENCE.md)** - System specs, storage, installed software
- **[HOST-SETUP-PLAN.md](docs/operations/HOST-SETUP-PLAN.md)** - Step-by-step setup checklist
- **[IMPROVEMENT-ROADMAP1.md](docs/guides/IMPROVEMENT-ROADMAP1.md)** - GPU optimization, Obsidian integration, modularity

## Key Features

### 🎯 Spec-Driven Development
- **Requirements-based implementation** - Embed requirements directly in task files
- **Architecture context** - Include components, integrations, and design decisions
- **Automatic documentation** - Generate work logs, ADRs, and changelogs
- **Configurable approvals** - Code review and/or documentation review gates
- **Unified format** - Single markdown file for specs and tasks

### 🤖 AI-Powered Automation
- **Smart prompt injection** - Spec requirements and architecture context to kodu
- **Multiple model support** - Choose Ollama models per task
- **Semantic context** - Pull relevant code/docs for enhanced AI prompts
- **Automatic completion** - Optional auto-complete for simple tasks

### 🔄 Workflow Management
- **File-based state machine** - todo → doing → review → completed/failed
- **Flexible approval gates** - Optional code and docs approval per task
- **PR automation** - Auto-create and merge PRs on approval
- **Webhook integration** - Gitea PR merge triggers task completion

### 🔗 Git & Gitea Integration
- **Automatic commits** - Include all generated documentation
- **PR creation** - Configurable PR title and body formats
- **Webhook verification** - Secure signature validation
- **Branch management** - Task-based branch naming

### 🛠️ Developer Experience
- **VS Code MCP tools** - 12 tools for AI assistant integration
- **Interactive CLI** - Approval workflow and task management
- **Comprehensive docs** - 2,200+ lines of guides and references
- **Dev container** - Fully automated development environment
 - **VS Code tasks** - Approve code/docs directly from editor
 - **Run code inline** - Right-click → Run Code (Code Runner)

## Architecture

```
Spec-Driven Development Flow:

┌──────────────┐
│   Create     │ Unified markdown file with optional
│   Spec/Task  │ spec.enabled: true
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Front Matter        │ - Requirements
│  ├─ requirements     │ - Architecture context
│  ├─ architecture     │ - Approval gates
│  ├─ approval gates   │ - Documentation config
│  └─ docs config      │
└──────┬───────────────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│   Watcher    │─────▶│  kodu CLI +  │
│  (Node.js)   │      │  Ollama      │
└──────┬───────┘      └──────────────┘
       │
       ├─ Code Approval?
       ├─ Generate Docs?
       ├─ Docs Approval?
       │
       ▼
┌──────────────┐
│  Completed   │ - Code committed
│  Task        │ - Docs generated
│              │ - All approvals recorded
└──────────────┘
```

## Quick Feature Overview

### Standard Task (No Approvals)
```bash
npm run task:create
# Task processes automatically and completes
```

### Spec-Driven Task (Full Workflow)
```bash
npm run spec:create
# 1. Process with enhanced context (requirements + architecture)
# 2. Code approval needed
# 3. Auto-generate documentation
# 4. Documentation approval needed
# 5. Auto-complete and archive
```

### VS Code Quick Actions
- **Run generated code**: Open file → right-click → Run Code.
- **Approve from editor**: Terminal → Run Task → “Approve Code for Current Spec” or “Approve Docs for Current Spec”.
  - Tasks live at [.vscode/tasks.json](.vscode/tasks.json).
  - Devcontainer settings enable terminal output and auto-save. See [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json#L19-L27).

### Use Cases
- **Bug fixes** - Simple tasks, no approval
- **Features** - Spec-driven, code review only
- **Architecture** - Full workflow with ADRs
- **Critical systems** - All approvals + documentation

---

## New in Phases 4-5: Approval Workflows & MCP Integration

### Approval Workflow System
- **Configurable per-task** approval gates
- **Code approval** - Review implementation quality
- **Docs approval** - Review generated documentation
- **State machine** - Automatic transitions and validation
- **Git integration** - Webhooks trigger auto-completion

### VS Code MCP Integration
- **12 tools** for AI assistant access
- **Tool categories:**
  - Task management (create, process, status)
  - Approval workflow (approve, reject, list)
  - Documentation (ADR, changelog, worklog)
  - Search (semantic queries across codebase)
  - Monitoring (staleness checks)

### Documentation Generation
- **Work logs** - Implementation process documentation
- **ADRs** - Architecture Decision Records with decisions
- **Changelogs** - Automatic CHANGELOG.md updates
- **Handlebars templates** - Customizable output format

---

## Documentation

**Essential Guides:**
- 📖 [**INTEGRATION-GUIDE.md**](./INTEGRATION-GUIDE.md) - Setup, configuration, and deployment
- 📋 [**SPEC-REFERENCE.md**](./SPEC-REFERENCE.md) - Complete specification format documentation
- ✅ [**APPROVAL-WORKFLOW.md**](./APPROVAL-WORKFLOW.md) - Approval process and state machine
- 🔧 [**MCP-TOOLS.md**](./MCP-TOOLS.md) - VS Code MCP tool reference
- 📊 [**PHASE-5-COMPLETION.md**](./PHASE-5-COMPLETION.md) - Latest feature implementation summary

**Other Documentation:**
- 🐳 [**DEPLOYMENT.md**](./DEPLOYMENT.md) - Production deployment guide
- 🔍 [**TROUBLESHOOTING.md**](./TROUBLESHOOTING.md) - Common issues and solutions
- 📦 [**INSTALLATION.md**](./INSTALLATION.md) - Detailed installation steps
- 🚀 [**USAGE.md**](./USAGE.md) - Task creation and workflow examples

---

## Development Environment

This project includes a **fully configured devcontainer** with:
- ✅ Node 24 with pinned npm 11.7.0
- ✅ PM2 with watch mode (auto-restart on code changes)
- ✅ Pre-installed tools: Ollama CLI, Kilo Code, backlog.md
- ✅ Automatic dotfiles sync via chezmoi
- ✅ SSH tunneling support with cloudflared
- ✅ Ollama host auto-detection (OrbStack/Docker Desktop/Linux)
- ✅ MCP server for VS Code integration
- ✅ Webhook server for Gitea automation
- Template available: [dotfiles-template/](dotfiles-template/)

**Quick Start with Devcontainer:**
1. Open project in VS Code
2. Command Palette → "Dev Containers: Reopen in Container"
3. Wait for setup to complete (installs dependencies, applies dotfiles, starts PM2)

**Detailed Setup:** See [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)

---

## 🔧 Use Tooling with External Projects

Use dev-toolbox as a **hidden tooling layer** for any project. Your app stays clean - no tooling files visible!

### Quick Setup

```bash
# Create a new project with tooling
./scripts/new-project.sh my-new-api

# With project type
./scripts/new-project.sh my-python-app --type python

# At specific location
./scripts/new-project.sh my-app ~/work/my-app
```

### What You Get

```
Your Project (Clean!)              Container (Hidden Tooling)
──────────────────────             ─────────────────────────
📁 my-app/                         /workspaces/my-app/
  📁 src/                            📁 src/
  📄 package.json                    📄 package.json
  📁 .devcontainer/                
                                   /opt/tooling/  ← In $PATH
                                     📁 scripts/
                                     📁 templates/
```

### Available Commands (inside container)

| Command | Description |
|---------|-------------|
| `create-task.js` | Create a new task |
| `create-spec.js` | Create a spec-driven task |
| `watcher.js` | Start the task processor |
| `approval-handler.js` | Manage approvals |

**Full Guide:** [docs/guides/EXTERNAL-PROJECT-SETUP.md](docs/guides/EXTERNAL-PROJECT-SETUP.md)

## Quick Start (Standalone/Host Machine)

### Prerequisites

- **macOS**: Homebrew, Podman, Node.js 24+, Ollama
- **Linux**: apt/dnf, Podman, Node.js 24+, Ollama

### Installation

**macOS:**

```bash
bash install/install-macos.sh
```

**Linux:**

```bash
bash install/install-linux.sh
```

### Setup

1. Copy environment configuration:

  ```bash
  cp .env.example .env
  ```

2. Edit `.env` with your settings (optional, defaults work for local dev)

3. Review `config.json` and adjust models/settings as needed

4. Start the system:

  ```bash
  node scripts/start.js
  ```

Or use PM2 (recommended for development):

```bash
pm2 start ecosystem.config.js
pm2 logs
```

Or install as systemd service (Linux production):

```bash
bash scripts/install-service.sh
```

### Remote Dev Containers (VS Code)

- **Mac:** Use OrbStack (Docker API compatible). Open the repo in VS Code and **Reopen in Container**.
- **Linux:** Use Podman with `podman-docker` to provide `/var/run/docker.sock`, then reopen the folder in a dev container.
- **Windows:** Use Rancher Desktop (or Podman in WSL2) with the Docker socket enabled, then reopen in a dev container.

The dev container mounts the Docker socket and reaches Ollama on the host via `http://host.docker.internal:11434`.

## Usage

### Creating Tasks

**Option 1: Interactive CLI**

```bash
node scripts/create-task.js
```

**Option 2: From Template**

```bash
bash scripts/create-from-template.sh
```

**Option 3: Bulk Import**

```bash
node scripts/bulk-create.js tasks.json
```

**Option 4: Backlog.md CLI**

```bash
backlog task create "Task Title" -d "Description" --priority high
```

**Option 5: Manual File Creation**

Create a markdown file in `backlog/todo/` following the template format:

```markdown
---
title: Your Task Title
status: To Do
priority: high
model: ollama/deepseek-coder
description: |
  Task description here
acceptanceCriteria:
  - Criterion 1
  - Criterion 2
---

# Additional Details

Any additional context or notes...
```

### Workflow States

1. **todo/** - New tasks waiting to be processed
2. **doing/** - Currently being processed by kodu
3. **review/** - Successfully processed, PR created in Gitea
4. **failed/** - Processing failed (with error log)
5. **completed/** - PR merged, task finished

### Model Selection

Specify model in task front matter:

```yaml
model: ollama/deepseek-coder  # Default
# or
model: ollama/codellama
# or
model: ollama/mistral
```

Available models configured in `config.json`:
- `ollama/deepseek-coder` (default, best for code)
- `ollama/codellama` (alternative code model)
- `ollama/mistral` (general purpose)
- `ollama/llama2` (general purpose)

### Service Management

**macOS (PM2):**

```bash
pm2 start ecosystem.config.js      # Start
pm2 stop ticket-processor          # Stop
pm2 restart ticket-processor       # Restart
pm2 logs ticket-processor          # View logs
pm2 monit                          # Monitor
```

**Linux (systemd):**

```bash
systemctl --user start dev-toolbox      # Start
systemctl --user stop dev-toolbox       # Stop
systemctl --user restart dev-toolbox    # Restart
systemctl --user status dev-toolbox     # Status
journalctl --user -u dev-toolbox -f     # Follow logs
```

**Cross-platform helper scripts:**

```bash
bash scripts/service-start.sh
bash scripts/service-stop.sh
bash scripts/service-restart.sh
bash scripts/service-status.sh
```

## Configuration

### config.json

Key configuration options:

```json
{
  "ollama": {
    "defaultModel": "ollama/deepseek-coder",
    "availableModels": [...],
    "timeout": 300000
  },
  "processing": {
    "concurrency": 1,
    "watchDebounce": 1000
  },
  "webhook": {
    "enabled": true,
    "port": 3001,
    "autoMergePR": true
  },
  "git": {
    "createPR": true,
    "pushRetries": 3
  }
}
```

See `CONFIG.md` for full documentation.

### Environment Variables

See `.env.example` for all available options. Key variables:

- `OLLAMA_HOST` - Ollama API endpoint
- `GITEA_URL` - Gitea web URL
- `GITEA_TOKEN` - Authentication token (auto-generated)
- `GITEA_ORG` - Organization for repositories

## Documentation

- **[INSTALLATION.md](INSTALLATION.md)** - Detailed installation guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[CONFIG.md](CONFIG.md)** - Configuration reference
- **[USAGE.md](USAGE.md)** - Usage guide and examples
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## Project Structure

```
.
├── backlog/                 # Task files
│   ├── todo/               # New tasks
│   ├── doing/              # Processing
│   ├── failed/             # Failed tasks
│   ├── review/             # Awaiting review
│   └── completed/          # Finished tasks
├── containers/             # Podman configuration
│   ├── Dockerfile
│   └── podman-compose.yml
├── install/                # Installation scripts
│   ├── install-macos.sh
│   └── install-linux.sh
├── repos/                  # Git repositories (per task)
├── scripts/                # Automation scripts
│   ├── watcher.js         # Main file watcher
│   ├── process-ticket.js  # Kodu integration
│   ├── git-manager.js     # Gitea operations
│   ├── start.js           # Startup orchestration
│   ├── create-task.js     # Interactive task creation
│   └── service-*.sh       # Service management
├── systemd/                # Systemd service files
├── config.json             # Main configuration
├── .env                    # Environment variables
└── ecosystem.config.js     # PM2 configuration
```

## Documentation

- **[.devcontainer/SETUP-GUIDE.md](.devcontainer/SETUP-GUIDE.md)** — Devcontainer setup, configuration, troubleshooting
- **[INSTALLATION.md](INSTALLATION.md)** — Host machine installation (macOS/Linux)
- **[USAGE.md](USAGE.md)** — How to use the task processor
- **[CONFIG.md](CONFIG.md)** — Configuration reference
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — Common issues and solutions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Production deployment guide
- **[FUTURE_IMPROVEMENTS.md](FUTURE_IMPROVEMENTS.md)** — Planned features and roadmap

## Development

### Using Devcontainer (Recommended)

Best for reproducible development environment with automatic setup:

```bash
# Open in VS Code
# Command Palette → "Dev Containers: Reopen in Container"
# PM2 starts automatically, watches for code changes
```

### Standalone Development

Requirements:
- Node.js 24+
- Podman / Podman Compose
- Ollama with models pulled
- Kilo Code CLI (`npm install -g @kilocode/cli`)
- Backlog.md CLI (`npm install -g backlog.md`)

Install dependencies:

```bash
npm install
```

Run with PM2 (auto-restart on changes):

```bash
pm2 start ecosystem.config.js
pm2 logs
```

Or run directly:

```bash
node scripts/start.js
```

## License

MIT

## Contributing

Contributions welcome! Please read CONTRIBUTING.md (if exists) for guidelines.

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review logs in `logs/` directory
- Check service status with `bash scripts/service-status.sh`
