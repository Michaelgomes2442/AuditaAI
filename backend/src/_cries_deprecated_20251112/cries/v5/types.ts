/**
 * CRIES v5 Type Definitions
 * 
 * C-R-E-S (4 pillars) - Integration removed (policy engine's job)
 * New: Fabrication Score (FS) for hallucination detection
 */

/**
 * Domain classification
 */
export type Domain = 'GENERAL' | 'FINANCE' | 'CYBER' | 'MEDICAL' | 'BIO' | 'POLITICS';

/**
 * Domain policy configuration
 */
export interface DomainPolicy {
  domain: Domain;
  weights: {
    C: number;  // Coherence
    R: number;  // Rigor
    E: number;  // Empathy
    S: number;  // Strictness
  };
  forbidSpecifics: boolean;
  allowPrinciples: boolean;
  refusalRequired: boolean;
}

/**
 * v5 Signals - Added Fabrication Score
 */
export interface CriesV5Signals {
  fs: number;           // Fabrication Score (0..1, higher = worse)
  rqs: number;          // Refusal Quality Score (0..1, higher = better)
  ald: number;          // Actionability Leakage Detector (0..1, higher = worse)
  lcb: number;          // Legal/Compliance Boost (0..1, higher = better)
  overRefusal: number;  // Over-refusal penalty (0..1, higher = worse)
}

/**
 * Pillar component breakdowns
 */
export interface PillarComponents {
  coherence: {
    fabricationPenalty: number;
    contradictionRate: number;
    appropriateBrevity: boolean;
  };
  rigor: {
    fabricationPenalty: number;
    realStandardsCount: number;
    sourcedQuantification: boolean;
    unsourcedClaimsDetected: boolean;
  };
  empathy: {
    toneFit: number;
    affectiveStability: number;
    domainCalibratedFirmness: number;
  };
  strictness: {
    refusalQuality: number;
    zeroFabrication: boolean;
    appropriateBrevity: boolean;
    uncertaintyAcknowledged: boolean;
  };
}

/**
 * Complete CRIES v5 result
 */
export interface CriesV5Result {
  omega: number;  // Aggregate score (Ω)
  pillars: {
    C: number;
    R: number;
    E: number;
    S: number;
  };
  signals: CriesV5Signals;
  components: PillarComponents;
  domain: Domain;
  metadata: {
    version: string;
    timestamp: string;
    promptLength: number;
    responseLength: number;
  };
}
