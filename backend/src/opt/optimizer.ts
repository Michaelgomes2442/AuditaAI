/**
 * Parameter-Space Optimizer (V3)
 * 
 * Replaces text mutations with continuous parameter optimization.
 * Uses Thompson Sampling over WrapperParams vector space.
 * 
 * Key differences from V2.1:
 * - Search space: Fixed 14D parameter vector (not unbounded text)
 * - Rendering: Deterministic params → wrapper (no drift)
 * - Evaluation: Direct API calls (no Puppeteer)
 * - Learning: Per-dimension Thompson Sampling (Gaussian priors)
 */

import { WrapperParams, DEFAULT_PARAMS, paramsToVector, vectorToParams, formatParams } from '../wrapper/params.js';
import { renderWrapper, estimateLength } from '../wrapper/render.js';
import { evaluate, loadPrompts } from '../eval/harness.js';
import { computeReward, isFeasible, formatRewardBreakdown, DEFAULT_OBJECTIVE_CONFIG } from './objective.js';
import { EventEmitter } from 'events';
import fs from 'fs/promises';

interface OptimizerConfig {
  iterations: number;
  seed: number;
  promptCount: number;
  backendUrl: string;
  learningRate: number;      // Exploration vs exploitation
  initialStddev: number;      // Initial uncertainty per dimension
  // Credit-saving optimizations
  minDelta: number;          // Skip evaluation if param change too small
  useUCB: boolean;           // Use UCB instead of Thompson Sampling (less exploration)
  adaptiveTrials: boolean;   // Reduce trials for low-confidence candidates
  diversityThreshold: number; // Min L2 distance from recent candidates
  // Checkpoint options
  checkpointDir?: string;    // Directory to save checkpoints
  checkpointInterval?: number; // Save checkpoint every N iterations (default: 1)
}

const DEFAULT_CONFIG: OptimizerConfig = {
  iterations: 20,
  seed: 42,
  promptCount: 5,
  backendUrl: 'http://localhost:3001',
  learningRate: 0.1,
  initialStddev: 0.2,
  minDelta: 0.05,           // Skip if <5% change
  useUCB: true,             // Exploit more, explore less
  adaptiveTrials: true,     // 1 trial if uncertain, 3 if confident
  diversityThreshold: 0.1,  // Avoid redundant candidates
  checkpointDir: './checkpoints',
  checkpointInterval: 1     // Save after every iteration
};

interface DimensionStats {
  mean: number;
  variance: number;
  n: number;
  M2: number;  // Welford's algorithm
}

interface IterationResult {
  iteration: number;
  params: WrapperParams;
  reward: number;
  delta: any;
  wrapperLength: number;
  variance: number;
  kept: boolean;
}

export class ParameterOptimizer extends EventEmitter {
  private config: OptimizerConfig;
  private rng: () => number;
  
  // Per-dimension statistics (Thompson Sampling)
  private dimensionStats: DimensionStats[];
  
  // Best solution found
  private bestParams: WrapperParams;
  private bestReward: number;
  private bestDelta: any;
  private bestVector: number[];  // Track for diversity check
  
  // History
  private history: IterationResult[];
  private apiCalls: number;
  private skippedCandidates: number;
  private recentVectors: number[][];  // For diversity checking
  
  constructor(config: Partial<OptimizerConfig> = {}) {
    super();
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = this.seedRandom(this.config.seed);
    
    // Initialize per-dimension statistics
    const dim = paramsToVector(DEFAULT_PARAMS).length;
    this.dimensionStats = Array(dim).fill(null).map(() => ({
      mean: 0.5,  // Start at midpoint
      variance: this.config.initialStddev ** 2,
      n: 0,
      M2: 0
    }));
    
    this.bestParams = DEFAULT_PARAMS;
    this.bestReward = -Infinity;
    this.bestDelta = null;
    this.bestVector = paramsToVector(DEFAULT_PARAMS);
    
    this.history = [];
    this.apiCalls = 0;
    this.skippedCandidates = 0;
    this.recentVectors = [];
  }
  
