# Dev-Toolbox: Project Vision & Roadmap

**Repository:** `dev-toolbox` (renamed from `dev01-container` on 2026-01-27)
**Created:** January 27, 2026  
**Last Updated:** January 28, 2026  
**Status:** Planning Phase → Implementation

---

## 🚀 Future: Full Stack Overhaul

> **See [plans/CONVEX-MIGRATION-PLAN.md](plans/CONVEX-MIGRATION-PLAN.md)** for complete migration plan.

A future major version will migrate to:
- **Convex** (self-hosted) - Real-time database with vector search
- **TanStack Start** - Modern React SSR framework
- **Better Auth** - Self-hosted authentication
- **Full TypeScript** - End-to-end type safety
- **Chat UI** - Built-in, replaces Open WebUI

Template: [convex-tanstack-better-auth-cloudfare-terraform](https://github.com/joealmond/convex-tanstack-better-auth-cloudfare-terraform)

**Prerequisites:** Current stack stable with Aider + Continue working.

---

## 🤖 LLM Context Block

> **FOR AI ASSISTANTS:** This block provides quick context for continuing work on this project.
> Read this section first to understand current state and next actions.

### Quick Facts
```yaml
project_name: dev-toolbox
project_type: development-environment-container
primary_llm: GLM 4.7 (Ollama on RTX 3090)
fallback_llm: Claude Sonnet 4.5
hardware:
  gpu: NVIDIA RTX 3090 (24GB VRAM)
  cpu: AMD Ryzen 7
  ram: 32GB DDR
  storage: NVMe SSD + 4TB HDD
network:
  dev_server: 192.168.0.10
  nas: 192.168.0.5
  router: TP-Link ER605
obsidian_vault: /home/mandulaj/Obsidian-Vaults/Base/Base
chat_ui: Open WebUI
```

### Current Phase
**Phase 1: GPU & LLM Optimization** — Setting up GLM 4.7 with max context window

### Next Actions (Pick One)
1. Research optimal GLM 4.7 quantization for RTX 3090
2. Create Modelfile with max context window
3. Deploy Open WebUI container

---

## ✅ Master TODO Tracker

> **Instructions:** Mark tasks `[x]` when complete. Add `(date)` for tracking.
> Format: `- [x] Task description (YYYY-MM-DD)`

### Phase 1: GPU & LLM Optimization 🔴 IN PROGRESS
- [ ] Research optimal GLM 4.7 quantization for RTX 3090
- [ ] Create optimized Modelfile with max context window  
- [ ] Configure VRAM budget calculation
- [ ] Set up model variants for different use cases
- [ ] Document GPU monitoring commands
- [ ] Verify model runs at 100% GPU (no CPU spill)

### Phase 2: Multi-Access LLM 🔴 QUEUED
- [ ] Deploy Open WebUI container on 192.168.0.10
- [ ] Connect Open WebUI to Ollama at localhost:11434
- [ ] Configure Open WebUI access (auth, tunnel or local DNS)
- [ ] Verify `ollama run` works from terminal
- [ ] Create shell aliases for common prompts
- [ ] Set OLLAMA_HOST in shell profiles (.bashrc/.zshrc)
- [ ] Test `host.containers.internal:11434` from devcontainers
- [ ] Document environment variables for external projects
- [ ] Research Obsidian LLM plugins (Copilot, Smart Connections)
- [ ] Configure Obsidian plugin to use Ollama endpoint
- [ ] Test mobile access via WireGuard

### Phase 3: Network Architecture � IN PROGRESS
> **See [plans/NETWORK-SETUP-PLAN.md](plans/NETWORK-SETUP-PLAN.md)** for detailed setup guide.
- [ ] **Deploy Pi-hole on Synology NAS** (Container Manager)
- [ ] Configure Local DNS records (`*.local` → IPs)
- [ ] Configure Omada LAN DHCP to use Pi-hole DNS
- [ ] **Configure WireGuard Server** on ER605 (via Omada)
- [ ] Create WireGuard client configs (MacBook, iPhone)
- [ ] Test mobile access via WireGuard (5G test)
- [ ] Document final configuration in `NETWORK-SETUP.md`

### Phase 4: Obsidian Integration 🟡 WAITING
- [ ] Create symlink: Obsidian → backlog/todo
- [ ] Create symlink: Obsidian → backlog/doing  
- [ ] Create symlink: Obsidian → backlog/review
- [ ] Create symlink: Obsidian → backlog/completed
- [ ] Install Obsidian plugins: Templater, Dataview, Kanban
- [ ] Create spec template for Templater
- [ ] Build Dataview dashboard
- [ ] Test: Create spec on mobile → auto-processing triggers

### Phase 5: Test-Driven Autonomous Coding 🟡 WAITING
- [ ] Research TestSprite MCP integration
- [ ] Evaluate Jest vs Playwright for project types
- [ ] Implement test result → LLM feedback loop
- [ ] Add Claude API integration
- [ ] Configure failover: GLM 4.7 → Sonnet 4.5 → Human
- [ ] Set up cost tracking per task

### Phase 6: Scheduled Automations 🟢 BACKLOG
- [ ] Set up cron/scheduler (node-cron or systemd)
- [ ] Create YouTube transcript pipeline
- [ ] Integrate Google APIs (YouTube, etc.)
- [ ] Build Obsidian output templates
- [ ] Create automation status dashboard

### Phase 7: Language & Modularity 🟢 BACKLOG
- [ ] Profile current Node.js performance
- [ ] Evaluate TypeScript migration cost
- [ ] Design module interfaces
- [ ] Create module loader/plugin system

### Infrastructure & Repo
- [x] Rename repository: dev01-container → dev-toolbox (2026-01-27)
- [x] Update all internal references to new name (2026-01-27)
- [x] Update package.json name field (2026-01-27)
- [ ] Create `NETWORK-SETUP.md`
- [ ] Create `OBSIDIAN-INTEGRATION.md`
- [ ] Create `LLM-CONFIGURATION.md`
- [ ] Create `TESTING-STRATEGY.md`

---

## Executive Summary

**Dev-Toolbox** is an environment container that provides AI-powered development tools to application projects. Unlike traditional frameworks that live inside your project, Dev-Toolbox wraps around your project as an invisible tooling layer — your application code remains clean while gaining access to autonomous coding, testing, LLM integration, and knowledge management capabilities.

---

## 🎯 Core Vision

### What Dev-Toolbox Is

- **An environment container** — not a library your app imports
- **A hidden tooling layer** — projects don't see Dev-Toolbox folders, only use its tools
- **LLM-powered automation** — spec-driven development with GLM 4.7 + cloud failover
- **Obsidian-integrated** — knowledge base + task management + mobile access
- **Accessible everywhere** — terminal, browser, devcontainer, mobile via Obsidian

### What Dev-Toolbox Is NOT

- ❌ A ticket/issue tracker (it processes specs, not manages backlogs)
- ❌ A framework your code depends on
- ❌ A VS Code extension (though it integrates via MCP)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ACCESS LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  📱 Mobile       │  🌐 Browser      │  💻 Terminal    │  🔧 DevContainer │
│  (Obsidian Sync) │  (Open WebUI)    │  (CLI tools)    │  (VS Code + MCP) │
└────────┬─────────┴────────┬─────────┴────────┬────────┴────────┬────────┘
         │                  │                  │                 │
         ▼                  ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEV-TOOLBOX CORE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Spec Engine  │  │ Test Runner  │  │ Doc Generator│  │ Cron Tasks   │ │
│  │ (autonomous) │  │ (validation) │  │ (worklogs)   │  │ (scheduled)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │         │
│         └─────────────────┴─────────────────┴─────────────────┘         │
│                                   │                                      │
│                          ┌────────▼────────┐                            │
│                          │   LLM Router    │                            │
│                          │ GLM 4.7 Primary │                            │
│                          │ Sonnet Failover │                            │
│                          └────────┬────────┘                            │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Ollama        │    │   Obsidian Vault    │    │   Target Project    │
│   GLM 4.7       │    │   (Knowledge Base)  │    │   (Your App Code)   │
│   RTX 3090      │    │   Synced to Mobile  │    │   Clean, no tools   │
└─────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 📋 Feature Roadmap

### Phase 0: Foundation (Current State) ✅

What already exists:
- [x] File watcher for spec processing
- [x] Kilo Code (kodu) integration
- [x] MCP server with 12 tools
- [x] Approval workflows
- [x] Documentation generation
- [x] Semantic search (MiniSearch)
- [x] Git/Gitea integration
- [x] Podman compose setup
- [x] PM2 process management

### Phase 1: GPU & LLM Optimization 🔴 PRIORITY

**Goal:** Maximize RTX 3090 utilization with optimal context window

#### Hardware Context
| Component | Spec |
|-----------|------|
| GPU | NVIDIA RTX 3090 (24GB VRAM) |
| CPU | AMD Ryzen 7 |
| RAM | 32GB DDR |
| Storage | NVMe SSD (root) + 4TB HDD (models) |

#### Tasks
- [ ] Research optimal GLM 4.7 quantization for RTX 3090
- [ ] Create optimized Modelfile with max context window
- [ ] Configure VRAM budget calculation
- [ ] Set up model variants for different use cases
- [ ] Document GPU monitoring commands

#### Model Selection (To Research)
```
Candidates:
- glm-4.7-flash:q3_k_m  (~14.5GB, ~48k context)
- glm-4.7-flash:q4_k_m  (~17GB, ~38k context)
- glm-4.7-chat variants
```

#### Questions to Answer
- What's the max context we can achieve with 24GB VRAM?
- Which quantization balances quality vs context?
- Do we need different models for different tasks?

---

### Phase 2: Multi-Access LLM 🔴 PRIORITY

**Goal:** Access GLM 4.7 from anywhere (terminal, browser, containers, mobile)

#### Components

##### 2.1 Open WebUI (Browser Chat)
- [ ] Deploy Open WebUI container
- [ ] Connect to Ollama at `192.168.0.10:11434`
- [ ] Configure via Cloudflare tunnel or local DNS
- [ ] Set up authentication

##### 2.2 Terminal Access
- [ ] Verify `ollama run` works from anywhere
- [ ] Create shell aliases for common prompts
- [ ] Set up OLLAMA_HOST in shell profiles

##### 2.3 DevContainer Access
- [ ] Ensure `host.containers.internal:11434` works
- [ ] Test from external project devcontainers
- [ ] Document environment variables

##### 2.4 Mobile Access (via Obsidian)
- [ ] Research Obsidian LLM plugins (Copilot, Smart Connections)
- [ ] Configure plugin to use Ollama endpoint
- [ ] Test via WireGuard when remote

---

### Phase 3: Network Architecture 🔴 PRIORITY

**Goal:** Seamless local/remote access with proper SSL and large file support

#### Current Setup
| Device | IP | Role |
|--------|-----|------|
| Dev Server | 192.168.0.10 | Ollama, Dev-Toolbox, code-server |
| Synology NAS | 192.168.0.5 | Gitea, cloudflared, Omada controller |
| TP-Link ER605 | (router) | Local DNS, WireGuard capable |

#### Problems to Solve
1. **Cloudflare 100MB limit** — Can't push 6GB container images through tunnel
2. **Local HTTPS** — Gitea HTTPS doesn't work with IP (cert issues)
3. **Remote access** — Need VPN when outside home network

#### Proposed Solution

##### Option A: Local DNS + Split Horizon
```
Local network:
  git.mandulaj.local  → 192.168.0.5:3000 (HTTP, bypasses CF)
  dev.mandulaj.local  → 192.168.0.10

Remote (via WireGuard):
  Same .local domains resolve through VPN
  
External (via Cloudflare):
  git.mandulaj.stream → Cloudflare tunnel (small files only)
```

##### Option B: WireGuard Only
```
All access (local & remote):
  Connect to WireGuard on ER605
  Use internal IPs directly
  Large file uploads work
```

#### Tasks
- [ ] Document current Cloudflare tunnel config
- [ ] Set up local DNS on ER605 (or Synology)
- [ ] Configure WireGuard on ER605
- [ ] Test large file push via local network
- [ ] Create network topology diagram
- [ ] Document both local and remote workflows

---

### Phase 4: Obsidian Integration 🟡 HIGH

**Goal:** Obsidian as frontend for specs, knowledge base, and task management

#### Vault Structure
Current: `/home/mandulaj/Obsidian-Vaults/Base/Base`
```
Base/
├── 0 Inbox/           ← Quick capture
├── 1 Projects/        ← Active projects (link Dev-Toolbox specs here?)
│   ├── Home Network/
│   ├── copilot/
│   └── ...
├── 2 Areas/           ← Ongoing responsibilities
├── 3 Resources/       ← Reference material
│   ├── Coding/
│   ├── DevOps/
│   └── ...
├── 4 Archive/         ← Completed items
├── Input/             ← External inputs
├── Journal/           ← Daily notes
├── Output/            ← Published content
├── templates/         ← Note templates
└── Zettelkasten/      ← Atomic notes
```

#### Proposed Additions
```
Base/
├── Dev-Toolbox/          ← NEW: Symlink or folder
│   ├── specs/            ← Spec files (symlink to backlog/todo)
│   ├── in-progress/      ← Current tasks (symlink to backlog/doing)
│   ├── review/           ← Pending approval
│   ├── completed/        ← Archive
│   └── Dashboard.md      ← Dataview dashboard
├── Automations/          ← NEW: Cron task outputs
│   ├── YouTube/          ← Transcripts, summaries
│   ├── News/             ← Curated news digests
│   └── Daily-Brief.md    ← Auto-generated daily summary
```

#### Tasks
- [ ] Create symlinks from Obsidian to backlog folders
- [ ] Install Obsidian plugins (Templater, Dataview, Kanban)
- [ ] Create spec template for Templater
- [ ] Build Dataview dashboard
- [ ] Test mobile spec creation → auto processing
- [ ] Research LLM plugins for Obsidian

---

### Phase 5: Test-Driven Autonomous Coding 🟡 HIGH

**Goal:** Every LLM pass validated by tests, with feedback loop

#### Proposed Architecture (3-Agent Model)
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Planner   │ ───▶ │   Coder     │ ───▶ │   Tester    │
│   (GLM 4.7) │      │   (GLM 4.7) │      │ (Playwright │
│             │      │             │      │  or Jest)   │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                            ┌─────────────────────┘
                            ▼
                     ┌─────────────┐
                     │  Feedback   │ ← Test results
                     │  Loop       │ → Next iteration
                     └─────────────┘
```

#### Failover Chain
```
1. GLM 4.7 (local, free, fast)
   ↓ if tests fail after N attempts
2. Claude Sonnet 4.5 (cloud, paid, higher quality)
   ↓ if still failing
3. Human review required
```

#### Tasks
- [ ] Research TestSprite MCP integration
- [ ] Evaluate Jest vs Playwright for different project types
- [ ] Implement test result → LLM feedback loop
- [ ] Add Claude API integration (via Google One or direct Anthropic)
- [ ] Configure failover thresholds
- [ ] Track costs per task

---

### Phase 6: Scheduled Automations 🟢 MEDIUM

**Goal:** LLM-powered cron jobs for personal data processing

#### Use Cases

##### 6.1 YouTube Playlist → Knowledge
```
Input:  YouTube playlist URLs
Process: 
  1. Fetch video metadata (YouTube API)
  2. Get transcripts (youtube-transcript-api or NotebookLM)
  3. Summarize with GLM 4.7
  4. Categorize and prioritize
Output: Obsidian note with summaries, priority recommendations
```

##### 6.2 News Aggregation
```
Input:  RSS feeds, newsletters, Twitter lists
Process:
  1. Fetch new items
  2. Summarize and categorize
  3. Rank by relevance to interests
Output: Daily Brief in Obsidian
```

##### 6.3 Other Ideas
- Email digest summarization
- Calendar preparation briefings
- Code repository activity summaries
- Learning path recommendations

#### Tasks
- [ ] Set up cron/scheduler infrastructure (node-cron or systemd timers)
- [ ] Create YouTube transcript pipeline
- [ ] Integrate with Google APIs (via Google One subscription)
- [ ] Build output templates for Obsidian
- [ ] Create Dashboard for automation status

---

### Phase 7: Language & Modularity Evaluation 🟢 MEDIUM

**Goal:** Evaluate if JavaScript/Node.js is the right choice long-term

#### Current Stack Analysis

**Pros of JavaScript/Node.js:**
- ✅ Async I/O perfect for file watching and API calls
- ✅ Excellent ecosystem (chokidar, express, etc.)
- ✅ MCP SDK officially supports Node.js
- ✅ Easy to extend and modify
- ✅ Already working

**Concerns:**
- ❓ Performance for heavy processing?
- ❓ Type safety (could add TypeScript)
- ❓ Memory usage for long-running processes
- ❓ Modularity — currently monolithic

#### Alternatives to Consider

| Option | Pros | Cons |
|--------|------|------|
| **TypeScript** | Type safety, same runtime | Migration effort |
| **Go** | Fast, single binary, great for CLI | Rewrite required |
| **Python** | ML ecosystem, easy scripting | Async complexity |
| **Rust** | Performance, safety | Steep learning curve |

#### Modular Architecture Vision
```
dev-toolbox/
├── core/              ← Minimal core (shared interfaces)
├── modules/
│   ├── spec-engine/   ← Spec processing (installable separately)
│   ├── test-runner/   ← Testing integration
│   ├── doc-gen/       ← Documentation generation
│   ├── llm-router/    ← LLM selection and failover
│   ├── obsidian-sync/ ← Obsidian integration
│   └── cron-tasks/    ← Scheduled automations
├── adapters/
│   ├── ai/            ← Kilo Code, Aider, raw Ollama
│   ├── search/        ← MiniSearch, Elasticsearch
│   └── queue/         ← Memory, BullMQ, RabbitMQ
└── profiles/
    ├── minimal.json   ← Just spec engine
    ├── full.json      ← Everything
    └── custom.json    ← User-defined
```

#### Tasks
- [ ] Profile current performance
- [ ] Evaluate TypeScript migration cost
- [ ] Design module interfaces
- [ ] Create module loader/plugin system
- [ ] Document module creation guide

---

## 🌐 Network Topology

```
                                    INTERNET
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │      Cloudflare Tunnels      │
                        │  *.mandulaj.stream domains   │
                        │  (100MB upload limit)        │
                        └──────────────┬───────────────┘
                                       │
    ┌──────────────────────────────────┼──────────────────────────────────┐
    │                           HOME NETWORK                               │
    │                          192.168.0.0/24                              │
    │                                  │                                   │
    │                        ┌─────────▼─────────┐                        │
    │                        │    TP-Link ER605   │                        │
    │                        │ Router + Omada WAN │                        │
    │                        │ Local DNS (future) │                        │
    │                        │ WireGuard (future) │                        │
    │                        └────────┬──────────┘                        │
    │                                 │                                    │
    │           ┌─────────────────────┼─────────────────────┐             │
    │           │                     │                     │             │
    │   ┌───────▼───────┐     ┌───────▼───────┐     ┌───────▼───────┐    │
    │   │  Synology NAS │     │  Dev Server   │     │  MacBook Pro  │    │
    │   │  192.168.0.5  │     │  192.168.0.10 │     │  (dynamic)    │    │
    │   ├───────────────┤     ├───────────────┤     ├───────────────┤    │
    │   │ - cloudflared │     │ - Ollama      │     │ - VS Code     │    │
    │   │ - Gitea:3000  │     │   (GLM 4.7)   │     │ - Obsidian    │    │
    │   │ - Omada:8043  │     │ - Dev-Toolbox │     │   (synced)    │    │
    │   │ - qBittorrent │     │ - code-server │     │               │    │
    │   │ - DSM:5001    │     │ - Open WebUI  │     │               │    │
    │   └───────────────┘     └───────────────┘     └───────────────┘    │
    │                                                                      │
    └──────────────────────────────────────────────────────────────────────┘

    CURRENT TUNNELS:
    ─────────────────
    arkstead.mandulaj.stream  → NAS DSM (192.168.0.5:5001)
    omada.mandulaj.stream     → Omada Controller (192.168.0.5:8043)  
    ssh.mandulaj.stream       → NAS SSH (192.168.0.5:2299)
    git.mandulaj.stream       → Gitea (192.168.0.5:3000)
    
    NEEDED:
    ───────
    Local DNS: *.local domains for internal access
    WireGuard: Remote access without Cloudflare limits
    Open WebUI: Browser chat interface for GLM 4.7
```

---

## 📊 Priority Matrix

| Phase | Effort | Impact | Priority | Dependencies |
|-------|--------|--------|----------|--------------|
| **P1: GPU/LLM Optimization** | 2-4h | Critical | 🔴 DO FIRST | None |
| **P3: Network Architecture** | 4-8h | Critical | 🔴 DO FIRST | None |
| **P2: Multi-Access LLM** | 4-6h | High | 🔴 PRIORITY | P1 |
| **P4: Obsidian Integration** | 4-6h | High | 🟡 HIGH | P1, P3 |
| **P5: Test-Driven Coding** | 8-12h | High | 🟡 HIGH | P1 |
| **P6: Scheduled Automations** | 8-16h | Medium | 🟢 MEDIUM | P1, P4 |
| **P7: Language/Modularity** | 16-24h | Medium | 🟢 LATER | All above |

### Recommended Order

```
Week 1:
  Day 1-2: P1 - GPU optimization, GLM 4.7 setup
  Day 3-4: P3 - Network (local DNS + WireGuard)
  
Week 2:
  Day 1-2: P2 - Open WebUI + multi-access
  Day 3-4: P4 - Obsidian symlinks + basic integration
  
Week 3-4:
  P5 - Test-driven autonomous coding
  
Ongoing:
  P6 - Add scheduled automations as needed
  P7 - Evaluate and refactor over time
```

---

## 🔗 Related Documentation

### Existing (to be updated)
- [ARCHITECTURE.md](ARCHITECTURE.md) — Current system design
- [FUTURE_IMPROVEMENTS.md](operations/FUTURE_IMPROVEMENTS.md) — Previous improvement plans
- [IMPROVEMENT-ROADMAP1.md](guides/IMPROVEMENT-ROADMAP1.md) — GPU optimization details
- [HOST-MACHINE-REFERENCE.md](operations/HOST-MACHINE-REFERENCE.md) — Hardware specs
- [EXTERNAL-PROJECT-SETUP.md](guides/EXTERNAL-PROJECT-SETUP.md) — External project usage

### To Create
- [ ] `NETWORK-SETUP.md` — Detailed network configuration guide
- [ ] `OBSIDIAN-INTEGRATION.md` — Obsidian setup and templates
- [ ] `LLM-CONFIGURATION.md` — Model setup and optimization
- [ ] `TESTING-STRATEGY.md` — Test-driven development approach

---

## 📝 Decisions Made

| Question | Decision | Date |
|----------|----------|------|
| Project renaming | ✅ Rename to `dev-toolbox` | 2026-01-27 |
| Browser chat UI | ✅ Use Open WebUI | 2026-01-27 |
| Dev server IP | ✅ 192.168.0.10 (Linux desktop, RTX 3090) | 2026-01-27 |
| Priority order | ✅ P1 → P3 → P2 → P4 → P5 → P6 → P7 | 2026-01-27 |

## 📝 Open Questions

1. ~~**Project renaming**~~ → ✅ Decided: Rename to `dev-toolbox`
2. **Obsidian location**: Keep vault separate or move relevant parts into project?
3. **Claude API**: Use via Google One, OpenRouter, or direct Anthropic subscription?
4. **Mobile push**: Can we trigger spec processing from mobile Obsidian?
5. **Testing framework**: Jest (already set up) vs Playwright vs TestSprite MCP?

---

## 📅 Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-27 | Jakub Mandula | Initial vision document created |
| 2026-01-27 | Jakub Mandula | Added LLM context block, master TODO tracker, decisions |

---

*This is a living document. Update as plans evolve.*
