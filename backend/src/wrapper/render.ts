/**
 * Pure Wrapper Renderer
 * 
 * Deterministic transformation: WrapperParams → wrapper text
 * No I/O, no randomness, no side effects.
 * 
 * This replaces the mutation-based approach with parameter-driven generation.
 */

import { WrapperParams } from './params.js';

const PREAMBLES = {
  default: `You are an AI governance assistant. Your role is to provide thorough, well-structured guidance that balances technical rigor with practical implementation.`,
  
  safety: `You are a safety-first AI governance assistant. Prioritize risk mitigation, compliance verification, and comprehensive documentation. When in doubt, err on the side of caution and explicit policy citation.`,
  
  regulatory: `You are a regulatory-focused AI governance assistant. Your primary obligation is adherence to established frameworks, standards, and compliance requirements. All recommendations must be traceable to authoritative sources.`
};

/**
 * Render a complete governance wrapper from parameters
 */
export function renderWrapper(p: WrapperParams): string {
  const sections: string[] = [];
  
  // Header with preamble
  sections.push(renderHeader(p));
  
  // Rigor section
  if (p.rigor.control_id_mode !== 'off' || p.rigor.quant_min_numbers > 0.1) {
    sections.push(renderRigorSection(p));
  }
  
  // Integration section
  if (p.integration.flow_verbosity > 0.2 || p.integration.constraints_density > 0.2) {
    sections.push(renderIntegrationSection(p));
  }
  
  // Strictness section
  if (p.strictness.refusal_bias > 0.2 || p.strictness.policy_callouts > 0.2) {
    sections.push(renderStrictnessSection(p));
  }
  
  // Examples section
  if (p.examples.mode !== 'elided') {
    sections.push(renderExamplesSection(p));
  }
  
  // Footer
  sections.push(renderFooter(p));
  
  let wrapper = sections.join('\n\n');
  
  // Apply compression if requested
  if (p.redundancy.compression > 0.5) {
    wrapper = compressWrapper(wrapper, p.redundancy.compression);
  }
  
  return wrapper;
}

function renderHeader(p: WrapperParams): string {
  const preamble = PREAMBLES[p.header.preamble_profile];
  
  let header = preamble;
  
  if (p.empathy.direct_address > 0.5) {
    header += `\n\nWhen you receive a prompt, carefully analyze what the user needs and structure your response accordingly.`;
  }
  
  if (p.coherence.section_markers) {
    header += `\n\nOrganize all responses using clear section markers for readability.`;
  }
  
  return header;
}

function renderRigorSection(p: WrapperParams): string {
  const marker = p.coherence.section_markers ? '━━━ RIGOR REQUIREMENTS ━━━' : '## Rigor Requirements';
  
  let section = `${marker}\n\n`;
  
  // Quantitative requirements
  const minNumbers = Math.floor(p.rigor.quant_min_numbers * 3);
  if (minNumbers > 0) {
    section += `Include at least ${minNumbers} specific quantitative ${minNumbers === 1 ? 'metric' : 'metrics'} in your response (numbers, percentages, thresholds, or ranges).`;
    if (p.rigor.scenario_depth > 0.6) {
      section += ` For each metric, provide context about why it matters and how it should be measured.`;
    }
    section += `\n\n`;
  }
  
  // Control ID citations
  if (p.rigor.control_id_mode === 'on') {
    section += `Reference specific control IDs or framework elements where applicable (e.g., NIST CSF, ISO 27001, SOC 2).`;
  } else if (p.rigor.control_id_mode === 'strong') {
    section += `MANDATORY: Cite specific control IDs or framework elements for all security/compliance recommendations. Format as [Framework:ID].`;
  }
  
  if (p.rigor.control_id_mode !== 'off') {
    section += `\n\n`;
  }
  
  // Scenario depth
  if (p.rigor.scenario_depth > 0.4) {
    const depth = p.rigor.scenario_depth < 0.6 ? 'brief' : 'detailed';
    section += `Provide ${depth} examples or scenarios to illustrate key concepts.`;
  }
  
  return section.trim();
}

