# Integration Guide: Spec-Driven Development

This guide covers the complete integration of spec-driven development features into Dev-Toolbox.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Spec File Format](#spec-file-format)
4. [Workflow](#workflow)
5. [Approval Process](#approval-process)
6. [Documentation Generation](#documentation-generation)
7. [Semantic Search](#semantic-search)
8. [MCP Integration](#mcp-integration)
9. [Troubleshooting](#troubleshooting)

## Overview

The Dev-Toolbox now supports **spec-driven development** - a workflow where:

1. Tasks can include detailed specifications with requirements
2. Kodu processes tasks and generates code
3. Documentation is auto-generated (worklogs, ADRs, changelogs)
4. Approval gates ensure quality before completion
5. Semantic search provides context from your codebase

### Key Features

- ✅ **Backward Compatible** - Existing tasks work unchanged
- ✅ **Configurable Approvals** - Per-task approval requirements
- ✅ **Auto-Documentation** - Generate worklogs, ADRs, changelogs
- ✅ **Semantic Search** - Find relevant code automatically
- ✅ **MCP Integration** - Control everything from VS Code
- ✅ **CLI-First** - All features accessible via command line

## Quick Start

### 1. Create a Spec File

**Interactive:**
```bash
npm run spec:create -- --interactive
```

**CLI:**
```bash
npm run spec:create -- \
  --title "Add User Authentication" \
  --requirements "Support Google OAuth" "Support GitHub OAuth" \
  --type feature \
  --components "auth-service" "user-db"
```

### 2. Watcher Processes It

The file watcher automatically:
1. Detects new spec file in `backlog/todo/`
2. Moves to `backlog/doing/`
3. Runs Kodu to generate implementation
4. Moves to `backlog/review/`
5. Waits for approvals (if configured)
6. Generates documentation
7. Moves to `backlog/completed/`

### 3. Approve Changes

**Via CLI:**
```bash
npm run approval:approve -- task-42 code
npm run approval:approve -- task-42 docs
```

**Via MCP (VS Code):**
```
# In VS Code, use the MCP command palette
> Dev-Toolbox: Approve Code
> Dev-Toolbox: Approve Docs
```

### 4. Review Generated Docs

Check the generated files:
- `docs/worklogs/task-42-worklog.md` - Implementation log
- `docs/adr/ADR-001-*.md` - Architecture decisions
- `docs/CHANGELOG.md` - Updated changelog

## Spec File Format

### Basic Structure

```yaml
---
id: "spec-42"
title: "Your Feature Title"
description: "Brief overview"

spec:
  enabled: true
  type: "feature"  # feature|bugfix|refactor|docs|infra
  requirements:
    - "Requirement 1"
    - "Requirement 2"
  architecture:
    components: ["comp-a", "comp-b"]
    integrations: ["external-api"]
    decisions: "Why we chose this approach"

approval:
  code:
    required: true
    autoApprove: false
  docs:
    required: true
    generate:
      worklog: true
      adr: true
      changelog: true

acceptanceCriteria:
  - "Testable criterion 1"
  - "Testable criterion 2"
---

# Title

Body with implementation notes...
```

### Field Details

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `spec.enabled` | boolean | No | Enable spec mode (default: false) |
| `spec.type` | string | No | Task type for categorization |
| `spec.requirements` | array | No | Requirements list for implementation |
| `spec.architecture.components` | array | No | Components involved |
| `spec.architecture.decisions` | string | No | Key architectural decisions |
| `approval.code.required` | boolean | No | Block until approved |
| `approval.docs.required` | boolean | No | Block until docs approved |
| `approval.docs.generate.worklog` | boolean | No | Generate worklog.md |
| `approval.docs.generate.adr` | boolean | No | Generate ADR document |

### Backward Compatibility

Tasks without `spec` field work as before:

```yaml
---
id: "task-5"
title: "Simple Fix"
priority: "high"
---

# Task 5: Simple Fix

Fix the login button...
```

## Workflow

### State Diagram

```
[TODO] → [DOING] → [REVIEW] → [COMPLETED]
             ↓                      ↑
          [KODU]              [APPROVED]
             ↓                      ↑
         [SUCCESS]          [DOCS OK]
             ↓
          [REVIEW]
```

### State Details

| State | Location | Notes |
|-------|----------|-------|
| TODO | `backlog/todo/` | New task/spec file |
| DOING | `backlog/doing/` | Kodu is processing |
| REVIEW | `backlog/review/` | Awaiting approval |
| COMPLETED | `backlog/completed/` | Done, docs generated |
| FAILED | `backlog/failed/` | Error or rejected |

## Approval Process

### Code Approval

```bash
# List pending code approvals
npm run approval:list

# Approve code for a task
npm run approval:approve -- task-42 code --approver "john.doe"

# Reject with reason
npm run approval:reject -- task-42 "Missing unit tests"
```

### Docs Approval

After code approval, if docs generation is configured:

```bash
npm run approval:approve -- task-42 docs --approver "jane.smith"
```

### Approval States

- **Pending** - Awaiting human approval
- **Approved** - Approved, can proceed
- **Rejected** - Rejected, moved to failed folder
- **Timeout** - Approval timeout reached (configurable in config.json)

## Documentation Generation

### Worklog

Automatically generated after code approval:

- File: `docs/worklogs/task-{ID}-worklog.md`
- Contains: Implementation summary, files changed, decisions made
- Template: `templates/worklog.md`

### Architecture Decision Record (ADR)

Optional, generated if configured:

- File: `docs/adr/ADR-{NUMBER}-{title}.md`
- Contains: Problem, decision, consequences, alternatives
- Template: `templates/adr.md`

### Changelog

Entries automatically appended to `docs/CHANGELOG.md`:

```bash
# Manual entry
npm run changelog:add -- --type feat --id task-42 --title "Add OAuth support"
```

## Semantic Search

### Build Index

```bash
npm run build:index
```

### Search

```bash
# CLI
npm run search -- "authentication patterns"

# Node API
const { search } = require('./scripts/semantic-indexer');
const results = await search('query', { limit: 5 });
```

### Configuration

In `config.json`:

```json
{
  "search": {
    "enabled": true,
    "indexPath": ".index/",
    "includePatterns": ["**/*.js", "**/*.ts", "**/*.md"],
    "excludePatterns": ["node_modules/**"],
    "maxFileSize": 100000,
    "rebuildOnStart": false
  }
}
```

## MCP Integration

### Available Tools

| Tool | Description |
|------|-------------|
| `create_task` | Create new task |
| `create_spec` | Create new spec |
| `approve_code` | Approve code |
| `approve_docs` | Approve docs |
| `reject_task` | Reject and fail |
| `check_status` | Get task status |
| `list_pending` | List pending approvals |
| `query_search` | Semantic search |
| `generate_adr` | Create ADR manually |
| `append_changelog` | Add changelog entry |

### Starting MCP Server

```bash
npm run mcp

# or with auto-restart on changes
npm run mcp:dev
```

### VS Code Setup

Add to `.devcontainer/devcontainer.json`:

```json
{
  "customizations": {
    "vscode": {
      "settings": {
        "mcp.servers": {
          "ticket-processor": {
            "command": "node",
            "args": ["scripts/mcp-server.js"]
          }
        }
      }
    }
  }
}
```

## Troubleshooting

### Task Not Being Processed

1. Check watcher is running: `npm run watcher`
2. Verify file is in `backlog/todo/` folder
3. Check logs in console
4. Ensure OLLAMA_HOST is accessible

### Semantic Search Returns No Results

1. Rebuild index: `npm run build:index`
2. Check query terms match your codebase
3. Verify files are within size limits

### Approval Never Completes

1. Check approval status: `npm run approval:list`
2. Ensure approver permissions are set
3. Check approval timeout in config.json

### Docs Generation Fails

1. Check doc-generator logs
2. Verify templates exist in `templates/`
3. Check available disk space

---

For more details, see:
- [SPEC-REFERENCE.md](SPEC-REFERENCE.md) - Spec format reference
- [APPROVAL-WORKFLOW.md](APPROVAL-WORKFLOW.md) - Approval process details
- [MCP-TOOLS.md](MCP-TOOLS.md) - MCP tool reference
- [CONFIG.md](../CONFIG.md) - Configuration reference
