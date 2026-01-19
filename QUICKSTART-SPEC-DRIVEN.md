# Quick Start Guide - Spec-Driven Development

## 🚀 Quick Overview

The Ticket Processor now supports **spec-driven development** with automatic documentation generation and approval workflows.

---

## 📝 Creating a Spec Task

### Option 1: Copy Template
```bash
cp backlog/spec-template.md backlog/spec-my-feature.md
# Edit the file with your spec details
```

### Option 2: Interactive Creation (Coming Soon)
```bash
npm run spec:create
# Follow prompts for title, requirements, acceptance criteria
```

---

## ✅ Spec File Format (Front Matter)

```yaml
---
id: "spec-1"                    # Unique identifier
title: "Feature Title"           # Clear, concise title
description: "Brief desc"        # One-liner description
priority: "high"                 # low | medium | high
estimatedHours: 8                # Time estimate

spec:
  enabled: true                  # ENABLE SPEC MODE
  type: "feature"                # feature | bugfix | refactor | docs | infra | test
  
  requirements:                  # What needs to be built
    - "Requirement 1"
    - "Requirement 2"
  
  architecture:                  # Optional: system design context
    components: ["comp1", "comp2"]
    integrations: ["API 1", "API 2"]
    decisions: "Design explanation"

approval:
  code:
    required: true               # Need code approval before docs?
    autoApprove: false           # Auto-approve if tests pass? (future)
  docs:
    required: true               # Need docs approval before complete?
    autoApprove: false
    generate:
      worklog: true              # Generate work log
      adr: false                 # Generate ADR
      changelog: true            # Add to CHANGELOG

acceptanceCriteria:
  - "Criterion 1"
  - "Criterion 2"
---
```

---

## 🔍 Validate Your Spec

```bash
npm run spec:validate backlog/spec-my-feature.md

# Output:
# ✓ Spec is valid
#   Type: feature (spec-driven)
#   Title: Feature Title
#   Requirements: 5
#   Criteria: 4
```

---

## 📋 Check Spec Details

```bash
# View requirements only
node scripts/spec-parser.js show-requirements backlog/spec-my-feature.md

# View the generated prompt
node scripts/spec-parser.js show-prompt backlog/spec-my-feature.md

# View full parsed spec
node scripts/spec-parser.js parse backlog/spec-my-feature.md
```

---

## 🔄 Workflow: From Spec to Completed

### Step 1: Move Spec to "todo" Folder
The watcher monitors `backlog/todo/` automatically:
```bash
mv backlog/spec-my-feature.md backlog/todo/spec-1-my-feature.md
```

### Step 2: Watcher Detects & Processes
```
Watcher detects spec-1-my-feature.md in todo/
  ↓
Parses spec (title, requirements, architecture)
  ↓
Builds enhanced prompt for kodu
  ↓
Runs: kodu --message "<enhanced-prompt>" --auto-approve
  ↓
Generates code based on requirements
```

### Step 3: Code Review Phase
If `approval.code.required: true`:
- Task moves to `backlog/review/`
- Waits for code approval
- Once approved → generates docs

If `approval.code.required: false`:
- Skips straight to doc generation

### Step 4: Generate Documentation
If docs approval required:
```
Generates:
  - Work Log (implementation details)
  - ADR (architecture decisions) [if enabled]
  - Changelog entry [if enabled]
  ↓
Marks docs as pending approval
  ↓
Waits for approval
```

### Step 5: Complete
Once all approvals done:
- Task moves to `backlog/completed/`
- Has embedded documentation
- PR created in Gitea
- Webhook auto-merges (if configured)

---

## 📋 Approval Workflow

### List Pending Approvals
```bash
npm run approval:list

# Output:
# 3 Pending Approvals
# 
# Task ID   Title                     Needed
# spec-1    User Authentication        Code, Docs
# spec-2    Database Migration         Code
# spec-3    API Documentation          Docs
```

### Check Task Status
```bash
npm run approval:status spec-1

# Output:
# Approval Status for spec-1:
#   Code Approval: ⊘ Pending
#   Docs Approval: ⊘ Pending
#   Docs Generated: ✗ No
#   Overall: Needs Code & Docs Approval
```

