# Documentation Map

Complete guide to Dev-Toolbox (formerly Dev-Toolbox) documentation and resources.

## 🎯 Project Vision

- **[PROJECT-VISION.md](PROJECT-VISION.md)** - **START HERE** — Project vision, roadmap, and priorities

## 📁 Quick Navigation

### Getting Started
- [README.md](../README.md) - Project overview and quick start
- [guides/INSTALLATION.md](guides/INSTALLATION.md) - Installation for your platform
- [guides/USAGE.md](guides/USAGE.md) - How to use the system

### Development & Integration
- [guides/INTEGRATION-GUIDE.md](guides/INTEGRATION-GUIDE.md) - Spec-driven development setup
- [guides/EXTERNAL-PROJECT-SETUP.md](guides/EXTERNAL-PROJECT-SETUP.md) - Use tooling with external projects
- [guides/SPEC-REFERENCE.md](guides/SPEC-REFERENCE.md) - Spec file format reference
- [guides/APPROVAL-WORKFLOW.md](guides/APPROVAL-WORKFLOW.md) - Approval process details

### API & Tools
- [api/MCP-TOOLS.md](api/MCP-TOOLS.md) - MCP server tools reference

### Architecture & Design
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and patterns

### Deployment & Operations
- [operations/CONFIG.md](operations/CONFIG.md) - Configuration options
- [operations/OLLAMA-MODELS.md](operations/OLLAMA-MODELS.md) - Ollama model selection guide
- [operations/DEPLOYMENT.md](operations/DEPLOYMENT.md) - Deployment guide
- [operations/TROUBLESHOOTING.md](operations/TROUBLESHOOTING.md) - Common issues and solutions
- [operations/SECURITY.md](operations/SECURITY.md) - Security review and hardening
- [operations/HOST-MACHINE-REFERENCE.md](operations/HOST-MACHINE-REFERENCE.md) - Linux host system specs
- [operations/HOST-SETUP-PLAN.md](operations/HOST-SETUP-PLAN.md) - Host setup checklist
- [operations/DOCKER-REGISTRY-PUSH.md](operations/DOCKER-REGISTRY-PUSH.md) - Docker registry push guide
- [operations/LOCAL-REGISTRY-PUSH.md](operations/LOCAL-REGISTRY-PUSH.md) - Local registry push guide
- [operations/GITEA-CONTAINER-REGISTRY-SETUP.md](operations/GITEA-CONTAINER-REGISTRY-SETUP.md) - Gitea container registry setup
- [operations/GITEA-REGISTRY-SETUP.md](operations/GITEA-REGISTRY-SETUP.md) - Gitea registry setup
- [operations/FUTURE_IMPROVEMENTS.md](operations/FUTURE_IMPROVEMENTS.md) - Planned improvements

### Improvement Planning
- [guides/IMPROVEMENT-ROADMAP1.md](guides/IMPROVEMENT-ROADMAP1.md) - GPU optimization, Obsidian, modularity

### Contributing
- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute

### Generated Documentation

### Project History
- [IMPLEMENTATION-LOG.md](IMPLEMENTATION-LOG.md) - Development phases and milestones


## 📚 Documentation Organization

```
Dev-Toolbox/
├── README.md                 ← Start here
├── docs/guides/INSTALLATION.md  ← Setup instructions
├── docs/guides/USAGE.md         ← User guide
├── docs/operations/CONFIG.md    ← Configuration reference
├── docs/operations/DEPLOYMENT.md← Production deployment
├── docs/operations/TROUBLESHOOTING.md ← Problem solving
├── docs/operations/SECURITY.md  ← Security review
├── CONTRIBUTING.md           ← Contribution guidelines
│
└── docs/
    ├── guides/               ← User & developer guides
    │   ├── INTEGRATION-GUIDE.md
    │   ├── SPEC-REFERENCE.md
    │   └── APPROVAL-WORKFLOW.md
    │
    ├── api/                  ← API documentation
    │   └── MCP-TOOLS.md
    │
    ├── ARCHITECTURE.md        ← System design & patterns
    │
    ├── operations/           ← Operations docs (deploy, config, registry)
    │
    ├── CHANGELOG.md          ← Version history
    ├── adr/                  ← Architecture decisions
    ├── worklogs/             ← Task implementation logs
    ├── specs/                ← Archived specifications
    └── archive/              ← Historical/deprecated docs
```

---

## 🎯 Documentation by Use Case

### I want to...

**Get started quickly**
→ [README.md](../README.md) → [guides/INSTALLATION.md](guides/INSTALLATION.md) → [guides/USAGE.md](guides/USAGE.md)

**Use spec-driven development**
→ [guides/INTEGRATION-GUIDE.md](guides/INTEGRATION-GUIDE.md) → [guides/SPEC-REFERENCE.md](guides/SPEC-REFERENCE.md)

**Understand the approval workflow**
→ [guides/APPROVAL-WORKFLOW.md](guides/APPROVAL-WORKFLOW.md)

**Use MCP tools in VS Code**
→ [api/MCP-TOOLS.md](api/MCP-TOOLS.md)

**Configure the system**
→ [operations/CONFIG.md](operations/CONFIG.md)

**Deploy to production**
→ [operations/DEPLOYMENT.md](operations/DEPLOYMENT.md)

**Troubleshoot issues**
→ [operations/TROUBLESHOOTING.md](operations/TROUBLESHOOTING.md)

**Understand architectural decisions**
→ [adr/](adr/) folder

**Contribute code**
→ [CONTRIBUTING.md](../CONTRIBUTING.md)

**Learn system architecture and design patterns**
→ [ARCHITECTURE.md](ARCHITECTURE.md)


## 📖 Documentation Standards

All documentation follows these conventions:

- **Markdown format** (.md)
- **Clear headings** (H1 for title, H2+ for sections)
- **Code examples** in fenced blocks with language
- **Links** to related documentation
- **Table of contents** for long docs
- **Search-friendly** titles and descriptions

---

## 🔄 Keeping Docs Updated

Documentation should be updated when:
- Code changes are made
- New features are added
- Bugs are fixed
- Configuration changes
- Deployment processes change

**How to update:**
1. Edit relevant .md files
2. Update CHANGELOG.md if user-facing
3. Create/update ADR if architectural decision
4. Cross-reference related docs

---

**Last Updated:** January 20, 2026
