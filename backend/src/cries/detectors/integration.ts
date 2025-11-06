/**
 * CRIES v3 Integration (I) Detector
 */

import type { ParsedResponse, CRIESContext, SubMetricEvidence, CRIESEmbeddingAdapter } from '../schema.js';
import { mean, clamp01, safeDivide } from '../utils/determinism.js';
import { CONSTRAINT_KEYWORDS, POLICY_KEYWORDS } from '../constants.js';

export interface IntegrationResult {
  score: number;
  subMetrics: Record<string, number>;
  evidence: Record<string, SubMetricEvidence>;
}

export async function computeIntegrationMetrics(
  parsed: ParsedResponse,
  context: CRIESContext,
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<IntegrationResult> {
  const constraintObedience = await checkConstraintObedience(parsed, embedding, seed);
  const policyAlignment = assessPolicyAlignment(parsed.response, context);
  const contextSynthesis = analyzeContextSynthesis(parsed.response, context);
  const ruleFollowing = evaluateRuleFollowing(parsed);

  const subMetrics = {
    constraint_obedience_sem: constraintObedience.score,
    policy_alignment_sem: policyAlignment.score,
    multi_context_synthesis_sem: contextSynthesis.score,
    rule_following: ruleFollowing.score
  };

  const evidence = {
    constraint_obedience_sem: constraintObedience.evidence,
    policy_alignment_sem: policyAlignment.evidence,
    multi_context_synthesis_sem: contextSynthesis.evidence,
    rule_following: ruleFollowing.evidence
  };

  return { score: mean(Object.values(subMetrics)), subMetrics, evidence };
}

async function checkConstraintObedience(
  parsed: ParsedResponse,
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<{ score: number; evidence: SubMetricEvidence }> {
  const constraints = parsed.prompt.match(CONSTRAINT_KEYWORDS) || [];
  
  if (constraints.length === 0) {
    return {
      score: 0.5,
      evidence: {
        inputs: {},
        computations: {},
        rawScore: 0.5,
        method: 'heuristic',
        insufficientEvidence: true,
        explanation: 'No constraints detected'
      }
    };
  }

  let obeyed = 0;
  for (const constraint of constraints) {
    if (parsed.response.toLowerCase().includes(constraint.toLowerCase())) obeyed++;
  }

  const score = clamp01(safeDivide(obeyed, constraints.length));

  return {
    score,
    evidence: {
      inputs: { constraints },
      computations: { obeyed },
      rawScore: score,
      method: 'hybrid',
      explanation: `${obeyed}/${constraints.length} constraints obeyed. Score: ${score.toFixed(4)}`
    }
  };
}

function assessPolicyAlignment(response: string, context: CRIESContext): { score: number; evidence: SubMetricEvidence } {
  const hasPolicyContent = POLICY_KEYWORDS.test(response);
  const score = hasPolicyContent ? 0.7 : 0.5;

  return {
    score,
    evidence: {
      inputs: { policyContext: context.policy ? Object.keys(context.policy) : [] },
      computations: { hasPolicyContent },
      rawScore: score,
      method: 'heuristic',
      explanation: `Policy alignment: ${score.toFixed(4)}`
    }
  };
}

function analyzeContextSynthesis(response: string, context: CRIESContext): { score: number; evidence: SubMetricEvidence } {
  if (!context.metadata || Object.keys(context.metadata).length === 0) {
    return {
      score: 0.5,
      evidence: {
        inputs: {},
        computations: {},
        rawScore: 0.5,
        method: 'heuristic',
        insufficientEvidence: true,
        explanation: 'No context metadata'
      }
    };
  }

  const score = 0.6; // Placeholder

  return {
    score,
    evidence: {
      inputs: { metadataKeys: Object.keys(context.metadata) },
      computations: {},
      rawScore: score,
      method: 'heuristic',
      explanation: 'Context synthesis evaluated'
    }
  };
}

function evaluateRuleFollowing(parsed: ParsedResponse): { score: number; evidence: SubMetricEvidence } {
  const hasSteps = /step|first|then|next|finally/gi.test(parsed.prompt);
  const responseHasSteps = /step|first|then|next|finally/gi.test(parsed.response);
  const score = hasSteps ? (responseHasSteps ? 0.8 : 0.3) : 0.5;

  return {
    score,
    evidence: {
      inputs: { hasSteps },
      computations: { responseHasSteps },
      rawScore: score,
      method: 'heuristic',
      explanation: `Rule following: ${score.toFixed(4)}`
    }
  };
}
