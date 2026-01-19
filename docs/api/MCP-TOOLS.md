# MCP Tools Reference

Complete reference for all MCP tools available in VS Code integration.

## Table of Contents

- [Overview](#overview)
- [Tool Reference](#tool-reference)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)

## Overview

The MCP server exposes **10 tools** for task management, approvals, search, and documentation.

### Starting the MCP Server

```bash
npm run mcp          # Start MCP server
npm run mcp:dev      # Start with auto-reload
```

The server listens on **stdio** and is accessible from VS Code when configured in devcontainer.

## Tool Reference

### create_task

**Description:** Create a new regular task file

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| title | string | ✓ | "Fix login bug" |
| description | string | ✓ | "Login button not responding on mobile" |
| priority | string | | "high" |
| estimatedHours | number | | 4 |
| labels | array | | ["frontend", "urgent"] |

**Response:**
```json
{
  "success": true,
  "taskId": "task-42",
  "filePath": "/path/to/backlog/todo/task-42.md"
}
```

**Example:**
```
> Create task
  Title: Fix login bug
  Description: Login button doesn't respond on mobile
  Priority: high
  ✓ Created task-42
```

---

### create_spec

**Description:** Create a new spec-driven task with full metadata

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| title | string | ✓ | "Add OAuth authentication" |
| requirements | array | ✓ | ["Support Google", "Support GitHub"] |
| type | string | | "feature" |
| components | array | | ["auth-service"] |
| description | string | | "Implement OAuth 2.0..." |
| codeApprovalRequired | boolean | | true |
| docsApprovalRequired | boolean | | true |
| generateWorklog | boolean | | true |
| generateAdr | boolean | | false |

**Response:**
```json
{
  "success": true,
  "specId": "spec-42",
  "filePath": "/path/to/backlog/todo/spec-42.md"
}
```

**Example:**
```
> Create spec
  Title: Add OAuth authentication
  Requirements: Support Google OAuth, Support GitHub OAuth
  Type: feature
  Components: auth-service, user-db
  ✓ Created spec-42
```

---

### approve_code

**Description:** Approve code implementation for a task

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| taskId | string | ✓ | "task-42" |
| approver | string | ✓ | "john.doe" |
| comments | string | | "Looks good, well tested" |

**Response:**
```json
{
  "success": true,
  "result": {
    "taskId": "task-42",
    "approved": true,
    "approver": "john.doe",
    "approvedAt": "2026-01-20T10:30:00Z"
  }
}
```

**Example:**
```
> Approve code
  Task: task-42
  Approver: john.doe
  Comments: Implementation matches spec
  ✓ Code approved for task-42
  → Proceeding to docs generation
```

---

### approve_docs

**Description:** Approve generated documentation for a task

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| taskId | string | ✓ | "task-42" |
| approver | string | ✓ | "jane.smith" |
| comments | string | | "Documentation is clear and complete" |

**Response:**
```json
{
  "success": true,
  "result": {
    "taskId": "task-42",
    "docsApproved": true,
    "approver": "jane.smith",
    "approvedAt": "2026-01-20T11:00:00Z"
  }
}
```

**Example:**
```
> Approve docs
  Task: task-42
  Approver: jane.smith
  ✓ Documentation approved
  → Moving task to completed
```

---

### reject_task

**Description:** Reject a task and move it to failed folder

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| taskId | string | ✓ | "task-42" |
| reason | string | ✓ | "Missing unit tests" |

**Response:**
```json
{
  "success": true,
  "result": {
    "taskId": "task-42",
    "rejected": true,
    "reason": "Missing unit tests",
    "movedTo": "backlog/failed/task-42.md"
  }
}
```

**Example:**
```
> Reject task
  Task: task-42
  Reason: Missing unit tests, code quality issues
  ✓ Task rejected
  → Moved to backlog/failed/task-42.md
```

---

### check_status

**Description:** Check current status of a task or spec

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| taskId | string | ✓ | "task-42" |

**Response:**
```json
{
  "success": true,
  "status": {
    "id": "task-42",
    "title": "Add OAuth authentication",
    "currentState": "review",
    "approvalStatus": {
      "code": { "required": true, "status": "approved" },
      "docs": { "required": true, "status": "pending" }
    },
    "generatedDocs": {
      "worklog": "docs/worklogs/task-42-worklog.md",
      "adr": null,
      "changelog": "Updated"
    }
  }
}
```

**Example:**
```
> Check status
  Task: task-42
  
  Status: In Review
  ├─ Code approval: ✓ Approved (by john.doe)
  ├─ Docs approval: ⏳ Pending
  └─ Generated docs:
     ├─ Worklog: ✓ docs/worklogs/task-42-worklog.md
     └─ Changelog: ✓ Updated
```

---

### list_pending

**Description:** List all tasks awaiting approval

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| approvalType | string | | "code" or "docs" or "all" |

**Response:**
```json
{
  "success": true,
  "pending": [
    {
      "taskId": "task-42",
      "title": "Add OAuth authentication",
      "approvalType": "code",
      "submittedAt": "2026-01-20T09:00:00Z",
      "submittedBy": "system"
    },
    {
      "taskId": "task-43",
      "title": "Fix login button",
      "approvalType": "docs",
      "submittedAt": "2026-01-20T10:30:00Z",
      "submittedBy": "system"
    }
  ]
}
```

**Example:**
```
> List pending approvals

📋 Pending Approvals (2 total)

Code Approvals (1):
  ├─ task-42: Add OAuth authentication
  │  └─ Submitted: 2026-01-20 09:00 UTC

Docs Approvals (1):
  └─ task-43: Fix login button
     └─ Submitted: 2026-01-20 10:30 UTC
```

---

### query_search

**Description:** Semantic search across codebase

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| query | string | ✓ | "authentication patterns" |
| limit | number | | 5 |

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "path": "src/auth/oauth.js",
      "score": 0.92,
      "snippet": "OAuth 2.0 implementation using passport.js..."
    },
    {
      "path": "docs/adr/001-auth-strategy.md",
      "score": 0.87,
      "snippet": "Decision: Use OAuth 2.0 for external integrations..."
    }
  ]
}
```

**Example:**
```
> Search codebase
  Query: "authentication patterns"
  Limit: 5
  
