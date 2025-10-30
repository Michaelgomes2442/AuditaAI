/**
 * RosettaOS Phase-4 JSON Schemas
 * AJV-compatible schemas for Receipt and ChainEntry
 */

export const receiptSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    type: {
      type: "string",
      enum: ["Δ-BOOTCONFIRM", "Δ-PROMPT", "Δ-ANALYSIS", "Δ-RESPONSE"]
    },
    lamport: { type: "number", minimum: 0 },
    ts: { type: "string", format: "date-time" },
    witness: { type: "string", minLength: 1 },
    band: { type: "string", enum: ["B0"] },
    payload: { type: "object" },
    prev_hash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    hash: { type: "string", pattern: "^[a-f0-9]{64}$" }
  },
  required: ["id", "type", "lamport", "ts", "witness", "band", "payload", "prev_hash", "hash"]
};

export const chainEntrySchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    lamport: { type: "number", minimum: 0 },
    ts: { type: "string", format: "date-time" },
    prev_hash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    hash: { type: "string", pattern: "^[a-f0-9]{64}$" }
  },
  required: ["id", "lamport", "ts", "prev_hash", "hash"]
};