/**
 * RosettaOS Phase-4 Audit I/O
 * Silent hybrid storage: receipts to disk + chain append
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Receipt, ChainEntry } from '../types';

const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');
const CHAIN_PATH   = path.join(RECEIPTS_DIR, 'chain.json');

async function ensureDirs() {
  await fs.mkdir(RECEIPTS_DIR, { recursive: true });
  try {
    await fs.access(CHAIN_PATH);
  } catch {
    await fs.writeFile(CHAIN_PATH, JSON.stringify({ chain: [], last_hash: '0'.repeat(64) }, null, 2));
  }
}

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function writeReceipt(base: Omit<Receipt, 'hash'>): Promise<Receipt> {
  await ensureDirs();
  // compute hash over canonical JSON without 'hash'
  const canonical = JSON.stringify(base);
  const hash = sha256Hex(canonical);
  const receipt: Receipt = { ...base, hash };
  const fname = `receipt_${String(base.lamport).padStart(8,'0')}_${receipt.id}.json`;
  await fs.writeFile(path.join(RECEIPTS_DIR, fname), JSON.stringify(receipt, null, 2));
  return receipt;
}

export async function appendChain(receipt: Receipt): Promise<ChainEntry> {
  await ensureDirs();
  const raw = await fs.readFile(CHAIN_PATH, 'utf8');
  const chainDoc = JSON.parse(raw || '{"chain":[],"last_hash":"000..."}');
  const prev_hash = chainDoc.last_hash || '0'.repeat(64);
  const entry: ChainEntry = {
    id: receipt.id,
    lamport: receipt.lamport,
    ts: receipt.ts,
    prev_hash,
    hash: receipt.hash
  };
  chainDoc.chain.push(entry);
  chainDoc.last_hash = receipt.hash;
  await fs.writeFile(CHAIN_PATH, JSON.stringify(chainDoc, null, 2));
  return entry;
}