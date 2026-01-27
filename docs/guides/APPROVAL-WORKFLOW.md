# Approval Workflow Guide

Detailed guide for the approval process in spec-driven task processing.

## Table of Contents

- [Overview](#overview)
- [Approval Flow](#approval-flow)
- [Code Approval](#code-approval)
- [Docs Approval](#docs-approval)
- [Rejection Process](#rejection-process)
- [CLI Commands](#cli-commands)
- [Approval Status](#approval-status)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The approval workflow ensures code quality and documentation accuracy before tasks are completed.

### Two-Gate System

```
Code Approval ──→ Docs Generation ──→ Docs Approval ──→ Completion
```

### Configurable Per-Task

Each task specifies its own approval requirements:

```yaml
approval:
  code:
    required: true      # Block until code approved
    autoApprove: false  # Or auto-approve after tests
  docs:
    required: true      # Block until docs approved
    autoApprove: false  # Or auto-approve after review
```

### Default Behavior (config.json)

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

## Approval Flow

### State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                    APPROVAL STATE MACHINE                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Task created → Code review pending → Code approved           │
│                       ↓                    ↓                  │
│                  Code rejected         Docs generated         │
│                       ↓                    ↓                  │
│                   [FAILED]          Docs review pending       │
│                                           ↓                  │
│                                      Docs approved            │
│                                           ↓                  │
│                                       [COMPLETED]            │
│                                           ↓                  │
│                                    Approval timeout          │
│                                    (configurable)            │
│                                           ↓                  │
│                                    [AUTO-REJECTED]           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Code Approval

### Process

1. **Task Processed**
   ```
   Task executes with Kodu
   Output generated
   ```

2. **Moved to Review**
   ```
   File: backlog/review/task-42.md
   Status: Awaiting code approval
   ```

3. **Approve/Reject**
   ```bash
   # Approve
   npm run approval:approve -- task-42 code --approver john.doe
   
   # Reject
   npm run approval:reject -- task-42 "Missing tests"
   ```

4. **If Approved**
   - Documentation generation starts (if configured)
   - Moves to docs approval phase

5. **If Rejected**
   - Moved to `backlog/failed/`
   - Reason logged in error file
   - Developer reviews and recreates task

### Code Review Checklist

**Essential:**
- [ ] Code implements all requirements
- [ ] All acceptance criteria met
- [ ] No breaking changes
- [ ] Error handling present
- [ ] Input validation included

**Quality:**
- [ ] Code follows project style
- [ ] Functions are documented
- [ ] No obvious bugs
- [ ] Performance acceptable
- [ ] Security reviewed

**Testing:**
- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] Manual testing done
- [ ] No regressions detected

## Docs Approval

### Process

1. **After Code Approval**
   ```
   Auto-generation triggered:
   - WORK_LOG.md created
   - ADR created (if configured)
   - CHANGELOG.md updated
   ```

2. **Docs Review**
   ```bash
   # Review generated files
   cat docs/worklogs/task-42-worklog.md
   cat docs/adr/ADR-001-*.md
   
   # Then approve
   npm run approval:approve -- task-42 docs --approver jane.smith
   ```

3. **If Approved**
   - Task moved to `backlog/completed/`
   - All docs finalized
   - Git PR created (if enabled)

4. **If Rejected**
   - Docs moved back to edit
   - Can be regenerated or manually fixed
   - Requires re-approval

### Docs Review Checklist

**Worklog:**
- [ ] Accurately summarizes implementation
- [ ] Key changes documented
- [ ] Decisions explained
- [ ] Testing notes included
- [ ] No typos or formatting errors

**ADR:**
- [ ] Problem statement clear
- [ ] Decision well-explained
- [ ] Consequences documented
- [ ] Alternatives considered
- [ ] Appropriate level of detail

**Changelog:**
- [ ] Entry matches commit type
- [ ] Description is user-facing
- [ ] Task ID linked
- [ ] Version/date correct

## Rejection Process

### Code Rejection

```bash
npm run approval:reject -- task-42 "Missing unit tests for auth module"
```

**Results:**
1. Task moved to `backlog/failed/`
2. Error log created: `backlog/failed/task-42.error.log`
3. Reason documented
4. Developer notified (if webhook configured)

**Developer Steps:**
1. Review rejection reason
2. Make necessary changes
3. Create new task (cannot re-process same file)
4. New task starts from beginning

### Docs Rejection

```bash
npm run approval:reject -- task-42 "Worklog missing performance metrics"
```

**Options:**
1. **Manual Fix**
   ```bash
   # Edit generated docs
   vim docs/worklogs/task-42-worklog.md
   
   # Re-submit for approval
   npm run approval:approve -- task-42 docs --approver jane.smith
   ```

2. **Regenerate**
   ```bash
   # If generation failed, regenerate
   npm run docs:generate task-42
   
   # Then re-approve
   npm run approval:approve -- task-42 docs --approver jane.smith
   ```

## CLI Commands

### List Pending Approvals

```bash
# All pending
npm run approval:list

# Code approvals only
npm run approval:list -- --type code

# Docs approvals only
npm run approval:list -- --type docs
```

**Output:**
```
📋 Pending Approvals

Code Review (3):
  • task-42: Add OAuth authentication
    Submitted: 2026-01-20 09:00 UTC
    
  • spec-5: Implement caching layer
    Submitted: 2026-01-20 10:30 UTC
    
  • task-43: Fix mobile login
    Submitted: 2026-01-20 11:15 UTC

Docs Review (1):
  • task-42: Add OAuth authentication
    Submitted: 2026-01-20 14:00 UTC
```

### Approve Code

```bash
npm run approval:approve -- task-42 code \
  --approver "john.doe" \
  --comments "Implementation looks solid, all tests pass"
```

**Response:**
```
✓ Code approved for task-42
  Approver: john.doe
  Approved at: 2026-01-20 14:30 UTC
  
→ Generating documentation...
→ Documentation ready for review
```

### Approve Docs

```bash
npm run approval:approve -- task-42 docs \
  --approver "jane.smith"
```

**Response:**
```
✓ Documentation approved for task-42
  Approver: jane.smith
  Approved at: 2026-01-20 15:00 UTC
  
→ Moving task to completed
→ Finalizing... task-42 is complete!
```

### Check Status

```bash
npm run approval:status -- task-42
```

**Output:**
```
📊 Task Status: task-42

Title: Add OAuth authentication
State: In Review

Approvals:
  Code:
    Required: ✓ Yes
    Status: ✓ Approved (by john.doe)
    Approved: 2026-01-20 14:30 UTC
    
  Docs:
    Required: ✓ Yes
    Status: ⏳ Pending
    Generated: ✓ Yes
    Worklog: docs/worklogs/task-42-worklog.md
    ADR: docs/adr/ADR-001-oauth-strategy.md
    Changelog: Updated

Timeline:
  Created: 2026-01-20 09:00 UTC
  Processed: 2026-01-20 13:45 UTC
  Code Approved: 2026-01-20 14:30 UTC
  Docs Ready: 2026-01-20 14:45 UTC
```

## Approval Status

### Statuses

| Status | Meaning | Action |
|--------|---------|--------|
| **Pending** | Awaiting reviewer | Notify approvers |
| **Approved** | Approved, proceed | Move to next phase |
| **Rejected** | Not approved | Review reason, revise |
| **Timeout** | Approval deadline passed | Auto-reject (configurable) |
| **N/A** | Not required | Skip this phase |

### Status File Format

Task file front matter tracks approvals:

```yaml
approval:
  code:
    required: true
    status: "approved"
    approvedBy: "john.doe"
    approvedAt: "2026-01-20T14:30:00Z"
    comments: "Looks good"
    
  docs:
    required: true
    status: "pending"
    pendingSince: "2026-01-20T14:45:00Z"
```

## Configuration

### config.json Settings

```json
{
  "approval": {
    "defaultCodeApproval": true,      // Require code approval by default
    "defaultDocsApproval": true,      // Require docs approval by default
    "notifyOnPending": true,          // Notify when approval pending
    "timeoutHours": 72,               // Hours until auto-rejection
    "autoRejectOnTimeout": false      // Auto-reject after timeout
  }
}
```

### Per-Task Override

```yaml
approval:
  code:
    required: false         # Override default (don't require)
    autoApprove: true       # Auto-approve after tests pass
    
  docs:
    required: true          # Override default (do require)
    autoApprove: false
```

### Notification Configuration

```bash
# Enable webhooks for approval notifications
# In config.json:
{
  "webhook": {
    "enabled": true,
    "port": 3001,
    "notifyOnApproval": true,
    "notifyEmail": "team@example.com"
  }
}
```

## Troubleshooting

### "Task not found"

```bash
# Verify task exists
ls backlog/*/task-42.md

# Check task status
npm run approval:status -- task-42
```

### "Already approved"

```bash
# Can't approve twice
# Check current status
npm run approval:status -- task-42

# If already approved, move to next phase
# (automatically handled by watcher)
```

### "Approval timeout reached"

```bash
# Default: 72 hours
# Change in config.json:
{
  "approval": {
    "timeoutHours": 120,              // Increase to 5 days
    "autoRejectOnTimeout": true       // Auto-reject when timeout
  }
}

# Manually extend deadline
# Edit task file, update approvedAt timestamp
```

### "Docs generation failed"

```bash
# Check logs
tail -f logs/doc-generator.log

# Regenerate manually
npm run docs:generate task-42

# Then approve
npm run approval:approve -- task-42 docs --approver jane.smith
```

### "Wrong approver notified"

```bash
# Configure team members
# In config.json:
{
  "approval": {
    "teams": {
      "backend": ["john.doe", "alice.smith"],
      "frontend": ["bob.jones", "jane.doe"],
      "docs": ["editor@example.com"]
    }
  }
}
```

---

For MCP tool reference, see [MCP-TOOLS.md](MCP-TOOLS.md).  
For spec format, see [SPEC-REFERENCE.md](SPEC-REFERENCE.md).
