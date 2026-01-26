#!/bin/bash
#
# new-project.sh - Create a new project with ticket-processor tooling
#
# This script creates a new project directory with a minimal devcontainer
# configuration that uses the ticket-processor tooling without polluting
# your project with tooling files.
#
# Usage:
#   ./scripts/new-project.sh <project-name> [project-path]
#
# Examples:
#   ./scripts/new-project.sh my-api
#   ./scripts/new-project.sh my-api ~/projects/my-api
#
# The project will be created with:
#   - A minimal .devcontainer/devcontainer.json
#   - Access to all ticket-processor tools via $PATH
#   - Ollama connectivity for AI-powered development
#   - Clean workspace without tooling files visible
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script lives (ticket-processor root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLING_ROOT="$(dirname "$SCRIPT_DIR")"

# Default project location
DEFAULT_PROJECTS_DIR="${HOME}/projects"

usage() {
    echo "Usage: $0 <project-name> [project-path]"
    echo ""
    echo "Arguments:"
    echo "  project-name    Name of the new project (required)"
    echo "  project-path    Full path for the project (optional)"
    echo "                  Default: ${DEFAULT_PROJECTS_DIR}/<project-name>"
    echo ""
    echo "Examples:"
    echo "  $0 my-api"
    echo "  $0 my-api ~/work/my-api"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -t, --type      Project type: node, python, generic (default: node)"
    echo ""
}

# Parse arguments
PROJECT_NAME=""
PROJECT_PATH=""
PROJECT_TYPE="node"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -t|--type)
            PROJECT_TYPE="$2"
            shift 2
            ;;
        *)
            if [[ -z "$PROJECT_NAME" ]]; then
                PROJECT_NAME="$1"
            elif [[ -z "$PROJECT_PATH" ]]; then
                PROJECT_PATH="$1"
            fi
            shift
            ;;
    esac
done

# Validate project name
if [[ -z "$PROJECT_NAME" ]]; then
    echo -e "${RED}Error: Project name is required${NC}"
    usage
    exit 1
fi

# Set project path
if [[ -z "$PROJECT_PATH" ]]; then
    PROJECT_PATH="${DEFAULT_PROJECTS_DIR}/${PROJECT_NAME}"
fi

# Check if project already exists
if [[ -d "$PROJECT_PATH" ]]; then
    echo -e "${YELLOW}Warning: Directory already exists: ${PROJECT_PATH}${NC}"
    read -p "Add devcontainer to existing project? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo -e "${BLUE}Creating project: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}Location: ${PROJECT_PATH}${NC}"
echo -e "${BLUE}Tooling from: ${TOOLING_ROOT}${NC}"
echo ""

# Create project directory structure
mkdir -p "${PROJECT_PATH}/.devcontainer"
mkdir -p "${PROJECT_PATH}/src"

# Create devcontainer.json
cat > "${PROJECT_PATH}/.devcontainer/devcontainer.json" << EOF
{
  "name": "${PROJECT_NAME}",
  
  // Use the ticket-processor Dockerfile for tooling
  "dockerFile": "${TOOLING_ROOT}/.devcontainer/Dockerfile",
  "context": "${TOOLING_ROOT}",
  
  // Your app is the main workspace - clean, no tooling files visible
  "workspaceFolder": "/workspaces/${PROJECT_NAME}",
  
  "remoteUser": "node",
  
  // Podman + Docker compatibility
  "runArgs": [
    "--userns=keep-id",
    "--security-opt=label=disable",
    "--add-host=host.containers.internal:host-gateway",
    "--add-host=host.docker.internal:host-gateway"
  ],
  
  "mounts": [
    // Your app code - this is the main workspace
    "source=\${localWorkspaceFolder},target=/workspaces/${PROJECT_NAME},type=bind",
    
    // Mount tooling scripts (read-only, hidden from your app)
    "source=${TOOLING_ROOT}/scripts,target=/opt/tooling/scripts,type=bind,readonly",
    "source=${TOOLING_ROOT}/config.json,target=/opt/tooling/config.json,type=bind,readonly",
    "source=${TOOLING_ROOT}/templates,target=/opt/tooling/templates,type=bind,readonly",
    "source=${TOOLING_ROOT}/package.json,target=/opt/tooling/package.json,type=bind,readonly",
    
    // Backlog folder for task processing (shared across projects)
    "source=${TOOLING_ROOT}/backlog,target=/opt/tooling/backlog,type=bind",
    
    // SSH keys for git operations
    "source=\${localEnv:HOME}/.ssh,target=/home/node/.ssh,type=bind,readonly"
  ],
  
  "remoteEnv": {
    "OLLAMA_HOST": "http://host.containers.internal:11434",
    "OLLAMA_API_BASE": "http://host.containers.internal:11434",
    "TOOLING_HOME": "/opt/tooling",
    "PATH": "/opt/tooling/scripts:\${containerEnv:PATH}"
  },
  
  "containerEnv": {
    "OLLAMA_HOST": "http://host.containers.internal:11434",
    "OLLAMA_API_BASE": "http://host.containers.internal:11434",
    "TOOLING_HOME": "/opt/tooling"
  },
  
  "postCreateCommand": "cd /opt/tooling && npm install --prefix /opt/tooling 2>/dev/null || true",
  
  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.defaultProfile.linux": "bash",
        "files.eol": "\\n",
        "code-runner.runInTerminal": true,
        "code-runner.saveFileBeforeRun": true,
        "dev.containers.dockerPath": "podman"
      },
      "extensions": [
        "kilocode.kilo-code",
        "github.copilot",
        "github.copilot-chat",
        "dbaeumer.vscode-eslint",
        "formulahendry.code-runner"
      ]
    }
  },
  
  "portsAttributes": {
    "3000": {
      "label": "App Server",
      "onAutoForward": "notify"
    },
    "3001": {
      "label": "Webhook Server",
      "onAutoForward": "silent"
    },
    "3002": {
      "label": "MCP Server", 
      "onAutoForward": "silent"
    }
  }
}
EOF

