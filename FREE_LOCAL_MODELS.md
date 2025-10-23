# 🆓 Free Local Models Setup Guide

AuditaAI now supports **FREE local AI models** via Ollama - no API keys needed!

## Quick Start (5 minutes)

### 1. Install Ollama

**Mac/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download

### 2. Pull Free Models

Start with a small, fast model (recommended for demos):
```bash
# Fast & efficient (1.9GB)
ollama pull llama3.2:3b

# Medium quality (4.7GB)
ollama pull mistral:7b

# High quality (4.7GB)
ollama pull phi3:medium

# Tiny model for testing (637MB)
ollama pull tinyllama
```

### 3. Verify Ollama is Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should return list of installed models
```

### 4. Start AuditaAI Backend

The backend will automatically detect Ollama models:

```bash
cd backend
npm run dev
```

You'll see:
```
✅ Ollama detected: 3 free models available
   - llama3.2:3b (FREE)
   - mistral:7b (FREE)
   - phi3:medium (FREE)
```

## Available Free Models

### Recommended for Demos

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| `llama3.2:3b` | 1.9GB | ⚡⚡⚡ | ⭐⭐⭐ | Fast demos, testing |
| `phi3:medium` | 4.7GB | ⚡⚡ | ⭐⭐⭐⭐ | Balanced quality |
| `mistral:7b` | 4.7GB | ⚡⚡ | ⭐⭐⭐⭐ | High quality |

### Advanced Models

| Model | Size | Speed | Quality | Specialty |
|-------|------|-------|---------|-----------|
| `llama3:8b` | 4.7GB | ⚡⚡ | ⭐⭐⭐⭐ | General purpose |
| `codellama:7b` | 3.8GB | ⚡⚡ | ⭐⭐⭐⭐ | Code generation |
| `gemma:7b` | 5.0GB | ⚡⚡ | ⭐⭐⭐⭐ | Google's model |
| `qwen2:7b` | 4.4GB | ⚡⚡ | ⭐⭐⭐⭐ | Multilingual |

### Tiny Models (for testing/CI)

| Model | Size | Speed | Quality | Notes |
|-------|------|-------|---------|-------|
| `tinyllama` | 637MB | ⚡⚡⚡⚡ | ⭐⭐ | Fastest, lowest quality |
| `phi:2.7b` | 1.6GB | ⚡⚡⚡ | ⭐⭐⭐ | Good for quick tests |

## Usage in AuditaAI

### Frontend - Model Selection

Free Ollama models appear automatically in:
- **Live Demo** → Model dropdown
- **Parallel Prompting** → Select any model marked "(FREE)"
- **Rosetta Boot** → Works with all Ollama models

### Backend - Automatic Detection

```javascript
// Backend automatically routes to Ollama for free models
const response = await callLLM('llama3.2:3b', prompt);
// No API key needed! ✅
```

### API Endpoints

Check available models:
```bash
curl http://localhost:3001/api/live-demo/models

# Response includes:
# {
#   "models": [
#     { "id": "llama3.2:3b", "name": "llama3.2:3b (FREE)", "free": true },
#     ...
#   ],
#   "freeModelsCount": 3,
#   "ollamaInstalled": true
# }
```

## Benefits vs Paid APIs

| Feature | Free (Ollama) | Paid (GPT-4/Claude) |
|---------|--------------|---------------------|
| **Cost** | $0 | $0.01-0.03/1K tokens |
| **Privacy** | 100% local | Data sent to provider |
| **Speed** | Fast (local) | Network latency |
| **Availability** | Always | Rate limits apply |
| **Quality** | Good | Excellent |
| **Setup** | 5 min install | API key signup |

## Configuration

### Environment Variables (optional)

Create `.env` in `/backend`:

```bash
# Ollama settings (optional - defaults work)
OLLAMA_BASE_URL=http://localhost:11434
ENABLE_OLLAMA=true

# Only needed if you want paid APIs too
OPENAI_API_KEY=sk-...  # Optional
ANTHROPIC_API_KEY=sk-ant-...  # Optional
```

### Hybrid Mode (Free + Paid)

You can use both free and paid models:
- **Ollama** for testing, demos, high-volume
- **GPT-4/Claude** for production, high-stakes decisions

The system automatically routes to the right provider based on model name.

## Troubleshooting

### Ollama not detected

```bash
# Check if Ollama is running
ollama serve

# Verify it's accessible
curl http://localhost:11434/api/tags
```

### Models not appearing

```bash
# List installed models
ollama list

# Pull a model if none installed
ollama pull llama3.2:3b
```

### Performance issues

```bash
# Use smaller models for faster responses
ollama pull tinyllama  # 637MB, very fast

# Or medium-sized balanced models
ollama pull phi3:medium  # 4.7GB, good quality
```

### Memory issues

Ollama uses ~4-8GB RAM for 7B models. For lower memory:
```bash
# Use 3B models (1-2GB RAM)
ollama pull llama3.2:3b

# Or tiny models (<1GB RAM)
ollama pull tinyllama
```

## Demo Workflow

Perfect setup for investors/demos without spending on API calls:

```bash
# 1. Install Ollama (one-time)
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull fast demo model
ollama pull llama3.2:3b

# 3. Start backend
cd backend && npm run dev

# 4. Start frontend
cd frontend && npm run dev

# ✅ Now you can:
# - Run unlimited parallel prompts (FREE)
# - Test CRIES governance (FREE)
# - Generate receipts (FREE)
# - Compare models (FREE)
# - No API costs! 🎉
```

## Advanced: Custom Models

### Fine-tune for your use case

```bash
# Create a Modelfile
cat > Modelfile <<EOF
FROM llama3.2:3b
SYSTEM "You are an AI governance expert specializing in CRIES metrics and enterprise compliance."
PARAMETER temperature 0.7
EOF

# Build custom model
ollama create auditai-expert -f Modelfile

# Use in AuditaAI
# Will automatically detect as Ollama model
```

## Production Recommendations

### Development/Testing
- Use **Ollama** (`llama3.2:3b`, `phi3:medium`)
- Zero cost, full privacy

### Demos/Investors
- Use **Ollama** (`mistral:7b`, `llama3:8b`)
- No API spend, looks professional

### Production (optional)
- Use **GPT-4** or **Claude** for mission-critical
- Keep Ollama as fallback for high-volume

## Resources

- **Ollama Docs**: https://ollama.ai/docs
- **Model Library**: https://ollama.ai/library
- **AuditaAI Integration**: See `/backend/src/llm-client.js`

---

**🎉 You're ready to run AuditaAI demos for FREE!**

No API keys, no costs, full governance testing with real AI models.