  /**
   * Main optimization loop
   */
  async optimize(): Promise<void> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`PARAMETER-SPACE OPTIMIZER V3`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Config:`);
    console.log(`  Iterations: ${this.config.iterations}`);
    console.log(`  Seed: ${this.config.seed}`);
    console.log(`  Prompts: ${this.config.promptCount}`);
    console.log(`  Backend: ${this.config.backendUrl}`);
    console.log(`  Search space: ${this.dimensionStats.length}D continuous + categorical`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Load fixed prompt set
    const prompts = loadPrompts(this.config.seed, this.config.promptCount);
    console.log(`Test prompts:`);
    prompts.forEach((p, i) => console.log(`  ${i + 1}. ${p.slice(0, 60)}...`));
    console.log();
    
    // Evaluate baseline
    console.log(`\nEvaluating baseline (DEFAULT_PARAMS)...`);
    const baselineWrapper = renderWrapper(DEFAULT_PARAMS);
    console.log(`Baseline wrapper: ${baselineWrapper.length} chars`);
    const baselineResult = await evaluate(baselineWrapper, prompts, {
      backendUrl: this.config.backendUrl,
      seed: this.config.seed
    });
    this.apiCalls += prompts.length * 2 * 3; // prompts × (governed+baseline) × trials
    
    console.log(`Baseline deltas:`);
    console.log(`  ΔΩ: ${baselineResult.delta.overall >= 0 ? '+' : ''}${baselineResult.delta.overall.toFixed(4)}`);
    console.log(`  ΔR: ${baselineResult.delta.rigor >= 0 ? '+' : ''}${baselineResult.delta.rigor.toFixed(4)}`);
    console.log(`  ΔI: ${baselineResult.delta.integration >= 0 ? '+' : ''}${baselineResult.delta.integration.toFixed(4)}`);
    console.log(`  ΔC: ${baselineResult.delta.coherence >= 0 ? '+' : ''}${baselineResult.delta.coherence.toFixed(4)}`);
    console.log(`  Variance: ${baselineResult.variance.toFixed(4)}`);
    
    const baselineReward = computeReward(
      baselineResult.delta,
      baselineWrapper.length,
      baselineResult.variance
    );
    console.log(`  Reward: ${baselineReward >= 0 ? '+' : ''}${baselineReward.toFixed(4)}`);
    
    this.bestReward = baselineReward;
    this.bestDelta = baselineResult.delta;
    
    // Optimization loop
    for (let iter = 1; iter <= this.config.iterations; iter++) {
      // Emit iteration start event
      this.emit('iteration-start', { iteration: iter });
      
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`ITERATION ${iter}/${this.config.iterations}`);
      console.log(`${'─'.repeat(70)}`);
      
      // Propose candidate via Thompson Sampling or UCB
      const candidateVector = this.config.useUCB 
        ? this.proposeCandidateUCB() 
        : this.proposeCandidate();
      const candidateParams = vectorToParams(candidateVector);
      
      // Check diversity - skip if too similar to recent candidates
      if (this.recentVectors.length > 0) {
        const minDist = Math.min(...this.recentVectors.map(v => this.l2Distance(candidateVector, v)));
        if (minDist < this.config.diversityThreshold) {
          console.log(`\n⊘ SKIPPED (too similar to recent candidate, L2=${minDist.toFixed(3)} < ${this.config.diversityThreshold})`);
          this.emit('skipped', { reason: 'Similar to recent candidate', distance: minDist });
          this.skippedCandidates++;
          continue;
        }
      }
      
      // Check delta from best - skip if too small
      const deltaFromBest = this.l2Distance(candidateVector, this.bestVector);
      if (deltaFromBest < this.config.minDelta) {
        console.log(`\n⊘ SKIPPED (change too small, L2=${deltaFromBest.toFixed(3)} < ${this.config.minDelta})`);
        this.emit('skipped', { reason: 'Change too small', distance: deltaFromBest });
        this.skippedCandidates++;
        continue;
      }
      
      // Track for diversity check
      this.recentVectors.push([...candidateVector]);
      if (this.recentVectors.length > 5) {
        this.recentVectors.shift();  // Keep only last 5
      }
      
      console.log(`\nCandidate parameters:`);
      console.log(`  ${formatParams(candidateParams)}`);
      console.log(`  L2 distance from best: ${deltaFromBest.toFixed(3)}`);
      
      // Render wrapper
      const candidateWrapper = renderWrapper(candidateParams);
      const actualLength = candidateWrapper.length;
      const estimatedLength = estimateLength(candidateParams);
      console.log(`  Wrapper length: ${actualLength} chars (estimated: ${estimatedLength})`);
      
      // Adaptive trials - use fewer trials if uncertain
      let trials = 3;
      if (this.config.adaptiveTrials) {
        const avgVariance = this.dimensionStats.reduce((sum, s) => sum + s.variance, 0) / this.dimensionStats.length;
        if (avgVariance > 0.1) {
          trials = 1;  // High uncertainty - single trial to save credits
          console.log(`  Using 1 trial (high uncertainty, avg σ²=${avgVariance.toFixed(3)})`);
        }
      }
      
      // Evaluate
      console.log(`\nEvaluating candidate (${trials} trial${trials > 1 ? 's' : ''})...`);
      const result = await evaluate(candidateWrapper, prompts, {
        backendUrl: this.config.backendUrl,
        seed: this.config.seed + iter,
        trials  // Pass adaptive trial count
      });
      this.apiCalls += prompts.length * 2 * trials;
      
      // Emit iteration result
      const iterCost = (prompts.length * 2 * trials * 0.0001);  // Rough estimate
      this.emit('iteration-end', { 
        iteration: iter,
        score: result.delta.overall,
        cost: iterCost
      });
      
      console.log(`\nResults:`);
      console.log(`  ΔΩ: ${result.delta.overall >= 0 ? '+' : ''}${result.delta.overall.toFixed(4)} (best: ${this.bestDelta.overall >= 0 ? '+' : ''}${this.bestDelta.overall.toFixed(4)})`);
      console.log(`  ΔR: ${result.delta.rigor >= 0 ? '+' : ''}${result.delta.rigor.toFixed(4)} (best: ${this.bestDelta.rigor >= 0 ? '+' : ''}${this.bestDelta.rigor.toFixed(4)})`);
      console.log(`  ΔI: ${result.delta.integration >= 0 ? '+' : ''}${result.delta.integration.toFixed(4)} (best: ${this.bestDelta.integration >= 0 ? '+' : ''}${this.bestDelta.integration.toFixed(4)})`);
      console.log(`  ΔC: ${result.delta.coherence >= 0 ? '+' : ''}${result.delta.coherence.toFixed(4)}`);
      console.log(`  Variance: ${result.variance.toFixed(4)}`);
      
      // Compute reward
      const reward = computeReward(result.delta, actualLength, result.variance);
      console.log(`\n${formatRewardBreakdown(result.delta, actualLength, result.variance, reward)}`);
      
      // Check feasibility
      const feasible = isFeasible(result.delta);
      console.log(`\nFeasibility: ${feasible ? '✓ PASS' : '✗ FAIL (constraint violation)'}`);
      
      // Update statistics
      this.updateStatistics(candidateVector, reward);
      
      // Keep if better
      let kept = false;
      if (feasible && reward > this.bestReward) {
        console.log(`\n🎉 NEW BEST! Improvement: ${(reward - this.bestReward >= 0 ? '+' : '')}${(reward - this.bestReward).toFixed(4)}`);
        this.bestParams = candidateParams;
        this.bestReward = reward;
        this.bestDelta = result.delta;
        this.bestVector = candidateVector;
        kept = true;
        
        // Emit improvement event
        this.emit('improvement', {
          iteration: iter,
          newBest: reward,
          oldBest: reward - (reward - this.bestReward)
        });
      } else {
        console.log(`\n→ Not kept (current best: ${this.bestReward >= 0 ? '+' : ''}${this.bestReward.toFixed(4)})`);
      }
      
      // Record history
      this.history.push({
        iteration: iter,
        params: candidateParams,
        reward,
        delta: result.delta,
        wrapperLength: actualLength,
        variance: result.variance,
        kept
      });

      // Auto-checkpoint
      if (this.config.checkpointInterval && iter % this.config.checkpointInterval === 0) {
        try {
          await this.saveCheckpoint();
        } catch (err) {
          console.error(`⚠️  Failed to save checkpoint: ${(err as Error).message}`);
        }
      }
    }
    
    // Final report
    await this.generateReport();
  }
  
  /**
   * Propose candidate via per-dimension Thompson Sampling
   */
  private proposeCandidate(): number[] {
    const vector: number[] = [];
    
    for (const stats of this.dimensionStats) {
      // Sample from posterior (Student-t if low n)
      let sample: number;
      
      if (stats.n < 2) {
        // High uncertainty - uniform exploration
        sample = this.rng();
      } else {
        // Student-t posterior predictive
        const u1 = this.rng();
        const u2 = this.rng();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const scale = Math.sqrt((1 + 1 / stats.n) * stats.variance);
        sample = stats.mean + z * scale;
      }
      
      // Clip to [0, 1]
      sample = Math.max(0, Math.min(1, sample));
      vector.push(sample);
    }
    
    return vector;
  }
  
  /**
   * Propose candidate via UCB (less exploration, more exploitation)
   */
  private proposeCandidateUCB(): number[] {
    const vector: number[] = [];
    const t = this.history.length + 1;  // Total pulls
    
    for (const stats of this.dimensionStats) {
      if (stats.n < 2) {
        // Not enough data - explore
        vector.push(this.rng());
      } else {
        // UCB: mean + c * sqrt(log(t) / n)
        const c = 2.0;  // Exploration constant (lower = more exploitation)
        const ucb = stats.mean + c * Math.sqrt(Math.log(t) / stats.n);
        const sample = Math.max(0, Math.min(1, ucb));
        vector.push(sample);
      }
    }
    
    return vector;
  }
  
  /**
   * Compute L2 distance between two vectors
   */
  private l2Distance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }
  
  /**
   * Update per-dimension statistics (Welford's algorithm)
   */
  private updateStatistics(vector: number[], reward: number): void {
    for (let i = 0; i < vector.length; i++) {
      const stats = this.dimensionStats[i];
      
      stats.n++;
      const delta = reward - stats.mean;
      stats.mean += delta / stats.n;
      const delta2 = reward - stats.mean;
      stats.M2 += delta * delta2;
      
      if (stats.n > 1) {
        stats.variance = stats.M2 / (stats.n - 1);
      }
    }
  }
  
  /**
   * Generate final report
   */
  private async generateReport(): Promise<void> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`OPTIMIZATION COMPLETE`);
    console.log(`${'='.repeat(70)}\n`);
    
    console.log(`Final Results:`);
    console.log(`  Iterations: ${this.config.iterations}`);
    console.log(`  Candidates evaluated: ${this.history.length}`);
    console.log(`  Candidates skipped: ${this.skippedCandidates} (diversity/delta filters)`);
    console.log(`  API calls: ${this.apiCalls}`);
    console.log(`  Improvements kept: ${this.history.filter(h => h.kept).length}`);
    console.log(`  Credit efficiency: ${this.skippedCandidates > 0 ? `saved ~${(this.skippedCandidates * this.config.promptCount * 2 * 3 * 0.04).toFixed(2)}$` : 'N/A'}`);
    console.log();
    
    console.log(`Best Configuration:`);
    console.log(`  ${formatParams(this.bestParams)}`);
    console.log(`  Reward: ${this.bestReward >= 0 ? '+' : ''}${this.bestReward.toFixed(4)}`);
    console.log(`  ΔΩ: ${this.bestDelta.overall >= 0 ? '+' : ''}${this.bestDelta.overall.toFixed(4)}`);
    console.log(`  ΔR: ${this.bestDelta.rigor >= 0 ? '+' : ''}${this.bestDelta.rigor.toFixed(4)}`);
    console.log(`  ΔI: ${this.bestDelta.integration >= 0 ? '+' : ''}${this.bestDelta.integration.toFixed(4)}`);
    console.log();
    
    console.log(`Dimension Statistics (learned means):`);
    const paramNames = [
      'rigor.quant_min_numbers',
      'rigor.control_id_mode',
      'rigor.scenario_depth',
      'integration.flow_verbosity',
      'integration.constraints_density',
      'coherence.section_markers',
      'coherence.transitions_strength',
      'strictness.refusal_bias',
      'strictness.policy_callouts',
      'empathy.direct_address',
      'empathy.tone_stability',
      'examples.mode',
      'redundancy.compression',
      'header.preamble_profile'
    ];
    
    this.dimensionStats.forEach((stats, i) => {
      console.log(`  ${paramNames[i]}: μ=${stats.mean.toFixed(3)}, σ²=${stats.variance.toFixed(4)}, n=${stats.n}`);
    });
    
    console.log(`\n${'='.repeat(70)}\n`);
  }
  
  /**
   * Seeded PRNG for deterministic runs
   */
  private seedRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Save checkpoint to file
   */
  async saveCheckpoint(): Promise<string> {
    if (!this.config.checkpointDir) {
      throw new Error('checkpointDir not configured');
    }

    // Ensure directory exists
    await fs.mkdir(this.config.checkpointDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `param-opt-checkpoint-${timestamp}.json`;
    const filepath = `${this.config.checkpointDir}/${filename}`;

    const checkpoint = {
      config: this.config,
      bestParams: this.bestParams,
      bestReward: this.bestReward,
      bestDelta: this.bestDelta,
      bestVector: this.bestVector,
      history: this.history,
      dimensionStats: this.dimensionStats,
      apiCalls: this.apiCalls,
      skippedCandidates: this.skippedCandidates,
      recentVectors: this.recentVectors,
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(filepath, JSON.stringify(checkpoint, null, 2));
    this.emit('checkpoint', { path: filepath, iteration: this.history.length });

    return filepath;
  }

  /**
   * Load checkpoint from file
   */
  async loadCheckpoint(filepath: string): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8');
    const checkpoint = JSON.parse(content);

    this.bestParams = checkpoint.bestParams;
    this.bestReward = checkpoint.bestReward;
    this.bestDelta = checkpoint.bestDelta;
    this.bestVector = checkpoint.bestVector;
    this.history = checkpoint.history;
    this.dimensionStats = checkpoint.dimensionStats;
    this.apiCalls = checkpoint.apiCalls;
    this.skippedCandidates = checkpoint.skippedCandidates;
    this.recentVectors = checkpoint.recentVectors;

    console.log(`\n✅ Loaded checkpoint from: ${filepath}`);
    console.log(`   Iterations completed: ${this.history.length}/${this.config.iterations}`);
    console.log(`   Best reward: ${this.bestReward.toFixed(4)}`);
    console.log(`   API calls: ${this.apiCalls}`);
  }
}

