# Integration Guide

Complete setup and integration guide for the spec-driven ticket processor system.

## Prerequisites

- **Node.js**: 24+ (includes npm 11.7.0+)
- **Ollama**: Running locally with DeepSeek-Coder model
- **Gitea**: Configured with webhook support
- **Docker/Podman**: For containerized services
- **macOS/Linux**: Development environment

### Installation Checklist

- [ ] Node.js 24+ installed
- [ ] npm packages installed (`npm install`)
- [ ] Ollama running on localhost:11434
- [ ] Gitea instance configured
- [ ] PM2 or systemd for service management
- [ ] Docker or Podman available

---

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd /path/to/dev-toolbox
npm install --legacy-peer-deps
```

### 2. Configure Environment

Create `.env` file:

```bash
cat > .env << EOF
NODE_ENV=production
OLLAMA_HOST=http://localhost:11434
GITEA_BASE_URL=http://localhost:3000
GITEA_WEBHOOK_SECRET=your-webhook-secret-here
LOG_LEVEL=info
EOF
```

### 3. Create Directory Structure

```bash
mkdir -p backlog/{todo,doing,review,completed,failed}
mkdir -p docs/{adr,worklogs,specs}
mkdir -p repos logs .index .github/agents
```

### 4. Start Services

```bash
# Start watcher (monitors backlog/todo)
npm run watch

# In another terminal, start webhook server
npm run webhook
```

### 5. Create First Task

```bash
npm run task:create
# Follow interactive prompts
```

---

## Detailed Setup

### Environment Configuration

**.env file options:**

```bash
# Node environment
NODE_ENV=production

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=deepseek-coder

# Gitea Configuration
GITEA_BASE_URL=http://localhost:3000
GITEA_USERNAME=your-username
GITEA_TOKEN=your-access-token
GITEA_WEBHOOK_SECRET=random-secret-string

# Service Ports
WEBHOOK_PORT=3001
MCP_PORT=3002

# Logging
LOG_LEVEL=info
LOG_DIR=logs
```

### config.json Setup

The config.json file is pre-configured with defaults. Customize sections:

#### Folders Section
```json
{
  "folders": {
    "todo": "backlog/todo",
    "doing": "backlog/doing",
    "review": "backlog/review",
    "completed": "backlog/completed",
    "failed": "backlog/failed",
    "repos": "repos",
    "adr": "docs/adr",
    "worklogs": "docs/worklogs",
    "specArchive": "docs/specs",
    "changelog": "docs/CHANGELOG.md"
  }
}
```

#### Ollama Models
```json
{
  "ollama": {
    "defaultModel": "ollama/deepseek-coder",
    "availableModels": [
      "ollama/deepseek-coder",
      "ollama/codellama",
      "ollama/mistral"
    ],
    "timeout": 300000,
    "retryAttempts": 3
  }
}
```

#### Spec Configuration
```json
{
  "spec": {
    "enabled": true,
    "requirementsPromptTemplate": "Based on the following requirements, implement the solution:\n\n{requirements}",
    "architectureContextEnabled": true
  }
}
```

#### Approval Configuration
```json
{
  "approval": {
    "defaultCodeApproval": true,
    "defaultDocsApproval": true,
    "notifyOnPending": true,
    "timeoutHours": 72,
    "autoRejectOnTimeout": false
  }
}
```

---

## Gitea Webhook Setup

### 1. Create Webhook in Gitea

1. Navigate to repository settings
2. Go to Webhooks
3. Click "Add Webhook" → "Gitea"

### 2. Configure Webhook

**Webhook URL:**
```
http://your-host:3001/webhook
```

**Events to trigger:**
- [x] Push events
- [x] Pull request events
- [ ] Issues
- [ ] Releases

**Secret:**
```
(Use value from GITEA_WEBHOOK_SECRET env var)
```

### 3. Test Webhook

```bash
# Check webhook status in Gitea UI
# Should see successful deliveries

# Or test manually:
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -H "X-Gitea-Event: pull_request" \
  -H "X-Gitea-Signature: test" \
  -d '{"action":"merged","pull_request":{"merged":true}}'
```

---

## Ollama Setup

### 1. Start Ollama Server

```bash
# macOS
brew services start ollama

# Or manually
ollama serve
```

### 2. Pull DeepSeek-Coder Model

```bash
ollama pull deepseek-coder
```

Verify model is loaded:
```bash
curl http://localhost:11434/api/tags
```

### 3. Test Model

```bash
npm run test:ollama
```

---

## Kilo Code CLI Integration

### Installation

```bash
# Install kilo-code CLI if not already installed
npm install -g @kilocode/cli

# Verify installation
kodu --version
```

### Configuration

The watcher automatically uses kodu. Verify in logs:
```bash
tail -f logs/watcher.log | grep "Running kodu"
```

### Troubleshooting

If kodu fails:

```bash
# Test kodu directly
echo "# Task: Fix login bug" | kodu process --model ollama/deepseek-coder

