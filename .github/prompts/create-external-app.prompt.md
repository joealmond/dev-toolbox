---
description: Set up a new external application project with dev-toolbox as hidden tooling
mode: agent
tools: ['editFiles', 'runTerminal']
---

# Create New App with Dev-Toolbox Tooling

Create a new application project that uses dev-toolbox as an invisible tooling layer.

## Information Needed

I need the following to set up your project:

1. **Project name** - What should the project be called?
2. **Project location** - Where should the project be created? (default: `~/projects/<name>`)
3. **Dev-toolbox path** - Where is dev-toolbox installed? (e.g., `/home/user/dev/dev-toolbox`)
4. **Project type** - nodejs, python, or generic

## Steps I Will Perform

1. Create the project directory with `.devcontainer/` folder
2. Generate `devcontainer.json` configured for your environment
3. Create initial project structure (src/, package.json or similar)
4. Provide instructions to open in VS Code

## The Result

Your project will have:
- Clean workspace with NO tooling files visible
- All dev-toolbox scripts available in `$PATH`
- MCP server accessible for VS Code integration
- Connection to Ollama on host machine
- Task processing capabilities

After setup, open the project in VS Code and use "Reopen in Container".
