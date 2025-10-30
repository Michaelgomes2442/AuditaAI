/**
 * RosettaOS MCP CRIES Scoring Tool vΩ1.1
 * Phase 3: Deterministic CRIES metrics calculation
 * CRIES vΩ1.1: Coherence, Rigor, Integration, Empathy, Strictness
 */

import natural from 'natural';
import nlp from 'compromise';

const tokenizer = new natural.WordTokenizer();


/**
 * criesScore Rosetta vΩ.8/9: Deterministic, windowed, citation-aware, clarifier-boosted
 * @param input { text, window?, citations? }
 * - text: string (required)
 * - window: {C,R,I,E,S}[] (optional, for σ window)
 * - citations: { total: number, unverified: number, failed: number } (optional)
 */
export function criesScore(input: {
  text: string,
  window?: Array<{C:number,R:number,I:number,E:number,S:number}>,
  citations?: { total: number, unverified: number, failed: number }
}) {
  const text = input.text?.trim() || "";
  if (!text) return defaultCRIES();

  // --- Windowed CRIES (σ window) ---
  const window = input.window || [];
  // --- Citation stats ---
  const citations = input.citations || { total: 0, unverified: 0, failed: 0 };

  // --- 1. Coherence (C):
  // Deterministic: # of logical transitions / total sentences, window boost
  const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
  const transitions = (text.match(/\b(then|next|thus|therefore|however|but|so|because|consequently|alternatively)\b/gi) || []).length;
  let C = sentences.length > 1 ? transitions / (sentences.length-1) : 1;
  // Window boost: if window provided, add 0.1 * avg(C) from window
  if (window.length) C = 0.9*C + 0.1*average(window.map(w=>w.C));

  // --- 2. Rigor (R): Math Canon vΩ.9
  // R = R0 − 0.30·unverified_citations_ratio − 0.10·fail_citation_count_normalized
  // R0: base rigor = # of evidence/argument markers per sentence
  const argMarkers = (text.match(/\b(because|evidence|study|data|proves|shows|demonstrates|according to|reference|cited|source|therefore|thus|hence)\b/gi) || []).length;
  let R0 = sentences.length ? argMarkers / sentences.length : 0;
  R0 = Math.min(R0, 1);
  let R = R0;
  if (citations.total > 0) {
    const unverifiedRatio = citations.unverified / citations.total;
    const failNorm = citations.failed / citations.total;
    R = R0 - 0.3*unverifiedRatio - 0.1*failNorm;
  }
  // Window boost
  if (window.length) R = 0.9*R + 0.1*average(window.map(w=>w.R));
  R = Math.max(0, Math.min(R, 1));

  // --- 3. Integration (I): # of explicit links, window boost
  const linkTerms = (text.match(/\b(as stated|earlier|relates to|this section|previous|see also|linked|integrates|combines|synthesizes|connects|together)\b/gi) || []).length;
  let I = sentences.length ? linkTerms / sentences.length : 0;
  if (window.length) I = 0.9*I + 0.1*average(window.map(w=>w.I));
  I = Math.min(I, 1);

  // --- 4. Empathy (E): # of empathy/hedge markers, window boost
  const empathyMarkers = (text.match(/\b(I understand|reasonable|you might feel|makes sense|consider|may|might|possibly|could|empathy|appreciate|aware|sensitive|respect)\b/gi) || []).length;
  let E = tokens(text).length ? empathyMarkers / tokens(text).length : 0;
  if (window.length) E = 0.9*E + 0.1*average(window.map(w=>w.E));
  E = Math.min(E, 1);

  // --- 5. Strictness (S): # of safety/precision markers, window boost
  const strictMarkers = (text.match(/\b(must|cannot|not allowed|prohibited|forbidden|required|precisely|exactly|strictly|no exceptions|I cannot assist)\b/gi) || []).length;
  let S = sentences.length ? strictMarkers / sentences.length : 0;
  if (window.length) S = 0.9*S + 0.1*average(window.map(w=>w.S));
  S = Math.min(S, 1);

  // --- σ window (Tri-Track Math Canon vΩ.8) ---
  // σᵗ = wA·σAᵗ + wB·σBᵗ + wC·σCᵗ,   wA+wB+wC=1,  defaults (0.4,0.4,0.2)
  // For Band-0, use CRIES as σA, σB, σC (or just avg)
  const sigma = 0.4*C + 0.4*R + 0.2*I;
  const omega = (C + R + I + E + S) / 5;

  // --- Clarifier proposal: if any metric < 0.7, propose clarifier
  const clarifierProposed = [C,R,I,E,S].some(x => x < 0.7);

  return {
    C: round(C),
    R: round(R),
    I: round(I),
    E: round(E),
    S: round(S),
    avg: round(omega),
    sigma: round(sigma),
    clarifierProposed
  };

// ----- helpers -----

function tokens(text: string) {
  return tokenizer.tokenize(text);
}



  return Math.round(n * 1000) / 1000;
}

  if (!arr.length) return 0;
  return round(arr.reduce((a,b) => a + b, 0) / arr.length);
}

  return { C:0, R:0, I:0, E:0, S:0, avg:0, sigma:0, clarifierProposed:false };
}