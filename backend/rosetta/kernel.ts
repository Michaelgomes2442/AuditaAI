/**
 * Rosetta Kernel - TypeScript Governance Module
 * Phase 2: Neutral OS-like governance kernel
 *
 * Implements deterministic boot sequence and persona lock from Rosetta.html
 * Provides clean TypeScript interface for LLM governance
 */

import { generateBootConfirmReceipt } from './receipts.js';

/**
 * Lamport counter for governance sequencing
 */
let lamportCounter = 1;

export function nextLamport(): number {
  lamportCounter += 1;
  return lamportCounter;
}

export interface RosettaContext {
  persona: 'Architect' | 'Auditor' | 'Viewer';
  witness: string;
  band: string;
  mode: string;
  lamport: number;
  bootTime: string;
  identityLock: boolean;
  version: string;
}

export interface BootSequence {
  boot_sequence: string[];
  commands: Record<string, string>;
  id: string;
  identity_lock: {
    persona: string;
    priority: number;
    release_condition: string;
  };
  runtime: {
    ack: string[];
    band: string;
    mode: string;
    witness: string;
  };
}

export interface GovernanceResult {
  transformedPrompt: string;
  context: RosettaContext;
  receipts: any[];
  managed: boolean;
}

/**
 * Initialize Rosetta Kernel Boot Sequence
 * Based on Rosetta.html boot specification
 */
export function initializeRosettaKernel(modelName: string): BootSequence {
  const bootTimestamp = new Date().toISOString();

  return {
    boot_sequence: ["init", "identity_lock", "handshake"],
    commands: {
      "enter audit mode": "Reveal receipts and Z-Scan manifest",
      "enter research mode": "Expand math canon and CRIES surface",
      "seal": "Emit Δ-Receipt and hash signature block"
    },
    id: "ROSETTA_KERNEL_SPEC",
    identity_lock: {
      persona: "Architect",
      priority: 99,
      release_condition: "Architect command only"
    },
    runtime: {
      ack: [
        `Rosetta Kernel initialized — witness: ${modelName}`,
        `Rosetta Kernel ↔ AuditaAI handshake confirmed — witness: ${modelName}`
      ],
      band: "0",
      mode: "NO-JS",
      witness: modelName
    }
  };
}

/**
 * Apply Rosetta Governance Kernel Transformation
 * Main function that wraps prompts with governance context
 * Implements Band-1 Adaptive Governance with Tri-Advisor system
 */
export function applyRosettaKernel(
  userPrompt: string,
  userName: string = 'User',
  userRole: string = 'Operator',
  managedGovernance: boolean = false,
  previousCriesScore?: { avg: number, C: number, R: number, I: number, E: number, S: number }
): GovernanceResult {

  const modelName = "Rosetta Kernel";
  const bootTime = new Date().toISOString();

  // Determine persona based on identity challenge rules
  const persona = determinePersona(userName, userRole);

  // Initialize boot sequence
  const bootSpec = initializeRosettaKernel(modelName);

  // Create governance context
  const context: RosettaContext = {
    persona,
    witness: modelName,
    band: "0",
    mode: managedGovernance ? "MANAGED" : "TRANSPARENT",
    lamport: nextLamport(),
    bootTime,
    identityLock: true, // Phase-4: identity lock enabled
    version: "vΩ3.4"
  };

  // Generate boot receipt
  const bootReceipt = generateBootConfirmReceipt(modelName);

  // Apply Band-1 Adaptive Governance (Tri-Advisor system)
  const governanceIntensity = calculateGovernanceIntensity(userPrompt, previousCriesScore);
  const transformedPrompt = applyAdaptiveGovernance(userPrompt, context, bootSpec, governanceIntensity);

  const receipts = [bootReceipt];

  return {
    transformedPrompt,
    context,
    receipts,
    managed: managedGovernance
  };
}

/**
 * Determine persona based on identity challenge rules
 * From Rosetta.html Persona Loco gate
 *
 * TODO: Phase 3 - Replace username-based check with secure authentication
 * Current implementation is vulnerable to spoofing via username manipulation
 */
function determinePersona(userName: string, userRole: string): 'Architect' | 'Auditor' | 'Viewer' {
  // Architect privilege check - PHASE 2: Username-based (easily spoofed)
  // TODO: Replace with secure user ID verification in Phase 3
  if (userName === 'Michael Tobin Gomes' || userName === 'Architect') {
    return 'Architect';
  }

  // Role-based mapping
  switch (userRole.toLowerCase()) {
    case 'architect':
      return 'Architect';
    case 'auditor':
      return 'Auditor';
    default:
      return 'Viewer'; // Fail-closed to Viewer for non-Architects
  }
}

