# CRIES v3 Migration Guide

**Target**: Migrate `backend/server.js` from v2 → v3  
**Impact**: `/api/pilot/run-prompt`, `/api/pilot/rerun` endpoints  
**Backward Compatibility**: ✅ v2 preserved in `v2_legacy/`

---

## 📋 Quick Reference

### v2 API (Current)
```javascript
const { computeCRIES } = require('./track-a-analyzer.js');

const cries = computeCRIES(
  responseText,
  useGovernance,
  prompt
);
// Returns: { C, R, I, E, S, Omega, cries_score }
```

### v3 API (New)
```javascript
const { computeCRIESv3 } = require('./src/cries/compute-cries.js');
const { LocalEmbeddingAdapter } = require('./src/cries/embeddings/adapter.js');

const cries = await computeCRIESv3({
  prompt,
  response: responseText,
  context: {
    metadata: { model, temperature, useGovernance },
    historyWindow: recentRuns  // For historical baseline
  },
  governanceMode: useGovernance ? 'regulatory-audit' : 'default',
  seed: 1337,
  embedding: new LocalEmbeddingAdapter('mock')
});
// Returns: { C, R, I, E, S, Omega, cries_score, evidence, baseline, determinism }
```

---

## 🔧 Step-by-Step Migration

### Step 1: Update Imports

**Before (server.js lines ~1-20)**
```javascript
const { computeCRIES } = require('./track-a-analyzer.js');
```

**After**
```javascript
const { computeCRIESv3 } = require('./src/cries/compute-cries.js');
const { LocalEmbeddingAdapter } = require('./src/cries/embeddings/adapter.js');

// Initialize embedding adapter (reuse across requests)
const embeddingAdapter = new LocalEmbeddingAdapter('mock');
```

---

### Step 2: Update `/api/pilot/run-prompt` Endpoint

**Before (server.js ~line 850-950)**
```javascript
app.post('/api/pilot/run-prompt', async (req, res) => {
  try {
    const { prompt, model, useGovernance, sessionId, runId } = req.body;
    
    // ... (validate, increment lamport, etc.)
    
    // Call LLM
    const response = await callLLM(prompt, model, useGovernance);
    
    // Compute CRIES v2
    const cries = computeCRIES(
      response.content,
      useGovernance,
      prompt
    );
    
    // Generate receipts
    const analysisReceipt = {
      receipt_type: 'analysis',
      session_id: sessionId,
      lamport_timestamp: lamport,
      // ... metadata
      scores: {
        coherence: cries.C,
        rigor: cries.R,
        integration: cries.I,
        empathy: cries.E,
        strictness: cries.S,
        cries_score: cries.cries_score,
        Omega: cries.Omega
      }
    };
    
    // ... (seal, store, emit)
    
    res.json({ success: true, response: response.content, cries });
  } catch (error) {
    // ...
  }
});
```

