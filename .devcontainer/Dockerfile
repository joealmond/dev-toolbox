# Dev-Toolbox DevContainer
# Compatible with both Docker and Podman
FROM node:24-bookworm

# The node:24-bookworm image already includes:
# - git, curl, ca-certificates, bash
# 
# We add only what's missing to minimize build issues
# on Podman + NTFS overlay filesystems

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssh-client \
    jq \
    vim \
  && rm -rf /var/lib/apt/lists/*

# Install cloudflared for remote tunnel access
RUN curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
  && chmod +x /usr/local/bin/cloudflared

# Pin npm version and install global tools
# These are cached in the image, no download needed per container
RUN npm install -g npm@11.7.0 pm2 backlog.md @kilocode/cli

WORKDIR /workspace

# Note: package.json is copied and installed via postCreateCommand
# This allows the container to work with any project structure

CMD ["bash"]
