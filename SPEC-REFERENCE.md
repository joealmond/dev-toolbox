# Specification File Format Reference

This document describes the complete format for specification-driven tasks in the Ticket Processor system.

## Overview

Specifications (specs) are enhanced task files with built-in requirements, architecture context, and automatic documentation generation. They use the same markdown format as standard tasks but with `spec.enabled: true` in the front matter.

**File Location:** `backlog/todo/spec-{taskId}.md` (or other folders during workflow)

**Key Features:**
- Embed requirements directly in task file
- Include architecture context (components, integrations, decisions)
- Auto-generate work logs, ADRs, and changelogs
- Configurable approval gates
- Enhanced AI prompts with full context

---

## Front Matter Format

The YAML front matter comes first in the file, enclosed in `---`:

```yaml
---
status: Todo
createdAt: 2024-01-15T10:00:00Z
title: "OAuth2 Authentication Implementation"
spec:
  enabled: true
  requirements:
    - "Support GitHub, Google, Microsoft OAuth providers"
    - "Implement PKCE flow for mobile apps"
    - "Store encrypted tokens in database"
    - "Implement token refresh mechanism"
  architecture:
    components:
      - AuthService (handles OAuth flow)
      - TokenManager (stores/refreshes tokens)
      - UserService (creates/updates user records)
    integrations:
      - GitHub OAuth API
      - Google OAuth API
      - Microsoft OAuth API
    decisions:
      - Use PKCE for all flows (security)
      - Store refresh tokens separately (compliance)
      - Implement token rotation (defense in depth)
approval:
  code:
    required: true
    approved: false
  docs:
    required: true
    approved: false
    generate: true
acceptanceCriteria:
  - "User can authenticate via GitHub"
  - "User can authenticate via Google"
  - "User can authenticate via Microsoft"
  - "Sessions persist across page refresh"
  - "Security vulnerabilities documented in ADR"
documentation:
  worklog: false
  adr: true
  changelog: true
  generated: false
  generatedAt: null
  paths:
    worklog: null
    adr: []
    changelog: null
---
```

---

## Field Reference

### Top-Level Fields

#### `status`
**Type:** string  
**Required:** Yes  
**Values:** `Todo`, `Doing`, `Review`, `Completed`, `Failed`  
**Default:** `Todo`

Current workflow status. Automatically updated by the system.

```yaml
status: Review
```

#### `createdAt`
**Type:** ISO 8601 timestamp  
**Required:** Yes  
**Auto-set:** Yes

When the task was created. System-managed field.

```yaml
createdAt: 2024-01-15T10:00:00Z
```

#### `title`
**Type:** string  
**Required:** Yes  
**Max length:** 200 characters

Task/spec title displayed in lists and logs.

```yaml
title: "OAuth2 Authentication Implementation"
```

#### `assignee` (optional)
**Type:** string

Person responsible for the task. Can be email or name.

```yaml
assignee: alice@example.com
```

#### `priority` (optional)
**Type:** string  
**Values:** `low`, `medium`, `high`, `critical`  
**Default:** `medium`

Task priority for scheduling.

```yaml
priority: high
```

---

### `spec` Object

Enables spec mode and provides requirements/architecture context.

#### `spec.enabled`
**Type:** boolean  
**Required:** Yes (for specs)

Set to `true` to enable spec-driven mode. Sets to `false` for standard tasks.

```yaml
spec:
  enabled: true
```

#### `spec.requirements`
**Type:** array of strings  
**Required:** Yes (if `enabled: true`)

Functional requirements that the implementation must satisfy.

```yaml
spec:
  requirements:
    - "Support GitHub OAuth provider"
    - "Implement token refresh mechanism"
    - "Encrypt sensitive tokens at rest"
```

**Best Practices:**
- One requirement per item
- Use action verbs (Support, Implement, Store, etc.)
- Be specific and measurable
- 3-8 requirements typical

#### `spec.architecture`
**Type:** object  
**Required:** No

Architectural context provided to the AI during implementation.

```yaml
spec:
  architecture:
    components: [...]
    integrations: [...]
    decisions: [...]
```

##### `spec.architecture.components`
**Type:** array of strings

System components involved in this feature.

```yaml
components:
  - AuthService (handles OAuth handshake)
  - TokenManager (stores/refreshes tokens)
  - UserService (manages user records)
```

##### `spec.architecture.integrations`
**Type:** array of strings

External services/APIs used.

```yaml
integrations:
  - GitHub OAuth API v3
  - Google OAuth API
  - PostgreSQL database
  - Redis for session cache
```

##### `spec.architecture.decisions`
**Type:** array of strings

Key architectural decisions with rationale.

```yaml
decisions:
  - Use PKCE flow for all clients (security best practice)
  - Store tokens encrypted with AES-256 (compliance)
  - Implement automatic token rotation (defense in depth)
  - Use RS256 for JWT signing (industry standard)
```

---

### `approval` Object

Configures approval gates for code and documentation.

