# Troubleshooting Guide

Common issues and solutions for the Dev-Toolbox system.

## Table of Contents

- [Installation Issues](#installation-issues)
- [VS Code Extension Issues](#vs-code-extension-issues)
- [Aider CLI Issues](#aider-cli-issues)
- [Service Issues](#service-issues)
- [Processing Issues](#processing-issues)
- [Gitea Issues](#gitea-issues)
- [Container Issues](#container-issues)
- [Performance Issues](#performance-issues)
- [Debugging](#debugging)

---

## Installation Issues

### Homebrew Not Found (macOS)

**Problem:**
```
-bash: brew: command not found
```

**Solution:**
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH (Apple Silicon)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Verify
brew --version
```

### Podman Machine Won't Start (macOS)

**Problem:**
```
Error: podman machine "podman-machine-default" already exists
```

**Solution:**
```bash
# Stop existing machine
podman machine stop

# Remove it
podman machine rm

# Create new one
podman machine init --cpus 4 --memory 8192 --disk-size 50
podman machine start
```

### Node.js Version Too Old

**Problem:**
```
Error: Node.js version 16.x is not supported
```

**Solution:**
```bash
# macOS
brew uninstall node
brew install node@20
brew link --force node@20

# Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v20.x.x
```

### Ollama Won't Install (Linux)

**Problem:**
```
curl: (7) Failed to connect to ollama.com port 443
```

**Solution:**
```bash
# Check internet connection
ping google.com

# Try with wget
wget https://ollama.com/install.sh -O - | sh

# Or download manually
curl -L https://ollama.com/download/ollama-linux-amd64 -o /usr/local/bin/ollama
chmod +x /usr/local/bin/ollama
```

---

## VS Code Extension Issues

### Copilot Chat Extension Incompatible

**Problem:**
```
Chat failed to load because the installed version of the Copilot Chat extension is not
compatible with this version of Visual Studio Code.
```

**Cause:** Extensions are cached in the devcontainer. When VS Code updates but the container has old cached extensions, they become incompatible.

**Solution:**

1. **Rebuild container without cache:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Run: `Dev Containers: Rebuild Container Without Cache`

2. **Enable auto-updates in devcontainer.json:**
   ```json
   "customizations": {
     "vscode": {
       "settings": {
         "extensions.autoUpdate": true,
         "extensions.autoCheckUpdates": true
       }
     }
   }
   ```

3. **Manual extension update:** Click "Show Extension" in the error dialog and update from the Extensions view.

**Prevention:** The dev-toolbox devcontainer template includes auto-update settings by default.

### Continue Extension Not Working

**Problem:** Continue extension installed but not connecting to Ollama.

**Solution:**

1. **Verify Ollama is running on host:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Test from inside container:**
   ```bash
   curl http://host.containers.internal:11434/api/tags
   ```

3. **Check Continue config:**
   ```bash
   cat ~/.continue/configs/config.yaml
   ```
   
4. **Ensure apiBase is set:**
   ```yaml
   models:
     - name: qwen2.5-coder
       provider: ollama
       model: qwen2.5-coder:7b
       apiBase: http://localhost:11434
   ```

---

## Aider CLI Issues

### CLI Not Finding Ollama Model

**Problem:** Running `aider` prompts for OpenRouter or shows "No LLM model was specified".

**Cause:** Aider is not pre-configured with Ollama settings.

**Solution - Pre-configure in Dockerfile:**

The dev-toolbox Dockerfile now pre-configures Aider:

```dockerfile
# Pre-configure Aider CLI to use Ollama
RUN echo 'model: ollama/qwen2.5-coder:7b' > /home/node/.aider.conf.yml && \
    echo 'auto-commits: false' >> /home/node/.aider.conf.yml && \
    echo 'git: false' >> /home/node/.aider.conf.yml && \
    echo 'gitignore: false' >> /home/node/.aider.conf.yml && \
    chown node:node /home/node/.aider.conf.yml
```

**Solution - Manual configuration:**

1. **Create config file:**
   ```bash
   cat > ~/.aider.conf.yml << 'EOF'
   model: ollama/qwen2.5-coder:7b
   auto-commits: false
   git: false
   gitignore: false
   stream: true
   EOF
   ```

2. **Set environment variable:**
   ```bash
   export OLLAMA_API_BASE=http://localhost:11434
   ```

### CLI Commands Reference

| Command | Description |
|---------|-------------|
| `aider` | Start interactive mode |
| `aider --message "prompt"` | Run single prompt |
| `aider file1.js file2.js` | Add files to context |
| `/help` | Show help in interactive mode |
| `/add filename` | Add file to context |
| `/drop filename` | Remove file from context |

### Wrong aider Package Version

**Problem:** Aider not connecting to Ollama correctly.

**Cause:** Older versions of Aider may have different Ollama configuration.

**Solution:**
```bash
# Update to latest version
pip install --upgrade aider-chat

# Verify
kilocode --version
```

### Ollama Connection Failed from CLI

**Problem:**
```
Error: Failed to connect to Ollama
```

**Solutions:**

1. **Check Ollama is running:**
   ```bash
   # On host machine
   systemctl --user status ollama
   # or
   ollama list
   ```

2. **Check correct URL:**
   - Inside container: `http://host.containers.internal:11434`
   - On host: `http://localhost:11434`

3. **Check firewall:**
   ```bash
   # Ollama should listen on all interfaces
   curl http://0.0.0.0:11434/api/tags
   ```

4. **Set OLLAMA_HOST environment:**
   ```bash
   export OLLAMA_HOST=0.0.0.0:11434
   ollama serve
   ```

---

### Permission Denied Errors

**Problem:**
```
Error: EACCES: permission denied
```

**Solution:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Reinstall global packages
npm install -g backlog.md kodu pm2
```

---

## Service Issues

### Watcher Won't Start

**Problem:**
```
Error: Cannot find module 'chokidar'
```

**Solution:**
```bash
cd ~/ticket-processor
npm install
node scripts/start.js
```

### PM2 Service Not Running

**Problem:**
```
pm2 status shows "errored"
```

**Solution:**
```bash
# View error logs
pm2 logs ticket-processor --err

# Delete and restart
pm2 delete dev-toolbox
pm2 start ecosystem.config.js

# Or restart directly
pm2 restart ticket-processor

# Save PM2 configuration
pm2 save
```

### Systemd Service Fails to Start

**Problem:**
```
Job for ticket-processor.service failed
```

**Solution:**
```bash
# Check status
systemctl --user status ticket-processor

# View logs
journalctl --user -u ticket-processor -n 50

# Common issues:
# 1. Missing .env file
cd ~/ticket-processor
ls -la .env  # Should exist

# 2. Node.js not found
which node  # Should return path
# If not, edit service file:
nano ~/.config/systemd/user/ticket-processor.service
# Change ExecStart to use full node path

# 3. Wrong working directory
# Verify WorkingDirectory in service file

# Reload and restart
systemctl --user daemon-reload
systemctl --user restart ticket-processor
```

### Service Keeps Crashing

**Problem:**
Service restarts repeatedly.

**Solution:**
```bash
# Check recent crashes
journalctl --user -u ticket-processor --since "1 hour ago"

# Common causes:

# 1. Ollama not running
systemctl --user status ollama
systemctl --user start ollama

# 2. Out of memory
# Edit service file to increase limit
nano ~/.config/systemd/user/ticket-processor.service
# Add: MemoryLimit=2G

# 3. Port already in use
lsof -i :3001  # Check webhook port
# Kill conflicting process or change port in config.json

# 4. Corrupted config
node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
```

---

## Processing Issues

### Tasks Not Being Processed

**Problem:**
Files in `backlog/todo/` but nothing happens.

**Solution:**
```bash
# 1. Check watcher is running
pm2 status ticket-processor
# OR
systemctl --user status ticket-processor

# 2. Check logs for errors
pm2 logs dev-toolbox
# OR
journalctl --user -u dev-toolbox -f

# 3. Verify file format
# Must be .md files
ls -la backlog/todo/

# 4. Check permissions
ls -la backlog/todo/
# Should be readable by your user

# 5. Manual test
node scripts/watcher.js
# Watch for errors in console
```

### Kodu CLI Not Found

**Problem:**
```
Error: spawn kodu ENOENT
```

**Solution:**
```bash
# Verify kodu is installed
which kodu

# If not found, install
npm install -g kodu

# Verify installation
kodu --version

# Check PATH
echo $PATH | grep npm

# If still not working, use full path in process-ticket.js
# Or reinstall
npm uninstall -g kodu
npm install -g kodu
```

### Aider Not Found (spawn ENOENT)

**Problem:**
Logs show \`Error: spawn aider ENOENT\` when processing tasks.

**Cause:**
\`aider\` executable is not found in the \`PATH\` of the environment where the watcher is running.

**Solution:**
1. Install Aider:
   \`\`\`bash
   pip3 install aider-chat
   \`\`\`
2. Ensure its location (usually \`~/.local/bin\`) is in the \`PATH\`.
3. If using Devcontainers with host mounts, ensure Aider is installed on the **Host** machine.

### Task Stuck in 'Doing'

**Problem:**
Files remain in \`backlog/doing/\` indefinitely.

**Cause:**
A zombie process (often holding port 3001) is blocking execution.

**Solution:**
1. Find zombie process:
   \`\`\`bash
   lsof -i :3001
   # OR
   ps aux | grep "node scripts/watcher.js"
   \`\`\`
2. Kill it manually:
   \`\`\`bash
   kill -9 <PID>
   \`\`\`
3. Restart service:
   \`\`\`bash
   pm2 restart dev-toolbox
   \`\`\`

### Ollama Connection Failed

**Problem:**
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

**Solution:**
```bash
# 1. Check Ollama is running
# macOS
brew services list | grep ollama
brew services restart ollama

# Linux
systemctl --user status ollama
systemctl --user start ollama

# 2. Test connection
curl http://localhost:11434/api/tags

# 3. Check OLLAMA_HOST in .env
cat .env | grep OLLAMA_HOST
# Should be:
# macOS: http://localhost:11434 OR http://host.containers.internal:11434
# Linux: http://localhost:11434 OR http://172.17.0.1:11434

# 4. For containers, check network
podman inspect ticket-processor-app | grep -A 10 "Networks"
```

### Model Not Found

**Problem:**
```
Error: model 'deepseek-coder' not found
```

**Solution:**
```bash
# List installed models
ollama list

# Pull missing model
ollama pull deepseek-coder

# Or pull all configured models
ollama pull deepseek-coder
ollama pull codellama
ollama pull mistral
ollama pull llama2

# Verify
ollama list
```

### Processing Timeout

**Problem:**
```
Error: Process timed out after 300000ms
```

**Solution:**
```bash
# Increase timeout in config.json
nano config.json
```

```json
{
  "ollama": {
    "timeout": 600000
  }
}
```

```bash
# Restart service
pm2 restart ticket-processor
# OR
systemctl --user restart ticket-processor
```

### Task Stuck in "doing"

**Problem:**
Task file stuck in `backlog/doing/` folder.

**Solution:**
```bash
# 1. Check if process is still running
pm2 status
# OR
ps aux | grep node

# 2. Check logs for that task
pm2 logs ticket-processor | grep "task-5"

# 3. If truly stuck, manually move back
mv backlog/doing/task-5*.md backlog/todo/

# 4. Restart watcher
pm2 restart ticket-processor
```

---

## Gitea Issues

### Gitea Not Accessible

**Problem:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
```bash
# 1. Check Gitea container
podman ps | grep gitea

# If not running:
cd ~/ticket-processor/containers
podman-compose up -d

# 2. Check logs
podman logs ticket-processor-gitea

# 3. Wait for startup (can take 30s)
sleep 30
curl http://localhost:3000/api/v1/version

# 4. Check port binding
podman port ticket-processor-gitea
```

### Gitea Token Not Working

**Problem:**
```
Error: 401 Unauthorized
```

**Solution:**
```bash
# 1. Check token is set
echo $GITEA_TOKEN
cat .env | grep GITEA_TOKEN

# 2. Regenerate token manually
# Log in to Gitea at http://localhost:3000
# Go to Settings → Applications → Generate New Token
# Update .env file
nano .env
# GITEA_TOKEN=<new-token>

# 3. Reload environment
pm2 restart ticket-processor
# OR
systemctl --user restart ticket-processor
```

### Cannot Create Repository

**Problem:**
```
Error: 404 Organization not found
```

**Solution:**
```bash
# 1. Create organization manually
curl -X POST -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"ticket-processor","full_name":"Ticket Processor"}' \
  http://localhost:3000/api/v1/orgs

# 2. Or via UI
# Log in → Organizations → Create Organization
# Name: ticket-processor

# 3. Update .env if using different org name
nano .env
# GITEA_ORG=your-org-name
```

### Push Failed

**Problem:**
```
Error: remote: HTTP Basic: Access denied
```

**Solution:**
```bash
# 1. Check GITEA_TOKEN in .env
cat .env | grep GITEA_TOKEN

# 2. Token needs repo write permissions
# Log in to Gitea → Settings → Applications
# Create token with "repo" scope

# 3. Verify token works
curl -H "Authorization: token $GITEA_TOKEN" \
  http://localhost:3000/api/v1/user

# Should return user info
```

### Webhook Not Triggering

**Problem:**
PR merges don't move tasks to completed.

**Solution:**
```bash
# 1. Check webhook server is running
curl http://localhost:3001/health

# 2. Check webhook is configured in Gitea
# Go to repo → Settings → Webhooks
# Should have webhook pointing to http://host.containers.internal:3001/webhook

# 3. Check webhook secret matches
cat .env | grep GITEA_WEBHOOK_SECRET

# 4. Test webhook manually
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -H "X-Gitea-Event: pull_request" \
  -d '{"action":"closed","number":1,"pull_request":{"merged":true,"title":"[Task 5] Test"}}'

# 5. Check logs
pm2 logs ticket-processor | grep webhook
```

---

## Container Issues

### VS Code Dev Containers Not Finding Podman

**Problem:**
VS Code Dev Containers extension looks for Docker instead of Podman:
```
Error: Cannot connect to the Docker daemon
```

**Solution:**
Add these settings to your VS Code user settings (`~/.config/Code/User/settings.json` on Linux, or via Command Palette → "Preferences: Open User Settings (JSON)"):

```json
{
  "dev.containers.dockerPath": "podman",
  "dev.containers.dockerComposePath": "podman-compose"
}
```

Alternatively, via command line:
```bash
# Linux
cat ~/.config/Code/User/settings.json | python3 -c "
import json,sys
d=json.load(sys.stdin)
d['dev.containers.dockerPath']='podman'
d['dev.containers.dockerComposePath']='podman-compose'
print(json.dumps(d, indent=2))
" > /tmp/settings.json && mv /tmp/settings.json ~/.config/Code/User/settings.json
```

**Note:** Reload VS Code after changing settings.

### GPG Signature Errors in Debian Containers

**Problem:**
Container build fails with GPG signature verification errors when using Podman:
```
W: GPG error: http://deb.debian.org/debian bookworm InRelease: At least one invalid signature was encountered.
E: The repository 'http://deb.debian.org/debian bookworm InRelease' is not signed.
```

**Cause:**
Podman's overlay filesystem handling corrupts GPG keys in Debian image layers. This is a known compatibility issue between Podman and Debian-based container images that persists even after cache clearing.

**Solution 1: Use Alpine-based Images (Recommended)**

Switch from Debian-based to Alpine-based Node images. Alpine uses `apk` package manager which doesn't have GPG issues with Podman:

```dockerfile
# Instead of: FROM node:24-bookworm
FROM node:24-alpine

# Alpine uses apk instead of apt-get
RUN apk add --no-cache \
    bash \
    git \
    curl \
    openssh-client \
    jq \
    vim
```

**Benefits:**
- ✅ No GPG signature issues with Podman
- ✅ Smaller image size (~60MB vs ~500MB for Debian)
- ✅ Faster builds and pulls
- ✅ Works reliably with rootless Podman

**Solution 2: GPG Cleanup (May Not Work)**

If you must use Debian, try adding GPG cleanup before apt operations:

```dockerfile
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /var/lib/apt/lists/partial && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      your-packages-here && \
    rm -rf /var/lib/apt/lists/*
```

**Note:** This fix often doesn't work because the corruption happens at the base image layer level.

**Solution 3: Clear All Podman State**

If switching images isn't possible:
```bash
# Remove corrupted images
podman image rm -f node:24-bookworm

# Full system reset
podman system reset --force

# Or aggressive prune
podman system prune -a -f --volumes
podman image prune -f
```

Then rebuild with `--no-cache`:
```bash
podman build --no-cache -f .devcontainer/Dockerfile -t myimage .
```

### Podman Compose Not Found

**Problem:**
```
-bash: podman-compose: command not found
```

**Solution:**
```bash
# Install podman-compose
# macOS
brew install podman-compose

# Linux
pip3 install podman-compose

# Verify
podman-compose --version
```

### Container Won't Start

**Problem:**
```
Error: container failed to start
```

**Solution:**
```bash
# 1. Check container logs
podman logs ticket-processor-gitea
podman logs ticket-processor-postgres

# 2. Check volume permissions
podman volume inspect gitea-data
podman volume inspect postgres-data

# 3. Remove and recreate
cd ~/ticket-processor/containers
podman-compose down -v
podman-compose up -d

# 4. Check disk space
df -h
```

### Port Already in Use

**Problem:**
```
Error: address already in use
```

**Solution:**
```bash
# Find what's using the port
lsof -i :3000  # Gitea
lsof -i :3001  # Webhook
lsof -i :5432  # PostgreSQL

# Kill the process
kill -9 <PID>

# Or change ports in podman-compose.yml
nano containers/podman-compose.yml
# Change "3000:3000" to "3002:3000" for example
```

### Volume Permission Issues

**Problem:**
```
Error: Permission denied
```

**Solution:**
```bash
# For rootless Podman
# Check volume ownership
podman volume inspect gitea-data | grep Mountpoint
ls -la /path/to/volume

# Reset volumes
podman-compose down -v
podman volume prune
podman-compose up -d
```

---

## Performance Issues

### High CPU Usage

**Problem:**
`node` process using 100% CPU.

**Solution:**
```bash
# 1. Check what's running
pm2 monit
# OR
htop

# 2. Check if kodu is running multiple times
ps aux | grep kodu

# 3. Reduce concurrency
nano config.json
```

```json
{
  "processing": {
    "concurrency": 1
  }
}
```

```bash
pm2 restart ticket-processor
```

### High Memory Usage

**Problem:**
Process using too much RAM.

**Solution:**
```bash
# 1. Check memory usage
pm2 status
# OR
systemctl --user status ticket-processor

# 2. Set memory limit
# PM2:
nano ecosystem.config.js
# Set: max_memory_restart: '500M'

# Systemd:
nano ~/.config/systemd/user/ticket-processor.service
# Add: MemoryLimit=1G

# 3. Restart
pm2 restart ticket-processor
# OR
systemctl --user daemon-reload
systemctl --user restart ticket-processor
```

### Slow Processing

**Problem:**
Tasks take too long to process.

**Solution:**
```bash
# 1. Use faster model
nano config.json
```

```json
{
  "ollama": {
    "defaultModel": "ollama/codellama"
  }
}
```

```bash
# 2. Check Ollama is using GPU (if available)
ollama run deepseek-coder "test" --verbose
# Should mention GPU

# 3. Increase timeout if timing out
nano config.json
```

```json
{
  "ollama": {
    "timeout": 600000
  }
}
```

### Disk Space Issues

**Problem:**
```
Error: ENOSPC: no space left on device
```

**Solution:**
```bash
# Check disk usage
df -h

# Clean up old tasks
rm -rf backlog/completed/*
rm -rf backlog/failed/*.error.log

# Clean up old repos
rm -rf repos/task-*/

# Clean up logs
rm -f logs/*.log
pm2 flush  # Clear PM2 logs

# Clean up Podman
podman system prune -a
podman volume prune
```

---

## Debugging

### Enable Debug Logging

**config.json:**
```json
{
  "logging": {
    "level": "debug"
  }
}
```

**Restart:**
```bash
pm2 restart ticket-processor
```

### Manual Processing Test

Test processing without the watcher:

```bash
# Create test task
cat > /tmp/test-task.md <<'EOF'
---
title: Test Task
status: To Do
priority: low
model: ollama/mistral
description: |
  Simple test task
acceptanceCriteria:
  - Works correctly
---
EOF

# Copy to todo
cp /tmp/test-task.md backlog/todo/

# Watch logs
pm2 logs ticket-processor
```

### Test Ollama Directly

```bash
# Test Ollama API
curl http://localhost:11434/api/generate \
  -d '{"model":"deepseek-coder","prompt":"console.log(\"hello\")"}' \
  | jq .

# Test kodu directly
kodu --message "Create a hello world function" \
  --model ollama/deepseek-coder
```

### Test Gitea API

```bash
# Test authentication
curl -H "Authorization: token $GITEA_TOKEN" \
  http://localhost:3000/api/v1/user | jq .

# List repos
curl -H "Authorization: token $GITEA_TOKEN" \
  http://localhost:3000/api/v1/orgs/dev-toolbox/repos | jq .
```

### Capture Full Output

```bash
# Redirect all output to file
node scripts/watcher.js > /tmp/watcher.log 2>&1 &

# Or with tee (console + file)
node scripts/watcher.js 2>&1 | tee /tmp/watcher.log
```

### Check Configuration

```bash
# Validate config.json
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('config.json')), null, 2))"

# Check environment
node -e "require('dotenv').config(); console.log(JSON.stringify(process.env, null, 2))" | grep -E "OLLAMA|GITEA|GIT_"

# Verify file paths
node -e "const c = require('./config.json'); console.log(require('path').resolve(c.folders.todo))"
```

---

## Getting Help

If you're still stuck after trying these solutions:

1. **Check logs thoroughly:**
   ```bash
   # Recent errors
   pm2 logs dev-toolbox --err --lines 100
   # OR
   journalctl --user -u dev-toolbox -p err --since today
   ```

2. **Verify all services are running:**
   ```bash
   bash scripts/service-status.sh
   ```

3. **Test each component individually:**
   - Ollama: `curl http://localhost:11434/api/tags`
   - Gitea: `curl http://localhost:3000/api/v1/version`
   - Webhook: `curl http://localhost:3001/health`
   - Kodu: `kodu --version`

4. **Create minimal reproduction:**
   - Create simplest possible task
   - Watch processing with `pm2 logs`
   - Document exact error message

5. **Check system resources:**
   ```bash
   htop           # CPU/RAM
   df -h          # Disk space
   free -h        # Memory
   ```

6. **Review documentation:**
   - [INSTALLATION.md](INSTALLATION.md)
   - [CONFIG.md](CONFIG.md)
   - [USAGE.md](USAGE.md)

---

## Quick Reference

### Restart Everything

```bash
# macOS
pm2 restart ticket-processor
podman-compose -f containers/podman-compose.yml restart
brew services restart ollama

# Linux
systemctl --user restart ticket-processor
podman-compose -f containers/podman-compose.yml restart
systemctl --user restart ollama
```

### Check Status

```bash
bash scripts/service-status.sh
```

### View Logs

```bash
# macOS
pm2 logs ticket-processor

# Linux
journalctl --user -u ticket-processor -f
```

### Clean Start

```bash
# Stop everything
pm2 delete ticket-processor
podman-compose -f containers/podman-compose.yml down -v

# Clean up
rm -rf logs/*
rm -rf backlog/{doing,failed,review}/*
rm -rf repos/*

# Start fresh
node scripts/start.js
```
