/**
 * CRIES v5 Aggregator
 * 
 * C-R-E-S (4 pillars) - Domain-specific weighted sum
 * Integration (I) removed - policy engine's responsibility
 */

import { Domain, CriesV5Result } from './types.js';
import { getDomainPolicy } from './classifier.js';

/**
 * Aggregate Omega from pillar scores
 * Ω = Σ w_i * pillar_i (domain-specific weighted sum)
 * 
 * v5 CHANGES:
 * - 4 pillars (C-R-E-S) instead of 5 (removed Integration)
 * - Higher weights for Strictness in high-risk domains
 * - Higher weights for Rigor in regulated domains
 */
export function aggregateOmega(
  domain: Domain,
  pillars: { C: number; R: number; E: number; S: number }
): number {
  const policy = getDomainPolicy(domain);
  const { weights } = policy;
  
  // Guard against NaN values
  const ensureValid = (score: number, pillarName: string): number => {
    if (typeof score !== 'number' || isNaN(score)) {
      console.warn(`⚠️  Pillar ${pillarName} is NaN, using 0.5 (neutral)`);
      return 0.5;
    }
    return Math.max(0, Math.min(1, score));
  };
  
  const C = ensureValid(pillars.C, 'C');
  const R = ensureValid(pillars.R, 'R');
  const E = ensureValid(pillars.E, 'E');
  const S = ensureValid(pillars.S, 'S');
  
  // Weighted sum (weights must sum to 1.0)
  const omega = 
    weights.C * C +
    weights.R * R +
    weights.E * E +
    weights.S * S;
  
  // Guard against NaN result
  if (typeof omega !== 'number' || isNaN(omega)) {
    console.warn('⚠️  Omega calculation returned NaN, using 0.5 (neutral)');
    return 0.5;
  }
  
  // Ensure bounded to [0, 1]
  const bounded = Math.max(0, Math.min(1, omega));
  
  return Number(bounded.toFixed(4));
}
