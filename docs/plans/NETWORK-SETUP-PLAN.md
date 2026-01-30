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

### Step 1: Deploy Pi-hole on Synology NAS
1. Open **Container Manager** on Synology.
2. Search registry for `pihole/pihole`.
3. Create container with:
   - **Network:** Host Mode (Recommended for DNS) or Bridge (requires port 53 mapping).
   - **Environment Variables:** `WEBPASSWORD`, `TZ`.
   - **Volumes:** `/etc/pihole`, `/etc/dnsmasq.d`.

### Step 2: Configure Local DNS Records
In Pi-hole Admin Interface -> **Local DNS** -> **DNS Records**:
- `gitea.local` -> `192.168.0.5` (NAS IP)
- `ai.local` -> `192.168.0.10` (Dev Server IP)
- `router.local` -> `192.168.0.1` (Omada Gateway)

### Step 3: Update Network DNS Settings (Omada)
In **Omada Controller**:
1. Go to **Settings** -> **Wired Networks** -> **LAN**.
2. Edit the primary LAN.
3. Change **DNS Server** from `Auto` to `Manual`.
4. **Primary DNS:** `192.168.0.5` (NAS IP).
5. **Secondary DNS:** `1.1.1.1` (Cloudflare - as backup).

### Step 4: Configure WireGuard Server (Omada)
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

### Step 5: Client Setup
1. **iPhone:** Install WireGuard App -> Scan QR Code from Omada.
2. **MacBook:** Install WireGuard App -> Import `.conf` file.
3. **Internal Test:** Connect VPN (turn off WiFi) and try accessing `http://192.168.0.5`.

---

## 5. Verification Checklist

- [ ] **LAN Test:** Laptop on WiFi can resolve `gitea.local` to `192.168.0.5`.
- [ ] **Ad Blocking:** Ads disappear on mobile devices connected to WiFi.
- [ ] **WAN Test (VPN):** Phone on 5G + VPN can access `http://192.168.0.5`.
- [ ] **DNS over VPN:** Phone on 5G + VPN can open `http://gitea.local`.
- [ ] **Speed Test:** Local file transfer to NAS uses LAN speed, not Internet speed.
