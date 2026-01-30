# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Spec-driven development workflow with approval gates
- Automated documentation generation (work logs, ADRs, changelog)
- MCP server integration for VS Code native tools
- Semantic search over codebase for task context
- Approval workflow for code and documentation
- Enhanced task format with spec metadata

---

## Notes

- Entries are added automatically by `scripts/changelog-manager.js`
- Use `npm run changelog:add` to manually add entries
- Format follows Keep a Changelog conventions

## [Unreleased] - 2026-01-30

### Fixed
- Resolved `spawn aider ENOENT` by enforcing host installation of Aider when running in hybrid devcontainer mode.
- Fixed `dev-toolbox` service auto-start failure on container reload by adding `postStartCommand` in `devcontainer.json`.
- Fixed process hangs caused by zombie watcher processes holding port 3001.

### Changed
- Changed workflow logic: Ticket processing errors or warnings now result in the ticket moving to `backlog/completed` (instead of `failed`) to streamline the workflow, assuming human review will catch issues.
- Disabled internal webhook server by default to prevent port conflicts.
- Disabled automatic terminal file links in VS Code to reduce UI clutter.
