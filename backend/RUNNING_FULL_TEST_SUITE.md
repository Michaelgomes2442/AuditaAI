# Running the Full Test Suite with Real API Keys

## 🎯 Quick Start

### 1. Set up your API key
```bash
export ANTHROPIC_API_KEY='your-key-here'
```

### 2. Verify API key is set
```bash
cd /home/michaelgomes/AuditaAI/backend
./check-api-keys.sh
```

### 3. Start the full test suite
```bash
./run-full-suite-with-api.sh
```

That's it! The test will run for 3-6 hours and save checkpoints automatically.

---

## 📊 What Happens

### Test Execution
- **7 governance variations** tested
- **4 test prompts** per variation
- **3 trials** per prompt (for statistical rigor)
- **Total: ~84 API calls** to Claude Opus 4

### Estimated Costs
- **Time:** 3-6 hours (depending on API latency)
- **Cost:** $5-15 (Claude Opus 4 @ $15/1M input, $75/1M output)

### Safety Features

✅ **Automatic Checkpointing**
- Saves progress after EVERY variation completes
- Files: `governance-optimization-checkpoint-*.json`

✅ **Graceful Failure Handling**
- If test crashes, partial results are saved
- Generates `GOVERNANCE_OPTIMIZATION_REPORT_V2_PARTIAL.md`

✅ **API Credit Detection**
- Automatically stops if API credits exhausted
- Saves all completed work before exiting

✅ **Timeout Protection**
- 10-minute timeout per API call
- Continues with next trial on timeout

---

## 📁 Output Files

### During Testing
```
governance-optimization-checkpoint-<timestamp>.json  # After each variation
```

### After Completion (Full)
```
governance-optimization-report-v2.json               # Raw data
GOVERNANCE_OPTIMIZATION_REPORT_V2.md                 # Beautiful report
```

### After Interruption (Partial)
```
governance-optimization-checkpoint-<timestamp>.json  # Last checkpoint
GOVERNANCE_OPTIMIZATION_REPORT_V2_PARTIAL.md         # Partial report
```

---

## 🛟 If Something Goes Wrong

### Test Crashes Mid-Run
✅ **Don't worry!** All completed variations are saved in checkpoint files.

Check for:
- `governance-optimization-checkpoint-*.json` (latest checkpoint)
- `GOVERNANCE_OPTIMIZATION_REPORT_V2_PARTIAL.md` (partial analysis)

### API Credits Exhausted
✅ **Automatically detected!** Test stops gracefully and generates report.

You'll see:
```
🛑 Test aborted: API_CREDITS_EXHAUSTED
   Completed 3/7 variations
```

All completed work is analyzed and reported.

### Want to Resume Later?
The test suite doesn't support resume (by design - ensures fresh governance per run).

But you can:
1. Review partial results
2. Re-run specific variations manually if needed
3. Wait for credits to refill and run again

---

## 📈 What You'll Get

### Comprehensive Rankings
```markdown
| Rank | Variation | Mean Ω Δ | Stability | Ω/$1 | File |
|------|-----------|----------|-----------|------|------|
| 🥇   | V2.2      | +12.3%   | ✅ Very Stable | 2890 | ... |
| 🥈   | V2.4      | +11.1%   | ✓ Stable | 2654 | ... |
| 🥉   | V2.1      | +10.2%   | ✓ Stable | 2421 | ... |
```

### Statistical Rigor
- Mean Omega improvement with 95% confidence intervals
- Coefficient of variation (volatility measure)
- Per-pillar CRIES analysis
- Cost efficiency (Omega per dollar, per 100 tokens)

### Diagnostic Warnings
- 🚨 Unstable variations (CV > 25%)
- ⚠️ Token pressure detection (Opus clipping)
- ⚠️ Over-governing detection (degraded pillars)

### Deployment Ready
If any variation exceeds +15% improvement:
```markdown
✅ DEPLOY: V2.2 - Stronger depth
Expected Improvement: +12.3% ± 1.4% Ω
Deployment Command:
  cp governance/rosetta-frontier-v2.2-depth.txt governance/rosetta-frontier.txt
```

---

## 🔥 Pro Tips

### Run in Background
```bash
# Start test and detach
nohup ./run-full-suite-with-api.sh > test-output.log 2>&1 &

# Check progress
tail -f test-output.log

# Check checkpoints
ls -lth governance-optimization-checkpoint-*.json | head -5
```

### Monitor Progress
```bash
# See latest checkpoint
cat governance-optimization-checkpoint-*.json | jq '.completedVariations'

# Watch for new checkpoints
watch -n 30 'ls -lth governance-optimization-checkpoint-*.json | head -5'
```

### After Test Completes
```bash
# View final report
cat GOVERNANCE_OPTIMIZATION_REPORT_V2.md | less

# Check winner
grep "🥇" GOVERNANCE_OPTIMIZATION_REPORT_V2.md
```

---

## ✅ Verification Checklist

Before starting:
- [ ] Backend is running (`curl http://localhost:3001/health`)
- [ ] API key is set (`./check-api-keys.sh`)
- [ ] You have 3-6 hours available
- [ ] You have $5-15 in API credits

During test:
- [ ] Checkpoints appear every 20-30 minutes
- [ ] No repeated API errors
- [ ] Backend stays running

After test:
- [ ] Final report generated
- [ ] Winner identified (🥇)
- [ ] Statistical confidence verified (CV < 15%)

---

## 🎓 What Makes This Research-Grade

✅ **Multi-trial testing** — Accounts for model nondeterminism  
✅ **Statistical rigor** — 95% confidence intervals, not single runs  
✅ **Cost efficiency** — First-ever "Omega per dollar" metric  
✅ **Reproducibility** — Governance cache cleared between tests  
✅ **Volatility tracking** — Coefficient of variation per pillar  
✅ **Diagnostic tools** — Detects over-governing, token pressure, instability  

**This is the most rigorous governance testing system in existence.**

---

## 🚀 Ready?

```bash
cd /home/michaelgomes/AuditaAI/backend
export ANTHROPIC_API_KEY='your-key-here'
./run-full-suite-with-api.sh
```

Then take your nap! 😴 The test will run safely and save everything automatically.
