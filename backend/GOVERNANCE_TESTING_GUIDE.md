# Governance Optimization Testing

## Quick Start

```bash
# Install Playwright if needed
npm install --save-dev @playwright/test

# Run quick validation (current governance only)
npx playwright test tests/governance-optimizer.test.js --grep "Quick Validation"

# Run full optimization suite (all variations)
npx playwright test tests/governance-optimizer.test.js --grep "Governance Optimization"
```

## Current Status

**Active Governance:** V2 (Reasoning-First)  
**Performance:** Ω +8.9% (C: -1.8%, R: +4.9%, I: +10.5%, E: +25%, S: +3.8%)

## Lessons Learned

### V1 → V2 (Success)
- **Change:** Removed mandatory 3-layer structure, added reasoning principles
- **Result:** Ω +8.9% (from +1.8%)
- **Key insight:** Structure mandates suppress reasoning depth

### V2 → V3 (Failure)
- **Change:** Added "narrative integration" warnings about example overload
- **Result:** Ω -8.2% (back to baseline)
- **Key insight:** Coherence warnings made Opus too cautious, reduced depth across all pillars

### Critical Finding
**Don't optimize for perceived problems without validation.**  
V2's "coherence issue" (-1.8%) was actually a **beneficial trade-off** for massive gains elsewhere (+25% Empathy, +10.5% Integration). The coherence guidance backfired by making Opus self-censor.

## Testing Strategy

The automated test suite will:

1. **Establish baselines** - Run multiple prompts ungoverned to get stable baselines
2. **Test variations systematically** - Apply different governance parameters
3. **Measure across dimensions** - Track all CRIES pillars, not just Omega
4. **Identify patterns** - Find which parameters improve which pillars
5. **Validate robustness** - Ensure improvements generalize across prompt types

## Governance Variations to Test

### Batch 1: Example Density Control
- V2 baseline (no guidance)
- V2 + "use 2-3 strong examples" (gentle guidance)
- V2 + "prioritize depth over breadth of examples" (indirect)

### Batch 2: Flow Optimization
- V2 baseline
- V2 + "ensure transitions between sections" (no warnings)
- V2 + "build cumulative argument" (structural hint)

### Batch 3: Depth vs Breadth Trade-offs
- V2 baseline
- V2 + stronger "DEPTH OVER BREADTH" emphasis
- V2 + "explore 2-3 points deeply rather than 5+ superficially"

### Batch 4: Coherence Experiments
- V2 baseline (proven best)
- V2 + minimal coherence hint ("maintain logical flow")
- V2 + example integration (positive framing: "use examples to illustrate mechanisms")

## Expected Patterns

Based on v1/v2/v3 results:

1. **Prescriptive structure** → Strictness ↑, Rigor ↓ (bad trade-off)
2. **Warning-based guidance** → All pillars ↓ (makes model cautious)
3. **Positive principles** → Rigor ↑, Integration ↑, Empathy ↑ (good)
4. **Small coherence dips acceptable** if offset by other gains

## Target Configuration

**Goal:** Ω +12-15% with balanced pillar improvements

**Acceptable trade-offs:**
- Coherence -2% IF Rigor +8% and Integration +12%
- Strictness flat IF Rigor +10%

**Unacceptable:**
- Any change that reduces Rigor
- Omega improvements <5%
- Single pillar degradation >10%

## Running Tests

### Development Workflow
```bash
# 1. Make governance change
vim backend/governance/rosetta-frontier.txt

# 2. Quick validate on one prompt
npx playwright test --grep "Quick Validation"

# 3. If promising, test full suite
npx playwright test tests/governance-optimizer.test.js

# 4. Review report
cat backend/governance-optimization-report.json | jq
```

### CI Integration
```yaml
# Add to .github/workflows/governance-quality.yml
- name: Validate Governance Quality
  run: npx playwright test --grep "Quick Validation"
  
- name: Fail if Omega < +5%
  run: |
    OMEGA=$(jq '.improvements.Omega.percentage' test-results.json)
    if (( $(echo "$OMEGA < 5" | bc -l) )); then
      echo "Omega improvement $OMEGA% below threshold"
      exit 1
    fi
```

## Next Steps

1. **Immediate:** Confirm v2 restored with quick validation test
2. **Short-term:** Run full optimization suite to explore parameter space
3. **Medium-term:** Identify optimal configuration (target: Ω +12-15%)
4. **Long-term:** Automate governance testing in CI/CD pipeline

## Key Insight

> "Frontier models need optimization targets, not constraints. Warnings about what NOT to do reduce performance. Positive principles about what GOOD looks like improve it."

The v2→v3 failure proved this empirically. Now we systematically search for the optimal set of **positive principles** that maximize reasoning quality.