**After**
```javascript
app.post('/api/pilot/run-prompt', async (req, res) => {
  try {
    const { prompt, model, useGovernance, sessionId, runId } = req.body;
    
    // ... (validate, increment lamport, etc.)
    
    // Call LLM
    const response = await callLLM(prompt, model, useGovernance);
    
    // Fetch historical runs for baseline (last 5 runs for this session)
    const recentRuns = await prisma.governanceReceipt.findMany({
      where: {
        session_id: sessionId,
        receipt_type: 'analysis'
      },
      orderBy: { lamport_timestamp: 'desc' },
      take: 5,
      select: {
        scores: true,
        timestamp: true
      }
    });
    
    // Compute CRIES v3
    const cries = await computeCRIESv3({
      prompt,
      response: response.content,
      context: {
        metadata: { 
          model, 
          temperature: response.temperature || 0.2,
          useGovernance 
        },
        historyWindow: recentRuns.map(r => ({
          timestamp: r.timestamp,
          scores: {
            C: r.scores.coherence,
            R: r.scores.rigor,
            I: r.scores.integration,
            E: r.scores.empathy,
            S: r.scores.strictness
          }
        }))
      },
      governanceMode: useGovernance ? 'regulatory-audit' : 'default',
      seed: 1337,
      embedding: embeddingAdapter
    });
    
    // Generate analysis receipt with v3 data
    const analysisReceipt = {
      receipt_type: 'analysis',
      session_id: sessionId,
      lamport_timestamp: lamport,
      timestamp: new Date().toISOString(),
      previous_digest: prevDigest,
      prompt_hash: crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16),
      
      // Core scores (backward compatible)
      scores: {
        coherence: cries.C,
        rigor: cries.R,
        integration: cries.I,
        empathy: cries.E,
        strictness: cries.S,
        cries_score: cries.cries_score,
        Omega: cries.Omega
      },
      
      // NEW v3 fields
      evidence: cries.evidence,
      baseline: cries.baseline,
      determinism: cries.determinism,
      governance_mode: cries.governance_mode,
      weights: cries.weights,
      calculation_details: cries.calculation_details,
      risk_flags: cries.risk_flags || []
    };
    
    // Seal receipt
    const receiptContent = JSON.stringify({
      receipt_type: analysisReceipt.receipt_type,
      lamport_timestamp: analysisReceipt.lamport_timestamp,
      scores: analysisReceipt.scores,
      determinism_hash: cries.determinism.hashInput
    });
    const digest = crypto.createHash('sha256').update(receiptContent).digest('hex');
    analysisReceipt.digest = digest;
    
    // Store in database
    await prisma.governanceReceipt.create({
      data: {
        ...analysisReceipt,
        model_provider: model.includes('gpt') ? 'openai' : 'anthropic'
      }
    });
    
    // Emit WebSocket event
    io.emit('receipt-generated', {
      sessionId,
      runId,
      receipt: analysisReceipt,
      cries  // Full v3 object with evidence
    });
    
    res.json({ 
      success: true, 
      response: response.content, 
      cries,
      receipt: analysisReceipt 
    });
    
  } catch (error) {
    console.error('Error in /api/pilot/run-prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### Step 3: Update `/api/pilot/rerun` Endpoint

**Before (server.js ~line 1050-1100)**
```javascript
app.post('/api/pilot/rerun', async (req, res) => {
  try {
    const { receiptId } = req.body;
    
    // Fetch original receipt
    const originalReceipt = await prisma.governanceReceipt.findUnique({
      where: { id: receiptId }
    });
    
    // Re-run CRIES v2
    const cries = computeCRIES(
      originalReceipt.response_text,
      originalReceipt.use_governance,
      originalReceipt.prompt_text
    );
    
    // Compare scores
    const comparison = {
      original: originalReceipt.scores,
      rerun: { C: cries.C, R: cries.R, ... },
      identical: JSON.stringify(originalReceipt.scores) === JSON.stringify(rerun)
    };
    
    res.json({ success: true, comparison });
  } catch (error) {
    // ...
  }
});
```

**After**
```javascript
app.post('/api/pilot/rerun', async (req, res) => {
  try {
    const { receiptId } = req.body;
    
    // Fetch original receipt
    const originalReceipt = await prisma.governanceReceipt.findUnique({
      where: { id: receiptId }
    });
    
    // Check if original was v2 or v3
    const isV3 = originalReceipt.determinism?.seed !== undefined;
    
    if (isV3) {
      // Re-run CRIES v3 with SAME seed for determinism
      const cries = await computeCRIESv3({
        prompt: originalReceipt.prompt_text,
        response: originalReceipt.response_text,
        context: {
          metadata: originalReceipt.metadata || {},
          historyWindow: []  // No history for re-run (isolated test)
        },
        governanceMode: originalReceipt.governance_mode || 'default',
        seed: originalReceipt.determinism.seed,  // CRITICAL: Same seed
        embedding: embeddingAdapter
      });
      
      // Compare determinism hashes
      const hashMatch = cries.determinism.hashInput === originalReceipt.determinism.hashInput;
      
      // Compare scores (should be byte-for-byte identical)
      const comparison = {
        original: {
          scores: originalReceipt.scores,
          determinism: originalReceipt.determinism
        },
        rerun: {
          scores: {
            coherence: cries.C,
            rigor: cries.R,
            integration: cries.I,
            empathy: cries.E,
            strictness: cries.S,
            cries_score: cries.cries_score
          },
          determinism: cries.determinism
        },
        identical: hashMatch && JSON.stringify(originalReceipt.scores) === JSON.stringify({
          coherence: cries.C,
          rigor: cries.R,
          integration: cries.I,
          empathy: cries.E,
          strictness: cries.S,
          cries_score: cries.cries_score,
          Omega: cries.Omega
        }),
        hashMatch
      };
      
      res.json({ 
        success: true, 
        version: 'v3',
        comparison,
        evidence: cries.evidence  // Include for debugging
      });
      
    } else {
      // Legacy v2 receipt - use v2 for backward compatibility
      const { computeCRIES: computeCRIESv2 } = require('./src/cries/v2_legacy/track-a-analyzer-v2.js');
      
      const cries = computeCRIESv2(
        originalReceipt.response_text,
        originalReceipt.use_governance,
        originalReceipt.prompt_text
      );
      
      const comparison = {
        original: originalReceipt.scores,
        rerun: {
          coherence: cries.C,
          rigor: cries.R,
          integration: cries.I,
          empathy: cries.E,
          strictness: cries.S,
          cries_score: cries.cries_score
        },
        identical: JSON.stringify(originalReceipt.scores.cries_score) === JSON.stringify(cries.cries_score)
      };
      
      res.json({ 
        success: true, 
        version: 'v2-legacy',
        comparison 
      });
    }
    
  } catch (error) {
    console.error('Error in /api/pilot/rerun:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### Step 4: Update Database Schema (Optional - Store Evidence)

If you want to store full v3 evidence in the database (recommended for auditability):

**Add to Prisma schema (backend/prisma/schema.prisma)**
```prisma
model GovernanceReceipt {
  id                Int      @id @default(autoincrement())
  receipt_type      String
  session_id        String
  lamport_timestamp Int
  timestamp         DateTime @default(now())
  previous_digest   String?
  digest            String
  
  // Existing fields
  scores            Json
  prompt_text       String?  @db.Text
  response_text     String?  @db.Text
  model_provider    String?
  
  // NEW v3 fields
  evidence          Json?     // SubMetricEvidence objects
  baseline          Json?     // Baseline comparisons
  determinism       Json?     // Determinism info (seed, hash)
  governance_mode   String?   // 'default' | 'regulatory-audit' | etc.
  weights           Json?     // Pillar weights used
  calculation_details Json?   // Human-readable formulas
  risk_flags        Json?     // Automatic risk flags
  
  @@index([session_id, lamport_timestamp])
  @@index([receipt_type])
}
```

**Run migration**
```bash
cd backend
npx prisma migrate dev --name add_cries_v3_fields
```

---

### Step 5: Update Frontend Display (Optional - Show Evidence)

If you want to display v3 evidence in the pilot dashboard:

**frontend/app/pilot/page.tsx** (add evidence viewer)
```typescript
// Add to receipt detail modal
{receipt.evidence && (
  <div className="mt-4">
    <h4 className="font-semibold mb-2">Evidence (CRIES v3)</h4>
    <div className="space-y-2 text-sm">
      {Object.entries(receipt.evidence).map(([key, ev]: [string, any]) => (
        <details key={key} className="bg-gray-50 p-2 rounded">
          <summary className="cursor-pointer font-medium">
            {key.replace(/_/g, ' ')} - Score: {ev.rawScore?.toFixed(4)}
          </summary>
          <div className="mt-2 pl-4 text-xs">
            <p><strong>Method:</strong> {ev.method}</p>
            <p><strong>Explanation:</strong> {ev.explanation}</p>
            {ev.computations && (
              <pre className="mt-1 bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(ev.computations, null, 2)}
              </pre>
            )}
          </div>
        </details>
      ))}
    </div>
  </div>
)}

{receipt.baseline?.historical && (
  <div className="mt-4">
    <h4 className="font-semibold mb-2">Historical Baseline</h4>
    <div className="grid grid-cols-5 gap-2 text-sm">
      {Object.entries(receipt.baseline.historical.deltas).map(([pillar, delta]) => (
        <div key={pillar} className={delta > 0 ? 'text-green-600' : 'text-red-600'}>
          {pillar}: {delta > 0 ? '+' : ''}{delta.toFixed(3)}
        </div>
      ))}
    </div>
  </div>
)}

{receipt.risk_flags && receipt.risk_flags.length > 0 && (
  <div className="mt-4">
    <h4 className="font-semibold mb-2 text-red-600">Risk Flags</h4>
    <ul className="list-disc pl-5 text-sm">
      {receipt.risk_flags.map((flag: string, i: number) => (
        <li key={i}>{flag}</li>
      ))}
    </ul>
  </div>
)}
```

---

## ✅ Testing Checklist

### 1. Determinism Test
```bash
# Run same prompt twice with same seed
curl -X POST http://localhost:3001/api/pilot/run-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is data governance?",
    "model": "gpt-4o",
    "useGovernance": true,
    "sessionId": "test-determinism",
    "runId": "run1"
  }' > run1.json

curl -X POST http://localhost:3001/api/pilot/run-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is data governance?",
    "model": "gpt-4o",
    "useGovernance": true,
    "sessionId": "test-determinism",
    "runId": "run2"
  }' > run2.json

# Compare determinism hashes
diff <(jq '.cries.determinism.hashInput' run1.json) \
     <(jq '.cries.determinism.hashInput' run2.json)
# Should be IDENTICAL if LLM response is same
```

### 2. Re-run Test
```bash
# Get receipt ID from first run
RECEIPT_ID=$(jq -r '.receipt.id' run1.json)

# Re-run with same seed
curl -X POST http://localhost:3001/api/pilot/rerun \
  -H "Content-Type: application/json" \
  -d "{\"receiptId\": $RECEIPT_ID}" > rerun.json

# Check if identical
jq '.comparison.identical' rerun.json
# Should be TRUE
```

### 3. Evidence Test
```bash
# Check evidence structure
jq '.cries.evidence | keys' run1.json
# Should show all 20 sub-metrics

# Check specific evidence
jq '.cries.evidence.contradictions_sem' run1.json
# Should show inputs, computations, rawScore, method, explanation
```

### 4. Baseline Test
```bash
# Run 5+ prompts in same session
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/pilot/run-prompt \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"Run $i: What is data governance?\",
      \"model\": \"gpt-4o\",
      \"useGovernance\": true,
      \"sessionId\": \"test-baseline\",
      \"runId\": \"run$i\"
    }" > baseline_run$i.json
  sleep 1
done

# Check if 6th run has historical baseline
jq '.cries.baseline.historical' baseline_run6.json
# Should show n=5, deltas for C/R/I/E/S
```

---

## 🔄 Rollback Plan

If v3 causes issues, rollback is simple:

### Option 1: Use v2 Legacy
```javascript
// server.js
const { computeCRIES } = require('./src/cries/v2_legacy/track-a-analyzer-v2.js');

// Keep v2 API
const cries = computeCRIES(responseText, useGovernance, prompt);
```

### Option 2: Feature Flag
```javascript
// server.js
const USE_CRIES_V3 = process.env.CRIES_VERSION === 'v3' ? true : false;

if (USE_CRIES_V3) {
  const cries = await computeCRIESv3({ ... });
} else {
  const cries = computeCRIES(responseText, useGovernance, prompt);
}
```

---

## 📊 Performance Benchmarks

### v2 Performance
- **Average**: ~50ms per evaluation
- **Bottleneck**: Regex matching on long responses

### v3 Performance (Mock Embeddings)
- **Average**: ~120ms per evaluation
  - Parsing: ~10ms
  - Embedding generation: ~80ms (384-dim × 100 sentences)
  - Scoring: ~30ms
- **Bottleneck**: Mock embedding computation

### v3 Performance (Real Embeddings - Estimated)
- **all-minilm-l6-v2 (local)**: ~200ms
- **OpenAI API**: ~500ms (network latency)
- **Optimization**: Batch embeddings, cache prompt embeddings

---

## 🚀 Deployment

### 1. Backup Database
```bash
cd backend
npm run db:backup
# Or manually:
pg_dump audita_ai > backup_before_v3_$(date +%Y%m%d).sql
```

### 2. Update Code
```bash
git pull origin main
cd backend
npm install  # No new dependencies for mock version
```

### 3. Run Migration (if schema changed)
```bash
cd backend
npx prisma migrate deploy
```

### 4. Restart Server
```bash
pm2 restart audita-backend
# Or: npm run start
```

### 5. Verify
```bash
# Check health
curl http://localhost:3001/health

# Test v3 endpoint
curl -X POST http://localhost:3001/api/pilot/run-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "gpt-4o", "sessionId": "deploy-test", "runId": "1"}'
```

---

## 📝 Summary

**Migration Complexity**: 🟡 Medium  
**Breaking Changes**: ⚠️ Async API, new return structure  
**Backward Compatibility**: ✅ v2 preserved in `v2_legacy/`  
**Rollback Time**: <5 minutes (feature flag or import swap)  
**Testing Time**: ~30 minutes (4 test scenarios)  
**Deployment Time**: ~10 minutes (backup → deploy → verify)

**Next Steps**:
1. Update `server.js` imports
2. Modify `/api/pilot/run-prompt` endpoint
3. Modify `/api/pilot/rerun` endpoint
4. Run test suite
5. Deploy to staging
6. Monitor for 24h
7. Deploy to production

**Support**: If issues arise, reach out with error logs and receipt IDs for debugging.
