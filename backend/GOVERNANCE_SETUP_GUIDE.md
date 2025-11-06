# Governance Optimizer Setup & Verification Guide

## ✅ Status Report

### 1. LLM Client Implementation ✓
The `./src/llm-client.js` has **REAL API implementations**:
- ✅ `callGPT4()` - Real OpenAI API calls (GPT-4o, GPT-4 Turbo)
- ✅ `callClaude()` - Real Anthropic API calls (Claude 3.5 Sonnet)
- ✅ System prompt injection for governance support
- ✅ Enterprise cloud models only (GPT-4, Claude)

### 2. Database Schema ✓
All required governance tables exist in Prisma schema:
- ✅ `GovernanceReceipt` - Stores CRIES metrics and governance data
- ✅ `BENReceipt` - Lamport chain receipts
- ✅ `LamportCounter` - Logical clock management
- ✅ `MerkleSeal` - Merkle tree sealing for audit chains

### 3. API Endpoints ✓
- ✅ `/api/live-demo/parallel-prompt` - Real LLM calls with CRIES metrics
- ✅ `/api/rosetta/boot` - Governance system initialization
- ✅ WebSocket support for real-time CRIES updates

---

## 🚀 Setup Steps

### Step 1: Verify API Keys in .env

```bash
# Backend folder
cd /home/michaelgomes/AuditaAI/backend

# Check current status
cat .env | grep -E "OPENAI_API_KEY|ANTHROPIC_API_KEY"
```

**Current Status:**
- ✅ ANTHROPIC_API_KEY: Already configured
- ⚠️ OPENAI_API_KEY: MISSING (add key to enable GPT-4 models)
- ℹ️ Enterprise cloud models only - local model support removed

### Step 2: Add OpenAI API Key (Optional)

If you have an OpenAI API key:

```bash
# Edit .env
nano .env

# Find the line: OPENAI_API_KEY=
# Change to: OPENAI_API_KEY=sk-your-actual-key-here

# Save with Ctrl+O, Enter, Ctrl+X
```

Or use a command:
```bash
# Replace placeholder
sed -i 's/OPENAI_API_KEY=$/OPENAI_API_KEY=sk-your-key-here/' .env
```

### Step 3: Install Dependencies

```bash
cd /home/michaelgomes/AuditaAI/backend

# Install packages
pnpm install

# Generate Prisma client
pnpm run build
```

### Step 4: Run Database Migrations

```bash
cd /home/michaelgomes/AuditaAI/backend

# Check migration status
pnpm exec prisma migrate status

# Run pending migrations (if any)
pnpm exec prisma migrate dev --name "add governance tables"

# Or reset DB (⚠️ this deletes data!)
# pnpm run db:reset
```

### Step 5: Verify Database Connection

```bash
# Check Prisma can connect
node -e "import('./prisma-client-build/index.js').then(p => p.user.count().then(c => console.log('✅ DB Connected! User count:', c)).catch(e => console.error('❌ DB Error:', e.message)))"
```

### Step 6: Start the Server

```bash
cd /home/michaelgomes/AuditaAI/backend

# Development mode with watch
pnpm run dev

# Or production mode
pnpm start
```

Server will start at: `http://localhost:3001`

---

## 🧪 Testing the Governance Optimizer

### Test 1: Check LLM Connectivity

```bash
curl -X GET http://localhost:3001/api/models \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "models": [
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4o Mini",
      "provider": "openai",
      "governanceSupport": true
    },
    {
      "id": "claude-3-5-haiku-20241022-rosetta",
      "name": "Claude 3.5 Haiku (Rosetta)",
      "provider": "anthropic",
      "governanceSupport": true
    },
    ...
  ]
}
```

### Test 2: Call Parallel Prompt (Claude Only)

```bash
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in 3 sentences",
    "standardModelId": "gpt-4o-mini",
    "rosettaModelId": "claude-3-5-haiku-20241022-rosetta"
  }'
```

Expected response:
```json
{
  "standardResponse": {
    "content": "...",
    "model": "gpt-4o-mini",
    "cries": {
      "C": 0.85,
      "R": 0.88,
      "I": 0.90,
      "E": 0.87,
      "S": 0.92,
      "overall": 0.88
    },
    "provider": "openai"
  },
  "rosettaResponse": {
    "content": "...",
    "model": "claude-3-5-haiku-20241022-rosetta",
    "cries": {
      "C": 0.92,
      "R": 0.91,
      "I": 0.94,
      "E": 0.93,
      "S": 0.95,
      "overall": 0.93
    },
    "provider": "anthropic",
    "governanceApplied": true
  },
  "criesImprovement": 0.057,
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### Test 3: Call Parallel Prompt (With OpenAI Key)

```bash
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in 3 sentences",
    "standardModelId": "gpt-4o-mini",
    "rosettaModelId": "claude-3-5-haiku-20241022-rosetta",
    "apiKeys": {
      "openai": "sk-your-actual-key-here",
      "anthropic": "sk-ant-already-in-env"
    }
  }'
