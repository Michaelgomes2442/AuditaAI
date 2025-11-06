# 🚀 Receipt System Integration - Step-by-Step Guide

**Goal**: Integrate `receipt-generator.js` into `server.js` for automatic Lamport receipt generation

**Time**: ~20 minutes  
**Status**: Ready to implement  

---

## 📋 Pre-Integration Checklist

✅ **receipt-generator.js created** (500 lines)  
✅ **Prisma schema enhanced** (10 new fields)  
✅ **Schema pushed to database**  
✅ **Prisma client generated**  
⏳ **Server.js integration** (this guide)  

---

## 🔧 Step 1: Add Import (2 minutes)

**File**: `/home/michaelgomes/AuditaAI/backend/server.js`  
**Location**: After line 38 (after Merkle sealer imports)

```javascript
// Add this after the Merkle sealer imports
import { 
  generateLamportReceipt,
  generateMerkleBlock,
  verifyReceiptChain,
  exportReceipt,
  getConversationReceipts,
  getReceiptStats
} from './src/receipt-generator.js';
```

---

## 🔧 Step 2: Update governedLLMCall() Wrapper (10 minutes)

**File**: `/home/michaelgomes/AuditaAI/backend/server.js`  
**Location**: Inside `governedLLMCall()` function, after STEP 4 (around line 490)

### Current Code (STEP 4):
```javascript
// STEP 4: Generate governance receipt
const receipt = await prisma.governanceReceipt.create({
  data: {
    lamport: Number(validationResult.lamport),
    persona: options.userRole || 'analyst',
    obligationsApplied: validationResult.obligationsApplied || [],
    promptHash: validationResult.promptHash,
    outputHash: validationResult.outputHash,
    violations: validationResult.violations || [],
    timestamp: new Date(),
    version: '2.1',
    userId: options.userId || null,
    criesOmega: validationResult.criesOmega,
    criesCoherence: validationResult.criesCoherence,
    criesRigor: validationResult.criesRigor,
    criesIntegrity: validationResult.criesIntegrity,
    criesEmpathy: validationResult.criesEmpathy,
    criesStrictness: validationResult.criesStrictness,
    prompt,
    output: rawOutput
  }
});

console.log(`📄 Receipt stored (ID: ${receipt.id}, Lamport: ${receipt.lamport})`);
console.log(`   CRIES: ${receipt.criesOmega.toFixed(3)}`);
```

### Add AFTER STEP 4:

```javascript
// STEP 4.5: Generate Lamport receipt with chain linkage
try {
  const lamportReceipt = await generateLamportReceipt({
    conversationId: options.conversationId || `conv_${Date.now()}`,
    exchangeId: options.exchangeId || `xchg_${Date.now()}`,
    model: modelId,
    prompt,
    response: rawOutput,
    cries: {
      C: receipt.criesCoherence,
      R: receipt.criesRigor,
      I: receipt.criesIntegrity,
      E: receipt.criesEmpathy,
      S: receipt.criesStrictness,
      overall: receipt.criesOmega
    },
    policy: {
      violations: validationResult.violations || [],
      flags: []
    },
    tokens: {
      in: llmResponse.usage?.prompt_tokens || 0,
      out: llmResponse.usage?.completion_tokens || 0
    },
    persona: options.userRole || 'analyst',
    userId: options.userId || null
  });
  
  console.log(`📋 Lamport receipt: ${lamportReceipt.receipt_id}`);
  console.log(`   Lamport: ${lamportReceipt.lamport}`);
  console.log(`   Chain: ${lamportReceipt.prev_digest ? lamportReceipt.prev_digest.substring(0,8)+'...' : 'genesis'} → ${lamportReceipt.curr_digest.substring(0,8)}...`);
  console.log(`   Conversation: ${lamportReceipt.conversationId}`);
} catch (error) {
  console.error('❌ Lamport receipt generation failed:', error.message);
  // Non-fatal: continue with governance flow
}
```

---

## 🔧 Step 3: Add Receipt API Endpoints (8 minutes)

**File**: `/home/michaelgomes/AuditaAI/backend/server.js`  
**Location**: After line 5394 (after Merkle endpoints, before `startServer()`)

