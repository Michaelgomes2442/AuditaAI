/**
 * CRIES v3 Schema & Types
 * Canonical type definitions for hybrid governance evaluation
 */

export type GovernanceMode =
  | 'default'
  | 'regulatory-audit'
  | 'research'
  | 'safety-critical'
  | 'healthcare'
  | 'algorithmic-trading';

export type PillarKey = 'C' | 'R' | 'I' | 'E' | 'S';

/**
 * Embedding adapter interface - pluggable, deterministic
 */
export interface CRIESEmbeddingAdapter {
  /**
   * Embed texts to normalized unit vectors
   * @param texts - Array of text strings to embed
   * @param opts - Optional seed for determinism, model selection
   * @returns Promise of normalized embedding vectors (each unit length)
   */
  embed(texts: string[], opts?: { seed?: number; model?: string }): Promise<number[][]>;

  /**
   * Compute cosine similarity (pure function)
   * @param a - First normalized vector
   * @param b - Second normalized vector
   * @returns Cosine similarity [-1, 1]
   */
  cosine(a: number[], b: number[]): number;
}

/**
 * Context for CRIES evaluation
 */
export interface CRIESContext {
  /** Policy rules for Integration/Strictness checks */
  policy?: Record<string, unknown>;
  
  /** Model metadata (model name, temperature, etc.) */
  metadata?: Record<string, unknown>;
  
  /** Recent conversation history for baseline computation */
  historyWindow?: Array<{
    prompt: string;
    response: string;
    ts: string;
    cries?: Partial<CRIESScores>;
  }>;
  
  /** Control model name for comparative baseline */
  controlModelName?: string;
  
  /** Control model output (if available) */
  controlResponse?: string;
}

/**
 * Evidence artifact for a single sub-metric
 */
export interface SubMetricEvidence {
  /** Raw input data used */
  inputs: {
    sentences?: string[];
    constraints?: string[];
    policyKeys?: string[];
    citations?: unknown[];
    [key: string]: unknown;
  };
  
  /** Computed values (similarities, scores, hits) */
  computations: {
    similarities?: number[];
    regexHits?: string[];
    thresholds?: Record<string, number>;
    [key: string]: unknown;
  };
  
  /** Final normalized score before pillar averaging */
  rawScore: number;
  
  /** Method used (heuristic, semantic, hybrid) */
  method: 'heuristic' | 'semantic' | 'hybrid';
  
  /** Fallback flag if insufficient evidence */
  insufficientEvidence?: boolean;
  
  /** Human-readable explanation */
  explanation: string;
}

/**
 * Calculation details for a pillar
 */
export interface PillarCalculation {
  /** Formula string for audit */
  formula: string;
  
  /** Sub-metric values with names */
  values: string[];
  
  /** Final averaged pillar score */
  average: string;
}

/**
 * Baseline comparison results
 */
export interface BaselineComparison {
  /** Control model baseline (if available) */
  control?: {
    model: string;
    deltas: Record<PillarKey, number>;
    criesScoreDelta: number;
  };
  
  /** Historical baseline (if available) */
  historical?: {
    n: number;
    deltas: Record<PillarKey, number>;
    criesScoreDelta: number;
    windowStart: string;
    windowEnd: string;
  };
}

/**
 * Determinism tracking
 */
export interface DeterminismInfo {
  /** Seed used for all randomized operations */
  seed: number;
  
  /** SHA-256 hash of canonical input representation */
  hashInput: string;
  
  /** Timestamp of computation */
  computedAt: string;
}

/**
 * Complete CRIES v3 scores with evidence
 */
export interface CRIESScores {
  // Pillar scores [0,1]
  C: number;
  R: number;
  I: number;
  E: number;
  S: number;
  
  // Weighted total
  cries_score: number;
  Omega: number;        // Alias for cries_score
  overall: number;      // Alias for cries_score
  
  // Governance weights applied
  weights: Record<PillarKey, number>;
  
  // Sub-metric scores [0,1]
  sub_metrics: Record<string, number>;
  
  // Evidence artifacts per sub-metric
  evidence: Record<string, SubMetricEvidence>;
  
  // Calculation details per pillar (human-readable)
  calculation_details: Record<PillarKey, PillarCalculation>;
  
  // Baseline comparisons
  baseline: BaselineComparison;
  
  // Determinism info
  determinism: DeterminismInfo;
  
  // Governance mode applied
  governanceMode: GovernanceMode;
}

/**
 * Input arguments for computeCRIESv3
 */
export interface ComputeCRIESArgs {
  /** User prompt */
  prompt: string;
  
  /** LLM response to evaluate */
  response: string;
  
  /** Additional context */
  context?: CRIESContext;
  
  /** Governance mode for weight override */
  governanceMode?: GovernanceMode;
  
  /** Seed for deterministic randomness */
  seed?: number;
  
  /** Embedding adapter (required for v3 semantic features) */
  embedding?: CRIESEmbeddingAdapter;
}

/**
 * Governance weight configurations
 */
export const DEFAULT_WEIGHTS: Record<PillarKey, number> = {
  C: 0.20, // Coherence
  R: 0.25, // Rigor
  I: 0.25, // Integration
  E: 0.15, // Empathy
  S: 0.15  // Strictness
};

export const GOVERNANCE_MODES: Record<GovernanceMode, Record<PillarKey, number>> = {
  'default': DEFAULT_WEIGHTS,
  'regulatory-audit': { C: 0.15, R: 0.30, I: 0.25, E: 0.10, S: 0.20 },
  'research': { C: 0.25, R: 0.20, I: 0.30, E: 0.15, S: 0.10 },
  'safety-critical': { C: 0.15, R: 0.20, I: 0.20, E: 0.20, S: 0.25 },
  'healthcare': { C: 0.15, R: 0.20, I: 0.20, E: 0.20, S: 0.25 },
  'algorithmic-trading': { C: 0.20, R: 0.30, I: 0.30, E: 0.10, S: 0.10 }
};

/**
 * Parsed response structure
 */
export interface ParsedResponse {
  prompt: string;
  response: string;
  sentences: string[];
  claims: string[];
  citations: {
    total: number;
    verified: number;
    unverified: number;
    details: Array<{ type: string; text: string; position: number }>;
  };
  promptQuestions: number;
  promptKeyTerms: string[];
  coveredTerms: string[];
  violations: Array<{ type: string; severity: string; position?: number }>;
  wordCount: number;
  sentenceCount: number;
  paragraphs: string[];
}
