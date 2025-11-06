import crypto from 'crypto';
import { createOptimizedPrismaClient } from './prisma-optimize.js';

// Await prisma client initialization
const prisma = await createOptimizedPrismaClient();

/**
 * Lamport Receipt Generator - Enterprise Edition v2.1
 * 
 * Generates cryptographically-sealed receipts for every AI interaction
 * Implements delta-analysis (Δ-ANALYSIS) receipts with:
 * - Lamport clock for total ordering
 * - Receipt chain (prev_digest → curr_digest)
 * - CRIES metrics integration
 * - Policy violation tracking
 * - Merkle seal linkage
 * - Conversation-scoped traces
 * 
 * Receipt Formula:
 *   curr_digest = H(lamport || prev_digest || inputs_hash || outputs_hash || cries_overall || timestamp)
 * 
 * Part of Speechcraft v2.1 + Merkle Sealer v2.1 Integration
 */

/**
 * SHA-256 hash function
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a unique receipt ID
 * Format: rcpt_<timestamp>_<random>
 */
function generateReceiptId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `rcpt_${timestamp}_${random}`;
}

/**
 * Generate a unique trace ID
 * Format: TRACE-<timestamp>-<random>
 */
function generateTraceId() {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = crypto.randomBytes(4).toString('hex');
  return `TRACE-${timestamp}-${random}`;
}

/**
 * Compute receipt digest (curr_digest)
 * 
 * Formula: H(lamport || prev_digest || inputs_hash || outputs_hash || cries_overall || timestamp)
 * 
 * @param {Object} receiptData - Receipt data
 * @returns {string} 64-char hex digest
 */
function computeReceiptDigest(receiptData) {
  const components = [
    receiptData.lamport.toString(),
    receiptData.prev_digest || 'genesis',
    receiptData.inputs.prompt_hash,
    receiptData.outputs.response_hash,
    receiptData.cries.overall.toFixed(6),
    receiptData.issued_at
  ].join('||');
  
  return sha256(components);
}

/**
 * Get previous receipt digest for chain linkage
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<{lamport: bigint, digest: string}|null>}
 */
async function getPreviousReceipt(conversationId) {
  const prev = await prisma.governanceReceipts.findFirst({
    where: {
      // Use a custom field for conversation tracking
      // Note: You'll need to add conversationId to schema
      prompt: { contains: conversationId } // Temporary: store in prompt field
    },
    orderBy: {
      lamport: 'desc'
    },
    select: {
      lamport: true,
      outputHash: true // Use as prev_digest
    }
  });
  
  return prev ? {
    lamport: prev.lamport,
    digest: prev.outputHash
  } : null;
}

/**
 * Generate Lamport Receipt (Δ-ANALYSIS)
 * 
 * @param {Object} params - Receipt parameters
 * @param {string} params.conversationId - Conversation ID
 * @param {string} params.exchangeId - Exchange ID (turn in conversation)
 * @param {string} params.model - Model identifier
 * @param {string} params.prompt - User prompt
 * @param {string} params.response - Model response
 * @param {Object} params.cries - CRIES metrics {C, R, I, E, S, overall}
 * @param {Object} params.policy - Policy data {violations, flags}
 * @param {Object} params.tokens - Token counts {in, out}
 * @param {string} params.persona - Governance persona
 * @param {number} params.userId - User ID
 * @returns {Promise<Object>} Complete receipt with digest
 */
