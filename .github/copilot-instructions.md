# Dev-Toolbox Copilot Instructions

This repository is **dev-toolbox**, an AI-powered development environment container that provides invisible tooling to application projects.

## Project Overview

Dev-toolbox is NOT a library or framework that goes inside projects. It's an **environment container** that wraps around projects, providing:

- Spec-driven development with AI (Ollama + Aider/Continue)
- Task processing via file-based workflow (todo → doing → review → completed)
- MCP server with 12 tools for VS Code integration
- Devcontainer support for external projects
- Automatic documentation generation (worklogs, ADRs, changelogs)
- Git automation (commits, branches, PRs)

## Key Architecture Concepts

### The Invisible Tooling Pattern

When used with external projects, dev-toolbox mounts as hidden tooling:
- User's app: `/workspaces/my-app` (visible, clean)
- Dev-toolbox: `/opt/tooling` (hidden, in $PATH)

### Core Workflow

1. Tasks created in `backlog/todo/`
2. Watcher picks up and moves to `backlog/doing/`
3. AI processes via Kodu CLI + Ollama
4. Result moves to `backlog/review/` (if approvals needed)
5. After approvals → `backlog/completed/`

### MCP Integration

The MCP server (`scripts/mcp-server.js`) exposes 12 tools:
- Task management: create_task, create_spec, process_task
- Approvals: approve_code, approve_docs, reject_task
- Status: check_status, list_pending, check_staleness
- Docs: generate_adr, append_changelog
- Search: query_search

## Code Style & Patterns

### JavaScript/Node.js

- Use ES modules where possible
- Async/await for asynchronous code
- Error handling with try/catch and meaningful messages
- Use `gray-matter` for YAML front matter parsing
- Use `handlebars` for template rendering

### Configuration

- Main config: `config.json`
- Environment: via `remoteEnv` in devcontainer
- Per-project overrides: `dev-toolbox.json` in project root

### File Organization

```
scripts/          - Core Node.js scripts
  watcher.js      - Main workflow orchestrator
  process-ticket.js - AI task processing
  mcp-server.js   - MCP tools server
  approval-handler.js - Approval workflow
  doc-generator.js - Documentation generation
  spec-parser.js  - Spec file parsing
templates/        - Handlebars templates
backlog/          - Task workflow folders
docs/             - Documentation
.devcontainer/    - Container configuration
```

## When Generating Code

1. **Follow existing patterns** - Check similar files first
2. **Use config.json settings** - Don't hardcode values
3. **Add proper error handling** - With logging
4. **Include JSDoc comments** - For public functions
5. **Support both standalone and devcontainer** - Check environment

## External Project Integration

When helping users create projects that USE dev-toolbox:

1. They only need `.devcontainer/devcontainer.json`
2. It must point to dev-toolbox's Dockerfile
3. Mount tooling to `/opt/tooling` (read-only)
4. Add `/opt/tooling/scripts` to PATH
5. Set `OLLAMA_HOST=http://host.containers.internal:11434`

Template is at: `templates/devcontainer-external.json`

## Important Files

- `config.json` - All configuration options
- `scripts/mcp-server.js` - MCP tools (reference for capabilities)
- `templates/devcontainer-external.json` - External project template
- `docs/ARCHITECTURE.md` - Full system design
- `docs/guides/EXTERNAL-PROJECT-SETUP.md` - External setup guide
- `docs/api/MCP-TOOLS.md` - MCP tools reference

## Common Tasks

### Adding new MCP tool
1. Add tool definition to `tools` array in `mcp-server.js`
2. Add handler in the handlers section
3. Update `config.json` tools list
4. Document in `docs/api/MCP-TOOLS.md`

### Adding new documentation template
1. Create template in `templates/`
2. Register in `config.json` documentation.templates
3. Add rendering logic in `doc-generator.js`

### Creating external project support
1. Use `templates/devcontainer-external.json` as base
2. Replace `{{PROJECT_NAME}}` and `{{TOOLING_ROOT}}`
3. Ensure mounts and environment are correct
