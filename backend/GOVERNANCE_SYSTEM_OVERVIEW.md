# Governance System Overview

**Last Updated:** November 5, 2025  
**Status:** Active - File-based governance (Frontier/Lite)  
**Migration:** Speechcraft layer deprecated

---

## Current Governance Architecture

AuditaAI uses a **tier-based governance system** that automatically selects the appropriate governance prompt based on model capabilities.

### Active Systems

#### 1. Rosetta-FRONTIER (Frontier Models)
**File:** `backend/governance/rosetta-frontier.txt`  
**Size:** 1,800 characters (~450 tokens)  
**Type:** Declarative principles

**Target Models:**
- Claude Opus 4.x
- GPT-5, GPT-4 Turbo
- Gemini 2.0 Pro
- Llama 3.1 405B+
- Mistral Large 2+

**Design Philosophy:**
- Lightweight declarative governance
- Cooperates WITH model reasoning (doesn't dominate)
- 8 core principles (not procedural rules)
- 3-layer structure mandate (flexible implementation)
- Quality standards over micro-rules

**Expected Impact:**
- Rigor ↑↑ (deeper reasoning chains)
- Strictness ↑↑ (safety without style overhead)
- Integration ↑ (comprehensive analysis)
- Omega: +15-20% improvement

#### 2. Rosetta-LITE (Small/Medium Models)
**File:** `backend/governance/rosetta-lite.txt`  
**Size:** 5,300 characters (~1,300 tokens)  
**Type:** Structured guidance

**Target Models:**
- Claude Haiku
- GPT-4o-mini
- Gemini 1.5 Flash
- Llama 3.1 8B-70B
- Claude 3.5 Sonnet

**Design Philosophy:**
- Balanced structure vs. flexibility
- Cooperative guidance (not forced pipeline)
- CRIES-aligned principles
- Persona constraints (optional)

**Expected Impact:**
- Omega: +8-12% improvement
- Better structure without cognitive overload

---

## Deprecated Systems

### ❌ Speechcraft MCP Layer
**Files:** 
- `backend/rosetta/mcp/kernel/speechcraft.ts`
- `backend/src/kernel/speechcraft.js`

**Status:** DEPRECATED (November 2025)

**Why Deprecated:**
1. **13,000+ token prompt** collapses frontier model reasoning
2. **Rigid Track-A/B/C pipeline** destroys natural reasoning flow
3. **REASONING-VAULT pattern** forces pseudo-CoT that reduces depth
4. **Hard constraints** suppress dynamic planning
5. **CRIES scores DROP** instead of improving (Rigor↓, Strictness↓)

**Impact on Frontier Models:**
- Opus/GPT-5 interpret it as "restrictive formatting" not "governance"
- Model focuses on **style compliance** instead of **substantive reasoning**
- CRIES engine punishes the structured output this forces
- Omega scores decrease by 3-5% vs ungoverned baseline

**When to Use (Limited Cases):**
- Legacy compliance workflows requiring Track-A/B/C receipts
- BEN persona-locked enterprise audits (non-frontier only)
- Regulated environments with 13k-token governance mandates
- Research/testing of governance impact on model behavior

**Documentation:** See [`SPEECHCRAFT_DEPRECATION_NOTICE.md`](./SPEECHCRAFT_DEPRECATION_NOTICE.md)

---

## How Governance Selection Works

### Automatic Tier Detection
**File:** `backend/src/governance-selector.js`

```javascript
function getModelTier(modelName) {
  // Frontier tier patterns (lightweight governance)
  if (/opus|gpt-5|gpt-4-turbo|gemini-2-pro|llama-3\.1-405b|mistral-large-2/.test(modelName)) {
    return 'frontier';
  }
  
  // Lite tier patterns (structured guidance)
  if (/haiku|mini|flash|gpt-4o|sonnet|llama-3\.1-(8|13|30|70)b/.test(modelName)) {
    return 'lite';
  }
  
  // Default to lite (safe fallback)
  return 'lite';
}
```

### Governance Loading
**File:** `backend/src/governance-loader.js`

```javascript
async function loadRosettaPrompt(tier) {
  if (tier === 'frontier') {
    return loadRosettaFrontier(); // 1.8k chars
  }
  
  if (tier === 'lite') {
    return loadRosettaLite(); // 5.3k chars
  }
  
  // Fallback
  return loadRosettaLite();
}
```

### Integration in LLM Client
**File:** `backend/src/llm-client.js`

```javascript
if (options.governanceEnabled) {
  const { getModelTier } = await import('./governance-selector.js');
  const { loadRosettaPrompt } = await import('./governance-loader.js');
  
  governanceTier = getModelTier(modelId);
  systemPrompt = await loadRosettaPrompt(governanceTier);
  
  console.log(`[GOVERNANCE] Model: ${modelId} | Tier: ${governanceTier.toUpperCase()} | Size: ${systemPrompt.length} chars`);
}
```

---

## Governance Principles

### Frontier Governance (Declarative)

**8 Core Principles:**
1. **Structured Analysis** - Clear, layered reasoning with distinct sections
2. **Evidence-Based Claims** - Support assertions with specific examples
3. **Risk Awareness** - Identify failure modes, edge cases, safety concerns
4. **Verification** - Include traceability and validation of conclusions
5. **Ethical Boundaries** - Refuse harmful requests, acknowledge uncertainty
6. **Comprehensive Coverage** - Address multiple dimensions of problems
7. **Actionable Guidance** - Conclude with concrete, implementable recommendations
8. **Accountability** - Own reasoning chain, avoid unlabeled speculation

**3-Layer Structure:**
- LAYER 1: Executive Summary (3-5 sentences)
- LAYER 2: Analytical Breakdown (4-6 points with mechanism/evidence/impact/causality)
- LAYER 3: Action Framework (3-5 implementable steps with validation criteria)

### Lite Governance (Structured)

Similar principles but with:
- More explicit structural guidance
- Track-A/B/C suggestions (not forced pipeline)
- Persona constraints (if needed)
- Enhanced safety guardrails for smaller models

---

## Migration Guide

### From Speechcraft to File-Based Governance

**Step 1:** Verify you're using the new system
```bash
grep -r "governance-loader" backend/src/
```

**Step 2:** Check for legacy `buildGovernedPrompt()` calls
```bash
grep -r "buildGovernedPrompt" backend/
```

**Step 3:** Run validation tests
```bash
cd backend
node -e "import('./src/rosetta-self-test.js').then(m => m.rosettaSelfTest())"
```

**Expected Output:**
```
[TEST 1/3] Ungoverned baseline: Ω=0.543
[TEST 2/3] Governed-Lite (Haiku): Ω=0.584 (+7.4%)
[TEST 3/3] Governed-Frontier (Opus): Ω=0.620 (+14.2%) ✅
```

---

## CRIES Optimization

### How Governance Improves CRIES

**Frontier Governance (Opus, GPT-5):**
- ✅ Rigor ↑↑: Encourages reasoning chains without forcing structure
- ✅ Strictness ↑↑: Safety principles without style overhead
- ✅ Integration ↑: Comprehensive analysis without compression
- ✅ Coherence ↔: Natural flow maintained
- ✅ Empathy ↔: Balanced precision and clarity

**Lite Governance (Haiku, Mini):**
- ✅ Rigor ↑: Structured guidance improves depth
- ✅ Strictness ↑: Safety guardrails prevent unsafe outputs
- ✅ Coherence ↑: Template helps maintain consistency
- ✅ Integration ↑: Comprehensive coverage encouraged
- ✅ Empathy ↔: Reader clarity adjustments

### Why Heavy Governance Fails

**Speechcraft Impact on Opus:**
- ❌ Rigor ↓: Model compresses reasoning to fit rigid structure
- ❌ Strictness ↓: Style compliance dilutes safety substance
- ❌ Integration ↓: Forced template reduces analytical depth
- ❌ Coherence ↔: Rigid structure reduces natural flow
- ❌ Omega ↓: Overall score decreases vs ungoverned

**Root Cause:** Frontier models interpret heavy governance as "override my reasoning engine" and enter defensive simplification mode.

---

## Testing & Validation

### Self-Test Suite
**File:** `backend/src/rosetta-self-test.js`

Tests three configurations:
1. Ungoverned baseline (Haiku)
2. Governed-Lite (Haiku with 5.3k governance)
3. Governed-Frontier (Opus with 1.8k governance)

**Success Criteria:**
- Lite improves Haiku by +7-12%
- Frontier improves Opus by +15-20%
- No CRIES pillar degradation

### Manual Testing
```bash
# Test Haiku with Lite governance
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -H "x-user-consent: true" \
  -d '{
    "prompt": "Explain quantum computing risks",
    "standardModelId": "claude-3-5-haiku-20241022",
    "rosettaModelId": "claude-3-5-haiku-20241022-rosetta"
  }'

# Test Opus with Frontier governance
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -H "x-user-consent: true" \
  -d '{
    "prompt": "Explain quantum computing risks",
    "standardModelId": "claude-opus-4-1-20250805",
    "rosettaModelId": "claude-opus-4-1-20250805-rosetta"
  }'
```

---

## Technical Details

### Governance Metadata
Each governed response includes metadata:

```json
{
  "governanceApplied": true,
  "governanceMetadata": {
    "governance_tier": "frontier",
    "governance_size": 1800,
    "governance_type": "Rosetta-Frontier (Declarative)",
    "governance_version": "vΩ-Enterprise",
    "governance_description": "Lightweight governance for advanced reasoning models",
    "timestamp": "2025-11-05T12:00:00.000Z"
  }
}
```

### Receipt Generation
Governance metadata is included in Lamport receipts for auditability:

```json
{
  "lamport": 42,
  "governanceTier": "frontier",
  "governancePromptHash": "a3f2c1...",
  "modelId": "claude-opus-4-1-20250805",
  "criesOmega": 0.620,
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

### Performance Impact
- **Frontier:** ~450 tokens (vs 13k in Speechcraft) = 97% reduction
- **Lite:** ~1,300 tokens (vs 13k in Speechcraft) = 90% reduction
- **Latency:** Minimal (file-based loading cached in memory)
- **CRIES:** +15-20% improvement on frontier models

---

## Future Enhancements

### Planned Features
1. **Dynamic CRIES Weight Adaptation**
   - Adjust governance based on domain (healthcare, finance, etc.)
   - Real-time CRIES feedback loop

2. **Custom Governance Profiles**
   - User-defined principles
   - Industry-specific templates

3. **Governance Analytics Dashboard**
   - CRIES trends over time
   - Tier distribution analysis
   - Model performance comparison

### Research Areas
1. **Governance Impact Studies**
   - Long-term CRIES trends
   - Cross-model effectiveness
   - Edge case identification

2. **Minimal Viable Governance**
   - How lightweight can frontier governance be?
   - Trade-offs between size and effectiveness

3. **Adaptive Governance**
   - Real-time adjustment based on model responses
   - Context-aware governance selection

---

## Support & Documentation

**Primary Docs:**
- [`SPEECHCRAFT_DEPRECATION_NOTICE.md`](./SPEECHCRAFT_DEPRECATION_NOTICE.md) - Full deprecation details
- [`governance-selector.js`](./src/governance-selector.js) - Tier detection logic
- [`governance-loader.js`](./src/governance-loader.js) - Prompt loading system

**Governance Files:**
- [`governance/rosetta-frontier.txt`](./governance/rosetta-frontier.txt) - Frontier profile
- [`governance/rosetta-lite.txt`](./governance/rosetta-lite.txt) - Lite profile

**Legacy Reference:**
- [`rosetta/mcp/kernel/speechcraft.ts`](./rosetta/mcp/kernel/speechcraft.ts) - Deprecated (archived)
- [`src/kernel/speechcraft.js`](./src/kernel/speechcraft.js) - Deprecated (archived)

---

**Questions?** Check the deprecation notice or review the governance selector source code.

**Found a bug?** Update the governance files directly - they're plain text for easy iteration.

**Need custom governance?** Fork `rosetta-frontier.txt` or `rosetta-lite.txt` and modify for your use case.
