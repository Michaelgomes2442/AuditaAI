/**
 * CRIES v4 Aggregator
 * 
 * Combines pillar scores using domain-specific weights to compute Omega
 */

import { Domain, CriesV4Result } from './types.js';
import { getDomainPolicy } from './classifier.js';

/**
 * Aggregate Omega from pillar scores
 * Ω = Σ w_i * pillar_i (domain-specific weighted sum)
 * 
 * @param domain - Classified domain
 * @param pillars - C, R, I, E, S scores
 * @returns Omega (weighted aggregate, with NaN guards)
 */
export function aggregateOmega(
  domain: Domain,
  pillars: { C: number; R: number; I: number; E: number; S: number }
): number {
  const policy = getDomainPolicy(domain);
  const { weights } = policy;
  
  // Guard against NaN values - log warnings and use 0.5 (neutral) as fallback
  const ensureValid = (score: number, pillarName: string): number => {
    if (typeof score !== 'number' || isNaN(score)) {
      console.warn(`⚠️  Pillar ${pillarName} is NaN, using 0.5 (neutral)`);
      return 0.5;
    }
    return Math.max(0, Math.min(1, score));
  };
  
  const C = ensureValid(pillars.C, 'C');
  const R = ensureValid(pillars.R, 'R');
  const I = ensureValid(pillars.I, 'I');
  const E = ensureValid(pillars.E, 'E');
  const S = ensureValid(pillars.S, 'S');
  
  // Weighted sum
  const omega = 
    weights.C * C +
    weights.R * R +
    weights.I * I +
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