### Approve Code Changes
```bash
npm run approval:approve spec-1 code

# ✓ Code approved for spec-1
# → Triggers doc generation automatically
```

### Approve Documentation
```bash
npm run approval:approve spec-1 docs

# ✓ Docs approved for spec-1
# → Task moves to completed/
```

### Reject Task
```bash
npm run approval:reject spec-1 "Missing error handling"

# ✗ Task spec-1 rejected
#   Reason: Missing error handling
# → Moved to backlog/failed/
```

### Interactive Approval
```bash
npm run approval:interactive spec-1

# Choose from menu:
# 1. Approve Code
# 2. Approve Docs
# 3. Reject Task
# 4. View Status
```

---

## 📚 Generated Documentation

### Work Log
Location: `docs/worklogs/spec-1-worklog.md`
Contains:
- Task description and model used
- Implementation summary
- Files created/modified
- Acceptance criteria status
- Technical decisions made

### Architecture Decision Record (ADR)
Location: `docs/adr/001-feature-title.md`
Contains:
- Context and problem
- Decision made
- Rationale
- Consequences (positive/negative)
- Alternatives considered

### Changelog
Location: `docs/CHANGELOG.md`
Auto-updated with:
- Type (feat, fix, docs, etc)
- Feature title
- Brief description
- Link to task

---

## ⚙️ Configuration

### Default Settings (config.json)
```json
{
  "approval": {
    "defaultCodeApproval": true,      // Code approval enabled by default
    "defaultDocsApproval": true,      // Docs approval enabled by default
    "notifyOnPending": true,          // Notify on pending approvals
    "timeoutHours": 72,               // Auto-reject after 72h (future)
    "autoRejectOnTimeout": false      // Don't auto-reject on timeout
  },
  "documentation": {
    "defaults": {
      "generateWorklog": true,        // Always generate work log
      "generateAdr": false,           // Optional: ADR generation
      "generateChangelog": true,      // Always update changelog
      "autoApprove": false            // Never auto-approve docs
    }
  }
}
```

### Per-Task Override
You can override config in each spec's `approval` and `documentation` fields.

---

## 🎯 Common Workflows

### Quick Feature (Auto-Approve)
```yaml
approval:
  code:
    required: false
  docs:
    required: false
    generate:
      worklog: true
      adr: false
      changelog: true
```
→ Spec processes, docs auto-generate, moves to completed

### Complex Feature (Full Review)
```yaml
approval:
  code:
    required: true
    autoApprove: false
  docs:
    required: true
    autoApprove: false
    generate:
      worklog: true
      adr: true
      changelog: true
```
→ Manual code review + manual docs review required

### Docs-Only (No Code)
```yaml
approval:
  code:
    required: false
  docs:
    required: true
    generate:
      worklog: false
      adr: false
      changelog: true
```
→ Skips code, just docs approval

---

## 🚨 Troubleshooting

### Spec fails validation
```bash
npm run spec:validate backlog/spec-1.md
# Check error messages, typically:
# - Missing required field
# - Invalid spec.type
# - Missing spec.requirements
```

### Docs don't generate
- Check `approval.docs.generate.*` settings
- Check logs in `backlog/failed/` for errors
- Verify template files exist in `templates/`

### Approval handler not finding task
- Task must be in one of: todo/, doing/, review/, completed/, failed/
- Filename must include task ID

### Changelog not updating
- Check `docs/CHANGELOG.md` exists
- Check write permissions in `docs/` folder

---

## 📖 Next Steps

1. **Test with spec-template**: 
   ```bash
   npm run spec:validate backlog/spec-template.md
   ```

2. **Create your first spec**:
   - Copy template
   - Fill in requirements
   - Validate it

3. **Process it**:
   - Move to `backlog/todo/`
   - Let watcher detect and process
   - Approve code and docs

4. **Check results**:
   - View generated work log in `docs/worklogs/`
   - Check updated `docs/CHANGELOG.md`
   - See completed task in `backlog/completed/`

---

**For detailed documentation, see:** [INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) (coming soon)
