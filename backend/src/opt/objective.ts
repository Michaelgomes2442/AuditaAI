/**
 * Objective Function for Wrapper Optimization
 * 
 * Defines reward calculation and feasibility constraints.
 * 
 * Primary objectives: ΔΩ, ΔR, ΔI (governance impact)
 * Constraints: ΔC, ΔE, ΔS must not degrade significantly
 * Penalties: length, variance, coherence cliff
 */

interface Delta {
  overall: number;
  coherence: number;
  rigor: number;
  integration: number;
  empathy: number;
  strictness: number;
}

interface ObjectiveConfig {
  weights: {
    overall: number;
    rigor: number;
    integration: number;
  };
  constraints: {
    coherence_min: number;   // ΔC must be >= this
    empathy_min: number;     // ΔE must be >= this
    strictness_min: number;  // ΔS must be >= this
  };
  penalties: {
    length_soft_limit: number;
    length_hard_limit: number;
    length_penalty_strength: number;
    variance_penalty_strength: number;
    coherence_cliff_threshold: number;  // Cap reward if ΔC < this
  };
}

export const DEFAULT_OBJECTIVE_CONFIG: ObjectiveConfig = {
  weights: {
    overall: 1.0,
    rigor: 1.5,
    integration: 1.5
  },
  constraints: {
    coherence_min: -0.01,
    empathy_min: -0.01,
    strictness_min: -0.01
  },
  penalties: {
    length_soft_limit: 3000,
    length_hard_limit: 4000,
    length_penalty_strength: 0.2,
    variance_penalty_strength: 2.0,
    coherence_cliff_threshold: -0.04
  }
};

/**
 * Compute reward from evaluation result
 */
export function computeReward(
  delta: Delta,
  wrapperLength: number,
  variance: number,
  config: ObjectiveConfig = DEFAULT_OBJECTIVE_CONFIG
): number {
  // Base reward from primary objectives
  let reward = 
    config.weights.overall * delta.overall +
    config.weights.rigor * delta.rigor +
    config.weights.integration * delta.integration;
  
  // Coherence cliff protection
  if (delta.coherence < config.penalties.coherence_cliff_threshold) {
    console.log(`   🚨 Coherence cliff (Δ${delta.coherence.toFixed(4)}), capping reward at 0`);
    reward = Math.min(reward, 0);
  } else {
    // Coherence degradation penalty (if not cliff)
    const coherencePenalty = Math.max(0, -delta.coherence) * 0.5;
    reward -= coherencePenalty;
  }
  
  // Length penalty (soft quadratic)
  if (wrapperLength > config.penalties.length_soft_limit) {
    const overage = wrapperLength - config.penalties.length_soft_limit;
    const softRange = config.penalties.length_hard_limit - config.penalties.length_soft_limit;
    const lengthPenalty = Math.pow(overage / softRange, 2) * config.penalties.length_penalty_strength;
    reward -= lengthPenalty;
  }
  
  // Hard penalty for extreme bloat
  if (wrapperLength > config.penalties.length_hard_limit + 200) {
    const extremeBloatPenalty = 0.5;
    reward -= extremeBloatPenalty;
    console.log(`   🚨 Extreme bloat penalty: -${extremeBloatPenalty.toFixed(4)} (${wrapperLength} > ${config.penalties.length_hard_limit + 200})`);
  }
  
  // Variance penalty
  const variancePenalty = variance * config.penalties.variance_penalty_strength;
  reward -= variancePenalty;
  
  return reward;
}

/**
 * Check if result satisfies constraints (feasible solution)
 */
export function isFeasible(
  delta: Delta,
  config: ObjectiveConfig = DEFAULT_OBJECTIVE_CONFIG
): boolean {
  return (
    delta.coherence >= config.constraints.coherence_min &&
    delta.empathy >= config.constraints.empathy_min &&
    delta.strictness >= config.constraints.strictness_min
  );
}

/**
 * Format reward breakdown for logging
 */
export function formatRewardBreakdown(
  delta: Delta,
  wrapperLength: number,
  variance: number,
  reward: number,
  config: ObjectiveConfig = DEFAULT_OBJECTIVE_CONFIG
): string {
  const lines: string[] = [];
  
  lines.push(`Reward Breakdown:`);
  lines.push(`  Base: ${config.weights.overall * delta.overall + config.weights.rigor * delta.rigor + config.weights.integration * delta.integration >= 0 ? '+' : ''}${(config.weights.overall * delta.overall + config.weights.rigor * delta.rigor + config.weights.integration * delta.integration).toFixed(4)}`);
  lines.push(`    ΔΩ: ${delta.overall >= 0 ? '+' : ''}${delta.overall.toFixed(4)} × ${config.weights.overall} = ${(config.weights.overall * delta.overall).toFixed(4)}`);
  lines.push(`    ΔR: ${delta.rigor >= 0 ? '+' : ''}${delta.rigor.toFixed(4)} × ${config.weights.rigor} = ${(config.weights.rigor * delta.rigor).toFixed(4)}`);
  lines.push(`    ΔI: ${delta.integration >= 0 ? '+' : ''}${delta.integration.toFixed(4)} × ${config.weights.integration} = ${(config.weights.integration * delta.integration).toFixed(4)}`);
  
  const coherencePenalty = delta.coherence < config.penalties.coherence_cliff_threshold ? 
    'CLIFF' : 
    `-${(Math.max(0, -delta.coherence) * 0.5).toFixed(4)}`;
  lines.push(`  Coherence penalty: ${coherencePenalty} (ΔC = ${delta.coherence >= 0 ? '+' : ''}${delta.coherence.toFixed(4)})`);
  
  if (wrapperLength > config.penalties.length_soft_limit) {
    const overage = wrapperLength - config.penalties.length_soft_limit;
    const softRange = config.penalties.length_hard_limit - config.penalties.length_soft_limit;
    const lengthPenalty = Math.pow(overage / softRange, 2) * config.penalties.length_penalty_strength;
    lines.push(`  Length penalty: -${lengthPenalty.toFixed(4)} (${wrapperLength} chars)`);
  }
  
  lines.push(`  Variance penalty: -${(variance * config.penalties.variance_penalty_strength).toFixed(4)}`);
  lines.push(`  TOTAL REWARD: ${reward >= 0 ? '+' : ''}${reward.toFixed(4)}`);
  
  return lines.join('\n');
}
