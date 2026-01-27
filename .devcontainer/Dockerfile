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

# Pin npm version and install global tools
# These are cached in the image, no download needed per container
# @kilocode/cli is the official Kilo Code CLI
RUN npm install -g npm@11.7.0 pm2 backlog.md @kilocode/cli

# Pre-configure Kilo Code CLI to use Ollama (can be overridden by user)
# Config location: ~/.kilocode/config.json
RUN mkdir -p /home/node/.kilocode && \
    echo '{"id":"default","provider":"ollama","ollamaBaseUrl":"http://host.containers.internal:11434","ollamaModelId":"deepseek-coder-v2:latest"}' > /home/node/.kilocode/config.json && \
    chown -R node:node /home/node/.kilocode

WORKDIR /workspace

# Note: package.json is copied and installed via postCreateCommand
# This allows the container to work with any project structure

CMD ["bash"]
