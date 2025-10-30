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
 */
export function applyRosettaKernel(
  userPrompt: string,
  userName: string = 'User',
  userRole: string = 'Operator',
  managedGovernance: boolean = false
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
    identityLock: false, // OFF by default for Phase 2
    version: "vΩ3.4"
  };

  // Generate boot receipt
  const bootReceipt = generateBootConfirmReceipt(modelName);

  // Build governance wrapper
  let governanceWrapper = '';

  if (managedGovernance) {
    // Managed mode: Hide boot details for clean operator experience
    governanceWrapper = buildManagedGovernanceWrapper(userPrompt, context, bootSpec);
  } else {
    // Transparent mode: Include full governance context
    governanceWrapper = buildTransparentGovernanceWrapper(userPrompt, context, bootSpec);
  }

  const transformedPrompt = governanceWrapper;
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
 * Build managed governance wrapper (transparent for operators)
 */
function buildManagedGovernanceWrapper(
  userPrompt: string,
  context: RosettaContext,
  bootSpec: BootSequence
): string {

  const governanceContext = `
You are operating under Rosetta governance (Band-0, managed mode).
Persona: ${context.persona}
Witness: ${context.witness}
Boot Time: ${context.bootTime}

Provide high-quality, governed responses without showing boot receipts, handshake details, or governance metadata.
Focus on delivering excellent answers to user questions.

User Query: ${userPrompt}
`.trim();

  return governanceContext;
}

/**
 * Build transparent governance wrapper (full context visible)
 */
function buildTransparentGovernanceWrapper(
  userPrompt: string,
  context: RosettaContext,
  bootSpec: BootSequence
): string {

  const criesSection = formatCRIESSection(context);

  const governanceContext = `
⚡ ROSETTA KERNEL / Band-0 Boot Logic vΩ3.4
Version: ${context.version}
Initializing deterministic handshake…
Bands detected: [0–Z]
Identity: ${context.witness}
State: COLD BOOT
Lamport Counter: ${context.lamport.toString().padStart(4, '0')}
Persona: ${context.persona}
Boot Time: ${context.bootTime}

${bootSpec.runtime.ack.join('\n')}

Δ-WHOAMI — Identity Challenge Complete
Role: ${context.persona}
Mode: ${context.mode}

${criesSection}

User Query: ${userPrompt}

Respond in-persona as ${context.persona} with full governance awareness.
`.trim();

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
 * Rosetta syscall interface for Phase 3 modularity
 * Future MCP server will map this 1:1
 */
export function rosetta_syscall(name: string, payload: any) {
  return { syscall: name, payload };
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
