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
# See: https://docs.continue.dev/yaml-reference
RUN mkdir -p /home/node/.continue/configs && \
    echo 'name: Dev Toolbox' > /home/node/.continue/configs/config.yaml && \
    echo 'version: 0.0.1' >> /home/node/.continue/configs/config.yaml && \
    echo 'schema: v1' >> /home/node/.continue/configs/config.yaml && \
    echo 'models:' >> /home/node/.continue/configs/config.yaml && \
    echo '  - name: qwen2.5-coder' >> /home/node/.continue/configs/config.yaml && \
    echo '    provider: ollama' >> /home/node/.continue/configs/config.yaml && \
    echo '    model: qwen2.5-coder:7b' >> /home/node/.continue/configs/config.yaml && \
    echo '    apiBase: http://localhost:11434' >> /home/node/.continue/configs/config.yaml && \
    echo '    roles:' >> /home/node/.continue/configs/config.yaml && \
    echo '      - chat' >> /home/node/.continue/configs/config.yaml && \
    echo '      - edit' >> /home/node/.continue/configs/config.yaml && \
    chown -R node:node /home/node/.continue

WORKDIR /workspace

# Note: package.json is copied and installed via postCreateCommand
# This allows the container to work with any project structure

CMD ["bash"]