```yaml
approval:
  code:
    required: true
    approved: false
    approvedBy: null
    approvedAt: null
    notes: null
  docs:
    required: true
    approved: false
    generate: true
    approvedBy: null
    approvedAt: null
    notes: null
```

#### `approval.code`
Code implementation approval gate.

- `required` *(boolean)* - Require code approval before moving to completed (default: true)
- `approved` *(boolean)* - Whether code is approved (auto-set by system)
- `approvedBy` *(string)* - Who approved (auto-set)
- `approvedAt` *(timestamp)* - When approved (auto-set)
- `notes` *(string)* - Approval feedback

#### `approval.docs`
Documentation approval gate.

- `required` *(boolean)* - Require docs approval (default: true)
- `approved` *(boolean)* - Whether docs are approved
- `generate` *(boolean)* - Auto-generate docs after code approval (default: true)
- `approvedBy` *(string)* - Who approved (auto-set)
- `approvedAt` *(timestamp)* - When approved (auto-set)
- `notes` *(string)* - Approval feedback

**Workflow Examples:**

Auto-complete (no approvals):
```yaml
approval:
  code:
    required: false
  docs:
    required: false
    generate: false
```

Code review only:
```yaml
approval:
  code:
    required: true
  docs:
    required: false
    generate: true
```

Full workflow (recommended):
```yaml
approval:
  code:
    required: true
  docs:
    required: true
    generate: true
```

---

### `acceptanceCriteria`
**Type:** array of strings

Testable criteria the implementation must satisfy.

```yaml
acceptanceCriteria:
  - "User can log in with GitHub"
  - "User can log in with Google"
  - "Tokens refresh automatically after 1 hour"
  - "Login flow completes in < 2 seconds"
```

---

### `documentation` Object

Configures which documentation to generate.

```yaml
documentation:
  worklog: false
  adr: true
  changelog: true
  generated: false
  generatedAt: null
  paths:
    worklog: null
    adr: []
    changelog: null
```

#### `documentation.worklog`
**Type:** boolean

Generate work log documenting implementation process.

#### `documentation.adr`
**Type:** boolean

Generate Architecture Decision Records for key decisions.

#### `documentation.changelog`
**Type:** boolean

Add entry to CHANGELOG.md.

#### `documentation.generated`
**Type:** boolean (auto-set)

System flag indicating docs have been generated.

#### `documentation.paths`
**Type:** object (auto-set)

Paths to generated documentation files.

```yaml
paths:
  worklog: docs/worklogs/spec-123.md
  adr:
    - docs/adr/0042-oauth2-flow.md
    - docs/adr/0043-token-storage.md
  changelog: docs/CHANGELOG.md (implicit)
```

---

## Body Content

After the `---` closing marker, the markdown body contains:

1. **Description** - Overview of what needs to be implemented
2. **Background** - Context and motivation (optional)
3. **Notes** - Implementation hints or constraints (optional)

### Example Body

```markdown
## Description

Implement a complete OAuth2 authentication system supporting multiple providers to improve user onboarding and reduce password-related security issues.

## Background

Current authentication relies on password-based login which has the following limitations:
- High support burden for password resets
- Users reuse passwords across services
- No SSO capability for enterprise customers

## Implementation Notes

1. Start with GitHub provider (most common in our user base)
2. Use existing database schema; add oauth_tokens table
3. Implement token refresh via background job (not request-blocking)
4. Test with Postman to validate OAuth flows before UI integration
```

---

## Complete Example

```markdown
---
status: Todo
createdAt: 2024-01-15T10:00:00Z
title: "User Profile Management System"
assignee: alice@example.com
priority: high
spec:
  enabled: true
  requirements:
    - "Allow users to edit their profile (name, avatar, bio)"
    - "Validate file uploads (size < 10MB, image types only)"
    - "Store avatars in S3 with CDN caching"
    - "Implement profile visibility controls (public/private)"
    - "Trigger welcome email on profile completion"
  architecture:
    components:
      - ProfileService (CRUD operations)
      - FileValidator (size, type, content checks)
      - S3Manager (upload and CDN integration)
      - EmailQueue (async email delivery)
    integrations:
      - AWS S3 (file storage)
      - AWS CloudFront (CDN)
      - SendGrid (email delivery)
    decisions:
      - Use S3 for user files (not database blobs)
      - Async email via job queue (performance)
      - Pre-signed URLs for uploads (security)
      - Soft-delete profiles (data retention)
approval:
  code:
    required: true
  docs:
    required: true
    generate: true
acceptanceCriteria:
  - "User can upload avatar image"
  - "Avatar appears in user's profile page"
  - "Users can mark profile as private"
  - "Welcome email sent on profile completion"
  - "File upload validation prevents >10MB files"
  - "Avatar CDN caching working (Cache-Control headers)"
documentation:
  worklog: true
  adr: true
  changelog: true
  generated: false
---

## User Profile Management

Allow users to manage their public profiles with customizable visibility controls and avatar uploads.

## Context

Currently, we have basic user accounts with no profile customization. This feature enables:
- Better user experience and community building
- Avatar displays in comments and discussions
- Privacy controls for GDPR/CCPA compliance

## Implementation Notes

1. Database migration: Add users.profile_public and users.avatar_url columns
2. Create /api/profile endpoint with GET/PATCH/DELETE
3. Use multer middleware for file uploads with validation
4. Implement S3 upload with pre-signed URLs (client-side direct uploads)
5. Add welcome email template
```

