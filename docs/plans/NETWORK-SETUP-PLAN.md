# Phase 3: Network Architecture Setup Plan

**Status:** Planned
**Target Date:** February 2026
**Hardware:** Synology NAS, TP-Link ER605 (Omada), Dev Server

## 1. Overview

This plan details the implementation of a robust **Local DNS** and **VPN** solution for the `dev-toolbox` ecosystem. The goal is to enable seamless local access to development tools (Open WebUI, Gitea, Docs) using friendly domain names (e.g., `ai.local`) and secure remote access without exposing ports publicly.

## 2. Architecture Comparison

| Feature | **Cloudflare Tunnel** (Current) | **WireGuard VPN** (New) | **Local DNS** (New) |
| :--- | :--- | :--- | :--- |
| **Role** | Public Storefront | Private Back Door | Internal Phonebook |
| **Access** | Public Internet | Authenticated Device Only | LAN Only |
| **Routing** | Internet → Tunnel → NAS | Virtual Cable to Router | Local LAN Traffic |
| **Use Case** | Sharing Gitea repos, Blog | SSH, Managing Router, WebUI | Speed (1Gbps), Clean URLs |

## 3. Selected Components

### 3.1 Local DNS: Pi-hole (on Synology NAS)
**Why not Omada mDNS?**
Omada's mDNS feature is a simple repeater for device discovery (Bonjour), not a DNS server. It cannot create custom records like `gitea.local`. Pi-hole provides:
- Custom "Local DNS Records" (A Records).
- Network-wide Ad Blocking.
- Lightweight container footprint (~50MB).

### 3.2 VPN: WireGuard (on TP-Link ER605)
**Why on Router vs. NAS?**
Running VPN on the edge router (ER605) is safer and more efficient than port-forwarding to the NAS.
- Native integration in Omada Controller.
- Direct access to all LAN subnets.
- No port forwarding required to internal devices.

---

## 4. Implementation Steps

### Step 1: Deploy Pi-hole on Synology NAS (✅ COMPLETED)
1. Open **Container Manager** on Synology.
2. Search registry for `pihole/pihole`.
3. Create container with:
   - **Network:** Host Mode (Recommended for DNS) or Bridge (requires port 53 mapping).
   - **Environment Variables:** `WEBPASSWORD`, `TZ`.
   - **Volumes:** `/etc/pihole`, `/etc/dnsmasq.d`.

### Step 2: Configure Local DNS Records (✅ COMPLETED)
In Pi-hole Admin Interface -> **Local DNS** -> **DNS Records**:
- `gitea.local` -> `192.168.0.5` (NAS IP)
- `ai.local` -> `192.168.0.10` (Dev Server IP)
- `router.local` -> `192.168.0.1` (Omada Gateway)

### Step 3: Update Network DNS Settings (Omada) (✅ COMPLETED)
In **Omada Controller**:
1. Go to **Settings** -> **Wired Networks** -> **LAN**.
2. Edit the primary LAN.
3. Change **DNS Server** from `Auto` to `Manual`.
4. **Primary DNS:** `192.168.0.5` (NAS IP).
5. **Secondary DNS:** `1.1.1.1` (Cloudflare - as backup).

### Step 4: Configure WireGuard Server (Omada) (⏸️ PAUSED)
In **Omada Controller**:
1. **Settings** -> **VPN** -> **WireGuard**.
2. **Create New Server**:
   - Status: Enable
   - Local Network: LAN
   - Listening Port: `51820` (default)
3. **Create Peers**:
   - Create user for `iPhone`.
   - Create user for `MacBook`.
4. **DNS Setting for Peers:** Set to `192.168.0.5` (Allows resolving `ai.local` over VPN).

### Step 4A: Tailscale (Synology NAS) (✅ COMPLETED 2026-02-01)
Use Tailscale for private access without router changes.

1. ✅ **Install Tailscale** in Synology Container Manager.
2. ✅ **Network:** Host
3. ✅ **Capabilities:** `NET_ADMIN`, `NET_RAW` (and `SYS_MODULE` if available)
4. ✅ **State dir:** `/var/lib/tailscale` mapped to `/volume1/docker/tailscale`
5. ✅ Run:
   ```sh
   tailscale up
   ```
6. ✅ Install Tailscale on **Dev PC** and **MacBook/Phone**, then sign in.
7. ✅ Enable **MagicDNS** in the Tailscale admin console.
8. ✅ Configure SSH access via Tailscale IPs and integrate with chezmoi.

**Active Network:**
- arkstead (NAS): `100.86.209.36` - Linux 3.10.108, Tailscale v1.58.2-1
- mandulaj-ms-7c02 (Dev PC): `100.71.172.94` - Linux 6.8.0-90-generic, Tailscale v1.94.1  
- mj-macbook-pro-16 (MacBook): `100.113.21.41` - macOS 26.2.0, Tailscale v1.94.1

**Future Enhancement:** Add custom domain names instead of MagicDNS defaults.

### Step 5: Client Setup
1. **iPhone:** Install WireGuard App -> Scan QR Code from Omada.
2. **MacBook:** Install WireGuard App -> Import `.conf` file.
3. **Internal Test:** Connect VPN (turn off WiFi) and try accessing `http://192.168.0.5`.

---

## 5. Verification Checklist

- [x] **LAN Test:** Laptop on WiFi can resolve `gitea.local` to `192.168.0.5`.
- [x] **Ad Blocking:** Ads disappear on mobile devices connected to WiFi.
- [x] **Tailscale Access:** MacBook can access NAS and Dev PC via Tailscale IPs.
- [x] **SSH Remote Access:** SSH configured for Tailscale IPs in ~/.ssh/config.
- [x] **MagicDNS:** Enabled for automatic device name resolution.
- [x] **Multi-Device:** All 3 devices (NAS, Dev PC, MacBook) connected and operational.
- [ ] **Custom Domains:** Future enhancement to add custom domain names.
- [ ] **WAN Test (VPN):** Phone on 5G + VPN can access `http://192.168.0.5`. (WireGuard paused)
- [ ] **DNS over VPN:** Phone on 5G + VPN can open `http://gitea.local`. (WireGuard paused)
