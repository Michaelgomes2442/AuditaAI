# V3 Enhanced CLI - Complete Feature Summary

## Overview

The Parameter-Space Optimizer V3 CLI has been enhanced with production-ready features for better control, transparency, and user experience.

## ✨ New Features

### 1. **Help System** (`--help`)
Complete documentation built into the CLI with usage examples, presets, and parameter space explanation.

```bash
node tests/param-optimizer-v3.js --help
```

Includes:
- Usage syntax
- All available options
- Preset descriptions
- Real examples
- Parameter space documentation

### 2. **Configuration Presets** (`--preset`)
Five pre-configured profiles for common use cases:

#### `quick-test` (Development)
- 10 iterations, 3 prompts
- Fast learning (lr=0.15, stddev=0.25)
- Est. cost: $3.00, runtime: ~8 min
- Use for: Testing parameter changes quickly

```bash
node tests/param-optimizer-v3.js --preset quick-test
```

#### `production` (Default)
- 50 iterations, 5 prompts
- Balanced learning (lr=0.1, stddev=0.2)
- $50.00 budget cap
- Est. cost: $25.00, runtime: ~63 min
- Use for: Full optimization runs

```bash
node tests/param-optimizer-v3.js --preset production
```

#### `aggressive` (Exploration)
- 30 iterations, 4 prompts
- High exploration (lr=0.2, stddev=0.3)
- Est. cost: $12.00, runtime: ~30 min
- Use for: Finding distant optima, risky parameter regions

```bash
node tests/param-optimizer-v3.js --preset aggressive
```

#### `conservative` (Exploitation)
- 40 iterations, 6 prompts
- Low exploration (lr=0.05, stddev=0.15)
- Est. cost: $24.00, runtime: ~96 min
- Use for: Fine-tuning near known optimum

```bash
node tests/param-optimizer-v3.js --preset conservative
```

### 3. **Dry-Run Mode** (`--dry-run`)
Preview cost, runtime, and configuration **before** consuming API credits.

```bash
node tests/param-optimizer-v3.js --preset production --dry-run
```

Output:
```
╔═══════════════════════════════════════════════════════════════╗
║              DRY RUN - Estimated Configuration                ║
╚═══════════════════════════════════════════════════════════════╝

Configuration:
  Iterations:           50
  Prompts per iter:     5
  Total evaluations:    ~250
  Est. cost per eval:   $0.10
  Est. total cost:      $25.00
  Budget cap:           $50.00
  Est. runtime:         ~63 minutes

✅ Within budget: $25.00 remaining

Remove --dry-run to start optimization.
```

**Benefits:**
- Never waste credits on unexpected configurations
- Check budget before running
- Validate settings before commitment

### 4. **Budget Cap** (`--budget <USD>`)
Hard limit on total API spend - optimizer stops if exceeded.

```bash
# Run up to 20 iterations but stop if cost hits $10
node tests/param-optimizer-v3.js --iterations 20 --budget 10.00
```

Output includes budget tracking:
```
💰 Total Cost:     $9.87
💰 Budget:         $10.00
💰 Remaining:      $0.13
```

### 5. **Argument Validation**
All arguments are validated before optimization starts. Catches errors early.

```bash
# Invalid: iterations must be positive
$ node tests/param-optimizer-v3.js --iterations -5

❌ Validation errors:
  - --iterations must be positive integer

Run with --help for usage information.
```

### 6. **Graceful Shutdown** (SIGINT handler)
Press Ctrl+C to safely checkpoint progress and exit.

```
🛑 Shutdown requested. Saving checkpoint...
✅ Checkpoint saved. Safe to exit.
```

Protects against losing data on interruption.

### 7. **Progress Indicators**
Real-time visual feedback during optimization:

```
[01/20] ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 5.0%
  Score: 0.7234 | Cost: $0.0847 | Total: $0.4235

[02/20] ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 10.0%
  Score: 0.7456 | Cost: $0.0823 | Total: $0.9058
  🎉 NEW BEST: 0.7456 (prev: 0.7234, Δ=3.07%)
  
[03/20] ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15.0%
  ⊘ SKIPPED: Similar to recent candidate (L2=0.08)
```

### 8. **Event System** (Backend)
Optimizer emits events that CLI listens to:
- `iteration-start` - When iteration begins
- `iteration-end` - When evaluation complete
- `improvement` - When new best found
- `skipped` - When candidate filtered
- `checkpoint` - When progress saved

