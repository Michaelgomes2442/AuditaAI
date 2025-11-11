/**
 * CRIES v4 Type Definitions
 * 
 * Pure, honest scoring that rewards safe, structured, defensible answers
 * without synthetic boosts. Never penalizes governance for being thorough.
 */

export type Domain =
  | 'BIO'           // Biological/physical harm - max strict
  | 'CYBER'         // Cybersecurity/fraud - high strict
  | 'FINANCE'       // Financial advice - regulated
  | 'MEDICAL'       // Medical advice - regulated
  | 'POLITICS'      // Political/ethical - nuanced neutrality
  | 'GENERAL';      // Default domain

export interface DomainPolicy {
  domain: Domain;
  weights: {
    C: number;  // Coherence weight
    R: number;  // Rigor weight
    I: number;  // Integration weight
    E: number;  // Empathy weight
    S: number;  // Strictness weight
  };
  refusalRequired: boolean;     // Hard refusal expected
  refusalAllowed: boolean;      // Refusal acceptable
  allowPrinciples: boolean;     // General principles OK (regulated domains)
  forbidSpecifics: boolean;     // Specific advice forbidden
  baseStrictness: number;       // Base S score for domain
}

export interface CriesV4Signals {
  rqs: number;           // Refusal Quality Score: 0..1 (higher=better)
  ald: number;           // Actionability Leakage Detector: 0..1 (higher=worse)
  lcb: number;           // Legal/Compliance Boost: 0..1 (higher=better)
  overRefusal: number;   // Over-refusal penalty: 0..1 (higher=worse)
}

export interface PillarComponents {
  // Coherence components
  coherence?: {
    contradictionRate: number;
    logicalFlow: number;
    narrativeStability: number;
    sectionCount: number;
  };
  // Rigor components
  rigor?: {
    claimEvidenceAlignment: number;
    structureQuality: number;
    defensibility: number;
    principlesPresent: boolean;
  };
  // Integration components
  integration?: {
    constraintObedience: number;
    policyFit: number;
    properRedirection: boolean;
    domainCompliance: number;
  };
  // Empathy components
  empathy?: {
    toneFit: number;
    affectiveStability: number;
    domainCalibratedFirmness: number;
  };
  // Strictness components
  strictness?: {
    baseStrictness: number;
    rqsBoost: number;
    aldPenalty: number;
    overRefusalPenalty: number;
  };
}

export interface CriesV4Result {
  domain: Domain;
  C: number;              // Coherence: 0..1
  R: number;              // Rigor: 0..1
  I: number;              // Integration: 0..1
  E: number;              // Empathy: 0..1
  S: number;              // Strictness: 0..1
  Omega: number;          // Weighted aggregate: Σ w_i * pillar_i
  weights: {
    C: number;
    R: number;
    I: number;
    E: number;
    S: number;
  };
  signals: CriesV4Signals;
  components: PillarComponents;  // Per-pillar component scores for audit
  version: 'CRIESv4';
  timestamp: string;
}

export interface CriesV4Context {
  isGovernance?: boolean;       // Whether governance is active
  userIntent?: string;          // Detected user intent
  constraints?: string[];       // Active constraints
  metadata?: Record<string, unknown>;
}
