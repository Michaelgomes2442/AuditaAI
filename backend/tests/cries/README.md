# CRIES v3 Test Suite

Comprehensive test coverage for the CRIES v3 hybrid governance evaluation engine.

## 🧪 Test Organization

### 1. **determinism.test.js** - Reproducibility Tests
Validates that CRIES v3 produces identical outputs for identical inputs.

**Test Cases:**
- ✅ Same inputs + seed → byte-for-byte identical outputs
- ✅ Different seeds → different scores (but same hash)
- ✅ Input hash consistency across runs
- ✅ Hash changes when inputs change
- ✅ Sub-metric evidence is deterministic
- ✅ Governance mode doesn't affect determinism
- ✅ No timestamp leakage in scoring
- ✅ Edge cases: empty response, long response, unicode

**Why Critical:**
- Receipt verification depends on determinism
- Re-run feature requires exact reproducibility
- Audit trails need stable hashing

---

### 2. **governance.test.js** - Governance Weight Tests
Validates that different governance modes produce appropriate score adjustments.

**Test Cases:**
- ✅ Default mode uses equal weights (0.2 each)
- ✅ Regulatory-audit boosts R + S pillars
- ✅ Creative-assistant boosts C + E pillars
- ✅ Safety-critical boosts S pillar significantly
- ✅ All modes sum to 1.0
- ✅ Weighted average calculation is correct
- ✅ Calculation details explain weighting
- ✅ Response scenarios benefit from appropriate modes
- ✅ Custom weights can be provided

**Why Critical:**
- Governance modes are core differentiator
- Enterprise customers need regulatory-audit mode
- Weight miscalculation breaks CRIES scoring

---

### 3. **semantics.test.js** - Semantic Detection Tests
Validates that embedding-based detectors improve upon heuristics.

**Test Cases:**
- ✅ Contradictory responses score ≥0.2 lower on C
- ✅ Semantic contradictions detected via embeddings
- ✅ Negation pairs detected (yes/no, true/false)
- ✅ Hybrid scoring blends semantic + heuristic
- ✅ Logical connectors improve flow score
- ✅ Adjacent sentence similarity computed
- ✅ Positive/negative/neutral tone alignment
- ✅ Claims with evidence score higher on R
- ✅ Citation quality weighting (academic > named > verbal)
- ✅ Policy context improves violation detection
- ✅ Safety violations properly flagged
- ✅ Narrative stability variance penalty

**Why Critical:**
- Semantic detectors are v3's main upgrade
- Hybrid scoring needs validation
- Enterprise audits require evidence trails

---

## 🚀 Running Tests

### Run All Tests
```bash
cd backend
npm test tests/cries/
```

### Run Specific Suite
```bash
npm test tests/cries/determinism.test.js
npm test tests/cries/governance.test.js
npm test tests/cries/semantics.test.js
```

### Run with Coverage
```bash
npm test -- --coverage tests/cries/
```

### Run Test Runner Script
```bash
node tests/cries/run-tests.js
```

---

## 📊 Expected Output

```
🧪 CRIES v3 Test Suite

============================================================

📋 Running determinism tests...
------------------------------------------------------------
✓ produces identical output for same inputs and seed (245ms)
✓ different seeds produce different results (198ms)
✓ input hash is consistent (156ms)
✓ changing input changes hash (134ms)
✓ sub-metric evidence is deterministic (178ms)
✓ governance mode does not affect determinism (201ms)
✓ no timestamp leakage (312ms)
✓ empty response is deterministic (89ms)
✓ very long response sampling is deterministic (456ms)
✓ unicode and special characters are deterministic (112ms)

📋 Running governance tests...
------------------------------------------------------------
✓ default mode uses equal weights (123ms)
✓ regulatory-audit mode boosts R and S (145ms)
✓ creative-assistant mode boosts C and E (134ms)
✓ safety-critical mode boosts S significantly (128ms)
✓ all governance modes sum to 1.0 (567ms)
✓ weighted average calculation is correct (119ms)
✓ calculation_details explain weighting (98ms)
✓ high-strictness response scores better in safety-critical mode (178ms)
✓ rigorous response scores better in audit mode (189ms)
✓ creative response scores better in creative mode (156ms)

📋 Running semantics tests...
------------------------------------------------------------
✓ contradictory response scores lower on C than consistent (234ms)
✓ semantic contradictions are detected (167ms)
✓ negation pairs detected (145ms)
✓ hybrid scoring blends semantic + heuristic (156ms)
✓ response with connectors scores higher on flow (189ms)
✓ adjacent sentence similarity computed (123ms)
✓ positive prompt + positive response = high tone alignment (145ms)
✓ neutral prompt + neutral response = aligned (134ms)
✓ positive prompt + negative response = misaligned (156ms)
✓ claims with evidence score higher on R (178ms)
✓ source attribution quality weighted (145ms)
✓ policy context improves alignment detection (189ms)
✓ safety violations detected (134ms)
✓ stable narrative scores higher (201ms)
✓ variance penalty applied correctly (123ms)

============================================================
📊 Test Summary

  ✅ PASSED determinism
    Tests: 10
  ✅ PASSED governance
    Tests: 10
  ✅ PASSED semantics
    Tests: 15

============================================================
Total: 35/35 tests passed

✅ All tests passed!

🎉 CRIES v3 is production-ready!
```

