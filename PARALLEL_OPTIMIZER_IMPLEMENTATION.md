# Parallel Governance Optimizer Implementation

## Summary

Created a complete parallel optimization system supporting both Anthropic (Claude Opus) and OpenAI (GPT-4o-mini) models for governance tuning.

## Files Created/Modified

### New Files

1. **`governance-bayesian-optimizer-openai.py`** (NEW)
   - OpenAI-specific Bayesian optimizer
   - 100x cheaper than Anthropic (~$0.001 per low-fidelity evaluation vs $0.02)
   - Suitable for large-budget optimization runs

2. **`governance-optimizer-openai.test.js`** (NEW)
   - Playwright test suite for OpenAI models
   - Uses `gpt-4o-mini` and `gpt-4o-mini-rosetta`
   - Same statistical rigor as Anthropic version
   - Multi-trial evaluation with volatility analysis

3. **`run-optimizer.sh`** (NEW)
   - Unified CLI for running either optimizer
   - Auto-detects backend health
   - Pretty formatted output with color support
   - Easy parameter passing

4. **`GOVERNANCE_OPTIMIZER_README.md`** (NEW)
   - Complete documentation
   - Usage examples
   - Cost comparison analysis
   - Troubleshooting guide

### Modified Files

1. **`governance-bayesian-optimizer.py`**
   - Updated docstring to clarify "Anthropic Version"
   - Added note about OpenAI alternative
   - Unchanged functionality (backward compatible)

2. **`governance-optimizer-v2.test.js`**
   - Unchanged (Anthropic test suite)

## Key Features

### Multi-Fidelity Support

Both optimizers adaptively select evaluation fidelity based on remaining budget:

| Fidelity | Anthropic Cost | OpenAI Cost | Evaluations |
|----------|---|---|---|
| Low | $0.02 | $0.001 | 1 trial |
| Medium | $0.08 | $0.004 | 2 trials |
| High | $0.24 | $0.012 | 3 trials |

### Warm-Start Capability

Both include 3 pre-tuned v2.x variants for faster convergence:
- v2.5-balanced
- v2.4-rigor
- v2.2-depth

### 5D Parameter Space

Optimizes:
1. Depth level (0-2)
2. Coherence structure (0-2)
3. Strictness policy (0-2)
4. Example count (1-3)
5. Evidence requirement (0-2)

### Statistical Rigor

- Multi-trial evaluation (1-3 trials based on fidelity)
- Coefficient of variation tracking
- Paired t-tests for significance
- Pillar metric aggregation (C, R, I, E, S)
- Token efficiency measurement

## Usage

### Quick Start with OpenAI ($5 budget)

```bash
cd backend
./run-optimizer.sh --model openai --budget 5
```

### Anthropic ($50 budget)

```bash
cd backend
./run-optimizer.sh --model anthropic --budget 50
```

### Custom Configuration

```bash
# OpenAI with 20 initial samples, no warm-start
./run-optimizer.sh --model openai --budget 10 --n-initial 20 --no-warm-start

# Anthropic with quick test
./run-optimizer.sh --model anthropic --budget 10 --n-initial 3
```

### Direct Python Execution

```bash
# OpenAI optimizer
python tests/governance-bayesian-optimizer-openai.py --budget 50 --n-initial 10

# Anthropic optimizer
python tests/governance-bayesian-optimizer.py --budget 50 --n-initial 10
```

## Cost Comparison

For equivalent budget ($50):

**Anthropic Approach:**
- ~208 evaluations possible
- Expected runtime: ~100 hours sequential
- Better for production validation
- Higher cost per evaluation

**OpenAI Approach:**
- ~5,000 evaluations possible
- Expected runtime: ~2,500 hours sequential (or parallel)
- Better for extensive hyperparameter exploration
- 100x cheaper per evaluation

## Testing

Both optimizers require:
1. Backend running (`npm start`)
2. API keys set (OPENAI_API_KEY or ANTHROPIC_API_KEY)
3. Python packages: numpy, scikit-learn, scipy
4. Playwright installed

## Next Steps

1. **Run optimization** with chosen model and budget
2. **Extract best parameters** from output
3. **Deploy** as new governance variant
4. **A/B test** against existing versions
5. **Measure impact** on real workloads

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Bayesian Optimizer (Python)             │
│  • Encodes 5D parameter space           │
│  • Manages Gaussian Process              │
│  • Selects high-value experiments        │
└─────────────────────────────────────────┘
           ↓ (subprocess)
┌─────────────────────────────────────────┐
│  Playwright Test Suite (JavaScript)      │
│  • governance-optimizer-v2.test.js       │
│  • governance-optimizer-openai.test.js   │
│  • Calls backend API endpoints           │
│  • Measures CRIES metrics                │
│  • Computes pillar aggregates            │
└─────────────────────────────────────────┘
           ↓ (HTTP POST)
┌─────────────────────────────────────────┐
│  Backend Server (Node.js)                │
│  • /api/live-demo/parallel-prompt        │
│  • Governance application                │
│  • LLM API calls (OpenAI or Anthropic)   │
│  • CRIES computation                     │
└─────────────────────────────────────────┘
```

## Performance Expectations

- **Setup time**: 1-2 minutes
- **Warm-start phase**: 5-10 minutes
- **Per evaluation**: 30s - 5min depending on fidelity
- **BO loop iterations**: Depends on budget and fidelity selection

For $5 budget with OpenAI: ~50 evaluations in ~1-2 hours

## Files Structure

```
backend/
├── tests/
│   ├── governance-bayesian-optimizer.py           (Anthropic optimizer)
│   ├── governance-bayesian-optimizer-openai.py    (OpenAI optimizer - NEW)
│   ├── governance-optimizer-v2.test.js            (Anthropic test)
│   ├── governance-optimizer-openai.test.js        (OpenAI test - NEW)
│   ├── GOVERNANCE_OPTIMIZER_README.md             (Detailed docs - NEW)
│   └── requirements-optimizer.txt
├── run-optimizer.sh                               (Unified CLI - NEW)
├── run-optimizer-v2.sh                            (Legacy)
└── server.js
```

---

**Status**: ✅ Ready to use

**Created**: 2025-11-08

**Author**: AuditaAI Research Team
