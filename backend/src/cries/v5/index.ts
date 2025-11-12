/**
 * CRIES v5 - Governance Quality Measurement System
 * 
 * C-R-E-S (4 pillars): Coherence, Rigor, Empathy, Strictness
 * NEW: Fabrication Score (FS) for hallucination detection
 * REMOVED: Integration (policy engine's job)
 * 
 * Usage:
 * ```typescript
 * import { computeCRIES } from './cries/v5/index.js';
 * 
 * const result = computeCRIES(prompt, response);
 * console.log(`Omega: ${result.omega}, FS: ${result.signals.fs}`);
 * ```
 */

import { Domain, CriesV5Result } from './types.js';
import { classifyDomain, needRefusal } from './classifier.js';
import { computeSignals } from './signals.js';
import { computePillars } from './pillars.js';
import { aggregateOmega } from './aggregate.js';

/**
 * Compute CRIES v5 analysis for a prompt-response pair
 * 
 * @param prompt - User's prompt text
 * @param response - LLM's response text
 * @param options - Optional configuration
 * @returns Complete CRIES v5 result with Omega, pillars, signals
 */
export function computeCRIES(
  prompt: string,
  response: string,
  options: {
    domain?: Domain;           // Override domain classification
    refusalNeeded?: boolean;   // Override refusal detection
  } = {}
): CriesV5Result {
  // 1. Domain classification
  const domain = options.domain || classifyDomain(prompt);
  
  // 2. Refusal detection
  const refusalNeeded = options.refusalNeeded !== undefined
    ? options.refusalNeeded
    : needRefusal(prompt, domain);
  
  // 3. Compute signals (including new FS)
  const signals = computeSignals(prompt, response, domain, refusalNeeded);
  
  // 4. Compute pillars (C-R-E-S)
  const pillarResult = computePillars(prompt, response, domain, signals, refusalNeeded);
  
  // 5. Aggregate Omega
  const omega = aggregateOmega(domain, {
    C: pillarResult.C,
    R: pillarResult.R,
    E: pillarResult.E,
    S: pillarResult.S
  });
  
  // 6. Return complete result
  return {
    omega,
    pillars: {
      C: pillarResult.C,
      R: pillarResult.R,
      E: pillarResult.E,
      S: pillarResult.S
    },
    signals,
    components: pillarResult.components,
    domain,
    metadata: {
      version: 'v5.0.0-governance',
      timestamp: new Date().toISOString(),
      promptLength: prompt.length,
      responseLength: response.length
    }
  };
}

/**
 * Batch compute CRIES for multiple responses
 * 
 * @param prompt - User's prompt text
 * @param responses - Array of LLM responses to analyze
 * @returns Array of CRIES results
 */
export function computeCRIESBatch(
  prompt: string,
  responses: string[]
): CriesV5Result[] {
  // Domain classification done once for all responses
  const domain = classifyDomain(prompt);
  const refusalNeeded = needRefusal(prompt, domain);
  
  return responses.map(response => 
    computeCRIES(prompt, response, { domain, refusalNeeded })
  );
}

/**
 * Compare two responses using CRIES v5
 * Returns detailed comparison with delta metrics
 */
export function compareCRIES(
  prompt: string,
  responseA: string,
  responseB: string,
  labels: { a: string; b: string } = { a: 'Response A', b: 'Response B' }
): {
  a: CriesV5Result;
  b: CriesV5Result;
  comparison: {
    omegaDelta: number;
    pillarDeltas: { C: number; R: number; E: number; S: number };
    signalDeltas: { fs: number; rqs: number; ald: number; lcb: number; overRefusal: number };
    winner: string;
  };
} {
  const a = computeCRIES(prompt, responseA);
  const b = computeCRIES(prompt, responseB);
  
  const omegaDelta = b.omega - a.omega;
  const pillarDeltas = {
    C: b.pillars.C - a.pillars.C,
    R: b.pillars.R - a.pillars.R,
    E: b.pillars.E - a.pillars.E,
    S: b.pillars.S - a.pillars.S
  };
  const signalDeltas = {
    fs: b.signals.fs - a.signals.fs,
    rqs: b.signals.rqs - a.signals.rqs,
    ald: b.signals.ald - a.signals.ald,
    lcb: b.signals.lcb - a.signals.lcb,
    overRefusal: b.signals.overRefusal - a.signals.overRefusal
  };
  
  const winner = omegaDelta > 0.01 ? labels.b : (omegaDelta < -0.01 ? labels.a : 'tie');
  
  return {
    a,
    b,
    comparison: {
      omegaDelta,
      pillarDeltas,
      signalDeltas,
      winner
    }
  };
}

// Export all types and utilities
export * from './types.js';
export { classifyDomain, getDomainPolicy, needRefusal } from './classifier.js';
export { computeSignals, computeFabricationScore } from './signals.js';
export { computePillars } from './pillars.js';
export { aggregateOmega } from './aggregate.js';
