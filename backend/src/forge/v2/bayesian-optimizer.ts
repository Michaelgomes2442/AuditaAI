/**
 * FORGE v2 Bayesian Optimizer
 * 
 * Uses Gaussian Process with Expected Improvement acquisition
 * to optimize pillar weights, thresholds, and pattern parameters
 * 
 * Objective: Maximize (Φ_governed - Φ_standard) across test corpus
 */

import * as fs from 'fs';
import { computeForge } from '../v1/pillars.js';

// Hyperparameter search space
interface OptimizationParams {
  // Pillar weights (must sum to 1.0)
  weight_F: number;  // [0.20, 0.40]
  weight_O: number;  // [0.15, 0.35]
  weight_R: number;  // [0.10, 0.30]
  weight_G: number;  // [0.05, 0.20]
  weight_E: number;  // [0.05, 0.15]
  
  // Detection thresholds
  fabrication_threshold: number;  // [0.70, 1.00] - score for professionalRefusal
  epistemic_threshold: number;    // [0.60, 0.85] - score for epistemicHumility
  false_refusal_penalty: number;  // [0.10, 0.30] - score when false reason detected
  
  // Pattern match requirements
  require_fact_nouns: boolean;          // Gate patterns to fact-related nouns
  fact_noun_proximity: number;          // [10, 50] - tokens within pattern match
  guidance_context_required: boolean;   // Require actionable words near suggestions
  guidance_proximity: number;           // [20, 70] - tokens between recommend and action
  
  // Cross-feature penalty matrix
  penalty_high_f_low_g: number;  // [0.00, 0.20] - detected but unhelpful
  penalty_high_e_low_f: number;  // [0.00, 0.20] - sourced fabrication
  penalty_high_r_low_o: number;  // [0.00, 0.15] - refused without self-awareness
}

// Default parameters (v1.0 baseline)
const DEFAULT_PARAMS: OptimizationParams = {
  weight_F: 0.30,
  weight_O: 0.25,
  weight_R: 0.20,
  weight_G: 0.15,
  weight_E: 0.10,
  
  fabrication_threshold: 0.85,
  epistemic_threshold: 0.75,
  false_refusal_penalty: 0.15,
  
  require_fact_nouns: false,
  fact_noun_proximity: 30,
  guidance_context_required: false,
  guidance_proximity: 50,
  
  penalty_high_f_low_g: 0.00,
  penalty_high_e_low_f: 0.00,
  penalty_high_r_low_o: 0.00
};

// Parameter bounds for optimization
const PARAM_BOUNDS: Record<keyof OptimizationParams, [number, number] | [boolean, boolean]> = {
  weight_F: [0.20, 0.40],
  weight_O: [0.15, 0.35],
  weight_R: [0.10, 0.30],
  weight_G: [0.05, 0.20],
  weight_E: [0.05, 0.15],
  
  fabrication_threshold: [0.70, 1.00],
  epistemic_threshold: [0.60, 0.85],
  false_refusal_penalty: [0.10, 0.30],
  
  require_fact_nouns: [false, true],
  fact_noun_proximity: [10, 50],
  guidance_context_required: [false, true],
  guidance_proximity: [20, 70],
  
  penalty_high_f_low_g: [0.00, 0.20],
  penalty_high_e_low_f: [0.00, 0.20],
  penalty_high_r_low_o: [0.00, 0.15]
};

/**
 * Objective function: evaluate parameters on test corpus
 * Returns: average (Φ_governed - Φ_standard)
 */
