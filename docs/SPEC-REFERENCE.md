# Spec File Format Reference

Complete reference for the spec-driven task format.

## Table of Contents

- [File Naming](#file-naming)
- [Front Matter Schema](#front-matter-schema)
- [Field Descriptions](#field-descriptions)
- [Examples](#examples)
- [Validation](#validation)

## File Naming

Spec-driven tasks use the `spec-` prefix:

```
backlog/todo/spec-1.md    # First spec
backlog/todo/spec-42.md   # Spec for task 42
backlog/todo/spec-100.md  # Spec with large number
```

Regular tasks use the `task-` prefix (unchanged):

```
backlog/todo/task-5.md    # Regular task
```

## Front Matter Schema

Complete YAML schema for spec files:

```yaml
---
# === Core Fields ===
id: string                          # task-{ID} or spec-{ID}
title: string                       # Task title
description: string                 # Brief overview
status: string                      # To Do|In Progress|Done
priority: string                    # low|medium|high
model: string                       # ollama/model-name (optional)
assignee: string                    # Owner (optional)
createdAt: ISO8601                  # Creation timestamp
updatedAt: ISO8601                  # Last update timestamp

# === Spec-Specific Fields ===
spec:
  enabled: boolean                  # Enable spec mode
  type: string                      # feature|bugfix|refactor|docs|infra
  requirements: array[string]       # Requirements list
  architecture:
    components: array[string]       # Components involved
    integrations: array[string]     # External integrations
    decisions: string               # Key decisions & rationale

# === Approval Gates ===
approval:
  code:
    required: boolean               # Require code approval
    autoApprove: boolean            # Auto-approve if tests pass
    approvers: array[string]        # Specific approvers (future)
  docs:
    required: boolean               # Require docs approval
    autoApprove: boolean            # Auto-approve docs
    generate:
      worklog: boolean              # Generate WORK_LOG.md
      adr: boolean                  # Generate ADR
      changelog: boolean            # Update CHANGELOG.md
      readme: boolean               # Update README (optional)

# === Documentation Output ===
documentation:
  generated: boolean                # Docs have been generated
  worklogPath: string|null          # Path to generated worklog
  adrPath: string|null              # Path to generated ADR
  changelogEntry: string|null       # Generated changelog entry

# === Acceptance Criteria ===
acceptanceCriteria: array[string]   # Testable criteria
labels: array[string]               # Tags/categories
estimatedHours: number              # Time estimate
dependencies: array[string]         # Task dependencies
---
```

## Field Descriptions

### Core Fields

#### `id`
- **Type:** string
- **Required:** Yes
- **Format:** `spec-{number}` or `task-{number}`
- **Example:** `spec-42`
- **Notes:** Auto-generated, don't modify

#### `title`
- **Type:** string
- **Required:** Yes
- **Max Length:** 200 characters
- **Example:** `Add OAuth 2.0 Authentication`
- **Notes:** Clear, concise title

#### `description`
- **Type:** string
- **Required:** No
- **Example:** `Implement OAuth 2.0 with Google and GitHub providers`
- **Notes:** Brief overview of scope

#### `status`
- **Type:** string
- **Allowed:** `To Do`, `In Progress`, `Done`
- **Default:** `To Do`
- **Notes:** Auto-updated by watcher

#### `priority`
- **Type:** string
- **Allowed:** `low`, `medium`, `high`
- **Default:** `medium`
- **Example:** `high`

### Spec-Specific Fields

#### `spec.enabled`
- **Type:** boolean
- **Default:** false
- **Notes:** Set to `true` to activate spec-driven mode

#### `spec.type`
- **Type:** string
- **Allowed:** `feature`, `bugfix`, `refactor`, `docs`, `infra`
- **Required:** If spec.enabled is true
- **Example:** `feature`

#### `spec.requirements`
- **Type:** array of strings
- **Notes:** Each requirement should be a complete, testable statement
- **Example:**
  ```yaml
  requirements:
    - "Users can authenticate with Google OAuth 2.0"
    - "Users can authenticate with GitHub OAuth"
    - "Session tokens expire after 24 hours"
  ```

#### `spec.architecture.components`
- **Type:** array of strings
- **Notes:** List of components that will be created/modified
- **Example:** `["auth-service", "user-database", "session-store"]`

#### `spec.architecture.integrations`
- **Type:** array of strings
- **Notes:** External APIs or services
- **Example:** `["Google OAuth API", "GitHub OAuth API"]`

#### `spec.architecture.decisions`
- **Type:** string
- **Notes:** Explain key architectural choices
- **Example:** `"Use JWT tokens with Redis session store for scalability"`

### Approval Fields

#### `approval.code.required`
- **Type:** boolean
- **Default:** true
- **Notes:** If true, code must be approved before docs generation

#### `approval.docs.required`
- **Type:** boolean
- **Default:** true
- **Notes:** If true, docs must be approved before completion

#### `approval.docs.generate.*`
- **Type:** boolean (each sub-field)
- **Notes:** Which documentation to auto-generate

### Acceptance Criteria

#### `acceptanceCriteria`
- **Type:** array of strings
- **Notes:** Each item should be testable, measurable
- **Example:**
  ```yaml
  acceptanceCriteria:
    - "Users can log in with Google within 5 seconds"
    - "Users can log in with GitHub within 5 seconds"
    - "Failed login attempts are rate-limited to 5 per minute"
    - "Session tokens are invalidated on logout"
  ```

## Examples

### Example 1: Simple Feature

```yaml
---
id: "spec-1"
title: "Add Password Reset Feature"
description: "Users should be able to reset forgotten passwords via email"
priority: "high"

spec:
  enabled: true
  type: "feature"
  requirements:
    - "User receives password reset email within 1 minute"
    - "Reset link expires after 1 hour"
    - "New password must meet security requirements"
  architecture:
    components: ["auth-service", "email-service"]
    integrations: ["SendGrid Email API"]
    decisions: "Use JWT for reset tokens, store hash of reset links"

approval:
  code: { required: true }
  docs: { required: true, generate: { worklog: true, adr: false, changelog: true } }

acceptanceCriteria:
  - "Reset email sent within 1 minute of request"
  - "Reset link valid for exactly 1 hour"
  - "New password validated against security policy"
  - "Old password no longer works after reset"

estimatedHours: 8
---

# Password Reset Feature

## Overview
Users often forget passwords and need a secure way to reset them without losing their account.

## Implementation Notes
- Use industry-standard password reset flow
- Send reset link via email (SendGrid)
- Ensure reset tokens are cryptographically secure
- Log all reset attempts for audit trail
```

### Example 2: Complex Feature with Architecture

```yaml
---
id: "spec-42"
title: "Implement Real-time Notifications"
priority: "high"

spec:
  enabled: true
  type: "feature"
  requirements:
    - "Users receive notifications in real-time via WebSocket"
    - "Notifications persist to database for offline access"
    - "Users can configure notification preferences"
    - "Support for email and in-app notifications"
  architecture:
    components:
      - "notification-service"
      - "websocket-server"
      - "notification-queue"
      - "email-service"
    integrations:
      - "Redis (message queue)"
      - "SendGrid (email)"
      - "Socket.IO (WebSocket)"
    decisions: |
      Use Redis pub/sub for real-time distribution.
      Store notifications in PostgreSQL for persistence.
      Use Socket.IO for cross-platform WebSocket support.
      Queue email notifications separately to prevent blocking.

approval:
  code: { required: true }
  docs:
    required: true
    generate:
      worklog: true
      adr: true
      changelog: true

acceptanceCriteria:
  - "Notifications delivered to connected clients within 100ms"
  - "Offline clients receive notifications when reconnecting"
  - "Users can toggle email notifications on/off"
  - "System handles 10,000 concurrent connections"

estimatedHours: 40
dependencies:
  - "spec-5"
  - "spec-8"
---

# Real-time Notifications System

## Architecture
[Detailed architecture explanation here]

## Key Components
[List and describe components]

## Implementation Strategy
[Step-by-step implementation plan]
```

### Example 3: Simple Bugfix (No Spec)

```yaml
---
id: "task-5"
title: "Fix login button style on mobile"
priority: "medium"
estimatedHours: 2
---

# Fix login button style on mobile

The login button appears misaligned on mobile devices.

## Acceptance Criteria
- Button displays correctly on screens < 480px
- Touch target is at least 44px square
```

## Validation

### Automatic Validation

The system automatically validates:

- ✅ `id` matches file name (`spec-{N}.md` or `task-{N}.md`)
- ✅ `title` is not empty
- ✅ `priority` is one of: `low`, `medium`, `high`
- ✅ `spec.type` is one of: `feature`, `bugfix`, `refactor`, `docs`, `infra`
- ✅ `status` is one of: `To Do`, `In Progress`, `Done`

### Manual Validation

```bash
# Validate a spec file
npm run spec:validate backlog/todo/spec-42.md

# Show requirements
npm run spec:validate -- show-requirements backlog/todo/spec-42.md
```

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| `spec.enabled: false` but spec fields present | Set to `true` if using spec mode |
| Empty `requirements` array | Add at least 1 requirement |
| Priority misspelled | Use: `low`, `medium`, or `high` |
| Missing `acceptanceCriteria` | Add testable criteria |
| `approval.required: string` | Should be boolean (`true`/`false`) |

---

See [INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md) for workflow examples.