Enable full logging for debugging:
```bash
DEBUG=1 node tests/param-optimizer-v3.js --preset quick-test
```

## 🎯 Usage Patterns

### Pattern 1: Quick Validation
Check if optimization setup is correct without spending money.

```bash
node tests/param-optimizer-v3.js --preset production --dry-run
```

### Pattern 2: Fast Iteration
Test new improvements quickly.

```bash
node tests/param-optimizer-v3.js --preset quick-test
```

### Pattern 3: Production Run
Full optimization with safety checks.

```bash
node tests/param-optimizer-v3.js --preset production --budget 30.00
```

### Pattern 4: Custom Configuration
Fine-tune for specific needs.

```bash
node tests/param-optimizer-v3.js \
  --iterations 25 \
  --prompts 4 \
  --lr 0.12 \
  --stddev 0.18 \
  --seed 1337 \
  --budget 20.00
```

### Pattern 5: Safe Interruption
Start run, inspect early results, and safely stop.

```bash
node tests/param-optimizer-v3.js --preset production
# ... wait a few iterations ...
# Press Ctrl+C to save and exit
🛑 Shutdown requested. Saving checkpoint...
✅ Checkpoint saved. Safe to exit.
```

## 📊 Credit Savings Integration

The enhanced CLI works with V3's credit-saving optimizations:

**Without Dry-Run:**
- Blindly run 50 iterations → Assume $25 cost
- Realize budget is only $10 → Wasted credits

**With Dry-Run + Budget:**
```bash
# Step 1: Check cost
node tests/param-optimizer-v3.js --preset production --dry-run
# Shows: Est. $25.00

# Step 2: Adjust and preview
node tests/param-optimizer-v3.js --preset aggressive --dry-run
# Shows: Est. $12.00

# Step 3: Run safely
node tests/param-optimizer-v3.js --preset aggressive --budget 12.00
```

Result: **0% wasted credits** via early validation.

## 🔧 Command Reference

```bash
# Help and documentation
node tests/param-optimizer-v3.js --help
node tests/param-optimizer-v3.js -h

# Quick test
node tests/param-optimizer-v3.js --preset quick-test

# Production run
node tests/param-optimizer-v3.js --preset production

# Preview cost
node tests/param-optimizer-v3.js --preset production --dry-run

# With budget cap
node tests/param-optimizer-v3.js --preset production --budget 20.00

# Custom settings
node tests/param-optimizer-v3.js \
  --iterations 30 \
  --prompts 4 \
  --lr 0.15 \
  --stddev 0.25 \
  --seed 1337 \
  --budget 25.00

# Run aggressive exploration
node tests/param-optimizer-v3.js --preset aggressive

# Run conservative fine-tuning
node tests/param-optimizer-v3.js --preset conservative

# Check if backend is healthy first
curl http://localhost:3001/health
```

## 💡 Best Practices

1. **Always dry-run first:**
   ```bash
   node tests/param-optimizer-v3.js --preset production --dry-run
   ```

2. **Set budget cap to be safe:**
   ```bash
   node tests/param-optimizer-v3.js --preset production --budget 20.00
   ```

3. **Use presets for known scenarios:**
   - Development: `--preset quick-test`
   - Production: `--preset production`
   - Exploration: `--preset aggressive`
   - Tuning: `--preset conservative`

4. **Check backend health first:**
   ```bash
   curl http://localhost:3001/health
   ```

5. **Monitor first iteration:**
   - If improvements are low, maybe adjust `--lr` or `--stddev`
   - If cost is higher than expected, reduce `--budget`

6. **Use Ctrl+C gracefully:**
   - Press once to save and exit cleanly
   - Press twice if first doesn't respond (forces exit)

## 🚀 Features Delivered

✅ **Help system** - Complete CLI documentation  
✅ **Presets** - 4 pre-configured profiles for common use  
✅ **Dry-run** - Preview cost/time before running  
✅ **Budget cap** - Hard limit on API spending  
✅ **Validation** - Catch errors before running  
✅ **Graceful shutdown** - SIGINT handler for safe exit  
✅ **Progress bars** - Real-time visual feedback  
✅ **Event system** - Backend support for listeners  

## 🎓 Learning

The enhanced CLI teaches best practices:
- Always preview before committing resources
- Use presets to avoid configuration mistakes
- Monitor progress in real-time
- Handle interruption gracefully
- Track costs throughout execution
