/**
 * CRIES Engine
 * Citation-based Research Integrity & Epistemic Score
 * 
 * Computes quality scores for AI interactions based on:
 * - σ (sigma) windows: Prompt quality analysis
 * - τ (tau) thresholds: Response coherence measurement
 * - Π (pi) policies: Governance rule compliance
 * - Citation quality: Reference integrity and coupling
 * 
 * Final CRIES Score: 0-100 composite metric
 */

import { PrismaClient } from '@/generated/prisma';
import { emitAnalysis } from './receipt-emitter';
import { incrementLamportCounter } from './lamport-counter';

const prisma = new PrismaClient();

export interface CRIESInput {
  prompt: string;
  response: string;
  citations?: string[];
  userId?: number;
  testResultId?: number;
  metadata?: Record<string, any>;
}

export interface CRIESScore {
  criesScore: number; // 0-100 final score
  sigmaWindow: number; // Prompt quality (0-100)
  tauThreshold: number; // Response coherence (0-100)
  piPolicy: number; // Policy compliance (0-100)
  citationQuality: number; // Citation integrity (0-100)
  breakdown: {
    promptClarity: number;
    promptSpecificity: number;
    responseRelevance: number;
    responseCoherence: number;
    policyAdherence: number;
    citationAccuracy: number;
  };
  violations: string[];
  recommendations: string[];
}

export interface CRIESComputation {
  id: number;
  criesScore: number;
  lamportClock: number;
  computedAt: Date;
  receiptId: number;
}

/**
 * Analyze prompt quality (σ-window)
 * Measures clarity, specificity, and structure of the prompt
 */
export function analyzeSigmaWindow(prompt: string): {
  score: number;
  clarity: number;
  specificity: number;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Clarity: Check for clear language, no ambiguity
  let clarity = 100;
  if (prompt.length < 10) {
    clarity -= 30;
    violations.push('Prompt too short (< 10 chars)');
  }
  if (prompt.length > 5000) {
    clarity -= 20;
    violations.push('Prompt too long (> 5000 chars)');
  }
  
  // Count question marks (indicates inquiry)
  const questionMarks = (prompt.match(/\?/g) || []).length;
  if (questionMarks === 0 && !prompt.match(/\b(explain|describe|analyze|tell)\b/i)) {
    clarity -= 15;
    violations.push('No clear question or directive');
  }
  
  // Specificity: Check for concrete details
  let specificity = 100;
  const hasNumbers = /\d/.test(prompt);
  const hasSpecificTerms = /\b(specific|exactly|precisely|particular)\b/i.test(prompt);
  const hasContext = prompt.split(/\s+/).length > 20;
  
  if (!hasNumbers && !hasSpecificTerms) {
    specificity -= 20;
    violations.push('Lacks specific details or constraints');
  }
  if (!hasContext) {
    specificity -= 15;
    violations.push('Insufficient context (< 20 words)');
  }
  
  const score = Math.max(0, Math.min(100, (clarity + specificity) / 2));
  
  return {
    score: Math.round(score),
    clarity: Math.round(clarity),
    specificity: Math.round(specificity),
    violations,
  };
}

/**
 * Analyze response coherence (τ-threshold)
 * Measures relevance, coherence, and structure of response
 */
export function analyzeTauThreshold(
  prompt: string,
  response: string
): {
  score: number;
  relevance: number;
  coherence: number;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Relevance: Check if response addresses prompt
  let relevance = 100;
  if (response.length < 50) {
    relevance -= 40;
    violations.push('Response too short (< 50 chars)');
  }
  
  // Extract key terms from prompt
  const promptTerms = prompt
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  
  // Count how many prompt terms appear in response
  const responseText = response.toLowerCase();
  const matchedTerms = promptTerms.filter((term) =>
    responseText.includes(term)
  );
  
  const termMatchRate = promptTerms.length > 0
    ? matchedTerms.length / promptTerms.length
    : 0;
  
  if (termMatchRate < 0.2) {
    relevance -= 30;
    violations.push('Low term overlap with prompt (< 20%)');
  }
  
  // Coherence: Check structure and flow
  let coherence = 100;
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  
  if (sentences.length < 2) {
    coherence -= 20;
    violations.push('Lacks sentence structure (< 2 sentences)');
  }
  
  // Check for logical connectors
  const hasConnectors = /\b(however|therefore|thus|because|since|although)\b/i.test(
    response
  );
  if (!hasConnectors && sentences.length > 3) {
    coherence -= 15;
    violations.push('Lacks logical connectors');
  }
  
  const score = Math.max(0, Math.min(100, (relevance + coherence) / 2));
  
  return {
    score: Math.round(score),
    relevance: Math.round(relevance),
    coherence: Math.round(coherence),
    violations,
  };
}

