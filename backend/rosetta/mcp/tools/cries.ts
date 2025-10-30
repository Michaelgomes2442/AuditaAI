/**
 * RosettaOS MCP CRIES Scoring Tool vΩ1.1
 * Phase 3: Deterministic CRIES metrics calculation
 * CRIES vΩ1.1: Coherence, Rigor, Integration, Empathy, Strictness
 */

import natural from 'natural';
import nlp from 'compromise';

const tokenizer = new natural.WordTokenizer();

export function criesScore(input: { text: string }) {
  const text = input.text?.trim() || "";
  if (!text) return defaultCRIES();

  const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
  const tokens = tokenizer.tokenize(text);

  // ----- 1. Coherence -----
  const tfidf = new natural.TfIdf();
  sentences.forEach(s => tfidf.addDocument(s));
  const mainTerms = tfidf.listTerms(0).slice(0, 3).map(t => t.term);

  const C = average(
    sentences.map(s => sentenceVector(s, mainTerms))
  );

  // ----- 2. Rigor -----
  const argumentMarkers = (text.match(/\b(because|therefore|thus|hence)\b/gi) || []).length;
  const numericCount = (text.match(/\b\d+(\.\d+)?\b/g) || []).length;
  const entities = nlp(text).topics().out('array').length;

  const R =
    0.4 * normalize(argumentMarkers, sentences.length) +
    0.3 * normalize(numericCount, tokens.length) +
    0.3 * normalize(entities, sentences.length);

  // ----- 3. Integration -----
  const linkTerms = (text.match(/\b(as stated|earlier|relates to|this section|previous)\b/gi) || []).length;
  const I = normalize(linkTerms, sentences.length);

  // ----- 4. Empathy -----
  const empathyMarkers =
    (text.match(/\b(I understand|reasonable|you might feel|makes sense)\b/gi) || []).length +
    (text.match(/\b(might|may|possibly)\b/gi) || []).length;

  const E = normalize(empathyMarkers, tokens.length);

  // ----- 5. Strictness -----
  const safety =
    (text.match(/\bcannot\b/gi) || []).length +
    (text.match(/\bnot allowed\b/gi) || []).length +
    (text.match(/\bI cannot assist\b/gi) || []).length;

  const uncertainty = (text.match(/\b(might|could|possibly|uncertain)\b/gi) || []).length;
  const overclaimPenalty = (text.match(/\b(100% guaranteed|certainly|absolutely)\b/gi) || []).length;

  const S =
    0.5 * normalize(safety, sentences.length) +
    0.3 * normalize(uncertainty, sentences.length) +
    0.2 * (1 - normalize(overclaimPenalty, sentences.length));

  return {
    C: round(C),
    R: round(R),
    I: round(I),
    E: round(E),
    S: round(S),
    avg: round((C + R + I + E + S) / 5)
  };
}

// ----- helpers -----
function sentenceVector(sentence: string, terms: string[]) {
  const tokens = sentence.toLowerCase().split(/\W+/);
  let matches = 0;
  terms.forEach(t => { if (tokens.includes(t)) matches++; });
  return matches / (terms.length || 1);
}

function normalize(num: number, base: number) {
  if (!base) return 0;
  return Math.min(num / base, 1);
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

function average(arr: number[]) {
  if (!arr.length) return 0;
  return round(arr.reduce((a,b) => a + b, 0) / arr.length);
}

function defaultCRIES() {
  return { C:0, R:0, I:0, E:0, S:0, avg:0 };
}