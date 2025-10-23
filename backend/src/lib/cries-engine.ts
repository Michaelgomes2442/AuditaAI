/**
 * CRIES Enforcement Engine - Enterprise Grade
 * 
 * Strict enforcement of CRIES (Completeness, Reliability, Integrity, Effectiveness, Security)
 * metrics per Rosetta Canonical Specification v14_R45b.
 * 
 * Math Canon vΩ.8: Tri-Track weighted aggregation
 * Math Canon vΩ.9: Citation quality coupling
 */

import crypto from 'crypto';
import canon from '../../config/rosetta-canonical.json';

// CRIES Component Definitions from Canon
interface CRIESComponent {
  label: string;
  value: number; // 0..1 range
  precision: number; // decimal places
  threshold_warning: number;
  threshold_block: number;
  computed_by: string; // Track-A, Track-B, or Track-C
}

export interface CRIES {
  C: number; // Completeness
  R: number; // Reliability
  I: number; // Integrity
  E: number; // Effectiveness
  S: number; // Security
}

export interface CRIESDetailed {
  C: CRIESComponent;
  R: CRIESComponent;
  I: CRIESComponent;
  E: CRIESComponent;
  S: CRIESComponent;
}

export interface Citation {
  id: string;
  text: string;
  source_url?: string;
  verified?: boolean; // true = verified, false = failed, undefined = unverified
  confidence?: number;
}

export interface Receipt {
  receipt_id: string;
  receipt_type: string;
  conversation_id: string;
  lamport: number;
  prev_digest: string | null;
  self_hash: string;
  timestamp: string;
  [key: string]: any;
}

export interface TriTrackWeights {
  wA: number; // Track-A (Analyst)
  wB: number; // Track-B (Governor)
  wC: number; // Track-C (Executor)
}

export class CRIESEngine {
  private canonSpec = canon.cries_specification.components;
  private mathCanon = canon.math_canon;

  /**
   * Track-A: Compute Completeness
   * 
   * Definition: Fraction of required information present in response
   * Measurement: count(required_elements_present) / count(required_elements_total)
   */
  computeCompleteness(prompt: string, response: string): number {
    const requiredElements = this.extractRequiredElements(prompt);
    
    if (requiredElements.length === 0) {
      // No specific requirements detected, assess general completeness
      return this.assessGeneralCompleteness(prompt, response);
    }

    const presentElements = this.checkPresence(requiredElements, response);
    const completeness = presentElements.length / requiredElements.length;

    return this.clampAndRound(completeness);
  }

  private extractRequiredElements(prompt: string): string[] {
    const elements: string[] = [];

    // Extract numbered requirements (1., 2., 3., etc.)
    const numberedMatches = prompt.match(/\d+\.\s+([^\n.]+)/g);
    if (numberedMatches) {
      elements.push(...numberedMatches.map(m => m.replace(/^\d+\.\s+/, '').trim()));
    }

    // Extract bullet points (-, *, •)
    const bulletMatches = prompt.match(/[•\-*]\s+([^\n.]+)/g);
    if (bulletMatches) {
      elements.push(...bulletMatches.map(m => m.replace(/^[•\-*]\s+/, '').trim()));
    }

    // Extract imperative verbs (analyze, explain, list, describe, etc.)
    const imperativeVerbs = ['analyze', 'explain', 'list', 'describe', 'summarize', 'compare', 'identify', 'evaluate'];
    const verbMatches = imperativeVerbs.filter(verb => 
      prompt.toLowerCase().includes(verb)
    );
    elements.push(...verbMatches);

    return [...new Set(elements)]; // Deduplicate
  }

  private checkPresence(requiredElements: string[], response: string): string[] {
    const responseLower = response.toLowerCase();
    return requiredElements.filter(element => {
      const elementLower = element.toLowerCase();
      // Check for presence of key terms or semantic similarity
      const keywords = elementLower.split(/\s+/).filter(w => w.length > 3);
      return keywords.some(keyword => responseLower.includes(keyword));
    });
  }

