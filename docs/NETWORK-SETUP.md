# Network Setup Documentation

**Date:** February 1, 2026  
**Status:** ✅ Operational  
**Type:** Private VPN + Local DNS

## Overview

The dev-toolbox network infrastructure provides secure remote access to home lab services via **Tailscale VPN** and **Pi-hole DNS**. This setup enables seamless development workflow from anywhere while maintaining security.

## Architecture

### Core Components

1. **Tailscale VPN Network**
   - Secure mesh networking between devices
   - No router configuration required
   - Zero-trust architecture with device authentication

2. **Pi-hole DNS Server**
   - Local DNS resolution for `*.local` domains
   - Network-wide ad blocking
   - Running in Synology Container Manager

3. **SSH Remote Access**
   - Configured for Tailscale IP addresses
   - Integrated with chezmoi for dotfile management
   - Supports VS Code Remote-SSH development

## Active Network

### Tailscale Mesh Network

| Device | Hostname | Tailscale IP | Local IP | OS | Version | Role |
|--------|----------|-------------|----------|----|---------|----- |
| arkstead | arkstead | `100.86.209.36` | `192.168.0.5` | Linux 3.10.108 | 1.58.2-1 | NAS/Services |
| mandulaj-ms-7c02 | dev-pc | `100.71.172.94` | `192.168.0.10` | Linux 6.8.0-90-generic | 1.94.1 | Development |
| mj-macbook-pro-16 | macbook | `100.113.21.41` | Dynamic | macOS 26.2.0 | 1.94.1 | Client |

### Services Access

| Service | Local URL | Tailscale Access | Purpose |
|---------|-----------|------------------|---------|
| Synology NAS | `http://192.168.0.5:5000` | `http://100.86.209.36:5000` | File management |
| Pi-hole Admin | `http://192.168.0.5:8089` | `http://100.86.209.36:8089` | DNS management |
| Gitea | `http://gitea.local` | `http://100.86.209.36:3000` | Git repositories |
| Open WebUI | `http://ai.local` | `http://100.71.172.94:3000` | AI interface |
| SSH Dev PC | `ssh dev-pc.local` | `ssh 100.71.172.94` | Development |

## Configuration Details

### Tailscale Features Enabled

- **MagicDNS:** ✅ Automatic device name resolution
- **Split DNS:** ✅ Routes `mandulaj.stream` domains through Tailscale
- **Subnet Routing:** ❌ (Not needed - direct device access)
- **Exit Node:** ❌ (Not configured)

### Pi-hole Configuration

**Container Details:**
- **Image:** `pihole/pihole:latest`
- **Network:** Host mode
- **Persistent Storage:** `/volume1/docker/pihole`
- **Web Interface:** Port 8089

**DNS Records:**
```
gitea.local     → 192.168.0.5
ai.local        → 192.168.0.10
router.local    → 192.168.0.1
```

**Network Settings:**
- **Primary DNS:** Pi-hole (192.168.0.5)
- **Secondary DNS:** Cloudflare (1.1.1.1)
- **DHCP:** Managed by Omada Controller

### SSH Configuration

**Multi-Path Access Strategy:**
Your SSH config provides redundant access methods for each host:

```ssh
# NAS (arkstead) - 3 access methods:
Host nas              # Local network: 192.168.0.5
Host nas-tailscale    # Tailscale: 100.86.209.36  
Host nas-cf           # Cloudflare tunnel: ssh.mandulaj.stream

# Dev PC (Linux Mint) - 4 access methods:
Host mint             # Local network: 192.168.0.10
Host mint-tailscale   # Direct Tailscale: 100.71.172.94
Host mint-ts          # Tailscale via NAS jump: ProxyJump nas-tailscale
Host mint-remote      # Cloudflare via NAS jump: ProxyJump nas
```

**Key Features:**
- **Managed via chezmoi:** All changes tracked in dotfiles repo
- **VS Code Remote-SSH compatible:** Direct Tailscale connections work best
- **Redundancy:** Multiple paths ensure connectivity from any location
- **Jump hosts:** NAS as secure gateway for additional security layer
- **Agent forwarding:** SSH keys available on remote hosts

## Security Model

### Authentication
- **Tailscale:** OAuth-based device authentication via Google account
- **SSH:** Key-based authentication with agent forwarding
- **Services:** Local network security + VPN layer

### Network Isolation
- **Internet:** Only outbound connections allowed
- **VPN Access:** Device-to-device mesh, no internet routing
- **Local LAN:** Full access when on home network

### Monitoring
- **Tailscale:** Admin console shows device status and connections
- **Pi-hole:** Query logs show DNS resolution and blocking
- **SSH:** Standard system logs via journalctl

## Usage Patterns

### Daily Development
1. Connect to Tailscale on mobile/remote device
2. SSH options (choose based on location):
   - **Local:** `ssh mint` (LAN speed)
   - **Remote:** `ssh mint-tailscale` (direct Tailscale)
   - **Secure:** `ssh mint-ts` (via NAS jump host)
3. Use VS Code Remote-SSH with `mint-tailscale` for best performance
4. Access services via Tailscale IPs or local domains

### Administration
1. Access Synology NAS:
   - **Local:** `ssh nas` or web UI `http://192.168.0.5:5000`
   - **Remote:** `ssh nas-tailscale` or `http://100.86.209.36:5000`
2. Manage Pi-hole via `http://100.86.209.36:8089`
3. Check Tailscale status at https://login.tailscale.com/admin

### Local Network
- All local domains (*.local) resolve via Pi-hole
- Ad blocking active on all devices using Pi-hole DNS
- LAN speeds for local file transfers

## Future Enhancements

### Phase 4: Custom Domains
- **Goal:** Replace MagicDNS with custom domain names
- **Method:** Configure Tailscale to use custom DNS suffixes
- **Benefit:** Cleaner URLs like `dev.home` instead of `machine-name-123.tailnet-abc.ts.net`

### WireGuard Alternative
- **Status:** Paused due to Omada routing complexity
- **Alternative:** Consider Headscale (self-hosted Tailscale) for full control
- **Use Case:** If Tailscale commercial limits become restrictive

## Troubleshooting

### Common Issues

**Device Not Accessible:**
1. Check Tailscale status: `tailscale status`
2. Verify device is online in admin console
3. Test ping to Tailscale IP

**SSH Connection Fails:**
1. Verify AllowTcpForwarding in `/etc/ssh/sshd_config`
2. Restart SSH service: `sudo systemctl restart ssh`
3. Check SSH logs: `journalctl -u ssh`

**DNS Resolution Issues:**
1. Check Pi-hole is running in Container Manager
2. Verify DHCP DNS settings in Omada Controller  
3. Flush DNS cache: `sudo resolvectl flush-caches`

### Monitoring Commands

```bash
# Tailscale status
tailscale status

# SSH service status  
sudo systemctl status ssh

# Pi-hole container logs
docker logs pihole

# Network connectivity test
ping 100.86.209.36  # NAS via Tailscale
curl http://100.71.172.94:3000  # Open WebUI via Tailscale
```

## Implementation Timeline

- **2026-01-30:** Pi-hole deployed and configured
- **2026-01-31:** Tailscale container deployed on NAS  
- **2026-02-01:** All devices connected, SSH configured, documentation completed
- **Future:** Custom domains and additional enhancements

---

**Related Files:**
- [plans/NETWORK-SETUP-PLAN.md](plans/NETWORK-SETUP-PLAN.md) - Implementation guide
- [CURRENT-STATUS.md](CURRENT-STATUS.md) - System status
- [PROJECT-VISION.md](PROJECT-VISION.md) - Roadmap and phases