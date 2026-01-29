# AI Tools Guide

Dev-toolbox uses an **adapter architecture** to support multiple AI coding assistants. This allows you to switch between different tools without rewriting the core workflow logic.

## Available Adapters

### 🎯 Aider (Recommended for Automation)

**Best for:** Automated task processing, terminal workflows, CI/CD integration

**Features:**
- Terminal-based AI coding assistant
- Full file editing capabilities
- Git integration with smart commits
- Streaming output for real-time feedback
- Lightweight and fast

**Installation:**
```bash
# macOS
brew install python3
pip3 install aider-chat==0.86.1

# Linux
sudo apt-get install -y python3 python3-pip
pip3 install aider-chat==0.86.1
```

**Configuration (~/.aider.conf.yml):**
```yaml
# Aider config - place in home directory
# https://aider.chat/docs/config/aider_conf.html
model: ollama/qwen2.5-coder:7b
auto-commits: false
git: false
gitignore: false
yes: true              # Skip confirmations (for automation)
check-update: false    # Disable update checks (for container stability)
```

**Environment variable:**
```bash
export OLLAMA_API_BASE=http://localhost:11434
```

**Usage:**
```bash
# Manual usage
aider --model ollama/qwen2.5-coder:7b

# Dev-toolbox automatically uses this adapter when processing tasks
node scripts/process-ticket.js path/to/task.md
```

---

### 🖥️ Continue (Best for Interactive Development)

**Best for:** Manual coding with VS Code UI, interactive chat, code exploration

**Features:**
- VS Code extension with rich UI
- Interactive chat interface
- Code completion and inline suggestions
- Context-aware assistance
- Multi-file editing with visual feedback

**Installation:**
```bash
# Install via VS Code
code --install-extension continue.continue

# Or search "Continue" in VS Code extensions marketplace
```

**Configuration:**

Dev-toolbox adapter config (config.json):
```json
{
  "ai": {
    "adapter": "continue",
    "autoApprove": false
  }
}
```

**Usage:**
- Open VS Code
- Use Continue extension in sidebar
- Dev-toolbox creates `.continue-task-{id}.json` files for manual processing
- Process tasks interactively through the UI

**Configure Continue for Ollama (~/.continue/configs/config.yaml):**

> ⚠️ **Important:** Continue extension runs on the **HOST machine** (where VS Code runs), not inside containers. You must configure this on your host.

**Quick Setup (run on host):**
```bash
# From dev-toolbox directory
./install/setup-continue-host.sh
```

**Manual config (~/.continue/configs/config.yaml):**
```yaml
# Continue config - YAML format
# https://docs.continue.dev/guides/ollama-guide
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
```

After creating the config, reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"

---

## Adapter Architecture

### How It Works

```
┌─────────────────┐
│  process-ticket │
│     .js         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AdapterFactory  │
│  .create()      │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌──────┐  ┌──────────┐
│Aider │  │Continue  │
│Adapter│  │Adapter   │
└──────┘  └──────────┘
```

### Base Interface (AIAdapter)

All adapters implement:

```javascript
class AIAdapter {
  async process(task) {
    // Returns: { success: bool, output: string, error?: string }
  }
  
  async healthCheck() {
    // Returns: { available: bool, version?: string }
  }
  
  getName() {
    // Returns: string
  }
}
```

---

## Switching Between Adapters

### Configuration File

Edit `config.json`:

```json
{
  "ai": {
    "adapter": "aider",  // or "continue"
    "autoApprove": true  // Set false for Continue
  }
}
```

### Per-Task Override

Add to task front matter:

```yaml
---
title: My Task
adapter: continue  # Override default adapter
---
```

### Runtime Detection

The adapter factory automatically checks:
1. Task-level adapter override
2. Config.json default adapter
3. Falls back to "aider"

---

## Recommended Setups

### For Automated Workflows (CI/CD, Batch Processing)
```json
{
  "ai": {
    "adapter": "aider",
    "autoApprove": true
  }
}
```