```

### Test 4: Use Free Ollama Models

First, install and start Ollama:

```bash
# Install Ollama (if not already installed)
# https://ollama.ai

# Download a free model (3-7B models work great)
ollama pull llama2:7b
# or: ollama pull mistral:7b

# Start Ollama server (if not running)
ollama serve

# Enable in .env
sed -i 's/ENABLE_OLLAMA=false/ENABLE_OLLAMA=true/' /home/michaelgomes/AuditaAI/backend/.env

# Restart server
# Ctrl+C to stop, then pnpm run dev
```

Then test:
```bash
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is machine learning?",
    "standardModelId": "ollama-llama2",
    "rosettaModelId": "ollama-mistral"
  }'
```

### Test 5: Boot Rosetta Governance System

```bash
curl -X POST http://localhost:3001/api/rosetta/boot \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Test User",
    "userRole": "Architect"
  }'
```

Expected response includes:
- Lamport clock initialization
- Persona lock confirmation
- Governance receipt issuance
- Boot receipts chain

---

## 🛠️ Troubleshooting

### Issue: "OpenAI API key not configured"
**Solution:** Add your key to .env and restart:
```bash
echo "OPENAI_API_KEY=sk-your-key" >> /home/michaelgomes/AuditaAI/backend/.env
# Restart server
```

### Issue: "Database connection failed"
**Solution:** Check DATABASE_URL and Prisma connection:
```bash
cd /home/michaelgomes/AuditaAI/backend
pnpm exec prisma db push
```

### Issue: "Model not found in liveDemoState"
**Solution:** Restart server - models are loaded at startup:
```bash
# Kill server with Ctrl+C
# Restart with: pnpm run dev
```

### Issue: "Ollama call failed"
**Solution:** Ensure Ollama is running:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Pull a model if needed
ollama pull llama2:7b
```

### Issue: Timeout on large prompts
**Solution:** Increase timeout in request:
```bash
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Your long prompt here...",
    "standardModelId": "gpt-4o-mini",
    "rosettaModelId": "claude-3-5-haiku-20241022-rosetta",
    "timeout": 120000
  }'
```

---

## 📊 Monitoring

### Real-time CRIES Metrics
Connect to WebSocket to get live updates:
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.on('message', (data) => {
  const cries = JSON.parse(data);
  console.log('CRIES Update:', cries);
});
```

### Database Queries
View with Prisma Studio:
```bash
cd /home/michaelgomes/AuditaAI/backend
pnpm exec prisma studio
```

Opens at: `http://localhost:5555`

### Logs
Check server logs for governance events:
```bash
# Server is already logging to console
# Look for markers:
# 🛡️ - Governance applied
# 📊 - CRIES calculation
# 💾 - Database receipt saved
# 📡 - WebSocket emission
```

---

## ✨ Key Features Ready to Use

| Feature | Status | API Endpoint | Notes |
|---------|--------|--------------|-------|
| Real LLM Calls | ✅ | `/api/live-demo/parallel-prompt` | GPT-4, Claude, Ollama |
| CRIES Metrics | ✅ | Automatic calculation | Real-time via WebSocket |
| Lamport Receipts | ✅ | Auto-generated | Governance chain |
| System Governance | ✅ | `/api/rosetta/boot` | Persona-based |
| Database Persistence | ✅ | GovernanceReceipt table | Audit trail |
| Merkle Sealing | ✅ | Automatic on batch | Immutable receipts |

---

## 🔄 Next Steps

1. **For Development:**
   - Run `pnpm run dev` for hot-reload development
   - Monitor server logs for governance events
   - Use Prisma Studio to inspect database

2. **For Production:**
   - Set environment variables in hosting platform
   - Run migrations: `pnpm exec prisma migrate deploy`
   - Enable Prisma Optimize for query monitoring

3. **For Deployment:**
   - Use Vercel (recommended) - set secrets for API keys
   - Or Docker - include .env.production
   - Ensure DATABASE_URL is configured

---

## 📞 Support

For issues or questions:
- Check the logs: `tail -f backend.log`
- Review this guide: You are here!
- Check API status: `curl http://localhost:3001/api/health`
