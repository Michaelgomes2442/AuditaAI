# Quick Reference: Statistical Improvements 🎯

## New Output Fields

### Significance Object
```javascript
{
  t: 4.52,              // t-statistic (unchanged)
  p: 0.0110,            // TRUE p-value (was: pApprox with e^{-|t|})
  significant: true,    // p < 0.05
  dz: 1.23,             // ✨ NEW: Cohen's dz (paired effect size)
  hedges_g: 1.18,       // ✨ NEW: Bias-corrected effect size
  ci: [0.023, 0.057]    // ✨ NEW: Bootstrap 95% CI for ΔΩ
}
```

### Cost Metrics
```javascript
{
  totalCost: 2.45,
  avgCost: 0.082,
  avgOutputTokens: 6834,
  p95OutputTokens: 7623,  // ✨ NEW: 95th percentile (robust)
  maxOutputTokens: 7891,
  hasTokenPressure: true
}
```

### FDR Correction (Per-Prompt)
```javascript
{
  ...promptResults,
  fdr: 0.082,              // ✨ NEW: FDR-adjusted p-value
  fdrSignificant: true     // ✨ NEW: FDR < 0.1 (survives correction)
}
```

### Variation Results
```javascript
{
  ...variationResults,
  significance: { t, p, dz, hedges_g, ci },  // ✨ Enhanced
  earlyStop: true,
  earlyStopReason: 'SPRT_lose'  // ✨ NEW: Can be SPRT_lose, CV > 35%, Penalty > 40%
}
```

---

## Console Output Examples

### Before
```
Significance: t=4.52, p≈0.0110 ✅ Significant
⚠️ Token Pressure: Avg 6834 tokens (max 7891)
```

### After
```
Significance: t=4.52, p=0.0110, dz=1.23 ✅ Significant
⚠️ Token Pressure: Avg 6834 tokens, p95 7623, max 7891
```

---

## Markdown Report Examples

### Before
```markdown
| Statistical Significance | t=4.52, p≈0.0110 ✅ Significant |
```

### After
```markdown
| Significance | t=4.52, p=0.0110, dz=1.23 ✅ Significant |
| Effect Size (Hedges' g) | 1.18 |
| Bootstrap 95% CI (ΔΩ) | [0.0234, 0.0567] |
```

---

## Artifact Files

### JSON (Unchanged)
```
governance-optimization-checkpoint-2025-11-08T14-30-52-123Z.json
```

### JSONL (NEW) ✨
```
governance-optimization-checkpoint-2025-11-08T14-30-52-123Z.jsonl
```

**Format**: One trial per line
```json
{"variation":"v2.5-balanced","file":"rosetta-frontier-v2.5-balanced.txt","prompt":"executive-ai-risk","trial":1,"ungoverned":{"C":0.56,"R":0.35,...},"governed":{"C":0.68,"R":0.42,...},"tokens":{"input":1234,"output":5678},"cost_governed":0.082,"cost_ungov":0.078,"latency":4523}
{"variation":"v2.5-balanced","file":"rosetta-frontier-v2.5-balanced.txt","prompt":"executive-ai-risk","trial":2,...}
```

**Usage**:
```bash
# Count trials per variation
cat *.jsonl | jq -r .variation | sort | uniq -c

# Extract all Omega improvements
cat *.jsonl | jq '[(.governed.overall - .ungoverned.overall) / .ungoverned.overall * 100]'

# Find expensive trials
cat *.jsonl | jq 'select(.cost_governed > 0.1) | {variation, cost_governed}'
```

---

## Budget Tracking Changes

### Before
```javascript
runningBudget += result.governed.cost;  // Only tracked governed
```

### After ✅
```javascript
runningBudget += (result.governed.cost + result.ungoverned.cost);  // Both paths
```

**Impact**: Budget estimates now 2x more accurate

---

## Statistical Formulas

### Cohen's dz (Paired)
```
dz = mean(differences) / sd(differences)
```

- Small: |dz| < 0.5
- Medium: 0.5 ≤ |dz| < 0.8
- Large: |dz| ≥ 0.8

### Hedges' g (Bias-Corrected)
```
J = 1 - 3/(4df - 1)
hedges_g = dz × J
```

Corrects upward bias in Cohen's dz for small samples (n < 20)

### Benjamini-Hochberg FDR
```
For p-values p₁ ≤ p₂ ≤ ... ≤ pₘ:
  FDR(pᵢ) = min(1, pᵢ × m / rank(pᵢ))
```

