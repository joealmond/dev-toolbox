# Ollama Model Reference

This document provides guidance on selecting and configuring Ollama models for use with Dev-Toolbox and Kilo Code CLI.

## Recommended Models

### Default: `qwen2.5-coder:7b`

The **Qwen 2.5 Coder 7B** model is our recommended default for most use cases. It provides an excellent balance of:

- **Speed**: Fast enough for interactive use
- **Quality**: High-quality code generation and understanding  
- **VRAM**: ~5GB, fits on most modern GPUs

```bash
# Install the recommended model
ollama pull qwen2.5-coder:7b
```

## Model Comparison

| Model | Parameters | VRAM Usage | Speed | Quality | Best For |
|-------|------------|------------|-------|---------|----------|
| **qwen2.5-coder:7b** ⭐ | 7B | ~5GB | Fast | High | Default, most tasks |
| qwen2.5-coder:3b | 3B | ~2.5GB | Very Fast | Good | Quick fixes, prototypes |
| qwen2.5-coder:14b | 14B | ~10GB | Medium | Very High | Complex refactoring |
| qwen2.5-coder:32b | 32B | ~20GB | Slow | Excellent | Max quality (RTX 4090+) |
| codellama:7b | 7B | ~5GB | Fast | Good | Alternative to Qwen |
| codellama:13b | 13B | ~8GB | Medium | High | More capable alternative |

## Installation by Use Case

### Standard Setup (Most Users)

For most development tasks on a typical machine (8-16GB VRAM):

```bash
# Primary model
ollama pull qwen2.5-coder:7b

# Optional: Faster model for simple tasks
ollama pull qwen2.5-coder:3b
```

### High-End GPU Setup (RTX 3090/4090, 24GB VRAM)

For maximum quality on powerful hardware:

```bash
# Default for most tasks
ollama pull qwen2.5-coder:7b

# For complex refactoring
ollama pull qwen2.5-coder:14b

# Optional: Maximum quality (slow but excellent)
ollama pull qwen2.5-coder:32b
```

### Limited VRAM Setup (4-6GB)

For machines with limited GPU memory:

```bash
# Primary model
ollama pull qwen2.5-coder:3b

# Optional: Better quality when time permits
ollama pull qwen2.5-coder:7b
```

## Configuration

### config.json

Update your `config.json` to list available models:

```json
{
  "ollama": {
    "defaultModel": "qwen2.5-coder:7b",
    "availableModels": [
      "qwen2.5-coder:7b",
      "qwen2.5-coder:3b",
      "qwen2.5-coder:14b",
      "codellama:7b"
    ],
    "timeout": 300000
  }
}
```

### Per-Task Model Override

Specify a different model in task front matter:

```yaml
---
title: Complex Refactoring Task
model: qwen2.5-coder:14b
priority: high
---
```

### Environment Variables

Override the default model via environment:

```bash
# Set default model
export OLLAMA_MODEL="qwen2.5-coder:14b"

# Run setup script
bash scripts/setup-kilocode.sh
```

## Kilo Code CLI Compatibility

### Known Issue: v0.13.0+

Versions of `@kilocode/cli` from v0.13.0 onwards have a bug with the Ollama provider. See [GitHub Issue #4434](https://github.com/Kilo-Org/kilocode/issues/4434).

**Workaround**: Use v0.12.1:

```bash
npm install -g @kilocode/cli@0.12.1
```

### Context Length

For large codebases, increase context length:

```bash
# Default is 16384 tokens
export OLLAMA_CTX=32768
bash scripts/setup-kilocode.sh
```

## Model Performance Guidelines

### Response Times (RTX 3090)

Approximate times for a typical coding task:

| Model | First Token | Full Response |
|-------|-------------|---------------|
| qwen2.5-coder:3b | ~1s | 5-15s |
| qwen2.5-coder:7b | ~2s | 10-30s |
| qwen2.5-coder:14b | ~4s | 30-90s |
| qwen2.5-coder:32b | ~8s | 60-180s |

### When to Use Larger Models

Use `qwen2.5-coder:14b` or `32b` for:

- Complex multi-file refactoring
- Architecture changes
- Code requiring deep understanding of patterns
- Tasks with extensive acceptance criteria

### When to Use Smaller Models

Use `qwen2.5-coder:3b` for:

- Simple bug fixes
- Quick prototypes
- Formatting/style changes
- Adding simple features

## Troubleshooting

### Model Not Found

```bash
# Check available models
ollama list

# Pull if missing
ollama pull qwen2.5-coder:7b
```

### Out of Memory

If you see CUDA OOM errors:

1. Try a smaller model: `qwen2.5-coder:3b`
2. Reduce context length: `OLLAMA_CTX=8192`
3. Close other GPU-intensive applications

### Slow Responses

If responses are too slow:

1. Ensure GPU is being used: check `nvidia-smi` during inference
2. Try a smaller model
3. Reduce context length

## See Also

- [INSTALLATION.md](../guides/INSTALLATION.md) - Full installation guide
- [CONFIG.md](CONFIG.md) - Configuration reference
- [USAGE.md](../guides/USAGE.md) - Usage guide with model selection
- [Ollama Model Library](https://ollama.com/library) - Full model catalog
