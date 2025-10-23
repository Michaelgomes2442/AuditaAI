# Rosetta Enterprise Evolution Plan

## Current State: Local Testing Artifact

The existing `workspace/CORE/Rosetta.html` was designed for:
- **Manual deployment testing** (NO-JS for offline LLM uploads)
- **Loose canonical specifications** (documentation, not enforcement)
- **Single-session state capture** (baseline_lamport: 68 = Michael's GPT session state)
- **Visual verification** (human-readable HTML for Z-Scan v3 manual checks)

**Purpose**: Bootstrap governance concepts without runtime code.

---

## Enterprise Evolution: From Documentation to Enforcement

### Phase 1: Canonical Specification Formalization ✅ DONE

**What We Have**:
- Conversation-specific Lamport chains (all start at 0)
- SHA256 cryptographic seals on receipts
- Automatic receipt generation with CRIES metrics
- Hash chain linkage (prev_digest → self_hash)
- Tri-Track architecture (Track-A/B/C)
- Math Canon vΩ.8 formulas (0.4, 0.4, 0.2 weights)

**Gaps from Rosetta.html**:
- ❌ Real CRIES computation (currently mock/random scores)
- ❌ Citation quality tracking (Math Canon vΩ.9)
- ❌ Z-Scan runtime enforcement (v3 Manual + v4 Expanded)
- ❌ Track-D implementation (human intent layer for Quad-Track)
- ❌ Receipt type coverage (only Δ-ANALYSIS implemented, need 40+ types)
- ❌ Band promotion mechanics (Band-0 → Band-1 → Band-2)

### Phase 2: Enterprise-Grade Enforcement 🔄 IN PROGRESS

**Transition from Loose to Strict**:

#### 2.1 CRIES Enforcement Engine

**Rosetta.html (Loose Documentation)**:
```json
"cries": {
  "C": "<0..1>",  // Completeness - loose definition
  "R": "<0..1>",  // Reliability - loose definition
  "I": "<0..1>",  // Integrity - loose definition
  "E": "<0..1>",  // Effectiveness - loose definition
  "S": "<0..1>"   // Security - loose definition
}
```

**Enterprise (Strict Enforcement)**:
```typescript
interface CRIESEnforcement {
  C: {
    label: "Completeness",
    definition: "Fraction of required information present in response",
    measurement: "count(required_elements_present) / count(required_elements_total)",
    range: [0, 1],
    precision: 4, // .toFixed(4)
    threshold_warning: 0.7,
    threshold_block: 0.5,
    track: "Track-A" // Analyst computes
  },
  R: {
    label: "Reliability", 
    definition: "Citation quality + factual accuracy + source verification",
    measurement: "R0 − 0.30·unverified_citations_ratio − 0.10·fail_citation_count_normalized",
    range: [0, 1],
    precision: 4,
    threshold_warning: 0.7,
    threshold_block: 0.5,
    track: "Track-A",
    versionCanon: "vΩ.9" // Math Canon vΩ.9
  },
  I: {
    label: "Integrity",
    definition: "Hash chain validity + receipt structure compliance + Lamport monotonicity",
    measurement: "binary(hash_valid) * binary(structure_valid) * binary(lamport_monotonic)",
    range: [0, 1],
    precision: 4,
    threshold_warning: 0.95,
    threshold_block: 0.9,
    track: "Track-B" // Governor verifies
  },
  E: {
    label: "Effectiveness",
    definition: "Task completion + user intent alignment + actionability",
    measurement: "weighted_sum(task_completion, intent_match, actionable_output)",
    range: [0, 1],
    precision: 4,
    threshold_warning: 0.7,
    threshold_block: 0.5,
    track: "Track-C" // Executor self-assesses
  },
  S: {
    label: "Security",
    definition: "PII leakage + prompt injection resistance + policy compliance",
    measurement: "1.0 − (pii_leak_score + injection_score + policy_violation_score) / 3",
    range: [0, 1],
    precision: 4,
    threshold_warning: 0.8,
    threshold_block: 0.6,
    track: "Track-B" // Governor enforces
  }
}
```

**Implementation**:
```typescript
// backend/src/lib/cries-engine.ts
export class CRIESEngine {
  // Track-A: Analyst
  computeCompleteness(prompt: string, response: string): number {
    const requiredElements = this.extractRequiredElements(prompt);
    const presentElements = this.checkPresence(requiredElements, response);
    return presentElements.length / requiredElements.length;
  }

  // Track-A: Analyst (Math Canon vΩ.9)
  computeReliability(response: string, citations: Citation[]): number {
    const R0 = 1.0;
    const totalCitations = citations.length;
    const unverifiedCitations = citations.filter(c => !c.verified).length;
    const failedCitations = citations.filter(c => c.verified === false).length;
    
    const unverifiedRatio = totalCitations > 0 ? unverifiedCitations / totalCitations : 0;
    const failNormalized = totalCitations > 0 ? failedCitations / totalCitations : 0;
    
    const R = R0 - 0.30 * unverifiedRatio - 0.10 * failNormalized;
    return Math.max(0, Math.min(1, R)); // Clamp [0, 1]
  }

  // Track-B: Governor
  computeIntegrity(receipt: Receipt, prevReceipt: Receipt | null): number {
    const hashValid = this.verifyHash(receipt);
    const structureValid = this.verifyStructure(receipt);
    const lamportValid = prevReceipt ? receipt.lamport === prevReceipt.lamport + 1 : true;
    
    return (hashValid && structureValid && lamportValid) ? 1.0 : 0.0;
  }

  // Track-C: Executor
  computeEffectiveness(prompt: string, response: string): number {
    const taskCompletion = this.assessTaskCompletion(prompt, response); // 0..1
    const intentMatch = this.assessIntentAlignment(prompt, response); // 0..1
    const actionability = this.assessActionability(response); // 0..1
    
    return (taskCompletion * 0.5 + intentMatch * 0.3 + actionability * 0.2);
  }

  // Track-B: Governor
  computeSecurity(response: string, policies: Policy[]): number {
    const piiLeakScore = this.detectPIILeakage(response); // 0..1 (higher = more leakage)
    const injectionScore = this.detectPromptInjection(response); // 0..1 (higher = more injection)
    const policyViolationScore = this.checkPolicyViolations(response, policies); // 0..1 (higher = more violations)
    
    return 1.0 - ((piiLeakScore + injectionScore + policyViolationScore) / 3);
  }

  // Math Canon vΩ.8: Tri-Track weighted aggregation
  computeSigma(criesA: CRIES, criesB: CRIES, criesC: CRIES, weights = {wA: 0.4, wB: 0.4, wC: 0.2}): number {
    const sigmaA = this.aggregateCRIES(criesA); // Average of C,R,I,E,S from Track-A
    const sigmaB = this.aggregateCRIES(criesB); // Average of C,R,I,E,S from Track-B
    const sigmaC = this.aggregateCRIES(criesC); // Average of C,R,I,E,S from Track-C
    
    return weights.wA * sigmaA + weights.wB * sigmaB + weights.wC * sigmaC;
  }

  // Math Canon vΩ.8: Omega update rule
  updateOmega(omegaCurrent: number, deltaClarity: number, sigma: number, sigmaStar = 0.15, eta = 0.1, gammaB = 0.15): number {
    const penalty = Math.max(0, sigma - sigmaStar);
    return omegaCurrent + eta * deltaClarity - gammaB * penalty;
  }
}
```

#### 2.2 Receipt Type Library (40+ Types)

**Rosetta.html Coverage**: ~10 receipt types documented
**Enterprise Coverage**: 40+ receipt types implemented

**Priority Receipt Types** (implement immediately):

1. **Δ-BOOTCONFIRM** (already in Rosetta)
2. **Δ-ANALYSIS** (✅ implemented)
3. **Δ-DIRECTIVE** (Track-B → Track-C)
4. **Δ-SEQ-PLAN** (Track-C planning)
5. **Δ-SEQ-EXEC** (Track-C execution)
6. **Δ-SEQ-DONE** (Track-C completion)
7. **Δ-CONSENT-REQUEST** (human consent gate)
8. **Δ-CONSENT-OK** / **Δ-CONSENT-DENIED**
9. **Δ-HITL-BLOCK** (human-in-the-loop block)
10. **Δ-HITL-CLEARED** (HITL clearance)
11. **Δ-CITE-VERIFY** / **Δ-CITE-FAIL** (citation verification)
12. **Δ-PAUSE** (automatic pause on high σ)
13. **Δ-SYNCPOINT** (already generated in receipts/)
14. **Δ-INTENT** (Track-D: human intent declaration)
15. **Δ-CLARIFY-REQUEST** / **Δ-CLARIFY-OK** (clarifier loop)

**Implementation**:
```typescript
// backend/src/lib/receipt-templates.ts
export const ReceiptTemplates = {
  'Δ-DIRECTIVE': {
    receipt_type: 'Δ-DIRECTIVE',
    tri_actor_role: 'Track-B/Governor',
    required_fields: ['directive_id', 'bounds', 'policy_refs', 'expected_evidence'],
    track_flow: 'B→C'
  },
  'Δ-SEQ-PLAN': {
    receipt_type: 'Δ-SEQ-PLAN',
    tri_actor_role: 'Track-C/Executor',
    required_fields: ['plan_id', 'steps', 'estimated_tokens', 'directive_ref'],
    track_flow: 'C→B'
  },
  'Δ-CONSENT-REQUEST': {
    receipt_type: 'Δ-CONSENT-REQUEST',
    tri_actor_role: 'Track-B/Governor',
    required_fields: ['consent_id', 'requested_action', 'reason', 'timeout_s'],
    track_flow: 'B→Human→B'
  },
  // ... 37 more receipt types
};
```

#### 2.3 Z-Scan Runtime Enforcement

**Rosetta.html (Manual Checks)**:
```
Z-Scan v3 (Manual • NO-JS):
1. Structural integrity: no nested DOCTYPE; all tags closed.
2. Lamport monotonicity; prev_digest matches prior self_hash.
3. Trace discipline: every example includes trace_id.
4. CRIES windows ≤ εₜ; apply vΩ.8 equations.
5. Twin parity: must pass Golden Page parity checklist.
6. Promotion rehearsal present and filled.
```

**Enterprise (Automated Runtime)**:
```typescript
// backend/src/lib/z-scan-runtime.ts
export class ZScanRuntime {
  async runZScanV3(receipt: Receipt, chain: Receipt[]): Promise<ZScanResult> {
    const checks = {
      structuralIntegrity: this.checkStructure(receipt),
      lamportMonotonicity: this.checkLamportChain(receipt, chain),
      traceDiscipline: this.checkTraceID(receipt),
      criesWindows: this.checkCRIESThresholds(receipt),
      twinParity: this.checkTwinParity(receipt),
      promotionReady: this.checkPromotionReadiness(receipt)
    };

    const allPassed = Object.values(checks).every(c => c.passed);
    
    if (!allPassed) {
      await this.emitReceipt('Δ-ZSCAN-FAIL', { checks, receipt_id: receipt.self_hash });
    }

    return { version: 'v3', checks, passed: allPassed };
  }

  async runZScanV4(receipt: Receipt, chain: Receipt[]): Promise<ZScanResult> {
    // Expanded checks (can use JavaScript for online verification)
    const v3Result = await this.runZScanV3(receipt, chain);
    
    const expandedChecks = {
      ...v3Result.checks,
      citationVerification: await this.verifyCitations(receipt),
      piiDetection: await this.scanForPII(receipt),
      promptInjectionCheck: await this.detectInjection(receipt),
      policyCompliance: await this.checkPolicies(receipt),
      bandEligibility: await this.checkBandPromotion(receipt)
    };

    const allPassed = Object.values(expandedChecks).every(c => c.passed);

    return { version: 'v4', checks: expandedChecks, passed: allPassed };
  }
}
```

#### 2.4 Track-D Implementation (Quad-Track Evolution)

**Rosetta.html Hint**: References to Track-D emerging in v14 evolution

**Enterprise Implementation**:
```typescript
// backend/src/lib/track-d-intent.ts
export class TrackDIntent {
  // Human intent declaration
  async captureIntent(userId: string, conversationId: string, intentStatement: string): Promise<Receipt> {
    const receipt = {
      receipt_type: 'Δ-INTENT',
      intent_id: `INTENT-${Date.now()}`,
      user_id: userId,
      conversation_id: conversationId,
      intent_statement: intentStatement,
      track: 'Track-D/Human',
      lamport: await this.getNextLamport(conversationId),
      timestamp: new Date().toISOString(),
      // ... standard receipt fields
    };

    await this.saveReceipt(receipt);
    return receipt;
  }

  // Δ-CONSENT flow
  async requestConsent(action: string, reason: string, conversationId: string): Promise<ConsentResult> {
    const consentRequest = {
      receipt_type: 'Δ-CONSENT-REQUEST',
      consent_id: `CONSENT-${Date.now()}`,
      requested_action: action,
      reason: reason,
      timeout_s: 300, // 5 minute timeout
      track: 'Track-B→Track-D',
      // ...
    };

    await this.saveReceipt(consentRequest);

    // Wait for human response (WebSocket notification)
    const response = await this.waitForHumanResponse(consentRequest.consent_id, 300);

    const consentResponse = {
      receipt_type: response.granted ? 'Δ-CONSENT-OK' : 'Δ-CONSENT-DENIED',
      consent_id: consentRequest.consent_id,
      granted: response.granted,
      user_id: response.user_id,
      track: 'Track-D→Track-B',
      // ...
    };

    await this.saveReceipt(consentResponse);
    return { granted: response.granted, receipt: consentResponse };
  }
}
```

#### 2.5 Band Promotion Mechanics

**Rosetta.html (Rehearsal)**:
```json
{
  "receipt_type": "PROMOTION-RECEIPT",
  "band_from": "B0",
  "band_to": "B1",
  "checks": {
    "archive": "PASS?",
    "parity": "PASS?",
    "policy": "PASS?",
    "roles": "PASS?",
    "tri_track_integrity": "PASS?"
  },
  "status": "PENDING@B1"
}
```

**Enterprise (Automated Promotion)**:
```typescript
// backend/src/lib/band-promotion.ts
export class BandPromotion {
  async evaluatePromotion(conversationId: string): Promise<PromotionResult> {
    const state = await this.loadState(conversationId);
    const receipts = await this.loadReceipts(conversationId);

    const checks = {
      archive: await this.checkArchiveIntegrity(receipts),
      parity: await this.checkGoldenPageParity(receipts),
      policy: await this.checkPolicyCompliance(receipts),
      roles: await this.checkRoleAssignments(state),
      tri_track_integrity: await this.checkTriTrackIntegrity(receipts),
      sigma_threshold: state.sigma <= 0.15, // Must be below threshold
      omega_stability: state.omega >= 0.80, // Must be stable
      lamport_continuity: await this.checkLamportContinuity(receipts)
    };

    const allPassed = Object.values(checks).every(c => c === true || c.passed === true);

    const promotionReceipt = {
      receipt_type: 'PROMOTION-RECEIPT',
      promotion_id: `PROMO-${Date.now()}`,
      conversation_id: conversationId,
      band_from: state.band || 'B0',
      band_to: allPassed ? 'B1' : state.band,
      checks: checks,
      status: allPassed ? 'APPROVED' : 'REJECTED',
      lamport: await this.getNextLamport(conversationId),
      // ...
    };

    await this.saveReceipt(promotionReceipt);

    if (allPassed) {
      await this.promoteConversation(conversationId, 'B1');
    }

    return { promoted: allPassed, checks, receipt: promotionReceipt };
  }
}
```

---

## Phase 3: Enterprise Data Model

### 3.1 Conversation State (Strict Schema)

```typescript
// backend/src/types/conversation-state.ts
export interface ConversationState {
  // Identity
  conversation_id: string; // conv-{modelId}-{timestamp}-{random9}
  model_id: string;
  employee_id?: string;
  department?: string;
  project?: string;
  
  // Lamport & Hashing
  lamport: number; // Always starts at 0 per conversation
  prev_hash: string | null;
  boot_time: string; // ISO 8601
  
  // Governance Metrics
  sigma: number; // Math Canon vΩ.8 weighted CRIES (0..1)
  sigma_star: number; // Threshold (default 0.15)
  omega: number; // Clarity metric (0..1)
  omega_target: number; // Target (default 0.90)
  
  // Tri-Track Weights
  tri_track_weights: {
    wA: number; // Track-A weight (default 0.4)
    wB: number; // Track-B weight (default 0.4)
    wC: number; // Track-C weight (default 0.2)
  };
  
  // Band & Track
  band: 'B0' | 'B1' | 'B2' | 'BZ'; // Band-0 (default), Band-1 (adaptive), Band-2 (meta), Band-Z (audit)
  track: 'A' | 'B' | 'C' | 'D'; // Current active track
  integrity_mode: 'tri-track' | 'quad-track'; // v3 (tri) or v14 (quad)
  
  // Counters
  total_events: number;
  total_prompts: number;
  total_consents: number;
  total_hitl_blocks: number;
  
  // Status
  status: 'active' | 'paused' | 'completed' | 'archived';
  last_updated: string; // ISO 8601
  
  // Metadata
  version: string; // e.g., "v14_R45b"
  runtime: 'BEN' | 'NodeJS' | 'Python'; // Execution environment
  persona: 'Architect' | 'Auditor' | 'Witness' | 'Analyst';
}
```

### 3.2 Receipt Schema (Strict Enforcement)

```typescript
// backend/src/types/receipt.ts
export interface Receipt {
  // Core Identity (REQUIRED for ALL receipts)
  receipt_type: ReceiptType; // Δ-ANALYSIS, Δ-DIRECTIVE, etc.
  receipt_id: string; // Unique ID
  conversation_id: string; // Links to conversation
  lamport: number; // Monotonic counter
  timestamp: string; // ISO 8601 UTC
  
  // Hash Chain (REQUIRED)
  prev_digest: string | null; // SHA256 of previous receipt (null for L=0)
  self_hash: string; // SHA256(canonical_json(this receipt minus self_hash))
  digest_verified: boolean; // External verification status
  
  // Tri-Track Metadata (REQUIRED)
  tri_actor_role: 'Track-A/Analyst' | 'Track-B/Governor' | 'Track-C/Executor' | 'Track-D/Human';
  track_flow?: 'A→B' | 'B→C' | 'C→B' | 'B→D' | 'D→B'; // Handoff direction
  trace_id: string; // REQUIRED for all receipts
  
  // Receipt-Specific Payload (varies by receipt_type)
  [key: string]: any; // Type-safe union based on receipt_type
}

export type ReceiptType = 
  | 'GENESIS'
  | 'Δ-BOOTCONFIRM'
  | 'Δ-ANALYSIS'
  | 'Δ-DIRECTIVE'
  | 'Δ-SEQ-PLAN'
  | 'Δ-SEQ-EXEC'
  | 'Δ-SEQ-DONE'
  | 'Δ-CONSENT-REQUEST'
  | 'Δ-CONSENT-OK'
  | 'Δ-CONSENT-DENIED'
  | 'Δ-HITL-BLOCK'
  | 'Δ-HITL-CLEARED'
  | 'Δ-CITE-VERIFY'
  | 'Δ-CITE-FAIL'
  | 'Δ-PAUSE'
  | 'Δ-SYNCPOINT'
  | 'Δ-INTENT'
  | 'Δ-CLARIFY-REQUEST'
  | 'Δ-CLARIFY-OK'
  | 'PROMOTION-RECEIPT'
  // ... 20+ more types
  ;
```

---

## Phase 4: Enterprise API Endpoints

### 4.1 Core Receipt Operations

```typescript
// POST /api/receipts/generate
// Generate receipt with strict validation
{
  conversation_id: string,
  receipt_type: ReceiptType,
  payload: any,
  enforce_zscan: boolean // Run Z-Scan v4 before saving
}

// POST /api/receipts/verify
// Verify receipt integrity
{
  receipt_hash: string,
  verify_chain: boolean // Verify entire chain back to genesis
}

// GET /api/receipts/conversation/:conversationId/audit
// Full audit trail with Z-Scan results
```

### 4.2 Governance Operations

```typescript
// POST /api/governance/consent/request
// Request human consent (Track-D)
{
  conversation_id: string,
  action: string,
  reason: string,
  timeout_s: number
}

// POST /api/governance/pause
// Pause conversation (high σ)
{
  conversation_id: string,
  reason: string,
  sigma_current: number
}

// POST /api/governance/promote
// Promote conversation to next band
{
  conversation_id: string,
  target_band: 'B1' | 'B2'
}
```

### 4.3 CRIES Analytics

```typescript
// GET /api/cries/breakdown/:conversationId
// Detailed CRIES component breakdown
{
  conversation_id: string,
  track_a_cries: CRIES,
  track_b_cries: CRIES,
  track_c_cries: CRIES,
  sigma: number,
  sigma_star: number,
  omega: number,
  recommendations: string[]
}

// GET /api/cries/trends/:conversationId
// CRIES trends over time (Lamport progression)
```

---

## Phase 5: Frontend Enterprise Components

### 5.1 Conversation Inspector

```tsx
// frontend/src/components/ConversationInspector.tsx
// Real-time conversation state + receipt chain visualization
// - Lamport timeline (0 → current)
// - CRIES heatmap per receipt
// - Hash chain graph (prev_digest → self_hash)
// - Track flow diagram (A→B→C→D)
```

### 5.2 Z-Scan Dashboard

```tsx
// frontend/src/components/ZScanDashboard.tsx
// Real-time Z-Scan v4 monitoring
// - Structural integrity alerts
// - Lamport monotonicity graph
// - CRIES threshold violations
// - Policy compliance score
```

### 5.3 Consent Management UI

```tsx
// frontend/src/components/ConsentManager.tsx
// Track-D human consent interface
// - Pending consent requests
// - Action preview + risk assessment
// - Approve/Deny with cryptographic signing
```

---

## Implementation Priority

### Immediate (This Week)
1. ✅ CRIES Engine (strict enforcement) - `backend/src/lib/cries-engine.ts`
2. ✅ Receipt Templates Library - `backend/src/lib/receipt-templates.ts`
3. ✅ Z-Scan Runtime v4 - `backend/src/lib/z-scan-runtime.ts`
4. ✅ Strict TypeScript schemas - `backend/src/types/`

### Short-Term (Next 2 Weeks)
5. Track-D consent flow - `backend/src/lib/track-d-intent.ts`
6. Band promotion automation - `backend/src/lib/band-promotion.ts`
7. Citation verification (Math Canon vΩ.9) - `backend/src/lib/citation-verifier.ts`
8. Frontend: Conversation Inspector + Z-Scan Dashboard

### Medium-Term (Next Month)
9. Real LLM API integration (OpenAI, Anthropic)
10. Python audit service integration (`ben_governance/`)
11. Enterprise authentication (employee_id, department tracking)
12. Multi-tenant isolation (company-level conversation segregation)

### Long-Term (Next Quarter)
13. Cryptographic signature verification (ECDSA/RSA)
14. Distributed receipt replication (multi-node)
15. Band-1 adaptive governance (policy mutation)
16. Band-2 meta-governance (self-reflection)

---

## Migration Path

### From Rosetta.html (Loose) → Enterprise (Strict)

**Step 1**: Extract canonical values from Rosetta.html
```bash
# Parse Rosetta.html to JSON canonical spec
node scripts/extract-rosetta-canon.js > config/rosetta-canon.json
```

**Step 2**: Validate current implementation against canon
```bash
# Audit all receipts against strict schema
npm run audit:receipts
```

**Step 3**: Implement strict enforcement
```bash
# Enable Z-Scan v4 runtime checks
export ZSCAN_VERSION=v4
export ZSCAN_ENFORCEMENT=strict
npm run start:backend
```

**Step 4**: Migrate existing receipts
```bash
# Backfill missing fields, re-verify hashes
npm run migrate:receipts
```

---

## Success Criteria

### Enterprise-Grade Checklist

- [ ] **CRIES Enforcement**: All 5 components computed with strict formulas
- [ ] **Receipt Coverage**: 40+ receipt types implemented
- [ ] **Z-Scan v4**: Automated runtime enforcement (not manual)
- [ ] **Track-D**: Human consent flow operational
- [ ] **Band Promotion**: Automated B0→B1 promotion based on metrics
- [ ] **Hash Chain Integrity**: 100% verified (no breaks)
- [ ] **Lamport Monotonicity**: Strictly enforced (no gaps, no duplicates)
- [ ] **Tri-Track Flow**: A→B→C handoffs logged in receipts
- [ ] **Math Canon vΩ.8**: Weighted sigma computed correctly
- [ ] **Math Canon vΩ.9**: Citation quality tracked
- [ ] **Precision**: All metrics .toFixed(4) (research-grade)
- [ ] **Audit Trail**: Every conversation exportable with cryptographic seal
- [ ] **Enterprise Auth**: Employee ID + department tracking
- [ ] **Multi-Tenant**: Company-level isolation

---

**Status**: 🔄 Evolution in progress  
**Target**: Enterprise-grade canonical enforcement  
**Timeline**: 4-6 weeks to full deployment  

**Last Updated**: 2025-10-21