Controls false discovery rate at α = 0.1 (10% false positives among discoveries)

### Bootstrap CI (Percentile)
```
1. Resample differences with replacement (B=2000 times)
2. Compute mean for each resample
3. CI = [2.5th percentile, 97.5th percentile]
```

Non-parametric, works with any distribution

### SPRT Early-Stop
```
IF mean(ΔΩ%) < 3% AND upper_CI(ΔΩ%) < 5% THEN stop
```

Catches variants that cannot achieve target improvement even in best case

---

## Interpretation Guide

### p-value
- **p < 0.001**: Extremely strong evidence
- **p < 0.01**: Very strong evidence
- **p < 0.05**: Strong evidence (standard threshold)
- **p < 0.10**: Weak evidence
- **p ≥ 0.10**: Insufficient evidence

### Effect Size (dz)
- **|dz| < 0.2**: Negligible
- **0.2 ≤ |dz| < 0.5**: Small
- **0.5 ≤ |dz| < 0.8**: Medium
- **|dz| ≥ 0.8**: Large
- **|dz| ≥ 1.2**: Very large

### FDR
- **FDR < 0.05**: Survives strict correction (5% FDR)
- **FDR < 0.10**: Survives lenient correction (10% FDR)
- **FDR ≥ 0.10**: May be false positive

### Token Pressure
- **p95 < 0.8 × limit**: Safe
- **p95 < 0.9 × limit**: Monitor
- **p95 ≥ 0.9 × limit**: ⚠️ Clipping risk

### Composite Score
```
score = Ω × (1 - penalty) + bonus
```

- **penalty**: Weighted combination of CV, Security floor, Integrity floor (0-1)
- **bonus**: Effect size reward (0-0.1)
- Higher score = better production-readiness

---

## Common Scenarios

### Scenario 1: Significant but Small Effect
```
p=0.003, dz=0.3, CI=[0.01, 0.03]
```
**Interpretation**: Real improvement but too small for production. Need larger effect.

### Scenario 2: Large Effect but Not Significant
```
p=0.15, dz=0.9, CI=[-0.02, 0.08]
```
**Interpretation**: Promising but underpowered. Need more trials (increase NUM_TRIALS).

### Scenario 3: Winner!
```
p=0.008, dz=1.2, FDR=0.06, CI=[0.03, 0.08]
```
**Interpretation**: ✅ Deploy! Strong, consistent, significant improvement.

### Scenario 4: SPRT Early-Stop
```
mean=2.3%, upperCI=4.8%, CV=8%
```
**Interpretation**: Upper bound can't reach 5% target. Stop now, save credits.

---

## Troubleshooting

### Issue: "p-value is NaN"
**Cause**: Insufficient trials or zero variance  
**Fix**: Ensure n ≥ 2 and trials have different outcomes

### Issue: "dz is extremely high (>5)"
**Cause**: Very small sd(differences)  
**Fix**: Check if baseline and treated are truly different distributions

### Issue: "FDR = 1 for all prompts"
**Cause**: All p-values > 0.05  
**Fix**: None of the improvements are significant. Re-evaluate governance changes.

### Issue: "Bootstrap CI is very wide"
**Cause**: High variance or small n  
**Fix**: Increase NUM_TRIALS to 5 or more

### Issue: "SPRT stops too aggressively"
**Cause**: Thresholds may be too strict  
**Fix**: Adjust in code: `mean < 3 && upperCI < 5` → `mean < 2 && upperCI < 4`

---

## Command-Line Quick Reference

```bash
# Run with enhanced stats
cd backend/tests
npx playwright test governance-optimizer-v2.test.js --grep "Quick Validation"

# Check for JSONL output
ls -lh ../governance-optimization-checkpoint-*.jsonl

# Parse JSONL for specific variation
cat ../governance-optimization-checkpoint-*.jsonl | jq 'select(.variation=="v2.5-balanced")'

# Count significant prompts with FDR < 0.1
# (requires parsing JSON checkpoint, not JSONL)
cat ../governance-optimization-checkpoint-*.json | jq '[.results[].prompts[] | select(.fdrSignificant==true)] | length'
```

---

## See Also

- `STATISTICAL_IMPROVEMENTS.md` - Detailed implementation notes
- `BAYESIAN_OPTIMIZER_GUIDE.md` - Advanced optimization with BO
- `governance-optimizer-v2.test.js` - Full source code

---

**Last Updated**: 2025-11-08  
**Version**: 2.1.0
