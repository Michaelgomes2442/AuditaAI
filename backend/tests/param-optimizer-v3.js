#!/usr/bin/env node
/**
 * Parameter-Space Optimizer CLI (V3)
 * 
 * Converges where V2 couldn't:
 * - Fixed 14D search space (not unbounded text)
 * - Deterministic rendering (no drift)
 * - Direct API evaluation (no browser variance)
 * - Per-dimension Thompson Sampling (proper learning)
 * 
 * Usage:
 *   node tests/param-optimizer-v3.js --iterations 20 --seed 42
 *   node tests/param-optimizer-v3.js --help
 */

import { ParameterOptimizer } from '../dist/opt/optimizer.js';

// Configuration presets
const PRESETS = {
  'quick-test': {
    iterations: 10,
    prompts: 3,
    lr: 0.15,
    stddev: 0.25
  },
  'production': {
    iterations: 50,
    prompts: 5,
    lr: 0.1,
    stddev: 0.2,
    budget: 50.00
  },
  'aggressive': {
    iterations: 30,
    prompts: 4,
    lr: 0.2,
    stddev: 0.3
  },
  'conservative': {
    iterations: 40,
    prompts: 6,
    lr: 0.05,
    stddev: 0.15
  }
};

// Parse CLI args
const args = process.argv.slice(2);

// Help text
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         Parameter-Space Optimizer V3 (Thompson Sampling)      ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node tests/param-optimizer-v3.js [OPTIONS]

