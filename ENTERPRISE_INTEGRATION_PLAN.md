# 🏛️ Enterprise-Grade Integration Plan
## Connecting Speechcraft v2.1 → Receipts → Merkle Trees → Pilot Dashboard

**Status:** 🟡 In Progress  
**Priority:** P0 (Enterprise Pilot Blocker)  
**Version:** 1.0.0  
**Last Updated:** 2025-11-04

---

## 📋 Executive Summary

**Current State:**
- ✅ Speechcraft v2.1 implemented (970 lines, enterprise-hardened)
- ✅ Receipt service exists (`backend/src/receipt-service.js`)
- ✅ Merkle tree logic exists (`frontend/src/lib/governance.ts`)
- ✅ Pilot dashboard exists (`frontend/app/pilot/page.tsx`)
- ❌ **NO INTEGRATION** between these components

**Gap Analysis:**
1. Speechcraft v2.1 not called from server.js
2. `generateGovernanceReceipt()` not invoked after LLM calls
3. Merkle root not computed for receipt batches
4. Pilot dashboard not consuming governance receipts
5. No UI for receipt verification/export

---

## 🎯 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER.JS (Port 3001)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Apply Speechcraft v2.1                                 │  │
│  │    const governed = applySpeechcraft({                    │  │
│  │      persona, text, governance                            │  │
│  │    })                                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. Replace Lamport Placeholder                            │  │
│  │    prompt = governed.text.replace(                        │  │
│  │      'Lamport:[clock]', lamportClock                      │  │
│  │    )                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. Call LLM (Claude/GPT)                                  │  │
│  │    response = await llm.send(prompt)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. Validate Output                                        │  │
│  │    validation = validateModelOutput(response)             │  │
│  │    if (!valid) throw Error()                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. Generate Cryptographic Receipt                         │  │
│  │    receipt = await generateGovernanceReceipt({            │  │
│  │      prompt, output, lamport, persona, obligations        │  │
│  │    })                                                     │  │
│  │    - SHA-256 prompt hash                                  │  │
│  │    - SHA-256 output hash                                  │  │
│  │    - LocalExecHash (persona+input+obligations)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 6. Store Receipt in Postgres                              │  │
│  │    await prisma.governanceReceipts.create({               │  │
│  │      data: receipt                                        │  │
│  │    })                                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              MERKLE TREE BATCH SEALER (Every 10 receipts)       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Fetch latest 10 unsealed receipts                      │  │
│  │ 2. Compute Merkle root from receipt hashes                │  │
│  │ 3. Create Δ-MERKLE-SEAL receipt with:                     │  │
│  │    - merkleRoot                                           │  │
│  │    - receiptIds[]                                         │  │
│  │    - lamportRange [start, end]                            │  │
│  │ 4. Store seal in database                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PILOT DASHBOARD (Port 3007)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Real-Time Governance Metrics:                             │  │
│  │  - Total receipts                                         │  │
│  │  - Merkle seals                                           │  │
│  │  - Average CRIES (Ω)                                      │  │
│  │  - Governance violations                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Receipt Explorer:                                         │  │
│  │  - List all receipts with search/filter                  │  │
│  │  - View receipt details (hashes, persona, obligations)    │  │
│  │  - Verify receipt integrity (recalculate hashes)          │  │
│  │  - Export receipts (JSON/CSV/PDF)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Merkle Tree Visualizer:                                   │  │
│  │  - Show tree structure                                    │  │
│  │  - Verify merkle proofs                                   │  │
│  │  - Download merkle root certificates                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Tasks

### Phase 1: Backend Integration (server.js → Speechcraft)

**File:** `/backend/server.js`

#### Task 1.1: Import Speechcraft v2.1
```javascript
// Add at top of server.js
import { 
  applySpeechcraft, 
  validateModelOutput,
  generateGovernanceReceipt,
  GovernanceReceipt 
} from './rosetta/mcp/kernel/speechcraft.js';
```

