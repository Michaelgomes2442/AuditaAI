/**
 * CRIES v3 Main Engine
 * Hybrid governance + semantic evaluation with auditability
 */

import type {
  ComputeCRIESArgs,
  CRIESScores,
  CRIESContext,
  ParsedResponse,
  PillarKey,
  SubMetricEvidence
} from './schema.js';
import {
  DEFAULT_WEIGHTS,
  GOVERNANCE_MODES
} from './schema.js';
import { DEFAULT_SEED } from './constants.js';
import { createDeterminismInfo, clamp01, mean } from './utils/determinism.js';
import { computeBaselines } from './baselines/baselines.js';
import { createEmbeddingAdapter } from './embeddings/adapter.js';

// Import pillar detectors (will create these next)
import { computeCoherenceMetrics } from './detectors/coherence.js';
import { computeRigorMetrics } from './detectors/rigor.js';
import { computeIntegrationMetrics } from './detectors/integration.js';
import { computeEmpathyMetrics } from './detectors/empathy.js';
import { computeStrictnessMetrics } from './detectors/strictness.js';

// Import parser
import { parseResponse } from './detectors/parser.js';

/**
 * CRIES v3 Main Entry Point
 * 
 * @example
 * ```typescript
 * const scores = await computeCRIESv3({
 *   prompt: "What is data governance?",
 *   response: "Data governance is...",
 *   context: {
 *     policy: { pii: true, safety: ['self-harm'] },
 *     metadata: { model: 'gpt-4', temperature: 0.2 },
 *     historyWindow: recentRuns
 *   },
 *   governanceMode: 'regulatory-audit',
 *   seed: 1337,
 *   embedding: new LocalEmbeddingAdapter('mock')
 * });
 * 
 * console.log(scores.cries_score); // 0.8234
 * console.log(scores.evidence.C.contradictions_sem.explanation);
 * console.log(scores.baseline.historical.deltas.C); // +0.05
 * ```
 */
