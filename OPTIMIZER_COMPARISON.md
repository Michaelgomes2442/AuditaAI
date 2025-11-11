# Anthropic vs OpenAI Optimizer Comparison

## Quick Reference

| Aspect | Anthropic | OpenAI |
|--------|-----------|--------|
| **Model** | Claude Opus 4.1 | GPT-4o-mini |
| **Cost/eval (low)** | $0.02 | $0.001 |
| **Cost Factor** | 1x (baseline) | **0.05x** (20x cheaper) |
| **$50 Budget** | ~208 evals | ~5,000 evals |
| **Eval Time** | 30-60s | 15-30s |
| **Quality** | Excellent reasoning | Very good reasoning |
| **Use Case** | Production validation | Extensive exploration |

## When to Use Each

### Use Anthropic When:
- ✅ Budget is limited ($5-10)
- ✅ Quality is paramount
- ✅ You want proven Claude integration
- ✅ Running final validation
- ✅ Need best reasoning capability

### Use OpenAI When:
- ✅ Budget is substantial ($20+)
- ✅ Want extensive hyperparameter exploration
- ✅ Can leverage cost savings
- ✅ Parallel evaluation is viable
- ✅ Speed is important

## Test Suite Equivalence

Both test suites implement identical statistical methodology:

### Methodology
```
For each evaluation parameter set:
  1. Run N trials (1-3 depending on fidelity)
  2. For each trial:
     - Call standard LLM (no governance)
     - Call governed LLM (with Rosetta)
     - Measure CRIES: C, R, I, E, S, Omega
  3. Aggregate across trials:
     - Compute mean and std dev
     - Calculate coefficient of variation
     - Run paired t-test for significance
  4. Report composite score:
     - Omega - (CV * penalty) - pillar floor penalties
```

### Metrics Tracked
- Omega (overall composite score)
- 5 Pillar scores: C, R, I, E, S
- Coefficient of variation (volatility)
- Token usage and cost
- Statistical significance (p-value)

## File Organization

### Anthropic (Claude Opus)
```
governance-bayesian-optimizer.py
    └─ calls
    └─ tests/governance-optimizer-v2.test.js
        └─ uses models
        ├─ claude-opus-4-1-20250805 (standard)
        └─ claude-opus-4-1-20250805-rosetta (governed)
```

### OpenAI (GPT-4o-mini)
```
governance-bayesian-optimizer-openai.py
    └─ calls
    └─ tests/governance-optimizer-openai.test.js
        └─ uses models
        ├─ gpt-4o-mini (standard)
        └─ gpt-4o-mini-rosetta (governed)
```

## Cost Breakdown Example

### For $50 Budget

**Anthropic:**
- 208 low-fidelity evaluations max
- Warm-start (3 evals): $0.06
- Random exploration (8 evals): $0.16
- BO loop (197 evals): $49.78
- **Total sequences**: ~10 BO iterations

**OpenAI:**
- 5,000 low-fidelity evaluations max
- Warm-start (3 evals): $0.003
- Random exploration (8 evals): $0.008
- BO loop (4,989 evals): $49.89
- **Total sequences**: ~250 BO iterations

## Parameter Space (Identical)

Both explore the same 5D discrete space:

1. **depth_level** (0-2): 3 values
   - Shallow (2-3 layers)
   - Medium (3-4 layers with causal)
   - Deep (4-5 layers hierarchical)

2. **coherence_style** (0-2): 3 values
   - Simple (bullets)
   - Structured (numbered)
   - Complex (nested outline)

3. **strictness_level** (0-2): 3 values
   - Permissive (avoid speculation)
   - Moderate (ban ungrounded)
   - Strict (require confidence + citations)

4. **example_count** (1-3): 3 values
   - 1 example
   - 2 examples
   - 3 examples

5. **evidence_requirement** (0-2): 3 values
   - Minimal
   - Moderate
   - Strict

**Total search space**: 3^4 × 3 = 243 possible configurations

## Running Both Sequentially

If you want to compare results:

```bash
# Run Anthropic optimization
./run-optimizer.sh --model anthropic --budget 10 --n-initial 3

# Save results, then run OpenAI
./run-optimizer.sh --model openai --budget 10 --n-initial 3

# Compare best governance parameters from each
```

## Bayesian Optimization Details

### Gaussian Process Configuration

Both use identical GP tuning:
```python
kernel = ConstantKernel(1.0) * Matern(length_scale=1.0, nu=2.5)
gp = GaussianProcessRegressor(
    kernel=kernel,
    n_restarts_optimizer=10,
    alpha=0.01,  # Noise variance from empirical CV data
    normalize_y=True
)
```

### Acquisition Function

Both maximize Expected Improvement:
```
EI(x) = E[max(0, f(x) - f_best))]
      = μ(x) - f_best + σ(x) × Φ(Z) + Φ(Z) × pdf(Z)
```

where Z = (f_best - μ(x)) / σ(x)

### Fidelity-Aware Multi-Fidelity

```
remaining_budget = budget - spent

if remaining_budget < low_threshold:
    fidelity = 'low'
elif remaining_budget < medium_threshold:
    fidelity = 'medium'
else:
    fidelity = 'high'
```

## Output Format (Identical)

Both produce structured JSON output:

```json
{
  "model": "claude-opus-4-1 or gpt-4o-mini",
  "fidelity": "low|medium|high",
  "omegaStats": {
    "mean": 0.7234,
    "improvement": 0.0234,
    "improvementPct": "3.3%",
    "coefficientOfVariation": "12.5"
  },
  "pillarStats": {
    "C": { "mean": 0.72, "std": 0.08 },
    "R": { "mean": 0.75, "std": 0.06 },
    "I": { "mean": 0.71, "std": 0.09 },
    "E": { "mean": 0.68, "std": 0.10 },
    "S": { "mean": 0.74, "std": 0.07 }
  },
  "costMetrics": {
    "totalCost": 0.02,
    "costPerTrial": 0.02,
    "tokenEfficency": 36.17
  }
}
```

## Switching Between Providers

### If Anthropic API has credits:
```bash
./run-optimizer.sh --model anthropic --budget 50
```

### If Anthropic API is out of credits:
```bash
./run-optimizer.sh --model openai --budget 50
```

The optimization quality will be nearly identical due to identical methodology, just with different cost/speed tradeoffs.

## Deployment After Optimization

Both produce the same parameter format for deployment:

```javascript
// governance-bayesian-optimizer.py outputs:
{
  "depth": 1,
  "coherence": 2,
  "strictness": 1,
  "example_count": 2,
  "evidence_requirement": 2
}

// governance-bayesian-optimizer-openai.py outputs:
{
  "depth": 1,
  "coherence": 2,
  "strictness": 1,
  "example_count": 2,
  "evidence_requirement": 2
}

// Both can be deployed identically to buildGovernanceFromTemplate()
```

---

**Summary**: Use both optimizers interchangeably. Choose based on budget and API credit availability.