#### Task 1.2: Create Governance Wrapper Function
```javascript
/**
 * Enterprise-grade governance wrapper for LLM calls
 * Applies Speechcraft v2.1 → validates output → generates receipt
 */
async function governedLLMCall({
  persona = 'Architect',
  userInput,
  governanceRules = [],
  modelId = 'claude-3-5-haiku-20241022',
  userId
}) {
  // 1. Increment Lamport clock
  const lamportClock = await incrementLamportClock();
  
  // 2. Apply Speechcraft v2.1
  console.log(`🔒 Applying Speechcraft v2.1 (Persona: ${persona})`);
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
  
  // 4. Call LLM
  const llmResponse = await callAnthropicAPI({
    model: modelId,
    messages: [{
      role: 'user',
      content: finalPrompt
    }],
    max_tokens: 2500 // Matches v2.1 output length constraint
  });
  
  const governedOutput = llmResponse.content[0].text;
  
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
  const criesMetrics = await analyzeCRIES(governedContentOnly);
  
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
      timestamp: receipt.timestamp,
      version: receipt.version,
      userId: userId,
      // Add CRIES metrics
      criesOmega: criesMetrics.Ω,
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
  
  console.log(`💾 Receipt stored: ID=${dbReceipt.id}, Ω=${criesMetrics.Ω}`);
  
  // 10. Check if we need to seal a merkle batch
  await checkAndSealMerkleBatch();
  
  return {
    response: governedOutput,
    receipt: dbReceipt,
    cries: criesMetrics,
    lamport: lamportClock
  };
}
```

#### Task 1.3: Replace Existing LLM Calls
```javascript
// OLD CODE (at line ~1248):
// const governedLLMResponse = await callAnthropicAPI(...);

// NEW CODE:
const governedResult = await governedLLMCall({
  persona: 'Architect',
  userInput: prompt,
  governanceRules: [
    'Provide structured analysis with reasoning chains',
    'Include concrete examples for all risks',
    'Maintain enterprise audit standards'
  ],
  modelId: 'claude-3-5-haiku-20241022',
  userId: req.user?.id
});

// Extract response
const response = governedResult.response;
const receipt = governedResult.receipt;
const criesMetrics = governedResult.cries;
```

---

### Phase 2: Merkle Tree Sealer

**File:** `/backend/src/merkle-sealer.js` (NEW)

```javascript
import crypto from 'crypto';
import { prisma } from './db.js';

/**
 * Merkle Tree Receipt Sealer
 * Batches receipts into merkle-sealed blocks for tamper-evident audit trails
 */

const BATCH_SIZE = 10; // Seal every 10 receipts

/**
 * Compute SHA-256 hash
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Build merkle tree from leaf hashes
 * Returns merkle root
 */
function buildMerkleTree(leaves) {
  if (leaves.length === 0) return null;
  if (leaves.length === 1) return leaves[0];
  
  let tree = [...leaves];
  
  while (tree.length > 1) {
    const nextLevel = [];
    
    for (let i = 0; i < tree.length; i += 2) {
      if (i + 1 < tree.length) {
        // Hash pair
        const combined = tree[i] + tree[i + 1];
        nextLevel.push(sha256(combined));
      } else {
        // Odd node - duplicate
        nextLevel.push(tree[i]);
      }
    }
    
    tree = nextLevel;
  }
  
  return tree[0]; // Merkle root
}

/**
 * Check if we need to seal a merkle batch
 * Called after each receipt creation
 */
export async function checkAndSealMerkleBatch() {
  // Count unsealed receipts
  const unsealedCount = await prisma.governanceReceipts.count({
    where: {
      merkleSealId: null
    }
  });
  
  if (unsealedCount >= BATCH_SIZE) {
    console.log(`🌳 Sealing merkle batch (${unsealedCount} receipts)...`);
    await sealMerkleBatch();
  }
}

/**
 * Seal a batch of receipts with merkle root
 */
async function sealMerkleBatch() {
  // Fetch oldest unsealed receipts
  const receipts = await prisma.governanceReceipts.findMany({
    where: {
      merkleSealId: null
    },
    orderBy: {
      lamport: 'asc'
    },
    take: BATCH_SIZE
  });
  
  if (receipts.length === 0) return;
  
  console.log(`📦 Batch size: ${receipts.length}`);
  console.log(`🕰️  Lamport range: ${receipts[0].lamport} → ${receipts[receipts.length - 1].lamport}`);
  
  // Extract hashes as merkle leaves
  const leaves = receipts.map(r => r.outputHash);
  
  // Compute merkle root
  const merkleRoot = buildMerkleTree(leaves);
  
  console.log(`🌲 Merkle root: ${merkleRoot}`);
  
  // Create merkle seal record
  const seal = await prisma.merkleSeal.create({
    data: {
      merkleRoot,
      receiptCount: receipts.length,
      lamportStart: receipts[0].lamport,
      lamportEnd: receipts[receipts.length - 1].lamport,
      sealedAt: new Date()
    }
  });
  
  // Link receipts to seal
  await prisma.governanceReceipts.updateMany({
    where: {
      id: {
        in: receipts.map(r => r.id)
      }
    },
    data: {
      merkleSealId: seal.id
    }
  });
  
  console.log(`✅ Merkle seal created: ID=${seal.id}`);
  
  return seal;
}

/**
 * Verify merkle proof for a specific receipt
 */
export async function verifyMerkleProof(receiptId) {
  const receipt = await prisma.governanceReceipts.findUnique({
    where: { id: receiptId },
    include: {
      merkleSeal: {
        include: {
          receipts: {
            orderBy: { lamport: 'asc' }
          }
        }
      }
    }
  });
  
  if (!receipt) {
    return { valid: false, error: 'Receipt not found' };
  }
  
  if (!receipt.merkleSeal) {
    return { valid: false, error: 'Receipt not sealed yet' };
  }
  
  // Rebuild merkle tree from seal's receipts
  const leaves = receipt.merkleSeal.receipts.map(r => r.outputHash);
  const computedRoot = buildMerkleTree(leaves);
  
  const valid = computedRoot === receipt.merkleSeal.merkleRoot;
  
  return {
    valid,
    merkleRoot: receipt.merkleSeal.merkleRoot,
    computedRoot,
    sealId: receipt.merkleSeal.id,
    receiptCount: receipt.merkleSeal.receiptCount
  };
}

/**
 * Export merkle seal as certificate (for regulators)
 */
export async function exportMerkleCertificate(sealId) {
  const seal = await prisma.merkleSeal.findUnique({
    where: { id: sealId },
    include: {
      receipts: {
        orderBy: { lamport: 'asc' },
        select: {
          id: true,
          lamport: true,
          persona: true,
          promptHash: true,
          outputHash: true,
          timestamp: true
        }
      }
    }
  });
  
  if (!seal) return null;
  
  return {
    certificateType: 'MERKLE-SEAL',
    merkleRoot: seal.merkleRoot,
    receiptCount: seal.receiptCount,
    lamportRange: {
      start: seal.lamportStart,
      end: seal.lamportEnd
    },
    sealedAt: seal.sealedAt,
    receipts: seal.receipts,
    verification: {
      algorithm: 'SHA-256 Merkle Tree',
      batchSize: BATCH_SIZE,
      tamperEvident: true
    }
  };
}
```

