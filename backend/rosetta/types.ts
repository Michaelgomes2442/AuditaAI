/**
 * RosettaOS Phase-4 Types
 * Shared interfaces for Context, Receipt, ChainEntry
 */

export type Persona = 'Architect' | 'Auditor' | 'Viewer';

export interface RosettaContext {
  persona: Persona;
  witness: string;
  band: '0';
  mode: 'MANAGED' | 'TRANSPARENT';
  lamport: number;
  bootTime: string;
  identityLock: boolean;   // true in Phase-4
  version: string;         // "vΩ3.4"
}

export interface Receipt {
  id: string;                 // UUID or short ULID
  type: 'Δ-BOOTCONFIRM' | 'Δ-PROMPT' | 'Δ-ANALYSIS' | 'Δ-RESPONSE';
  lamport: number;
  ts: string;                 // ISO
  witness: string;            // model/provider or "RosettaOS"
  band: 'B0';
  payload: Record<string, any>;
  prev_hash: string;          // hex
  hash: string;               // hex (sha256 over canonicalized json without 'hash')
}

export interface ChainEntry {
  id: string;        // same as receipt.id
  lamport: number;
  ts: string;
  prev_hash: string; // last chain hash
  hash: string;      // receipt.hash
}