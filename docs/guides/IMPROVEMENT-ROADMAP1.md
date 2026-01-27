# Improvement Roadmap: From 3-4 Stars to 5 Stars

A comprehensive guide to improving the Dev-Toolbox system's weak points, adding missing features that Kilo Code can't provide, and integrating Obsidian as a knowledge base.

---

## Table of Contents

0. [RTX 3090 GPU Optimization (Do First!)](#rtx-3090-gpu-optimization)
1. [Improving 3-4 Star Features](#improving-3-4-star-features)
2. [Effectiveness Improvements (3+ Stars)](#effectiveness-improvements)
3. [Missing Features Kilo Code Can't Provide](#missing-features-kilo-code-cant-provide)
4. [Complementary AI Tools](#complementary-ai-tools)
5. [Message Queue Spec Reviewer](#message-queue-spec-reviewer)
6. [Obsidian Integration Guide](#obsidian-integration-guide)
7. [Modularity & Architecture](#modularity--architecture)
8. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## RTX 3090 GPU Optimization

> ⚠️ **Priority 0 — Do this FIRST before anything else!**
> 
> Without proper GPU configuration, Ollama uses only 2-4k context window, wasting your RTX 3090's 24GB VRAM. This section unlocks **48k+ context** for better code generation.

### Why This Matters for Dev-Toolbox

| Context Window | What Fits | Code Quality |
|----------------|-----------|--------------|
| 2k (default) | ~50 lines of code | ❌ Loses context mid-file |
| 8k | ~200 lines | ⚠️ Small files only |
| 48k | ~1,200 lines | ✅ Full modules + specs + docs |

With 48k context, Kilo Code can see:
- Your entire spec file
- Multiple source files
- Semantic search results
- Previous conversation context

### VRAM Budget Calculation

Your GPU is a bucket. The model takes up fixed space, the rest is for context (KV Cache).

```
┌─────────────────────────────────────────────────────────┐
│                    RTX 3090 (24 GB)                     │
├─────────────────────────────────────────────────────────┤
│  System Buffer     │  ~1.5 GB  │ OS/Display overhead   │
│  Model (Q3_K_M)    │ ~14.5 GB  │ GLM-4.7-Flash weights │
│  KV Cache          │  ~8.0 GB  │ ← Context window here │
├─────────────────────────────────────────────────────────┤
│  RESULT            │  48-50k tokens context            │
└─────────────────────────────────────────────────────────┘
```

**The Math:**
- Available for KV Cache: 24 GB - 1.5 GB - 14.5 GB = **8 GB**
- KV Cache per token (30B model, FP16): ~0.15 MB
- Max tokens: 8,000 MB ÷ 0.15 MB = **~53,000 tokens**
- Safe limit: **48,000 tokens** (leaves headroom)

### Step 1: Create Optimized Ollama Model

Create a permanent "code expert" model so you don't type flags every time.

**1. Pull the base model:**
```bash
ollama pull glm-4.7-flash:q3_k_m
```

**2. Create `Modelfile` in your project root:**
```dockerfile
# Modelfile - Optimized for RTX 3090 + Dev-Toolbox
FROM glm-4.7-flash:q3_k_m

# 48k context (safe limit for 24GB VRAM)
PARAMETER num_ctx 48128

# Prevent model from rambling
PARAMETER stop "<|endoftext|>"
PARAMETER stop "<|user|>"
PARAMETER stop "<|observation|>"

# Lower temperature for more deterministic code
PARAMETER temperature 0.3

# System prompt optimized for spec-driven development
SYSTEM """You are an expert coding agent for the Dev-Toolbox system.

CONTEXT:
- You have a 48k token context window
- You receive specs in YAML front matter format
- Always read the full spec requirements before coding
- Generate code that passes all acceptance criteria

RULES:
1. Follow the spec requirements exactly
2. Write clean, modular, testable code
3. Include JSDoc comments for functions
4. Handle errors gracefully
5. If unsure, ask for clarification

OUTPUT FORMAT:
- Use markdown code blocks with language tags
- Explain your approach briefly before code
- List any assumptions you made"""
```

**3. Build the custom model:**
```bash
ollama create glmcoder -f Modelfile
```

**4. Verify it works:**
```bash
ollama run glmcoder "Hello, what's your context window size?"
```

### Step 2: Update Dev-Toolbox Config

Update your `config.json` to use the optimized model:

```json
{
  "watcher": {
    "enabled": true,
    "watchPath": "backlog/todo"
  },
  "processing": {
    "model": "glmcoder",
    "ollamaApiBase": "http://localhost:11434",
    "contextWindow": 48128,
    "temperature": 0.3
  }
}
```

### Step 3: Alternative Models for RTX 3090

| Model | Quant | VRAM | Context | Best For |
|-------|-------|------|---------|----------|
| **glm-4.7-flash:q3_k_m** | Q3 | 14.5GB | 48k | General coding |
| **deepseek-coder:33b-q4** | Q4 | 18GB | 32k | Complex algorithms |
| **codellama:34b-q3** | Q3 | 15GB | 45k | Python/JS heavy |
| **qwen2.5-coder:32b-q4** | Q4 | 17GB | 38k | Multi-language |

Create Modelfiles for each:

```bash
# For DeepSeek Coder
cat > Modelfile.deepseek << 'EOF'
FROM deepseek-coder:33b-instruct-q4_K_M
PARAMETER num_ctx 32768
PARAMETER temperature 0.2
PARAMETER stop "<|EOT|>"
EOF

ollama create dscoder -f Modelfile.deepseek
```

### Step 4: Monitor GPU Usage

**While Kilo Code is running, check GPU status:**

```bash
# Check if model is fully on GPU
ollama ps
```

Look at the **PROCESSOR** column:

| Status | Meaning | Action |
|--------|---------|--------|
| `100% GPU` | ✅ Perfect | You're fast (~60 tok/s) |
| `90% GPU / 10% CPU` | ⚠️ Overflow | Reduce `num_ctx` |
| `50% GPU / 50% CPU` | ❌ Too big | Use smaller quant or model |

**Real-time VRAM monitoring:**
```bash
# Watch VRAM usage live
watch -n 1 nvidia-smi

# Or one-liner
nvidia-smi --query-gpu=memory.used,memory.total --format=csv -l 1
```

### Step 5: Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Model runs slow | Spilled to CPU | Lower `num_ctx` to 32000 |
| Out of memory | Context too large | Use Q3 instead of Q4 quant |
| Truncated output | Model stops early | Check stop sequences |
| Garbage output | Context overflow | Reduce context, restart Ollama |

**Reset if things go wrong:**
```bash
# Stop all models
ollama stop glmcoder

# Clear VRAM
sudo nvidia-smi --gpu-reset

# Restart Ollama
systemctl restart ollama  # Linux
brew services restart ollama  # macOS
```

### Quick Validation Script

Add this to your project:

```bash
#!/bin/bash
# scripts/check-gpu.sh

echo "=== GPU Status ==="
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv

echo ""
echo "=== Ollama Models ==="
ollama ps

echo ""
echo "=== Test Context Window ==="
# Generate a prompt that uses context
echo "Testing 48k context..." 
ollama run glmcoder "Count to 10" --verbose 2>&1 | grep "context"
```

```bash
chmod +x scripts/check-gpu.sh
./scripts/check-gpu.sh
```

### Config.json Full Example

```json
{
  "watcher": {
    "enabled": true,
    "watchPath": "backlog/todo",
    "pollInterval": 1000
  },
  "processing": {
    "model": "glmcoder",
    "ollamaApiBase": "http://192.168.1.100:11434",
    "contextWindow": 48128,
    "temperature": 0.3,
    "maxRetries": 3
  },
  "gpu": {
    "device": "RTX 3090",
    "vram": 24576,
    "modelBudget": 14500,
    "contextBudget": 8000,
    "notes": "48k context safe, 50k max before spill"
  }
}
```

---

## Improving 3-4 Star Features

### Current Ratings Breakdown

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| Learning curve | ⭐⭐⭐ | ⭐⭐⭐⭐ | Onboarding experience |
| Test coverage | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | More comprehensive tests |
| Real-time feedback | ⭐⭐⭐ | ⭐⭐⭐⭐ | Streaming output |
| Interactive refinement | ⭐⭐ | ⭐⭐⭐⭐ | Edit → re-run loop |

---

### 1. Improving Learning Curve (⭐⭐⭐ → ⭐⭐⭐⭐)

**Current Problem:** New users need to understand spec format, folder workflow, and approval system.

**Solutions:**

#### A. Interactive Onboarding Wizard
Create a guided first-run experience:

```javascript
// scripts/onboarding.js
const inquirer = require('inquirer');

async function runOnboarding() {
  console.log('🎯 Welcome to Dev-Toolbox!\n');
  
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'createFirst',
      message: 'Would you like to create your first spec now?',
      default: true
    },
    {
      type: 'list',
      name: 'workflow',
      message: 'What type of workflow do you prefer?',
      choices: [
        { name: 'Simple (no approvals)', value: 'simple' },
        { name: 'Standard (code approval only)', value: 'standard' },
        { name: 'Full (code + docs approval)', value: 'full' }
      ]
    }
  ]);
  
  // Create example spec based on choice
  await createExampleSpec(answers.workflow);
  
  console.log('\n✅ Your first spec is ready in backlog/todo/');
  console.log('   Run: npm run watcher to start processing\n');
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "onboarding": "node scripts/onboarding.js",
    "postinstall": "node scripts/onboarding.js --check-first-run"
  }
}
```

#### B. Quick Reference Card
Create a one-page cheatsheet:

```markdown
## Quick Reference

### Create Spec
npm run spec:create

### Start Processing
npm run watcher

### Approve Code
npm run approval:approve-code <spec-id>

### Folder States
todo/ → doing/ → review/ → completed/

### Spec Front Matter (Minimal)
---
title: "Feature Name"
spec:
  enabled: true
  requirements:
    - "Requirement 1"
approval:
  code:
    required: true
---
```

#### C. VS Code Snippets
Create snippets for quick spec creation:

```json
// .vscode/snippets.code-snippets
{
  "Spec Template": {
    "prefix": "spec",
    "body": [
      "---",
      "id: \"spec-${1:id}\"",
      "title: \"${2:Feature Title}\"",
      "spec:",
      "  enabled: true",
      "  type: \"${3|feature,bugfix,refactor|}\"",
      "  requirements:",
      "    - \"${4:Requirement 1}\"",
      "approval:",
      "  code:",
      "    required: ${5|true,false|}",
      "---",
      "",
      "# ${2:Feature Title}",
      "",
      "${0}"
    ],
    "description": "Create a new spec file"
  }
}
```

---

### 2. Improving Test Coverage (⭐⭐⭐ → ⭐⭐⭐⭐⭐)

**Current Problem:** Only `prompt-builder.test.js` exists.

**Solutions:**

#### A. Add Core Module Tests

```javascript
// tests/approval-handler.test.js
const { approveCode, approveDocs, rejectTask } = require('../scripts/approval-handler');
const fs = require('fs').promises;
const path = require('path');

describe('approveCode', () => {
  const testTaskPath = 'backlog/review/test-task.md';
  
  beforeEach(async () => {
    // Create test task file
    await fs.mkdir('backlog/review', { recursive: true });
    await fs.writeFile(testTaskPath, `---
id: test-task
title: Test Task
approval:
  code:
    required: true
    approved: false
---
# Test Task
`);
  });

  afterEach(async () => {
    try { await fs.unlink(testTaskPath); } catch {}
  });

  it('should set approved to true', async () => {
    await approveCode('test-task', 'test-user');
    const content = await fs.readFile(testTaskPath, 'utf-8');
    expect(content).toContain('approved: true');
  });

  it('should record approver name', async () => {
    await approveCode('test-task', 'john@example.com');
    const content = await fs.readFile(testTaskPath, 'utf-8');
    expect(content).toContain('approver: john@example.com');
  });
});
```

```javascript
// tests/semantic-indexer.test.js
const { search, buildIndex } = require('../scripts/semantic-indexer');

describe('semantic-indexer', () => {
  beforeAll(async () => {
    await buildIndex();
  });

  it('should find relevant files for query', async () => {
    const results = await search('watcher processing');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('path');
    expect(results[0]).toHaveProperty('score');
  });

  it('should return empty array for empty query', async () => {
    const results = await search('');
    expect(results).toEqual([]);
  });
});
```

```javascript
// tests/spec-parser.test.js
const specParser = require('../scripts/spec-parser');

describe('spec-parser', () => {
  it('should parse valid spec front matter', () => {
    const content = `---
title: Test Spec
spec:
  enabled: true
  requirements:
    - Req 1
    - Req 2
---
# Body`;

    const result = specParser.parse(content);
    expect(result.spec.enabled).toBe(true);
    expect(result.spec.requirements).toHaveLength(2);
  });

  it('should reject spec without requirements', () => {
    const content = `---
spec:
  enabled: true
---`;

    expect(() => specParser.validate(content)).toThrow();
  });
});
```

#### B. Add Integration Tests

```javascript
// tests/integration/workflow.test.js
const fs = require('fs').promises;
const path = require('path');

describe('Full Workflow Integration', () => {
  const testSpec = 'backlog/todo/test-integration-spec.md';

  beforeAll(async () => {
    // Setup test spec
    await fs.writeFile(testSpec, `---
id: integration-test
title: Integration Test
spec:
  enabled: true
  requirements:
    - "Create hello function"
approval:
  code:
    required: false
  docs:
    required: false
---
# Integration Test
`);
  });

  afterAll(async () => {
    // Cleanup
    const folders = ['todo', 'doing', 'review', 'completed', 'failed'];
    for (const folder of folders) {
      try {
        await fs.unlink(`backlog/${folder}/test-integration-spec.md`);
      } catch {}
    }
  });

  it('should move spec through workflow', async () => {
    // This is a longer-running test
    // Would need proper test harness with watcher
  }, 30000);
});
```

#### C. Coverage Configuration

```javascript
// jest.config.js (updated)
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/shell/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
```

---

### 3. Improving Real-time Feedback (⭐⭐⭐ → ⭐⭐⭐⭐)

**Current Problem:** Output only visible in terminal, no streaming to VS Code.

**Solutions:**

#### A. WebSocket-based Output Streaming

```javascript
// scripts/output-streamer.js
const WebSocket = require('ws');
const EventEmitter = require('events');

class OutputStreamer extends EventEmitter {
  constructor(port = 3003) {
    super();
    this.port = port;
    this.clients = new Set();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
    });

    console.log(`Output streamer listening on ws://localhost:${this.port}`);
  }

  broadcast(type, data) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  taskStarted(taskId, title) {
    this.broadcast('task:started', { taskId, title });
  }

  taskOutput(taskId, output) {
    this.broadcast('task:output', { taskId, output });
  }

  taskCompleted(taskId, success) {
    this.broadcast('task:completed', { taskId, success });
  }
}

module.exports = new OutputStreamer();
```

#### B. Update process-ticket.js to Stream

```javascript
// In scripts/process-ticket.js, update the spawn section:

const outputStreamer = require('./output-streamer');

// ... inside processTicket function:

outputStreamer.taskStarted(taskId, frontMatter.title);

koduProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  stdout += chunk;
  process.stdout.write(chunk);
  outputStreamer.taskOutput(taskId, chunk);  // Stream to WebSocket
});

