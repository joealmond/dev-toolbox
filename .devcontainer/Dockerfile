# Dev-Toolbox DevContainer
# Compatible with both Docker and Podman
# Using Alpine to avoid Podman + Debian GPG signature issues
FROM node:24-alpine

# Alpine-based image needs these packages
# (Alpine uses apk, not apt - no GPG issues with Podman)
RUN apk add --no-cache \
    bash \
    git \
    curl \
    openssh-client \
    jq \
    vim \
    shadow

# Ensure node user home directory exists with proper permissions
RUN mkdir -p /home/node/.ssh && \
    chown -R node:node /home/node && \
    chmod 700 /home/node/.ssh

# Install cloudflared for remote tunnel access
RUN curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
  && chmod +x /usr/local/bin/cloudflared

# Install Python and pip for Aider with build dependencies
# Build deps needed for tree-sitter-language-pack, psutil
RUN apk add --no-cache python3 py3-pip python3-dev gcc musl-dev linux-headers

# Pin npm version first (separate step to avoid EMFILE errors)
RUN npm install -g npm@11.7.0

# Install global tools one at a time to avoid "too many open files" errors
RUN npm install -g pm2 --maxsockets=2
RUN npm install -g backlog.md --maxsockets=2

# Install Aider (AI coding assistant for terminal)
# v0.86.1 is latest stable with excellent Ollama support
RUN pip3 install --break-system-packages aider-chat==0.86.1

# Configure Aider for Ollama (config at ~/.aider.conf.yml)
# See: https://aider.chat/docs/config/aider_conf.html
RUN echo 'model: ollama/qwen2.5-coder:7b' > /home/node/.aider.conf.yml && \
    echo 'auto-commits: false' >> /home/node/.aider.conf.yml && \
    echo 'git: false' >> /home/node/.aider.conf.yml && \
    echo 'gitignore: false' >> /home/node/.aider.conf.yml && \
    echo 'yes: true' >> /home/node/.aider.conf.yml && \
    echo 'check-update: false' >> /home/node/.aider.conf.yml && \
    chown node:node /home/node/.aider.conf.yml

# Configure Continue for Ollama (no account needed)
# Uses YAML config at ~/.continue/configs/config.yaml
# AUTODETECT will find installed Ollama models automatically
RUN mkdir -p /home/node/.continue/configs && \
    printf 'name: Local Config\nversion: 1.0.0\nschema: v1\nmodels:\n  - name: Autodetect\n    provider: ollama\n    model: AUTODETECT\n    apiBase: http://localhost:11434\n    roles:\n      - chat\n      - edit\n      - apply\n      - autocomplete\n' > /home/node/.continue/configs/config.yaml && \
    chown -R node:node /home/node/.continue

WORKDIR /workspace

# Note: package.json is copied and installed via postCreateCommand
# This allows the container to work with any project structure

CMD ["bash"]
