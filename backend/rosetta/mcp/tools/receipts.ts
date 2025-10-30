/**
 * RosettaOS MCP Receipts Tool
 * Phase 3: Deterministic receipt emission and storage
 */

import { createHash } from 'crypto';
import { ReceiptEmitInput, ReceiptEmitOutput, Receipt } from '../types.js';
import { getStore, updateLastHash, addReceipt } from '../store/memory.js';

export function receiptEmit(input: ReceiptEmitInput): ReceiptEmitOutput {
  const store = getStore();
  const ts = new Date().toISOString();

  const record: Omit<Receipt, 'id' | 'hash'> = {
    type: input.type,
    lamport: input.lamport,
    payload: input.payload,
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