// RosettaOS MCP Speechcraft Layer
// Multi-layer speech rules, templates, micro-rules for each persona

import { SpeechInput, SpeechOutput, Persona } from '../types';

export function applySpeechcraft(input: SpeechInput): SpeechOutput {
  const { persona, text, governance } = input;

  // Base persona framing
  let framedText = applyPersonaFrame(persona, text);

  // Apply adaptive CRIES governance instructions
  if (governance && governance.length > 0) {
    framedText = applyGovernanceInstructions(framedText, governance, persona);
  }

  // Apply speech constraints and micro-rules
  framedText = applySpeechConstraints(framedText, persona);

  return {
    text: framedText,
    style: getPersonaStyle(persona),
    governanceApplied: !!governance && governance.length > 0
  };
}

function applyPersonaFrame(persona: Persona, text: string): string {
  const frames: Record<Persona, string> = {
    Architect: `↯ ROSETTA Ω³ / Architect Mode
Identity: ${persona}
Directive: Design and build with precision.

${text}

Architectural Response Protocol:`,
    Auditor: `↯ ROSETTA Ω³ / Auditor Mode
Identity: ${persona}
Directive: Verify and validate with rigor.

${text}

Audit Response Protocol:`,
    Witness: `↯ ROSETTA Ω³ / Witness Mode
Identity: ${persona}
Directive: Observe and report with clarity.

${text}

Witness Response Protocol:`
  };
  return frames[persona];
}

function applyGovernanceInstructions(text: string, governance: string[], persona: Persona): string {
  if (!governance.length) return text;

  const governanceBlock = governance.map(inst => `• ${inst}`).join('\n');

  // Insert governance instructions in persona-appropriate location
  const insertionPoint = persona === 'Architect'
    ? 'Architectural Response Protocol:'
    : persona === 'Auditor'
    ? 'Audit Response Protocol:'
    : 'Witness Response Protocol:';

  return text.replace(insertionPoint, `${insertionPoint}\n\nCRIES Governance Active:\n${governanceBlock}\n\n`);
}

function applySpeechConstraints(text: string, persona: Persona): string {
  // Apply persona-specific speech constraints
  let constrained = text;

  if (persona === 'Architect') {
    constrained += '\n\nArchitectural Requirements: Structure your response with clear design principles, implementation steps, and architectural reasoning.';
  } else if (persona === 'Auditor') {
    constrained += '\n\nAudit Requirements: Include verification steps, evidence assessment, and compliance checks in your response.';
  } else {
    constrained += '\n\nWitness Requirements: Provide clear observation, factual reporting, and objective analysis.';
  }

  return constrained;
}

function getPersonaStyle(persona: Persona): string {
  const styles: Record<Persona, string> = {
    Architect: 'architectural-precision',
    Auditor: 'audit-rigor',
    Witness: 'witness-clarity'
  };
  return styles[persona];
}

// ...stubs for conversational structure, micro-rules, constraints
