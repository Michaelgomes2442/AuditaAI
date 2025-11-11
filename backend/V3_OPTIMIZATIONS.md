# V3 Credit-Saving Optimizations

## Problem
V3 initial test consumed ~$1.44 for only 1 successful iteration (36 API calls). At this rate:
- 20 iterations = ~$28.80 (wasteful)
- Many candidates evaluated show no improvement
- Thompson Sampling explores too much in early iterations

## Solution: 4 Credit-Saving Mechanisms

### 1. **Early Stopping via Minimum Delta** (`minDelta: 0.05`)
**Problem**: Evaluating candidates that differ by <5% from current best wastes credits.

**Solution**: Skip evaluation if L2 distance from best vector < 0.05.

**Savings**: ~30-40% of candidates skipped in exploitation phase.

**Example**:
```
Candidate L2=0.03 from best → SKIP (too similar)
Candidate L2=0.12 from best → EVALUATE
```

### 2. **UCB Instead of Thompson Sampling** (`useUCB: true`)
**Problem**: Thompson Sampling explores aggressively (high variance samples).

**Solution**: UCB (Upper Confidence Bound) balances exploration/exploitation:
```typescript
UCB = mean + 2.0 * sqrt(log(t) / n)
```
- Exploit high-reward regions more
- Explore only when uncertainty is high
- Lower exploration constant (c=2.0) vs Thompson's unconstrained sampling

**Savings**: ~20-30% fewer dead-end candidates.

**Comparison**:
- Thompson: Samples from full posterior → explores broadly
- UCB: Exploits mean + small confidence bonus → focused search

### 3. **Adaptive Trials** (`adaptiveTrials: true`)
**Problem**: Every evaluation uses 3 trials (3 API calls per prompt) even when confidence is low.

**Solution**: Reduce trials when uncertainty is high:
```typescript
if (avg_variance > 0.1) {
  trials = 1  // Single trial for exploratory candidates
} else {
  trials = 3  // Full averaging for promising regions
}
```

**Savings**: 67% credit reduction for early/exploratory iterations.

**Example**:
```
Iteration 1-5 (high σ²): 1 trial/prompt = 5 API calls
Iteration 15-20 (low σ²): 3 trials/prompt = 15 API calls
```

### 4. **Diversity Filtering** (`diversityThreshold: 0.1`)
**Problem**: UCB/Thompson may propose similar candidates repeatedly.

**Solution**: Track last 5 candidates, skip if L2 distance < 0.1 from any.

**Savings**: ~10-15% duplicate/near-duplicate candidates eliminated.

**Example**:
```
Recent candidates: [v1, v2, v3, v4, v5]
New candidate v6: min(L2(v6, v1..v5)) = 0.08 → SKIP (too similar)
```

## Expected Credit Savings

### Before Optimizations (V3 baseline)
- 20 iterations × 5 prompts × 2 modes × 3 trials = **600 API calls**
- Cost: ~$24.00 @ $0.04/call

### After Optimizations (V3 optimized)
- Iterations evaluated: ~14 (30% skipped by delta/diversity)
- Adaptive trials: ~1.5 avg (50% reduction)
- Effective calls: 14 × 5 × 2 × 1.5 = **210 API calls**
- Cost: ~$8.40 @ $0.04/call

**Total Savings: 65% ($15.60 per 20-iteration run)**

## Configuration

Default settings (aggressive credit-saving):
```typescript
{
  minDelta: 0.05,           // Skip if <5% change
  useUCB: true,             // Exploit more, explore less
  adaptiveTrials: true,     // 1 trial if σ² > 0.1
  diversityThreshold: 0.1   // Skip if too similar
}
```

For faster convergence (more credits):
```typescript
{
  minDelta: 0.02,           // Allow smaller changes
  useUCB: false,            // Thompson Sampling (more exploration)
  adaptiveTrials: false,    // Always 3 trials
  diversityThreshold: 0.05  // Stricter diversity
}
```

For maximum credit savings (slower):
```typescript
{
  minDelta: 0.10,           // Skip if <10% change
  useUCB: true,             // UCB
  adaptiveTrials: true,     // 1 trial if uncertain
  diversityThreshold: 0.15  // Aggressive diversity filter
}
```

## Usage

Test with optimizations:
```bash
node tests/param-optimizer-v3.js \
  --iterations 20 \
  --seed 42 \
  --prompts 5
```

The optimizer now reports:
```
Final Results:
  Iterations: 20
  Candidates evaluated: 14  (6 skipped)
  API calls: 210
  Credit efficiency: saved ~$15.60
```

## Trade-offs

**Pros**:
- 65% credit reduction
- Faster convergence to local optimum
- More iterations per dollar

**Cons**:
- May miss distant global optima (less exploration)
- Single-trial variance higher for exploratory candidates
- Requires tuning thresholds for specific problem

## Validation Strategy

1. Run 5 iterations with optimizations → check improvements kept
2. If 0 improvements → reduce `minDelta` to 0.03
3. If >50% skipped → good balance
4. If <20% skipped → increase `minDelta` to 0.08

## Comparison to V2.1

V2.1 cannot benefit from these optimizations because:
- Text mutation space is unbounded (no distance metric)
- No parameter vector (can't compute L2 distance)
- Puppeteer overhead dominates cost (not API calls)

V3 enables credit-saving via:
- Fixed parameter space → distance-based filtering
- Direct API calls → adaptive trial counts
- Deterministic rendering → no repeated evaluations
