# Approval Workflow Documentation

This document describes the configurable approval workflow for code and documentation in the spec-driven ticket processor system.

## Overview

The approval workflow ensures quality gates for critical tasks. Each task can require approval at two stages:

1. **Code Approval** - Review of AI-generated implementation
2. **Docs Approval** - Review of auto-generated documentation

Both approvals are **optional and configurable per task**, allowing flexibility from simple auto-completion to complex multi-stage reviews.

---

## Workflow Diagram

```
┌─────────┐
│   Todo  │
└────┬────┘
     │
     ├─ Move to Doing folder
     ├─ Run kodu (AI processing)
     │
     ├─ Success? ─ Yes ─┐
     │                  │
     └─ No ───── Move to Failed ─────┘
                        │
                        v
                  ┌──────────────┐
                  │    Review    │
                  │  (awaiting   │
                  │ approvals)   │
                  └──────┬───────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Code Approval   Docs Approval   Auto-Complete
    Required?       Generated?      (no approvals)
         │               │               │
         │               │               │
         v               v               v
    ┌────────┐      ┌─────────┐   ┌────────────┐
    │ Needs  │      │ Docs    │   │ Move to    │
    │Review  │      │Review   │   │ Completed  │
    │        │      │         │   │            │
    │(code)  │      │(if req) │   └────────────┘
    └─┬──────┘      └────┬────┘
      │                  │
      │ Approve   Docs   │ Approve
      │ Code ────────────┤
      │            │     │
      └────────────┼─────┘
                   │
          Generate Docs
          (if enabled)
                   │
                   v
            ┌──────────────┐
            │ Docs Review  │
            │ (if required)│
            └──────┬───────┘
                   │
            Approve Docs
                   │
                   v
            ┌────────────────┐
            │   Completed    │
            │  (move to      │
            │   completed)   │
            └────────────────┘
```

---

## Approval States

### Code Approval

Approves the AI-generated implementation code and pull request.

**Fields:**
- `approval.code.required` - Set to `true` to require code approval
- `approval.code.approved` - `true` when approved
- `approval.code.approvedBy` - Email of approver
- `approval.code.approvedAt` - Timestamp of approval
- `approval.code.notes` - Approval feedback/notes

**Triggers Documentation Generation**

When code is approved:
1. Documentation generation starts (if `docs.generate: true`)
2. Work logs, ADRs, changelog entries created
3. Files generated to `docs/` folder
4. Task front matter updated with paths

**Example:**
```yaml
approval:
  code:
    required: true
    approved: true
    approvedBy: alice@example.com
    approvedAt: 2024-01-15T10:30:00Z
    notes: "Code looks good, all tests pass. Ship it!"
```

### Docs Approval

Approves the automatically generated documentation.

**Fields:**
- `approval.docs.required` - Set to `true` to require docs approval
- `approval.docs.approved` - `true` when approved
- `approval.docs.generate` - Auto-generate docs after code approval
- `approval.docs.approvedBy` - Email of approver
- `approval.docs.approvedAt` - Timestamp of approval
- `approval.docs.notes` - Approval feedback/notes

**Triggers Task Completion**

When docs are approved:
1. Task moves to `backlog/completed/`
2. Git commit includes all generated files
3. PR is merged (if configured)
4. Archived in `docs/specs/` for reference

**Example:**
```yaml
approval:
  docs:
    required: true
    generate: true
    approved: true
    approvedBy: bob@example.com
    approvedAt: 2024-01-15T10:45:00Z
    notes: "ADR is clear, worklog documents process well."
```

---

## Workflow Scenarios

### Scenario 1: Quick Task (No Approvals)

**Configuration:**
```yaml
approval:
  code:
    required: false
  docs:
    required: false
    generate: false
```

**Workflow:**
```
Todo → Doing → kodu processes → Review → Auto-complete
       (< 1 min)                 (instant)
```

**Use Case:** Bug fixes, documentation updates, small features

---

### Scenario 2: Standard Feature (Code Review Only)

**Configuration:**
```yaml
approval:
  code:
    required: true
  docs:
    required: false
    generate: true
```

**Workflow:**
```
Todo → Doing → kodu → Review (awaiting code approval)
       ↓
       Code approved → Docs generated → Auto-complete
                          (instant)
```

