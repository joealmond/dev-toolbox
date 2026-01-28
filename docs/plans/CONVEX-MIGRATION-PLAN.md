# Full Overhaul: Convex + TypeScript Migration Plan

**Status:** 📋 PLANNED (Future)  
**Priority:** After current stack is stable  
**Estimated Effort:** 2-3 weeks  
**Template:** [convex-tanstack-better-auth-cloudfare-terraform](https://github.com/joealmond/convex-tanstack-better-auth-cloudfare-terraform)

---

## Executive Summary

Complete rewrite of dev-toolbox using modern TypeScript stack with Convex as the backend. Start fresh from template rather than modifying existing codebase.

### Why This Approach

| Factor | Benefit |
|--------|---------|
| Clean architecture | No legacy baggage, consistent patterns |
| Full TypeScript | End-to-end type safety |
| Real-time native | Convex subscriptions replace file watching |
| Self-hosted | Convex backend on your RTX 3090 server |
| Chat UI | Built-in, replaces Open WebUI |
| Vector search | Native Convex embeddings |
| Future-proof | Modern stack, active development |

---

## Target Stack

| Component | Technology | Current Equivalent |
|-----------|------------|-------------------|
| Framework | TanStack Start | None (CLI only) |
| Database | Convex (self-hosted) | File-based backlog |
| Auth | Better Auth | None |
| Edge | Cloudflare Workers | None |
| Styling | Tailwind CSS v4 | None |
| IaC | Terraform | Manual setup |
| Language | TypeScript | JavaScript |
| AI Tools | Aider + Continue | ✅ Keep |

---

## Architecture

```
dev-toolbox-v2/                    # New repo from template
├── convex/                        # Backend (replaces scripts/)
│   ├── schema.ts                  # Task, Spec, Approval tables
│   ├── tasks.ts                   # Queries + Mutations
│   ├── ai.ts                      # AI actions (Ollama calls)
│   ├── crons.ts                   # Scheduled jobs (replaces watcher)
│   ├── lib/
│   │   ├── adapters/              # Port from current
│   │   │   ├── aider.ts
│   │   │   └── continue.ts
│   │   ├── obsidian.ts            # File sync
│   │   └── prompts.ts             # Prompt building
│   └── auth.ts                    # Better Auth config
├── src/                           # Frontend
│   ├── routes/
│   │   ├── index.tsx              # Dashboard
│   │   ├── tasks/                 # Task management
│   │   ├── chat/                  # Chat UI (replaces Open WebUI)
│   │   └── settings/              # Config
│   └── components/
├── infrastructure/                # Terraform
└── package.json                   # All TypeScript
```

---

## Migration Phases

### Phase 1: Foundation (Days 1-3)

**Goal:** Template running with Convex self-hosted

```bash
# Clone template
git clone https://github.com/joealmond/convex-tanstack-better-auth-cloudfare-terraform dev-toolbox-v2
cd dev-toolbox-v2
npm install

# Self-hosted Convex on 192.168.0.10
docker run -d --name convex \
  -p 3210:3210 \
  -v convex-data:/data \
  ghcr.io/get-convex/convex-backend:latest
```

**Deliverables:**
- [ ] Template cloned and running
- [ ] Convex self-hosted on server
- [ ] Better Auth configured with Google OAuth
- [ ] Basic UI accessible

### Phase 2: Schema Design (Days 4-5)

**Goal:** Define Convex schema matching current functionality

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    body: v.optional(v.string()),  // Markdown content
    status: v.union(
      v.literal("todo"),
      v.literal("doing"),
      v.literal("review"),
      v.literal("completed"),
      v.literal("failed")
    ),
    spec: v.optional(v.object({
      enabled: v.boolean(),
      requirements: v.array(v.string()),
      acceptanceCriteria: v.array(v.string()),
      architecture: v.optional(v.object({
        components: v.array(v.string()),
        integrations: v.array(v.string()),
        decisions: v.optional(v.string()),
      })),
    })),
    approval: v.optional(v.object({
      code: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      docs: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      codeApprovedAt: v.optional(v.number()),
      docsApprovedAt: v.optional(v.number()),
    })),
    model: v.optional(v.string()),
    adapter: v.optional(v.string()),  // "aider" or "continue"
    result: v.optional(v.object({
      success: v.boolean(),
      output: v.optional(v.string()),
      error: v.optional(v.string()),
      processedAt: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  messages: defineTable({
    conversationId: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    model: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId", "createdAt"]),

  worklogs: defineTable({
    taskId: v.id("tasks"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),

  adrs: defineTable({
    number: v.number(),
    title: v.string(),
    taskId: v.optional(v.id("tasks")),
    context: v.string(),
    decision: v.string(),
    status: v.union(v.literal("proposed"), v.literal("accepted"), v.literal("deprecated")),
    createdAt: v.number(),
  }).index("by_number", ["number"]),
});
```

**Deliverables:**
- [ ] Schema defined and deployed
- [ ] Basic CRUD operations working
- [ ] Dashboard showing tasks

### Phase 3: Port Core Logic (Days 6-10)

**Goal:** Port business logic from current JS to TypeScript

#### AI Adapters
```typescript
// convex/lib/adapters/types.ts
export interface AITask {
  prompt: string;
  workingDirectory: string;
  taskId: string;
  contextFiles?: string[];
}

export interface AIResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

export interface AIAdapter {
  name: string;
  process(task: AITask): Promise<AIResult>;
  healthCheck(): Promise<{ available: boolean; version?: string }>;
}
```

```typescript
// convex/lib/adapters/aider.ts
import { AIAdapter, AITask, AIResult } from "./types";
import { spawn } from "child_process";

export class AiderAdapter implements AIAdapter {
  name = "aider";
  private model: string;
  private ollamaHost: string;
  private timeout: number;

  constructor(config: { model: string; ollamaHost: string; timeout: number }) {
    this.model = config.model;
    this.ollamaHost = config.ollamaHost;
    this.timeout = config.timeout;
  }

  async process(task: AITask): Promise<AIResult> {
    // Port from current aider-adapter.js
    return new Promise((resolve) => {
      const args = [
        "--model", `ollama/${this.model}`,
        "--message", task.prompt,
        "--yes",
        "--no-git",
      ];

      if (task.contextFiles?.length) {
        args.push(...task.contextFiles);
      }

      const proc = spawn("aider", args, {
        cwd: task.workingDirectory,
        env: { ...process.env, OLLAMA_API_BASE: this.ollamaHost },
      });

      let output = "";
      let error = "";

      proc.stdout.on("data", (data) => { output += data.toString(); });
      proc.stderr.on("data", (data) => { error += data.toString(); });

      const timeout = setTimeout(() => {
        proc.kill("SIGTERM");
        resolve({ success: false, output, error: "Timeout" });
      }, this.timeout);

      proc.on("close", (code) => {
        clearTimeout(timeout);
        resolve({
          success: code === 0,
          output,
          error: code !== 0 ? error : undefined,
          exitCode: code ?? undefined,
        });
      });
    });
  }

  async healthCheck() {
    // Check aider is available
    return { available: true };
  }
}
```

#### Prompt Builder
```typescript
// convex/lib/prompts.ts
import { Doc } from "../_generated/dataModel";

export function buildPrompt(task: Doc<"tasks">): string {
  let prompt = "";
  const isSpec = task.spec?.enabled;

  if (isSpec) {
    prompt += `# Spec: ${task.title}\n\n`;
    
    if (task.spec?.requirements?.length) {
      prompt += "## Requirements\n";
      task.spec.requirements.forEach((req, i) => {
        prompt += `${i + 1}. ${req}\n`;
      });
      prompt += "\n";
    }

    if (task.spec?.architecture) {
      prompt += "## Architecture Context\n";
      if (task.spec.architecture.components?.length) {
        prompt += "### Components\n";
        task.spec.architecture.components.forEach((c) => {
          prompt += `- ${c}\n`;
        });
      }
      if (task.spec.architecture.decisions) {
        prompt += `### Decisions\n${task.spec.architecture.decisions}\n`;
      }
      prompt += "\n";
    }
  } else {
    prompt += `# ${task.title}\n\n`;
    if (task.description) {
      prompt += `## Description\n${task.description}\n\n`;
    }
  }

  if (task.spec?.acceptanceCriteria?.length) {
    prompt += "## Acceptance Criteria\n";
    task.spec.acceptanceCriteria.forEach((c, i) => {
      prompt += `${i + 1}. ${c}\n`;
    });
    prompt += "\n";
  }

  if (task.body) {
    prompt += `## Details\n${task.body}\n`;
  }

  return prompt;
}
```

**Deliverables:**
- [ ] AI adapters ported to TypeScript
- [ ] Prompt builder ported
- [ ] Spec parser ported
- [ ] Doc generator ported

### Phase 4: Task Processing (Days 11-12)

**Goal:** Convex actions for AI processing

```typescript
// convex/ai.ts
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { AiderAdapter } from "./lib/adapters/aider";
import { buildPrompt } from "./lib/prompts";

export const processTask = action({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    // Get task
    const task = await ctx.runQuery(api.tasks.get, { id: args.taskId });
    if (!task) throw new Error("Task not found");

    // Update status to doing
    await ctx.runMutation(api.tasks.updateStatus, {
      id: args.taskId,
      status: "doing",
    });

    // Build prompt
    const prompt = buildPrompt(task);

    // Create adapter
    const adapter = new AiderAdapter({
      model: task.model || "qwen2.5-coder:7b",
      ollamaHost: process.env.OLLAMA_HOST || "http://localhost:11434",
      timeout: 300000,
    });

    // Process
    const result = await adapter.process({
      prompt,
      workingDirectory: process.env.WORKSPACE_DIR || "/workspace",
      taskId: task._id,
    });

    // Update task with result
    await ctx.runMutation(api.tasks.setResult, {
      id: args.taskId,
      result: {
        success: result.success,
        output: result.output,
        error: result.error,
        processedAt: Date.now(),
      },
      status: result.success ? "review" : "failed",
    });

    return result;
  },
});
```

### Phase 5: Cron Jobs (Day 13)

**Goal:** Replace file watcher with Convex crons

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

export default cronJobs()
  // Process pending tasks every minute
  .interval("processPendingTasks", { minutes: 1 }, internal.tasks.processNext)
  
  // Sync to Obsidian every 5 minutes
  .interval("syncToObsidian", { minutes: 5 }, internal.obsidian.syncToFiles)
  
  // Import from Obsidian every minute
  .interval("syncFromObsidian", { minutes: 1 }, internal.obsidian.importNewFiles)
  
  // Check for stale tasks hourly
  .interval("checkStaleTasks", { hours: 1 }, internal.tasks.checkStale);
```

### Phase 6: Obsidian Sync (Day 14)

**Goal:** Bidirectional sync between Convex and Obsidian vault

```typescript
// convex/obsidian.ts
import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import * as fs from "fs/promises";
import * as path from "path";
import matter from "gray-matter";

const VAULT_PATH = process.env.OBSIDIAN_VAULT || "/home/mandulaj/Obsidian-Vaults/Base/Base";
const SPECS_PATH = path.join(VAULT_PATH, "Dev-Toolbox", "specs");

export const syncToFiles = internalAction({
  handler: async (ctx) => {
    const tasks = await ctx.runQuery(api.tasks.list);
    
    await fs.mkdir(SPECS_PATH, { recursive: true });
    
    for (const task of tasks) {
      const filename = `${task._id}.md`;
      const filepath = path.join(SPECS_PATH, filename);
      
      const content = matter.stringify(task.body || "", {
        title: task.title,
        status: task.status,
        model: task.model,
        spec: task.spec,
        approval: task.approval,
        convexId: task._id,
        updatedAt: new Date(task.updatedAt).toISOString(),
      });
      
      await fs.writeFile(filepath, content);
    }
  },
});

export const importNewFiles = internalAction({
  handler: async (ctx) => {
    const files = await fs.readdir(SPECS_PATH);
    
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      
      const filepath = path.join(SPECS_PATH, file);
      const content = await fs.readFile(filepath, "utf-8");
      const { data, content: body } = matter(content);
      
      // Skip if already synced (has convexId)
      if (data.convexId) continue;
      
      // Create new task in Convex
      await ctx.runMutation(api.tasks.create, {
        title: data.title || file.replace(".md", ""),
        description: data.description,
        body,
        status: "todo",
        spec: data.spec,
        model: data.model,
      });
      
      // Mark file as synced by adding convexId
      // (handled on next syncToFiles run)
    }
  },
});
```

### Phase 7: Chat UI (Days 15-17)

**Goal:** Built-in chat interface for Ollama

```typescript
// src/routes/chat/index.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Chat() {
  const messages = useQuery(api.messages.list);
  const sendMessage = useMutation(api.messages.send);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage({ content: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto p-4">
        {messages?.map((msg) => (
          <div key={msg._id} className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="w-full p-2 border rounded"
          placeholder="Ask anything..."
        />
      </div>
    </div>
  );
}
```

---

## What Gets Ported vs Rebuilt

| Current File | Decision | Notes |
|--------------|----------|-------|
| `watcher.js` | **Rebuild** | Convex crons |
| `process-ticket.js` | **Port** | Core logic to `ai.ts` |
| `adapters/*.js` | **Port** | Good abstraction, keep |
| `semantic-indexer.js` | **Drop** | Convex vector search |
| `spec-parser.js` | **Port** | Business logic stays |
| `doc-generator.js` | **Port** | Templates work |
| `approval-handler.js` | **Rebuild** | Convex mutations |
| `git-manager.js` | **Port** | Git logic same |
| `mcp-server.js` | **Rebuild** | Convex HTTP actions |
| File-based backlog | **Drop** | Convex database |

---

## Prerequisites

Before starting migration:

1. ✅ Current Aider + Continue stack working
2. ✅ Ollama running on host with qwen2.5-coder:7b
3. ⬜ Docker on 192.168.0.10 for Convex self-hosted
4. ⬜ Obsidian vault accessible from server
5. ⬜ Google OAuth credentials (for Better Auth)

---

## Success Criteria

- [ ] All current functionality preserved
- [ ] Real-time dashboard working
- [ ] Chat UI working with Ollama
- [ ] Obsidian bidirectional sync working
- [ ] Tasks process end-to-end
- [ ] Approvals work via UI
- [ ] Documentation auto-generated
- [ ] Self-hosted (no cloud dependencies except optional Cloudflare)

---

## Related Documents

- [PROJECT-VISION.md](../PROJECT-VISION.md) - Overall vision and phases
- [IMPROVEMENT-ROADMAP1.md](../guides/IMPROVEMENT-ROADMAP1.md) - GPU optimization
- [AI-TOOLS.md](../guides/AI-TOOLS.md) - Current Aider/Continue setup

---

**Created:** January 28, 2026  
**Last Updated:** January 28, 2026  
**Author:** GitHub Copilot
