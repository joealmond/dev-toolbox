FROM node:24-alpine

# Install git and other essentials plus Python build dependencies for Aider
RUN apk add --no-cache \
    git \
    bash \
    curl \
    ca-certificates \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    musl-dev \
    linux-headers

# Install global tools one at a time to avoid "too many open files" errors
RUN npm install -g backlog.md --maxsockets=2
RUN npm install -g pm2 --maxsockets=2

# Install Aider AI coding assistant (works great with Ollama)
# v0.86.1 is latest stable with excellent Ollama support
RUN pip3 install --break-system-packages aider-chat==0.86.1

# Configure Aider for Ollama (config at ~/.aider.conf.yml)
# See: https://aider.chat/docs/config/aider_conf.html
RUN echo 'model: ollama/qwen2.5-coder:7b' > /root/.aider.conf.yml && \
    echo 'auto-commits: false' >> /root/.aider.conf.yml && \
    echo 'git: false' >> /root/.aider.conf.yml && \
    echo 'gitignore: false' >> /root/.aider.conf.yml

# Set working directory
WORKDIR /workspace

# Create necessary directories
RUN mkdir -p /workspace/backlog/todo \
    /workspace/backlog/doing \
    /workspace/backlog/failed \
    /workspace/backlog/review \
    /workspace/backlog/completed \
    /workspace/repos \
    /workspace/logs

# Copy package files
COPY package*.json ./

# Install dependencies (includes @modelcontextprotocol/sdk, minisearch, etc.)
RUN npm ci --only=production

# Copy application code
COPY scripts ./scripts
COPY config.json ./

# Set git config defaults (will be overridden by environment)
RUN git config --global user.name "Dev-Toolbox" && \
    git config --global user.email "processor@localhost"

# Expose webhook port
EXPOSE 3001

# Default command (can be overridden)
CMD ["node", "scripts/watcher.js"]
