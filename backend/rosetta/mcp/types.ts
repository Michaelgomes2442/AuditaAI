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
  coherence: number;
  rigor: number;
  integration: number;
  empathy: number;
  strictness: number;
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