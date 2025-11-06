# 🚀 Quick Start: Enterprise Integration Implementation

## Critical Path (2-3 hours)

### Step 1: Run Database Migration (5 min)

```bash
cd /home/michaelgomes/AuditaAI/backend
npx prisma migrate dev --name add_governance_receipts_and_merkle_seals
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ The migration has been created successfully
```

---

### Step 2: Update server.js Imports (2 min)

**File:** `/home/michaelgomes/AuditaAI/backend/server.js`

**Location:** After line 160 (after other imports)

**Add these imports:**
```javascript
// ============================================================================
// SPEECHCRAFT V2.1 INTEGRATION
// ============================================================================
import { 
  applySpeechcraft, 
  validateModelOutput,
  generateGovernanceReceipt,
  computeHash
} from './rosetta/mcp/kernel/speechcraft.js';

import { 
  checkAndSealMerkleBatch, 
  verifyMerkleProof, 
  exportMerkleCertificate 
} from './src/merkle-sealer.js';
```

---

### Step 3: Create Governed LLM Wrapper (15 min)

**File:** `/home/michaelgomes/AuditaAI/backend/server.js`

**Location:** After line 600 (before route handlers)

**Add this function:**
```javascript
/**
 * Enterprise-grade governance wrapper for LLM calls
 * Applies Speechcraft v2.1 → validates output → generates receipt → seals in merkle tree
 */
async function governedLLMCall({
  persona = 'Architect',
  userInput,
  governanceRules = [],
  modelId = 'claude-3-5-haiku-20241022',
  userId,
  apiKeys,
  userName = 'User',
  userRole = 'Operator',
  managedGovernance = true,
  history = []
}) {
  console.log(`🔒 Applying Speechcraft v2.1 (Persona: ${persona})`);
  
  // 1. Increment Lamport clock (use existing function or create counter)
  const lamportClock = Date.now(); // Simplified - use your existing lamport counter
  
  // 2. Apply Speechcraft v2.1
  const speechOutput = applySpeechcraft({
    persona,
    text: userInput,
    governance: governanceRules
  });
  
  // 3. Replace Lamport placeholder
  const finalPrompt = speechOutput.text.replace(
    'Lamport:[clock]',
    lamportClock.toString()
  );
  
  console.log(`📝 Governed prompt: ${finalPrompt.length} chars`);
  console.log(`🎯 Governance applied: ${speechOutput.governanceApplied}`);
  
  // 4. Call LLM using your existing callLLM function
  let modelResponse;
  try {
    modelResponse = await callLLM(modelId, finalPrompt, {
      apiKeys,
      userName,
      userRole,
      managedGovernance,
      history
    });
  } catch (error) {
    console.error(`❌ LLM call failed:`, error);
    throw error;
  }
  
  const governedOutput = modelResponse.content;
  
  // 5. Validate model output
  console.log(`🔍 Validating model output...`);
  const validation = validateModelOutput(governedOutput);
  
  if (!validation.valid) {
    console.error(`❌ Governance validation failed: ${validation.reason}`);
    throw new Error(`MODEL OUTPUT VIOLATION: ${validation.reason}`);
  }
  
  console.log(`✅ Output validation passed`);
  
  // 6. Extract governed content (before CRIES analysis)
  const governedContentOnly = extractGovernedResponseContent(governedOutput);
  
  // 7. Compute CRIES metrics
  const criesMetrics = computeCRIES(finalPrompt, governedContentOnly);
  
  // 8. Generate cryptographic receipt
  console.log(`🔐 Generating governance receipt...`);
  const receipt = await generateGovernanceReceipt({
    prompt: finalPrompt,
    output: governedOutput,
    lamport: lamportClock,
    persona,
    obligations: governanceRules
  });
  
  // 9. Store receipt in database
  const dbReceipt = await prisma.governanceReceipts.create({
    data: {
      lamport: receipt.lamport,
      persona: receipt.persona,
      obligationsApplied: receipt.obligationsApplied,
      promptHash: receipt.promptHash,
      outputHash: receipt.outputHash,
      violations: receipt.violations,
      timestamp: new Date(receipt.timestamp),
      version: receipt.version,
      userId: userId,
      // Add CRIES metrics
      criesOmega: criesMetrics.Omega,
      criesCoherence: criesMetrics.C,
      criesRigor: criesMetrics.R,
      criesIntegrity: criesMetrics.I,
      criesEmpathy: criesMetrics.E,
      criesStrictness: criesMetrics.S,
      // Full data
      prompt: finalPrompt,
      output: governedOutput
    }
  });
  
  console.log(`💾 Receipt stored: ID=${dbReceipt.id}, Ω=${criesMetrics.Omega.toFixed(4)}`);
  
  // 10. Check if we need to seal a merkle batch
  await checkAndSealMerkleBatch();
  
  return {
    response: governedOutput,
    receipt: dbReceipt,
    cries: criesMetrics,
    lamport: lamportClock,
    modelResponse // Preserve original model response object
  };
}
```