OPTIONS:
  --iterations <N>    Number of optimization iterations (default: 20)
  --seed <N>          Random seed for reproducibility (default: 42)
  --prompts <N>       Number of test prompts per iteration (default: 5)
  --backend <URL>     Backend API URL (default: http://localhost:3001)
  --lr <FLOAT>        Learning rate for parameter updates (default: 0.1)
  --stddev <FLOAT>    Initial std deviation for exploration (default: 0.2)
  --budget <USD>      Max budget in USD (default: unlimited)
  --output <PATH>     Output results file (default: auto-generated)
  --preset <NAME>     Use configuration preset
  --resume <PATH>     Resume from checkpoint file
  --dry-run           Show estimated cost/time without running
  --help, -h          Show this help message

PRESETS:
  quick-test      10 iterations, 3 prompts, fast learning
  production      50 iterations, 5 prompts, $50 budget, production-ready
  aggressive      30 iterations, 4 prompts, high exploration
  conservative    40 iterations, 6 prompts, low exploration

EXAMPLES:
  # Quick test (10 iterations, 3 prompts)
  node tests/param-optimizer-v3.js --preset quick-test

  # Production run with budget cap
  node tests/param-optimizer-v3.js --preset production --budget 25.00

  # Custom configuration
  node tests/param-optimizer-v3.js --iterations 20 --prompts 4 --lr 0.12

  # Check estimated cost first
  node tests/param-optimizer-v3.js --preset production --dry-run

PARAMETER SPACE:
  14 dimensions covering governance aspects:
    - Rigor (depth, scenarios, number controls)
    - Integration (flow, constraints, coupling)
    - Coherence (markers, transitions, structure)
    - Strictness (refusal, policies, tone)
    - Empathy (directness, stability, connection)
    - Examples (specificity, concreteness)
    - Redundancy (compression, deduplication)
    - Header (preamble, regulatory tone)

OUTPUT:
  - Real-time console progress with bars
  - JSON checkpoint after each iteration
  - Final results with convergence data
  - Best parameters saved to governance file
`);
  process.exit(0);
}

const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : defaultValue;
};

// Check for dry-run first
const dryRun = args.includes('--dry-run');

// Load preset if specified
const preset = getArg('--preset', null);
let presetConfig = {};

if (preset) {
  if (!PRESETS[preset]) {
    console.error(`\n❌ Unknown preset: ${preset}`);
    console.error(`Available presets: ${Object.keys(PRESETS).join(', ')}\n`);
    process.exit(1);
  }
  presetConfig = { ...PRESETS[preset] };
}

const iterations = parseInt(getArg('--iterations', presetConfig.iterations || '20'));
const seed = parseInt(getArg('--seed', presetConfig.seed || '42'));
const promptCount = parseInt(getArg('--prompts', presetConfig.prompts || '5'));
const backendUrl = getArg('--backend', presetConfig.backendUrl || 'http://localhost:3001');
const learningRate = parseFloat(getArg('--lr', presetConfig.lr || '0.1'));
const initialStddev = parseFloat(getArg('--stddev', presetConfig.stddev || '0.2'));
const budget = parseFloat(getArg('--budget', presetConfig.budget || '0')) || null;
const outputPath = getArg('--output', null);
const resumePath = getArg('--resume', null);

// Validation
const errors = [];
if (isNaN(iterations) || iterations < 1) errors.push('--iterations must be positive integer');
if (isNaN(seed)) errors.push('--seed must be an integer');
if (isNaN(promptCount) || promptCount < 1) errors.push('--prompts must be positive integer');
if (isNaN(learningRate) || learningRate <= 0 || learningRate > 1) errors.push('--lr must be between 0 and 1');
if (isNaN(initialStddev) || initialStddev <= 0) errors.push('--stddev must be positive');
if (budget !== null && (isNaN(budget) || budget <= 0)) errors.push('--budget must be positive number');

if (errors.length > 0) {
  console.error(`\n❌ Validation errors:\n  - ${errors.join('\n  - ')}\n`);
  console.error(`Run with --help for usage information.\n`);
  process.exit(1);
}

// Dry-run mode
if (dryRun) {
  const estCostPerEval = 0.10;  // Rough estimate
  const totalEvals = iterations * promptCount;
  const estCost = totalEvals * estCostPerEval;
  const estMinutes = Math.ceil(totalEvals * 15 / 60);
  
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              DRY RUN - Estimated Configuration                ║
╚═══════════════════════════════════════════════════════════════╝
`);
  console.log(`Configuration:`);
  console.log(`  Iterations:           ${iterations}`);
  console.log(`  Prompts per iter:     ${promptCount}`);
  console.log(`  Total evaluations:    ~${totalEvals}`);
  console.log(`  Est. cost per eval:   $${estCostPerEval.toFixed(2)}`);
  console.log(`  Est. total cost:      $${estCost.toFixed(2)}`);
  console.log(`  Budget cap:           ${budget ? '$' + budget.toFixed(2) : 'Unlimited'}`);
  console.log(`  Est. runtime:         ~${estMinutes} minutes\n`);
  
  if (budget && estCost > budget) {
    console.log(`⚠️  WARNING: Estimated cost ($${estCost.toFixed(2)}) exceeds budget ($${budget.toFixed(2)})\n`);
  } else if (budget) {
    const remaining = budget - estCost;
    console.log(`✅ Within budget: $${remaining.toFixed(2)} remaining\n`);
  }
  
  console.log(`Remove --dry-run to start optimization.\n`);
  process.exit(0);
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         Parameter-Space Optimizer V3 (Thompson Sampling)      ║
╚═══════════════════════════════════════════════════════════════╝
`);

console.log(`Configuration:`);
console.log(`  Iterations:      ${iterations}`);
console.log(`  Random Seed:     ${seed}`);
console.log(`  Prompts/Iter:    ${promptCount}`);
console.log(`  Backend:         ${backendUrl}`);
console.log(`  Learning Rate:   ${learningRate}`);
console.log(`  Init StdDev:     ${initialStddev}`);
console.log(`  Preset:          ${preset || 'None (custom)'}`);
console.log(`  Budget:          ${budget ? '$' + budget.toFixed(2) : 'Unlimited'}`);
console.log(`  Output:          ${outputPath || 'Auto-generated'}`);
console.log(``);

const optimizer = new ParameterOptimizer({
  iterations,
  seed,
  promptCount,
  backendUrl,
  learningRate,
  initialStddev,
  budget,
  outputPath,
  checkpointDir: './checkpoints',
  checkpointInterval: 1
});

// Load checkpoint if resuming
if (resumePath) {
  try {
    await optimizer.loadCheckpoint(resumePath);
    console.log(`\n📂 Resuming from checkpoint: ${resumePath}\n`);
  } catch (err) {
    console.error(`\n❌ Failed to load checkpoint: ${err.message}\n`);
    process.exit(1);
  }
} else if (!dryRun) {
  console.log(`📂 Checkpoints will be saved to: ./checkpoints/\n`);
}

// Track state for progress
let lastIteration = 0;
let lastCost = 0;

// Listen for iteration events if available
if (optimizer.on) {
  optimizer.on('iteration-start', (data) => {
    const progress = (data.iteration / iterations * 100).toFixed(1);
    const filled = Math.floor(progress / 2);
    const empty = 50 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    console.log(`\n[${String(data.iteration).padStart(2)}/${iterations}] ${bar} ${String(progress).padStart(5)}%`);
    lastIteration = data.iteration;
  });

  optimizer.on('iteration-end', (data) => {
    const cost = data.cost || 0;
    const totalCost = lastCost + cost;
    console.log(`  Score: ${data.score.toFixed(4)} | Cost: $${cost.toFixed(4)} | Total: $${totalCost.toFixed(4)}`);
    lastCost = totalCost;
  });

  optimizer.on('improvement', (data) => {
    const delta = ((data.newBest - data.oldBest) / Math.abs(data.oldBest) * 100).toFixed(2);
    console.log(`  🎉 NEW BEST: ${data.newBest.toFixed(4)} (prev: ${data.oldBest.toFixed(4)}, Δ=${delta}%)`);
  });

  optimizer.on('skipped', (data) => {
    console.log(`  ⊘ SKIPPED: ${data.reason}`);
  });

  optimizer.on('checkpoint', (data) => {
    console.log(`  💾 Checkpoint: ${data.path}`);
  });
}

// Graceful shutdown handler
let shuttingDown = false;
process.on('SIGINT', async () => {
  if (shuttingDown) {
    console.log(`\n\n⚠️  Force quit detected. Progress may be lost.`);
    process.exit(1);
  }
  
  console.log(`\n\n🛑 Shutdown requested. Saving checkpoint...`);
  shuttingDown = true;
  
  try {
    if (optimizer.saveCheckpoint) {
      await optimizer.saveCheckpoint();
      console.log(`✅ Checkpoint saved. Safe to exit.`);
    }
    process.exit(0);
  } catch (err) {
    console.error(`❌ Failed to save checkpoint:`, err.message);
    process.exit(1);
  }
});

// Run optimizer with error handling
optimizer.optimize()
  .then(() => {
    // Optimization completed successfully (report printed by optimizer)
    process.exit(0);
  })
  .catch(err => {
    console.error(`\n❌ Optimization failed:`, err.message);
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  });

