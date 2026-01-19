# Architecture Guide

Comprehensive system design and architectural patterns for Ticket Processor.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Module Organization](#module-organization)
5. [Design Patterns](#design-patterns)
6. [Error Handling](#error-handling)
7. [Performance Considerations](#performance-considerations)
8. [Future Enhancements](#future-enhancements)

## System Overview

### Purpose

Ticket Processor automates task processing with AI-powered code generation, documentation, and approval workflows.

### Key Capabilities

- **Automated task processing** via Ollama + Kilo Code CLI
- **Spec-driven development** with detailed requirements and architecture
- **Documentation generation** (worklogs, ADRs, changelogs)
- **Approval workflows** for code and documentation quality gates
- **Semantic search** across codebase for context injection
- **MCP integration** for VS Code automation
- **Git automation** for commits and PR creation

### Target Users

- **Developers** - Use CLI or MCP for task creation and management
- **Architects** - Define specs with detailed requirements
- **Reviewers** - Approve code and generated documentation
- **Operations** - Monitor and configure the system

---

## Core Components

### 1. File Watcher (`scripts/watcher.js`)

**Purpose:** Monitor task folder and orchestrate workflow

**Responsibilities:**
- Watch `backlog/todo/` for new task files
- Coordinate task movement through workflow states
- Queue tasks for processing
- Log all events

**Key Features:**
- Debounced file detection (prevents race conditions)
- Webhook server for external events
- Health check endpoint
- Graceful shutdown

**Related Files:**
- `config.json` - Configuration (folders, concurrency, logging)
- `.github/workflows/ci.yml` - GitHub Actions integration

### 2. Task Processor (`scripts/process-ticket.js`)

**Purpose:** Execute task with Kodu and handle results

**Responsibilities:**
- Parse task front matter and content
- Build AI prompt with context
- Execute Kodu CLI
- Capture output and errors
- Return processing result

**Key Features:**
- Semantic search integration for code context
- Spec-driven prompt enhancement
- Timeout handling
- Error logging

**Related Files:**
- `scripts/semantic-indexer.js` - Code context
- `scripts/spec-parser.js` - Spec extraction
- `config.json` - Model selection

### 3. Spec Parser (`scripts/spec-parser.js`)

**Purpose:** Parse and validate spec-driven task metadata

**Responsibilities:**
- Extract front matter fields
- Validate spec schema
- Build enhanced prompts
- Check requirements completeness

**Key Features:**
- YAML front matter parsing
- Schema validation
- Backward compatibility (non-spec tasks)
- Requirement extraction

### 4. Documentation Generator (`scripts/doc-generator.js`)

**Purpose:** Create documentation artifacts from completed tasks

**Responsibilities:**
- Generate work logs (implementation summary)
- Create ADR documents (architecture decisions)
- Append changelog entries
- Template-based generation

**Key Features:**
- Configurable doc types
- Template system
- Kodo API for summary generation
- Markdown output

**Related Files:**
- `templates/` - Markdown templates
- `config.json` - Doc generation settings

### 5. Approval Handler (`scripts/approval-handler.js`)

**Purpose:** Manage approval workflow gates

**Responsibilities:**
- Track approval status per task
- Approve/reject code and docs
- Enforce approval requirements
- Handle timeouts

**Key Features:**
- State machine for approval flow
- Configurable per-task requirements
- Approval audit trail
- Notification support

### 6. Semantic Indexer (`scripts/semantic-indexer.js`)

**Purpose:** Build and search code/doc index for context injection

**Responsibilities:**
- Index project files with MiniSearch
- Provide semantic search API
- Maintain incremental updates
- Return relevant snippets

**Key Features:**
- Configurable file patterns
- Size limits
- Fuzzy matching
- Cross-module search

**Related Files:**
- `config.json` - Search configuration
- `.index/` - Index storage

### 7. Git Manager (`scripts/git-manager.js`)

**Purpose:** Automate git operations for task repositories

**Responsibilities:**
- Initialize task git repos
- Create commits with docs
- Push to remote (Gitea)
- Create pull requests
- Auto-merge PRs

**Key Features:**
- Token-based authentication
- Retry logic for unreliable networks
- Multi-step commit process
- PR auto-merge on success

**Related Files:**
- `config.json` - Git configuration
- Environment variables - GITEA_TOKEN

### 8. MCP Server (`scripts/mcp-server.js`)

**Purpose:** Expose tools to VS Code via Model Context Protocol

**Responsibilities:**
- Define 10 MCP tools
- Handle tool invocations
- Return results to VS Code
- Manage stdio communication

**Key Features:**
- Stateless tool execution
- Parallel tool support
- Error handling
- Stdio transport

**Related Files:**
- `.devcontainer/devcontainer.json` - Configuration
- `docs/api/MCP-TOOLS.md` - Tool reference

---

## Data Flow

### Complete Task Workflow

```
[1] Task Created
    └─ File: backlog/todo/task-N.md
    └─ Contains: Front matter + body

[2] Watcher Detects
    └─ File change event
    └─ Debounce check
    └─ Add to queue

[3] Task Processing
    ├─ Parse front matter
    ├─ Read body content
    ├─ Semantic search for context
    ├─ Build prompt
    ├─ Execute Kodu
    └─ Capture output

[4] Spec Processing (if enabled)
    ├─ Extract requirements
    ├─ Inject architecture context
    ├─ Enhanced requirements in prompt
    └─ Result validation vs acceptance

[5] Code Approval
    ├─ Move to backlog/review/
    ├─ Wait for approval
    ├─ Approver reviews + approves/rejects
    └─ If rejected → backlog/failed/

[6] Documentation Generation (if approved)
    ├─ Generate worklog
    ├─ Generate ADR (if configured)
    ├─ Append changelog
    └─ Update task front matter

[7] Docs Approval
    ├─ If required, wait for approval
    ├─ Approver reviews generated docs
    └─ If rejected, regenerate or fail

[8] Completion
    ├─ Move to backlog/completed/
    ├─ Create git repository
    ├─ Push to Gitea
    ├─ Create PR
    ├─ Auto-merge (if configured)
    └─ Emit webhook event
```

### Data Transformations

```
Task File
    ↓ (parse)
Front Matter + Body
    ↓ (extract)
Requirements + Acceptance Criteria + Description
    ↓ (search)
Add Related Code Context
    ↓ (build)
AI Prompt
    ↓ (kodu)
Generated Code
    ↓ (parse)
Processing Result
    ↓ (if success)
Generated Documentation
    ↓ (if approval)
Completion + Git Push + PR Creation
```

---

## Module Organization

### Script Categories

#### Core Processing
- `scripts/process-ticket.js` - Main processor
- `scripts/watcher.js` - File monitor

#### Spec-Driven
- `scripts/spec-parser.js` - Parse specs
- `scripts/doc-generator.js` - Generate docs
- `scripts/approval-handler.js` - Approval gates

#### Search & Context
- `scripts/semantic-indexer.js` - Index/search

#### Automation
- `scripts/git-manager.js` - Git operations
- `scripts/mcp-server.js` - VS Code integration

#### Utilities
- `scripts/create-spec.js` - Spec file creation
- `scripts/query-search.js` - CLI search
- `scripts/changelog-manager.js` - Changelog ops
- `scripts/adr-generator.js` - ADR creation

#### Setup & Installation
- `install/` - Platform-specific installers
- `scripts/service-*.sh` - Service control

### Configuration

All configuration in `config.json`:

```json
{
  "ollama": { /* AI model config */ },
  "processing": { /* Queue & debounce */ },
  "folders": { /* Workflow paths */ },
  "spec": { /* Spec features */ },
  "documentation": { /* Doc generation */ },
  "approval": { /* Approval gates */ },
  "mcp": { /* MCP tools */ },
  "search": { /* Semantic search */ },
  "webhook": { /* Webhook server */ },
  "git": { /* Git operations */ },
  "logging": { /* Logging */ }
}
```

### Environment Variables

- `OLLAMA_HOST` - Ollama server address
- `GITEA_URL` - Gitea instance URL
- `GITEA_TOKEN` - API authentication
- `GITEA_ORG` - Organization for repos
- `GIT_USER_NAME` - Commit author
- `GIT_USER_EMAIL` - Commit email

---

## Design Patterns

### 1. Configuration-Driven Behavior

All configurable behavior lives in `config.json`. Changes don't require code modifications.

```javascript
// Example: Feature flag for semantic search
if (config.search.enabled) {
  results = await semanticIndexer.search(query);
}
```

### 2. Module Exports

Each module exports functions and optionally a default class:

```javascript
// spec-parser.js
module.exports = {
  parseSpec,
  validateSpec,
  extractRequirements,
  buildPrompt
};

// Used as
const specParser = require('./spec-parser');
specParser.parseSpec(filePath);
```

### 3. Async/Await Pattern

All async operations use modern async/await:

```javascript
async function processTicket(filePath) {
  try {
    const content = await fs.readFile(filePath);
    const result = await kodu.execute(prompt);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 4. Graceful Degradation

Optional features fail gracefully without blocking:

```javascript
// Semantic search is optional
try {
  searchResults = await semanticIndexer.search(query);
} catch (error) {
  console.warn(`Search skipped: ${error.message}`);
  searchResults = [];
}
```

### 5. Logging Utility

Consistent logging across all scripts:

```javascript
log('info', 'Task starting', { taskId, model });
log('success', '✓ Complete', { taskId });
log('error', 'Failed', { error: err.message });
```

### 6. State Machine for Approvals

Clear state transitions in approval workflow:

```
Pending → Approved → Completed
       → Rejected → Failed
       → Timeout → Auto-rejected
```

---

## Error Handling

### Strategy

1. **Graceful Failures** - Continue processing despite non-critical errors
2. **Clear Errors** - Log with context and actionable messages
3. **Recovery** - Retry logic for transient failures
4. **Logging** - All errors logged with timestamps

### Patterns

**Pattern 1: Try-Catch with Logging**
```javascript
try {
  // operation
} catch (error) {
  log('error', 'Operation failed', { error: error.message });
  return { success: false, error: error.message };
}
```

**Pattern 2: Best-Effort Operations**
```javascript
if (config.search.enabled) {
  try {
    results = await search(query);
  } catch (error) {
    console.warn(`Search skipped: ${error.message}`);
  }
}
```

**Pattern 3: Retry with Exponential Backoff**
```javascript
async function pushWithRetry(git, branch) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await git.push('origin', branch);
      return;
    } catch (error) {
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
}
```

---

## Performance Considerations

### 1. File Watching Debounce

Files are debounced (1000ms) to avoid processing incomplete writes:

```javascript
awaitWriteFinish: {
  stabilityThreshold: config.processing.watchDebounce,
  pollInterval: 100
}
```

### 2. Semantic Index

Incremental indexing avoids full rebuilds:

```javascript
// Full rebuild when needed
npm run build:index

// Or auto-load existing index
await semanticIndexer.ensureIndex();
```

### 3. Queue Concurrency

Processing is serialized (default: 1 concurrent task) via p-queue:

```javascript
const queue = new PQueue({ concurrency: config.processing.concurrency });
queue.add(() => processTicket(filePath));
```

### 4. Timeout Management

Long-running operations timeout to prevent hanging:

```javascript
const timeout = setTimeout(() => {
  koduProcess.kill('SIGTERM');
}, config.ollama.timeout); // 300s default
```

---

## Future Enhancements

### Short Term (1-2 months)

1. **Integrated Testing Framework**
   - Jest or Mocha for unit tests
   - Integration test suite
   - Coverage reporting

2. **Advanced Approval Workflows**
   - Multiple approvers per task
   - Team-based approvals
   - Approval comments/reviews

3. **Enhanced Search**
   - Embeddings-based semantic search
   - Broader context injection
   - Caching for performance

### Medium Term (3-6 months)

1. **Kubernetes Support**
   - Helm charts
   - Resource definitions
   - Network policies

2. **Advanced Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Alert rules

3. **Multi-Model Support**
   - Claude, GPT-4, etc.
   - Model switching per task
   - Cost tracking

### Long Term (6+ months)

1. **Visual Workflow Designer**
   - Web UI for task creation
   - Workflow visualization
   - Real-time monitoring

2. **Distributed Processing**
   - Multiple processor nodes
   - Load balancing
   - Horizontal scaling

3. **Advanced Analytics**
   - Task completion metrics
   - Performance trends
   - Quality analysis

---

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Author:** Ticket Processor Team
