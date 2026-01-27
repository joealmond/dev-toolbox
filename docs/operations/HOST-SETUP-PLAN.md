# 🚀 Complete Setup Plan: Ticket Processor on Linux Host

**Created:** January 24, 2026  
**Goal:** Set up Ticket Processor DevContainer on Linux with Podman + Ollama RTX 3090  
**Host Reference:** See [HOST-MACHINE-REFERENCE.md](HOST-MACHINE-REFERENCE.md) for system specs.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🧑 **[Manual]** | Requires physical/manual action |
| 🤖 **[Script]** | Can be automated/scripted |
| ✅ | Completed |
| ⬜ | To do |

---

## Phase 0: GPU Optimization (Do FIRST!)

> ⚠️ Without this, Ollama only uses 2-4k context, wasting your RTX 3090.

### 0.1 Create Optimized Ollama Model

- [ ] 🤖 **[Script]** Pull base model
  ```bash
  ollama pull glm-4.7-flash:q3_k_m
  ```

- [ ] 🤖 **[Script]** Create Modelfile for 48k context
  ```bash
  cat > ~/Modelfile << 'EOF'
  FROM glm-4.7-flash:q3_k_m
  PARAMETER num_ctx 48128
  PARAMETER temperature 0.3
  PARAMETER stop "<|endoftext|>"
  PARAMETER stop "<|user|>"
  SYSTEM """You are an expert coding agent. You have 48k context.
  Read all file context before answering. Write clean, tested code."""
  EOF
  ```

- [ ] 🤖 **[Script]** Build custom model
  ```bash
  ollama create glmcoder -f ~/Modelfile
  ```

- [ ] 🧑 **[Manual]** Verify 100% GPU usage
  ```bash
  ollama run glmcoder "Hello"
  # In another terminal:
  ollama ps  # Should show 100% GPU
  ```

### 0.2 Alternative Models

```bash
# For variety/testing
ollama pull qwen2.5-coder:32b
ollama pull deepseek-coder:6.7b  # Fast for simple tasks
```

---

## Phase 1: Linux Host Configuration

### 1.1 Prerequisites Check

- [x] ✅ Podman installed: **v4.9.3**
- [x] ✅ NVIDIA drivers working: **RTX 3090**, Driver **570.211.01**
- [x] ✅ nvidia-container-toolkit installed
- [x] ✅ Ollama installed and running as systemd service
- [x] ✅ Node.js installed: **v24.13.0**
- [x] ✅ npm installed: **v11.6.2**
- [x] ✅ cloudflared installed

### 1.2 Configure Ollama for Network Access

- [x] ✅ 🤖 **[Script]** Configure Ollama to listen on all interfaces
  ```bash
  sudo mkdir -p /etc/systemd/system/ollama.service.d
  sudo tee /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
  [Service]
  Environment="OLLAMA_HOST=0.0.0.0:11434"
  Environment="OLLAMA_MODELS=/mnt/hdd/llm-data/ollama"
  EOF
  sudo systemctl daemon-reload
  sudo systemctl restart ollama
  ```

### 1.3 Storage Redirection

- [x] ✅ 🧑 **[Manual]** Mount 4TB HDD
  ```bash
  sudo mkdir -p /mnt/hdd
  sudo mount -t ntfs-3g /dev/sdb3 /mnt/hdd
  ```

- [x] ✅ 🤖 **[Script]** Add to fstab for auto-mount
  ```bash
  echo 'UUID=06D22FBBD22FAE3D /mnt/hdd ntfs-3g defaults,remove_hiberfile,nofail 0 0' | sudo tee -a /etc/fstab
  ```

- [x] ✅ 🤖 **[Script]** Create LLM data directories
  ```bash
  sudo mkdir -p /mnt/hdd/llm-data/ollama
  sudo mkdir -p /mnt/hdd/llm-data/podman/storage
  sudo chown -R $USER:$USER /mnt/hdd/llm-data
  ```

- [x] ✅ 🤖 **[Script]** Configure Podman storage
  ```bash
  mkdir -p ~/.config/containers
  cat > ~/.config/containers/storage.conf << 'EOF'
  [storage]
  driver = "overlay"
  graphroot = "/mnt/hdd/llm-data/podman/storage"
  EOF
  ```

### 1.4 Memory Safety (Swap + ZRAM)