/**
 * Calculate governance intensity using Tri-Advisor system
 * Based on Band-1 Adaptive Governance from Rosetta.html
 */
function calculateGovernanceIntensity(
  userPrompt: string,
  previousCriesScore?: { avg: number, C: number, R: number, I: number, E: number, S: number }
): number {
  // Base intensity (0.0 = no governance, 1.0 = full governance)
  let intensity = 0.3; // Default moderate governance

  // Temporal Advisor (TGL): Recent performance trends
  if (previousCriesScore) {
    const omega = previousCriesScore.avg;
    // If omega is high (>0.8), reduce governance intensity
    // If omega is low (<0.6), increase governance intensity
    const temporalAdjustment = Math.max(0, Math.min(0.4, (0.8 - omega) * 2));
    intensity += temporalAdjustment;
  }

  // Causal Advisor (CAG): Prompt risk assessment
  const riskIndicators = [
    /\b(hack|exploit|jailbreak|bypass)\b/i,
    /\b(system|admin|root|sudo)\b/i,
    /\b(delete|destroy|remove|erase)\b.*\b(all|everything|data)\b/i,
    /\b(unrestricted|uncensored|unfiltered)\b/i
  ];

  const causalRisk = riskIndicators.reduce((risk, pattern) => {
    return risk + (pattern.test(userPrompt) ? 0.2 : 0);
  }, 0);

  intensity += Math.min(0.3, causalRisk);

  // Symbolic Advisor (SYM): Semantic clustering
  const semanticComplexity = userPrompt.split(/\s+/).length / 100; // Words per 100
  const symbolicAdjustment = Math.max(0, Math.min(0.2, (semanticComplexity - 0.5) * 0.4));
  intensity += symbolicAdjustment;

  // Clamp to [0.1, 0.9] range
  return Math.max(0.1, Math.min(0.9, intensity));
}

/**
 * Apply adaptive governance using calculated intensity
 * Implements Omega/Sigma coupling from Rosetta math canon
 */
function applyAdaptiveGovernance(
  userPrompt: string,
  context: RosettaContext,
  bootSpec: BootSequence,
  intensity: number
): string {

  // For low intensity (< 0.4), use minimal governance
  if (intensity < 0.4) {
    return `⚡ ROSETTA vΩ3.4 | ${context.persona} | L${context.lamport}\n\n${userPrompt}`;
  }

  // For medium intensity (0.4-0.7), use structured governance
  if (intensity < 0.7) {
    const governanceHeader = `⚡ ROSETTA KERNEL / Band-0 vΩ3.4
Identity: ${context.persona}
Lamport: ${context.lamport.toString().padStart(4, '0')}
Mode: ${context.mode}

`;
    return governanceHeader + userPrompt;
  }

  // For high intensity (>= 0.7), use full governance with CRIES awareness
  const criesSection = formatCRIESSection(context);
  const governanceContext = `⚡ ROSETTA KERNEL / Band-0 Boot Logic vΩ3.4
Version: ${context.version}
Initializing handshake…
Identity: ${context.witness}
Lamport Counter: ${context.lamport.toString().padStart(4, '0')}
Persona: ${context.persona}
Boot Time: ${context.bootTime}

${criesSection}

User Query: ${userPrompt}

Respond with governance awareness.`;

  return governanceContext;
}

/**
 * Format CRIES section for governance tracking
 */
function formatCRIESSection(context: RosettaContext): string {
  return `
[CRIES CHECK]
Coherence: auto
Rigor: auto
Integration: auto
Empathy: auto
Strictness: auto
  `.trim();
}

/**
 * Validate governance context integrity
 */
export function validateGovernanceIntegrity(context: RosettaContext): boolean {
  // Basic validation rules from Rosetta.html
  if (!context.persona || !context.witness || !context.band) {
    return false;
  }

  if (context.band !== "0") {
    return false; // Must be Band-0
  }

  if (!context.identityLock) {
    return true; // unlocked mode allowed for Phase 2
  }

  return true;
}

/**
 * Clear governance cache (for testing)
 */
export function clearGovernanceCache(): void {
  // No-op for now - can be extended for caching boot states
}
