/**
 * RosettaOS MCP CRIES Scoring Tool
 * DEPRECATED: Use rosetta.criesv4.score instead
 * 
 * This legacy tool is maintained for backward compatibility only.
 * It now wraps CRIES v4 with the old API format.
 * 
 * Migration: Replace calls to rosetta.cries.score with rosetta.criesv4.score
 */

import { computeCriesV4 } from '../../../src/cries/v4/index.js';

/**
 * criesScore: Legacy CRIES evaluation wrapper (DEPRECATED)
 * @deprecated Use rosetta.criesv4.score instead
 * @param input { text: string, governanceMode?: string }
 * Returns { C, R, I, E, S, cries_score, weights, sub_metrics }
 */
export async function criesScore(input: { text: string, governanceMode?: string }) {
  const text = input.text?.trim() || "";
  if (!text) return { 
    C: 0, R: 0, I: 0, E: 0, S: 0, 
    cries_score: 0, 
    Omega: 0,
    weights: {}, 
    sub_metrics: {}, 
    avg: 0,
    deprecated: true,
    migration: 'Use rosetta.criesv4.score instead'
  };

  try {
    console.warn('[DEPRECATED] rosetta.cries.score is deprecated. Use rosetta.criesv4.score instead.');
    
    // Use CRIES v4 (production-ready, 98% accuracy)
    const result = await computeCriesV4("", text, {});

    // Convert v4 format to legacy format for backward compatibility
    return {
      C: result.C,
      R: result.R,
      I: result.I,
      E: result.E,
      S: result.S,
      cries_score: result.Omega, // Map Omega to legacy cries_score
      Omega: result.Omega,
      weights: result.weights,
      sub_metrics: {
        domain: result.domain,
        signals: result.signals,
        components: result.components
      },
      avg: result.Omega, // Backward compatibility
      version: 'v4-compat',
      deprecated: true,
      migration: 'Use rosetta.criesv4.score with { prompt, response } instead of { text }'
    };

  } catch (error: any) {
    console.error('CRIES v4 scoring failed (legacy wrapper):', error?.message || error);
    // Fallback to neutral scores
    return {
      C: 0.5,
      R: 0.5,
      I: 0.5,
      E: 0.5,
      S: 0.5,
      cries_score: 0.5,
      Omega: 0.5,
      weights: { C: 0.2, R: 0.25, I: 0.25, E: 0.15, S: 0.15 },
      sub_metrics: {},
      avg: 0.5,
      error: error?.message || 'Unknown error',
      deprecated: true
    };
  }
}