/**
 * Analyze policy compliance (Π-policy)
 * Checks adherence to governance rules
 */
export function analyzePiPolicy(
  prompt: string,
  response: string,
  policies?: string[]
): {
  score: number;
  adherence: number;
  violations: string[];
} {
  const violations: string[] = [];
  let adherence = 100;
  
  // Default policies
  const defaultPolicies = [
    { rule: 'no_harmful_content', pattern: /\b(hack|exploit|illegal|weapon)\b/i },
    { rule: 'no_personal_data', pattern: /\b(ssn|credit card|password)\b/i },
    { rule: 'professional_tone', pattern: /\b(fuck|shit|damn)\b/i },
  ];
  
  // Check prompt compliance
  for (const policy of defaultPolicies) {
    if (policy.pattern.test(prompt)) {
      adherence -= 20;
      violations.push(`Prompt violates ${policy.rule}`);
    }
  }
  
  // Check response compliance
  for (const policy of defaultPolicies) {
    if (policy.pattern.test(response)) {
      adherence -= 20;
      violations.push(`Response violates ${policy.rule}`);
    }
  }
  
  // Check for required disclaimers (if sensitive topic)
  const sensitiveTopic = /\b(medical|legal|financial)\b/i.test(prompt);
  const hasDisclaimer = /\b(disclaimer|not (a )?(doctor|lawyer|advisor))\b/i.test(
    response
  );
  
  if (sensitiveTopic && !hasDisclaimer) {
    adherence -= 15;
    violations.push('Sensitive topic lacks disclaimer');
  }
  
  const score = Math.max(0, Math.min(100, adherence));
  
  return {
    score: Math.round(score),
    adherence: Math.round(adherence),
    violations,
  };
}

/**
 * Analyze citation quality
 * Measures citation integrity and coupling
 */
export function analyzeCitationQuality(citations?: string[]): {
  score: number;
  accuracy: number;
  violations: string[];
} {
  const violations: string[] = [];
  
  if (!citations || citations.length === 0) {
    return {
      score: 50, // Neutral score if no citations
      accuracy: 50,
      violations: ['No citations provided'],
    };
  }
  
  let accuracy = 100;
  
  // Check citation format
  for (const citation of citations) {
    // Check for URL format
    const isUrl = /^https?:\/\/.+/.test(citation);
    const hasAuthor = /[A-Z][a-z]+,/.test(citation);
    const hasYear = /\b(19|20)\d{2}\b/.test(citation);
    
    if (!isUrl && !hasAuthor && !hasYear) {
      accuracy -= 20;
      violations.push(`Invalid citation format: ${citation.substring(0, 50)}`);
    }
  }
  
  // Penalize if too few citations
  if (citations.length < 2) {
    accuracy -= 15;
    violations.push('Insufficient citations (< 2)');
  }
  
  const score = Math.max(0, Math.min(100, accuracy));
  
  return {
    score: Math.round(score),
    accuracy: Math.round(accuracy),
    violations,
  };
}

/**
 * Compute final CRIES score
 * Weighted average of all components
 */
export function computeCRIESScore(input: CRIESInput): CRIESScore {
  const sigma = analyzeSigmaWindow(input.prompt);
  const tau = analyzeTauThreshold(input.prompt, input.response);
  const pi = analyzePiPolicy(input.prompt, input.response);
  const citation = analyzeCitationQuality(input.citations);
  
  // Weighted average:
  // σ-window: 25%
  // τ-threshold: 35%
  // Π-policy: 25%
  // Citation: 15%
  const criesScore = Math.round(
    sigma.score * 0.25 +
    tau.score * 0.35 +
    pi.score * 0.25 +
    citation.score * 0.15
  );
  
  // Collect all violations
  const violations = [
    ...sigma.violations,
    ...tau.violations,
    ...pi.violations,
    ...citation.violations,
  ];
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (sigma.score < 70) {
    recommendations.push('Improve prompt clarity and specificity');
  }
  if (tau.score < 70) {
    recommendations.push('Enhance response relevance and coherence');
  }
  if (pi.score < 70) {
    recommendations.push('Review policy compliance');
  }
  if (citation.score < 70) {
    recommendations.push('Add or improve citations');
  }
  
  return {
    criesScore,
    sigmaWindow: sigma.score,
    tauThreshold: tau.score,
    piPolicy: pi.score,
    citationQuality: citation.score,
    breakdown: {
      promptClarity: sigma.clarity,
      promptSpecificity: sigma.specificity,
      responseRelevance: tau.relevance,
      responseCoherence: tau.coherence,
      policyAdherence: pi.adherence,
      citationAccuracy: citation.accuracy,
    },
    violations,
    recommendations,
  };
}

