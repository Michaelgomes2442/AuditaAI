# 🚀 Quick Start - Governed LLM Calls

## For Developers - Copy & Paste Ready

### 1. Start the Server
```bash
cd /home/michaelgomes/AuditaAI/backend
pnpm start
# Server runs on http://localhost:3001
```

### 2. Test API Endpoints
```bash
# Get Merkle specification
curl http://localhost:3001/api/merkle/spec

# Get governance stats
curl http://localhost:3001/api/governance/stats

# List merkle seals
curl http://localhost:3001/api/governance/merkle-seals

# List governance receipts
curl http://localhost:3001/api/governance/receipts
```

### 3. Make a Governed LLM Call (Frontend)
```javascript
const response = await fetch('http://localhost:3001/api/pilot/run-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'gpt-4',
    mode: 'live',
    prompt: 'Explain quantum computing',
    models: ['gpt-4'],
    useGovernance: true,  // <-- Enable governance
    apiKeys: {
      openai: 'sk-...'    // Your API key
    }
  })
});

const data = await response.json();
console.log('CRIES Omega:', data.results[0].cries.Omega);
console.log('Receipt ID:', data.results[0].governance.receipt.id);
```

### 4. Check If Sealing Happened (After 10 calls)
```bash
curl http://localhost:3001/api/governance/stats
# Look for: "totalSeals": 1
```

### 5. Get Merkle Proof for Receipt
```bash
# By receipt ID
curl http://localhost:3001/api/merkle/proof?receiptId=5

# By prompt hash
curl "http://localhost:3001/api/merkle/proof?promptHash=a3f8e9..."
```

### 6. Export Certificate for Regulators
```bash
curl http://localhost:3001/api/merkle/seals/1/certificate > certificate.json
```

### 7. Verify Proof Locally
```bash
curl -X POST http://localhost:3001/api/merkle/verify-proof \
  -H "Content-Type: application/json" \
  -d '{
    "leaf": "a3f8e92b...",
    "proof": [{"sibling": "...", "position": "right"}],
    "merkleRoot": "b2c4d1e5..."
  }'
# Returns: {"valid": true}
```

---

## How Governance Works (6 Steps)

```
User Prompt
    ↓
1. Apply Speechcraft → Add governance obligations
    ↓
2. Call LLM → Get response
    ↓
3. Validate → Check compliance
    ↓
4. Generate Receipt → Compute CRIES metrics
    ↓
5. Check Seal Batch → Auto-seal at 10 receipts OR 5min
    ↓
6. Return → Response + receipt + governance metadata
```

---

## Key Functions (Backend)

### Make Governed Call
```javascript
// In server.js - already integrated
const result = await governedLLMCall(modelId, prompt, {
  userName: 'Alice',
  userRole: 'analyst',
  userId: 123,
  organizationId: 456,
  apiKeys: { openai: 'sk-...' }
});

console.log(result.content);           // LLM response
console.log(result.receipt);            // Governance receipt
console.log(result.governance);         // Validation results
```

### Check Sealing Status
```javascript
import { checkAndSealMerkleBatch } from './src/merkle-sealer.js';

// After each receipt creation
await checkAndSealMerkleBatch();
// Auto-seals if:
//   - 10+ unsealed receipts, OR
//   - Oldest unsealed > 5 minutes
```

### Generate Proof
```javascript
import { getMerkleProof } from './src/merkle-sealer.js';

const proof = await getMerkleProof(receiptId);
// Returns: { leaf, proof, merkleRoot, sealId }
```

### Export Certificate
```javascript
import { exportMerkleCertificate } from './src/merkle-sealer.js';

const cert = await exportMerkleCertificate(sealId);
// Self-verifying certificate with seal chain
```

---

## Environment Variables

