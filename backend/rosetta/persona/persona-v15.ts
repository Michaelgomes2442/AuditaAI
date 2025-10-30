/**
 * RosettaOS Phase-4 Persona Engine
 * Ω³ governance wrapper (pure text transform, no I/O)
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