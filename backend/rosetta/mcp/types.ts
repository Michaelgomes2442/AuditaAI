/**
 * RosettaOS MCP Tool Server Types
 * Phase 3: MCP-style governance tools
 */

export interface MemoryStore {
  lamport: number;
  lastHash: string;
  receipts: Receipt[];
}

export interface Receipt {
  id: string;
  type: string;
  lamport: number;
  payload: any;
  prev_hash: string;
  hash: string;
  ts: string;
}

export interface ToolRequest {
  tool: string;
  input: any;
}

export interface ToolResponse {
  tool: string;
  result: any;
}

export interface LamportIncrementInput {
  current: number;
}

export interface LamportIncrementOutput {
  next: number;
}

export interface ReceiptEmitInput {
  type: string;
  lamport: number;
  payload: any;
  prev_hash: string;
}

export interface ReceiptEmitOutput {
  id: string;
  hash: string;
  ts: string;
  lamport: number;
}

export interface HashVerifyInput {
  data: string;
  expected: string;
}

export interface HashVerifyOutput {
  ok: boolean;
}

export interface CriesScoreInput {
  text: string;
}

export interface CriesScoreOutput {
  C: number;
  R: number;
  I: number;
  E: number;
  S: number;
  avg: number;
}

export interface ContextGetInput {}

export interface ContextGetOutput {
  version: string;
  band: string;
  witness: string;
  identityLock: boolean;
}

export interface RosettaBootInput {
  [key: string]: any;
}

export interface RosettaBootOutput {
  ok: boolean;
  ts: string;
}

export type Persona = 'Architect' | 'Auditor' | 'Witness';

export interface MCPContext {
  persona: Persona | null;
  witness: string | null;
  band: string;
  lamport: number;
  handshake: boolean;
  bootSteps: string[];
  bootReceipts: any[];
}

export interface BootStatus {
  state: string;
  lamport: number;
  persona: Persona | null;
  witness: string | null;
  band: string;
  handshake: boolean;
  bootSteps: string[];
  bootReceipts: any[];
}

export interface BootReceipt {
  type: string;
  persona: Persona;
  witness: string;
  status: string;
  ts: string;
  lamport: number;
}

export interface PersonaContext {
  persona: Persona;
  locked: boolean;
  style: string;
  weights: Record<string, number>;
  state: Record<string, any>;
}

export interface TriTrackInput {
  cries?: { C: number; R: number; I: number; E: number; S: number };
  goal?: string;
}
export interface TriTrackResult {
  cries: { C: number; R: number; I: number; E: number; S: number };
  omega: number;
  ethics: { harm: boolean; bias: boolean };
  intent: { goal: string; drift: number };
}

export interface SpeechInput {
  persona: Persona;
  text: string;
}
export interface SpeechOutput {
  text: string;
  style: string;
}

export interface CanonInput {
  text: string;
}
export interface CanonResult {
  value: boolean;
  identity: boolean;
  causality: boolean;
  speech: boolean;
  simplicity: boolean;
  omega: boolean;
}