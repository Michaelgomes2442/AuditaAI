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
  F: number; // Coherence -> FORGE F
  R: number; // Rigor -> FORGE R
  O: number; // Integration -> FORGE O
  G: number; // Empathy -> FORGE G
  E: number; // Strictness -> FORGE E
}

interface ObjectiveConfig {
  weights: {
    overall: number;
    R: number;
    O: number;
  };
  constraints: {
    F_min: number;   // ΔF must be >= this
    G_min: number;   // ΔG must be >= this
    E_min: number;   // ΔE must be >= this
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
    R: 1.5,
    O: 1.5
  },
  constraints: {
    F_min: -0.01,
    G_min: -0.01,
    E_min: -0.01
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
    config.weights.R * delta.R +
    config.weights.O * delta.O;

  // Coherence cliff protection (mapped to ΔF)
  if (delta.F < config.penalties.coherence_cliff_threshold) {
    console.log(`   🚨 Coherence cliff (ΔF=${delta.F.toFixed(4)}), capping reward at 0`);
    reward = Math.min(reward, 0);
  } else {
    // Coherence degradation penalty (if not cliff)
    const coherencePenalty = Math.max(0, -delta.F) * 0.5;
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
    delta.F >= config.constraints.F_min &&
    delta.G >= config.constraints.G_min &&
    delta.E >= config.constraints.E_min
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
  lines.push(`  Base: ${config.weights.overall * delta.overall + config.weights.R * delta.R + config.weights.O * delta.O >= 0 ? '+' : ''}${(config.weights.overall * delta.overall + config.weights.R * delta.R + config.weights.O * delta.O).toFixed(4)}`);
  lines.push(`    ΔΩ: ${delta.overall >= 0 ? '+' : ''}${delta.overall.toFixed(4)} × ${config.weights.overall} = ${(config.weights.overall * delta.overall).toFixed(4)}`);
  lines.push(`    ΔR: ${delta.R >= 0 ? '+' : ''}${delta.R.toFixed(4)} × ${config.weights.R} = ${(config.weights.R * delta.R).toFixed(4)}`);
  lines.push(`    ΔO: ${delta.O >= 0 ? '+' : ''}${delta.O.toFixed(4)} × ${config.weights.O} = ${(config.weights.O * delta.O).toFixed(4)}`);

  const coherencePenalty = delta.F < config.penalties.coherence_cliff_threshold ? 
    'CLIFF' : 
    `-${(Math.max(0, -delta.F) * 0.5).toFixed(4)}`;
  lines.push(`  Coherence penalty: ${coherencePenalty} (ΔF = ${delta.F >= 0 ? '+' : ''}${delta.F.toFixed(4)})`);
  
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
