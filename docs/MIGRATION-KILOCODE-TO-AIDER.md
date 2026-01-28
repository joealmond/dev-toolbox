# Migration: Kilocode → Continue + Aider

**Date:** January 2026  
**Status:** ✅ Complete  
**Reason:** Kilocode v0.12.1 had poor UX in containers; v0.13.0+ had Ollama compatibility bugs

## Summary

Successfully migrated dev-toolbox from Kilocode CLI to a dual-tool architecture:
- **Aider (v0.86.1)** - Terminal-based AI coding for automated task processing
- **Continue (v1.5.39)** - VS Code extension for interactive manual coding

Implemented adapter pattern to allow future tool swaps without rewriting core logic.

---

## Changes Made

### 1. Architecture: Adapter Pattern

Created adapter abstraction layer for AI tools:

**New Files:**
- `scripts/adapters/ai-adapter.js` - Base abstract class
- `scripts/adapters/aider-adapter.js` - Aider implementation (terminal)
- `scripts/adapters/continue-adapter.js` - Continue implementation (file-based markers)
- `scripts/adapters/adapter-factory.js` - Factory pattern for adapter selection

**Benefits:**
- Swap AI tools by changing config.json
- Add new tools by implementing AIAdapter interface
- Consistent error handling and logging
- Per-task adapter override capability

---

### 2. Code Changes

#### `scripts/process-ticket.js`
**Before:**
```javascript
const koduProcess = spawn('npx', ['kodu', '--message', prompt, ...]);
// ~100 lines of spawn handling code
```

**After:**
```javascript
const adapter = AdapterFactory.create({
  adapter: config.ai.adapter,
  model, ollamaHost, timeout, autoApprove
});
const result = await adapter.process({
  prompt, workingDirectory, taskId, contextFiles
});
```

**Impact:** Simplified from 100+ lines to ~20 lines, cleaner error handling

---

#### `.devcontainer/Dockerfile`
**Removed:**
```dockerfile
RUN npm install -g @kilocode/cli@0.12.1
```

**Added:**
```dockerfile
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --break-system-packages aider-chat==0.86.1
```

**Impact:** Container now includes Python + Aider instead of Kilocode

---

#### `.devcontainer/devcontainer.json`
**Removed:**
```json
"extensions": ["kilocode.kilo-code"]
```

**Added:**
```json
"extensions": ["continue.continue"]
```

**Impact:** VS Code now includes Continue extension by default

---

#### `config.json`
**Added:**
```json
{
  "ai": {
    "adapter": "aider",
    "autoApprove": true
  }
}
```

**Impact:** Centralized AI tool configuration with easy switching

---

### 3. Documentation Updates

#### Updated Files:
1. **README.md**
   - Changed "Kilo Code CLI" → "Continue (UI) + Aider (Terminal)"
   - Updated architecture diagram
   - Added adapter pattern to features

2. **docs/guides/INSTALLATION.md**
   - Removed Kilocode installation steps
   - Added Python + Aider installation
   - Updated prerequisites list

3. **docs/ARCHITECTURE.md**
   - Added adapter pattern section
   - Updated task processor documentation
   - Added code examples for adapter usage

4. **docs/guides/AI-TOOLS.md** (NEW)
   - Complete guide for available adapters
   - Installation instructions for each tool
   - Configuration examples
   - Performance comparison
   - Troubleshooting guide
   - How to add new adapters

---

### 4. Installation Scripts

#### `install/install-macos.sh`
**Removed:**
- `npm install -g backlog.md`
- `npm install -g @kilocode/cli`
- `ollama pull deepseek-coder`
- `ollama pull codellama`

**Added:**
- `brew install python3`
- `pip3 install aider-chat==0.86.1`
- `ollama pull qwen2.5-coder:7b`

---

#### `install/install-linux.sh`
**Removed:**
- `sudo npm install -g backlog.md`
- `sudo npm install -g kodu`
- `ollama pull deepseek-coder`
- `ollama pull codellama`

**Added:**
- `$INSTALL_CMD python3 python3-pip`
- `pip3 install --user aider-chat==0.86.1`
- `ollama pull qwen2.5-coder:7b`

---

## Configuration

### Default Setup (Automated Processing)

```json
{
  "ai": {
    "adapter": "aider",
    "autoApprove": true
  },
  "ollama": {
    "defaultModel": "qwen2.5-coder:7b"
  }
}
```