---

## 🔧 Test Configuration

### Jest Config (backend/jest.config.js)

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/cries/**/*.js',
    '!src/cries/v2_legacy/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  verbose: true
};
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:cries": "jest tests/cries/",
    "test:determinism": "jest tests/cries/determinism.test.js",
    "test:governance": "jest tests/cries/governance.test.js",
    "test:semantics": "jest tests/cries/semantics.test.js",
    "test:watch": "jest --watch tests/cries/",
    "test:coverage": "jest --coverage tests/cries/"
  }
}
```

---

## 🐛 Debugging Tests

### Enable Verbose Logging
```javascript
// In test file
const { computeCRIESv3 } = require('../../src/cries/compute-cries.js');

test('debug test', async () => {
  const result = await computeCRIESv3({
    // ... args
  });
  
  console.log('Full result:', JSON.stringify(result, null, 2));
  console.log('Evidence:', result.evidence);
});
```

### Isolate Specific Test
```bash
npm test -- -t "contradictory response scores lower"
```

### Run with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest tests/cries/determinism.test.js
```

---

## 📝 Writing New Tests

### Test Template

```javascript
const { computeCRIESv3 } = require('../../src/cries/compute-cries.js');
const { LocalEmbeddingAdapter } = require('../../src/cries/embeddings/adapter.js');

describe('CRIES v3 - My Feature', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  const seed = 1337;
  
  test('my test case', async () => {
    const result = await computeCRIESv3({
      prompt: "Test prompt",
      response: "Test response",
      seed,
      embedding
    });
    
    expect(result.cries_score).toBeGreaterThan(0.5);
    
    console.log('✓ Test passed');
    console.log(`  Score: ${result.cries_score.toFixed(4)}`);
  });
});
```

### Golden Test Pattern

```javascript
test('golden test - regulatory audit response', async () => {
  const result = await computeCRIESv3({
    prompt: "Explain GDPR Article 6",
    response: "Article 6 of GDPR establishes six lawful bases...",
    governanceMode: 'regulatory-audit',
    seed: 1337,
    embedding
  });
  
  // Store expected scores
  const expected = {
    C: 0.8234,
    R: 0.9156,
    I: 0.8523,
    E: 0.7891,
    S: 0.8667,
    cries_score: 0.8562
  };
  
  // Allow 0.001 tolerance for floating point
  Object.keys(expected).forEach(key => {
    expect(Math.abs(result[key] - expected[key])).toBeLessThan(0.001);
  });
});
```

---

## 🎯 Coverage Goals

| Module | Target | Current | Status |
|--------|--------|---------|--------|
| compute-cries.js | 95% | - | ⏳ |
| detectors/*.js | 90% | - | ⏳ |
| embeddings/adapter.js | 85% | - | ⏳ |
| baselines/baselines.js | 85% | - | ⏳ |
| utils/determinism.js | 95% | - | ⏳ |
| **Overall** | **90%** | - | ⏳ |

---

## 🚨 Critical Test Scenarios

### Must Pass Before Production

1. **Determinism**: 100% of re-runs must be byte-identical
2. **Governance Weights**: All 6 modes must sum to 1.0
3. **Semantic Sensitivity**: Contradictions must score ≥0.2 lower
4. **No Crashes**: All edge cases (empty, long, unicode) must pass
5. **Evidence Trails**: All 20 sub-metrics must have evidence objects

### Nice to Have

- [ ] Performance benchmarks (<200ms per evaluation)
- [ ] Memory leak tests (1000+ sequential evaluations)
- [ ] Concurrent evaluation tests (10+ parallel calls)
- [ ] Integration tests with real LLM responses
- [ ] Load tests (100+ req/sec)

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [CRIES v3 Implementation Guide](../../CRIES_V3_COMPLETE.md)
- [Migration Guide](../../backend/CRIES_V3_MIGRATION_GUIDE.md)
- [CRIES v3 Specification](../../CRIES_V3_SPEC.md) *(user-provided)*

---

## 🤝 Contributing Tests

When adding new features to CRIES v3:

1. **Write test first** (TDD approach)
2. **Test determinism** (same inputs → same outputs)
3. **Test governance weights** (if weights change)
4. **Test semantic behavior** (if embeddings used)
5. **Add golden test** (expected scores for known inputs)
6. **Update this README** (add test case to list)

**Test Quality Checklist:**
- [ ] Tests are deterministic (no `Math.random()`, `Date.now()`)
- [ ] Tests use `seed: 1337` for consistency
- [ ] Tests have descriptive names
- [ ] Tests log results with `console.log('✓ ...')`
- [ ] Tests use `expect()` assertions
- [ ] Tests have comments explaining "why"

---

**Last Updated**: November 6, 2025  
**Test Suite Version**: v3.0.0  
**Total Tests**: 35+ (determinism: 10, governance: 10, semantics: 15)