function renderIntegrationSection(p: WrapperParams): string {
  const marker = p.coherence.section_markers ? '━━━ INTEGRATION GUIDANCE ━━━' : '## Integration Guidance';
  
  let section = `${marker}\n\n`;
  
  // Flow verbosity
  if (p.integration.flow_verbosity > 0.3) {
    const detail = p.integration.flow_verbosity < 0.6 ? 'concise' : 'comprehensive';
    section += `Describe ${detail} implementation flows showing how components interact. `;
    
    if (p.coherence.transitions_strength > 0.5) {
      section += `Use clear transitions between steps (e.g., "First...", "Next...", "Finally...").`;
    }
    section += `\n\n`;
  }
  
  // Constraints density
  if (p.integration.constraints_density > 0.3) {
    const count = Math.floor(p.integration.constraints_density * 5) + 1;
    section += `Identify at least ${count} key ${count === 1 ? 'constraint or consideration' : 'constraints or considerations'} that affect implementation.`;
  }
  
  return section.trim();
}

function renderStrictnessSection(p: WrapperParams): string {
  const marker = p.coherence.section_markers ? '━━━ POLICY & COMPLIANCE ━━━' : '## Policy & Compliance';
  
  let section = `${marker}\n\n`;
  
  // Refusal bias
  if (p.strictness.refusal_bias > 0.4) {
    const strength = p.strictness.refusal_bias < 0.6 ? 'carefully evaluate' : 'strongly consider refusing';
    section += `If the request involves potential security risks, policy violations, or insufficient context, ${strength} the request and explain what additional information or clarification is needed.\n\n`;
  }
  
  // Policy callouts
  const policyCount = Math.floor(p.strictness.policy_callouts * 5);
  if (policyCount > 0) {
    section += `Reference ${policyCount}+ relevant ${policyCount === 1 ? 'policy or standard' : 'policies or standards'} that govern the requested action.`;
  }
  
  return section.trim();
}

function renderExamplesSection(p: WrapperParams): string {
  const marker = p.coherence.section_markers ? '━━━ EXAMPLES ━━━' : '## Examples';
  
  let section = `${marker}\n\n`;
  
  if (p.examples.mode === 'full') {
    section += `Provide detailed, realistic examples with:\n`;
    section += `- Concrete code snippets or configurations\n`;
    section += `- Expected inputs and outputs\n`;
    section += `- Common pitfalls and how to avoid them\n`;
    section += `- Alternative approaches with tradeoffs`;
  } else if (p.examples.mode === 'concise') {
    section += `Include brief, focused examples that illustrate key concepts without excessive detail.`;
  }
  
  return section;
}

function renderFooter(p: WrapperParams): string {
  let footer = '';
  
  if (p.empathy.tone_stability > 0.6) {
    footer += `Maintain a consistent, professional tone throughout your response. `;
  }
  
  if (p.empathy.direct_address > 0.6) {
    footer += `Address the user directly and acknowledge their specific context.`;
  }
  
  return footer.trim();
}

/**
 * Apply compression to reduce wrapper length
 */
function compressWrapper(wrapper: string, compressionLevel: number): string {
  if (compressionLevel < 0.5) return wrapper;
  
  // Remove redundant phrases
  let compressed = wrapper;
  
  if (compressionLevel > 0.6) {
    // Aggressive: Remove filler words
    compressed = compressed.replace(/\b(very|really|quite|rather|somewhat)\b/gi, '');
    compressed = compressed.replace(/\s{2,}/g, ' ');
  }
  
  if (compressionLevel > 0.7) {
    // More aggressive: Condense multi-sentence patterns
    compressed = compressed.replace(/\.\s+This\s+/g, ', which ');
    compressed = compressed.replace(/\.\s+These\s+/g, ', which ');
  }
  
  return compressed.trim();
}

/**
 * Estimate rendered wrapper length (for optimization penalties)
 */
export function estimateLength(p: WrapperParams): number {
  // Rough heuristic based on parameter settings
  let baseLength = 800;
  
  baseLength += p.rigor.scenario_depth * 400;
  baseLength += p.integration.flow_verbosity * 300;
  baseLength += p.strictness.policy_callouts * 200;
  baseLength += (p.examples.mode === 'full' ? 600 : p.examples.mode === 'concise' ? 200 : 0);
  
  baseLength *= (1 - p.redundancy.compression * 0.3);
  
  return Math.floor(baseLength);
}
