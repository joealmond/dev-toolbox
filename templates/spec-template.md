---
# === CORE TASK FIELDS ===
id: "spec-{number}"
title: "Feature Title"
description: "Brief description of the feature"
status: "To Do"
priority: "medium"
labels: []
estimatedHours: 4
model: "glmcoder"

# === SPEC FIELDS ===
spec:
  enabled: true
  type: "feature"  # feature | bugfix | refactor | docs | infra | test
  
  requirements:
    - "Requirement 1"
    - "Requirement 2"
    - "Requirement 3"
  
  architecture:
    components: []
    integrations: []
    decisions: ""

# === APPROVAL CONFIGURATION ===
approval:
  code:
    required: true
    autoApprove: false
    approvers: []
  docs:
    required: true
    autoApprove: false
    generate:
      worklog: true
      adr: false
      changelog: true
      readme: false

# === DOCUMENTATION OUTPUT ===
documentation:
  generated: false
  worklogPath: null
  adrPath: null
  changelogEntry: null

# === ACCEPTANCE CRITERIA ===
acceptanceCriteria:
  - "Criterion 1"
  - "Criterion 2"
  - "Criterion 3"

assignee: ""
createdAt: "2026-01-19T10:00:00Z"
updatedAt: "2026-01-19T10:00:00Z"
---

# Spec: Feature Title

## Overview
Detailed description of what needs to be built and why.

## Requirements
1. Requirement 1: Detailed explanation
2. Requirement 2: Detailed explanation
3. Requirement 3: Detailed explanation

## Technical Context
Provide context about the system, existing patterns, or relevant code.

## Architecture Considerations
- Component 1: Purpose and responsibility
- Component 2: Purpose and responsibility
- Integration points: What systems need to connect

## Acceptance Criteria
- [ ] Criterion 1: Clear, testable condition
- [ ] Criterion 2: Clear, testable condition
- [ ] Criterion 3: Clear, testable condition

## Notes
Additional context, constraints, or considerations.
