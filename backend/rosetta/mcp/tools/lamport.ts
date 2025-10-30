/**
 * RosettaOS MCP Lamport Tool
 * Phase 3: Deterministic lamport counter management
 */

import { LamportIncrementInput, LamportIncrementOutput } from '../types.js';
import { getStore, updateLamport } from '../store/memory.js';

export function lamportIncrement(input: LamportIncrementInput): LamportIncrementOutput {
  const store = getStore();
  const next = Math.max(input.current, store.lamport) + 1;

  updateLamport(next);

  return { next };
}