---

### Phase 3: Database Schema Updates

**File:** `/backend/prisma/schema.prisma`

```prisma
// Add new tables for governance receipts and merkle seals

model GovernanceReceipt {
  id                  Int          @id @default(autoincrement())
  lamport             Int
  persona             String       // Architect/Auditor/Witness
  obligationsApplied  String[]
  promptHash          String       // SHA-256
  outputHash          String       // SHA-256
  violations          String[]
  timestamp           DateTime
  version             String       // speechcraft-v2
  userId              Int?
  
  // CRIES metrics
  criesOmega          Float?
  criesCoherence      Float?
  criesRigor          Float?
  criesIntegrity      Float?
  criesEmpathy        Float?
  criesStrictness     Float?
  
  // Full data (for audit)
  prompt              String       @db.Text
  output              String       @db.Text
  
  // Merkle seal linkage
  merkleSealId        Int?
  merkleSeal          MerkleSeal?  @relation(fields: [merkleSealId], references: [id])
  
  createdAt           DateTime     @default(now())
  
  @@index([lamport])
  @@index([merkleSealId])
  @@index([userId])
  @@map("governance_receipts")
}

model MerkleSeal {
  id                  Int                   @id @default(autoincrement())
  merkleRoot          String                @unique
  receiptCount        Int
  lamportStart        Int
  lamportEnd          Int
  sealedAt            DateTime              @default(now())
  
  receipts            GovernanceReceipt[]
  
  @@index([lamportStart, lamportEnd])
  @@map("merkle_seals")
}
```

**Migration Command:**
```bash
cd /home/michaelgomes/AuditaAI/backend
npx prisma migrate dev --name add_governance_receipts_and_merkle_seals
```

---

### Phase 4: API Endpoints

**File:** `/backend/server.js`

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
    
    const { computeHash } = await import('./rosetta/mcp/kernel/speechcraft.js');
    
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
 * Export merkle seal as certificate (PDF/JSON)
 */