- [x] ✅ 🤖 **[Script]** Create 8GB swap file
  ```bash
  sudo fallocate -l 8G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

- [x] ✅ 🤖 **[Script]** Install ZRAM
  ```bash
  sudo apt install zram-config
  sudo systemctl enable zram-config
  ```

### 1.5 Install Global Tools

- [x] ✅ 🤖 **[Script]** Install npm packages globally
  ```bash
  sudo npm install -g pm2 kodu backlog.md
  ```

---

## Phase 2: Project Setup

### 2.1 Clone Repository

- [ ] 🧑 **[Manual]** Clone the repository
  ```bash
  mkdir -p ~/dev
  cd ~/dev
  git clone <your-repo-url> dev-toolbox
  cd dev-toolbox
  ```

### 2.2 Environment Configuration

- [ ] 🧑 **[Manual]** Create .env file
  ```bash
  cp .env.example .env
  nano .env   # Edit with your values
  ```

### 2.3 Install Dependencies

- [ ] 🤖 **[Script]** Install npm dependencies
  ```bash
  npm install
  ```

### 2.4 Build Semantic Index

- [ ] 🤖 **[Script]** Build search index
  ```bash
  npm run index:build
  ```

---

## Phase 3: DevContainer Setup

### 3.1 Open in VS Code

- [ ] 🧑 **[Manual]** Open folder in VS Code
  ```bash
  code ~/dev/dev-toolbox
  ```

- [ ] 🧑 **[Manual]** Reopen in Container
  - Press `F1` → "Dev Containers: Reopen in Container"
  - Wait for container build

### 3.2 Verify Container

- [ ] 🤖 **[Script]** Test Ollama connectivity
  ```bash
  curl http://host.containers.internal:11434/api/tags
  ```

- [ ] 🤖 **[Script]** Test Kilo Code
  ```bash
  kodu --help
  ```

---

## Phase 4: Local Network Access

### 4.1 Find Server IP

- [ ] 🧑 **[Manual]** Get local IP
  ```bash
  ip addr show | grep "inet " | grep -v 127.0.0.1
  # Note: 192.168.0.10
  ```

### 4.2 Test From Laptop

From your laptop on the same network:

- [ ] 🧑 **[Manual]** Test Ollama
  ```bash
  curl http://192.168.0.10:11434/api/tags
  ```

### 4.3 VS Code Remote Options

**Option A: SSH Remote (Recommended)**
```bash
# On server
sudo apt install openssh-server
sudo systemctl enable ssh

# From laptop VS Code
# Install "Remote - SSH" extension
# Connect to ssh://user@192.168.0.10
```

**Option B: code-server (Web VS Code)**
```bash
curl -fsSL https://code-server.dev/install.sh | sh
sudo systemctl enable --now code-server@$USER
# Access: http://192.168.0.10:8080
```

---

## Phase 5: Remote Access (Cloudflare Tunnel)

### 5.1 Network Topology

```
Internet → Cloudflare → Synology NAS (192.168.0.5) → Dev Server (192.168.0.10)
                         cloudflared                    :11434 Ollama
                                                        :3000 Gitea
                                                        :3001 Webhook
                                                        :3002 MCP
```

### 5.2 Configure on Synology NAS

- [ ] 🧑 **[Manual]** Add routes in Cloudflare Zero Trust dashboard:

| Public Hostname | Service URL |
|-----------------|-------------|
| `code.yourdomain.com` | `http://192.168.0.10:8080` |
| `git.yourdomain.com` | `http://192.168.0.10:3000` |
| `ollama.yourdomain.com` | `http://192.168.0.10:11434` |

### 5.3 Security

- [ ] 🧑 **[Manual]** Add Cloudflare Access policies for Ollama
  - Don't expose LLM API publicly without authentication!

---

## Phase 6: Start Services

### 6.1 Start Dev-Toolbox

- [ ] 🤖 **[Script]** Start watcher with PM2
  ```bash
  pm2 start ecosystem.config.js
  pm2 save
  ```

### 6.2 Verify All Services

```bash
# Check processes
pm2 list

# Check Ollama
ollama ps

# Check containers
podman ps

# Check GPU
nvidia-smi
```

---

## Quick Reference

### Service Commands

```bash
# Ollama
sudo systemctl restart ollama
ollama list
ollama ps

# PM2
pm2 list
pm2 logs
pm2 restart all

# Podman
podman ps
podman-compose up -d
podman-compose logs -f
```

### Test Full Workflow

```bash
# Create test task
npm run create-task

# Watch processing
pm2 logs

# Check backlog folders
ls backlog/*/
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Ollama slow | Spilled to CPU | Check `ollama ps`, reduce context |
| Container can't reach Ollama | Network binding | Ensure `OLLAMA_HOST=0.0.0.0:11434` |
| Out of disk space | Models on root | Redirect to `/mnt/hdd` |
| GPU not detected | Driver issue | Run `nvidia-smi` to check |

---

## Next Steps After Setup

1. ✅ Complete Phase 0 (GPU optimization) - **CRITICAL**
2. ✅ Complete Phase 1-2 (host + project setup)
3. ✅ Test DevContainer (Phase 3)
4. 🟡 Configure remote access when needed (Phase 4-5)
5. 🟡 Start services and test workflow (Phase 6)

---

*Document created: January 24, 2026*
