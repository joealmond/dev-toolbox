#!/bin/bash
# Install script to copy dotfiles to dev01dot directory

set -e

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/Users/mandulaj/dev/dev01dot"

echo "📦 Installing dotfiles template..."
echo "   Source: $SOURCE_DIR"
echo "   Target: $TARGET_DIR"
echo ""

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Error: Target directory does not exist: $TARGET_DIR"
    echo "   Create it first: mkdir -p $TARGET_DIR"
    exit 1
fi

# Check if target directory is empty
if [ "$(ls -A $TARGET_DIR)" ]; then
    echo "⚠️  Warning: Target directory is not empty!"
    echo "   Files will be overwritten. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

# Copy files
echo "Copying files..."
cp -v "$SOURCE_DIR/.chezmoi.toml" "$TARGET_DIR/"
cp -v "$SOURCE_DIR/dot_gitconfig.tmpl" "$TARGET_DIR/"
cp -v "$SOURCE_DIR/dot_bash_aliases" "$TARGET_DIR/"
mkdir -p "$TARGET_DIR/dot_ssh"
cp -v "$SOURCE_DIR/dot_ssh/config.tmpl" "$TARGET_DIR/dot_ssh/"
cp -v "$SOURCE_DIR/README.md" "$TARGET_DIR/"

echo ""
echo "✅ Dotfiles template installed!"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. Edit .chezmoi.toml with your actual information"
echo "  3. Review and customize the template files"
echo "  4. git init && git add . && git commit -m 'Initial dotfiles'"
echo "  5. (Optional) Push to your Gitea repo for remote sync"
echo ""
echo "To test the dotfiles:"
echo "  chezmoi init --source=$TARGET_DIR"
echo "  chezmoi diff --source=$TARGET_DIR"
echo "  chezmoi apply --source=$TARGET_DIR"
echo ""
