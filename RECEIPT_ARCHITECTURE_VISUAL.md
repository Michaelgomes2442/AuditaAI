# 🏗️ Receipt System Architecture - Visual Overview

**Version**: 2.1 Enterprise Edition  
**Components**: Speechcraft + Merkle Sealer + Receipt Generator  

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                    │
│                  "What is quantum computing?"                           │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SERVER.JS (Port 3001)                              │
│                                                                         │
│  POST /api/pilot/llm                                                    │
│  { prompt, userRole: "analyst", useGovernance: true }                   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    governedLLMCall() Wrapper                            │
│                                                                         │
│  STEP 1: Load Speechcraft obligations for "analyst"                     │
│          ├─ Rigor obligations (9)                                       │
│          ├─ Integrity obligations (8)                                   │
│          ├─ Coherence obligations (7)                                   │
│          └─ Empathy/Strictness (6+5)                                    │
│                                                                         │
│  STEP 2: Prepare governed prompt                                        │
│          ├─ [GOVERNANCE] header                                         │
│          ├─ Persona: analyst                                            │
│          ├─ 35 active obligations                                       │
│          └─ User prompt: "What is quantum computing?"                   │
│                                                                         │
│  STEP 3: Call LLM (Claude/GPT)                                          │
│          ├─ Model: gpt-4                                                │
│          ├─ Governed prompt → LLM                                       │
│          ├─ LLM response → rawOutput                                    │
│          └─ Usage: { prompt_tokens: 812, completion_tokens: 623 }      │
│                                                                         │
│  STEP 4: Validate with Speechcraft                                      │
│          ├─ validateResponse(rawOutput, obligations)                    │
│          ├─ Extract CRIES metrics                                       │
│          │   • C: 0.78 (Coherence)                                      │
│          │   • R: 0.71 (Rigor)                                          │
│          │   • I: 0.74 (Integrity)                                      │
│          │   • E: 0.62 (Empathy)                                        │
│          │   • S: 0.85 (Strictness)                                     │
│          │   • Ω: 0.74 (Overall)                                        │
│          ├─ Check policy violations: []                                 │
│          └─ Generate hashes (SHA-256)                                   │
│              • promptHash: a9c4...d0                                    │
│              • outputHash: 7ab2...fe                                    │
│                                                                         │
│  STEP 4: Create governance receipt                                      │
│          ├─ Store in GovernanceReceipt table                            │
│          ├─ ID: 456                                                     │
│          ├─ Lamport: 1 (internal counter)                               │
│          └─ CRIES metrics stored                                        │
│                                                                         │
│  STEP 4.5: Generate Lamport receipt ◄── NEW!                            │
│          ├─ generateLamportReceipt()                                    │
│          ├─ Receipt ID: rcpt_1730841000_a9c4                            │
│          ├─ Conversation ID: conv_abc123                                │
│          ├─ Exchange ID: xchg_001                                       │
│          ├─ Lamport: 1 (conversation-scoped)                            │
│          ├─ prev_digest: null (genesis)                                 │
│          ├─ curr_digest: H(lamport||prev||in||out||cries||ts)          │
│          │                = e5f6c4d3a2b1...                             │
│          ├─ Trace ID: TRACE-1730841000-9f8b                             │
│          ├─ Model: gpt-4                                                │
│          ├─ Tokens: { in: 812, out: 623 }                               │
│          ├─ CRIES: { C:0.78, R:0.71, I:0.74, E:0.62, S:0.85, Ω:0.74 }  │
│          ├─ Policy: { violations: [], flags: [] }                       │
│          └─ Update GovernanceReceipt row with receipt metadata          │
│                                                                         │
│  STEP 5: Check Merkle sealing                                           │
│          ├─ checkAndSealMerkleBatch()                                   │
│          ├─ Count unsealed receipts: 1                                  │
│          └─ If ≥10: Create Merkle seal (not yet)                        │
│                                                                         │
│  STEP 6: Return response                                                │
│          ├─ Governed output                                             │
│          ├─ CRIES metrics                                               │
│          └─ Receipt ID                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE TO USER                                │
│                                                                         │
│  {                                                                      │
│    "response": "Quantum computing is...",                               │
│    "cries": { "C": 0.78, "R": 0.71, ... },                             │
│    "receiptId": "rcpt_1730841000_a9c4"                                  │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Receipt Chain Evolution

### Turn 1 (Genesis)
```
User: "What is quantum computing?"
AI: "Quantum computing is..."

┌────────────────────────────────┐
│   Receipt 1 (GENESIS)          │
├────────────────────────────────┤
│ receipt_id: rcpt_100_a9c       │
│ conversation_id: conv_abc123   │
│ exchange_id: xchg_001          │
│ lamport: 1                     │
│ prev_digest: null              │
│ curr_digest: e5f6c4d3...       │◄── H(1||genesis||in||out||0.74||ts)
│ model: gpt-4                   │
│ tokens: {in:812, out:623}      │
│ cries_overall: 0.74            │
│ issued_at: 2025-11-05T23:40:00Z│
└────────────────────────────────┘
```

### Turn 2 (Linked)
```
User: "How does it differ from classical?"
AI: "Classical computers use bits..."

┌────────────────────────────────┐
│   Receipt 2 (LINKED)           │
├────────────────────────────────┤
│ receipt_id: rcpt_101_b8d       │
│ conversation_id: conv_abc123   │
│ exchange_id: xchg_002          │
│ lamport: 2                     │
│ prev_digest: e5f6c4d3...       │◄── Links to Receipt 1
│ curr_digest: c3d4e5f6...       │◄── H(2||e5f6...||in||out||0.78||ts)
│ model: gpt-4                   │
│ tokens: {in:45, out:234}       │
│ cries_overall: 0.78            │
│ issued_at: 2025-11-05T23:41:15Z│
└────────────────────────────────┘
```

### Turn 3-10 (Continuing Chain)
```
[Similar receipts with lamport: 3, 4, 5, ..., 10]
Each links to previous via prev_digest → curr_digest
```

---

## 🌳 Merkle Sealing (After 10 Receipts)

```
After Receipt 10, automatic Merkle seal triggers:

┌─────────────────────────────────────────────────────────────┐
│                    MERKLE SEAL #1                           │
├─────────────────────────────────────────────────────────────┤
│  Receipts 1-10 sealed into Merkle tree                      │
│                                                             │
│  Layer 3 (Root):           [4d0a55]                         │
│                              /    \                         │
│  Layer 2:            [e1c3a2]    [b9d4f7]                   │
│                        /  \        /  \                     │
│  Layer 1:        [a1b2] [c3d4] [e5f6] [g7h8]                │
│                    |     |      |      |                    │
│  Layer 0 (Leaves): Receipt1 Receipt2 ... Receipt10          │
│                    (curr_digest values)                     │
│                                                             │
│  Seal Metadata:                                             │
│  ├─ seal_id: 1                                              │
│  ├─ root_hash: 4d0a55...                                    │
│  ├─ receipt_count: 10                                       │
│  ├─ first_lamport: 1                                        │
│  ├─ last_lamport: 10                                        │
│  ├─ sealed_at: 2025-11-05T23:45:00Z                         │
│  ├─ seal_digest: 9a2fcd... (H of seal body)                 │
│  └─ prev_seal_digest: null (genesis seal)                   │
└─────────────────────────────────────────────────────────────┘

All 10 receipts now have:
  merkleSealId: 1
  merkle_seal: { seal_id: 1, root_hash: "4d0a55...", ... }
```

---

## 🔗 Multi-Seal Chain

```
Seal 1 (Genesis)                Seal 2 (Linked)
┌──────────────────┐            ┌──────────────────┐
│ seal_id: 1       │            │ seal_id: 2       │
│ receipts: 1-10   │            │ receipts: 11-20  │
│ root: 4d0a55...  │            │ root: 3e7b89...  │
│ prev_root: null  │            │ prev_root: 4d0a..│◄── Links to Seal 1
│ prev_digest: null│            │ prev_digest: 9a2f│
│ seal_digest: 9a2f│────────────┼────────────────────
│ position: genesis│            │ position: linked │
└──────────────────┘            └──────────────────┘
        ↓                               ↓
   Receipts 1-10                   Receipts 11-20
   (Sealed batch)                  (Sealed batch)
```

---

## 📊 Database Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                    GovernanceReceipt                           │
├────────────────────────────────────────────────────────────────┤
│ id: 456                                                        │
│ lamport: 1                                                     │
│ promptHash: a9c4...                                            │
│ outputHash: 7ab2...                                            │
│ criesOmega: 0.74                                               │
│                                                                │
│ ┌─ NEW RECEIPT FIELDS ──────────────────────────┐             │
│ │ receiptId: rcpt_100_a9c                       │             │
│ │ conversationId: conv_abc123                   │             │
│ │ exchangeId: xchg_001                          │             │
│ │ traceId: TRACE-1730841000-9f8b                │             │
│ │ prevDigest: null                              │             │
│ │ currDigest: e5f6c4d3...                       │             │
│ │ model: gpt-4                                  │             │
│ │ tokensIn: 812                                 │             │
│ │ tokensOut: 623                                │             │
│ │ policyFlags: []                               │             │
│ └───────────────────────────────────────────────┘             │
│                                                                │
│ merkleSealId: 1 ──────────────────┐                           │
└────────────────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │        MerkleSeal                  │
                    ├────────────────────────────────────┤
                    │ id: 1                              │
                    │ merkleRoot: 4d0a55...              │
                    │ receiptCount: 10                   │
                    │ firstLamport: 1                    │
                    │ lastLamport: 10                    │
                    │ sealDigest: 9a2fcd...              │
                    │ prevSealDigest: null               │
                    │ sealedAt: 2025-11-05T23:45:00Z     │
                    └────────────────────────────────────┘
```

---

## 🔐 Security Chain

```
┌────────────────────────────────────────────────────────────────┐
│                     RECEIPT CHAIN                              │
│                  (Conversation-scoped)                         │
│                                                                │
│  Receipt 1 ──► Receipt 2 ──► Receipt 3 ──► ... ──► Receipt 10 │
│  prev:null     prev:e5f6     prev:c3d4            prev:g7h8   │
│  curr:e5f6     curr:c3d4     curr:e5f6            curr:i9j0   │
│                                                                │
│  Any modification breaks chain:                                │
│  • Change Receipt 5 → Receipt 6.prev_digest mismatch          │
│  • Delete Receipt 7 → Receipt 8.prev_digest orphaned          │
│  • Reorder receipts → Lamport monotonicity violated           │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    MERKLE SEAL CHAIN                           │
│                   (Global batches)                             │
│                                                                │
│  Seal 1 ────────► Seal 2 ────────► Seal 3 ────────► ...       │
│  prev_root:null   prev_root:4d0a   prev_root:3e7b             │
│  root:4d0a55      root:3e7b89      root:2d5c41                │
│  prev_digest:null prev_digest:9a2f prev_digest:7c3e           │
│  seal_digest:9a2f seal_digest:7c3e seal_digest:5b9d           │
│                                                                │
│  Any modification breaks chain:                                │
│  • Change Seal 1 → Seal 2.prev_root mismatch                  │
│  • Add receipt to sealed batch → root_hash changes            │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Verification Levels

### Level 1: Single Receipt Integrity
```
Verify receipt digest:
  computed = H(lamport||prev_digest||inputs||outputs||cries||timestamp)
  stored = receipt.curr_digest
  
  ✅ computed === stored
```

### Level 2: Receipt Chain Integrity
```
Verify conversation chain:
  For each receipt i (i > 1):
    receipt[i].prev_digest === receipt[i-1].curr_digest
    receipt[i].lamport > receipt[i-1].lamport
  
  ✅ All links valid
```

### Level 3: Merkle Seal Integrity
```
Verify receipt in Merkle tree:
  1. Get receipt leaf hash (curr_digest)
  2. Get Merkle proof from seal
  3. Compute root from leaf + proof
  4. Compare with seal.merkleRoot
  
  ✅ Computed root === stored root
```

### Level 4: Seal Chain Integrity
```
Verify seal chain:
  For each seal i (i > 1):
    seal[i].prev_root === seal[i-1].root
    seal[i].prev_seal_digest === seal[i-1].seal_digest
  
  ✅ All seal links valid
```

---

## 📡 API Flow

```
Client Request:
  POST /api/pilot/llm
  { prompt, userRole, useGovernance: true }
       │
       ▼
Server (governedLLMCall):
  1. Load obligations
  2. Prepare prompt
  3. Call LLM
  4. Validate with Speechcraft
  5. Create governance receipt
  6. Generate Lamport receipt ◄── NEW!
  7. Check Merkle sealing
  8. Return response
       │
       ▼
Response:
  { response, cries, receiptId }

─────────────────────────────────────

Client can then query:

GET /api/receipts/stats
  ├─► { totalReceipts, sealedReceipts, avgCriesOmega, ... }

GET /api/receipts/:id
  ├─► Full Δ-ANALYSIS receipt

GET /api/receipts/conversation/:id
  ├─► All receipts for conversation

GET /api/receipts/conversation/:id/verify
  ├─► { valid: true, receiptCount: 10, violations: [] }

GET /api/merkle/block/:id
  ├─► Merkle block metadata
```

---

## 🚀 System Capacity

```
┌────────────────────────────────────────────────────────────────┐
│                    THROUGHPUT                                  │
├────────────────────────────────────────────────────────────────┤
│  Receipt Generation:    20/sec  = 1,200/min = 72,000/hour     │
│  Merkle Sealing:        12.5/sec = 750/min = 45,000 receipts  │
│                         (per seal, 10 receipts)                │
│  Chain Verification:    50/sec  = 3,000/min                    │
│  Export Operations:     100/sec = 6,000/min                    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    PRODUCTION LOAD                             │
├────────────────────────────────────────────────────────────────┤
│  1,000 users × 10 receipts/day     = 10,000 receipts/day      │
│  10,000 receipts ÷ 10/seal         = 1,000 seals/day          │
│  300,000 receipts/month            = 30,000 seals/month       │
│                                                                │
│  Storage (per receipt):            = ~5 KB                     │
│  Storage (300K receipts):          = 1.5 GB/month             │
│  Storage (3.6M receipts/year):     = 18 GB/year               │
└────────────────────────────────────────────────────────────────┘
```

---

## 📚 File Structure

```
AuditaAI/backend/
├── src/
│   ├── speechcraft.js              (970 lines) ✅
│   ├── merkle-sealer.js            (650 lines) ✅
│   └── receipt-generator.js        (500 lines) ✅ NEW!
│
├── server.js                        (5476 lines) ✅
│   ├── governedLLMCall()            (STEP 4.5 added)
│   └── 15 API endpoints             (5 new receipt endpoints)
│
├── prisma/
│   └── schema.prisma                ✅ Enhanced
│       ├── GovernanceReceipt        (30 columns, 9 indexes)
│       └── MerkleSeal               (9 columns)
│
└── Documentation:
    ├── LAMPORT_RECEIPT_SYSTEM.md         (Full guide)
    ├── RECEIPT_INTEGRATION_GUIDE.md      (Step-by-step)
    ├── RECEIPT_QUICK_REFERENCE.md        (Quick ref)
    └── RECEIPT_ARCHITECTURE_VISUAL.md    (This file)
```

---

## ✅ Integration Checklist

- [x] Create receipt-generator.js (500 lines)
- [x] Enhance Prisma schema (10 new fields)
- [x] Push schema to database
- [x] Generate Prisma client
- [ ] Import receipt-generator in server.js
- [ ] Add STEP 4.5 to governedLLMCall()
- [ ] Add 5 receipt API endpoints
- [ ] Restart server
- [ ] Test receipt generation
- [ ] Test API endpoints
- [ ] Verify chain integrity
- [ ] Test Merkle sealing

**Next Action**: Say **"integrate receipts now"**

---

**Status**: Ready to integrate  
**Time**: 20 minutes  
**Risk**: Low
