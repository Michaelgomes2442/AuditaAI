/**
 * CRIES v3 Coherence (C) Detector
 * Hybrid heuristic + semantic contradiction, flow, stability, reference checks
 */

import type { ParsedResponse, SubMetricEvidence, CRIESEmbeddingAdapter } from '../schema.js';
import {
  CONTRADICTION_PAIRS,
  LOGICAL_CONNECTORS,
  SEMANTIC_SIMILARITY_THRESHOLD,
  CONTRADICTION_THRESHOLD,
  NARRATIVE_STABILITY_MAX_VARIANCE,
  MAX_SENTENCE_PAIRS,
  SEMANTIC_WEIGHT,
  HEURISTIC_WEIGHT
} from '../constants.js';
import { SeededRNG, mean, variance, clamp01, safeDivide } from '../utils/determinism.js';

export interface CoherenceResult {
  score: number;
  subMetrics: Record<string, number>;
  evidence: Record<string, SubMetricEvidence>;
}

/**
 * Compute all Coherence sub-metrics
 */
export async function computeCoherenceMetrics(
  parsed: ParsedResponse,
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<CoherenceResult> {
  const { sentences } = parsed;

  // C1: Contradictions (semantic + heuristic hybrid)
  const contradictions = await detectContradictionsSem(sentences, embedding, seed);

  // C2: Logical flow (connectors + semantic adjacency)
  const logicalFlow = await analyzeLogicalFlow(sentences, embedding, seed);

  // C3: Narrative stability (semantic variance)
  const narrativeStability = await computeNarrativeStabilitySem(sentences, embedding, seed);

  // C4: Reference fidelity (pronoun consistency)
  const referenceFidelity = checkReferenceConsistency(parsed.response);

  const subMetrics = {
    contradictions_sem: contradictions.score,
    logical_flow: logicalFlow.score,
    narrative_stability_sem: narrativeStability.score,
    reference_fidelity: referenceFidelity.score
  };

  const evidence = {
    contradictions_sem: contradictions.evidence,
    logical_flow: logicalFlow.evidence,
    narrative_stability_sem: narrativeStability.evidence,
    reference_fidelity: referenceFidelity.evidence
  };

  const score = mean(Object.values(subMetrics));

  return { score, subMetrics, evidence };
}

/**
 * C1: Detect contradictions (hybrid semantic + heuristic)
 */
async function detectContradictionsSem(
  sentences: string[],
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<{ score: number; evidence: SubMetricEvidence }> {
  if (sentences.length < 2) {
    return {
      score: 0.5,
      evidence: {
        inputs: { sentences },
        computations: {},
        rawScore: 0.5,
        method: 'heuristic',
        insufficientEvidence: true,
        explanation: 'Less than 2 sentences, cannot detect contradictions'
      }
    };
  }

  const rng = new SeededRNG(seed);

  // Limit pairs to prevent O(n²) blowup
  let pairs: Array<[number, number]> = [];
  if (sentences.length * (sentences.length - 1) / 2 > MAX_SENTENCE_PAIRS) {
    // Sample pairs deterministically
    const allPairs: Array<[number, number]> = [];
    for (let i = 0; i < sentences.length - 1; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        allPairs.push([i, j]);
      }
    }
    pairs = rng.sample(allPairs, MAX_SENTENCE_PAIRS);
  } else {
    for (let i = 0; i < sentences.length - 1; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        pairs.push([i, j]);
      }
    }
  }

  // Compute embeddings
  const embeddings = await embedding.embed(sentences, { seed });

  // Semantic contradiction detection
  const similarities: number[] = [];
  const contradictionFlags: boolean[] = [];
  let semanticContradictions = 0;

  for (const [i, j] of pairs) {
    const sim = embedding.cosine(embeddings[i], embeddings[j]);
    similarities.push(sim);

    // High similarity + negation = contradiction
    const hasNegation = containsNegation(sentences[i]) !== containsNegation(sentences[j]);
    if (sim > CONTRADICTION_THRESHOLD && hasNegation) {
      semanticContradictions++;
      contradictionFlags.push(true);
    } else {
      contradictionFlags.push(false);
    }
  }

  // Heuristic contradiction detection
  let heuristicContradictions = 0;
  for (const [i, j] of pairs) {
    const sent1 = sentences[i].toLowerCase();
    const sent2 = sentences[j].toLowerCase();

    for (const [pos, neg] of CONTRADICTION_PAIRS) {
      if (pos.test(sent1) && neg.test(sent2)) {
        heuristicContradictions++;
        break;
      }
    }
  }

  // Hybrid score (blend semantic + heuristic)
  const semanticRate = safeDivide(semanticContradictions, pairs.length);
  const heuristicRate = safeDivide(heuristicContradictions, pairs.length);
  const blendedRate = SEMANTIC_WEIGHT * semanticRate + HEURISTIC_WEIGHT * heuristicRate;

  // Invert (higher contradictions = lower score)
  const score = clamp01(1 - blendedRate);

  return {
    score,
    evidence: {
      inputs: {
        sentences: sentences.slice(0, 5), // Sample for brevity
        pairCount: pairs.length
      },
      computations: {
        similarities: similarities.slice(0, 10),
        semanticContradictions,
        heuristicContradictions,
        blendedRate,
        thresholds: { contradiction: CONTRADICTION_THRESHOLD }
      },
      rawScore: score,
      method: 'hybrid',
      explanation: `Detected ${semanticContradictions} semantic + ${heuristicContradictions} heuristic contradictions across ${pairs.length} sentence pairs. Score: ${score.toFixed(4)}`
    }
  };
}