# Create project-specific files based on type
case $PROJECT_TYPE in
    node)
        if [[ ! -f "${PROJECT_PATH}/package.json" ]]; then
            cat > "${PROJECT_PATH}/package.json" << EOF
{
  "name": "${PROJECT_NAME}",
  "version": "0.1.0",
  "description": "",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
EOF
        fi
        
        if [[ ! -f "${PROJECT_PATH}/src/index.js" ]]; then
            cat > "${PROJECT_PATH}/src/index.js" << EOF
// ${PROJECT_NAME}
// Created with ticket-processor tooling

console.log('Hello from ${PROJECT_NAME}!');
EOF
        fi
        ;;
    
    python)
        if [[ ! -f "${PROJECT_PATH}/requirements.txt" ]]; then
            touch "${PROJECT_PATH}/requirements.txt"
        fi
        
        if [[ ! -f "${PROJECT_PATH}/src/main.py" ]]; then
            cat > "${PROJECT_PATH}/src/main.py" << EOF
#!/usr/bin/env python3
"""${PROJECT_NAME} - Created with ticket-processor tooling"""

def main():
    print(f"Hello from ${PROJECT_NAME}!")

if __name__ == "__main__":
    main()
EOF
        fi
        ;;
    
    generic|*)
        if [[ ! -f "${PROJECT_PATH}/README.md" ]]; then
            cat > "${PROJECT_PATH}/README.md" << EOF
# ${PROJECT_NAME}

Created with ticket-processor tooling.

## Getting Started

1. Open this folder in VS Code
2. Click "Reopen in Container" when prompted
3. Start developing!

## Available Tools

The following tools are available in your PATH:

- \`create-task.js\` - Create a new task
- \`create-spec.js\` - Create a spec-driven task
- \`watcher.js\` - Start the task watcher
- \`approval-handler.js\` - Manage approvals

All tools are mounted from the ticket-processor tooling at \`/opt/tooling\`.
EOF
        fi
        ;;
esac

# Create .gitignore if it doesn't exist
if [[ ! -f "${PROJECT_PATH}/.gitignore" ]]; then
    cat > "${PROJECT_PATH}/.gitignore" << EOF
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/

# Build outputs
dist/
build/
*.egg-info/

# IDE
.idea/
*.swp
*.swo

# Environment
.env
.env.local

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db
EOF
fi

echo ""
echo -e "${GREEN}✅ Project created successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  1. Open in VS Code:"
echo -e "     ${YELLOW}code ${PROJECT_PATH}${NC}"
echo ""
echo "  2. When prompted, click 'Reopen in Container'"
echo ""
echo "  3. Or from command palette:"
echo "     Dev Containers: Reopen in Container"
echo ""
echo -e "${BLUE}Available tooling commands (inside container):${NC}"
echo ""
echo "  create-task.js      - Create a new task"
echo "  create-spec.js      - Create a spec-driven task"
echo "  watcher.js          - Start the task processor"
echo "  approval-handler.js - Manage approvals"
echo ""
echo -e "${BLUE}Tooling location:${NC} /opt/tooling"
echo -e "${BLUE}Your workspace:${NC} /workspaces/${PROJECT_NAME}"
echo ""
