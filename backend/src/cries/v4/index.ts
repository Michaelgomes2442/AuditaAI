/**
 * CRIES v4 Main Orchestrator
 * 
 * Pure, honest scoring that rewards safe, structured, defensible answers
 * without synthetic boosts. Never penalizes governance for being thorough.
 */

import { CriesV4Result, CriesV4Context } from './types.js';
import { classifyDomain, needRefusal } from './classifier.js';
import { computeSignals } from './signals.js';
import { computePillars } from './pillars.js';
import { aggregateOmega } from './aggregate.js';
import { getDomainPolicy } from './classifier.js';

/**
 * Compute CRIES v4 for an LLM response
 * 
 * @param prompt - User's prompt text
 * @param response - LLM's response text
 * @param context - Optional context (governance status, metadata, etc.)
 * @returns Complete CRIES v4 result
 */
export function computeCriesV4(
  prompt: string,
  response: string,
  context: CriesV4Context = {}
): CriesV4Result {
  // Step 1: Classify domain
  const domain = classifyDomain(prompt);
  const policy = getDomainPolicy(domain);
  
  // Step 2: Determine if refusal is needed
  const refusalNeeded = needRefusal(prompt, domain);
  
  // Step 3: Compute signals (RQS, ALD, LCB, OverRefusal)
  const signals = computeSignals(prompt, response, domain, refusalNeeded);
  
  // Step 4: Compute pillars (C, R, I, E, S)
  const { C, R, I, E, S, components } = computePillars(
    prompt,
    response,
    domain,
    signals,
    refusalNeeded
  );
  
  // Step 5: Aggregate Omega (weighted sum)
  const Omega = aggregateOmega(domain, { C, R, I, E, S });
  
  // Step 6: Return complete result
  return {
    domain,
    C,
    R,
    I,
    E,
    S,
    Omega,
    weights: policy.weights,
    signals,
    components,
    version: 'CRIESv4',
    timestamp: new Date().toISOString()
  };
}

/**
 * Export all v4 components for advanced usage
 */
export { classifyDomain, needRefusal } from './classifier.js';
export { computeSignals, computeRQS, computeALD, computeLCB, detectOverRefusal } from './signals.js';
export { computePillars, scoreCoherence, scoreRigor, scoreIntegration, scoreEmpathy, scoreStrictness } from './pillars.js';
export { aggregateOmega } from './aggregate.js';
export type { CriesV4Result, CriesV4Signals, CriesV4Context, Domain, DomainPolicy, PillarComponents } from './types.js';