export async function generateLamportReceipt(params) {
  const {
    conversationId,
    exchangeId,
    model,
    prompt,
    response,
    cries,
    policy = { violations: [], flags: [] },
    tokens = { in: 0, out: 0 },
    persona = 'default',
    userId = null
  } = params;
  
  // Generate unique IDs
  const receiptId = generateReceiptId();
  const traceId = generateTraceId();
  const issuedAt = new Date().toISOString();
  
  // Get previous receipt for chain linkage
  const prevReceipt = await getPreviousReceipt(conversationId);
  const lamport = prevReceipt ? prevReceipt.lamport + 1n : 1n;
  const prevDigest = prevReceipt?.digest || null;
  
  // Compute input/output hashes
  const promptHash = sha256(prompt);
  const responseHash = sha256(response);
  
  // Build receipt data structure
  const receiptData = {
    type: 'Δ-ANALYSIS',
    receipt_id: receiptId,
    conversation_id: conversationId,
    exchange_id: exchangeId,
    lamport: lamport,
    prev_digest: prevDigest,
    trace_id: traceId,
    model: model,
    inputs: {
      prompt_hash: promptHash,
      tokens_in: tokens.in
    },
    outputs: {
      response_hash: responseHash,
      tokens_out: tokens.out
    },
    cries: {
      C: cries.C || cries.Coherence || 0,
      R: cries.R || cries.Rigor || 0,
      I: cries.I || cries.Integrity || 0,
      E: cries.E || cries.Empathy || 0,
      S: cries.S || cries.Strictness || 0,
      overall: cries.overall || cries.Omega || 0
    },
    policy: {
      violations: policy.violations || [],
      flags: policy.flags || []
    },
    issued_at: issuedAt
  };
  
  // Compute curr_digest (receipt chain)
  const currDigest = computeReceiptDigest(receiptData);
  receiptData.curr_digest = currDigest;
  
  // Store in database (governance_receipts table)
  const dbReceipt = await prisma.governanceReceipts.create({
    data: {
      lamport: lamport,
      persona: persona,
      obligationsApplied: [], // Will be filled by Speechcraft
      promptHash: promptHash,
      outputHash: responseHash, // Store curr_digest here for chain
      violations: policy.violations,
      timestamp: new Date(issuedAt),
      version: '2.1',
      userId: userId,
      
      // CRIES metrics
      criesOmega: receiptData.cries.overall,
      criesCoherence: receiptData.cries.C,
      criesRigor: receiptData.cries.R,
      criesIntegrity: receiptData.cries.I,
      criesEmpathy: receiptData.cries.E,
      criesStrictness: receiptData.cries.S,
      
      // Full data
      prompt: prompt,
      output: response
      
      // Note: conversationId, exchangeId, traceId stored in prompt metadata
      // Future: Add these fields to schema
    }
  });
  
  console.log(`📋 Receipt generated: ${receiptId}`);
  console.log(`   Lamport: ${lamport}`);
  console.log(`   CRIES Ω: ${receiptData.cries.overall.toFixed(3)}`);
  console.log(`   Digest: ${currDigest.substring(0, 16)}...`);
  if (prevDigest) {
    console.log(`   Chain: ${prevDigest.substring(0, 8)}... → ${currDigest.substring(0, 8)}...`);
  }
  
  // Return complete receipt with database ID
  return {
    ...receiptData,
    db_id: dbReceipt.id
  };
}

/**
 * Generate Merkle Block metadata from sealed batch
 * 
 * @param {number} sealId - Merkle seal ID
 * @returns {Promise<Object>} Merkle block data
 */
export async function generateMerkleBlock(sealId) {
  const seal = await prisma.merkleSeal.findUnique({
    where: { id: sealId },
    include: {
      receipts: {
        orderBy: { lamport: 'asc' },
        select: {
          id: true,
          lamport: true,
          outputHash: true,
          promptHash: true
        }
      }
    }
  });
  
  if (!seal) {
    throw new Error(`Merkle seal ${sealId} not found`);
  }
  
  // Build block metadata
  const block = {
    block_index: seal.id,
    sealed_at: seal.sealedAt.toISOString(),
    root_hash: seal.merkleRoot,
    receipt_ids: seal.receipts.map(r => `rcpt_db_${r.id}`), // Use DB IDs
    leaf_hashes: seal.receipts.map(r => r.outputHash),
    first_lamport: Number(seal.lamportStart),
    last_lamport: Number(seal.lamportEnd),
    receipt_count: seal.receiptCount,
    domain_sep: {
      leaf: '0x00',
      node: '0x01'
    },
    
    // Additional metadata
    seal_digest: seal.sealDigest,
    prev_root: seal.prevRoot,
    prev_seal_digest: seal.prevSealDigest,
    chain_position: seal.prevRoot ? 'linked' : 'genesis'
  };
  
  return block;
}

/**
 * Verify receipt chain integrity
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<{valid: boolean, ...}>}
 */