app.get('/api/governance/merkle-seals/:id/certificate', async (req, res) => {
  try {
    const sealId = parseInt(req.params.id);
    const format = req.query.format || 'json'; // json or pdf
    
    const certificate = await exportMerkleCertificate(sealId);
    
    if (!certificate) {
      return res.status(404).json({ error: 'Merkle seal not found' });
    }
    
    if (format === 'json') {
      res.json(certificate);
    } else if (format === 'pdf') {
      // TODO: Generate PDF certificate
      res.status(501).json({ error: 'PDF export not implemented yet' });
    } else {
      res.status(400).json({ error: 'Invalid format. Use json or pdf' });
    }
  } catch (error) {
    console.error('Error exporting certificate:', error);
    res.status(500).json({ error: 'Failed to export certificate' });
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
```

---

### Phase 5: Pilot Dashboard Integration

**File:** `/frontend/app/pilot/governance-panel.tsx` (NEW COMPONENT)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      const res = await fetch('/api/governance/stats');
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
    <div className="space-y-6">
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
              <div className="flex items-center gap-4">
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
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.href = `/lab/receipts/${receipt.id}`}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

**Update:** `/frontend/app/pilot/page.tsx`

```typescript
import { GovernancePanel } from './governance-panel';

export default function PilotPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        Pilot Dashboard
      </h1>
      
      {/* Add Governance Panel */}
      <GovernancePanel />
      
      {/* ... existing pilot content ... */}
    </div>
  );
}
```

---

## 🚀 Deployment Checklist

### Prerequisites
- [ ] Speechcraft v2.1 compiled successfully
- [ ] PostgreSQL running
- [ ] Prisma client generated

### Backend Setup
- [ ] Run database migration
- [ ] Import Speechcraft functions in server.js
- [ ] Create governedLLMCall wrapper
- [ ] Create merkle-sealer.js
- [ ] Add API endpoints
- [ ] Test with Postman/curl

### Frontend Setup
- [ ] Create governance-panel.tsx
- [ ] Update pilot page
- [ ] Add receipt explorer page
- [ ] Test UI responsiveness

### Integration Testing
- [ ] Make governed LLM call
- [ ] Verify receipt created
- [ ] Verify CRIES computed
- [ ] Verify merkle seal after 10 receipts
- [ ] Verify merkle proof
- [ ] Export merkle certificate
- [ ] View on pilot dashboard

---

## 📊 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Receipt generation time | <100ms | 🟡 TBD |
| Merkle seal computation | <500ms | 🟡 TBD |
| Receipt verification | <50ms | 🟡 TBD |
| Dashboard load time | <2s | 🟡 TBD |
| CRIES improvement | +20-30% Ω | 🟡 TBD |
| Zero data loss | 100% | 🟡 TBD |

---

## 🎯 Next Steps

1. **Immediate (Week 1):**
   - [ ] Run Prisma migration
   - [ ] Integrate Speechcraft in server.js
   - [ ] Test single governed LLM call

2. **Short-term (Week 2):**
   - [ ] Implement merkle sealer
   - [ ] Add API endpoints
   - [ ] Build pilot dashboard panel

3. **Medium-term (Week 3-4):**
   - [ ] Add PDF export
   - [ ] Build receipt explorer UI
   - [ ] Add merkle tree visualizer

4. **Enterprise Features (Week 5-8):**
   - [ ] KMS integration (AWS/GCP)
   - [ ] Team accounts
   - [ ] Policy editor
   - [ ] Regulatory templates
   - [ ] Compliance attestations

---

## 🔒 Security Considerations

1. **Receipt Immutability:**
   - Receipts stored with SHA-256 hashes
   - Merkle roots seal batches
   - Cannot modify without detection

2. **Access Control:**
   - Only authenticated users see receipts
   - Admin role for merkle seal management
   - Audit logs for all access

3. **Data Privacy:**
   - Full prompts/outputs encrypted at rest
   - GDPR-compliant export
   - Right to deletion (with audit trail)

4. **Regulatory Compliance:**
   - SOX: Tamper-evident audit trail
   - HIPAA: Cryptographic integrity
   - GDPR: User data export
   - ISO 42001: Governance receipts

---

**Status:** Ready for implementation  
**Estimated Effort:** 2-3 weeks (1 backend dev + 1 frontend dev)  
**Risk Level:** Low (all components exist, just need integration)

---

**Author:** Copilot + Michael Gomes  
**Review Date:** 2025-11-04  
**Next Review:** After Phase 1 completion
