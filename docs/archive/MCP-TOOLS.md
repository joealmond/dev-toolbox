# MCP Tools Documentation

This document describes all 12 tools exposed by the Ticket Processor MCP Server for VS Code integration.

## Overview

The MCP (Model Context Protocol) Server runs as a separate process and exposes tools via stdio transport to VS Code. Tools can be used for task management, approval workflows, documentation generation, and semantic search.

**Server Details:**
- Port: 3002 (if HTTP mode)
- Transport: stdio (default)
- Language: JavaScript/Node.js
- Configuration: `.devcontainer/mcp.json`

---

## Tools Reference

### 1. create_task

Create a new standard task in the todo folder.

**Parameters:**
- `title` *(string, required)* - Task title
- `description` *(string, required)* - Task description
- `acceptanceCriteria` *(array of strings, optional)* - Acceptance criteria list
- `priority` *(string, optional)* - One of: `low`, `medium`, `high`, `critical` (default: `medium`)
- `assignee` *(string, optional)* - Assignee email or name

**Returns:**
```json
{
  "success": true,
  "taskId": "12345",
  "message": "Created task-12345",
  "filePath": "backlog/todo/task-12345.md"
}
```

**Example:**
```javascript
{
  "title": "Implement user authentication",
  "description": "Add OAuth2 authentication flow to the application",
  "acceptanceCriteria": [
    "User can login with GitHub",
    "User can logout",
    "Session persists across browser refresh"
  ],
  "priority": "high",
  "assignee": "john@example.com"
}
```

---

### 2. create_spec

Create a specification-driven task with requirements and architecture context.

**Parameters:**
- `title` *(string, required)* - Specification title
- `requirements` *(array of strings, required)* - List of functional requirements
- `architecture` *(object, optional)* - Architecture context:
  - `components` *(array of strings)* - System components
  - `integrations` *(array of strings)* - External integrations
  - `decisions` *(array of strings)* - Architecture decisions
- `acceptanceCriteria` *(array of strings, optional)* - Acceptance criteria

**Returns:**
```json
{
  "success": true,
  "taskId": "67890",
  "message": "Created spec-67890",
  "filePath": "backlog/todo/spec-67890.md"
}
```

**Example:**
```javascript
{
  "title": "Payment Processing System",
  "requirements": [
    "Support Stripe, PayPal, and direct bank transfers",
    "Process payments asynchronously with webhooks",
    "Implement PCI-DSS compliance",
    "Generate invoice PDFs automatically"
  ],
  "architecture": {
    "components": ["PaymentService", "WebhookHandler", "InvoiceGenerator"],
    "integrations": ["Stripe API", "PayPal API", "SendGrid"],
    "decisions": [
      "Use job queue for async processing",
      "Store encrypted payment tokens only",
      "Implement circuit breaker for API calls"
    ]
  }
}
```

---

### 3. process_task

Trigger processing of a task with the AI model.

**Parameters:**
- `taskId` *(string, required)* - Task ID (e.g., "1", "123")
- `model` *(string, optional)* - LLM model to use (overrides config default)

**Returns:**
```json
{
  "success": true,
  "message": "Task 123 moved to processing",
  "taskFile": "backlog/doing/task-123.md"
}
```

**Notes:**
- Task must exist in todo or review folder
- Moves task to `doing` folder
- Actual processing happens in watcher service
- Returns immediately; processing is asynchronous

---

### 4. approve_code

Approve the code implementation of a task.

**Parameters:**
- `taskId` *(string, required)* - Task ID
- `approver` *(string, required)* - Approver name or email
- `notes` *(string, optional)* - Approval notes/comments

**Returns:**
```json
{
  "success": true,
  "taskId": "123",
  "message": "Code approved",
  "approvedAt": "2024-01-15T10:30:00Z"
}
```

**Workflow:**
1. Code approval unblocks documentation generation
2. Documentation is generated if configured
3. Task moves to review (awaiting docs approval if required)

---

### 5. approve_docs

Approve generated documentation.

**Parameters:**
- `taskId` *(string, required)* - Task ID
- `approver` *(string, required)* - Approver name or email
- `notes` *(string, optional)* - Approval notes/comments

**Returns:**
```json
{
  "success": true,
  "taskId": "123",
  "message": "Docs approved",
  "approvedAt": "2024-01-15T10:35:00Z"
}
```

**Workflow:**
1. Docs approval is final step
2. Task moves to `completed` folder
3. Documentation files are committed to git

---

### 6. reject_task

Reject a task and move it to the failed folder.

**Parameters:**
- `taskId` *(string, required)* - Task ID
- `reason` *(string, required)* - Rejection reason

**Returns:**
```json
{
  "success": true,
  "taskId": "123",
  "message": "Task rejected",
  "movedTo": "backlog/failed/task-123.md"
}
```

**Use Cases:**
- Code quality issues
- Requirements misunderstanding
- Blocking dependencies
- Resource unavailability

---

### 7. check_status

Check the current status and approval state of a task.

**Parameters:**
- `taskId` *(string, required)* - Task ID

