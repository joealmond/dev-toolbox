# Contributing to Ticket Processor

Thank you for your interest in contributing to the Ticket Processor project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's technical standards

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 11.7.0
- Git
- Podman and Podman Compose (for containerized setup)
- Ollama (for AI model hosting)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ticket-processor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run setup script**
   ```bash
   # macOS
   bash install/install-macos.sh
   
   # Linux
   bash install/install-linux.sh
   ```

5. **Build semantic index**
   ```bash
   npm run build:index
   ```

6. **Start the system**
   ```bash
   npm start
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, well-documented code
- Follow existing patterns and conventions
- Add tests for new functionality
- Update documentation as needed

### 3. Test Locally

```bash
# Run tests
npm test

# Test semantic search
npm run test:search

# Manual testing
npm run watcher
```

### 4. Commit Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add semantic search integration"
# or
git commit -m "fix: resolve concurrency issue in watcher"
# or
git commit -m "docs: update configuration guide"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub/Gitea.

## Project Structure

```
ticket-processor/
├── scripts/              # Core processing scripts
│   ├── process-ticket.js # Main ticket processing logic
│   ├── watcher.js        # File watcher and workflow
│   ├── git-manager.js    # Git operations
│   ├── doc-generator.js  # Documentation generation
│   ├── semantic-indexer.js # Semantic search
│   └── mcp-server.js     # MCP server
├── backlog/              # Task folders
│   ├── todo/            # Pending tasks
│   ├── doing/           # In-progress tasks
│   ├── review/          # Tasks under review
│   ├── completed/       # Completed tasks
│   └── failed/          # Failed tasks
├── .github/
│   ├── agents/          # GitHub agent configurations
│   └── workflows/       # CI/CD workflows
├── containers/          # Docker/Podman configuration
├── config.json          # System configuration
└── docs/                # Documentation

```

## Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Prefer `async/await` over callbacks
- Use `const` by default, `let` when reassignment needed
- Add JSDoc comments for functions
- Handle errors gracefully with try-catch
- Log important events and errors

**Example:**

```javascript
/**
 * Process a ticket file
 * @param {string} filePath - Path to the ticket
 * @param {object} frontMatter - Parsed metadata
 * @returns {Promise<object>} - Processing result
 */
async function processTicket(filePath, frontMatter) {
  try {
    // Implementation
    console.log(`[INFO] Processing ${filePath}`);
    // ...
    return { success: true };
  } catch (error) {
    console.error(`[ERROR] Failed to process:`, error.message);
    return { success: false, error: error.message };
  }
}
```

### Configuration

- Always use `config.json` for system settings
- Support environment variable overrides
- Provide sensible defaults
- Document all configuration options in `CONFIG.md`

### Error Handling

- Use try-catch blocks for async operations
- Log errors with context
- Fail gracefully without crashing
- Return error objects with details

### Logging

Follow the logging utility pattern:

```javascript
log('info', 'Operation starting');
log('success', '✓ Operation completed');
log('warning', 'Non-critical issue detected');
log('error', 'Operation failed', { error: err.message });
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Specific test suite
npm run test:search
```

### Writing Tests

- Test file naming: `*.test.js`
- Use assertions (`assert` module)
- Test both success and error cases
- Mock external dependencies when needed

**Example:**

```javascript
const assert = require('assert');
const { myFunction } = require('./my-module');

async function testMyFunction() {
  const result = await myFunction('input');
  assert.ok(result.success, 'Function should succeed');
  assert.strictEqual(result.value, 'expected', 'Should return expected value');
}
```

## Documentation

### What to Document

- New features and APIs
- Configuration changes
- Breaking changes
- Setup/installation steps
- Usage examples

### Where to Document

- **README.md** - Project overview, quick start
- **CONFIG.md** - Configuration options
- **USAGE.md** - Detailed usage guide
- **TROUBLESHOOTING.md** - Common issues and solutions
- **Code comments** - Complex logic, non-obvious decisions

### Style Guidelines

- Use clear, concise language
- Provide examples
- Use proper markdown formatting
- Link to related documentation
- Keep documentation up-to-date with code changes

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project standards
- [ ] Tests pass (`npm test`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] No merge conflicts with main branch
- [ ] PR description explains the changes

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How were these changes tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Review Process

### Architecture Review

PRs affecting system architecture will be reviewed against [architect.agent.md](.github/agents/architect.agent.md):

- Code organization and patterns
- Integration points
- Scalability considerations
- Error handling

### Documentation Review

Documentation changes will be reviewed against [docs.agent.md](.github/agents/docs.agent.md):

- Content quality and clarity
- Formatting and structure
- Technical accuracy
- Consistency

### CI/CD Checks

All PRs must pass:

- Tests
- Linting (if configured)
- Security scan
- Markdown link validation (for docs)

### Review Timeline

- Initial review: Within 2-3 business days
- Follow-up reviews: 1-2 business days after updates
- Approvals needed: 1 maintainer (2 for breaking changes)

## Questions or Issues?

- Check existing issues on GitHub/Gitea
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Ask in discussions or create a new issue
- Contact maintainers

---

Thank you for contributing to Ticket Processor! 🎉
