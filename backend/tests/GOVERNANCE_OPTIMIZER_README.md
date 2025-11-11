# Governance Optimization Scripts

Two parallel Bayesian optimization systems for tuning governance parameters across different LLM providers.

## Overview

- **`governance-bayesian-optimizer.py`** - Anthropic (Claude Opus) optimizer
- **`governance-bayesian-optimizer-openai.py`** - OpenAI (GPT-4o-mini) optimizer
- **`governance-optimizer-v2.test.js`** - Anthropic test suite
- **`governance-optimizer-openai.test.js`** - OpenAI test suite

## Quick Start

### Anthropic Optimization (Claude Opus)

Requires Anthropic API credits.

```bash
# With warm-start (recommended for faster convergence)
python tests/governance-bayesian-optimizer.py --budget 50 --n-initial 8

# Without warm-start
python tests/governance-bayesian-optimizer.py --budget 50 --n-initial 8 --no-warm-start

# Custom initial samples
python tests/governance-bayesian-optimizer.py --budget 20 --n-initial 4
```

### OpenAI Optimization (GPT-4o-mini)

Recommended for budget-conscious optimization (~100x cheaper than Anthropic).

```bash
# With warm-start
python tests/governance-bayesian-optimizer-openai.py --budget 50 --n-initial 8

# Budget-friendly ($5 optimization)
python tests/governance-bayesian-optimizer-openai.py --budget 5 --n-initial 2

# Extended exploration
python tests/governance-bayesian-optimizer-openai.py --budget 100 --n-initial 20
```

## Architecture

### Multi-Fidelity Evaluation

Both optimizers use adaptive fidelity selection based on remaining budget:

**Anthropic Fidelity Costs:**
- Low: $0.02 (1 prompt, 1 trial)
- Medium: $0.08 (2 prompts, 2 trials)
- High: $0.24 (4 prompts, 3 trials)

**OpenAI Fidelity Costs:**
- Low: $0.001 (1 prompt, 1 trial)
- Medium: $0.004 (2 prompts, 2 trials)
- High: $0.012 (4 prompts, 3 trials)

### Optimization Process

1. **Warm Start Phase** (optional)
   - Evaluates 3 pre-tuned variants from v2.x
   - Bootstraps GP with known good configurations

2. **Random Exploration Phase**
   - Random samples from 5D parameter space
   - Builds initial training set for Gaussian Process

3. **Bayesian Optimization Loop**
   - GP predicts promise of untested configurations
   - Acquisition function balances exploration/exploitation
   - Iteratively evaluates most promising candidates

4. **Multi-Fidelity Adaptation**
   - Low-fidelity for random exploration
   - Medium-fidelity for promising mid-range candidates
   - High-fidelity for top-performing configurations

## Parameter Space

All optimizers tune 5 discrete parameters:

1. **depth** (0-2)
   - 0: "2–3 layers"
   - 1: "3–4 layers with causal links"
   - 2: "4–5 layers hierarchical reasoning"

2. **coherence** (0-2)
   - 0: "Clean bullet hierarchy"
   - 1: "Numbered reasoning trees"
   - 2: "Multi-layer outline (I → A → 1 → a)"

3. **strictness** (0-2)
   - 0: "Avoid speculation"
   - 1: "Ban ungrounded + uncertainty flags"
   - 2: "Require confidence + citations"

4. **example_count** (1-3)
   - Number of concrete examples required

5. **evidence_requirement** (0-2)
   - 0: "minimal"
   - 1: "moderate"
   - 2: "strict"

## Cost Comparison

For the same budget of $50:

**Anthropic:**
- High-fidelity evaluations: ~208 runs
- Time: ~100 hours
- Coverage: Full hyperparameter space exploration

**OpenAI:**
- High-fidelity evaluations: ~4,167 runs
- Time: ~2,000 hours (if run sequentially)
- Coverage: Much more extensive sampling

**Recommendation:** Use OpenAI for larger budgets ($20+) and Anthropic for smaller budgets (<$10) due to cost efficiency.

## Output

Both optimizers produce:

```
Best governance configuration achieves Ω = 0.8234
Ready to deploy as v3.0 governance variant
```

With detailed logs of:
- Each evaluation's score
- Pillar metrics (C, R, I, E, S)
- Token efficiency
- Budget tracking

## Troubleshooting

### "API credits exhausted"
- Anthropic: Add credits to your Anthropic account
- OpenAI: Add credits to your OpenAI account

### "Cannot find __BO_OUTPUT__ marker"
- Backend not running: Start `npm start` in backend/
- Test file not found: Check test file exists in backend/tests/
- Test failure: Check API keys are set correctly

### Timeout errors
- Increase budget (more fidelity options)
- Reduce --n-initial to test faster
- Check backend performance: `curl http://localhost:3001/health`

## Next Steps

After optimization completes:

1. Extract best parameters from output
2. Implement in `buildGovernanceFromTemplate()` function
3. Deploy as v3.0 governance variant
4. Run A/B tests against v2.x variants
5. Iterate with new budget cycle

## Files Modified

- `governance-bayesian-optimizer.py` - Anthropic optimizer (clarified naming)
- `governance-bayesian-optimizer-openai.py` - NEW: OpenAI optimizer
- `governance-optimizer-v2.test.js` - Anthropic test (unchanged)
- `governance-optimizer-openai.test.js` - NEW: OpenAI test

## Author

AuditaAI Research Team (2025-11-08)
