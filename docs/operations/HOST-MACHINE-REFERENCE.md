# 🖥️ Host Machine Reference

**Machine:** LLM Development Server  
**Last Updated:** January 24, 2026  
**Purpose:** Run Ticket Processor DevContainer with Kilo Code + Ollama

---

## System Specifications

| Component | Details |
|-----------|---------|
| **OS** | Linux Mint 22.3 (Zena) |
| **Kernel** | 6.8.0-90-generic |
| **CPU Architecture** | x86_64 (amd64) |
| **RAM** | 32 GB DDR |
| **GPU** | NVIDIA GeForce RTX 3090 (24 GB VRAM) |
| **GPU Driver** | 570.211.01 |
| **Local IP** | 192.168.0.10 |

---

## Storage Configuration

### Disk Layout

| Device | Size | Type | Mount | Purpose |
|--------|------|------|-------|---------|
| `nvme0n1p7` | 80 GB | NVMe SSD | `/` (root) | OS + Applications |
| `nvme0n1p2` | 200 MB | NVMe SSD | `/boot/efi` | EFI Boot |
| `sda1` | 465 GB | SATA SSD | *(unmounted)* | Available for data |
| `sdb3` | 3.6 TB | HDD (NTFS) | `/mnt/hdd` | LLM data storage |

### LLM Data Storage

The 4TB HDD is mounted and configured for LLM workloads:

| Path | Purpose |
|------|---------|
| `/mnt/hdd` | Mount point for 4TB HDD |
| `/mnt/hdd/llm-data/ollama` | Ollama model storage |
| `/mnt/hdd/llm-data/podman` | Podman container images |

**Auto-mount in `/etc/fstab`:**
```
UUID=06D22FBBD22FAE3D /mnt/hdd ntfs-3g defaults,remove_hiberfile,nofail 0 0
```

### System Optimizations

#### 1. Swap File (8 GB) - Memory Safety Buffer
- **Location:** `/swapfile` on NVMe SSD
- **Purpose:** Prevents OOM Killer crashes during peak VRAM-to-RAM offloading
- **Status:** ✅ Active

#### 2. ZRAM - RAM Compression
- **Package:** `zram-config`
- **Purpose:** Compressed swap in RAM, reduces reliance on slower disk storage
- **Benefit:** More efficient use of 32GB RAM for LLM workloads
- **Status:** ✅ Installed

#### 3. Storage Path Redirection
- **Ollama models:** `/mnt/hdd/llm-data/ollama`
- **Podman images:** `/mnt/hdd/llm-data/podman/storage`

```bash
# Verify storage locations
ollama info  # Shows OLLAMA_MODELS path
podman info --format '{{.Store.GraphRoot}}'  # Shows storage path
```

---

## Installed Software

### Container Runtime

| Software | Version | Status |
|----------|---------|--------|
| **Podman** | 4.9.3 | ✅ Installed |
| **nvidia-container-toolkit** | Latest | ✅ Installed |

```bash
# Verify GPU in containers
podman run --rm --device nvidia.com/gpu=all \
  nvidia/cuda:12.0.0-base-ubuntu22.04 nvidia-smi
```

### LLM Infrastructure

| Software | Version | Status |
|----------|---------|--------|
| **Ollama** | Latest | ✅ Installed & Running |
| **Ollama Service** | systemd | ✅ Enabled |

```bash
# Service status
sudo systemctl status ollama

# API check
curl http://localhost:11434/api/tags
```

#### Recommended Ollama Models (RTX 3090)

| Model | Size | Context | Purpose |
|-------|------|---------|---------|
| `glm-4.7-flash:q3_k_m` | 14.5GB | 48k | General coding |
| `qwen2.5-coder:32b-q4` | 17GB | 38k | Multi-language |
| `deepseek-coder:33b-q4` | 18GB | 32k | Complex algorithms |

```bash
ollama pull qwen2.5-coder:32b
ollama pull deepseek-coder:6.7b  # Fast for simple tasks
```

### Development Tools

| Software | Version | Status |
|----------|---------|--------|
| **Node.js** | v24.13.0 | ✅ Installed |
| **npm** | 11.6.2 | ✅ Installed |
| **PM2** | 6.0.14 | ✅ Installed |
| **kodu** (Kilo Code CLI) | Latest | ✅ Installed |
| **backlog.md** | Latest | ✅ Installed |
| **Git** | (system) | ✅ Installed |
| **cloudflared** | Latest | ✅ Installed |

---

## Network Configuration

### Service Ports

| Port | Service | Binding | Status |
|------|---------|---------|--------|
| 11434 | Ollama API | `0.0.0.0` | ✅ All interfaces |
| 3000 | Gitea | `0.0.0.0` | When running |
| 3001 | Webhook Server | `0.0.0.0` | When running |
| 3002 | MCP Server | `0.0.0.0` | When running |
| 8080 | code-server | `0.0.0.0` | Optional |

### Ollama Network Configuration

Ollama listens on all interfaces for container and remote access:

```bash
# Override file location
/etc/systemd/system/ollama.service.d/override.conf

# Content
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/mnt/hdd/llm-data/ollama"
```

### Firewall Status

UFW is **inactive** - no firewall rules blocking local network access.

---

## Remote Access

### Local Network Access

From any machine on `192.168.0.x` network:

| Service | URL |
|---------|-----|
| Ollama API | `http://192.168.0.10:11434` |
| Gitea | `http://192.168.0.10:3000` |
| Webhook | `http://192.168.0.10:3001/health` |
| MCP Server | `http://192.168.0.10:3002` |
| code-server | `http://192.168.0.10:8080` |

### Cloudflare Tunnel

| Component | Details |
|-----------|---------|
| **Tunnel Host** | Synology NAS (192.168.0.5) |
| **cloudflared on server** | Installed (backup) |

The Cloudflare tunnel runs on the Synology NAS, which proxies traffic to this dev server.

---

## Service Management

```bash
# Ollama
sudo systemctl status ollama
sudo systemctl restart ollama
ollama list                    # List models
ollama pull <model>            # Download model
ollama run <model>             # Test model
ollama ps                      # Check GPU usage

# Podman
podman ps                      # List running containers
podman images                  # List images
podman system prune -a         # Clean up

# GPU Monitoring
nvidia-smi                     # One-time check
watch -n 1 nvidia-smi          # Live monitoring

# Node.js apps
pm2 list                       # List processes
pm2 logs                       # View logs
pm2 restart all                # Restart all

# Cloudflare Tunnel
sudo systemctl status cloudflared
cloudflared tunnel list
```

---

## Known Issues & Notes

1. **Root partition space:** Only 13GB free on 80GB SSD. All large data redirected to HDD.
2. **NTFS HDD:** Using `ntfs-3g` driver. May have permission quirks with Podman overlays.
3. **ZRAM vs Swap priority:** ZRAM has higher priority than disk swap for better performance.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-24 | Initial document creation |
| 2026-01-24 | Ollama configured for 0.0.0.0:11434 |
| 2026-01-24 | Storage redirected to /mnt/hdd |
| 2026-01-24 | Podman + nvidia-container-toolkit verified |