---

### Step 4: Integrate into /api/pilot/run-test (10 min)

**File:** `/home/michaelgomes/AuditaAI/backend/server.js`

**Location:** Find the section around line 1500 where `callLLM` is called with governance

**Replace this section:**
```javascript
if (useGovernance) {
  // Use new MCP-based governance with full Execution Engine
  modelResponse = await callLLM(modelId, currentPrompt, { 
    ...llmOptions, 
    apiKeys,
    governanceEnabled: true,
    userName: userName,
    userRole: userRole,
    managedGovernance: managedGovernance
  });
} else {
  modelResponse = await callLLM(modelId, currentPrompt, { ...llmOptions, apiKeys });
}
response = modelResponse.content;
```

**With this:**
```javascript
if (useGovernance) {
  // ✨ NEW: Use Speechcraft v2.1 with governance receipts
  console.log('🎯 Using Speechcraft v2.1 governance...');
  const governedResult = await governedLLMCall({
    persona: userRole === 'Architect' ? 'Architect' : 'Auditor',
    userInput: currentPrompt,
    governanceRules: [
      'Provide structured analysis with reasoning chains',
      'Include concrete examples for all assertions',
      'Maintain enterprise audit standards',
      'Flag any compliance concerns'
    ],
    modelId,
    userId,
    apiKeys,
    userName,
    userRole,
    managedGovernance,
    history: conversationHistory
  });
  
  response = governedResult.response;
  modelResponse = {
    content: governedResult.response,
    usage: governedResult.modelResponse.usage,
    provider: governedResult.modelResponse.provider,
    governance: {
      receipt: governedResult.receipt,
      cries: governedResult.cries,
      lamport: governedResult.lamport,
      version: 'speechcraft-v2.1'
    }
  };
} else {
  // Ungoverned path (existing behavior)
  modelResponse = await callLLM(modelId, currentPrompt, { ...llmOptions, apiKeys });
  response = modelResponse.content;
}
```

---

### Step 5: Add API Endpoints for Governance Receipts (20 min)

**File:** `/home/michaelgomes/AuditaAI/backend/server.js`

**Location:** After line 3000 (before `app.listen`)

