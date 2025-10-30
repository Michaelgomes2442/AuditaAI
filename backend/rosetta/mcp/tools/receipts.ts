/**
 * RosettaOS MCP Receipts Tool
 * Phase 3: Deterministic receipt emission and storage
 */


import { createHash } from 'crypto';
import { ReceiptEmitInput, ReceiptEmitOutput, Receipt } from '../types.js';
import { getStore, updateLastHash, addReceipt } from '../store/memory.js';
import { criesScore } from './cries.js';


export function receiptEmit(input: ReceiptEmitInput): ReceiptEmitOutput {
  const store = getStore();
  const ts = new Date().toISOString();

  // If payload has text, compute CRIES and governance boost
  let payload = input.payload;
  if (payload && typeof payload.text === 'string') {
    const window = (store.receipts || [])
      .filter(r => r.payload && r.payload.cries)
      .slice(-5)
      .map(r => r.payload.cries);
    const cries = criesScore({ text: payload.text, window });
    payload = {
      ...payload,
      cries,
      governanceBoost: cries.clarifierProposed
    };
  }

  const record: Omit<Receipt, 'id' | 'hash'> = {
    type: input.type,
    lamport: input.lamport,
    payload,
    prev_hash: input.prev_hash,
    ts
  };

  const recordStr = JSON.stringify(record);
  const hash = createHash('sha256').update(recordStr).digest('hex');

  const receipt: Receipt = {
    ...record,
    id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    hash
  };

  addReceipt(receipt);
  updateLastHash(hash);

  return {
    id: receipt.id,
    hash: receipt.hash,
    ts: receipt.ts,
    lamport: receipt.lamport
  };
}