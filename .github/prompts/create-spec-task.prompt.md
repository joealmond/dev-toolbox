---
description: Create a new spec-driven task with requirements and architecture context
mode: agent
tools: ['editFiles', 'runTerminal']
---

# Create Spec-Driven Task

Create a new specification-driven task that includes:
- Detailed requirements
- Architecture context
- Acceptance criteria
- Approval configuration

## Task Information

Provide the following:

1. **Title** - Clear, action-oriented title
2. **Description** - What needs to be built
3. **Requirements** - List of specific requirements (numbered)
4. **Architecture**:
   - Components involved
   - Key decisions
   - Integrations needed
5. **Acceptance Criteria** - How to verify completion
6. **Approvals** - Code approval? Docs approval?

## Generated Task Format

```markdown
---
title: "Your Title"
id: "spec-XXX"
status: "todo"
priority: "medium"
spec:
  enabled: true
  requirements:
    - Requirement 1
    - Requirement 2
  architecture:
    components: ["component-a"]
    decisions:
      - "Key decision"
approval:
  codeApproval: true
  docsApproval: true
documentation:
  generateWorklog: true
  generateAdr: false
  generateChangelog: true
---

## Description

Task description...

## Acceptance Criteria

- [ ] Criteria 1
- [ ] Criteria 2
```

## After Creation

The task will be placed in `backlog/todo/` and picked up by the watcher for processing.
