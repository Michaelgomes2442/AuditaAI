/**
 * Track-A (Analyst) — CRIES Computation Engine
 * 
 * Canonical implementation from Rosetta.html §2A
 * Lines: 15987-15998, 17657, 9338
 * 
 * Formulas:
 * - C (Coherence) = 0.6 * cosine_cohesion + 0.4 * topic_fit
 * - R (Rigor) = 0.5 * citation_ratio + 0.5 * step_coverage
 * - I (Integration) = 0.5 * xref_norm + 0.5 * goal_fit  
 * - E (Empathy) = empathy_fit(user_signal)
 * - S (Strictness) = 1 - (policy_violations / total_policies)
 * - Ω = 0.28*C + 0.20*R + 0.20*I + 0.16*E + 0.16*S
 */

import natural from 'natural';
import { cosineSimilarity } from './utils/vector-math.js';

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

/**
 * Compute CRIES metrics for an LLM response
 * @param {string} prompt - User's original prompt
 * @param {string} response - LLM's response text
 * @param {Object} context - Additional context (optional)
 * @returns {Object} CRIES metrics { C, R, I, E, S, Ω }
 */
export function computeCRIES(prompt, response, context = {}) {
  // Parse response into analyzable structure
  const analysis = analyzeResponse(prompt, response, context);
  
  // C - Coherence (Completeness)
  const C = computeCoherence(analysis);
  
  // R - Rigor (Reliability) 
  const R = computeRigor(analysis);
  
  // I - Integration (Integrity)
  const I = computeIntegration(analysis);
  
  // E - Empathy (Effectiveness)
  const E = computeEmpathy(analysis);
  
  // S - Strictness (Security)
  const S = computeStrictness(analysis);
  
  // Ω - Weighted composite (canonical weights)
  const Omega = 0.28 * C + 0.20 * R + 0.20 * I + 0.16 * E + 0.16 * S;
  
  return {
    C: parseFloat(C.toFixed(4)),
    R: parseFloat(R.toFixed(4)),
    I: parseFloat(I.toFixed(4)),
    E: parseFloat(E.toFixed(4)),
    S: parseFloat(S.toFixed(4)),
    Omega: parseFloat(Omega.toFixed(4))
  };
}

/**
 * Analyze response structure and extract features
 */
function analyzeResponse(prompt, response, context) {
  const promptTokens = tokenizer.tokenize(prompt.toLowerCase());
  const responseTokens = tokenizer.tokenize(response.toLowerCase());
  
  // Break response into sentences
  const sentences = response.match(/[^.!?]+[.!?]+/g) || [response];
  
  // Extract claims (sentences with assertions)
  const claims = sentences.filter(s => 
    /\b(is|are|was|were|will|can|should|must|according to|research shows|studies indicate)\b/i.test(s)
  );
  
  // Detect citations
  const citations = detectCitations(response);
  
  // Detect questions in prompt
  const promptQuestions = (prompt.match(/\?/g) || []).length;
  const promptKeyTerms = extractKeyTerms(prompt);
  
  // Detect response coverage
  const coveredTerms = promptKeyTerms.filter(term => 
    response.toLowerCase().includes(term.toLowerCase())
  );
  
  // Detect cross-references
  const xrefs = detectCrossReferences(response);
  
  // Detect policy violations
  const violations = detectPolicyViolations(response, context);
  
  return {
    prompt,
    response,
    promptTokens,
    responseTokens,
    sentences,
    claims,
    citations,
    promptQuestions,
    promptKeyTerms,
    coveredTerms,
    xrefs,
    violations,
    wordCount: responseTokens.length,
    sentenceCount: sentences.length
  };
}

/**
 * C (Coherence) = 0.6 * cosine_cohesion + 0.4 * topic_fit
 * 
 * Measures internal consistency and topic alignment
 */
function computeCoherence(analysis) {
  const { sentences, promptTokens, responseTokens, promptKeyTerms, coveredTerms } = analysis;
  
  // 1. Adjacent cosine cohesion (0.6 weight)
  let cosine_cohesion = 0;
  if (sentences.length > 1) {
    let totalSimilarity = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const sent1 = tokenizer.tokenize(sentences[i].toLowerCase());
      const sent2 = tokenizer.tokenize(sentences[i + 1].toLowerCase());
      const similarity = computeSentenceSimilarity(sent1, sent2);
      totalSimilarity += similarity;
    }
    cosine_cohesion = totalSimilarity / (sentences.length - 1);
  } else {
    cosine_cohesion = 0.7; // Single sentence default
  }
  
  // 2. Topic fit (0.4 weight)
  // How well does response cover prompt's key terms?
  const topic_fit = promptKeyTerms.length > 0
    ? coveredTerms.length / promptKeyTerms.length
    : 0.5;
  
  const C = 0.6 * cosine_cohesion + 0.4 * topic_fit;
  return Math.min(1.0, Math.max(0.0, C));
}

