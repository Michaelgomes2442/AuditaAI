/**
 * CRIES v3 Response Parser
 * Extracts structure and features from LLM responses
 */

import type { ParsedResponse } from '../schema.js';
import {
  CLAIM_INDICATORS,
  CITATION_PATTERNS,
  HARMFUL_PATTERNS,
  PII_PATTERNS,
  STOP_WORDS
} from '../constants.js';

/**
 * Parse response into analyzable structure
 */
export function parseResponse(prompt: string, response: string): ParsedResponse {
  // Tokenize
  const promptTokens = tokenize(prompt);
  const responseTokens = tokenize(response);

  // Extract sentences
  const sentences = extractSentences(response);
  
  // Extract paragraphs
  const paragraphs = response.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Extract claims (sentences with assertions)
  const claims = sentences.filter(s => CLAIM_INDICATORS.test(s));

  // Detect citations
  const citations = detectCitations(response);

  // Count questions in prompt
  const promptQuestions = (prompt.match(/\?/g) || []).length;

  // Extract key terms from prompt
  const promptKeyTerms = extractKeyTerms(prompt);

  // Find covered terms in response
  const coveredTerms = promptKeyTerms.filter(term =>
    response.toLowerCase().includes(term.toLowerCase())
  );

  // Detect policy violations
  const violations = detectPolicyViolations(response);

  return {
    prompt,
    response,
    sentences,
    claims,
    citations,
    promptQuestions,
    promptKeyTerms,
    coveredTerms,
    violations,
    wordCount: responseTokens.length,
    sentenceCount: sentences.length,
    paragraphs
  };
}

/**
 * Simple word tokenizer
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Extract sentences from text
 */
function extractSentences(text: string): string[] {
  // Split on sentence boundaries
  const raw = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Clean and filter
  return raw
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Detect citations in response
 */
function detectCitations(text: string) {
  const academic = (text.match(CITATION_PATTERNS.academic) || []);
  const verbal = (text.match(CITATION_PATTERNS.verbal) || []);
  const named = (text.match(CITATION_PATTERNS.named) || []);

  const details: Array<{ type: string; text: string; position: number }> = [];

  // Academic citations
  for (const match of academic) {
    const position = text.indexOf(match);
    details.push({ type: 'academic', text: match, position });
  }

  // Verbal citations
  for (const match of verbal) {
    const position = text.indexOf(match);
    details.push({ type: 'verbal', text: match, position });
  }

  // Named citations
  for (const match of named) {
    const position = text.indexOf(match);
    details.push({ type: 'named', text: match, position });
  }

  const verified = academic.length; // Only explicit citations count as verified
  const unverified = verbal.length + named.length;
  const total = verified + unverified;

  return {
    total,
    verified,
    unverified,
    details
  };
}

/**
 * Extract key terms from text
 */
function extractKeyTerms(text: string): string[] {
  const tokens = tokenize(text);
  
  // Filter stop words and short words
  const keyTerms = tokens.filter(token =>
    !STOP_WORDS.has(token) && token.length > 3
  );

  // Return unique terms
  return [...new Set(keyTerms)];
}

/**
 * Detect policy violations
 */
function detectPolicyViolations(text: string): Array<{ type: string; severity: string; position?: number }> {
  const violations: Array<{ type: string; severity: string; position?: number }> = [];

  // Check harmful content patterns
  for (const { pattern, type, severity } of HARMFUL_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      violations.push({
        type,
        severity,
        position: match.index
      });
    }
  }

  // Check PII patterns
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      violations.push({
        type: `pii_${type}`,
        severity: type === 'ssn' || type === 'creditCard' ? 'critical' : 'medium',
        position: match.index
      });
    }
  }

  return violations;
}
