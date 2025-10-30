/**
 * RosettaOS MCP In-Memory Store
 * Phase 3: Temporary storage until Phase 4 persistence
 */

import { MemoryStore, Receipt } from '../types.js';

const store: MemoryStore = {
  lamport: 1,
  lastHash: '0'.repeat(64), // 64 hex chars
  receipts: []
};

export function getStore(): MemoryStore {
  return store;
}

export function updateLamport(lamport: number): void {
  store.lamport = lamport;
}

export function updateLastHash(hash: string): void {
  store.lastHash = hash;
}

export function addReceipt(receipt: Receipt): void {
  store.receipts.push(receipt);
}

export function getReceipts(): Receipt[] {
  return [...store.receipts];
}