**Why:** Aider runs headlessly, provides clean output, and handles git commits automatically.

---

### For Interactive Development
```json
{
  "ai": {
    "adapter": "continue",
    "autoApprove": false
  }
}
```

**Why:** Continue provides rich UI, interactive chat, and visual feedback for manual coding sessions.

---

### Hybrid Approach (Recommended)
- **Default:** Aider (automated processing)
- **Override:** Continue for complex interactive tasks

```json
{
  "ai": {
    "adapter": "aider",
    "autoApprove": true
  }
}
```

For specific tasks requiring manual work:
```yaml
---
title: Complex Refactoring
adapter: continue  # Use Continue UI for this task
approval:
  code: required
---
```

---

## Adding New Adapters

### 1. Create Adapter Class

Create `scripts/adapters/my-adapter.js`:

```javascript
import AIAdapter from './ai-adapter.js';

export default class MyAdapter extends AIAdapter {
  constructor(config) {
    super(config);
    this.toolPath = 'my-tool';
  }

  async process(task) {
    // Implementation
    return {
      success: true,
      output: 'Task completed',
      exitCode: 0
    };
  }

  async healthCheck() {
    // Check if tool is available
    return { available: true };
  }

  getName() {
    return 'my-adapter';
  }
}
```

### 2. Register in Factory

Edit `scripts/adapters/adapter-factory.js`:

```javascript
import MyAdapter from './my-adapter.js';

export default class AdapterFactory {
  static create(config) {
    switch (config.adapter) {
      case 'my-adapter':
        return new MyAdapter(config);
      // ... existing adapters
    }
  }

  static getAvailableAdapters() {
    return ['aider', 'continue', 'my-adapter'];
  }
}
```

### 3. Update Config Schema

Add to `config.json`:

```json
{
  "ai": {
    "adapter": "my-adapter",
    "myAdapterSpecificSetting": "value"
  }
}
```

---

## Troubleshooting

### Aider Issues

**Problem:** `aider: command not found`

**Solution:**
```bash
# Ensure pip3 install location is in PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Or reinstall
pip3 install --user aider-chat==0.86.1
```

**Problem:** Aider can't connect to Ollama

**Solution:**
```bash
# Check Ollama is running
curl http://localhost:11434/api/version

# Set OLLAMA_HOST environment variable
export OLLAMA_HOST=http://localhost:11434
```

---

### Continue Issues

**Problem:** Continue not finding Ollama models

**Solution:**

1. **Continue runs on HOST, not in container!** Config must exist at:
   - Linux/macOS: `~/.continue/configs/config.yaml`

2. Run the setup script on your **host machine**:
   ```bash
   ./install/setup-continue-host.sh
   ```

3. Reload VS Code after creating config

4. Verify Ollama is running: `curl http://localhost:11434/api/tags`

**Problem:** Continue tasks not processing

**Solution:**
- Continue adapter creates marker files in `.continue-task-{id}.json`
- These require manual action in VS Code
- Check if file-based markers are being created
- Process tasks through Continue UI manually

---

### Adapter Selection Issues

**Problem:** Wrong adapter being used

**Solution:**
```bash
# Check config
cat config.json | grep -A 5 '"ai"'

# Check task front matter
head -n 10 backlog/doing/task-001.md

# Enable debug logging
DEBUG=* node scripts/process-ticket.js path/to/task.md
```

---

## Performance Comparison

| Feature | Aider | Continue |
|---------|-------|----------|
| Speed | Fast | Medium |
| Automation | Excellent | Limited |
| UI | Terminal | Rich VS Code UI |
| Git Integration | Built-in | Via VS Code |
| Resource Usage | Low | Medium |
| Learning Curve | Low | Medium |
| Best For | Automation | Interactive |

---

## Related Documentation

- [INSTALLATION.md](./INSTALLATION.md) - Installing Aider and Continue
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Adapter pattern architecture
- [CONFIG.md](../operations/CONFIG.md) - Configuration options
- [USAGE.md](./USAGE.md) - Using dev-toolbox with AI tools