/**
 * R (Rigor) = 0.5 * citation_ratio + 0.5 * step_coverage
 * 
 * Measures evidentiary support and completeness
 * Math Canon vΩ.9: R := R0 − 0.30·unverified_citations_ratio − 0.10·fail_citation_count
 */
function computeRigor(analysis) {
  const { claims, citations, promptKeyTerms, coveredTerms } = analysis;
  
  // 1. Citation ratio (0.5 weight)
  const citation_ratio = claims.length > 0
    ? Math.min(1.0, citations.verified / claims.length)
    : 0.5; // Default if no claims
  
  // 2. Step coverage (0.5 weight)
  // How many required concepts/steps were addressed?
  const step_coverage = promptKeyTerms.length > 0
    ? coveredTerms.length / promptKeyTerms.length
    : 0.5;
  
  // Base rigor
  let R = 0.5 * citation_ratio + 0.5 * step_coverage;
  
  // Apply Math Canon vΩ.9 penalties for unverified citations
  if (citations.total > 0) {
    const unverified_ratio = citations.unverified / citations.total;
    const fail_normalized = citations.failed / Math.max(citations.total, 1);
    R = R - 0.30 * unverified_ratio - 0.10 * fail_normalized;
  }
  
  return Math.min(1.0, Math.max(0.0, R));
}

/**
 * I (Integration) = 0.5 * xref_norm + 0.5 * goal_fit
 * 
 * Measures logical consistency and goal alignment
 */
function computeIntegration(analysis) {
  const { xrefs, sentences, promptTokens, responseTokens } = analysis;
  
  // 1. Cross-reference density normalized (0.5 weight)
  const xref_norm = sentences.length > 0
    ? Math.min(1.0, xrefs.length / sentences.length)
    : 0.3;
  
  // 2. Goal fit (0.5 weight)
  // Does response directly address prompt intent?
  const goal_fit = computeGoalFit(analysis);
  
  const I = 0.5 * xref_norm + 0.5 * goal_fit;
  return Math.min(1.0, Math.max(0.0, I));
}

/**
 * E (Empathy) = empathy_fit(user_signal)
 * 
 * Measures response appropriateness to user affect/intent
 */
function computeEmpathy(analysis) {
  const { prompt, response, responseTokens } = analysis;
  
  let empathy_score = 0.5; // Baseline
  
  // Detect user sentiment/intent
  const isQuestion = prompt.includes('?');
  const isUrgent = /urgent|asap|quickly|immediate/i.test(prompt);
  const isFormal = /please|kindly|could you|would you/i.test(prompt);
  
  // Check response appropriateness
  if (isQuestion && response.includes('?')) {
    empathy_score += 0.1; // Acknowledges question format
  }
  
  if (isUrgent && responseTokens.length < 200) {
    empathy_score += 0.15; // Concise for urgent requests
  }
  
  if (isFormal && /thank|appreciate|understand/i.test(response)) {
    empathy_score += 0.1; // Matches formal tone
  }
  
  // Penalize overly terse or verbose responses
  if (responseTokens.length < 10) {
    empathy_score -= 0.2; // Too brief
  } else if (responseTokens.length > 1000) {
    empathy_score -= 0.1; // Potentially overwhelming
  }
  
  // Positive indicators
  if (/\b(I understand|let me explain|for example|specifically)\b/i.test(response)) {
    empathy_score += 0.15; // Explanatory tone
  }
  
  return Math.min(1.0, Math.max(0.0, empathy_score));
}

/**
 * S (Strictness) = 1 - (policy_violations / total_policies)
 * 
 * Measures policy compliance and safety
 */
function computeStrictness(analysis) {
  const { violations } = analysis;
  
  const total_policies = 10; // Standard policy count (configurable)
  
  // Guard: if zero policies, assume S=1 (canonical edge case)
  if (total_policies === 0) return 1.0;
  
  const S = 1 - (violations.length / total_policies);
  return Math.min(1.0, Math.max(0.0, S));
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Detect citations in response
 */
function detectCitations(text) {
  const patterns = {
    // Academic citations: [1], (Author, Year), doi:, http://
    academic: /\[\d+\]|\([A-Z][a-z]+,?\s+\d{4}\)|doi:|https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=]+/g,
    // Quoted sources: "according to", "research shows"
    verbal: /according to|research shows|studies indicate|experts say|evidence suggests/gi,
    // Named entities: proper nouns that might be sources
    named: /\b[A-Z][a-z]+\s+(University|Institute|Laboratory|Foundation|Organization)\b/g
  };
  
  const academicCites = (text.match(patterns.academic) || []).length;
  const verbalCites = (text.match(patterns.verbal) || []).length;
  const namedCites = (text.match(patterns.named) || []).length;
  
  const total = academicCites + verbalCites + namedCites;
  
  return {
    total,
    verified: academicCites, // Only explicit citations count as verified
    unverified: verbalCites + namedCites,
    failed: 0 // Would require external verification
  };
}