**Timeline:** 30 min - 2 hours (depends on review queue)

**Use Case:** Standard features with code review requirement

---

### Scenario 3: Complex Feature (Full Workflow)

**Configuration:**
```yaml
approval:
  code:
    required: true
  docs:
    required: true
    generate: true
```

**Workflow:**
```
Todo → Doing → kodu → Review (awaiting code approval)
              (30 min)       (Code Reviewer)
       ↓
       Code approved → Docs generated → Review (awaiting docs approval)
                                        (Tech Lead)
       ↓
       Docs approved → Completed
```

**Timeline:** 1-4 hours (depends on review queues)

**Use Case:** Major features, system design changes, critical functionality

---

## Approval Commands

### Check Approval Status

View current approval state of a task:

```bash
npm run approval:list 123
```

Returns:
```json
{
  "taskId": "123",
  "status": "Review",
  "codePending": false,
  "codeApprovedAt": "2024-01-15T10:30:00Z",
  "codeApprovedBy": "alice@example.com",
  "docsPending": true,
  "docsGeneratedAt": "2024-01-15T10:32:00Z",
  "generatedFiles": [
    "docs/worklogs/task-123.md",
    "docs/adr/0042-auth-strategy.md"
  ]
}
```

### Approve Code

Approve the implementation:

```bash
npm run approval:approve code 123 "alice@example.com" "Looks good!"
```

Effects:
- Sets `approval.code.approved = true`
- Records approver and timestamp
- Triggers doc generation (if enabled)
- Logs approval in task file

### Approve Docs

Approve the documentation:

```bash
npm run approval:approve docs 123 "bob@example.com" "Clear and complete"
```

Effects:
- Sets `approval.docs.approved = true`
- Completes final approval gate
- Task moves to `backlog/completed/`
- Git commit created with all files

### List Pending Approvals

Show all tasks awaiting approval:

```bash
npm run approval:list
```

Returns:
```
Pending Approvals:
┌─────────┬─────────────────────────┬────────────┬────────────┐
│ Task ID │ Title                   │ Code Appr. │ Docs Appr. │
├─────────┼─────────────────────────┼────────────┼────────────┤
│ 123     │ OAuth2 Implementation   │ ❌ Needed  │ ⏳ Pending │
│ 124     │ User Profile System     │ ❌ Needed  │ ❌ Needed  │
│ 125     │ Payment Integration     │ ✅ Approved│ ❌ Needed  │
└─────────┴─────────────────────────┴────────────┴────────────┘
```

### Reject Task

Reject a task to failure folder:

```bash
npm run approval:reject 123 "Implementation doesn't match requirements"
```

Effects:
- Task moves to `backlog/failed/`
- Rejection reason recorded in front matter
- Can be fixed and re-submitted later

---

## Approval Workflow via MCP

### Create and Process Task

```python
# Create spec with full approval workflow
%MCP create_spec
  title: "OAuth2 Implementation"
  requirements: ["Support GitHub", "Support Google", ...]
  
# Process the task
%MCP process_task 123

# Check status
%MCP check_status 123
```

### Review and Approve

```python
# List pending approvals
%MCP list_pending code

# Approve code
%MCP approve_code 123 "alice@example.com" "All tests pass!"

# Check updated status
%MCP check_status 123
# Should show docs pending

# Approve docs
%MCP approve_docs 123 "alice@example.com"

# Final status
%MCP check_status 123
# Should show "Completed"
```

---

## Approval Workflow via Interactive CLI

```bash
npm run approval:interactive
```

Interactive prompts guide through:
1. Select task from review folder
2. Choose approval type (code/docs)
3. Enter approver name
4. Add optional notes
5. Confirm action

---

## Approval State Machine

```javascript
// Pseudo-code for state transitions

function getNextState(approval, action) {
  // Code approval path
  if (action === 'approve_code') {
    approval.code.approved = true;
    if (approval.docs.generate) {
      generateDocumentation();
    }
    return approval.docs.required ? 'docs_review' : 'completed';
  }
  
  // Docs approval path
  if (action === 'approve_docs') {
    approval.docs.approved = true;
    return 'completed';
  }
  
  // Rejection path
  if (action === 'reject') {
    return 'failed';
  }
  
  // Auto-complete path (no approvals required)
  if (!approval.code.required && !approval.docs.required) {
    return 'completed';
  }
  
  return 'review'; // Waiting for approvals
}
```

