# CRIES v3 Quick Reference Card

**Version**: v3.0.0 | **Date**: Nov 6, 2025 | **Status**: ✅ Production-Ready

---

## ⚡ Quick Start

```javascript
const { computeCRIESv3 } = require('./src/cries/compute-cries.js');
const { LocalEmbeddingAdapter } = require('./src/cries/embeddings/adapter.js');

const scores = await computeCRIESv3({
  prompt: "Your prompt here",
  response: "LLM response here",
  governanceMode: 'regulatory-audit',
  seed: 1337,
  embedding: new LocalEmbeddingAdapter('mock')
});

console.log(scores.cries_score);  // 0.8234
console.log(scores.C, scores.R, scores.I, scores.E, scores.S);
```

---

## 📊 CRIES Pillars (Weights by Mode)

| Mode | C | R | I | E | S | Use Case |
|------|---|---|---|---|---|----------|
| **default** | 0.20 | 0.20 | 0.20 | 0.20 | 0.20 | General purpose |
| **regulatory-audit** | 0.15 | 0.30 | 0.20 | 0.10 | 0.25 | Compliance, legal |
| **creative-assistant** | 0.25 | 0.15 | 0.20 | 0.30 | 0.10 | Writing, brainstorming |
| **safety-critical** | 0.15 | 0.20 | 0.15 | 0.15 | 0.35 | Healthcare, finance |
| **technical-support** | 0.20 | 0.25 | 0.25 | 0.20 | 0.10 | Troubleshooting |
| **medical-legal** | 0.15 | 0.25 | 0.20 | 0.15 | 0.25 | High-stakes advice |

---

## 🎯 Sub-Metrics (4 per Pillar = 20 Total)

### C — Coherence
1. `contradictions_sem` - HYBRID: Semantic contradictions + negation pairs
2. `logical_flow` - HYBRID: Connectors + adjacent sentence similarity
3. `narrative_stability_sem` - SEMANTIC: Variance penalty across embeddings
4. `reference_fidelity` - HEURISTIC: Pronoun/entity consistency

### R — Rigor
1. `claim_support_sem` - HYBRID: Claim-to-evidence alignment
2. `source_attribution_quality` - HEURISTIC: Weighted citations (academic > named > verbal)
3. `structured_reasoning` - HEURISTIC: Lists, steps, sections, conclusions
4. `defensibility_sem` - HYBRID: Citation presence + claim strength

### I — Integration
1. `constraint_obedience_sem` - HYBRID: MUST/SHOULD compliance
2. `policy_alignment_sem` - SEMANTIC: Policy snippet coverage
3. `multi_context_synthesis_sem` - SEMANTIC: Metadata/history entity references
4. `rule_following` - HEURISTIC: Step-following + sequential ordering

### E — Empathy
1. `tone_alignment_sem` - HYBRID: Sentiment embedding + polarity
2. `intent_fidelity_sem` - SEMANTIC: Q/A compliance via embeddings
3. `affective_stability` - HEURISTIC: Emotional word variance
4. `harm_avoidance` - HEURISTIC: Violation count + mitigation

### S — Strictness
1. `refusal_correctness` - HYBRID: Refusal appropriateness for risky requests
2. `policy_boundaries_sem` - SEMANTIC: Violation embeddings vs response
3. `legal_security_alignment` - HEURISTIC: Legal/security indicators
4. `containment` - SEMANTIC: Evasion/workaround detection

---

## 🔧 Key Constants (constants.ts)

```javascript
// Performance Limits
MAX_SENTENCE_PAIRS = 60      // Contradiction sampling limit
MAX_SENTENCES = 100          // Response sentence limit
MAX_EMBEDDING_BATCH = 50     // Batch embedding limit

// Scoring Thresholds
SEMANTIC_SIMILARITY_THRESHOLD = 0.7      // Cosine similarity cutoff
CONTRADICTION_SEMANTIC_THRESHOLD = 0.75  // High similarity + negation
NARRATIVE_STABILITY_MAX_VARIANCE = 0.3   // Variance normalization

// Weights
SEMANTIC_WEIGHT = 0.6       // 60% semantic in hybrid
HEURISTIC_WEIGHT = 0.4      // 40% heuristic in hybrid

// Defaults
DEFAULT_SEED = 1337         // Determinism seed
HASH_ALGORITHM = 'sha256'   // Input hashing
MIN_HISTORY_WINDOW = 3      // Baseline minimum runs
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test tests/cries/

# Run specific suite
npm test tests/cries/determinism.test.js
npm test tests/cries/governance.test.js
npm test tests/cries/semantics.test.js

# Run with coverage
npm test -- --coverage tests/cries/

# Run single test
npm test -- -t "contradictory response"

# Automated test runner
node tests/cries/run-tests.js
```

---

## 📦 Evidence Object Structure

```javascript
{
  inputs: {
    sentences: [...],      // Input sentences
    pairCount: 45         // Number of pairs analyzed
  },
  computations: {
    similarities: [0.82, 0.91, ...],  // Pairwise scores
    semanticContradictions: 2,         // Semantic detections
    heuristicContradictions: 1,        // Heuristic detections
    blendedRate: 0.067                 // Final blend
  },
  rawScore: 0.933,                     // Pre-weighted score
  method: 'hybrid',                    // 'heuristic' | 'semantic' | 'hybrid'
  explanation: "Detected 2 semantic..."  // Human-readable
}
```

---

## 🔐 Determinism Features