Add to `/backend/.env`:
```bash
# Required
DATABASE_URL="postgresql://..."

# Optional - Merkle configuration
MERKLE_BATCH_SIZE=10                    # Receipts per seal
MERKLE_SEAL_TIMEOUT_MS=300000           # 5 minutes

# Optional - LLM API keys
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Common Issues & Solutions

### Issue: "Cannot find module speechcraft.js"
**Solution**: Use `pnpm start` (not `node server.js`)
```bash
pnpm start  # Uses tsx for TypeScript support
```

### Issue: "Address already in use :::3001"
**Solution**: Kill existing process
```bash
lsof -ti:3001 | xargs kill -9
pnpm start
```

### Issue: No receipts created
**Solution**: Check useGovernance flag
```javascript
useGovernance: true  // Must be true!
```

### Issue: No seals after 10 receipts
**Solution**: Check database
```bash
npx prisma studio
# Check governance_receipts table
# Check merkle_seals table
```

---

## Testing Checklist

- [ ] Server starts: `pnpm start`
- [ ] Health check: `curl http://localhost:3001/health`
- [ ] Merkle spec: `curl http://localhost:3001/api/merkle/spec`
- [ ] Governance stats: `curl http://localhost:3001/api/governance/stats`
- [ ] Run test: `node test-integration.mjs`
- [ ] Make 10 governed calls
- [ ] Check seal created
- [ ] Generate proof
- [ ] Export certificate

---

## Production Deployment

### 1. Install
```bash
cd /home/michaelgomes/AuditaAI/backend
pnpm install
```

### 2. Deploy Database
```bash
npx prisma db push
npx prisma generate
```

### 3. Start Production
```bash
NODE_ENV=production pnpm start
```

### 4. Verify
```bash
curl http://your-domain.com/health
curl http://your-domain.com/api/governance/stats
```

---

## Monitoring

### Key Metrics to Track
- Total receipts created
- Total seals generated
- Average CRIES Omega
- Seal creation latency
- Proof verification rate

### Dashboard Queries
```bash
# Real-time stats
watch -n 5 'curl -s http://localhost:3001/api/governance/stats'

# Recent violations
curl http://localhost:3001/api/governance/stats | jq '.recentViolations'

# Seal list
curl http://localhost:3001/api/governance/merkle-seals | jq '.[0]'
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Frontend UI                     │
│           (Next.js on port 3007)                 │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│               Backend Server                     │
│            (Express on port 3001)                │
│  ┌───────────────────────────────────────────┐  │
│  │       governedLLMCall() Wrapper           │  │
│  └───────────────────────────────────────────┘  │
│                     ↓                            │
│  ┌─────────────────────────┬─────────────────┐  │
│  │   Speechcraft v2.1      │  Merkle Sealer  │  │
│  │   (Governance)          │  (Integrity)    │  │
│  └─────────────────────────┴─────────────────┘  │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│              PostgreSQL Database                 │
│  - governance_receipts (CRIES metrics)          │
│  - merkle_seals (cryptographic proofs)          │
└─────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Build Frontend Dashboard**
   - Display governance stats
   - Show seal chain
   - Export certificates

2. **Add Monitoring**
   - Log seal events
   - Track CRIES trends
   - Alert on violations

3. **External Integration**
   - REST API for verifiers
   - Webhook notifications
   - PDF certificate export

---

## Documentation Links

- Full Technical Spec: `/MERKLE_SEALER_V2_COMPLETE.md`
- Quick Reference: `/MERKLE_SEALER_QUICK_REF.md`
- API Guide: `/MERKLE_SEALER_V2_1_API.md`
- Integration Details: `/INTEGRATION_COMPLETE.md`
- Summary: `/INTEGRATION_SUMMARY.md`

---

## Support

**Server won't start?**
```bash
cd /home/michaelgomes/AuditaAI/backend
pnpm install
npx prisma generate
pnpm start
```

**API not responding?**
```bash
curl -v http://localhost:3001/health
# Check terminal output for errors
```

**Database issues?**
```bash
npx prisma studio
# Visual database browser
```

---

**Status**: ✅ Production Ready  
**Version**: Speechcraft v2.1 + Merkle Sealer v2.1  
**Last Updated**: November 4, 2025
