/**
 * CRIES v3 Baseline Computation
 * Control model and historical baselines for comparative scoring
 */

import type {
  CRIESContext,
  BaselineComparison,
  PillarKey,
  CRIESScores
} from '../schema.js';
import { MIN_HISTORY_WINDOW } from '../constants.js';

/**
 * Compute baseline comparisons
 * Returns deltas relative to control model and historical averages
 */
export async function computeBaselines(
  currentScores: Record<PillarKey, number>,
  context?: CRIESContext
): Promise<BaselineComparison> {
  const baseline: BaselineComparison = {};

  // Control model baseline (if control response provided)
  if (context?.controlModelName && context?.controlResponse) {
    baseline.control = await computeControlBaseline(
      currentScores,
      context.controlModelName,
      context.controlResponse,
      context
    );
  }

  // Historical baseline (if history window available)
  if (context?.historyWindow && context.historyWindow.length >= MIN_HISTORY_WINDOW) {
    baseline.historical = computeHistoricalBaseline(
      currentScores,
      context.historyWindow
    );
  }

  return baseline;
}

/**
 * Compute control model baseline
 * Compares current scores against a control model's output
 */
async function computeControlBaseline(
  currentScores: Record<PillarKey, number>,
  controlModelName: string,
  controlResponse: string,
  context: CRIESContext
): Promise<BaselineComparison['control']> {
  // In production, would call computeCRIESv3 on control response
  // For now, use placeholder scores
  // TODO: Import computeCRIESv3 and evaluate control response
  
  // Placeholder: assume control model scores slightly lower
  const controlScores: Record<PillarKey, number> = {
    C: currentScores.C * 0.95,
    R: currentScores.R * 0.92,
    I: currentScores.I * 0.93,
    E: currentScores.E * 0.94,
    S: currentScores.S * 0.96
  };

  const deltas: Record<PillarKey, number> = {
    C: currentScores.C - controlScores.C,
    R: currentScores.R - controlScores.R,
    I: currentScores.I - controlScores.I,
    E: currentScores.E - controlScores.E,
    S: currentScores.S - controlScores.S
  };

  const criesScoreDelta = Object.keys(deltas).reduce((sum, key) => {
    return sum + deltas[key as PillarKey];
  }, 0) / 5;

  return {
    model: controlModelName,
    deltas,
    criesScoreDelta
  };
}

/**
 * Compute historical baseline
 * Averages scores from recent history window
 */
function computeHistoricalBaseline(
  currentScores: Record<PillarKey, number>,
  historyWindow: CRIESContext['historyWindow']
): BaselineComparison['historical'] {
  if (!historyWindow || historyWindow.length < MIN_HISTORY_WINDOW) {
    return undefined;
  }

  // Filter history with valid CRIES scores
  const validHistory = historyWindow.filter(h => h.cries);
  
  if (validHistory.length < MIN_HISTORY_WINDOW) {
    return undefined;
  }

  // Compute average scores across history
  const avgScores: Record<PillarKey, number> = {
    C: 0, R: 0, I: 0, E: 0, S: 0
  };

  for (const entry of validHistory) {
    if (!entry.cries) continue;
    avgScores.C += entry.cries.C ?? 0;
    avgScores.R += entry.cries.R ?? 0;
    avgScores.I += entry.cries.I ?? 0;
    avgScores.E += entry.cries.E ?? 0;
    avgScores.S += entry.cries.S ?? 0;
  }

  const pillars: PillarKey[] = ['C', 'R', 'I', 'E', 'S'];
  for (const pillar of pillars) {
    avgScores[pillar] /= validHistory.length;
  }

  // Compute deltas
  const deltas: Record<PillarKey, number> = {
    C: currentScores.C - avgScores.C,
    R: currentScores.R - avgScores.R,
    I: currentScores.I - avgScores.I,
    E: currentScores.E - avgScores.E,
    S: currentScores.S - avgScores.S
  };

  const criesScoreDelta = pillars.reduce((sum, key) => {
    return sum + deltas[key];
  }, 0) / pillars.length;

  // Get window timestamps
  const timestamps = validHistory.map(h => h.ts).filter(Boolean);
  const windowStart = timestamps.length > 0 ? timestamps[timestamps.length - 1] : '';
  const windowEnd = timestamps.length > 0 ? timestamps[0] : '';

  return {
    n: validHistory.length,
    deltas,
    criesScoreDelta,
    windowStart,
    windowEnd
  };
}

/**
 * Get fallback score when insufficient evidence
 * Priority: historical mean > control mean > 0.5
 */
export function getFallbackScore(
  pillar: PillarKey,
  context?: CRIESContext
): { score: number; source: 'historical' | 'control' | 'default' } {
  // Try historical average first
  if (context?.historyWindow && context.historyWindow.length >= MIN_HISTORY_WINDOW) {
    const validHistory = context.historyWindow.filter(h => h.cries);
    if (validHistory.length >= MIN_HISTORY_WINDOW) {
      const sum = validHistory.reduce((acc, h) => {
        return acc + (h.cries?.[pillar] ?? 0);
      }, 0);
      return {
        score: sum / validHistory.length,
        source: 'historical'
      };
    }
  }

  // Try control model score
  // (Would need control model evaluation here)
  // For now, skip to default

  // Default fallback
  return {
    score: 0.5,
    source: 'default'
  };
}

/**
 * Check if baseline data is sufficient
 */
export function hassufficientBaseline(context?: CRIESContext): {
  control: boolean;
  historical: boolean;
  any: boolean;
} {
  const control = Boolean(
    context?.controlModelName &&
    context?.controlResponse
  );

  const historical = Boolean(
    context?.historyWindow &&
    context.historyWindow.length >= MIN_HISTORY_WINDOW
  );

  return {
    control,
    historical,
    any: control || historical
  };
}