koduProcess.on('close', (code) => {
  outputStreamer.taskCompleted(taskId, code === 0);
  // ... rest of handler
});
```

#### C. Simple Web Dashboard (Optional)

```html
<!-- web/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Dev-Toolbox - Live Output</title>
  <style>
    body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
    #output { white-space: pre-wrap; background: #252526; padding: 15px; border-radius: 4px; max-height: 80vh; overflow-y: auto; }
    .task-start { color: #569cd6; }
    .task-complete { color: #4ec9b0; }
    .task-error { color: #f44747; }
  </style>
</head>
<body>
  <h2>🔄 Live Processing Output</h2>
  <div id="status">Connecting...</div>
  <div id="output"></div>
  
  <script>
    const output = document.getElementById('output');
    const status = document.getElementById('status');
    
    const ws = new WebSocket('ws://localhost:3003');
    
    ws.onopen = () => {
      status.textContent = '✅ Connected';
      status.style.color = '#4ec9b0';
    };
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const line = document.createElement('div');
      
      switch (msg.type) {
        case 'task:started':
          line.className = 'task-start';
          line.textContent = `\n▶️ Started: ${msg.data.title} (${msg.data.taskId})\n`;
          break;
        case 'task:output':
          line.textContent = msg.data.output;
          break;
        case 'task:completed':
          line.className = msg.data.success ? 'task-complete' : 'task-error';
          line.textContent = msg.data.success ? '\n✅ Completed\n' : '\n❌ Failed\n';
          break;
      }
      
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };
    
    ws.onclose = () => {
      status.textContent = '❌ Disconnected';
      status.style.color = '#f44747';
    };
  </script>
</body>
</html>
```

---

## Effectiveness Improvements

### Getting 3+ Stars on All Effectiveness Metrics

| Metric | Current | Improvement | Target |
|--------|---------|-------------|--------|
| Spec-driven prompts | +++ | Already good | +++ |
| Semantic search | ++ | Add KB sources | +++ |
| Approval gates | +++ | Already good | +++ |
| Auto-documentation | ++ | Better templates | +++ |
| Interactive refinement | + | Add edit loop | +++ |
| Code execution | + | Add sandbox | +++ |

### Key Improvements for Effectiveness

#### 1. Extend Semantic Search to Knowledge Base

Update `config.json` to include external knowledge sources:

```json
{
  "search": {
    "enabled": true,
    "indexPath": ".index/",
    "includePatterns": [
      "**/*.js",
      "**/*.ts", 
      "**/*.md"
    ],
    "externalSources": [
      {
        "name": "obsidian-kb",
        "path": "../obsidian-vault/Knowledge",
        "patterns": ["**/*.md"]
      }
    ],
    "excludePatterns": ["node_modules/**", ".git/**"],
    "maxFileSize": 100000
  }
}
```

Update `semantic-indexer.js`:

```javascript
async function collectAllFiles() {
  const files = await collectFiles(projectRoot);
  
  // Add external sources
  if (searchConfig.externalSources) {
    for (const source of searchConfig.externalSources) {
      const sourcePath = path.resolve(projectRoot, source.path);
      const sourceFiles = await collectFiles(sourcePath, source.patterns);
      files.push(...sourceFiles.map(f => ({
        ...f,
        source: source.name
      })));
    }
  }
  
  return files;
}
```

#### 2. Improve Documentation Templates

Better Handlebars templates with more context:

```markdown
<!-- templates/worklog.md (improved) -->
# Work Log: {{title}}

**Task ID:** {{id}}  
**Date:** {{date}}  
**Model:** {{model}}  
**Duration:** {{duration}}

---

## Requirements Implemented

{{#each requirements}}
- [x] {{this}}
{{/each}}

## Architecture Context

{{#if architecture.components}}
### Components Modified
{{#each architecture.components}}
- `{{this}}`
{{/each}}
{{/if}}

{{#if architecture.decisions}}
### Key Decisions
{{architecture.decisions}}
{{/if}}

## Implementation Summary

{{summary}}

## Files Changed

{{#each files}}
- `{{path}}` - {{description}}
{{/each}}

## Testing Notes

{{#if tests}}
{{tests}}
{{else}}
_No automated tests generated for this task._
{{/if}}

## Next Steps

{{#each nextSteps}}
- {{this}}
{{/each}}
```

#### 3. Add Quick Iteration Mode

Create a "dev mode" that skips approvals for faster iteration:

```javascript
// scripts/quick-mode.js
const matter = require('gray-matter');
const fs = require('fs').promises;

async function enableQuickMode(specPath) {
  const content = await fs.readFile(specPath, 'utf-8');
  const { data, content: body } = matter(content);
  
  // Store original settings
  data._originalApproval = { ...data.approval };
  
  // Disable all approvals
  data.approval = {
    code: { required: false },
    docs: { required: false }
  };
  
  await fs.writeFile(specPath, matter.stringify(body, data));
  console.log('✅ Quick mode enabled - approvals disabled');
}

async function disableQuickMode(specPath) {
  const content = await fs.readFile(specPath, 'utf-8');
  const { data, content: body } = matter(content);
  
  // Restore original settings
  if (data._originalApproval) {
    data.approval = data._originalApproval;
    delete data._originalApproval;
  }
  
  await fs.writeFile(specPath, matter.stringify(body, data));
  console.log('✅ Quick mode disabled - approvals restored');
}

module.exports = { enableQuickMode, disableQuickMode };
```

**Add to package.json:**
```json
{
  "scripts": {
    "quick:on": "node -e \"require('./scripts/quick-mode').enableQuickMode(process.argv[1])\"",
    "quick:off": "node -e \"require('./scripts/quick-mode').disableQuickMode(process.argv[1])\""
  }
}
```

---

## Missing Features Kilo Code Can't Provide

Kilo Code (kodu) is a CLI tool for AI-powered code generation. It **cannot** provide:

| Missing Feature | Why Kilo Code Can't Do It | Implementation Approach |
|-----------------|---------------------------|-------------------------|
| Code execution sandbox | CLI outputs code, doesn't run it | Node.js child_process or Docker |
| Interactive refinement | No chat/feedback loop | Custom WebSocket + simple UI |
| Multi-file diff view | Outputs to files, no UI | VS Code extension or web UI |
| Real-time streaming UI | Terminal only | WebSocket streaming |
| Test execution | Generates tests, doesn't run them | Jest/Mocha integration |
| Dependency management | Writes code, doesn't install | npm/yarn hooks |

### Implementation: Code Execution Sandbox

```javascript
// scripts/code-sandbox.js
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class CodeSandbox {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.maxOutput = options.maxOutput || 1024 * 100; // 100KB
  }

  async execute(code, language = 'javascript') {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sandbox-'));
    
    try {
      const result = await this._runCode(code, language, tempDir);
      return result;
    } finally {
      // Cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  async _runCode(code, language, workDir) {
    const runners = {
      javascript: { cmd: 'node', ext: '.js' },
      typescript: { cmd: 'npx', args: ['ts-node'], ext: '.ts' },
      python: { cmd: 'python3', ext: '.py' }
    };

    const runner = runners[language];
    if (!runner) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const filePath = path.join(workDir, `code${runner.ext}`);
    await fs.writeFile(filePath, code);

    return new Promise((resolve) => {
      const args = runner.args ? [...runner.args, filePath] : [filePath];
      const proc = spawn(runner.cmd, args, {
        cwd: workDir,
        timeout: this.timeout
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        if (stdout.length < this.maxOutput) {
          stdout += data.toString();
        }
      });

      proc.stderr.on('data', (data) => {
        if (stderr.length < this.maxOutput) {
          stderr += data.toString();
        }
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          truncated: stdout.length >= this.maxOutput || stderr.length >= this.maxOutput
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          stdout: '',
          stderr: error.stack
        });
      });
    });
  }
}

module.exports = CodeSandbox;
```

**Usage in approval flow:**

```javascript
// In approval-handler.js, add test execution before approval
const CodeSandbox = require('./code-sandbox');

async function runGeneratedTests(taskId) {
  const sandbox = new CodeSandbox({ timeout: 60000 });
  
  // Find test files for this task
  const testFiles = await findTestFiles(taskId);
  
  const results = [];
  for (const testFile of testFiles) {
    const code = await fs.readFile(testFile, 'utf-8');
    const result = await sandbox.execute(code, 'javascript');
    results.push({ file: testFile, ...result });
  }
  
  return results;
}
```

### Implementation: Interactive Refinement Loop

```javascript
// scripts/interactive-refine.js
const inquirer = require('inquirer');
const matter = require('gray-matter');
const fs = require('fs').promises;
const processTicket = require('./process-ticket');

async function interactiveRefine(specPath) {
  let continueRefining = true;
  
  while (continueRefining) {
    // Read current spec
    const content = await fs.readFile(specPath, 'utf-8');
    const { data: frontMatter, content: body } = matter(content);
    
    console.log('\n📋 Current Spec:', frontMatter.title);
    console.log('Requirements:');
    frontMatter.spec?.requirements?.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req}`);
    });
    
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '▶️  Generate code', value: 'generate' },
        { name: '✏️  Edit requirements', value: 'edit' },
        { name: '➕  Add requirement', value: 'add' },
        { name: '🔍  View generated code', value: 'view' },
        { name: '✅  Approve and finish', value: 'approve' },
        { name: '❌  Cancel', value: 'cancel' }
      ]
    }]);

    switch (action) {
      case 'generate':
        console.log('\n⏳ Generating code with Kilo Code...\n');
        const result = await processTicket(specPath, frontMatter, body, frontMatter.id);
        if (result.success) {
          console.log('\n✅ Generation complete!');
        } else {
          console.log('\n❌ Generation failed:', result.error);
        }
        break;

      case 'edit':
        const { reqIndex } = await inquirer.prompt([{
          type: 'number',
          name: 'reqIndex',
          message: 'Which requirement to edit (number)?'
        }]);
        
        if (reqIndex > 0 && reqIndex <= frontMatter.spec.requirements.length) {
          const { newReq } = await inquirer.prompt([{
            type: 'input',
            name: 'newReq',
            message: 'New requirement text:',
            default: frontMatter.spec.requirements[reqIndex - 1]
          }]);
          frontMatter.spec.requirements[reqIndex - 1] = newReq;
          await fs.writeFile(specPath, matter.stringify(body, frontMatter));
          console.log('✅ Requirement updated');
        }
        break;

      case 'add':
        const { newReq } = await inquirer.prompt([{
          type: 'input',
          name: 'newReq',
          message: 'New requirement:'
        }]);
        frontMatter.spec.requirements.push(newReq);
        await fs.writeFile(specPath, matter.stringify(body, frontMatter));
        console.log('✅ Requirement added');
        break;

      case 'view':
        // Open in VS Code or display
        const { exec } = require('child_process');
        exec(`code ${specPath}`);
        break;

      case 'approve':
        const approvalHandler = require('./approval-handler');
        await approvalHandler.approveCode(frontMatter.id, 'interactive-user');
        console.log('✅ Approved!');
        continueRefining = false;
        break;

      case 'cancel':
        continueRefining = false;
        break;
    }
  }
}

module.exports = { interactiveRefine };
```

### Implementation: Test Runner Integration

```javascript
// scripts/test-runner.js
const { spawn } = require('child_process');

async function runTests(testPattern = 'tests/**/*.test.js') {
  return new Promise((resolve) => {
    const jest = spawn('npx', ['jest', testPattern, '--json'], {
      cwd: process.cwd()
    });

    let output = '';
    jest.stdout.on('data', (data) => output += data);
    jest.stderr.on('data', (data) => output += data);

    jest.on('close', (code) => {
      try {
        const results = JSON.parse(output);
        resolve({
          success: results.success,
          numPassedTests: results.numPassedTests,
          numFailedTests: results.numFailedTests,
          testResults: results.testResults
        });
      } catch {
        resolve({
          success: code === 0,
          raw: output
        });
      }
    });
  });
}

// Auto-run tests after code generation
async function postGenerationTests(taskId) {
  console.log('🧪 Running tests for generated code...');
  
  const result = await runTests(`tests/*${taskId}*`);
  
  if (result.success) {
    console.log(`✅ All ${result.numPassedTests} tests passed`);
  } else {
    console.log(`❌ ${result.numFailedTests} tests failed`);
  }
  
  return result;
}

module.exports = { runTests, postGenerationTests };
```

---

## Complementary AI Tools

These tools work with **Ollama** and complement your Dev-Toolbox workflow.

### CLI Tools

| Tool | Ollama Support | Strength | Time Saved |
|------|----------------|----------|------------|
| **Aider** | ✅ Native | Multi-file edits, git integration | ⭐⭐⭐⭐ |
| **Open Interpreter** | ✅ Native | Runs code, shell commands | ⭐⭐⭐⭐ |
| **Mentat** | ✅ Native | Context-aware edits | ⭐⭐⭐ |

### VS Code Extensions

| Extension | Ollama Support | Strength | Time Saved |
|-----------|----------------|----------|------------|
| **Continue** | ✅ Native | Inline completions + chat | ⭐⭐⭐⭐⭐ |
| **Tabby** | ✅ Self-hosted | Code completion | ⭐⭐⭐⭐ |

### Recommended: Aider

```bash
# Install
pip install aider-chat

# Use with Ollama
aider --model ollama/deepseek-coder:33b
```

**Why it helps:**
- Edits multiple files in one prompt
- Auto-commits with good messages
- Understands your entire codebase
- Works alongside your watcher (use for quick fixes)

### Recommended: Continue Extension

Install via VS Code Extensions marketplace.

**Configure for Ollama** (`.continue/config.json`):
```json
{
  "models": [{
    "title": "DeepSeek Coder",
    "provider": "ollama",
    "model": "deepseek-coder:33b",
    "apiBase": "http://localhost:11434"
  }],
  "tabAutocompleteModel": {
    "title": "Autocomplete",
    "provider": "ollama", 
    "model": "deepseek-coder:6.7b"
  }
}
```

**Why it helps:**
- Inline code completions (like Copilot)
- Highlight code → ask questions
- Runs entirely local with Ollama

### Suggested Tool Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Your Workflow                         │
├─────────────────────────────────────────────────────────┤
│  Quick edits     │  Continue (inline completions)        │
│  Complex tasks   │  Dev-Toolbox + Kilo Code         │
│  Multi-file      │  Aider (git-aware)                    │
│  Spec creation   │  Obsidian + Templater                 │
│  Async review    │  RabbitMQ Spec Reviewer               │
└─────────────────────────────────────────────────────────┘
```

---

## Message Queue Spec Reviewer

Add a message queue (RabbitMQ, Redis, or BullMQ) to enable:
- Async spec processing at scale
- Multiple workers for parallel execution
- Reliable retries and dead-letter handling
- Decoupled architecture

### Architecture Overview

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Watcher    │────▶│  Queue      │────▶│  Workers     │
│ (Publisher)  │     │ (RabbitMQ)  │     │ (Consumers)  │
└──────────────┘     └─────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │ Dead Letter │
                     │   Queue     │
                     └─────────────┘
```

### Option A: RabbitMQ (Enterprise-grade)

```javascript
// scripts/queue/rabbitmq-adapter.js
const amqp = require('amqplib');

class RabbitMQAdapter {
  constructor(url = 'amqp://localhost') {
    this.url = url;
    this.connection = null;
    this.channel = null;
    this.queue = 'spec_processing';
  }

  async connect() {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queue, { durable: true });
    await this.channel.assertQueue(`${this.queue}_dlq`, { durable: true });
  }

  async publish(spec) {
    const message = JSON.stringify(spec);
    this.channel.sendToQueue(this.queue, Buffer.from(message), {
      persistent: true
    });
  }

  async consume(handler) {
    this.channel.consume(this.queue, async (msg) => {
      try {
        const spec = JSON.parse(msg.content.toString());
        await handler(spec);
        this.channel.ack(msg);
      } catch (error) {
        // Send to dead letter queue
        this.channel.sendToQueue(
          `${this.queue}_dlq`,
          msg.content,
          { persistent: true }
        );
        this.channel.ack(msg);
      }
    });
  }

  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

module.exports = RabbitMQAdapter;
```

### Option B: BullMQ (Node.js native, uses Redis)

```javascript
// scripts/queue/bullmq-adapter.js
const { Queue, Worker } = require('bullmq');

class BullMQAdapter {
  constructor(redisUrl = 'redis://localhost:6379') {
    this.connection = { url: redisUrl };
    this.queueName = 'spec_processing';
  }

  async connect() {
    this.queue = new Queue(this.queueName, { connection: this.connection });
  }

  async publish(spec) {
    await this.queue.add('process-spec', spec, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
  }

  async consume(handler) {
    this.worker = new Worker(this.queueName, async (job) => {
      await handler(job.data);
    }, { connection: this.connection });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });
  }

  async close() {
    await this.queue?.close();
    await this.worker?.close();
  }
}

module.exports = BullMQAdapter;
```

### Option C: Simple In-Memory (Development)

```javascript
// scripts/queue/memory-adapter.js
const EventEmitter = require('events');

class MemoryAdapter extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
  }

  async connect() {
    // No-op for memory adapter
  }

  async publish(spec) {
    this.queue.push(spec);
    this.emit('message');
  }

  async consume(handler) {
    this.on('message', async () => {
      if (this.processing) return;
      this.processing = true;
      
      while (this.queue.length > 0) {
        const spec = this.queue.shift();
        try {
          await handler(spec);
        } catch (error) {
          console.error('Processing failed:', error);
        }
      }
      
      this.processing = false;
    });
  }

  async close() {
    this.removeAllListeners();
  }
}

module.exports = MemoryAdapter;
```

### Modular Queue Interface

```javascript
// scripts/queue/index.js
const config = require('../../config.json');

async function createQueueAdapter() {
  const adapterType = config.queue?.type || 'memory';
  
  switch (adapterType) {
    case 'rabbitmq':
      const RabbitMQ = require('./rabbitmq-adapter');
      return new RabbitMQ(config.queue.url);
    
    case 'bullmq':
    case 'redis':
      const BullMQ = require('./bullmq-adapter');
      return new BullMQ(config.queue.url);
    
    case 'memory':
    default:
      const Memory = require('./memory-adapter');
      return new Memory();
  }
}

module.exports = { createQueueAdapter };
```

### Config.json Addition

```json
{
  "queue": {
    "enabled": true,
    "type": "memory",
    "url": "amqp://localhost",
    "workers": 2,
    "retries": 3
  }
}
```

### Updated Watcher with Queue

```javascript
// In scripts/watcher.js, add queue integration
const { createQueueAdapter } = require('./queue');

let queueAdapter;

async function startWatcher() {
  queueAdapter = await createQueueAdapter();
  await queueAdapter.connect();
  
  // Existing watcher logic...
  chokidar.watch('backlog/todo/*.md').on('add', async (filePath) => {
    const spec = await parseSpec(filePath);
    await queueAdapter.publish(spec);  // Queue instead of direct process
  });
}

async function startWorker() {
  queueAdapter = await createQueueAdapter();
  await queueAdapter.connect();
  
  await queueAdapter.consume(async (spec) => {
    await processTicket(spec.path, spec.frontMatter, spec.body, spec.id);
  });
}
```

---

## Obsidian Integration Guide

### Why Obsidian?

- **Native markdown with YAML frontmatter** — exactly what specs use
- **Local-first** — matches your Ollama setup philosophy
- **Graph view** — visualize spec relationships
- **2,700+ plugins** — extend functionality
- **Templates** — automate spec creation
- **Dataview** — query and track tasks

### Setup Steps

#### Step 1: Create Symlink to Backlog

```bash
# Create symlink from Obsidian vault to your project
ln -s /path/to/dev01/backlog /path/to/obsidian-vault/Backlog
```

#### Step 2: Install Required Plugins

| Plugin | Purpose | Install |
|--------|---------|---------|
| **Templater** | Create specs from templates | [GitHub](https://github.com/SilentVoid13/Templater) |
| **Dataview** | Query tasks by status | [GitHub](https://github.com/blacksmithgu/obsidian-dataview) |
| **Tasks** | Track acceptance criteria | Built-in or plugin |
| **Kanban** | Visual board for tasks | [GitHub](https://github.com/mgmeyers/obsidian-kanban) |

#### Step 3: Create Templater Template

Create `Templates/spec.md` in your Obsidian vault:

```markdown
---
id: "spec-<% tp.date.now("YYYYMMDDHHmmss") %>"
title: "<% tp.file.title %>"
description: "<% await tp.system.prompt("Description") %>"
status: "To Do"
priority: "<% await tp.system.suggester(["low", "medium", "high"], ["low", "medium", "high"]) %>"
model: "ollama/deepseek-coder"

spec:
  enabled: true
  type: "<% await tp.system.suggester(["feature", "bugfix", "refactor", "docs", "infra"], ["feature", "bugfix", "refactor", "docs", "infra"]) %>"
  requirements:
    - "<% await tp.system.prompt("Requirement 1") %>"
  architecture:
    components: []
    integrations: []
    decisions: ""

approval:
  code:
    required: <% await tp.system.suggester(["true", "false"], [true, false]) %>
    autoApprove: false
  docs:
    required: <% await tp.system.suggester(["true", "false"], [true, false]) %>
    generate:
      worklog: true
      adr: false
      changelog: true

acceptanceCriteria:
  - "<%await tp.system.prompt("Acceptance Criterion 1") %>"

createdAt: <% tp.date.now("YYYY-MM-DDTHH:mm:ssZ") %>
updatedAt: <% tp.date.now("YYYY-MM-DDTHH:mm:ssZ") %>
---

# <% tp.file.title %>

## Overview

<% await tp.system.prompt("Detailed overview") %>

## Technical Notes

_Add implementation notes here._

## References

- 
```

#### Step 4: Create Dataview Dashboard

Create `Dashboard.md` in your vault:

```markdown
# Task Dashboard

## 📋 Todo
```dataview
TABLE title AS "Title", priority AS "Priority", spec.type AS "Type"
FROM "Backlog/todo"
WHERE spec.enabled = true
SORT priority DESC
```

## 🔄 In Progress
```dataview
TABLE title AS "Title", priority AS "Priority"
FROM "Backlog/doing"
SORT file.mtime DESC
```

## 👀 Review
```dataview
TABLE title AS "Title", approval.code.approved AS "Code", approval.docs.approved AS "Docs"
FROM "Backlog/review"
```

## ✅ Completed (Last 7 Days)
```dataview
TABLE title AS "Title", completedAt AS "Completed"
FROM "Backlog/completed"
WHERE date(completedAt) > date(today) - dur(7 days)
SORT completedAt DESC
LIMIT 10
```

## 📊 Statistics
- Total specs: `$= dv.pages('"Backlog"').where(p => p.spec?.enabled).length`
- Pending approval: `$= dv.pages('"Backlog/review"').length`
- Completed this week: `$= dv.pages('"Backlog/completed"').where(p => dv.date(p.completedAt) > dv.date('today') - dv.duration('7 days')).length`
```

#### Step 5: Configure Obsidian Settings

**Templater Settings:**
- Template folder: `Templates`
- Trigger on new file: `Backlog/todo`
- Auto-apply template: Select `spec.md`

**Folder Structure:**
```
Your Obsidian Vault/
├── Backlog/           ← Symlink to dev01/backlog/
│   ├── todo/
│   ├── doing/
│   ├── review/
│   └── completed/
├── Knowledge/         ← Your KB
│   ├── Architecture/
│   ├── Patterns/
│   └── References/
├── Templates/
│   └── spec.md
└── Dashboard.md
```

#### Step 6: Update Semantic Indexer to Include KB

Update `config.json`:

```json
{
  "search": {
    "enabled": true,
    "includePatterns": ["**/*.js", "**/*.ts", "**/*.md"],
    "externalSources": [
      {
        "name": "obsidian-kb",
        "path": "../your-obsidian-vault/Knowledge",
        "patterns": ["**/*.md"]
      }
    ]
  }
}
```

### Workflow with Obsidian

```
1. Open Obsidian
2. Navigate to Backlog/todo/
3. Create new note (Cmd+N)
4. Templater prompts for spec details
5. Spec file created with proper frontmatter
6. Save file → Watcher detects → Processing begins
7. Monitor progress on Dashboard.md (auto-updates)
8. Review generated code in Obsidian or VS Code
9. Approve via CLI or VS Code tasks
10. Task moves to completed/ → Dashboard updates
```

---

## Modularity & Architecture

> **Design Principle:** Every component should be swappable without affecting others.

### Current Modular Components

| Component | Interface | Implementations |
|-----------|-----------|----------------|
| AI Backend | `processTicket()` | Kilo Code (kodu) |
| Search | `search()`, `buildIndex()` | MiniSearch |
| Approvals | `approveCode()`, `approveDocs()` | File-based |
| Docs | `generateWorklog()` | Handlebars templates |

### Planned Modular Components

| Component | Interface | Future Options |
|-----------|-----------|----------------|
| **Queue** | `publish()`, `consume()` | Memory, BullMQ, RabbitMQ, Kafka |
| **AI Backend** | `generate(prompt)` | Kilo Code, Aider, Continue, OpenAI |
| **Storage** | `read()`, `write()`, `move()` | File system, S3, Database |
| **Search** | `index()`, `query()` | MiniSearch, Elasticsearch, Meilisearch |
| **Notifications** | `notify(event)` | Console, Slack, Discord, Email |

### Adapter Pattern Template

```javascript
// scripts/adapters/base-adapter.js
class BaseAdapter {
  async connect() { throw new Error('Not implemented'); }
  async disconnect() { throw new Error('Not implemented'); }
  async healthCheck() { throw new Error('Not implemented'); }
}

module.exports = BaseAdapter;
```

```javascript
// scripts/adapters/ai-adapter.js
const BaseAdapter = require('./base-adapter');

class AIAdapter extends BaseAdapter {
  async generate(prompt, options = {}) {
    throw new Error('Not implemented');
  }
  
  async stream(prompt, onChunk) {
    throw new Error('Not implemented');
  }
}

module.exports = AIAdapter;
```

```javascript
// scripts/adapters/ai/kodu-adapter.js
const AIAdapter = require('../ai-adapter');
const { spawn } = require('child_process');

class KoduAdapter extends AIAdapter {
  constructor(config) {
    super();
    this.model = config.model || 'deepseek-coder:33b';
    this.apiBase = config.apiBase || 'http://localhost:11434';
  }

  async connect() {
    // Verify Ollama is running
    const response = await fetch(`${this.apiBase}/api/tags`);
    if (!response.ok) throw new Error('Ollama not available');
  }

  async generate(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'kodu',
        '--message', prompt,
        '--model', this.model,
        options.autoApprove ? '--auto-approve' : ''
      ].filter(Boolean);

      const proc = spawn('npx', args, {
        env: { ...process.env, OLLAMA_API_BASE: this.apiBase }
      });

      let output = '';
      proc.stdout.on('data', (data) => output += data);
      proc.on('close', (code) => {
        code === 0 ? resolve(output) : reject(new Error(output));
      });
    });
  }

  async healthCheck() {
    try {
      await this.connect();
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

module.exports = KoduAdapter;
```

```javascript
// scripts/adapters/ai/aider-adapter.js
const AIAdapter = require('../ai-adapter');
const { spawn } = require('child_process');

class AiderAdapter extends AIAdapter {
  constructor(config) {
    super();
    this.model = config.model || 'ollama/deepseek-coder:33b';
  }

  async generate(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        '--model', this.model,
        '--message', prompt,
        '--yes',  // Auto-confirm
        '--no-git'  // Optional: skip git integration
      ];

      const proc = spawn('aider', args);
      let output = '';
      proc.stdout.on('data', (data) => output += data);
      proc.on('close', (code) => {
        code === 0 ? resolve(output) : reject(new Error(output));
      });
    });
  }
}

module.exports = AiderAdapter;
```

### Factory Pattern for Adapters

```javascript
// scripts/adapters/factory.js
const config = require('../../config.json');

const adapters = {
  ai: {
    kodu: () => require('./ai/kodu-adapter'),
    aider: () => require('./ai/aider-adapter'),
    // Add more as needed
  },
  queue: {
    memory: () => require('./queue/memory-adapter'),
    bullmq: () => require('./queue/bullmq-adapter'),
    rabbitmq: () => require('./queue/rabbitmq-adapter'),
  },
  search: {
    minisearch: () => require('./search/minisearch-adapter'),
    // elasticsearch: () => require('./search/elasticsearch-adapter'),
  }
};

function createAdapter(type, name, options = {}) {
  const adapterFactory = adapters[type]?.[name];
  if (!adapterFactory) {
    throw new Error(`Unknown adapter: ${type}/${name}`);
  }
  
  const AdapterClass = adapterFactory();
  return new AdapterClass({ ...config[type], ...options });
}

module.exports = { createAdapter };
```

### Config for Swappable Components

```json
{
  "adapters": {
    "ai": {
      "type": "kodu",
      "model": "deepseek-coder:33b",
      "apiBase": "http://localhost:11434"
    },
    "queue": {
      "type": "memory",
      "url": null
    },
    "search": {
      "type": "minisearch",
      "indexPath": ".index/"
    },
    "notifications": {
      "type": "console",
      "channels": []
    }
  }
}
```

### Benefits of This Architecture

| Benefit | Description |
|---------|-------------|
| **Swap AI backends** | Switch from Kilo Code to Aider with one config change |
| **Scale with queues** | Start with memory, move to RabbitMQ when needed |
| **Test in isolation** | Mock adapters for unit tests |
| **Add features** | New notification channel = new adapter file |
| **Future-proof** | When better tools emerge, plug them in |

### Migration Path

1. **Phase 1 (Current):** Direct function calls
2. **Phase 2:** Wrap existing code in adapter interfaces
3. **Phase 3:** Add factory pattern
4. **Phase 4:** Config-driven adapter selection
5. **Phase 5:** Hot-swappable adapters (optional)

---

## Implementation Priority Matrix

| Improvement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| **🔥 RTX 3090 GPU Setup** | 30 min | Critical | ⚫ Do FIRST |
| **Create glmcoder Modelfile** | 10 min | Critical | ⚫ Do FIRST |
| **VS Code snippets** | 1 hour | High | 🔴 Do first |
| **Continue extension setup** | 1 hour | High | 🔴 Do first |
| **Obsidian symlink + Templater** | 2 hours | High | 🔴 Do first |
| **Add core tests** | 4 hours | High | 🔴 Do first |
| **Onboarding wizard** | 3 hours | Medium | 🟡 Soon |
| **Dataview dashboard** | 2 hours | Medium | 🟡 Soon |
| **Quick mode toggle** | 2 hours | Medium | 🟡 Soon |
| **WebSocket streaming** | 4 hours | Medium | 🟡 Soon |
| **Code sandbox** | 6 hours | High | 🟡 Soon |
| **Aider integration** | 2 hours | High | 🟡 Soon |
| **Message queue (BullMQ)** | 4 hours | Medium | 🟡 Soon |
| **Adapter refactor** | 6 hours | High | 🟡 Soon |
| **Interactive refinement** | 8 hours | High | 🟢 Later |
| **Web dashboard** | 12 hours | Medium | 🟢 Later |
| **Test runner integration** | 4 hours | Medium | 🟢 Later |
| **RabbitMQ support** | 4 hours | Low | 🟢 Later |

---

## Quick Start: What to Do Now

### Before Anything Else (30 minutes)

1. **Configure RTX 3090 for 48k context:**
   ```bash
   # Pull base model
   ollama pull glm-4.7-flash:q3_k_m
   
   # Create Modelfile (see RTX 3090 section above)
   # Build optimized model
   ollama create glmcoder -f Modelfile
   
   # Verify
   ollama run glmcoder "What is your context window?"
   ```

2. **Monitor GPU to confirm 100% GPU:**
   ```bash
   ollama ps  # Should show 100% GPU
   ```

### Immediate (Today)

1. **Create VS Code snippets:**
   ```bash
   mkdir -p .vscode
   # Create snippets.code-snippets file
   ```

2. **Set up Obsidian symlink:**
   ```bash
   ln -s $(pwd)/backlog /path/to/your/obsidian-vault/Backlog
   ```

3. **Install Obsidian plugins:**
   - Templater
   - Dataview

### This Week

1. Add test files for approval-handler and semantic-indexer
2. Create Obsidian spec template
3. Create Dataview dashboard
4. Add quick mode toggle
5. **Set up Continue extension for inline completions**
6. **Install and configure Aider for multi-file edits**

### This Month

1. Implement WebSocket output streaming
2. Add code execution sandbox
3. Create interactive refinement CLI
4. Improve documentation templates
5. **Refactor to adapter pattern (AI, Queue, Search)**
6. **Add BullMQ/Redis queue support**

---

## Summary

Your Dev-Toolbox is already a solid 4-star system. To reach 5 stars:

| Category | Key Improvement |
|----------|-----------------|
| **🔥 GPU Setup** | 48k context on RTX 3090 (DO FIRST!) |
| **Learning curve** | Onboarding wizard + snippets |
| **Test coverage** | Add tests for all core modules |
| **Real-time feedback** | WebSocket streaming |
| **Interactive refinement** | Edit → re-run CLI loop |
| **Missing features** | Code sandbox + test runner |
| **Knowledge base** | Obsidian integration |
| **Complementary tools** | Continue + Aider |
| **Scalability** | Message queue + workers |
| **Future-proofing** | Modular adapter architecture |

The **modular architecture** ensures you can swap any component later without rewriting the system. Start simple (memory queue, Kilo Code), scale when needed (RabbitMQ, multiple AI backends).

---

*Document created: 2026-01-21*
*Next review: After implementing priority items*