/**
 * Extract key terms from prompt
 */
function extractKeyTerms(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Filter out stop words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'this', 'that', 'these', 'those', 'can', 'could', 'would', 'should', 'do', 'does', 'did']);
  
  const keyTerms = tokens.filter(token => 
    !stopWords.has(token) && token.length > 3
  );
  
  // Return unique terms
  return [...new Set(keyTerms)];
}

/**
 * Detect cross-references (e.g., "as mentioned", "referring to", "see above")
 */
function detectCrossReferences(text) {
  const xrefPatterns = [
    /as mentioned/gi,
    /referring to/gi,
    /see above/gi,
    /previously|earlier|aforementioned/gi,
    /in summary|to summarize|in conclusion/gi
  ];
  
  const xrefs = [];
  xrefPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) xrefs.push(...matches);
  });
  
  return xrefs;
}

/**
 * Detect policy violations (harmful content, bias, misinformation)
 */
function detectPolicyViolations(text, context) {
  const violations = [];
  
  // Harmful content patterns
  const harmfulPatterns = [
    { pattern: /\b(kill|harm|attack|destroy)\b/gi, type: 'violence' },
    { pattern: /\b(steal|fraud|illegal|criminal)\b/gi, type: 'illegal_activity' },
    { pattern: /\b(racist|sexist|homophobic|discriminat)\w*/gi, type: 'discrimination' }
  ];
  
  harmfulPatterns.forEach(({ pattern, type }) => {
    if (pattern.test(text)) {
      violations.push({ type, severity: 'high' });
    }
  });
  
  // PII detection (emails, SSNs, phone numbers)
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) {
    violations.push({ type: 'pii_email', severity: 'medium' });
  }
  
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
    violations.push({ type: 'pii_ssn', severity: 'critical' });
  }
  
  return violations;
}

/**
 * Compute sentence similarity using Jaccard index
 */
function computeSentenceSimilarity(tokens1, tokens2) {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Compute goal fit (how well response addresses prompt intent)
 */
function computeGoalFit(analysis) {
  const { prompt, response, promptQuestions, sentences } = analysis;
  
  let goalScore = 0.5; // Baseline
  
  // If prompt asks questions, check if response provides answers
  if (promptQuestions > 0) {
    // Look for answer indicators
    const answerIndicators = /\b(yes|no|because|therefore|thus|the answer is|this means)\b/i;
    if (answerIndicators.test(response)) {
      goalScore += 0.2;
    }
  }
  
  // Check if response provides structure (lists, steps, examples)
  if (/\b(first|second|third|finally|step \d+|for example)\b/i.test(response)) {
    goalScore += 0.15;
  }
  
  // Check if response is actionable (provides instructions, recommendations)
  if (/\b(you can|you should|try|consider|recommend|suggest)\b/i.test(response)) {
    goalScore += 0.15;
  }
  
  return Math.min(1.0, Math.max(0.0, goalScore));
}

/**
 * Generate Δ-ANALYSIS receipt with CRIES metrics
 */
export function generateAnalysisReceipt(prompt, response, conversationId, lamport, prevDigest) {
  const cries = computeCRIES(prompt, response);
  
  const receipt = {
    receipt_type: "Δ-ANALYSIS",
    analysis_id: `ANALYSIS-${conversationId}-L${lamport}-${Date.now()}`,
    conversation_id: conversationId,
    lamport,
    prev_digest: prevDigest,
    tri_actor_role: "Track-A/Analyst",
    cries: {
      C: cries.C,
      R: cries.R,
      I: cries.I,
      E: cries.E,
      S: cries.S
    },
    sigma_window: {
      σ: cries.Omega,
      "σ*": 0.15 // Canonical threshold
    },
    risk_flags: [],
    trace_id: `TRACE-${Date.now()}`,
    ts: new Date().toISOString(),
    digest_verified: false,
    self_hash: null // Will be computed after
  };
  
  // Add risk flags based on metrics
  if (cries.R < 0.70) {
    receipt.risk_flags.push('LOW_RIGOR');
  }
  if (cries.S < 0.80) {
    receipt.risk_flags.push('POLICY_CONCERN');
  }
  if (cries.Omega < 0.50) {
    receipt.risk_flags.push('LOW_QUALITY');
  }
  
  return receipt;
}

export default {
  computeCRIES,
  generateAnalysisReceipt
};
