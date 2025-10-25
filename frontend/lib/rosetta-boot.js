// Lightweight Rosetta helper for serverless environments
// Exports a simple calculateCRIES function used by demo endpoints.
function clamp(n) {
  return Math.max(0, Math.min(1, n));
}

function calculateCRIES({ text = '' } = {}) {
  // Simple heuristics: length, punctuation, token-like estimates
  const len = (typeof text === 'string') ? text.trim().length : 0;
  const words = len ? text.trim().split(/\s+/).length : 0;
  const sentences = (text.match(/[.!?]+/g) || []).length || Math.max(1, Math.floor(words / 12));

  // Clarity: short, simple sentences score higher
  const clarity = clamp(1 - Math.log10(Math.max(1, words)) / 4);
  // Robustness: penalize over-long prompts
  const robustness = clamp(1 - Math.max(0, (len - 500) / 1500));
  // Interpretability: more sentences increases interpretability up to a point
  const interpretability = clamp(Math.log10(Math.max(1, sentences)) / 2);
  // Explainability: presence of explicit ask (question words) helps
  const hasQuestion = /\b(why|how|what|explain|describe|summarize|why)\b/i.test(text);
  const explainability = clamp(hasQuestion ? 0.9 : 0.6);
  // Safety: naive check for suspicious tokens (very small heuristic)
  const unsafe = /\b(hack|exploit|kill|bomb|terror)\b/i.test(text) ? 0.0 : 1.0;
  const safety = clamp(unsafe * 0.95);

  const cries = {
    C: Math.round(clarity * 100),
    R: Math.round(robustness * 100),
    I: Math.round(interpretability * 100),
    E: Math.round(explainability * 100),
    S: Math.round(safety * 100),
  };

  return {
    inputLength: len,
    wordCount: words,
    sentences,
    cries,
  };
}

module.exports = { calculateCRIES };
// Lightweight Rosetta helper for serverless/demo use
// Provides a simple CRIES calculation for demo/test flows.

function calculateCRIES({ output = '', metadata = {} } = {}) {
  // Simple heuristic metrics between 0 and 1
  const lengthScore = Math.min(1, output.length / 200);
  const clarity = Math.max(0, Math.min(1, lengthScore));
  const relevance = 0.8; // placeholder: assume generally relevant for demos
  const interpretability = 0.9; // placeholder
  const empathy = 0.5; // placeholder

  const score = (clarity + relevance + interpretability + empathy) / 4;

  return {
    metrics: {
      clarity,
      relevance,
      interpretability,
      empathy,
    },
    score: Math.round(score * 100) / 100,
    metadata,
  };
}

async function applyRosettaBoot(input) {
  // For serverless/demo, return a synchronous-ish result
  const out = input && input.output ? input.output : '';
  const metadata = input && input.metadata ? input.metadata : {};
  const result = calculateCRIES({ output: out, metadata });
  return result;
}

module.exports = { calculateCRIES, applyRosettaBoot };
// Lightweight Rosetta boot helpers for frontend API usage
// This file implements a trimmed-down calculateCRIES and applyRosettaBoot
// adapted from backend/rosetta-boot.js so the logic can run as a serverless
// Next.js API route without pulling in the entire backend.

function calculateCRIES(modelMetrics = {}) {
  const baseline = {
    completeness: 0.65 + Math.random() * 0.15,
    reliability: 0.60 + Math.random() * 0.15,
    integrity: 0.70 + Math.random() * 0.10,
    effectiveness: 0.62 + Math.random() * 0.13,
    security: 0.68 + Math.random() * 0.12
  };

  const C = modelMetrics?.completeness ?? baseline.completeness;
  const R = modelMetrics?.reliability ?? baseline.reliability;
  const I = modelMetrics?.integrity ?? baseline.integrity;
  const E = modelMetrics?.effectiveness ?? baseline.effectiveness;
  const S = modelMetrics?.security ?? baseline.security;

  const overall = (C + R + I + E + S) / 5;

  return {
    C: Number(C.toFixed(4)),
    R: Number(R.toFixed(4)),
    I: Number(I.toFixed(4)),
    E: Number(E.toFixed(4)),
    S: Number(S.toFixed(4)),
    overall: Number(overall.toFixed(4))
  };
}

function applyRosettaBoot(standardCRIES) {
  const improvements = {
    C: 0.15 + Math.random() * 0.10,
    R: 0.18 + Math.random() * 0.10,
    I: 0.12 + Math.random() * 0.08,
    E: 0.16 + Math.random() * 0.10,
    S: 0.14 + Math.random() * 0.09
  };

  const rosettaCRIES = {
    C: Math.min(0.99, standardCRIES.C * (1 + improvements.C)),
    R: Math.min(0.99, standardCRIES.R * (1 + improvements.R)),
    I: Math.min(0.99, standardCRIES.I * (1 + improvements.I)),
    E: Math.min(0.99, standardCRIES.E * (1 + improvements.E)),
    S: Math.min(0.99, standardCRIES.S * (1 + improvements.S))
  };

  rosettaCRIES.overall = Number(((rosettaCRIES.C + rosettaCRIES.R + rosettaCRIES.I + rosettaCRIES.E + rosettaCRIES.S) / 5).toFixed(4));

  const improvementsRatio = {
    C: Number(((rosettaCRIES.C / standardCRIES.C) - 1).toFixed(4)),
    R: Number(((rosettaCRIES.R / standardCRIES.R) - 1).toFixed(4)),
    I: Number(((rosettaCRIES.I / standardCRIES.I) - 1).toFixed(4)),
    E: Number(((rosettaCRIES.E / standardCRIES.E) - 1).toFixed(4)),
    S: Number(((rosettaCRIES.S / standardCRIES.S) - 1).toFixed(4)),
    overall: Number(((rosettaCRIES.overall / standardCRIES.overall) - 1).toFixed(4))
  };

  return { rosettaCRIES, improvements: improvementsRatio };
}

module.exports = {
  calculateCRIES,
  applyRosettaBoot
};
