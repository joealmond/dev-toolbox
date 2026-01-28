# Using Dev-Toolbox in Your App

This project uses **dev-toolbox** as an invisible development environment. All AI tools and utilities are mounted at `/opt/tooling` (hidden from your app code).

## ✅ Pre-configured Tools

### Aider (Terminal AI)
- **Model:** `qwen2.5-coder:7b` via Ollama
- **Config:** `~/.aider/.aider.conf.yml`
- **Usage:**
  ```bash
  # Interactive mode
  aider
  
  # One-shot edit
  aider --message "add error handling to login"
  
  # Edit specific files
  aider src/index.js src/utils.js
  ```

### Continue (VS Code AI)
- **Model:** `qwen2.5-coder:7b` via Ollama
- **Config:** `~/.continue/config.json`
- **Usage:**
  - `Ctrl+L` (Cmd+L) - Open chat
  - `Ctrl+I` (Cmd+I) - Inline edit
  - `@codebase` - Query entire codebase
  - `@src/file.js` - Query specific file

### GitHub Copilot Agents
Located at `.github/agents/` (mounted from dev-toolbox):
- `@coder` - Implement features
- `@reviewer` - Code review
- `@architect` - Design decisions
- `@debugger` - Troubleshoot issues
- `@planner` - Task breakdown

## 🔧 Configuration

### Aider Configuration
Edit `~/.aider/.aider.conf.yml`:
```yaml
model: ollama/qwen2.5-coder:7b
api-base: http://localhost:11434
auto-commits: false
editor: code --wait
watch-files: true
```

### Continue Configuration
Edit `~/.continue/config.json` to:
- Change model
- Add more models
- Configure autocomplete
- Customize context providers

### Available Ollama Models
```bash
ollama list  # See installed models

# Switch model in Aider
aider --model ollama/qwen2.5-coder:14b

# Or update ~/.aider/.aider.conf.yml
```

## 📁 Directory Structure

```
/workspaces/app/              # Your app code (visible, clean)
├── .github/agents/           # Dev-toolbox agents (mounted)
├── src/                      # Your source code
└── .devcontainer/            # Container config

/opt/tooling/                 # Dev-toolbox (hidden)
├── scripts/                  # Utilities (in PATH)
├── backlog/                  # Shared task queue
│   ├── todo/
│   ├── doing/
│   ├── review/
│   └── completed/
├── templates/                # Documentation templates
└── config.json               # Toolbox configuration
```

## 🚀 Quick Start

### Test Aider
```bash
# Create a test file
echo "function hello() { console.log('hi'); }" > test.js

# Ask Aider to improve it
aider --message "add JSDoc and error handling" test.js
```

### Test Continue
1. Open any file in VS Code
2. Press `Ctrl+L`
3. Type: `@codebase what does this project do?`

### Create a Task
```bash
# Using dev-toolbox CLI
create-task.js

# Or manually
cat > /opt/tooling/backlog/todo/my-task.md << 'EOF'
---
title: Add health check endpoint
status: To Do
priority: medium
model: qwen2.5-coder:7b
---

Add /health endpoint that returns:
- Service status
- Uptime
- Version
EOF
```

### Process Task with Aider
```bash
node /opt/tooling/scripts/process-ticket.js /opt/tooling/backlog/todo/my-task.md
```

## 🐛 Troubleshooting

### Aider can't find Ollama
```bash
# Test Ollama connectivity
curl http://localhost:11434/api/tags

# Check Aider config
cat ~/.aider/.aider.conf.yml
```

### Continue not responding
1. Open Continue settings (gear icon in Continue panel)
2. Verify model: `qwen2.5-coder:7b`
3. Verify API base: `http://localhost:11434`

### Commands not found
```bash
# Verify tooling is in PATH
echo $PATH | grep tooling

# List available scripts
ls /opt/tooling/scripts/
```

## 📚 Documentation

Full documentation in dev-toolbox:
- Installation: `/opt/tooling/docs/guides/INSTALLATION.md`
- Usage: `/opt/tooling/docs/guides/USAGE.md`
- AI Tools: `/opt/tooling/docs/guides/AI-TOOLS.md`
- External Setup: `/opt/tooling/docs/guides/EXTERNAL-PROJECT-SETUP.md`

## ❓ Git Repository

This app directory can optionally have its own git repo, independent of dev-toolbox's task tracking.

**Recommendation:** 
- ✅ Use git for your app code
- ✅ Dev-toolbox manages tasks in `/opt/tooling/backlog/`

If you need to initialize git:
```bash
bash /opt/tooling/.devcontainer/scripts/setup-git-optional.sh
```

## 🔗 Useful Commands

```bash
# List all tooling scripts
ls /opt/tooling/scripts/

# Check Ollama models
ollama list

# View task queue
ls /opt/tooling/backlog/todo/

# Test adapters
node -e "const {AdapterFactory} = require('/opt/tooling/scripts/adapters'); console.log(AdapterFactory.getAvailableAdapters());"
```