# Check kodu logs
kodu logs
```

---

## Running Services

### Via PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Check status
pm2 status

# View logs
pm2 logs watcher
pm2 logs webhook
pm2 logs mcp-server
```

### Via npm Scripts (Development)

```bash
# Terminal 1: Watch for changes
npm run watch

# Terminal 2: Start webhook server
npm run webhook

# Terminal 3: Test commands
npm run spec:create
npm run approval:list
```

### Via systemd (Linux)

```bash
# Copy service file
sudo cp systemd/ticket-processor.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ticket-processor
sudo systemctl start ticket-processor

# Check status
sudo systemctl status ticket-processor

# View logs
sudo journalctl -u ticket-processor -f
```

---

## Docker/Podman Setup

### Build Container Image

```bash
docker build -f containers/Dockerfile -t dev-toolbox:latest .
```

### Run Container

```bash
docker run -d \
  --name ticket-processor \
  -p 3001:3001 \
  -p 3002:3002 \
  -v $(pwd)/backlog:/app/backlog \
  -v $(pwd)/logs:/app/logs \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  -e GITEA_BASE_URL=http://host.docker.internal:3000 \
  ticket-processor:latest
```

### Docker Compose

```bash
# Using podman-compose
podman-compose -f containers/podman-compose.yml up

# Using docker-compose
docker-compose -f containers/docker-compose.yml up
```

---

## Dev Container Setup

### Prerequisites

- VS Code
- Remote - Containers extension
- Docker/Podman

### Launch Dev Container

1. Open folder in VS Code
2. Click "Reopen in Container" (bottom-right)
3. VS Code rebuilds container
4. Run initialization:
   ```bash
   bash .devcontainer/init-scripts/setup.sh
   ```

### Dev Container Features

- Node.js 24 pre-installed
- Git configured
- Environment variables auto-loaded
- SSH keys mounted from host
- Ports 3001, 3002 forwarded

### Commands in Dev Container

```bash
# Check environment
node --version
npm --version

# Run services
npm run watch
npm run webhook

# Test functionality
npm run spec:create
npm run approval:list
```

---

## CLI Commands Reference

### Task Management

```bash
# Create task interactively
npm run task:create

# Create spec interactively
npm run spec:create

# Process specific task
npm run task:process 123

# Check task status
npm run task:status 123
```

### Spec Management

```bash
# Validate spec file
npm run spec:validate backlog/todo/spec-123.md

# Show parsed spec
npm run spec:show backlog/todo/spec-123.md

# Generate AI prompt
npm run spec:prompt backlog/todo/spec-123.md
```

### Approval Management

```bash
# List pending approvals
npm run approval:list

# List only code approvals pending
npm run approval:list code

# Interactive approval mode
npm run approval:interactive

# Approve code
npm run approval:approve code 123 alice@example.com "Looks good!"

# Approve docs
npm run approval:approve docs 123 alice@example.com

# Reject task
npm run approval:reject 123 "Doesn't meet requirements"
```

### Documentation

```bash
# Generate worklog
npm run docs:worklog backlog/review/task-123.md

# Generate ADR
npm run docs:adr "ADR Title" "Context" "Decision"

# Generate changelog entry
npm run docs:changelog added 123 "New feature" "Description"

# Generate all docs
npm run docs:all backlog/review/task-123.md
```

### Utilities

```bash
# Search index
npm run search "oauth authentication"

# Build search index
npm run search:rebuild

# Check logs
tail -f logs/watcher.log
tail -f logs/webhook-server.log

# View latest changes
git log --oneline -10
```

---

## MCP Server Setup

### VS Code Configuration

1. Create `.devcontainer/mcp.json`:
```json
{
  "mcpServers": {
    "dev-toolbox": {
      "command": "node",
      "args": ["${workspaceFolder}/scripts/mcp-server.js"],
      "env": {"NODE_ENV": "production"}
    }
  }
}
```

2. Launch MCP server:
```bash
npm run mcp
```

### Test MCP Tools

```javascript
// In VS Code with Copilot Chat enabled
@mcp list_pending

@mcp create_spec
  title: "New Feature"
  requirements: ["req1", "req2"]

@mcp approve_code 123 alice@example.com
```

---

## Git Integration

### Git Configuration

```json
{
  "git": {
    "commitMessageFormat": "feat(task-{id}): {title}",
    "branchNameFormat": "task-{id}",
    "createPR": true,
    "prTitle": "[Task {id}] {title}",
    "pushRetries": 3
  }
}
```

### Automatic Commits

When task completes, watcher creates:
```bash
git add docs/ README.md
git commit -m "feat(task-123): Implement OAuth2"
git push origin task-123
```

### PR Creation

If `createPR: true`:
1. Push to feature branch
2. Create PR in Gitea
3. Link task ID in PR title
4. Auto-merge on docs approval

---

## Monitoring and Logs

### Log Locations

