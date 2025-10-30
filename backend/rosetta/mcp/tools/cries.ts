/**
 * RosettaOS MCP CRIES Scoring Tool vΩ2.0
 * Updated to use canonical CRIES v2.0 with governance weights
 * CRIES: Coherence, Rigor, Integration, Empathy, Strictness
 */

import { computeCRIES } from '../../../src/track-a-analyzer.js';

/**
 * criesScore: Canonical CRIES evaluation using v2.0 formulas
 * @param input { text: string, governanceMode?: string }
 * Returns { C, R, I, E, S, cries_score, weights, sub_metrics }
 */
export async function criesScore(input: { text: string, governanceMode?: string }) {
  const text = input.text?.trim() || "";
  if (!text) return { C: 0, R: 0, I: 0, E: 0, S: 0, cries_score: 0, weights: {}, sub_metrics: {} };

  try {
    // Use canonical CRIES v2.0 computation
    const result = computeCRIES("", text, {}, input.governanceMode);

    return {
      C: result.C,
      R: result.R,
      I: result.I,
      E: result.E,
      S: result.S,
      cries_score: result.cries_score,
      weights: result.weights,
      sub_metrics: result.sub_metrics,
      avg: result.cries_score // Backward compatibility
    };

  } catch (error) {
    console.error('CRIES v2.0 scoring failed:', error.message);
    // Fallback to neutral scores
    return {
      C: 0.5,
      R: 0.5,
      I: 0.5,
      E: 0.5,
      S: 0.5,
      cries_score: 0.5,
      weights: { C: 0.2, R: 0.25, I: 0.25, E: 0.15, S: 0.15 },
      sub_metrics: {},
      avg: 0.5
    };
  }
}