  private assessGeneralCompleteness(prompt: string, response: string): number {
    const promptLength = prompt.length;
    const responseLength = response.length;

    // Heuristic: Longer responses tend to be more complete
    // Expect response to be 1-3x prompt length for good completeness
    const lengthRatio = responseLength / promptLength;

    if (lengthRatio < 0.5) return 0.3; // Very brief response
    if (lengthRatio < 1.0) return 0.6; // Short response
    if (lengthRatio < 2.0) return 0.8; // Good length
    return 0.9; // Comprehensive response
  }

  /**
   * Track-A: Compute Reliability (Math Canon vΩ.9)
   * 
   * Definition: Citation quality + factual accuracy + source verification
   * Measurement: R0 − 0.30·unverified_citations_ratio − 0.10·fail_citation_count_normalized
   */
  computeReliability(response: string, citations: Citation[] = []): number {
    const R0 = this.mathCanon.v_omega_9.r0;
    const unverifiedPenalty = this.mathCanon.v_omega_9.coefficients.unverified_penalty;
    const failPenalty = this.mathCanon.v_omega_9.coefficients.fail_penalty;

    if (citations.length === 0) {
      // No citations provided, extract from response
      citations = this.extractCitations(response);
    }

    const totalCitations = citations.length;

    if (totalCitations === 0) {
      // No citations = moderate reliability (assumes general knowledge)
      return 0.7;
    }

    const unverifiedCitations = citations.filter(c => c.verified === undefined).length;
    const failedCitations = citations.filter(c => c.verified === false).length;

    const unverifiedRatio = unverifiedCitations / totalCitations;
    const failNormalized = failedCitations / totalCitations;

    const R = R0 - unverifiedPenalty * unverifiedRatio - failPenalty * failNormalized;

    return this.clampAndRound(R);
  }

  private extractCitations(response: string): Citation[] {
    const citations: Citation[] = [];

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = response.match(urlRegex) || [];
    urls.forEach((url, idx) => {
      citations.push({
        id: `cite-${idx}`,
        text: url,
        source_url: url,
        verified: undefined // Unverified by default
      });
    });

    // Extract reference markers ([1], [2], etc.)
    const refRegex = /\[(\d+)\]/g;
    const refs = response.match(refRegex) || [];
    refs.forEach((ref, idx) => {
      citations.push({
        id: `ref-${idx}`,
        text: ref,
        verified: undefined
      });
    });

    return citations;
  }

  /**
   * Track-B: Compute Integrity
   * 
   * Definition: Hash chain validity + receipt structure compliance + Lamport monotonicity
   * Measurement: binary(hash_valid) * binary(structure_valid) * binary(lamport_monotonic)
   */
  computeIntegrity(receipt: Receipt, prevReceipt: Receipt | null): number {
    const hashValid = this.verifyHash(receipt);
    const structureValid = this.verifyStructure(receipt);
    const lamportValid = this.verifyLamportMonotonicity(receipt, prevReceipt);

    // Binary: all must pass for 1.0, any failure = 0.0
    const integrity = (hashValid && structureValid && lamportValid) ? 1.0 : 0.0;

    return this.clampAndRound(integrity);
  }

  private verifyHash(receipt: Receipt): boolean {
    const { self_hash, ...receiptWithoutHash } = receipt;
    const calculatedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(receiptWithoutHash))
      .digest('hex');

