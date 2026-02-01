# WireGuard Configuration Debug Checklist

## What We Configured vs. What the Guide Says

### ✅ Correct Configurations:

1. **Peer Allow Address:** `10.10.10.2/32` ✅
   - This is the IP your phone gets on the VPN tunnel

2. **Client Config - Address:** `10.10.10.2/32` ✅
   - Matches the peer

3. **Client Config - DNS:** `192.168.0.5` ✅
   - Points to your Pi-hole

4. **Client Config - AllowedIPs:** `0.0.0.0/0, ::/0` ✅
   - Routes all traffic through VPN (full tunnel)

5. **Client Config - Endpoint:** `188.36.149.116:51820` ✅
   - Your public IP + port

6. **Listen Port:** `51820` ✅
   - Standard WireGuard port

7. **Gateway ACL Rule:** ✅
   - Direction: LAN→WAN
   - Policy: Permit
   - Source: 10.10.10.0/24
   - Destination: Any

---

## ❌ Potential Issues:

### Issue #1: Local IP Address Field (CRITICAL)
**Current:** You changed it to `188.36.149.116`
**Guide says:** "The 'Local IP Address' box is actually your public IP address or domain name"

**Wait - did you SAVE and APPLY after changing?**
- Go back to Omada > VPN > WireGuard > Edit Dev-VPN
- Verify it shows `188.36.149.116` (not `10.10.10.1`)
- If it reverted, change it again and click APPLY

---

### Issue #2: Port Forwarding (CHECK THIS!)
The Reddit guide doesn't mention it explicitly, but:

**Action Needed:**
Go to **Transmission** > **Port Forwarding** > **Create New Rule**
- **Name:** WireGuard
- **Protocol:** UDP
- **External Port:** 51820
- **Internal IP:** `192.168.0.1` (Your ER605's LAN IP)
- **Internal Port:** 51820
- **Status:** Enable

**Why:** Even though the router IS the server, some routers need explicit permission to accept WAN traffic on custom ports.

---

### Issue #3: WAN Firewall (Possible Block)
**Settings** > **Security** > **Firewall** > **[WAN1] IN**

Check if there's a rule BLOCKING incoming UDP 51820.

**If none exists, CREATE:**
- **Direction:** `[WAN1] IN`
- **Policy:** `Permit`
- **Protocol:** `UDP`
- **Destination Port:** `51820`
- **Description:** "Allow WG"

---

### Issue #4: IP/Subnet Conflicts
Reddit user said: *"Some combination of Local IP and Allow Address that if they're not in same subnet can cause a total loss of WAN routing."*

**Current setup:**
- Local IP: 188.36.149.116 (Public IP - CORRECT)
- Peer Allow Address: 10.10.10.2/32 (VPN subnet - CORRECT)
- These are intentionally different subnets ✅

**BUT:** Is `10.10.10.0/24` used anywhere else in your network?
- Check if any VLAN uses this range
- If YES, pick a different range (e.g., `10.10.20.0/24`)

---

### Issue #5: NAT Checkbox (ER605 Specific)
Go to **Settings** > **Internet** > Click **Edit** on **WAN1**:
- Look for **"Enable NAT"** checkbox
- Ensure it's **CHECKED** (ON)

---

### Issue #6: Firmware/Bug (Nuclear Option)
Reddit user said after following guide *"internet just stopped working for the whole lan"* and switched to OpenVPN.

**Check Firmware:**
- You have `2.3.3` (latest as of Oct 2025)
- This SHOULD work, but there might be a bug

**Workaround if all else fails:**
Use OpenVPN instead (Omada has native support): https://www.tp-link.com/us/support/faq/3632/

---

## Next Steps:

1. **Verify Local IP is saved as Public IP**
2. **Add Port Forwarding rule for UDP 51820**
3. **Check WAN IN firewall for blocks**
4. **Test again**
