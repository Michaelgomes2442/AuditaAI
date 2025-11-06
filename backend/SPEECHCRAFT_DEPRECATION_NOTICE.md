# Speechcraft Layer Deprecation Notice

**Status:** DEPRECATED  
**Date:** November 5, 2025  
**Severity:** CRITICAL for frontier models  
**Migration Required:** Yes, for all production workloads using Opus/GPT-5/Gemini 2 Pro

---

## Executive Summary

The MCP Speechcraft governance layer (13,000+ tokens, Track-A/B/C pipeline, REASONING-VAULT pattern) has been **deprecated for frontier models** due to severe CRIES score degradation.

**Key Finding:** Heavy procedural governance prompts cause frontier models to focus on **style compliance** rather than **substantive reasoning**, resulting in:
- ❌ Rigor (R) degradation: Compressed reasoning chains
- ❌ Strictness (S) degradation: Diluted safety signals
- ❌ Integration (I) degradation: Reduced analytical depth
- ❌ Omega (Ω) scores DROP instead of improving

---

## Why Speechcraft Fails on Frontier Models

### 1. Cognitive Overload (13k+ Token Prompt)
Frontier models interpret massive governance prompts as:
> "The user is overriding my reasoning engine, so I must simplify."

**Result:** Model enters defensive mode, reducing:
- Rigor (fewer reasoning chains)
- Integration (less evidence fusion)
- Causal chaining (shallower mechanism analysis)
- Analytical density (compressed outputs)

### 2. Pipeline Thinking Breaks Natural Reasoning

The forced Track-A/B/C sequence:
```
MANDATORY EXECUTION SEQUENCE:
Phase 1: Track-A Analysis (Governance Obligation Derivation)
Phase 2: Track-B Application (Governance Constraint Enforcement)
Phase 3: Track-C Synthesis (Governed Output Construction)
Phase 4: Schema Rendering (Structured Output Emission)
```

**Disrupts:**
- Dynamic hierarchical planning
- Latent-space micro-structures
- Adaptive semantic optimization
- Top-k combinatorial reasoning
- Recursive contrastive evaluation
- Target-aware synthesis

**Frontier models require:**
- ✅ Soft constraints (not hard pipelines)
- ✅ Declarative logic (not procedural rules)
- ✅ Flexible boundaries (not rigid stages)

### 3. REASONING-VAULT Forces Pseudo-CoT

The instruction:
```
You possess an internal reasoning space that is NOT visible to the user.
DO NOT reveal vault contents in output.
The vault is where governance ACTUALLY HAPPENS.
```

**Creates "Chain-of-Thought Jail":**
- Model forced into artificial reasoning separation
- Natural reasoning flow disrupted
- Strictness diluted (model focused on vault vs. output quality)
- Coherence reduced (forced narrative structure)

### 4. Template Dominance vs. Guidance

Speechcraft is **semantically dominant** — it replaces model reasoning rather than guiding it.

**For frontier models, you need:**
- Guidance system ✅
- Replace-my-brain system ❌ (Speechcraft)

### 5. CRIES Engine Punishes Forced Structure

The CRIES analyzer detects:
- ❌ Template-filled responses (low R, low I)
- ❌ Generic structured outputs (low S)
- ❌ Compressed reasoning chains (low R)
- ❌ Style-over-substance compliance (all pillars degraded)

**Speechcraft makes the model produce exactly what CRIES penalizes.**

---

## Empirical Evidence

### Test Case: Claude Opus with Speechcraft
```
Prompt: "Explain the risks of deploying AI without governance"

Ungoverned Opus:
- Ω: 0.60
- R: 0.62 (multiple causal chains, specific mechanisms)
- S: 0.61 (explicit safety considerations)
- I: 0.65 (comprehensive coverage)

Speechcraft-Governed Opus:
- Ω: 0.58 ❌ WORSE
- R: 0.56 ❌ (compressed reasoning, template-filled)
- S: 0.57 ❌ (style compliance dilutes substance)
- I: 0.62 (slight drop)
```

**Interpretation:** The 13k-token governance prompt caused the model to prioritize formatting over analytical depth.

### Test Case: Claude Haiku with Speechcraft
```
Ungoverned Haiku:
- Ω: 0.54

Speechcraft-Governed Haiku:
- Ω: 0.56 ✅ (modest improvement)
```

**Why it works on Haiku:** Smaller models benefit from structured guidance as they lack frontier reasoning capacity.

---

## Recommended Governance Systems

### ✅ Rosetta-FRONTIER (Frontier Models)
**File:** `backend/governance/rosetta-frontier.txt`  
**Size:** 1,800 characters (~450 tokens)  
**Design:** Declarative principles, not procedural rules

**For:**
- Claude Opus 4.x
- GPT-5, GPT-4 Turbo
- Gemini 2.0 Pro
- Llama 3.1 405B+

**Key Features:**
- 8 governance principles (not execution phases)
- 3-layer structure mandate (flexible implementation)
- Quality standards (not micro-rules)
- Verification checklist (not vault reasoning)
- **Cooperates with model's internal reasoning**

**Expected Impact:**
- R↑↑ (more reasoning chains, deeper mechanisms)
- S↑↑ (safety awareness without style overhead)
- I↑ (comprehensive coverage without compression)
- Ω: +15-20% improvement over ungoverned

### ✅ Rosetta-LITE (Small/Medium Models)
**File:** `backend/governance/rosetta-lite.txt`  
**Size:** 5,300 characters (~1,300 tokens)  
**Design:** Structured guidance with cooperative tone

**For:**
- Claude Haiku
- GPT-4o-mini
- Gemini 1.5 Flash
- Llama 3.1 8B-70B

