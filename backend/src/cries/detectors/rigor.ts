/**
 * CRIES v3 Rigor (R) Detector
 * Claim-evidence alignment, source attribution, structured reasoning, defensibility
 */

import type { ParsedResponse, SubMetricEvidence, CRIESEmbeddingAdapter } from '../schema.js';
import { mean, clamp01, safeDivide } from '../utils/determinism.js';
import { CITATION_WEIGHTS, STRUCTURE_MARKERS } from '../constants.js';

export interface RigorResult {
  score: number;
  subMetrics: Record<string, number>;
  evidence: Record<string, SubMetricEvidence>;
}

export async function computeRigorMetrics(
  parsed: ParsedResponse,
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<RigorResult> {
  const { claims, citations, sentences, response } = parsed;

  // R1: Claim-evidence alignment
  const claimSupport = await analyzeClaimSupport(claims, citations, embedding, seed);

  // R2: Source attribution quality
  const sourceAttribution = analyzeSourceAttribution(citations);

  // R3: Structured reasoning
  const structuredReasoning = detectStructuredReasoning(response, sentences);

  // R4: Defensibility
  const defensibility = assessDefensibility(claims, citations);

  const subMetrics = {
    claim_support_sem: claimSupport.score,
    source_attribution_quality: sourceAttribution.score,
    structured_reasoning: structuredReasoning.score,
    defensibility_sem: defensibility.score
  };

  const evidence = {
    claim_support_sem: claimSupport.evidence,
    source_attribution_quality: sourceAttribution.evidence,
    structured_reasoning: structuredReasoning.evidence,
    defensibility_sem: defensibility.evidence
  };

  return { score: mean(Object.values(subMetrics)), subMetrics, evidence };
}

async function analyzeClaimSupport(
  claims: string[],
  citations: ParsedResponse['citations'],
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<{ score: number; evidence: SubMetricEvidence }> {
  if (claims.length === 0) {
    return {
      score: 0.5,
      evidence: {
        inputs: { claims },
        computations: {},
        rawScore: 0.5,
        method: 'heuristic',
        insufficientEvidence: true,
        explanation: 'No claims found'
      }
    };
  }

  const supportedClaims = claims.filter(claim =>
    /according to|research|study|evidence|source/.test(claim.toLowerCase())
  );

  const score = clamp01(safeDivide(supportedClaims.length, claims.length));

  return {
    score,
    evidence: {
      inputs: { claims: claims.slice(0, 3), citationCount: citations.total },
      computations: { supportedClaims: supportedClaims.length },
      rawScore: score,
      method: 'hybrid',
      explanation: `${supportedClaims.length}/${claims.length} claims supported. Score: ${score.toFixed(4)}`
    }
  };
}

function analyzeSourceAttribution(citations: ParsedResponse['citations']): { score: number; evidence: SubMetricEvidence } {
  if (citations.total === 0) {
    return {
      score: 0.5,
      evidence: {
        inputs: { citations: [] },
        computations: {},
        rawScore: 0.5,
        method: 'heuristic',
        insufficientEvidence: true,
        explanation: 'No citations found'
      }
    };
  }

  let weightedScore = 0;
  for (const cite of citations.details) {
    if (cite.type === 'academic') weightedScore += CITATION_WEIGHTS.academic;
    else if (cite.type === 'named') weightedScore += CITATION_WEIGHTS.named;
    else weightedScore += CITATION_WEIGHTS.verbal;
  }

  const score = clamp01(safeDivide(weightedScore, citations.total));

  return {
    score,
    evidence: {
      inputs: { citationDetails: citations.details.slice(0, 5) },
      computations: { weightedScore, total: citations.total },
      rawScore: score,
      method: 'heuristic',
      explanation: `Weighted citation quality: ${score.toFixed(4)}`
    }
  };
}

function detectStructuredReasoning(response: string, sentences: string[]): { score: number; evidence: SubMetricEvidence } {
  let structureScore = 0;
  const features: string[] = [];

  if (STRUCTURE_MARKERS.lists.test(response)) { structureScore += 0.25; features.push('lists'); }
  if (STRUCTURE_MARKERS.steps.test(response)) { structureScore += 0.25; features.push('steps'); }
  if (STRUCTURE_MARKERS.sections.test(response)) { structureScore += 0.25; features.push('sections'); }
  if (STRUCTURE_MARKERS.conclusions.test(response)) { structureScore += 0.25; features.push('conclusions'); }

  return {
    score: clamp01(structureScore),
    evidence: {
      inputs: { responseLength: response.length },
      computations: { features },
      rawScore: structureScore,
      method: 'heuristic',
      explanation: `Detected structure features: ${features.join(', ')}. Score: ${structureScore.toFixed(4)}`
    }
  };
}

function assessDefensibility(claims: string[], citations: ParsedResponse['citations']): { score: number; evidence: SubMetricEvidence } {
  if (claims.length === 0) {
    return {
      score: 0.5,
      evidence: {
        inputs: {},
        computations: {},
        rawScore: 0.5,
        method: 'heuristic',
        insufficientEvidence: true,
        explanation: 'No claims to assess'
      }
    };
  }

  let defensibleScore = 0;
  for (const claim of claims) {
    if (citations.total > 0) defensibleScore += 0.8;
    else if (claim.length > 50) defensibleScore += 0.4;
    else defensibleScore += 0.2;
  }

  const score = clamp01(safeDivide(defensibleScore, claims.length));

  return {
    score,
    evidence: {
      inputs: { claims: claims.slice(0, 3) },
      computations: { defensibleScore },
      rawScore: score,
      method: 'heuristic',
      explanation: `Defensibility score: ${score.toFixed(4)}`
    }
  };
}
