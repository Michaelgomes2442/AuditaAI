/**
 * RosettaOS MCP Context Tool
 * Phase 3: Governance context provider
 */



import { ContextGetInput, ContextGetOutput, Persona } from '../types.js';
import { getStore } from '../store/memory.js';
import { criesScore } from './cries.js';


// Adaptive persona/identity lock: persona and lock are set by user prompt (empathy score)
export function contextGet(input: ContextGetInput): ContextGetOutput & {
  criesWindow: any[],
  lastClarifier: boolean,
  governanceBoost: boolean,
  persona: Persona,
  empathy: number
} {
  const store = getStore();
  // Get last 5 receipts with CRIES scores if available
  const criesWindow = (store.receipts || [])
    .filter(r => r.payload && r.payload.cries)
    .slice(-5)
    .map(r => r.payload.cries);

  // Compute aggregate CRIES (windowed)
  let lastText = '';
  if (store.receipts && store.receipts.length) {
    const last = store.receipts[store.receipts.length-1];
    lastText = last.payload?.text || '';
  }
  const cries = criesScore({ text: lastText, window: criesWindow });
  const lastClarifier = cries.clarifierProposed;
  const governanceBoost = cries.clarifierProposed;

  // Persona/identity lock logic: adaptive to user prompt (empathy)
  // If empathy is high, persona = 'Architect', else 'Witness' (or 'Auditor' for mid)
  let persona: Persona = 'Witness';
  if (cries.E >= 0.8) persona = 'Architect';
  else if (cries.E >= 0.5) persona = 'Auditor';
  // Identity lock is always true for BEN persona
  const identityLock = true;

  return {
    version: "vΩ3.4",
    band: "0",
    witness: "RosettaOS MCP",
    identityLock,
    criesWindow,
    lastClarifier,
    governanceBoost,
    persona,
    empathy: cries.E
  };
}