# Dotfiles Template for dev01

This directory contains **example/template dotfiles** that can be used with chezmoi. These files have been applied to the actual dotfiles repository at `/Users/mandulaj/dev/dev01dot`.

**Status**: ✅ Already applied to dev01dot repository

## Quick Setup

Copy these files to your dotfiles directory:

```bash
# On your host machine:
cp -r /Users/mandulaj/dev/dev01/dotfiles-template/* /Users/mandulaj/dev/dev01dot/
cd /Users/mandulaj/dev/dev01dot
git init
git add .
git commit -m "Initial dotfiles setup"
```

## Structure

```
.
├── .chezmoi.toml           # Chezmoi configuration
├── dot_gitconfig.tmpl      # Git configuration (template)
├── dot_bash_aliases        # Bash aliases
├── dot_ssh/
│   └── config.tmpl         # SSH configuration (template)
└── README.md               # This file
```

## Chezmoi Naming Convention

- `dot_` prefix → creates `.` file (e.g., `dot_gitconfig` → `~/.gitconfig`)
- `.tmpl` suffix → template file (variables replaced on apply)
- `private_` prefix → file mode 0600
- `executable_` prefix → file mode 0755

## Customize Before Using

1. Edit `.chezmoi.toml` with your name, email, and SSH hosts
2. Review `dot_gitconfig.tmpl` and `dot_ssh/config.tmpl`
3. Add any additional aliases to `dot_bash_aliases`

## Apply Dotfiles

```bash
# Initialize chezmoi with this directory
chezmoi init --source=/Users/mandulaj/dev/dev01dot

# Preview what will be applied
chezmoi diff --source=/Users/mandulaj/dev/dev01dot

# Apply dotfiles
chezmoi apply --source=/Users/mandulaj/dev/dev01dot
```