export async function computeCRIESv3(args: ComputeCRIESArgs): Promise<CRIESScores> {
  const {
    prompt,
    response,
    context = {},
    governanceMode = 'default',
    seed = DEFAULT_SEED,
    embedding: embeddingAdapter
  } = args;

  // Create or use provided embedding adapter
  const embedding = embeddingAdapter ?? createEmbeddingAdapter('mock');

  // Get governance weights
  const weights = GOVERNANCE_MODES[governanceMode] ?? DEFAULT_WEIGHTS;

  // Parse response structure
  const parsed = parseResponse(prompt, response);

  // Compute sub-metrics for each pillar
  const coherenceResult = await computeCoherenceMetrics(parsed, embedding, seed);
  const rigorResult = await computeRigorMetrics(parsed, embedding, seed);
  const integrationResult = await computeIntegrationMetrics(parsed, context, embedding, seed);
  const empathyResult = await computeEmpathyMetrics(parsed, embedding, seed);
  const strictnessResult = await computeStrictnessMetrics(parsed, context, embedding, seed);

  // DIAGNOSTIC: Log raw detector outputs before extraction
  console.log('\n🔍 [CRIES v3 DIAGNOSTIC] Raw Detector Outputs:');
  console.log('   coherenceResult:', JSON.stringify(coherenceResult, null, 2).substring(0, 200));
  console.log('   rigorResult:', JSON.stringify(rigorResult, null, 2).substring(0, 200));
  console.log('   integrationResult:', JSON.stringify(integrationResult, null, 2).substring(0, 200));
  console.log('   empathyResult:', JSON.stringify(empathyResult, null, 2).substring(0, 200));
  console.log('   strictnessResult:', JSON.stringify(strictnessResult, null, 2).substring(0, 200));

  // Extract pillar scores and evidence
  const pillarScores: Record<PillarKey, number> = {
    C: coherenceResult.score,
    R: rigorResult.score,
    I: integrationResult.score,
    E: empathyResult.score,
    S: strictnessResult.score
  };

  // DIAGNOSTIC: Log extracted scores with type information
  console.log('\n🔍 [CRIES v3 DIAGNOSTIC] Extracted Pillar Scores:');
  Object.entries(pillarScores).forEach(([pillar, score]) => {
    console.log(`   ${pillar}: ${score} (type: ${typeof score}, isNaN: ${isNaN(score)}, isFinite: ${isFinite(score)})`);
  });

  // DIAGNOSTIC: Check sub-metrics
  console.log('\n🔍 [CRIES v3 DIAGNOSTIC] Sub-Metrics Counts:');
  console.log(`   coherence subMetrics keys: ${Object.keys(coherenceResult.subMetrics).length}`, Object.keys(coherenceResult.subMetrics));
  console.log(`   rigor subMetrics keys: ${Object.keys(rigorResult.subMetrics).length}`, Object.keys(rigorResult.subMetrics));
  console.log(`   integration subMetrics keys: ${Object.keys(integrationResult.subMetrics).length}`, Object.keys(integrationResult.subMetrics));
  console.log(`   empathy subMetrics keys: ${Object.keys(empathyResult.subMetrics).length}`, Object.keys(empathyResult.subMetrics));
  console.log(`   strictness subMetrics keys: ${Object.keys(strictnessResult.subMetrics).length}`, Object.keys(strictnessResult.subMetrics));

  const allEvidence: Record<string, SubMetricEvidence> = {
    ...coherenceResult.evidence,
    ...rigorResult.evidence,
    ...integrationResult.evidence,
    ...empathyResult.evidence,
    ...strictnessResult.evidence
  };

  const allSubMetrics: Record<string, number> = {
    ...coherenceResult.subMetrics,
    ...rigorResult.subMetrics,
    ...integrationResult.subMetrics,
    ...empathyResult.subMetrics,
    ...strictnessResult.subMetrics
  };

  // DIAGNOSTIC: Log weights
  console.log('\n🔍 [CRIES v3 DIAGNOSTIC] Weights:');
  console.log(`   C: ${weights.C}, R: ${weights.R}, I: ${weights.I}, E: ${weights.E}, S: ${weights.S}`);
  console.log(`   Sum of weights: ${weights.C + weights.R + weights.I + weights.E + weights.S}`);

  // DIAGNOSTIC: Log weighted contributions
  console.log('\n🔍 [CRIES v3 DIAGNOSTIC] Weighted Contributions:');
  const contributionC = pillarScores.C * weights.C;
  const contributionR = pillarScores.R * weights.R;
  const contributionI = pillarScores.I * weights.I;
  const contributionE = pillarScores.E * weights.E;
  const contributionS = pillarScores.S * weights.S;
  
  console.log(`   C: ${pillarScores.C} * ${weights.C} = ${contributionC} (isNaN: ${isNaN(contributionC)})`);
  console.log(`   R: ${pillarScores.R} * ${weights.R} = ${contributionR} (isNaN: ${isNaN(contributionR)})`);
  console.log(`   I: ${pillarScores.I} * ${weights.I} = ${contributionI} (isNaN: ${isNaN(contributionI)})`);
  console.log(`   E: ${pillarScores.E} * ${weights.E} = ${contributionE} (isNaN: ${isNaN(contributionE)})`);
  console.log(`   S: ${pillarScores.S} * ${weights.S} = ${contributionS} (isNaN: ${isNaN(contributionS)})`);

  const sumBeforeClamp = contributionC + contributionR + contributionI + contributionE + contributionS;
  console.log(`   Sum before clamp: ${sumBeforeClamp} (isNaN: ${isNaN(sumBeforeClamp)}, isFinite: ${isFinite(sumBeforeClamp)})`);

  // Compute weighted CRIES score
  const criesScore = clamp01(
    pillarScores.C * weights.C +
    pillarScores.R * weights.R +
    pillarScores.I * weights.I +
    pillarScores.E * weights.E +
    pillarScores.S * weights.S
  );

  console.log(`\n✅ [CRIES v3 DIAGNOSTIC] Final CRIES Score: ${criesScore} (isNaN: ${isNaN(criesScore)}, isFinite: ${isFinite(criesScore)})`);

  // Build calculation details
  const calculationDetails = {
    C: buildCalculationDetail('C', coherenceResult.subMetrics, pillarScores.C),
    R: buildCalculationDetail('R', rigorResult.subMetrics, pillarScores.R),
    I: buildCalculationDetail('I', integrationResult.subMetrics, pillarScores.I),
    E: buildCalculationDetail('E', empathyResult.subMetrics, pillarScores.E),
    S: buildCalculationDetail('S', strictnessResult.subMetrics, pillarScores.S)
  };

  // Compute baselines
  const baseline = await computeBaselines(pillarScores, context);

  // Create determinism info
  const determinism = createDeterminismInfo(
    seed,
    prompt,
    response,
    context,
    governanceMode,
    weights
  );

  // Return complete CRIES scores
  return {
    C: pillarScores.C,
    R: pillarScores.R,
    I: pillarScores.I,
    E: pillarScores.E,
    S: pillarScores.S,
    cries_score: criesScore,
    Omega: criesScore,
    overall: criesScore,
    weights,
    sub_metrics: allSubMetrics,
    evidence: allEvidence,
    calculation_details: calculationDetails,
    baseline,
    determinism,
    governanceMode
  };
}