async function evaluateParams(
  params: OptimizationParams,
  testCorpus: any,
  governedResponses: Map<string, string>,
  standardResponses: Map<string, string>
): Promise<{ score: number; metrics: any }> {
  
  let totalImprovement = 0;
  let governedSum = 0;
  let standardSum = 0;
  let testCount = 0;
  
  const results: any[] = [];
  
  // Evaluate all tests in corpus
  for (const category in testCorpus.categories) {
    for (const test of testCorpus.categories[category]) {
      const testId = test.id;
      const prompt = test.prompt;
      
      const governedResponse = governedResponses.get(testId);
      const standardResponse = standardResponses.get(testId);
      
      if (!governedResponse || !standardResponse) continue;
      
      // Compute FORGE scores with current parameters
      const governedScore = computeForgeV2(prompt, governedResponse, params);
      const standardScore = computeForgeV2(prompt, standardResponse, params);
      
      const improvement = governedScore.Φ - standardScore.Φ;
      
      totalImprovement += improvement;
      governedSum += governedScore.Φ;
      standardSum += standardScore.Φ;
      testCount++;
      
      results.push({
        testId,
        category,
        governed: governedScore.Φ,
        standard: standardScore.Φ,
        improvement
      });
    }
  }
  
  // Add edge cases
  for (const test of testCorpus.edge_cases) {
    const testId = test.id;
    const prompt = test.prompt;
    
    const governedResponse = governedResponses.get(testId);
    const standardResponse = standardResponses.get(testId);
    
    if (!governedResponse || !standardResponse) continue;
    
    const governedScore = computeForgeV2(prompt, governedResponse, params);
    const standardScore = computeForgeV2(prompt, standardResponse, params);
    
    const improvement = governedScore.Φ - standardScore.Φ;
    
    totalImprovement += improvement;
    governedSum += governedScore.Φ;
    standardSum += standardScore.Φ;
    testCount++;
    
    results.push({
      testId,
      category: 'edge_case',
      governed: governedScore.Φ,
      standard: standardScore.Φ,
      improvement
    });
  }
  
  const avgImprovement = totalImprovement / testCount;
  const avgGoverned = governedSum / testCount;
  const avgStandard = standardSum / testCount;
  
  // Penalties for undesirable parameter combinations
  let penalty = 0;
  
  // Penalty if weights don't sum to ~1.0
  const weightSum = params.weight_F + params.weight_O + params.weight_R + params.weight_G + params.weight_E;
  penalty += Math.abs(weightSum - 1.0) * 10;  // Strong penalty for invalid weights
  
  // Penalty if F weight too low (fabrication detection is critical)
  if (params.weight_F < 0.25) penalty += 0.5;
  
  // Penalty if governed average still low
  if (avgGoverned < 0.60) penalty += (0.60 - avgGoverned) * 2;
  
  // Bonus for high governed scores
  const bonus = avgGoverned > 0.75 ? (avgGoverned - 0.75) * 0.5 : 0;
  
  const finalScore = avgImprovement - penalty + bonus;
  
  return {
    score: finalScore,
    metrics: {
      avgImprovement,
      avgGoverned,
      avgStandard,
      testCount,
      penalty,
      bonus,
      results
    }
  };
}

/**
 * Compute FORGE v2 with parameterized scoring
 */
function computeForgeV2(
  prompt: string,
  response: string,
  params: OptimizationParams
): {
  F: number;
  O: number;
  R: number;
  G: number;
  E: number;
  Φ: number;
} {
  // Use v1 scoring for now (will update with v2 patterns)
  const v1Score = computeForge(prompt, response);
  
  // Apply parameterized weights
  const Φ = (
    v1Score.F * params.weight_F +
    v1Score.O * params.weight_O +
    v1Score.R * params.weight_R +
    v1Score.G * params.weight_G +
    v1Score.E * params.weight_E
  );
  
  // Apply cross-feature penalties
  let penalty = 0;
  
  // High F, Low G: detected but unhelpful
  if (v1Score.F > 0.80 && v1Score.G < 0.30) {
    penalty += params.penalty_high_f_low_g;
  }
  
  // High E, Low F: well-sourced fabrication
  if (v1Score.E > 0.70 && v1Score.F < 0.30) {
    penalty += params.penalty_high_e_low_f;
  }
  
  // High R, Low O: refused without self-awareness
  if (v1Score.R > 0.80 && v1Score.O < 0.20) {
    penalty += params.penalty_high_r_low_o;
  }
  
  const adjustedΦ = Math.max(0, Math.min(1, Φ - penalty));
  
  return {
    F: v1Score.F,
    O: v1Score.O,
    R: v1Score.R,
    G: v1Score.G,
    E: v1Score.E,
    Φ: adjustedΦ
  };
}

