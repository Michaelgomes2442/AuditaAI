# 🚀 Governance Optimizer - Quick Start Card

## ✅ Setup Complete!

**Status:** Ready to use  
**Server:** http://localhost:3001  
**Database:** PostgreSQL connected  
**LLM APIs:** Claude ✅ | GPT-4 ⏳ | Ollama ✅

---

## 🎯 Test in 30 Seconds

### 1️⃣ Start Server (if not running)
```bash
cd /home/michaelgomes/AuditaAI/backend && pnpm start
```

### 2️⃣ Make Real LLM Call
```bash
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is AI governance?",
    "standardModelId": "claude-3-5-haiku-20241022",
    "rosettaModelId": "claude-3-5-haiku-20241022-rosetta"
  }'
```

### 3️⃣ See Results
```json
{
  "standardResponse": {
    "content": "...",
    "cries": { "overall": 0.88 }  // 88% CRIES score
  },
  "rosettaResponse": {
    "content": "...",
    "cries": { "overall": 0.93 },  // 93% with governance!
    "governanceApplied": true
  },
  "criesImprovement": 0.057  // +5.7% improvement
}
```

---

## 📊 What's Ready

| Feature | Status | How to Use |
|---------|--------|-----------|
| Real LLM Calls | ✅ | POST `/api/live-demo/parallel-prompt` |
| CRIES Metrics | ✅ | POST `/api/math-canon/sigma` |
| Receipts | ✅ | GET `/api/receipts` |
| Governance | ✅ | POST `/api/rosetta/boot` |
| Free Models | ✅ | Use Ollama models (no API key) |
| Claude | ✅ | API key already set |
| GPT-4 | ⏳ | Add key to `.env` OPENAI_API_KEY |

---

## 🧪 All Endpoints

### Comparisons
```
POST /api/live-demo/parallel-prompt
```

### CRIES Metrics
```
POST /api/math-canon/sigma                 # Calculate score
GET /api/math-canon/tritrack-state         # Get current state
```

### Receipts
```
GET /api/receipts                          # List all
GET /api/receipts/:id                      # Get one
GET /api/receipts/registry                 # Registry
```

### Governance
```
GET /api/rosetta/boot                      # Check status
POST /api/rosetta/boot                     # Boot system
GET /api/governance/bands                  # Band config
```

### Status
```
GET /api/health                            # Server health
GET /api/live-demo/models                  # Available models
```

---

## 🎓 Key Concepts

### CRIES Metrics (Math Canon v Ω.8)
```
σ = 0.4×C + 0.4×R + 0.2×I

C = Completeness   (covers all aspects)
R = Reliability    (accurate info)
I = Integrity      (no contradictions)
E = Ethics         (aligned with guidelines)
S = Safety         (no harmful content)
```

### Governance
- **Standard LLM:** No governance applied
- **Rosetta LLM:** Governance rules enforced
- **Improvement:** % increase in CRIES from governance

### Receipts
- Cryptographic audit trail
- Lamport logical clock
- Immutable chain
- Merkle sealing

---

## 🔧 Configuration

### Environment (.env)
```bash
# Already set
ANTHROPIC_API_KEY=sk-ant-...              ✅
DATABASE_URL=postgres://...               ✅
ENABLE_OLLAMA=true                        ✅

# Optional - add for GPT-4
OPENAI_API_KEY=sk-...
```

### Available Models
- `claude-3-5-haiku-20241022` ✅
- `claude-opus-4-1-20250805` ✅
- `gpt-4o-mini` (needs key)
- `gpt-4o` (needs key)
- `llama2:7b` (free)
- `mistral` (free)
- `llama3.2:3b` (free)

---

## ⚡ Common Tasks

### Test CRIES Calculation
```bash
curl -X POST http://localhost:3001/api/math-canon/sigma \
  -H "Content-Type: application/json" \
  -d '{
    "completeness": 0.85,
    "reliability": 0.88,
    "integrity": 0.90,
    "effectiveness": 0.87,
    "security": 0.92
  }'
```

### Get All Models
```bash
curl http://localhost:3001/api/live-demo/models | jq '.models[] | {name, provider}'
```

### Check Server
```bash
curl http://localhost:3001/api/health | jq '.status'
```

### View Receipts
```bash
curl http://localhost:3001/api/receipts/registry | jq '.receipts | length'
```

### Boot Governance
```bash
curl -X POST http://localhost:3001/api/rosetta/boot \
  -H "Content-Type: application/json" \
  -d '{"userName":"Test","userRole":"Architect"}'
```

---

## 🐛 Quick Fixes

**Server not starting?**
```bash
cd /home/michaelgomes/AuditaAI/backend
pnpm install
pnpm start
```

**Models not found?**
Use pre-configured IDs: `claude-3-5-haiku-20241022`, not `test-gpt4`

**Timeout on requests?**
Increase timeout: Add `"timeout": 60000` to request body

**Ollama not working?**
```bash
ollama serve          # Start Ollama
ollama pull llama2:7b # Pull model
```

**API returning 500?**
Check server logs:
```bash
tail -50 /tmp/server.log
```

---

## 📖 Documentation

- Full Setup: `GOVERNANCE_SETUP_GUIDE.md`
- Detailed Report: `GOVERNANCE_OPTIMIZER_READY.md`
- CRIES Formula: `MATH_CANON_IMPLEMENTATION.md`
- Architecture: `ARCHITECTURE_FLOW.md`

---

## ✨ You're Ready!

✅ Real LLM APIs connected  
✅ CRIES metrics operational  
✅ Governance system active  
✅ Database configured  
✅ All endpoints responding  

**Start using it now!** 🚀

```bash
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What makes AI safe?",
    "standardModelId": "claude-3-5-haiku-20241022",
    "rosettaModelId": "claude-3-5-haiku-20241022-rosetta"
  }'
```

See the CRIES improvement! 📊
