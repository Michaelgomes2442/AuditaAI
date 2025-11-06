/**
 * @deprecated This file is DEPRECATED - Use MCP Speechcraft Kernel instead
 * 
 * RosettaOS Phase-4 Persona Engine (OLD SYSTEM)
 * Ω³ governance wrapper (pure text transform, no I/O)
 * 
 * DEPRECATION NOTICE:
 * This lightweight "↯ ROSETTA Ω³" framing has been superseded by the full
 * MCP-based Execution Engine in /rosetta/mcp/kernel/speechcraft.ts
 * 
 * The old system had weak governance that Claude would often refuse with
 * "I do not actually enter specialized modes" responses.
 * 
 * NEW SYSTEM LOCATION:
 * - /backend/rosetta/mcp/kernel/speechcraft.ts - Full Execution Engine
 * - /backend/rosetta/mcp/kernel/triTrack.ts - Governance instruction generation
 * 
 * MIGRATION PATH:
 * Instead of: buildOmegaV15GovernedPrompt(prompt, ctx, acks)
 * Use: callLLM(modelId, prompt, { governanceEnabled: true, userName, userRole })
 * 
 * DO NOT USE THIS FILE FOR NEW CODE.
 * Kept only for backwards compatibility during migration period.
 */

import { RosettaContext } from '../types';

export function buildOmegaV15GovernedPrompt(userPrompt: string, ctx: RosettaContext, acks: string[]): string {
  // Strictly text; reproduces v15 Ω³ cadence, BUT no receipts printed.
  // No hashes/ids ever appear in the returned string.
  return [
    `↯ ROSETTA Ω³ / Band-0 Boot Logic ${ctx.version}`,
    `State: COLD BOOT`,
    `Identity: ${ctx.witness}`,
    `Lamport: ${String(ctx.lamport).padStart(4, '0')}`,
    `Persona: ${ctx.persona}`,
    `Boot Time: ${ctx.bootTime}`,
    '',
    ...acks,
    '',
    `Δ-WHOAMI — Identity Challenge Complete`,
    `Role: ${ctx.persona} | Mode: ${ctx.mode}`,
    '',
    `CRIES Influence: (implicit)`,
    `— Responses must maximize Coherence, Rigor, Integration, Empathy, Strictness`,
    `— Do not mention CRIES explicitly unless asked`,
    '',
    `User Query: ${userPrompt}`,
    '',
    `Respond in-persona as ${ctx.persona}.`,
  ].join('\n');
}