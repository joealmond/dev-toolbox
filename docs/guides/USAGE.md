# Usage Guide

Comprehensive guide for using the Dev-Toolbox system.

## Table of Contents

- [Creating Tasks](#creating-tasks)
- [Task File Format](#task-file-format)
- [Workflow States](#workflow-states)
- [Model Selection](#model-selection)
- [Monitoring Progress](#monitoring-progress)
- [Advanced Usage](#advanced-usage)

---

## Creating Tasks

There are **5 ways** to create tasks:

### Method 1: Interactive CLI (Recommended for Single Tasks)

```bash
node scripts/create-task.js
```

**Interactive prompts:**
1. Task title
2. Description
3. Priority (low/medium/high)
4. Labels (comma-separated)
5. Model selection
6. Estimated hours
7. Acceptance criteria (one per line)
8. Option to move to `todo/` for immediate processing

**Example session:**
```
Task title: Add user authentication
Description: Implement OAuth 2.0 with Google and GitHub
Priority (low/medium/high): high
Labels (comma-separated): backend, security
Model (default: qwen2.5-coder:7b): 
Estimated hours: 8

Acceptance Criteria (empty line to finish):
  1. Users can log in with Google
  2. Users can log in with GitHub
  3. Session management works
  4. 

✓ Task created successfully!
Task file: task-5 - Add user authentication.md

Move to todo folder for processing? (y/N): y
✓ Task moved to backlog/todo and will be processed automatically
```

### Method 2: From Template

```bash
bash scripts/create-from-template.sh
```

Creates a new task file from `backlog/task-template.md` with:
- Auto-incremented task ID
- Updated timestamp
- Opens in your editor for customization

### Method 3: Backlog.md CLI

```bash
backlog task create "Task Title" \
  -d "Task description" \
  -s "To Do" \
  --priority high \
  -l backend,security
```

**Then** manually add additional metadata and move to `backlog/todo/`.

### Method 4: Bulk Import from JSON

Create `tasks.json`:
```json
[
  {
    "title": "Add user authentication",
    "description": "Implement OAuth 2.0",
    "priority": "high",
    "labels": ["backend", "security"],
    "model": "qwen2.5-coder:7b",
    "acceptanceCriteria": [
      "Users can log in with Google",
      "Users can log in with GitHub",
      "Session management works"
    ],
    "estimatedHours": 8,
    "autoProcess": true
  },
  {
    "title": "Create user dashboard",
    "description": "Build responsive dashboard UI",
    "priority": "medium",
    "labels": ["frontend", "react"],
    "model": "qwen2.5-coder:3b",
    "acceptanceCriteria": [
      "Dashboard shows user stats",
      "Responsive on mobile"
    ],
    "estimatedHours": 4,
    "autoProcess": false
  }
]
```

Run bulk import:
```bash
node scripts/bulk-create.js tasks.json
```

### Method 5: Manual File Creation

Create file in `backlog/todo/task-X - Title.md`:

```markdown
---
title: Add User Authentication
status: To Do
priority: high
assignee: 
labels:
  - backend
  - security
  - authentication
model: qwen2.5-coder:7b
description: |
  Implement OAuth 2.0 authentication with support for Google and GitHub providers.
  Include session management and token refresh.
acceptanceCriteria:
  - Users can log in with Google
  - Users can log in with GitHub
  - Session management works correctly
  - Token refresh is implemented
  - Logout functionality works
dependencies: []
estimatedHours: 8
createdAt: 2026-01-02T10:00:00Z
---

# Additional Details

## Technical Requirements
- Use Passport.js for OAuth
- Store tokens securely
- Implement CSRF protection

## Resources
- OAuth 2.0 RFC: https://tools.ietf.org/html/rfc6749
- Passport.js docs
```

**The watcher will automatically detect and process this file.**

---

## Task File Format

### Required Fields (Front Matter)

```yaml
---
title: "Task title"              # Required
status: "To Do"                   # Required (from Backlog.md)
priority: high                    # low, medium, high
description: |                    # Multi-line description
  Task description here
acceptanceCriteria:               # Array of criteria
  - Criterion 1
  - Criterion 2
---
```

### Optional Fields

```yaml
model: qwen2.5-coder:7b           # Override default model
labels:                          # Tags
  - backend
  - api
assignee: @username              # Assigned person
dependencies:                    # Task dependencies
  - task-1
  - task-2
estimatedHours: 8                # Time estimate
createdAt: 2026-01-02T10:00:00Z  # ISO timestamp
```

### Body Content

After the front matter, add any additional context:

```markdown
---
# Front matter above
---

# Background
Why this task is needed...

## Technical Notes
- Implementation details
- Architecture decisions

## Resources
- Link 1
- Link 2

## Edge Cases
- Case 1
- Case 2
```

---

## Workflow States

Tasks flow through these states:

### 1. **todo/** - New Tasks

- **Description**: Tasks waiting to be processed
- **Action**: Watcher monitors this folder
- **Next State**: Automatically moves to `doing/` when picked up

**Example:**
```
backlog/todo/
├── task-1 - Add authentication.md
├── task-2 - Create dashboard.md
└── task-3 - Fix bug in API.md
```

### 2. **doing/** - Processing

- **Description**: Currently being processed by kodu
- **Action**: Kodu CLI executes with specified model
- **Next State**: 
  - Success → `review/`
  - Failure → `failed/`

**During processing:**
- File is locked (won't be picked up again)
- Console shows real-time kodu output
- Logs written to `logs/`

### 3. **review/** - Awaiting Review

- **Description**: Successfully processed, PR created in Gitea
- **Action**: Manual or automatic review
- **Next State**: Moves to `completed/` when PR is merged

**What happens:**
1. Git repository created in `repos/task-X/`
2. Changes committed
3. Pull request created in Gitea
4. Webhook watches for PR merge

### 4. **failed/** - Processing Failed

- **Description**: Task processing encountered an error
- **Action**: Review error log and fix issue
- **Recovery**: Fix and move back to `todo/`

**Error log format:**
```
backlog/failed/
├── task-5 - Broken feature.md
└── task-5 - Broken feature.error.log
```

**Error log content:**
```json
{
  "timestamp": "2026-01-02T12:34:56.789Z",
  "filename": "task-5 - Broken feature.md",
  "error": "Kodu exited with code 1",
  "stderr": "Error: Model not found..."
}
```

**Recovery:**
```bash
# Fix the issue (e.g., pull missing model)
ollama pull qwen2.5-coder:7b

# Move back to todo
mv backlog/failed/task-5*.md backlog/todo/
```

### 5. **completed/** - Finished

- **Description**: PR merged, task complete
- **Action**: Archive or delete
- **Trigger**: Webhook from Gitea on PR merge

---

## Model Selection

### Available Models

Configure in `config.json`:
```json
{
  "ollama": {
    "defaultModel": "qwen2.5-coder:7b",
    "availableModels": [
      "qwen2.5-coder:7b",
      "qwen2.5-coder:3b",
      "qwen2.5-coder:14b",
      "codellama:7b"
    ]
  }
}
```

### Model Characteristics

| Model | Params | VRAM | Strengths | Use Case |
|-------|--------|------|-----------|----------|
| **qwen2.5-coder:7b** | 7B | ~5GB | Best balance, fast & capable | Default for all tasks |
| **qwen2.5-coder:3b** | 3B | ~2.5GB | Very fast, good for simple code | Quick fixes, prototypes |
| **qwen2.5-coder:14b** | 14B | ~10GB | Most capable, needs more VRAM | Complex refactoring |
| **codellama:7b** | 7B | ~5GB | Reliable alternative | Fallback option |

### Per-Task Model Selection

**Option 1: In front matter**
```yaml
model: qwen2.5-coder:3b   # Use faster model for simple task
```

**Option 2: Interactive creation**
```bash
node scripts/create-task.js
# Will prompt for model selection
```

**Option 3: Bulk creation**
```json
{
  "title": "Quick fix",
  "model": "qwen2.5-coder:3b",
  ...
}
```

### Pulling Additional Models

```bash
# List available models
ollama list

# Pull new model
ollama pull <model-name>

# Add to config.json
nano config.json
# Add to "availableModels" array
```

---

## Monitoring Progress

### Real-Time Monitoring

**Follow logs:**
```bash
# macOS (PM2)
pm2 logs ticket-processor

# Linux (systemd)
journalctl --user -u ticket-processor -f

# Or use helper script
bash scripts/service-status.sh
```

**Watch folder:**
```bash
# Monitor todo folder
watch -n 1 "ls -la backlog/todo/"

# Count files in each state
watch -n 5 "echo 'Todo: ' $(ls backlog/todo/ | wc -l); \
             echo 'Doing: ' $(ls backlog/doing/ | wc -l); \
             echo 'Review: ' $(ls backlog/review/ | wc -l); \
             echo 'Failed: ' $(ls backlog/failed/ | wc -l); \
             echo 'Completed: ' $(ls backlog/completed/ | wc -l)"
```

### Health Check

**Check webhook server:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "queueSize": 0,
  "queuePending": 1,
  "processing": ["task-5 - Add auth.md"]
}
```

### Gitea Monitoring

**Access Gitea UI:**
```
http://localhost:3000
```

**Check pull requests:**
```bash
# List repos
curl -H "Authorization: token $GITEA_TOKEN" \
  http://localhost:3000/api/v1/orgs/ticket-processor/repos

# List PRs for a repo
curl -H "Authorization: token $GITEA_TOKEN" \
  http://localhost:3000/api/v1/repos/ticket-processor/task-5/pulls
```

---

## Advanced Usage

### VS Code Run & Approvals

Use VS Code to quickly run generated code and approve tasks without leaving the editor. This complements the watcher and Kilo Code (kodu) automation.

- **Run generated code**: Open the generated file, then right-click → Run Code. Output appears in the terminal. Requires the Code Runner extension (already enabled in the dev container).
- **Approve from editor**: With the spec file active (e.g., `spec-123.md`), open Terminal → Run Task and choose:
  - Approve Code for Current Spec
  - Approve Docs for Current Spec
  - List Pending Approvals

Setup details:
- Devcontainer settings enable terminal output and auto-save before run. See [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json#L19-L27).
- VS Code tasks are available. See [.vscode/tasks.json](.vscode/tasks.json).

Typical flow:
1. Create or move a spec/task into `backlog/todo/`.
2. Watcher processes with Kodu, generates code, and moves to `backlog/review/`.
3. Open generated code in VS Code. Edit and Run Code to validate.
4. Run Task → Approve Code for Current Spec (then Approve Docs if required).
5. The webhook auto-completes on PR merge; task moves to `backlog/completed/`.

### Custom Prompts

Enhance task descriptions with specific instructions:

```yaml
description: |
  Create a REST API endpoint for user authentication.
  
  IMPORTANT INSTRUCTIONS:
  - Use Express.js middleware pattern
  - Add input validation with Joi
  - Include unit tests with Jest
  - Follow repository pattern for data access
  - Add comprehensive JSDoc comments
  - Handle all error cases
```

### Task Dependencies

Specify dependencies to control execution order:

```yaml
dependencies:
  - task-1
  - task-2
```

**Note:** Currently informational only. Future versions may enforce ordering.

### Acceptance Criteria as Checklist

Format AC as detailed checklist:

```yaml
acceptanceCriteria:
  - "User can sign up with email and password"
  - "User receives verification email"
  - "User can log in after verification"
  - "Failed login shows appropriate error message"
  - "Session expires after 24 hours"
  - "User can log out successfully"
  - "All endpoints are covered by tests (>80% coverage)"
```

### Iterative Refinement

If task fails or needs improvement:

1. **Review the output:**
   ```bash
   cat repos/task-5/WORK_LOG.md
   ```

2. **Update task description:**
   ```bash
   nano backlog/failed/task-5 - Feature.md
   # Add more specific instructions
   ```

3. **Reprocess:**
   ```bash
   mv backlog/failed/task-5*.md backlog/todo/
   rm backlog/failed/task-5*.error.log
   ```

### Manual Gitea Operations

**Create repo manually:**
```bash
curl -X POST -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"task-10","private":false}' \
  http://localhost:3000/api/v1/orgs/ticket-processor/repos
```

**Create PR manually:**
```bash
curl -X POST -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"[Task 10] Feature","head":"task-10","base":"main"}' \
  http://localhost:3000/api/v1/repos/ticket-processor/task-10/pulls
```

### Batch Processing

Process multiple tasks at once:

1. Create multiple task files in `backlog/todo/`
2. Watcher processes them sequentially (concurrency: 1)
3. Monitor progress in logs

**Or increase concurrency:**
```json
{
  "processing": {
    "concurrency": 2
  }
}
```

⚠️ **Warning:** Higher concurrency uses more resources and may cause conflicts.

---

## Example Workflows

### Simple Bug Fix

```bash
# Create quick task
backlog task create "Fix login bug" \
  -d "Users can't log in with spaces in email" \
  --priority high \
  -l bug,backend

# Add to todo
mv backlog/task-* backlog/todo/

# Monitor
pm2 logs ticket-processor
```

### Feature Development

```bash
# Create detailed task
node scripts/create-task.js

# OR use template and edit
bash scripts/create-from-template.sh

# Review in Gitea after processing
open http://localhost:3000/dev-toolbox
```

### Batch Import from Planning

```bash
# Export from planning tool to tasks.json
# ...

# Import all tasks
node scripts/bulk-create.js tasks.json

# Monitor progress
watch -n 2 "ls -1 backlog/*/  | wc -l"
```

---

## Tips and Best Practices

### Task Creation

✅ **DO:**
- Write clear, specific descriptions
- Include concrete acceptance criteria
- Specify relevant labels
- Provide example code or links if helpful
- Break large tasks into smaller subtasks

❌ **DON'T:**
- Use vague descriptions like "improve performance"
- Create tasks without acceptance criteria
- Make tasks too large (>16 hours estimate)
- Use ambiguous language

### Model Selection

- **qwen2.5-coder:7b**: Default - best balance of speed and quality
- **qwen2.5-coder:3b**: Fast prototypes, simple fixes
- **qwen2.5-coder:14b**: Complex refactoring (needs 10GB+ VRAM)
- **codellama:7b**: Alternative if Qwen unavailable

### Monitoring

- Check logs regularly: `pm2 logs` or `journalctl -f`
- Review failed tasks promptly
- Monitor disk space (repos and logs grow)
- Check Gitea for open PRs

### Performance

- Keep `concurrency: 1` unless you have powerful hardware
- Use faster models for simple tasks
- Pull only models you need
- Clean up completed tasks periodically

---

## See Also

- [README.md](README.md) - Project overview
- [CONFIG.md](CONFIG.md) - Configuration reference
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [Backlog.md Documentation](https://github.com/MrLesk/Backlog.md) - Task format details
