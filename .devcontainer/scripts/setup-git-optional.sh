#!/bin/bash
# Initialize git repository if needed (optional)
# This is for the app project, not the dev-toolbox itself

set -e

# Check if git repo already exists
if [ -d .git ]; then
    echo "✅ Git repository already exists"
    exit 0
fi

# Ask user if they want to initialize git
echo "📦 No git repository found in /workspaces/app"
echo ""
echo "Dev-toolbox tracks tasks in its own backlog folder."
echo "Your app code can optionally have its own git repo."
echo ""
read -p "Initialize git repository for this app? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Initializing git repository..."
    
    git init
    
    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
npm-debug.log*

# Environment
.env
.env.local

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
.idea/

# OS
.DS_Store
Thumbs.db

# Aider
.aider*

# Build
dist/
build/
*.log
EOF
        echo "✅ Created .gitignore"
    fi
    
    # Add .aider* to .gitignore if not present
    if ! grep -q ".aider" .gitignore 2>/dev/null; then
        echo ".aider*" >> .gitignore
        echo "✅ Added .aider* to .gitignore"
    fi
    
    # Check if git user is configured
    if ! git config user.name &> /dev/null; then
        echo ""
        echo "⚠️  Git user not configured. Set with:"
        echo "   git config user.name 'Your Name'"
        echo "   git config user.email 'you@example.com'"
    else
        echo "✅ Git user: $(git config user.name) <$(git config user.email)>"
    fi
    
    echo "✅ Git repository initialized"
else
    echo "⏭️  Skipping git initialization"
fi