**Add these endpoints:**
```javascript
// ============================================================================
// GOVERNANCE RECEIPTS API
// ============================================================================

/**
 * GET /api/governance/receipts
 * List all governance receipts with pagination
 */
app.get('/api/governance/receipts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const [receipts, total] = await Promise.all([
      prisma.governanceReceipts.findMany({
        skip: offset,
        take: limit,
        orderBy: { lamport: 'desc' },
        include: {
          merkleSeal: {
            select: {
              id: true,
              merkleRoot: true,
              sealedAt: true
            }
          }
        }
      }),
      prisma.governanceReceipts.count()
    ]);
    
    res.json({
      receipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

/**
 * GET /api/governance/receipts/:id
 * Get single receipt by ID
 */
app.get('/api/governance/receipts/:id', async (req, res) => {
  try {
    const receipt = await prisma.governanceReceipts.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        merkleSeal: {
          include: {
            receipts: {
              select: {
                id: true,
                lamport: true,
                outputHash: true
              },
              orderBy: { lamport: 'asc' }
            }
          }
        }
      }
    });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

/**
 * POST /api/governance/receipts/:id/verify
 * Verify receipt integrity
 */
app.post('/api/governance/receipts/:id/verify', async (req, res) => {
  try {
    const receiptId = parseInt(req.params.id);
    
    // Verify merkle proof
    const merkleVerification = await verifyMerkleProof(receiptId);
    
    // Recalculate receipt hashes
    const receipt = await prisma.governanceReceipts.findUnique({
      where: { id: receiptId }
    });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    const [recalcPromptHash, recalcOutputHash] = await Promise.all([
      computeHash(receipt.prompt),
      computeHash(receipt.output)
    ]);
    
    const promptHashValid = recalcPromptHash === receipt.promptHash;
    const outputHashValid = recalcOutputHash === receipt.outputHash;
    
    res.json({
      valid: promptHashValid && outputHashValid && merkleVerification.valid,
      checks: {
        promptHash: {
          valid: promptHashValid,
          stored: receipt.promptHash,
          computed: recalcPromptHash
        },
        outputHash: {
          valid: outputHashValid,
          stored: receipt.outputHash,
          computed: recalcOutputHash
        },
        merkleProof: merkleVerification
      }
    });
  } catch (error) {
    console.error('Error verifying receipt:', error);
    res.status(500).json({ error: 'Failed to verify receipt' });
  }
});

/**
 * GET /api/governance/stats
 * Governance statistics for pilot dashboard
 */
app.get('/api/governance/stats', async (req, res) => {
  try {
    const [
      totalReceipts,
      totalSeals,
      avgOmega,
      violationCount,
      recentReceipts
    ] = await Promise.all([
      prisma.governanceReceipts.count(),
      prisma.merkleSeal.count(),
      prisma.governanceReceipts.aggregate({
        _avg: { criesOmega: true }
      }),
      prisma.governanceReceipts.count({
        where: {
          violations: {
            isEmpty: false
          }
        }
      }),
      prisma.governanceReceipts.findMany({
        take: 10,
        orderBy: { lamport: 'desc' },
        select: {
          id: true,
          lamport: true,
          persona: true,
          criesOmega: true,
          timestamp: true
        }
      })
    ]);
    
    res.json({
      totalReceipts,
      totalSeals,
      averageOmega: avgOmega._avg.criesOmega?.toFixed(4) || '0.0000',
      violationCount,
      recentReceipts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/governance/merkle-seals
 * List all merkle seals
 */
app.get('/api/governance/merkle-seals', async (req, res) => {
  try {
    const seals = await prisma.merkleSeal.findMany({
      orderBy: { sealedAt: 'desc' },
      include: {
        _count: {
          select: { receipts: true }
        }
      }
    });
    
    res.json(seals);
  } catch (error) {
    console.error('Error fetching seals:', error);
    res.status(500).json({ error: 'Failed to fetch merkle seals' });
  }
});

/**
 * GET /api/governance/merkle-seals/:id/certificate
 * Export merkle seal as certificate (JSON)
 */
app.get('/api/governance/merkle-seals/:id/certificate', async (req, res) => {
  try {
    const sealId = parseInt(req.params.id);
    const certificate = await exportMerkleCertificate(sealId);
    
    if (!certificate) {
      return res.status(404).json({ error: 'Merkle seal not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    console.error('Error exporting certificate:', error);
    res.status(500).json({ error: 'Failed to export certificate' });
  }
});
```

---

### Step 6: Test the Integration (10 min)

**1. Restart backend:**
```bash
cd /home/michaelgomes/AuditaAI/backend
npm run dev
```

**2. Test governance receipt API:**
```bash
# Get governance stats
curl http://localhost:3001/api/governance/stats

# List receipts
curl http://localhost:3001/api/governance/receipts?page=1&limit=10

# List merkle seals
curl http://localhost:3001/api/governance/merkle-seals
```

**3. Test governed LLM call:**
- Go to pilot dashboard: http://localhost:3007/pilot
- Run a test with governance enabled
- Check backend logs for: "🔒 Applying Speechcraft v2.1"
- Check for: "💾 Receipt stored: ID=..."
- After 10 receipts, check for: "🌳 Sealing merkle batch"

---

### Step 7: Frontend Integration (30 min)

