FROM node:24-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    bash \
    openssh-client \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL https://ollama.com/install.sh | sh \
  && curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
  && chmod +x /usr/local/bin/cloudflared

# Pin npm version and install global npm tools (cached in image, no need to download per container)
RUN npm install -g npm@11.7.0 pm2 backlog.md @kilocode/cli

WORKDIR /workspace

COPY package*.json ./

RUN npm install

CMD ["bash"]