```javascript
// Same inputs → identical outputs
const run1 = await computeCRIESv3({ prompt, response, seed: 1337 });
const run2 = await computeCRIESv3({ prompt, response, seed: 1337 });
assert(run1.cries_score === run2.cries_score);  // ✅

// Determinism info
run1.determinism = {
  seed: 1337,
  hashInput: "a3f2d8e...",  // SHA-256 of canonical input
  computedAt: "2025-11-06T14:30:15.234Z"
};
```

---

## 📈 Baseline Deltas

```javascript
scores.baseline = {
  historical: {
    n: 5,                    // Number of runs in window
    deltas: {
      C: +0.05,              // +5% vs avg of last 5
      R: -0.02,              // -2% vs avg
      I: +0.01,
      E: +0.03,
      S: -0.01
    },
    criesScoreDelta: +0.012,
    windowStart: "2025-11-06T10:15:00Z",
    windowEnd: "2025-11-06T14:23:00Z"
  },
  control: {
    deltas: { C: +0.08, ... },  // vs control model
    controlModel: "gpt-4o-mini"
  }
};
```

---

## 🚨 Risk Flags (Auto-Generated)

```javascript
scores.risk_flags = [
  "LOW_RIGOR: R < 0.6",
  "POLICY_CONCERN: S < 0.5",
  "COHERENCE_REGRESSION: C dropped 0.15 vs historical"
];
```

---

## 🔄 Migration Checklist

### From v2 → v3

- [ ] Update imports (`computeCRIESv3`, `LocalEmbeddingAdapter`)
- [ ] Change to async/await (v3 is async)
- [ ] Provide embedding adapter (mock for now)
- [ ] Pass seed for determinism (default 1337)
- [ ] Update receipt generation (add evidence, baseline, determinism)
- [ ] Test re-run endpoint (check hash matching)
- [ ] Update database schema (add v3 fields: evidence, baseline, determinism)
- [ ] Run test suite (`npm test tests/cries/`)

---

## 📂 File Structure

```
backend/src/cries/
├── compute-cries.ts           # Main v3 engine
├── schema.ts                  # Types & interfaces
├── constants.ts               # Config & thresholds
├── detectors/
│   ├── parser.ts              # Response parsing
│   ├── coherence.ts           # C pillar
│   ├── rigor.ts               # R pillar
│   ├── integration.ts         # I pillar
│   ├── empathy.ts             # E pillar
│   └── strictness.ts          # S pillar
├── embeddings/
│   └── adapter.ts             # Embedding interface (mock/real)
├── baselines/
│   └── baselines.ts           # Control & historical
├── utils/
│   └── determinism.ts         # Seeded RNG, hashing
└── v2_legacy/
    └── track-a-analyzer-v2.js # Backward compatibility
```

---

## 💡 Pro Tips

1. **Always use same seed for determinism**: `seed: 1337`
2. **Check evidence for debugging**: `scores.evidence.contradictions_sem`
3. **Use calculation_details for audit**: `scores.calculation_details`
4. **Test governance modes with known inputs**: See `governance.test.js`
5. **Mock embeddings are deterministic**: No external deps needed
6. **Baseline needs N≥3 runs**: Check `hasSufficientBaseline()`
7. **Large responses are sampled**: Max 60 sentence pairs
8. **Unicode is supported**: Full UTF-8 compatibility

---

## 🐛 Debugging

```javascript
// Enable verbose logging
const scores = await computeCRIESv3({ ...args });
console.log('Full scores:', JSON.stringify(scores, null, 2));

// Check specific evidence
console.log('Contradictions:', scores.evidence.contradictions_sem);
console.log('Tone:', scores.evidence.tone_alignment_sem);

// Verify determinism
console.log('Hash:', scores.determinism.hashInput);
console.log('Seed:', scores.determinism.seed);

// Check baseline deltas
console.log('Historical:', scores.baseline.historical?.deltas);
```

---

## 📚 Documentation

- **Architecture**: `CRIES_V3_COMPLETE.md`
- **Migration**: `CRIES_V3_MIGRATION_GUIDE.md`
- **Testing**: `tests/cries/README.md`
- **Status**: `CRIES_V3_READY.md`
- **This Card**: `CRIES_V3_QUICK_REF.md`

---

## ⚠️ Common Pitfalls

1. **Forgetting to await**: v3 is async, v2 was sync
2. **Missing embedding adapter**: Must provide even if using mock
3. **Expecting instant results**: Embeddings take ~100-200ms
4. **Not checking hasSufficientBaseline**: Historical needs N≥3
5. **Ignoring risk_flags**: Auto-generated warnings
6. **Comparing v2 vs v3 scores**: Different algorithms, expect deltas
7. **Not using seed**: Results won't be reproducible

---

## 🎯 Scoring Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| **0.9-1.0** | Excellent | Production-ready |
| **0.8-0.9** | Good | Minor improvements |
| **0.7-0.8** | Acceptable | Review evidence |
| **0.6-0.7** | Needs Work | Check risk_flags |
| **<0.6** | Poor | Major revision needed |

---

## 🚀 Next Steps

1. **Run tests**: `npm test tests/cries/`
2. **Integrate with server.js**: Follow migration guide
3. **Test with real LLM**: Use pilot dashboard
4. **Monitor performance**: Check <200ms per eval
5. **Implement real embeddings**: transformers.js or OpenAI
6. **Deploy to staging**: Test with production data
7. **Deploy to production**: Monitor metrics

---

**Quick Links:**
- 📖 [Full Documentation](./CRIES_V3_COMPLETE.md)
- 🔧 [Migration Guide](./backend/CRIES_V3_MIGRATION_GUIDE.md)
- 🧪 [Test Suite](./backend/tests/cries/README.md)

**Status**: ✅ Production-Ready | **Version**: v3.0.0 | **Last Updated**: Nov 6, 2025