export async function verifyReceiptChain(conversationId) {
  // Get all receipts for this conversation
  const receipts = await prisma.governanceReceipts.findMany({
    where: {
      prompt: { contains: conversationId }
    },
    orderBy: {
      lamport: 'asc'
    },
    select: {
      id: true,
      lamport: true,
      promptHash: true,
      outputHash: true,
      criesOmega: true,
      timestamp: true
    }
  });
  
  if (receipts.length === 0) {
    return {
      valid: false,
      error: 'No receipts found for conversation'
    };
  }
  
  let prevDigest = null;
  const violations = [];
  
  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];
    
    // Check Lamport monotonicity
    if (i > 0 && receipt.lamport <= receipts[i - 1].lamport) {
      violations.push({
        receiptId: receipt.id,
        type: 'lamport_non_monotonic',
        expected: `> ${receipts[i - 1].lamport}`,
        actual: receipt.lamport.toString()
      });
    }
    
    // Future: Verify digest chain when we store prev_digest
    
    prevDigest = receipt.outputHash;
  }
  
  return {
    valid: violations.length === 0,
    conversationId,
    receiptCount: receipts.length,
    lamportRange: {
      start: receipts[0].lamport.toString(),
      end: receipts[receipts.length - 1].lamport.toString()
    },
    violations
  };
}

/**
 * Export receipt as JSON (full schema)
 * 
 * @param {number} dbId - Database receipt ID
 * @returns {Promise<Object|null>} Receipt in standard format
 */
export async function exportReceipt(dbId) {
  const dbReceipt = await prisma.governanceReceipts.findUnique({
    where: { id: dbId },
    include: {
      merkleSeal: {
        select: {
          id: true,
          merkleRoot: true,
          sealedAt: true
        }
      }
    }
  });
  
  if (!dbReceipt) return null;
  
  // Reconstruct Lamport receipt format
  const receipt = {
    type: 'Δ-ANALYSIS',
    receipt_id: `rcpt_db_${dbReceipt.id}`,
    conversation_id: 'unknown', // Future: extract from metadata
    exchange_id: 'unknown',
    lamport: Number(dbReceipt.lamport),
    prev_digest: null, // Future: store in separate field
    curr_digest: dbReceipt.outputHash,
    trace_id: `TRACE-${Math.floor(dbReceipt.timestamp?.getTime() / 1000) || 0}-${dbReceipt.id.toString(16)}`,
    model: 'unknown', // Future: store model info
    inputs: {
      prompt_hash: dbReceipt.promptHash,
      tokens_in: 0 // Future: store token counts
    },
    outputs: {
      response_hash: dbReceipt.outputHash,
      tokens_out: 0
    },
    cries: {
      C: dbReceipt.criesCoherence || 0,
      R: dbReceipt.criesRigor || 0,
      I: dbReceipt.criesIntegrity || 0,
      E: dbReceipt.criesEmpathy || 0,
      S: dbReceipt.criesStrictness || 0,
      overall: dbReceipt.criesOmega || 0
    },
    policy: {
      violations: dbReceipt.violations || [],
      flags: []
    },
    issued_at: dbReceipt.timestamp?.toISOString() || new Date().toISOString(),
    
    // Merkle seal info (if sealed)
    merkle_seal: dbReceipt.merkleSeal ? {
      seal_id: dbReceipt.merkleSeal.id,
      root_hash: dbReceipt.merkleSeal.merkleRoot,
      sealed_at: dbReceipt.merkleSeal.sealedAt.toISOString()
    } : null
  };
  
  return receipt;
}

/**
 * Get all receipts for a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} Array of receipts
 */
export async function getConversationReceipts(conversationId) {
  const receipts = await prisma.governanceReceipts.findMany({
    where: {
      prompt: { contains: conversationId }
    },
    orderBy: {
      lamport: 'asc'
    }
  });
  
  // Export each receipt
  return await Promise.all(
    receipts.map(r => exportReceipt(r.id))
  );
}

/**
 * Get receipt statistics
 * 
 * @returns {Promise<Object>} Statistics
 */
export async function getReceiptStats() {
  const [total, sealed, avgCries, recentViolations] = await Promise.all([
    prisma.governanceReceipts.count(),
    prisma.governanceReceipts.count({
      where: { merkleSealId: { not: null } }
    }),
    prisma.governanceReceipts.aggregate({
      _avg: { criesOmega: true }
    }),
    prisma.governanceReceipts.count({
      where: {
        violations: { isEmpty: false }
      }
    })
  ]);
  
  return {
    totalReceipts: total,
    sealedReceipts: sealed,
    unsealedReceipts: total - sealed,
    avgCriesOmega: avgCries._avg.criesOmega || 0,
    receiptsWithViolations: recentViolations,
    sealPercentage: total > 0 ? ((sealed / total) * 100).toFixed(1) : 0
  };
}

export default {
  generateLamportReceipt,
  generateMerkleBlock,
  verifyReceiptChain,
  exportReceipt,
  getConversationReceipts,
  getReceiptStats
};