**Returns:**
```json
{
  "success": true,
  "taskId": "123",
  "status": "Review",
  "location": "backlog/review/spec-123.md",
  "approval": {
    "codePending": false,
    "codeApprovedAt": "2024-01-15T10:30:00Z",
    "codeApprovedBy": "alice@example.com",
    "docsPending": true,
    "docsGeneratedAt": "2024-01-15T10:32:00Z",
    "generatedFiles": [
      "docs/worklogs/task-123.md",
      "docs/adr/0001-payment-strategy.md"
    ]
  }
}
```

**Status Values:**
- `Todo` - Not started
- `Doing` - Currently processing
- `Review` - Awaiting approval(s)
- `Completed` - Finished and approved
- `Failed` - Rejected or stuck

---

### 8. list_pending

List all tasks pending approval.

**Parameters:**
- `type` *(string, optional)* - Filter: `code`, `docs`, or `all` (default: `all`)

**Returns:**
```json
{
  "success": true,
  "count": 3,
  "pending": [
    {
      "taskId": "123",
      "title": "Implement OAuth2",
      "codePending": false,
      "docsPending": true,
      "generatedAt": "2024-01-15T10:32:00Z"
    },
    {
      "taskId": "124",
      "title": "Add user profile",
      "codePending": true,
      "docsPending": false,
      "submittedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Use Cases:**
- Review queue management
- Sprint planning
- Bottleneck identification

---

### 9. query_search

Semantic search across codebase and documentation (Phase 6).

**Parameters:**
- `query` *(string, required)* - Search query
- `limit` *(number, optional)* - Max results to return (default: 10)

**Returns:**
```json
{
  "success": true,
  "query": "authentication flow",
  "results": [
    {
      "file": "backlog/completed/spec-123.md",
      "relevance": 0.95,
      "excerpt": "...OAuth2 authentication flow..."
    }
  ],
  "note": "Semantic search indexing enabled in Phase 6"
}
```

**Note:** Currently returns placeholder. Full implementation in Phase 6.

---

### 10. generate_adr

Generate an Architecture Decision Record.

**Parameters:**
- `taskId` *(string, optional)* - Associated task ID
- `title` *(string, required)* - ADR title
- `context` *(string, required)* - Decision context/background
- `decision` *(string, required)* - Decision made

**Returns:**
```json
{
  "success": true,
  "adrNumber": 42,
  "message": "Generated docs/adr/0042-cache-strategy.md"
}
```

**ADR File Format:**
```markdown
# ADR-0042: Cache Strategy

## Context
[context parameter]

## Decision
[decision parameter]

## Consequences
[auto-generated from related task files]
```

---

### 11. append_changelog

Add entry to CHANGELOG.md.

**Parameters:**
- `type` *(string, required)* - Change type: `added`, `changed`, `fixed`, `removed`, `security`
- `taskId` *(string, optional)* - Associated task ID
- `title` *(string, required)* - Change title
- `description` *(string, optional)* - Change description

**Returns:**
```json
{
  "success": true,
  "message": "Added 'fixed' entry to CHANGELOG.md"
}
```

**Changelog Entry:**
```markdown
### Fixed
- task-123: Fix authentication timeout issue
```

---

### 12. check_staleness

Check for stale or stuck tasks.

**Parameters:**
- `hoursThreshold` *(number, optional)* - Hours threshold for staleness (default: 24)

**Returns:**
```json
{
  "success": true,
  "threshold": 24,
  "staleCount": 2,
  "staleTasks": [
    {
      "file": "task-120.md",
      "ageHours": 36
    },
    {
      "file": "spec-119.md",
      "ageHours": 48
    }
  ]
}
```

**Use Cases:**
- CI/CD pipeline monitoring
- Team alerts
- Automated cleanup
- Sprint velocity tracking

---

## Error Handling

All tools return an error response on failure:

```json
{
  "success": false,
  "error": "Task 999 not found"
}
```

Common errors:
- Task not found
- Invalid parameters
- File system errors
- Permission denied

---

## Integration Examples

### VS Code Command Palette

```python
# Create a quick task
%MCP create_task "Fix login bug" "Users report login failures on mobile"

# Check approval queue
%MCP list_pending code

# Approve and complete
%MCP approve_code 123 "alice@example.com" "Looks good!"
%MCP approve_docs 123 "alice@example.com"
```

### GitHub Copilot

```
@mcp Create a spec for a payment system with these requirements:
- Support multiple payment methods
- Async processing
- PCI compliance
```

### Custom Scripts

```javascript
const mcp = require('./mcp-server');

const result = await mcp.handlers.create_spec({
  title: "New Feature",
  requirements: ["req1", "req2"]
});
```

---

## Configuration

Configure which tools are exposed in `config.json`:

```json
{
  "mcp": {
    "enabled": true,
    "port": 3002,
    "tools": [
      "create_task",
      "create_spec",
      "process_task",
      "approve_code",
      "approve_docs"
    ]
  }
}
```

---

## Performance Notes

- **create_task/create_spec**: < 100ms
- **process_task**: < 50ms (queues work)
- **approve_***: < 100ms
- **list_pending**: < 500ms (scans folders)
- **check_status**: < 200ms
- **generate_adr**: < 1s (may write file)
- **query_search**: Phase 6 optimization pending

---

## See Also

- [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) - Setup and configuration
- [APPROVAL-WORKFLOW.md](./APPROVAL-WORKFLOW.md) - Approval process details
- [SPEC-REFERENCE.md](./SPEC-REFERENCE.md) - Spec file format