🔍 Results (2 found)

1. src/auth/oauth.js (score: 0.92)
   OAuth 2.0 implementation using passport.js...

2. docs/adr/001-auth-strategy.md (score: 0.87)
   Decision: Use OAuth 2.0 for external integrations...
```

---

### generate_adr

**Description:** Manually generate an Architecture Decision Record

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| title | string | ✓ | "Use JWT for authentication" |
| context | string | ✓ | "Need stateless authentication" |
| decision | string | ✓ | "Implement JWT tokens" |
| consequences | string | ✓ | "Tokens must be validated on each request" |
| taskId | string | | "task-42" |

**Response:**
```json
{
  "success": true,
  "result": {
    "adrId": "ADR-001",
    "filePath": "docs/adr/ADR-001-use-jwt-for-authentication.md",
    "createdAt": "2026-01-20T11:00:00Z"
  }
}
```

**Example:**
```
> Generate ADR
  Title: Use JWT for authentication
  Context: Need stateless authentication
  Decision: Implement JWT tokens
  ✓ ADR created
  → File: docs/adr/ADR-001-use-jwt-for-authentication.md
```

---

### append_changelog

**Description:** Add entry to CHANGELOG.md

**Parameters:**
| Name | Type | Required | Example |
|------|------|----------|---------|
| type | string | ✓ | "feat" |
| description | string | ✓ | "Add OAuth authentication" |
| taskId | string | | "task-42" |

**Allowed types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `security`

**Response:**
```json
{
  "success": true,
  "result": {
    "appended": true,
    "changelogPath": "docs/CHANGELOG.md",
    "entry": "[feat] Add OAuth authentication (task-42)",
    "appendedAt": "2026-01-20T11:05:00Z"
  }
}
```

**Example:**
```
> Append changelog
  Type: feat
  Description: Add OAuth authentication
  Task: task-42
  ✓ Changelog updated
  → Entry: [feat] Add OAuth authentication (task-42)
```

---

## Usage Examples

### Workflow 1: Create and Process Spec

```bash
# 1. Create spec via MCP
create_spec {
  title: "Add User Profile Feature"
  requirements: [
    "Users can view their profile",
    "Users can edit profile information",
    "Profile changes are saved immediately"
  ]
  type: "feature"
  components: ["user-service", "database"]
}

# Watcher automatically processes...

# 2. Check status
check_status { taskId: "spec-1" }

# 3. Approve code
approve_code {
  taskId: "spec-1"
  approver: "john.doe"
  comments: "Implementation looks solid"
}

# 4. Approve docs
approve_docs {
  taskId: "spec-1"
  approver: "jane.smith"
}

# Task complete! Docs generated in docs/worklogs/
```

### Workflow 2: Search and Create Related Task

```bash
# 1. Search for similar implementations
query_search {
  query: "user profile management"
  limit: 3
}

# 2. Review results, then create task
create_task {
  title: "Extend profile with avatar upload"
  description: "Add avatar image upload to user profile"
  priority: "medium"
  estimatedHours: 4
  labels: ["feature", "frontend"]
}

# 3. Monitor pending approvals
list_pending { approvalType: "all" }
```

### Workflow 3: Rejection and Retry

```bash
# 1. Review and reject
reject_task {
  taskId: "task-42"
  reason: "Needs unit tests, missing error handling"
}

# 2. Task moved to backlog/failed/
# Developer fixes and recreates as new task

create_task {
  title: "Add OAuth authentication (revised)"
  description: "..." 
  priority: "high"
}
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Task not found` | Invalid taskId | Check task ID format (task-N or spec-N) |
| `Invalid approval type` | Wrong approval type | Use: "code" or "docs" |
| `Search index not ready` | Index not built | Run `npm run build:index` |
| `MCP server not running` | Server not started | Run `npm run mcp` |
| `Approval already exists` | Task already approved | Check status first |

### Response Format

**Success:**
```json
{
  "success": true,
  "result": { /* tool-specific data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

See [APPROVAL-WORKFLOW.md](APPROVAL-WORKFLOW.md) for detailed approval process documentation.