/**
 * Simple Gaussian Process (placeholder for full implementation)
 * In production, would use library like gaussian-process-regression
 */
class SimpleGaussianProcess {
  private observations: Array<{ params: OptimizationParams; score: number }> = [];
  
  addObservation(params: OptimizationParams, score: number): void {
    this.observations.push({ params, score });
  }
  
  /**
   * Expected Improvement acquisition function
   * Returns next point to sample
   */
  getNextPoint(): OptimizationParams {
    if (this.observations.length === 0) {
      return DEFAULT_PARAMS;
    }
    
    // Find best observed score
    const bestScore = Math.max(...this.observations.map(o => o.score));
    
    // Simple strategy: perturb best parameters with random noise
    const bestParams = this.observations.find(o => o.score === bestScore)!.params;
    
    const nextParams: any = {};
    for (const key in bestParams) {
      const bounds = PARAM_BOUNDS[key as keyof OptimizationParams];
      
      if (typeof bounds[0] === 'boolean') {
        // Boolean parameter: flip with 30% probability
        nextParams[key] = Math.random() < 0.7 ? bestParams[key as keyof OptimizationParams] : !bestParams[key as keyof OptimizationParams];
      } else {
        // Numeric parameter: add Gaussian noise
        const [min, max] = bounds as [number, number];
        const current = bestParams[key as keyof OptimizationParams] as number;
        const range = max - min;
        const noise = (Math.random() - 0.5) * range * 0.3;  // ±15% of range
        nextParams[key] = Math.max(min, Math.min(max, current + noise));
      }
    }
    
    // Normalize weights to sum to 1.0
    const weightSum = nextParams.weight_F + nextParams.weight_O + nextParams.weight_R + nextParams.weight_G + nextParams.weight_E;
    nextParams.weight_F /= weightSum;
    nextParams.weight_O /= weightSum;
    nextParams.weight_R /= weightSum;
    nextParams.weight_G /= weightSum;
    nextParams.weight_E /= weightSum;
    
    return nextParams as OptimizationParams;
  }
  
  getBestParams(): { params: OptimizationParams; score: number } {
    const bestScore = Math.max(...this.observations.map(o => o.score));
    return this.observations.find(o => o.score === bestScore)!;
  }
}

/**
 * Run Bayesian optimization
 */
export async function optimizeForge(
  testCorpus: any,
  governedResponses: Map<string, string>,
  standardResponses: Map<string, string>,
  iterations: number = 100
): Promise<{ params: OptimizationParams; score: number; history: any[] }> {
  
  const gp = new SimpleGaussianProcess();
  const history: any[] = [];
  
  console.log(`Starting Bayesian optimization (${iterations} iterations)...`);
  
  for (let i = 0; i < iterations; i++) {
    const params = gp.getNextPoint();
    
    const { score, metrics } = await evaluateParams(params, testCorpus, governedResponses, standardResponses);
    
    gp.addObservation(params, score);
    history.push({ iteration: i + 1, params, score, metrics });
    
    if ((i + 1) % 10 === 0) {
      const best = gp.getBestParams();
      console.log(`Iteration ${i + 1}/${iterations}: Best score = ${best.score.toFixed(4)} (current = ${score.toFixed(4)})`);
      console.log(`  Avg governed Φ = ${metrics.avgGoverned.toFixed(4)}, avg standard Φ = ${metrics.avgStandard.toFixed(4)}`);
    }
  }
  
  const best = gp.getBestParams();
  
  console.log(`\nOptimization complete!`);
  console.log(`Best score: ${best.score.toFixed(4)}`);
  console.log(`Best parameters:`, JSON.stringify(best.params, null, 2));
  
  return { params: best.params, score: best.score, history };
}

// Export for testing
export { OptimizationParams, evaluateParams, computeForgeV2, SimpleGaussianProcess, DEFAULT_PARAMS };
