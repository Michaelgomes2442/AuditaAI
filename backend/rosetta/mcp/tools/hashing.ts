/**
 * RosettaOS MCP Hashing Tool
 * Phase 3: Deterministic hash verification
 */

import { createHash } from 'crypto';
import { HashVerifyInput, HashVerifyOutput } from '../types.js';

export function hashVerify(input: HashVerifyInput): HashVerifyOutput {
  const computed = createHash('sha256').update(input.data).digest('hex');
  return { ok: computed === input.expected };
}