---

## Configuration

### Global Defaults

Set approval defaults in `config.json`:

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

- `defaultCodeApproval` - Apply to new tasks
- `defaultDocsApproval` - Apply to new tasks
- `notifyOnPending` - Send alerts for pending approvals
- `timeoutHours` - Hours before approval times out
- `autoRejectOnTimeout` - Auto-reject stuck tasks (not recommended)

### Per-Task Configuration

Override in spec front matter:

```yaml
approval:
  code:
    required: true  # Override default
  docs:
    required: false  # Override default
    generate: true   # Auto-generate docs
```

---

## Best Practices

### 1. Clear Approval Scope

**Good:**
```yaml
approval:
  code:
    required: true    # Must review code
  docs:
    required: false   # Docs auto-complete
```

**Bad:**
```yaml
approval:
  code:
    required: true
  docs:
    required: true    # Over-gatekeeping, slows delivery
```

### 2. Timely Approval Feedback

Include specific feedback when approving:

```bash
npm run approval:approve code 123 "alice@example.com" \
  "Great! Consider adding rate limiting per GitHub's recommendations"
```

### 3. Route to Right Reviewers

**Code Review:**
- Senior engineer
- Security engineer (for auth/payment features)
- Database expert (for schema changes)

**Docs Review:**
- Tech lead
- Customer success (for docs that affect users)
- Compliance officer (for regulatory decisions)

### 4. Monitor Approval Queues

Regular check:
```bash
# Check pending
npm run approval:list

# Alert on old tasks
npm run approval:check-staleness --hours 24
```

### 5. Document Rejection Reasons

Clear rejection helps re-submission:

```bash
npm run approval:reject 123 \
  "Does not handle token expiration. See spec requirement #3."
```

Rejected task can be moved back to `doing` folder for fixes:
```bash
mv backlog/failed/spec-123.md backlog/doing/spec-123.md
```

---

## Troubleshooting

### Approval Not Updating

Check file format is valid YAML:
```bash
npm run spec:validate backlog/review/task-123.md
```

Manually edit if needed:
```bash
# Front matter format must have proper indentation
approval:
  code:
    required: true    # 4 spaces
    approved: false   # 4 spaces
```

### Documentation Not Generating

Verify generation is enabled:
```yaml
approval:
  docs:
    generate: true  # Must be true
```

Check logs for generation errors:
```bash
tail -f logs/watcher.log | grep -i doc
```

### Stuck in Review State

If a task is stuck awaiting approval:
1. Check file is in `backlog/review/`
2. Verify approval requirements:
   ```bash
   npm run spec:validate backlog/review/task-123.md
   ```
3. Force state change (manual editing):
   ```yaml
   approval:
     code:
       approved: true   # Manually set
       approvedBy: "system"
       approvedAt: "2024-01-15T11:00:00Z"
   ```
4. Manually move to completed:
   ```bash
   mv backlog/review/task-123.md backlog/completed/task-123.md
   ```

---

## Metrics and Reporting

### Task Completion Metrics

```bash
# Count completed tasks this week
ls -la backlog/completed/ | grep "task-" | wc -l

# Average approval time
# (approvedAt - createdAt) for completed tasks
```

### Approval Queue Health

Monitor:
- Number of tasks in review
- Average age of pending approvals
- Approval rejection rate
- Time from code → docs approval

### Sample Report

```
=== Approval Queue Report ===
Date: 2024-01-15

Pending Code Approvals:  3 tasks (avg age: 2.5 hours)
Pending Docs Approvals:  5 tasks (avg age: 1.8 hours)
Completed This Week:     12 tasks
Rejection Rate:          8.3% (1 of 12)
Avg Approval Time:       4.2 hours

Top Blockers:
- Payment Integration (5+ hours) - awaiting security review
- User Profile (4+ hours) - awaiting tech lead review
```

---

## See Also

- [SPEC-REFERENCE.md](./SPEC-REFERENCE.md) - Spec configuration
- [MCP-TOOLS.md](./MCP-TOOLS.md) - Approval tool reference
- [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) - Setup