Create new component: `/home/michaelgomes/AuditaAI/frontend/app/pilot/governance-panel.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface GovernanceStats {
  totalReceipts: number;
  totalSeals: number;
  averageOmega: string;
  violationCount: number;
  recentReceipts: Array<{
    id: number;
    lamport: number;
    persona: string;
    criesOmega: number;
    timestamp: string;
  }>;
}

export function GovernancePanel() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);
  
  async function fetchStats() {
    try {
      const res = await fetch('http://localhost:3001/api/governance/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch governance stats:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return <div className="text-center py-8">Loading governance metrics...</div>;
  }
  
  if (!stats) {
    return <div className="text-center py-8 text-red-500">Failed to load stats</div>;
  }
  
  return (
    <div className="space-y-6 mb-8">
      <h2 className="text-2xl font-bold text-white">Governance Metrics</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
          <div className="text-sm text-cyan-400 font-mono mb-2">Total Receipts</div>
          <div className="text-3xl font-bold text-white font-mono">
            {stats.totalReceipts.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
          <div className="text-sm text-purple-400 font-mono mb-2">Merkle Seals</div>
          <div className="text-3xl font-bold text-white font-mono">
            {stats.totalSeals.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
          <div className="text-sm text-green-400 font-mono mb-2">Average Ω</div>
          <div className="text-3xl font-bold text-white font-mono">
            {stats.averageOmega}
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
          <div className="text-sm text-orange-400 font-mono mb-2">Violations</div>
          <div className="text-3xl font-bold text-white font-mono">
            {stats.violationCount.toLocaleString()}
          </div>
        </Card>
      </div>
      
      {/* Recent Receipts */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 font-mono">Recent Receipts</h3>
        <div className="space-y-2">
          {stats.recentReceipts.map(receipt => (
            <div 
              key={receipt.id}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-400 font-mono">L:{receipt.lamport}</div>
                <div className="text-sm text-white font-mono">{receipt.persona}</div>
              </div>
              <div className="text-sm font-mono">
                <span className="text-gray-400">Ω:</span>
                <span className={`ml-1 ${
                  receipt.criesOmega > 0.7 ? 'text-green-400' :
                  receipt.criesOmega > 0.5 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {receipt.criesOmega.toFixed(4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

Update `/home/michaelgomes/AuditaAI/frontend/app/pilot/page.tsx`:

Add import at top:
```typescript
import { GovernancePanel } from './governance-panel';
```

Add panel to render:
```typescript
export default function PilotPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add at top of page */}
      <GovernancePanel />
      
      {/* ... existing pilot content ... */}
    </div>
  );
}
```

---

## Validation Checklist

After completing all steps:

- [ ] ✅ Prisma migration completed successfully
- [ ] ✅ Backend starts without errors
- [ ] ✅ API endpoints respond correctly
  - [ ] GET /api/governance/stats
  - [ ] GET /api/governance/receipts
  - [ ] GET /api/governance/merkle-seals
- [ ] ✅ Governed LLM call creates receipt
- [ ] ✅ Receipt stored in database
- [ ] ✅ CRIES computed and stored
- [ ] ✅ Merkle seal created after 10 receipts
- [ ] ✅ Frontend displays governance panel
- [ ] ✅ Stats update in real-time

---

## Troubleshooting

**Issue: Prisma migration fails**
```bash
# Reset database and rerun
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

**Issue: speechcraft.js import fails**
```bash
# Check TypeScript compilation
cd /home/michaelgomes/AuditaAI/backend
npx tsc --noEmit
```

**Issue: Frontend can't connect to API**
- Check CORS settings in server.js
- Verify API URL in frontend (should be http://localhost:3001)

**Issue: No receipts showing up**
- Check backend logs for "💾 Receipt stored"
- Verify governance is enabled in pilot UI
- Check database: `npx prisma studio` → governance_receipts table

---

## Success Criteria

You know it's working when:

1. **Backend logs show:**
   ```
   🔒 Applying Speechcraft v2.1 (Persona: Architect)
   📝 Governed prompt: 450 chars
   🎯 Governance applied: true
   🔍 Validating model output...
   ✅ Output validation passed
   🔐 Generating governance receipt...
   💾 Receipt stored: ID=1, Ω=0.7234
   ```

2. **After 10 receipts:**
   ```
   🌳 Sealing merkle batch (10 receipts)...
   📦 Batch size: 10
   🕰️  Lamport range: 1730000000 → 1730000500
   🌲 Merkle root: a3f8e92b...
   ✅ Merkle seal created: ID=1
   ```

3. **Pilot dashboard shows:**
   - Total Receipts: 15
   - Merkle Seals: 1
   - Average Ω: 0.7123
   - Violations: 0
   - Recent receipts list with Lamport clocks

---

**Total Time:** 2-3 hours  
**Difficulty:** Medium  
**Risk:** Low (all changes are additive)

**Ready to start?** Begin with Step 1!