```
logs/
├── watcher.log          # Main processing loop
├── webhook-server.log   # Gitea webhook events
├── mcp-server.log       # MCP server activity
└── kodu.log             # Kilo Code CLI output
```

### View Logs

```bash
# Real-time watcher
npm run logs:watch

# Real-time webhook
npm run logs:webhook

# Last 100 lines
tail -100 logs/watcher.log

# Search logs
grep "error" logs/watcher.log
```

### Log Levels

Configure in `config.json`:
```json
{
  "logging": {
    "level": "info",
    "includeTimestamp": true,
    "colorize": true
  }
}
```

Values: `debug`, `info`, `warn`, `error`

---

## Troubleshooting

### Common Issues

#### Watcher Not Processing Tasks
1. Check watcher is running: `npm run logs:watch`
2. Verify todo folder exists: `ls backlog/todo/`
3. Check Ollama is running: `curl http://localhost:11434/api/tags`
4. Verify kodu CLI is installed: `which kodu`

#### Gitea Webhook Not Triggering
1. Check webhook URL is accessible: `curl http://your-host:3001/webhook`
2. Verify secret matches: `echo $GITEA_WEBHOOK_SECRET`
3. Check webhook logs: `npm run logs:webhook`
4. Test manually: `npm run webhook:test`

#### Documentation Not Generating
1. Check `docs.generate: true` in spec
2. Verify templates exist: `ls templates/`
3. Check logs: `grep "doc generation" logs/watcher.log`
4. Test directly: `npm run docs:all backlog/review/task-123.md`

#### Approval Status Not Updating
1. Validate spec file: `npm run spec:validate path/to/spec.md`
2. Check YAML formatting (must use 2-space indent)
3. Manually verify file syntax: `node -e "require('js-yaml').load(require('fs').readFileSync('...', 'utf-8'))"`

### Debug Mode

Enable debug logging:

```bash
# Verbose watcher output
DEBUG=* npm run watch

# Just spec-related debug
DEBUG=spec-* npm run watch

# Check running processes
ps aux | grep -E "node|kodu|ollama"
```

---

## Performance Tuning

### Concurrency

Default: 1 task at a time (safe)

To process multiple tasks:
```json
{
  "processing": {
    "concurrency": 2,
    "watchDebounce": 1000
  }
}
```

### Model Selection

Balance speed vs. quality:
```json
{
  "ollama": {
    "defaultModel": "ollama/codellama"  // Faster
    // vs
    "defaultModel": "ollama/deepseek-coder"  // Better quality
  }
}
```

### Timeout Configuration

Increase for complex tasks:
```json
{
  "ollama": {
    "timeout": 600000  // 10 minutes
  }
}
```

---

## Security

### Webhook Security

Always use HTTPS in production:

```bash
# Generate strong secret
openssl rand -hex 32 > webhook-secret.txt

# Use in .env
GITEA_WEBHOOK_SECRET=$(cat webhook-secret.txt)
```

### Token Management

Store sensitive tokens in environment:

```bash
# Don't commit .env
echo ".env" >> .gitignore

# Use environment variables
export GITEA_TOKEN=your-token
export OLLAMA_HOST=http://localhost:11434
```

### File Permissions

Set proper permissions:

```bash
chmod 600 .env
chmod 700 scripts/*.sh
chmod -R 755 .devcontainer/init-scripts/
```

---

## Maintenance

### Regular Tasks

```bash
# Weekly: Check pending approvals
npm run approval:list

# Weekly: Check for stale tasks
npm run check:staleness --hours 24

# Monthly: Rebuild search index
npm run search:rebuild

# Monthly: Clean old logs
find logs/ -mtime +30 -delete

# Monthly: Archive completed tasks
npm run archive:completed
```

### Backup

```bash
# Backup configuration
cp config.json config.json.backup

# Backup backlog
tar czf backlog-$(date +%Y%m%d).tar.gz backlog/

# Backup documentation
tar czf docs-$(date +%Y%m%d).tar.gz docs/
```

---

## Next Steps

1. **Complete Setup:** Run all commands in "Quick Start" section
2. **Create First Task:** Use `npm run task:create` or `npm run spec:create`
3. **Process Task:** Move to doing or use `npm run task:process`
4. **Monitor:** Check logs with `npm run logs:watch`
5. **Review:** Approve code and docs with `npm run approval:approve`
6. **Integrate MCP:** Set up VS Code integration for AI assistant

---

## Support Resources

- [SPEC-REFERENCE.md](./SPEC-REFERENCE.md) - Task format
- [APPROVAL-WORKFLOW.md](./APPROVAL-WORKFLOW.md) - Approval process
- [MCP-TOOLS.md](./MCP-TOOLS.md) - AI tools reference
- [README.md](./README.md) - Project overview

---

## Getting Help

If you encounter issues:

1. Check logs: `npm run logs:watch`
2. Validate configuration: `npm run validate:config`
3. Test individual components: `npm run test:ollama`, `npm run test:kodu`
4. Search documentation for your error message
5. Create an issue with logs and configuration