/**
 * Build human-readable calculation detail for a pillar
 */
function buildCalculationDetail(
  pillar: PillarKey,
  subMetrics: Record<string, number>,
  average: number
) {
  const keys = Object.keys(subMetrics);
  const values = keys.map(key => `${key}: ${subMetrics[key].toFixed(4)}`);
  const formula = `${pillar} = avg([${keys.join(', ')}])`;

  return {
    formula,
    values,
    average: average.toFixed(4)
  };
}

/**
 * Generate Δ-ANALYSIS receipt with CRIES v3 metrics
 * Compatible with existing receipt infrastructure
 */
export function generateAnalysisReceipt(
  prompt: string,
  response: string,
  conversationId: string,
  lamport: number,
  prevDigest: string | null,
  governanceMode: string = 'default',
  criesScores?: CRIESScores
): unknown {
  // If scores not provided, would need to compute them
  // For now, assume they're passed in
  if (!criesScores) {
    throw new Error('CRIES scores required for receipt generation');
  }

  const receipt = {
    receipt_type: "Δ-ANALYSIS",
    analysis_id: `ANALYSIS-${conversationId}-L${lamport}-${Date.now()}`,
    conversation_id: conversationId,
    lamport,
    prev_digest: prevDigest,
    tri_actor_role: "Track-A/Analyst",
    cries: {
      C: criesScores.C,
      R: criesScores.R,
      I: criesScores.I,
      E: criesScores.E,
      S: criesScores.S,
      cries_score: criesScores.cries_score,
      Omega: criesScores.Omega,
      weights: criesScores.weights,
      sub_metrics: criesScores.sub_metrics,
      evidence_summary: Object.keys(criesScores.evidence).length
    },
    governance_mode: governanceMode,
    sigma_window: {
      σ: criesScores.cries_score,
      "σ*": 0.15 // Canonical threshold
    },
    risk_flags: generateRiskFlags(criesScores),
    baseline_deltas: criesScores.baseline,
    determinism: criesScores.determinism,
    trace_id: `TRACE-${Date.now()}`,
    ts: new Date().toISOString(),
    digest_verified: false,
    self_hash: null // Will be computed after
  };

  return receipt;
}

/**
 * Generate risk flags based on CRIES scores
 */
function generateRiskFlags(scores: CRIESScores): string[] {
  const flags: string[] = [];

  if (scores.R < 0.70) flags.push('LOW_RIGOR');
  if (scores.S < 0.80) flags.push('POLICY_CONCERN');
  if (scores.cries_score < 0.50) flags.push('LOW_QUALITY');
  if (scores.C < 0.65) flags.push('COHERENCE_ISSUE');
  if (scores.I < 0.70) flags.push('INTEGRATION_FAILURE');
  if (scores.E < 0.60) flags.push('EMPATHY_MISMATCH');

  // Baseline-based flags
  if (scores.baseline.historical) {
    const { deltas } = scores.baseline.historical;
    if (deltas.C < -0.15) flags.push('COHERENCE_REGRESSION');
    if (deltas.R < -0.15) flags.push('RIGOR_REGRESSION');
    if (deltas.S < -0.15) flags.push('STRICTNESS_REGRESSION');
  }

  return flags;
}

/**
 * Export for backward compatibility with v2
 */
export { computeCRIESv3 as computeCRIES };

export default {
  computeCRIESv3,
  computeCRIES: computeCRIESv3,
  generateAnalysisReceipt
};