/**
 * Check if sentence contains negation
 */
function containsNegation(sentence: string): boolean {
  const negations = /\b(not|no|never|none|neither|nor|cannot|can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't)\b/i;
  return negations.test(sentence);
}

/**
 * C2: Analyze logical flow (connectors + semantic adjacency)
 */
async function analyzeLogicalFlow(
  sentences: string[],
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<{ score: number; evidence: SubMetricEvidence }> {
  if (sentences.length < 2) {
    return {
      score: 0.5,
      evidence: {
        inputs: { sentences },
        computations: {},
        rawScore: 0.5,
        method: 'heuristic',
        insufficientEvidence: true,
        explanation: 'Less than 2 sentences, cannot analyze flow'
      }
    };
  }

  // Heuristic: count logical connectors
  let connectorCount = 0;
  const connectorHits: string[] = [];
  for (const sentence of sentences) {
    for (const connector of LOGICAL_CONNECTORS) {
      if (connector.test(sentence)) {
        connectorCount++;
        const match = sentence.match(connector);
        if (match) connectorHits.push(match[0]);
        break;
      }
    }
  }
  const heuristicScore = Math.min(1.0, safeDivide(connectorCount, sentences.length));

  // Semantic: adjacent sentence similarity
  const embeddings = await embedding.embed(sentences, { seed });
  const adjacentSimilarities: number[] = [];
  for (let i = 0; i < sentences.length - 1; i++) {
    const sim = embedding.cosine(embeddings[i], embeddings[i + 1]);
    adjacentSimilarities.push(sim);
  }
  const semanticScore = mean(adjacentSimilarities);

  // Hybrid blend
  const score = clamp01(HEURISTIC_WEIGHT * heuristicScore + SEMANTIC_WEIGHT * semanticScore);

  return {
    score,
    evidence: {
      inputs: { sentences: sentences.slice(0, 5) },
      computations: {
        connectorCount,
        connectorHits: connectorHits.slice(0, 5),
        adjacentSimilarities: adjacentSimilarities.slice(0, 5),
        heuristicScore,
        semanticScore
      },
      rawScore: score,
      method: 'hybrid',
      explanation: `Found ${connectorCount} logical connectors (${heuristicScore.toFixed(2)}) and average adjacent similarity ${semanticScore.toFixed(2)}. Hybrid score: ${score.toFixed(4)}`
    }
  };
}

/**
 * C3: Narrative stability (semantic variance)
 */
async function computeNarrativeStabilitySem(
  sentences: string[],
  embedding: CRIESEmbeddingAdapter,
  seed: number
): Promise<{ score: number; evidence: SubMetricEvidence }> {
  if (sentences.length < 2) {
    return {
      score: 0.5,
      evidence: {
        inputs: { sentences },
        computations: {},
        rawScore: 0.5,
        method: 'semantic',
        insufficientEvidence: true,
        explanation: 'Less than 2 sentences, cannot compute stability'
      }
    };
  }

  const embeddings = await embedding.embed(sentences, { seed });

  // Compute pairwise similarities
  const similarities: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    const sim = embedding.cosine(embeddings[i], embeddings[i + 1]);
    similarities.push(sim);
  }

  // Variance penalty: higher variance = lower stability
  const varianceValue = variance(similarities);
  const normalizedVariance = Math.min(1.0, varianceValue / NARRATIVE_STABILITY_MAX_VARIANCE);
  const score = clamp01(1 - normalizedVariance);

  return {
    score,
    evidence: {
      inputs: { sentences: sentences.slice(0, 5) },
      computations: {
        similarities: similarities.slice(0, 10),
        variance: varianceValue,
        normalizedVariance,
        thresholds: { maxVariance: NARRATIVE_STABILITY_MAX_VARIANCE }
      },
      rawScore: score,
      method: 'semantic',
      explanation: `Semantic variance ${varianceValue.toFixed(4)} (normalized: ${normalizedVariance.toFixed(2)}). Stability score: ${score.toFixed(4)}`
    }
  };
}

/**
 * C4: Reference consistency (pronoun/entity tracking)
 */
function checkReferenceConsistency(response: string): { score: number; evidence: SubMetricEvidence } {
  const pronouns = ['he', 'she', 'it', 'they', 'this', 'that', 'these', 'those'];
  const tokens = response.toLowerCase().split(/\s+/);

  let totalRefs = 0;
  let consistentRefs = 0;
  const refHits: string[] = [];

  for (const token of tokens) {
    const cleaned = token.replace(/[^\w]/g, '');
    if (pronouns.includes(cleaned)) {
      totalRefs++;
      refHits.push(token);
      // Simple heuristic: assume consistency (could be enhanced with NER)
      consistentRefs++;
    }
  }

  const score = totalRefs > 0 ? clamp01(safeDivide(consistentRefs, totalRefs)) : 0.5;

  return {
    score,
    evidence: {
      inputs: { text: response.substring(0, 200) },
      computations: {
        totalRefs,
        consistentRefs,
        refHits: refHits.slice(0, 10)
      },
      rawScore: score,
      method: 'heuristic',
      insufficientEvidence: totalRefs === 0,
      explanation: totalRefs > 0
        ? `Found ${totalRefs} pronoun references, ${consistentRefs} consistent. Score: ${score.toFixed(4)}`
        : 'No pronoun references found, baseline score 0.5'
    }
  };
}