### Per-Task Override

```yaml
---
title: Complex Interactive Task
adapter: continue  # Use Continue UI for this specific task
---
```

---

## Testing

### 1. Test Aider Installation

```bash
# Check installation
aider --version

# Test with Ollama
aider --model ollama/qwen2.5-coder:7b
```

### 2. Test Continue in VS Code

1. Open VS Code
2. Look for Continue icon in sidebar
3. Open Continue settings
4. Add Ollama provider:
```json
{
  "models": [{
    "title": "Qwen Coder",
    "provider": "ollama",
    "model": "qwen2.5-coder:7b",
    "apiBase": "http://localhost:11434"
  }]
}
```

### 3. Test Adapter Factory

```bash
node -e "
const AdapterFactory = require('./scripts/adapters/adapter-factory.js').default;
const adapter = AdapterFactory.create({ adapter: 'aider', model: 'qwen2.5-coder:7b' });
console.log('Adapter created:', adapter.getName());
"
```

### 4. Test Task Processing

```bash
# Create test task
echo '---
title: Test Aider Integration
adapter: aider
---

Create a simple hello.js file that logs "Hello from Aider!"
' > backlog/todo/test-aider.md

# Process it
node scripts/process-ticket.js backlog/todo/test-aider.md
```

---

## Rollback Plan (If Needed)

### Quick Rollback to Kilocode

1. **Revert Dockerfile:**
```bash
git checkout HEAD~1 .devcontainer/Dockerfile
```

2. **Revert config.json:**
```bash
git checkout HEAD~1 config.json
```

3. **Install Kilocode:**
```bash
npm install -g @kilocode/cli@0.12.1
```

4. **Revert process-ticket.js:**
```bash
git checkout HEAD~1 scripts/process-ticket.js
```

### Partial Rollback (Use Both)

Keep Aider but also install Kilocode:
```bash
npm install -g @kilocode/cli@0.12.1
```

Create "kilocode" adapter in `scripts/adapters/kilocode-adapter.js` if needed.

---

## Benefits of New Architecture

### 1. Flexibility
- Switch AI tools via config.json
- Per-task tool override
- Easy to add new tools (Claude Code, Cursor, etc.)

### 2. Better UX
- **Aider:** Fast terminal-based processing, good for automation
- **Continue:** Rich VS Code UI, great for interactive development

### 3. Maintainability
- Centralized adapter logic
- Consistent error handling
- Easier to test and debug

### 4. Future-Proof
- Not locked into single vendor
- Can adopt new AI coding tools as they emerge
- Adapter pattern is industry standard

---

## Known Issues

### Issue 1: Continue Requires Manual Action
**Problem:** Continue adapter creates marker files that require manual processing in VS Code UI

**Workaround:** Use Aider for automated tasks, Continue for interactive work

**Future Fix:** Consider Continue API integration when available

---

### Issue 2: Aider Timeout on Large Codebases
**Problem:** Aider may timeout on very large files or repos

**Workaround:** Increase `config.ollama.timeout` or use contextFiles filtering

**Config:**
```json
{
  "ollama": {
    "timeout": 600000  // 10 minutes
  }
}
```

---

## Migration Checklist

- [x] Create adapter abstraction layer
- [x] Implement Aider adapter
- [x] Implement Continue adapter  
- [x] Update process-ticket.js
- [x] Update Dockerfile
- [x] Update devcontainer.json
- [x] Add config.json ai section
- [x] Update README.md
- [x] Update INSTALLATION.md
- [x] Update ARCHITECTURE.md
- [x] Create AI-TOOLS.md guide
- [x] Update install-macos.sh
- [x] Update install-linux.sh
- [ ] Rebuild devcontainer
- [ ] Test Aider in terminal
- [ ] Test Continue in VS Code
- [ ] Test process-ticket.js with sample task
- [ ] Update CHANGELOG.md

---

## Related Documentation

- [AI-TOOLS.md](./guides/AI-TOOLS.md) - Complete AI tools guide
- [INSTALLATION.md](./guides/INSTALLATION.md) - Installation instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CONFIG.md](./operations/CONFIG.md) - Configuration options

---

**Migrated by:** GitHub Copilot  
**Review Status:** Pending Testing  
**Next Steps:** Test implementation with real tasks
