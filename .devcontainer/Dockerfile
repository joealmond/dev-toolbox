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

# Pin npm version first (separate step to avoid EMFILE errors)
RUN npm install -g npm@11.7.0

# Install global tools one at a time to avoid "too many open files" errors
# Using --maxsockets=2 to limit concurrent connections
RUN npm install -g pm2 --maxsockets=2
RUN npm install -g backlog.md --maxsockets=2
# @kilocode/cli v0.12.1 is pinned - v0.13.0+ has Ollama provider bug
RUN npm install -g @kilocode/cli@0.12.1 --maxsockets=2

# Pre-configure Kilo Code CLI to use Ollama (can be overridden by user)
# Config location: ~/.kilocode/cli/config.json
RUN mkdir -p /home/node/.kilocode/cli && \
    echo '{"version":"1.0.0","mode":"code","telemetry":false,"provider":"default","providers":[{"id":"default","provider":"ollama","ollamaBaseUrl":"http://host.containers.internal:11434","ollamaModelId":"qwen2.5-coder:7b","ollamaNumCtx":16384}]}' > /home/node/.kilocode/cli/config.json && \
    chown -R node:node /home/node/.kilocode

WORKDIR /workspace

# Note: package.json is copied and installed via postCreateCommand
# This allows the container to work with any project structure

CMD ["bash"]
