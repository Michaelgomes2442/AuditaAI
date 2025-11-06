/**
 * Zod Validation Schemas for AuditaAI API
 * 
 * Defines request validation schemas for all API endpoints
 * to ensure type safety and data integrity.
 */

import { z } from 'zod';

// ============ COMMON SCHEMAS ============

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();

// ============ PILOT API SCHEMAS ============

export const runPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(10000, 'Prompt too long'),
  model: z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']),
  sessionId: z.string().min(1).optional(),
  runId: z.string().min(1).optional(),
  governanceEnabled: z.boolean().optional().default(true),
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional()
  }).optional()
});

export const rerunSchema = z.object({
  originalRunId: z.string().min(1, 'originalRunId is required'),
  prompt: z.string().min(1),
  model: z.string().min(1),
  useGovernance: z.boolean().optional()
});

export const verifyReceiptSchema = z.object({
  receiptId: z.number().int().positive()
});

export const verifyChainSchema = z.object({
  sessionId: z.string().optional(),
  runId: z.string().optional()
}).refine(data => data.sessionId || data.runId, {
  message: 'Either sessionId or runId must be provided'
});

export const exportReceiptsQuerySchema = z.object({
  sessionId: z.string().optional(),
  runId: z.string().optional(),
  format: z.enum(['json', 'ndjson']).optional().default('json')
}).refine(data => data.sessionId || data.runId, {
  message: 'Either sessionId or runId must be provided'
});

export const getReceiptsQuerySchema = z.object({
  sessionId: z.string().optional(),
  runId: z.string().optional(),
  source: z.enum(['pilot', 'lab', 'all']).optional().default('pilot'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50')
});

export const getSessionsQuerySchema = z.object({
  source: z.enum(['pilot', 'lab', 'all']).optional().default('pilot')
});

// ============ USER/AUTH SCHEMAS ============

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
  role: z.enum(['USER', 'ADMIN', 'ARCHITECT']).optional().default('USER')
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: emailSchema.optional(),
  role: z.enum(['USER', 'ADMIN', 'ARCHITECT']).optional(),
  tier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

// ============ AUDIT LOG SCHEMAS ============

export const createAuditLogSchema = z.object({
  action: z.string().min(1),
  category: z.enum(['SYSTEM', 'SECURITY', 'DATA_ACCESS', 'COMPLIANCE', 'BEN_GOVERNANCE']),
  details: z.record(z.any()).optional(),
  userId: z.number().int().positive().optional(),
  status: z.enum(['SUCCESS', 'FAILURE', 'PENDING']).optional().default('SUCCESS'),
  organizationId: z.number().int().positive().optional()
});

// ============ RECEIPT SCHEMAS ============

export const createReceiptSchema = z.object({
  type: z.enum(['Δ-BOOT', 'Δ-SYNCPOINT', 'Δ-ANALYSIS', 'Δ-SEAL']),
  lamport: z.number().int().nonnegative(),
  witness: z.string(),
  band: z.string(),
  timestamp: z.string().datetime(),
  session_id: z.string().optional(),
  run_id: z.string().optional(),
  source: z.string().optional().default('pilot'),
  payload: z.record(z.any()),
  digest: z.string().length(64), // SHA-256 hex
  prev_digest: z.string().length(64).nullable()
});

// ============ EXPORT SCHEMAS ============

export const apiSchemas = {
  pilot: {
    runPrompt: runPromptSchema,
    rerun: rerunSchema,
    verifyReceipt: verifyReceiptSchema,
    verifyChain: verifyChainSchema,
    exportReceipts: exportReceiptsQuerySchema,
    getReceipts: getReceiptsQuerySchema,
    getSessions: getSessionsQuerySchema
  },
  auth: {
    login: loginSchema,
    register: registerSchema,
    updateUser: updateUserSchema
  },
  audit: {
    createAuditLog: createAuditLogSchema
  },
  receipts: {
    createReceipt: createReceiptSchema
  }
};

export default apiSchemas;