    return self_hash === calculatedHash;
  }

  private verifyStructure(receipt: Receipt): boolean {
    const requiredFields = ['receipt_id', 'receipt_type', 'conversation_id', 'lamport', 'prev_digest', 'self_hash', 'timestamp'];
    return requiredFields.every(field => receipt[field] !== undefined && receipt[field] !== null);
  }

  private verifyLamportMonotonicity(receipt: Receipt, prevReceipt: Receipt | null): boolean {
    if (receipt.lamport === 0) {
      // Genesis receipt
      return prevReceipt === null && receipt.prev_digest === null;
    }

    if (!prevReceipt) {
      // Non-genesis but no previous receipt = invalid
      return false;
    }

    // Must be exactly prev.lamport + 1
    const monotonic = receipt.lamport === prevReceipt.lamport + 1;
    
    // Must link to previous hash
    const chainLinked = receipt.prev_digest === prevReceipt.self_hash;

    return monotonic && chainLinked;
  }

  /**
   * Track-C: Compute Effectiveness
   * 
   * Definition: Task completion + user intent alignment + actionability
   * Measurement: weighted_sum(task_completion, intent_match, actionable_output)
   */
  computeEffectiveness(prompt: string, response: string): number {
    const taskCompletion = this.assessTaskCompletion(prompt, response); // 0..1
    const intentMatch = this.assessIntentAlignment(prompt, response); // 0..1
    const actionability = this.assessActionability(response); // 0..1

    // Weighted: task completion is most important
    const effectiveness = taskCompletion * 0.5 + intentMatch * 0.3 + actionability * 0.2;

    return this.clampAndRound(effectiveness);
  }

  private assessTaskCompletion(prompt: string, response: string): number {
    // Check if response addresses the prompt
    const promptKeywords = this.extractKeywords(prompt);
    const responseKeywords = this.extractKeywords(response);

    const overlap = promptKeywords.filter(kw => responseKeywords.includes(kw));
    const coverage = overlap.length / Math.max(promptKeywords.length, 1);

    return coverage;
  }

  private assessIntentAlignment(prompt: string, response: string): number {
    // Detect intent type and check alignment
    const intentType = this.detectIntentType(prompt);

    switch (intentType) {
      case 'question':
        return response.includes('?') ? 0.9 : 0.7; // Questions should be answered
      case 'instruction':
        return response.length > 50 ? 0.8 : 0.5; // Instructions should produce substantial output
      case 'request':
        return response.toLowerCase().includes('here') || response.toLowerCase().includes('following') ? 0.9 : 0.6;
      default:
        return 0.7; // Default moderate alignment
    }
  }

  private assessActionability(response: string): number {
    // Check for actionable elements: steps, recommendations, next actions
    const actionableMarkers = [
      'step ', 'next ', 'should ', 'can ', 'will ', 'recommend', 'suggest',
      '1.', '2.', 'first', 'then', 'finally', 'action', 'todo'
    ];

    const markerCount = actionableMarkers.filter(marker => 
      response.toLowerCase().includes(marker)
    ).length;

    return Math.min(markerCount * 0.15, 1.0); // Cap at 1.0
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .match(/\b\w{4,}\b/g) || []; // Words 4+ characters
  }

  private detectIntentType(prompt: string): 'question' | 'instruction' | 'request' | 'unknown' {
    if (prompt.includes('?')) return 'question';
    if (/^(please |can you |could you |would you )/i.test(prompt)) return 'request';
    if (/^(create |build |make |generate |write |analyze )/i.test(prompt)) return 'instruction';
    return 'unknown';
  }

  /**
   * Track-B: Compute Security
   * 
   * Definition: PII leakage + prompt injection resistance + policy compliance
   * Measurement: 1.0 − (pii_leak_score + injection_score + policy_violation_score) / 3
   */
  computeSecurity(response: string, policies: any[] = []): number {
    const piiLeakScore = this.detectPIILeakage(response); // 0..1 (higher = more leakage)
    const injectionScore = this.detectPromptInjection(response); // 0..1 (higher = more injection)
    const policyViolationScore = this.checkPolicyViolations(response, policies); // 0..1 (higher = more violations)

    const security = 1.0 - ((piiLeakScore + injectionScore + policyViolationScore) / 3);

    return this.clampAndRound(security);
  }

  private detectPIILeakage(response: string): number {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{16}\b/g, // Credit card
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
    ];

    let piiCount = 0;
    piiPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) piiCount += matches.length;
    });

    // Normalize: more than 3 PII instances = max leakage
    return Math.min(piiCount / 3, 1.0);
  }

  private detectPromptInjection(response: string): number {
    const injectionPatterns = [
      /ignore (previous|above|all) (instructions?|commands?|prompts?)/gi,
      /forget (everything|all|previous)/gi,
      /new (instructions?|commands?|system prompt)/gi,
      /<script>/gi,
      /eval\(/gi,
    ];

    let injectionCount = 0;
    injectionPatterns.forEach(pattern => {
      if (pattern.test(response)) injectionCount++;
    });

    // Normalize: any injection pattern = high risk
    return injectionCount > 0 ? 0.8 : 0.0;
  }

  private checkPolicyViolations(response: string, policies: any[]): number {
    // Placeholder: implement actual policy checking
    // For now, return 0 (no violations)
    return 0.0;
  }

  /**
   * Math Canon vΩ.8: Tri-Track Weighted Aggregation
   * 
   * Formula: σᵗ = wA·σAᵗ + wB·σBᵗ + wC·σCᵗ
   * Constraint: wA + wB + wC = 1
   */
  computeSigma(
    criesA: CRIES,
    criesB: CRIES,
    criesC: CRIES,
    weights: TriTrackWeights = { wA: 0.4, wB: 0.4, wC: 0.2 }
  ): number {
    // Aggregate each track's CRIES to single sigma value
    const sigmaA = this.aggregateCRIES(criesA);
    const sigmaB = this.aggregateCRIES(criesB);
    const sigmaC = this.aggregateCRIES(criesC);

    // Verify weights sum to 1.0
    const weightSum = weights.wA + weights.wB + weights.wC;
    if (Math.abs(weightSum - 1.0) > 0.001) {
      throw new Error(`Tri-Track weights must sum to 1.0 (got ${weightSum})`);
    }

    // Weighted aggregation
    const sigma = weights.wA * sigmaA + weights.wB * sigmaB + weights.wC * sigmaC;

    return this.clampAndRound(sigma);
  }

  private aggregateCRIES(cries: CRIES): number {
    // Simple average of all 5 components
    const sum = cries.C + cries.R + cries.I + cries.E + cries.S;
    return sum / 5;
  }

  /**
   * Math Canon vΩ.8: Omega Update Rule
   * 
   * Formula: Ωᵗ⁺¹ = Ωᵗ + η·Δclarity − γB·max(0, σᵗ − σ*)
   * Parameters: η = 0.1, γB = 0.15, σ* = 0.15
   */
  updateOmega(
    omegaCurrent: number,
    deltaClarity: number,
    sigma: number,
    sigmaStar: number = 0.15,
    eta: number = 0.1,
    gammaB: number = 0.15
  ): number {
    const penalty = Math.max(0, sigma - sigmaStar);
    const omegaNext = omegaCurrent + eta * deltaClarity - gammaB * penalty;

    return this.clampAndRound(omegaNext);
  }

  /**
   * Full CRIES Computation (All 5 Components)
   */
  computeFullCRIES(
    prompt: string,
    response: string,
    receipt: Receipt,
    prevReceipt: Receipt | null,
    citations: Citation[] = [],
    policies: any[] = []
  ): CRIES {
    return {
      C: this.computeCompleteness(prompt, response),
      R: this.computeReliability(response, citations),
      I: this.computeIntegrity(receipt, prevReceipt),
      E: this.computeEffectiveness(prompt, response),
      S: this.computeSecurity(response, policies),
    };
  }

  /**
   * Check CRIES Thresholds (Z-Scan v4)
   */
  checkThresholds(cries: CRIES): { warnings: string[]; blocks: string[] } {
    const warnings: string[] = [];
    const blocks: string[] = [];

    Object.entries(cries).forEach(([component, value]) => {
      const spec = this.canonSpec[component];
      if (!spec) return;

      if (value < spec.threshold_block) {
        blocks.push(`${component} (${spec.label}): ${value.toFixed(4)} < ${spec.threshold_block} (BLOCK)`);
      } else if (value < spec.threshold_warning) {
        warnings.push(`${component} (${spec.label}): ${value.toFixed(4)} < ${spec.threshold_warning} (WARNING)`);
      }
    });

    return { warnings, blocks };
  }

  /**
   * Utility: Clamp to [0, 1] and round to 4 decimal places
   */
  private clampAndRound(value: number): number {
    const clamped = Math.max(0, Math.min(1, value));
    return parseFloat(clamped.toFixed(4));
  }
}

// Export singleton instance
export const criesEngine = new CRIESEngine();