---

## Workflow States

### Task Status Lifecycle

```
Todo
  ↓
Doing (kodu processing)
  ↓
Review (awaiting approvals)
  ├─→ Code Approval Required?
  │   └─→ Yes: Approve code → Generate docs → Review docs
  │   └─→ No: Skip to docs review
  ├─→ Docs Approval Required?
  │   └─→ Yes: Approve docs → Completed
  │   └─→ No: Auto-complete
  ↓
Completed (moved to backlog/completed)
  OR
Failed (moved to backlog/failed)
```

### Example Workflow

1. **Create spec**: `backlog/todo/spec-123.md`
2. **Process**: Move to `backlog/doing/`, run kodu
3. **Review code**: Move to `backlog/review/`, await approval
4. **Approve code**: Update `approval.code.approved = true`, trigger doc generation
5. **Review docs**: Check generated worklogs/ADRs, await docs approval
6. **Approve docs**: Update `approval.docs.approved = true`, move to `completed`
7. **Complete**: Task in `backlog/completed/spec-123.md`

---

## CLI Commands

### Create Spec

```bash
npm run spec:create
```

Interactive prompt for spec details.

### Validate Spec

```bash
npm run spec:validate backlog/todo/spec-123.md
```

Check all required fields and structure.

### Show Spec

```bash
npm run spec:show backlog/todo/spec-123.md
```

Display parsed spec with all fields.

### Generate Prompt

```bash
npm run spec:prompt backlog/todo/spec-123.md
```

Show the AI prompt that will be used for processing.

---

## Validation Rules

All specs are validated when:
1. Creating via `create_spec` tool
2. Processing via watcher
3. Explicitly with `spec:validate` command

**Required Fields:**
- `title` ≤ 200 characters
- `spec.requirements` ≥ 1 item
- `acceptance Criteria` ≥ 1 item
- `approval.code.required` is boolean
- `approval.docs.required` is boolean

**Optional But Recommended:**
- `spec.architecture.components` - Helps AI understand system
- `spec.architecture.decisions` - Justifies technical choices
- `assignee` - Tracks ownership

---

## Best Practices

### 1. Clear Requirements

✅ **Good:**
```yaml
requirements:
  - "Support OAuth2 authorization code flow"
  - "Implement PKCE for mobile apps"
  - "Refresh tokens valid for 7 days"
```

❌ **Bad:**
```yaml
requirements:
  - "Implement OAuth"
  - "Handle tokens"
```

### 2. Architecture Context

✅ **Good:**
```yaml
architecture:
  decisions:
    - Use PKCE for all clients (RFC 7636 security)
    - Store tokens encrypted at rest (compliance)
```

❌ **Bad:**
```yaml
architecture:
  decisions:
    - PKCE
    - Encrypted tokens
```

### 3. Acceptance Criteria

✅ **Good:**
```yaml
acceptanceCriteria:
  - "User can authenticate with GitHub OAuth"
  - "Login completes in < 3 seconds"
  - "Tokens refresh automatically in background"
```

❌ **Bad:**
```yaml
acceptanceCriteria:
  - "OAuth works"
  - "Performance is good"
```

### 4. Approval Gates

✅ **Simple tasks** (no approval):
```yaml
approval:
  code:
    required: false
  docs:
    required: false
    generate: false
```

✅ **Team features** (code review):
```yaml
approval:
  code:
    required: true
  docs:
    required: false
    generate: true
```

✅ **Critical features** (full workflow):
```yaml
approval:
  code:
    required: true
  docs:
    required: true
    generate: true
```

---

## Troubleshooting

### Spec Not Processing

Check:
1. `spec.enabled: true` is set
2. All required fields present
3. Run `npm run spec:validate path/to/spec.md`
4. Check `logs/watcher.log` for errors

### Requirements Not Injected

Verify in generated prompt:
```bash
npm run spec:prompt backlog/todo/spec-123.md
```

Should show "## Requirements" section with all items.

### Documentation Not Generating

Check `approval.docs.generate` is `true`:
```yaml
approval:
  docs:
    required: true
    generate: true  # ← Must be true
```

Check logs for generation errors:
```bash
tail -f logs/watcher.log | grep "docs generation"
```

---

## See Also

- [MCP-TOOLS.md](./MCP-TOOLS.md) - Tool reference
- [APPROVAL-WORKFLOW.md](./APPROVAL-WORKFLOW.md) - Approval process
- [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) - Setup guide