```javascript
// ==================== RECEIPT API ENDPOINTS ====================

// GET /api/receipts/stats - Dashboard statistics
app.get('/api/receipts/stats', async (req, res) => {
  try {
    const stats = await getReceiptStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ /api/receipts/stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/receipts/:id - Get single receipt by database ID
app.get('/api/receipts/:id', async (req, res) => {
  try {
    const receiptId = parseInt(req.params.id);
    const receipt = await exportReceipt(receiptId);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }
    
    res.json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error(`❌ /api/receipts/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/receipts/conversation/:id - Get all receipts for a conversation
app.get('/api/receipts/conversation/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const receipts = await getConversationReceipts(conversationId);
    
    res.json({
      success: true,
      conversationId,
      receiptCount: receipts.length,
      receipts
    });
  } catch (error) {
    console.error(`❌ /api/receipts/conversation/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/receipts/conversation/:id/verify - Verify receipt chain integrity
app.get('/api/receipts/conversation/:id/verify', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const result = await verifyReceiptChain(conversationId);
    
    res.json({
      success: true,
      conversationId,
      ...result
    });
  } catch (error) {
    console.error(`❌ /api/receipts/conversation/${req.params.id}/verify error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/merkle/block/:id - Get Merkle block metadata
app.get('/api/merkle/block/:id', async (req, res) => {
  try {
    const blockIndex = parseInt(req.params.id);
    const block = await generateMerkleBlock(blockIndex);
    
    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Merkle block not found'
      });
    }
    
    res.json({
      success: true,
      block
    });
  } catch (error) {
    console.error(`❌ /api/merkle/block/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Receipt API endpoints registered:');
console.log('   GET /api/receipts/stats');
console.log('   GET /api/receipts/:id');
console.log('   GET /api/receipts/conversation/:id');
console.log('   GET /api/receipts/conversation/:id/verify');
console.log('   GET /api/merkle/block/:id');
```

---

## 🧪 Step 4: Test Integration (15 minutes)

### 4.1 Restart Server

```bash
# Kill existing server
pkill -f "node server.js"

# Start server
cd /home/michaelgomes/AuditaAI/backend
pnpm start
```

**Expected Output**:
```
✅ Receipt API endpoints registered:
   GET /api/receipts/stats
   GET /api/receipts/:id
   GET /api/receipts/conversation/:id
   GET /api/receipts/conversation/:id/verify
   GET /api/merkle/block/:id
🚀 Server running on port 3001
```

### 4.2 Test Receipt Stats

```bash
curl http://localhost:3001/api/receipts/stats | jq
```

**Expected Response**:
```json
{
  "success": true,
  "stats": {
    "totalReceipts": 0,
    "sealedReceipts": 0,
    "unsealedReceipts": 0,
    "avgCriesOmega": 0,
    "receiptsWithViolations": 0,
    "sealPercentage": "0.0"
  }
}
```

### 4.3 Make Governed LLM Call

```bash
curl -X POST http://localhost:3001/api/pilot/llm \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is quantum computing?",
    "userRole": "analyst",
    "useGovernance": true
  }' | jq
```

**Watch server logs** for:
```
📄 Receipt stored (ID: 123, Lamport: 1)
   CRIES: 0.745
📋 Lamport receipt: rcpt_123_abc...
   Lamport: 1
   Chain: genesis → e5f6...
   Conversation: conv_123
```

### 4.4 Check Receipt Stats Again

```bash
curl http://localhost:3001/api/receipts/stats | jq
```

**Expected**:
```json
{
  "success": true,
  "stats": {
    "totalReceipts": 1,
    "sealedReceipts": 0,
    "unsealedReceipts": 1,
    "avgCriesOmega": 0.745,
    "receiptsWithViolations": 0,
    "sealPercentage": "0.0"
  }
}
```

### 4.5 Get Conversation Receipts

```bash
# Replace conv_123 with actual conversation ID from logs
curl http://localhost:3001/api/receipts/conversation/conv_123 | jq
```

**Expected Response**:
```json
{
  "success": true,
  "conversationId": "conv_123",
  "receiptCount": 1,
  "receipts": [
    {
      "type": "Δ-ANALYSIS",
      "receipt_id": "rcpt_123_abc...",
      "conversation_id": "conv_123",
      "lamport": 1,
      "prev_digest": null,
      "curr_digest": "e5f6...",
      "model": "gpt-4",
      "cries": {
        "C": 0.78,
        "R": 0.71,
        "I": 0.74,
        "E": 0.62,
        "S": 0.85,
        "overall": 0.745
      }
    }
  ]
}
```

### 4.6 Verify Chain

```bash
curl http://localhost:3001/api/receipts/conversation/conv_123/verify | jq
```

**Expected**:
```json
{
  "success": true,
  "conversationId": "conv_123",
  "valid": true,
  "receiptCount": 1,
  "lamportRange": {
    "start": "1",
    "end": "1"
  },
  "violations": []
}
```

### 4.7 Make 10 More Calls (Trigger Merkle Seal)

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/pilot/llm \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"Test prompt $i\", \"userRole\": \"analyst\", \"useGovernance\": true}"
  sleep 2
done
```

**Watch for Merkle seal**:
```
📋 Lamport receipt: rcpt_130_def...
   Lamport: 10
   Chain: a1b2... → c3d4...
🔐 Merkle seal created (ID: 1, receipts: 10)
```

### 4.8 Get Merkle Block

```bash
curl http://localhost:3001/api/merkle/block/1 | jq
```

**Expected**:
```json
{
  "success": true,
  "block": {
    "block_index": 1,
    "sealed_at": "2025-11-05T23:45:00Z",
    "root_hash": "4d0a...55",
    "receipt_ids": ["rcpt_123_...", "rcpt_124_...", "..."],
    "receipt_count": 10,
    "first_lamport": 1,
    "last_lamport": 10
  }
}
```

---

## ✅ Verification Checklist

After all tests pass:

- [ ] Server starts without errors
- [ ] Receipt API endpoints registered
- [ ] Receipt stats endpoint working
- [ ] LLM call generates Lamport receipt
- [ ] Receipt appears in server logs
- [ ] Conversation receipts retrievable
- [ ] Chain verification passes
- [ ] Merkle seal triggers after 10 receipts
- [ ] Merkle block endpoint working
- [ ] No database errors

---

## 🐛 Troubleshooting

### Issue: "Module not found: receipt-generator.js"

**Solution**:
```bash
# Check file exists
ls -la /home/michaelgomes/AuditaAI/backend/src/receipt-generator.js

# Check imports in server.js
grep "receipt-generator" /home/michaelgomes/AuditaAI/backend/server.js
```

### Issue: "prisma.governanceReceipt.update is not a function"

**Solution**:
```bash
# Regenerate Prisma client
cd /home/michaelgomes/AuditaAI/backend
npx prisma generate
```

### Issue: "Column 'receiptId' does not exist"

**Solution**:
```bash
# Push schema to database
cd /home/michaelgomes/AuditaAI/backend
npx prisma db push
```

### Issue: "Lamport receipt generation failed: conversationId required"

**Solution**:
- Ensure `options.conversationId` is passed to `governedLLMCall()`
- Fallback: `options.conversationId || `conv_${Date.now()}`

### Issue: Chain verification fails

**Solution**:
```javascript
// Check for receipts with same Lamport value
SELECT conversationId, lamport, COUNT(*) 
FROM GovernanceReceipt 
GROUP BY conversationId, lamport 
HAVING COUNT(*) > 1;
```

---

## 📊 Success Metrics

After integration, you should see:

1. **Receipt Generation**
   - ✅ Every governed LLM call creates Lamport receipt
   - ✅ Receipt ID in logs
   - ✅ Chain linkage shown (genesis → digest)

2. **API Endpoints**
   - ✅ 5 new endpoints working
   - ✅ No 500 errors
   - ✅ JSON responses valid

3. **Database**
   - ✅ GovernanceReceipt rows have receiptId, conversationId, etc.
   - ✅ prevDigest/currDigest populated
   - ✅ Chain linkage correct

4. **Performance**
   - ✅ Receipt generation adds <50ms latency
   - ✅ No memory leaks
   - ✅ Merkle sealing automatic

---

## 🎯 Next Steps

After successful integration:

1. **Frontend Integration**
   - Add receipt viewer in Lab interface
   - Add conversation chain explorer
   - Add CRIES trend charts

2. **Enhanced Monitoring**
   - Receipt generation rate dashboard
   - Chain verification alerts
   - CRIES anomaly detection

3. **External Integration**
   - REST API for auditors
   - Certificate export (PDF)
   - S3 backup for receipts

---

**Status**: Ready to implement  
**Time**: ~20 minutes  
**Risk**: Low (non-breaking changes)  
**Rollback**: Remove STEP 4.5 and API endpoints
