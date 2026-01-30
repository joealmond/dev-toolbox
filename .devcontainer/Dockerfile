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

# Configure Aider for Ollama - Reference Copy
# We place this in /etc so it survives volume mounts
RUN echo 'model: ollama/qwen2.5-coder:7b' > /etc/aider.conf.yml && \
    echo 'auto-commits: false' >> /etc/aider.conf.yml && \
    echo 'git: false' >> /etc/aider.conf.yml && \
    echo 'gitignore: false' >> /etc/aider.conf.yml && \
    echo 'yes-always: true' >> /etc/aider.conf.yml && \
    echo 'check-update: false' >> /etc/aider.conf.yml

# Also place in home (best effort, but volume might override)
RUN cp /etc/aider.conf.yml /home/node/.aider.conf.yml && \
    chown node:node /home/node/.aider.conf.yml

# Create directory for tooling
RUN mkdir -p /opt/tooling && chown node:node /opt/tooling

# Install node_modules in a separate directory so they don't get hidden by bind mounts
# We will symlink them or set NODE_PATH
RUN mkdir -p /opt/tooling-deps
COPY package.json /opt/tooling-deps/
RUN cd /opt/tooling-deps && npm install --production --no-bin-links

# Set NODE_PATH so scripts find modules even if /opt/tooling is mounted read-only
ENV NODE_PATH=/opt/tooling-deps/node_modules

# Copy the actual tooling code (will be overwritten by bind mount in dev, but good for standalone)
COPY . /opt/tooling/

WORKDIR /workspace

# Note: package.json is copied and installed via postCreateCommand
# This allows the container to work with any project structure

CMD ["bash"]