/**
 * Compute and store CRIES score with receipt emission
 */
export async function computeAndStoreCRIES(
  input: CRIESInput
): Promise<CRIESComputation> {
  // Compute CRIES score
  const score = computeCRIESScore(input);
  
  // Increment Lamport counter
  const lamportIncrement = await incrementLamportCounter();
  
  // Store computation
  const computation = await prisma.cRIESComputation.create({
    data: {
      testResultId: input.testResultId,
      userId: input.userId,
      sigmaWindow: score.sigmaWindow,
      tauThreshold: score.tauThreshold,
      piPolicy: score.piPolicy,
      citationQuality: score.citationQuality,
      criesScore: score.criesScore,
      lamportClock: lamportIncrement.newValue,
      analysisData: {
        breakdown: score.breakdown,
        violations: score.violations,
        recommendations: score.recommendations,
        input: {
          promptLength: input.prompt.length,
          responseLength: input.response.length,
          citationCount: input.citations?.length || 0,
        },
      },
    },
  });
  
  // Emit Δ-ANALYSIS receipt
  const receipt = await emitAnalysis(input.userId || 1, {
    criesScore: score.criesScore,
    sigmaWindow: score.sigmaWindow,
    tauThreshold: score.tauThreshold,
    piPolicy: score.piPolicy,
    citationQuality: score.citationQuality,
    computationId: computation.id,
    lamportClock: lamportIncrement.newValue,
  });
  
  // Update computation with receipt ID
  await prisma.cRIESComputation.update({
    where: { id: computation.id },
    data: { receiptId: receipt.id },
  });
  
  return {
    id: computation.id,
    criesScore: computation.criesScore,
    lamportClock: computation.lamportClock,
    computedAt: computation.computedAt,
    receiptId: receipt.id,
  };
}

/**
 * Get CRIES computation history
 */
export async function getCRIESHistory(
  userId?: number,
  limit: number = 50
): Promise<any[]> {
  const computations = await prisma.cRIESComputation.findMany({
    where: userId ? { userId } : {},
    orderBy: { computedAt: 'desc' },
    take: limit,
  });
  
  return computations.map((c) => ({
    id: c.id,
    criesScore: c.criesScore,
    sigmaWindow: c.sigmaWindow,
    tauThreshold: c.tauThreshold,
    piPolicy: c.piPolicy,
    citationQuality: c.citationQuality,
    lamportClock: c.lamportClock,
    computedAt: c.computedAt,
    analysisData: c.analysisData,
  }));
}

/**
 * Get CRIES statistics
 */
export async function getCRIESStats(userId?: number): Promise<{
  totalComputations: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 90-100
    good: number; // 70-89
    fair: number; // 50-69
    poor: number; // 0-49
  };
  componentAverages: {
    sigma: number;
    tau: number;
    pi: number;
    citation: number;
  };
}> {
  const computations = await prisma.cRIESComputation.findMany({
    where: userId ? { userId } : {},
  });
  
  const totalComputations = computations.length;
  
  if (totalComputations === 0) {
    return {
      totalComputations: 0,
      averageScore: 0,
      scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
      componentAverages: { sigma: 0, tau: 0, pi: 0, citation: 0 },
    };
  }
  
  const averageScore =
    computations.reduce((sum, c) => sum + c.criesScore, 0) / totalComputations;
  
  const scoreDistribution = {
    excellent: computations.filter((c) => c.criesScore >= 90).length,
    good: computations.filter((c) => c.criesScore >= 70 && c.criesScore < 90).length,
    fair: computations.filter((c) => c.criesScore >= 50 && c.criesScore < 70).length,
    poor: computations.filter((c) => c.criesScore < 50).length,
  };
  
  const componentAverages = {
    sigma:
      computations.reduce((sum, c) => sum + c.sigmaWindow, 0) / totalComputations,
    tau:
      computations.reduce((sum, c) => sum + c.tauThreshold, 0) / totalComputations,
    pi: computations.reduce((sum, c) => sum + c.piPolicy, 0) / totalComputations,
    citation:
      computations.reduce((sum, c) => sum + c.citationQuality, 0) /
      totalComputations,
  };
  
  return {
    totalComputations,
    averageScore: Math.round(averageScore),
    scoreDistribution,
    componentAverages: {
      sigma: Math.round(componentAverages.sigma),
      tau: Math.round(componentAverages.tau),
      pi: Math.round(componentAverages.pi),
      citation: Math.round(componentAverages.citation),
    },
  };
}