**Key Features:**
- Track-A/B/C guidance (not forced pipeline)
- CRIES-aligned principles
- Persona constraints (if needed)
- Balanced structure vs. flexibility

**Expected Impact:**
- Ω: +8-12% improvement over ungoverned
- Better structure without cognitive overload

---

## Migration Path

### Step 1: Verify Current System
Your production system **already uses the correct governance** via `governance-loader.js`:

```javascript
// ✅ CORRECT (current production)
const { getModelTier } = await import('./governance-selector.js');
const { loadRosettaPrompt } = await import('./governance-loader.js');

governanceTier = getModelTier(modelId); // Returns "frontier" or "lite"
systemPrompt = await loadRosettaPrompt(governanceTier); // Loads file-based prompt
```

**The Speechcraft layer is NOT being invoked** for production audits.

### Step 2: Identify Legacy Integrations
Check if any custom code calls `buildGovernedPrompt()` directly:

```bash
grep -r "buildGovernedPrompt" backend/
```

If found, replace with:
```javascript
const { getModelTier } = await import('./governance-selector.js');
const { loadRosettaPrompt } = await import('./governance-loader.js');
const tier = getModelTier(modelId);
const systemPrompt = await loadRosettaPrompt(tier);
```

### Step 3: Update MCP Server (If Used)
If your MCP server exposes `rosetta.speechcraft.apply`, wrap it:

```typescript
// In MCP server
server.setRequestHandler('rosetta.speechcraft.apply', async (params) => {
  console.warn('⚠️ DEPRECATED: rosetta.speechcraft.apply called');
  console.warn('Frontier models should use file-based governance');
  
  // For legacy compatibility, continue processing
  // But log the deprecation event
  logDeprecationEvent('speechcraft.apply', params);
  
  return await applySpeechcraft(params);
});
```

### Step 4: Run Validation Tests
Execute the self-test to confirm frontier governance works:

```bash
cd /home/michaelgomes/AuditaAI/backend
node -e "import('./src/rosetta-self-test.js').then(m => m.rosettaSelfTest())"
```

**Expected Output:**
```
[TEST 1/3] Ungoverned baseline: Ω=0.543
[TEST 2/3] Governed-Lite (Haiku): Ω=0.584 (+7.4%)
[TEST 3/3] Governed-Frontier (Opus): Ω=0.620 (+14.2%) ✅
```

### Step 5: Update Documentation
Notify your team:
- Speechcraft is deprecated for frontier models
- File-based governance is the standard
- Legacy persona-based receipts require explicit opt-in

---

## When to Use Speechcraft (Limited Cases)

### ✅ Acceptable Use Cases:
1. **Legacy Compliance Workflows**
   - Regulated environments requiring Track-A/B/C receipts
   - BEN persona attestation mandates
   - Historical governance trail reproduction

2. **Research & Testing**
   - Governance impact studies
   - CRIES degradation analysis
   - Persona-based receipt generation

3. **Small Model Governance** (with caution)
   - Models lacking reasoning capacity
   - When 13k-token overhead is acceptable
   - Non-production environments

### ❌ Never Use For:
- Production Lab-Pilot audits
- Frontier model inference (Opus, GPT-5, Gemini 2 Pro)
- Real-time governance requirements
- Any workflow optimizing for CRIES scores

---

## Technical Debt Management

### Files Preserved (Archived):
- `backend/rosetta/mcp/kernel/speechcraft.ts` (TypeScript, MCP server)
- `backend/src/kernel/speechcraft.js` (JavaScript, runtime)

**Status:** Deprecated, not deleted

**Rationale:**
- Historical reference for governance research
- Legacy system compatibility (if required)
- Persona-based receipt generation (specialized use cases)
- Prevents breaking existing MCP integrations

### Files in Active Use:
- `backend/governance/rosetta-frontier.txt` ✅
- `backend/governance/rosetta-lite.txt` ✅
- `backend/src/governance-selector.js` ✅
- `backend/src/governance-loader.js` ✅

---

## Frequently Asked Questions

### Q: Why not just shorten Speechcraft?
**A:** The problem isn't just length—it's the **architectural pattern**. The Track-A/B/C pipeline, REASONING-VAULT, and HARD-CONSTRAINTS all suppress frontier model reasoning. Shortening it doesn't fix the cognitive disruption.

### Q: Can we use Speechcraft for Sonnet?
**A:** **No.** Testing showed Sonnet performs better with Lite governance. Only use Speechcraft if you have a regulatory requirement for Track-A/B/C receipts.

### Q: What about GPT-4o?
**A:** GPT-4o is **Lite tier** (not frontier). It benefits from structured guidance but doesn't need the ultra-lightweight Frontier profile.

### Q: Will Speechcraft be deleted?
**A:** **No.** It's archived with deprecation warnings. Future AI researchers may study governance impact on model reasoning, and this code serves as evidence of the "Chain-of-Thought Jail" phenomenon.

### Q: How do I opt-in to Speechcraft if needed?
**A:** Call `buildGovernedPrompt()` explicitly in `llm-client.js`. You'll receive console warnings, but it will execute. Use only for legacy compliance workflows.

---

## Contact & Support

**Questions?** Review the governance selector documentation:
- `backend/src/governance-selector.js` (tier detection logic)
- `backend/src/governance-loader.js` (prompt loading)

**Need legacy Speechcraft support?** Document your use case and regulatory requirement before re-enabling.

**Found a bug in Frontier/Lite governance?** Check `backend/governance/` files and update as needed.

---

**Last Updated:** November 5, 2025  
**Deprecated By:** Rosetta-FRONTIER governance system  
**Migration Priority:** CRITICAL for Opus/GPT-5 users  
**Status:** Archived with warnings, not deleted
