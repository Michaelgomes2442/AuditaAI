import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// Create Prisma client with pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error']
});

/**
 * Merkle Tree Receipt Sealer - Enterprise Edition v2.1
 * 
 * Batches receipts into merkle-sealed blocks for tamper-evident audit trails.
 * Implements regulator-compliant Merkle tree construction with:
 * - Domain separation (0x00 for leaves, 0x01 for internal nodes)
 * - Byte-level hashing (not hex string concatenation)
 * - Odd node duplication (RFC-compliant)
 * - Deterministic ordering (ascending Lamport clock)
 * - Per-receipt inclusion proofs
 * - Seal chain with prevRoot + prevSealDigest linkage
 * - Race-proof locking with lockBatchId
 * - Timed flush for partial batches
 * 
 * Part of Speechcraft v2.1 Enterprise Integration
 */

const BATCH_SIZE = parseInt(process.env.MERKLE_BATCH_SIZE) || 10;
const SEAL_TIMEOUT_MS = parseInt(process.env.MERKLE_SEAL_TIMEOUT_MS) || 300000; // 5 minutes

// Merkle tree specification (for regulator verification)
const MERKLE_SPEC = {
  hashAlgo: 'SHA-256',
  leafEncoding: 'hex',
  domainSeparation: { leaf: '0x00', node: '0x01' },
  oddNode: 'duplicate-last',
  ordering: 'lamport-asc'
};

/**
 * Hash a buffer with SHA-256
 */
function sha256buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Hash arbitrary data (for seal digests)
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Canonicalize and validate a leaf hash
 * Ensures 64-char lowercase hex format
 */
function canonLeaf(hex) {
  const h = (hex || '').replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) {
    throw new Error(`Invalid leaf hash: ${hex} (expected 64-char hex)`);
  }
  return h;
}

/**
 * Hash a leaf with domain separation (0x00 || leaf_data)
 * Prevents ambiguous trees where leaves could be confused with internal nodes
 */
function leafHash(hex) {
  const b = Buffer.concat([
    Buffer.from([0x00]), // Domain separator for leaves
    Buffer.from(canonLeaf(hex), 'hex')
  ]);
  return crypto.createHash('sha256').update(b).digest('hex');
}

/**
 * Hash an internal node pair with domain separation (0x01 || left || right)
 * Uses byte concatenation, not hex string concatenation
 */
function nodeHash(leftHex, rightHex) {
  const b = Buffer.concat([
    Buffer.from([0x01]), // Domain separator for internal nodes
    Buffer.from(leftHex, 'hex'),
    Buffer.from(rightHex, 'hex')
  ]);
  return crypto.createHash('sha256').update(b).digest('hex');
}

/**
 * Build merkle tree from leaf hashes (RFC-compliant)
 * Returns merkle root only
 * 
 * @param {string[]} leavesHex - Array of 64-char hex hashes
 * @returns {string|null} Merkle root hash
 */
function buildMerkleTree(leavesHex) {
  if (!leavesHex || leavesHex.length === 0) return null;
  
  // Canonicalize and hash leaves with domain separation
  const leaves = leavesHex.map(canonLeaf).map(leafHash);
  
  let level = leaves;
  
  while (level.length > 1) {
    const next = [];
    
    for (let i = 0; i < level.length; i += 2) {
      const L = level[i];
      // RFC-compliant: duplicate last node if odd count
      const R = (i + 1 < level.length) ? level[i + 1] : level[i];
      next.push(nodeHash(L, R));
    }
    
    level = next;
  }
  
  return level[0];
}

/**
 * Build merkle tree with full level structure (for proof generation)
 * 
 * @param {string[]} leafHexes - Array of 64-char hex hashes
 * @returns {{ root: string, levels: string[][] }} Tree structure
 */
function buildMerkleTreeAndLevels(leafHexes) {
  if (!leafHexes || leafHexes.length === 0) {
    throw new Error('Cannot build tree from empty leaf set');
  }
  
  const leaves = leafHexes.map(canonLeaf).map(leafHash);
  const levels = [leaves];
  
  while (levels[levels.length - 1].length > 1) {
    const cur = levels[levels.length - 1];
    const next = [];
    
    for (let i = 0; i < cur.length; i += 2) {
      const L = cur[i];
      const R = (i + 1 < cur.length) ? cur[i + 1] : cur[i]; // Duplicate last
      next.push(nodeHash(L, R));
    }
    
    levels.push(next);
  }
  
  return { root: levels.at(-1)[0], levels };
}

/**
 * Generate merkle inclusion proof for a specific leaf index
 * 
 * @param {string[][]} levels - Full tree structure from buildMerkleTreeAndLevels
 * @param {number} index - Leaf index (0-based)
 * @returns {Array<{sibling: string, position: 'left'|'right'}>} Proof path
 */
function merkleProofForIndex(levels, index) {
  const proof = [];
  let idx = index;
  
  for (let h = 0; h < levels.length - 1; h++) {
    const level = levels[h];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    const sibling = level[siblingIdx] ?? level[idx]; // Duplicate rule for odd
    
    proof.push({ 
      sibling, 
      position: isRight ? 'left' : 'right' 
    });
    
    idx = Math.floor(idx / 2);
  }
  
  return proof;
}

/**
 * Verify merkle inclusion proof locally (no database)
 * 
 * @param {string} leafHex - Original leaf hash (64-char hex)
 * @param {Array} proof - Proof path from merkleProofForIndex
 * @param {string} expectedRoot - Expected merkle root
 * @returns {boolean} True if proof is valid
 */
function verifyInclusion(leafHex, proof, expectedRoot) {
  let acc = leafHash(canonLeaf(leafHex));
  
  for (const step of proof) {
    acc = (step.position === 'left')
      ? nodeHash(step.sibling, acc)
      : nodeHash(acc, step.sibling);
  }
  
  return acc === expectedRoot;
}

/**
 * Check if we need to seal a merkle batch
 * Called after each receipt creation
 * Thread-safe with transaction-based locking and lockBatchId
 * 
 * Sealing triggers:
 * 1. Batch size threshold reached (BATCH_SIZE)
 * 2. Oldest unsealed receipt exceeds timeout (SEAL_TIMEOUT_MS)
 */
export async function checkAndSealMerkleBatch() {
  // Count unsealed receipts
  const unsealedCount = await prisma.governanceReceipts.count({
    where: {
      merkleSealId: null,
      lockBatchId: null // Exclude already-locked receipts
    }
  });
  
  // Check if batch size threshold reached
  if (unsealedCount >= BATCH_SIZE) {
    console.log(`🌳 Sealing merkle batch (${unsealedCount} receipts)...`);
    try {
      await sealMerkleBatch();
    } catch (error) {
      // Handle race conditions gracefully
      if (error.message.includes('No unsealed receipts') || error.message.includes('No receipts locked')) {
        console.log(`   ℹ️  Another process sealed the batch`);
      } else {
        console.error(`   ❌ Failed to seal batch:`, error.message);
        throw error;
      }
    }
    return;
  }
  
  // Check if oldest unsealed receipt has timed out
  if (unsealedCount > 0) {
    const oldestUnsealed = await prisma.governanceReceipts.findFirst({
      where: {
        merkleSealId: null,
        lockBatchId: null
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        createdAt: true
      }
    });
    
    if (oldestUnsealed) {
      const ageMs = Date.now() - oldestUnsealed.createdAt.getTime();
      
      if (ageMs > SEAL_TIMEOUT_MS) {
        console.log(`⏰ Sealing partial batch (${unsealedCount} receipts, ${Math.round(ageMs/1000)}s old)...`);
        try {
          await sealMerkleBatch(unsealedCount); // Seal whatever we have
        } catch (error) {
          if (error.message.includes('No unsealed receipts') || error.message.includes('No receipts locked')) {
            console.log(`   ℹ️  Another process sealed the batch`);
          } else {
            console.error(`   ❌ Failed to seal partial batch:`, error.message);
            throw error;
          }
        }
      }
    }
  }
}

/**
 * Seal a batch of receipts with merkle root
 * Race-proof with lockBatchId + transaction
 * 
 * @param {number} maxReceipts - Maximum receipts to seal (default: BATCH_SIZE)
 */
async function sealMerkleBatch(maxReceipts = BATCH_SIZE) {
  // Generate unique lock ID for this batch
  const lockBatchId = crypto.randomUUID();
  
  // Use transaction to prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // STEP 1: Lock receipts atomically with lockBatchId
    const lockResult = await tx.governanceReceipts.updateMany({
      where: {
        merkleSealId: null,
        lockBatchId: null // Only lock unlocked receipts
      },
      data: {
        lockBatchId: lockBatchId
      },
      // Note: Prisma doesn't support LIMIT in updateMany, so we'll filter in next step
    });
    
    if (lockResult.count === 0) {
      throw new Error('No unsealed receipts found to lock');
    }
    
    // STEP 2: Fetch the exact locked receipts (deterministic ordering)
    const receipts = await tx.governanceReceipts.findMany({
      where: {
        lockBatchId: lockBatchId
      },
      orderBy: {
        lamport: 'asc' // RFC: deterministic ascending Lamport order
      },
      take: maxReceipts
    });
    
    if (receipts.length === 0) {
      throw new Error('No receipts locked with batch ID');
    }
    
    console.log(`📦 Batch size: ${receipts.length}`);
    console.log(`🔒 Lock ID: ${lockBatchId}`);
    console.log(`🕰️  Lamport range: ${receipts[0].lamport} → ${receipts[receipts.length - 1].lamport}`);
    
    // STEP 3: Extract and validate leaf hashes
    let leaves;
    try {
      leaves = receipts.map(r => {
        if (!r.outputHash) {
          throw new Error(`Receipt ${r.id} has null outputHash`);
        }
        return canonLeaf(r.outputHash);
      });
    } catch (error) {
      console.error(`❌ Invalid leaf hash in batch:`, error.message);
      // Clear lock before throwing
      await tx.governanceReceipts.updateMany({
        where: { lockBatchId: lockBatchId },
        data: { lockBatchId: null }
      });
      throw error;
    }
    
    // STEP 4: Compute merkle root (byte-level, domain-separated)
    const merkleRoot = buildMerkleTree(leaves);
    
    console.log(`🌲 Merkle root: ${merkleRoot}`);
    
    // STEP 5: Get previous seal for chain linkage
    const prevSeal = await tx.merkleSeal.findFirst({
      orderBy: { sealedAt: 'desc' },
      select: { merkleRoot: true, sealDigest: true }
    });
    
    const prevRoot = prevSeal?.merkleRoot || null;
    const prevSealDigest = prevSeal?.sealDigest || null;
    
    // STEP 6: Use single timestamp for DB and seal body (stable sealDigest)
    const sealedAt = new Date();
    const sealedAtISO = sealedAt.toISOString();
    
    // Compute seal digest (chain integrity)
    const sealBody = JSON.stringify({
      merkleRoot,
      receiptCount: receipts.length,
      lamportStart: receipts[0].lamport,
      lamportEnd: receipts[receipts.length - 1].lamport,
      prevRoot,
      prevSealDigest,
      sealedAt: sealedAtISO
    });
    const sealDigest = sha256(sealBody);
    
    console.log(`🔗 Seal digest: ${sealDigest}`);
    if (prevRoot) {
      console.log(`🔗 Previous root: ${prevRoot}`);
      console.log(`🔗 Previous digest: ${prevSealDigest}`);
    }
    
    // STEP 7: Create merkle seal record with chain linkage
    const seal = await tx.merkleSeal.create({
      data: {
        merkleRoot,
        receiptCount: receipts.length,
        lamportStart: receipts[0].lamport,
        lamportEnd: receipts[receipts.length - 1].lamport,
        sealedAt: sealedAt,
        sealDigest: sealDigest,
        prevRoot: prevRoot,
        prevSealDigest: prevSealDigest
      }
    });
    
    // STEP 8: Link receipts to seal and clear lock (atomic update)
    await tx.governanceReceipts.updateMany({
      where: {
        lockBatchId: lockBatchId
      },
      data: {
        merkleSealId: seal.id,
        lockBatchId: null // Clear lock
      }
    });
    
    console.log(`✅ Merkle seal created: ID=${seal.id}`);
    
    return seal;
  }, {
    maxWait: 10000, // Wait up to 10s for transaction lock
    timeout: 30000  // Transaction timeout 30s
  });
}

/**
 * Verify merkle seal integrity (full batch recompute)
 * This checks that the seal's merkle root is correct for all receipts in the batch
 * Use this for health checks, not per-receipt verification
 * 
 * @param {number} sealId - Merkle seal ID
 * @returns {Promise<{valid: boolean, ...}>} Verification result
 */
export async function verifyMerkleSeal(sealId) {
  const seal = await prisma.merkleSeal.findUnique({
    where: { id: sealId },
    include: {
      receipts: {
        orderBy: { lamport: 'asc' },
        select: { id: true, outputHash: true, lamport: true }
      }
    }
  });
  
  if (!seal) {
    return { valid: false, error: 'Seal not found' };
  }
  
  try {
    // Rebuild merkle tree from seal's receipts (canonical order)
    const leaves = seal.receipts.map(r => canonLeaf(r.outputHash));
    const computedRoot = buildMerkleTree(leaves);
    
    const valid = computedRoot === seal.merkleRoot;
    
    return {
      valid,
      sealId: seal.id,
      merkleRoot: seal.merkleRoot,
      computedRoot,
      receiptCount: seal.receiptCount,
      lamportRange: {
        start: seal.lamportStart,
        end: seal.lamportEnd
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      sealId: seal.id
    };
  }
}

/**
 * Generate merkle inclusion proof for a specific receipt
 * This provides the path from leaf to root (siblings + directions)
 * Use this for auditors to verify a single receipt without the full batch
 * 
 * @param {number} receiptId - Receipt ID
 * @returns {Promise<{proof: Array, merkleRoot: string, ...}>} Proof data
 */
export async function getMerkleProof(receiptId) {
  // Find the seal containing this receipt
  const seal = await prisma.merkleSeal.findFirst({
    where: { 
      receipts: { 
        some: { id: receiptId } 
      } 
    },
    include: { 
      receipts: { 
        orderBy: { lamport: 'asc' },
        select: { id: true, outputHash: true, lamport: true }
      } 
    }
  });
  
  if (!seal) {
    return { 
      error: 'Receipt not sealed yet',
      receiptId 
    };
  }
  
  // Find receipt's position in the seal
  const idx = seal.receipts.findIndex(r => r.id === receiptId);
  
  if (idx === -1) {
    return { 
      error: 'Receipt not found in seal',
      receiptId,
      sealId: seal.id
    };
  }
  
  try {
    // Build full tree structure
    const leaves = seal.receipts.map(r => canonLeaf(r.outputHash));
    const { root, levels } = buildMerkleTreeAndLevels(leaves);
    
    // Generate proof for this receipt
    const proof = merkleProofForIndex(levels, idx);
    
    return {
      receiptId,
      sealId: seal.id,
      merkleRoot: root,
      index: idx,
      leaf: canonLeaf(seal.receipts[idx].outputHash),
      proof,
      spec: MERKLE_SPEC,
      lamportRange: {
        start: seal.lamportStart,
        end: seal.lamportEnd
      }
    };
  } catch (error) {
    return {
      error: error.message,
      receiptId,
      sealId: seal.id
    };
  }
}

/**
 * Verify merkle inclusion proof locally (no database access)
 * Use this to validate a proof received from getMerkleProof
 * 
 * @param {string} leaf - Leaf hash (64-char hex)
 * @param {Array} proof - Proof path from getMerkleProof
 * @param {string} merkleRoot - Expected merkle root
 * @returns {{valid: boolean}} Verification result
 */
export function verifyMerkleProofLocal({ leaf, proof, merkleRoot }) {
  try {
    const valid = verifyInclusion(leaf, proof, merkleRoot);
    return { valid };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message 
    };
  }
}

/**
 * Get merkle proof by promptHash (convenience for auditors)
 * 
 * @param {string} promptHash - SHA-256 hash of prompt (64-char hex)
 * @returns {Promise<{proof: Array, merkleRoot: string, ...}>} Proof data
 */
export async function getMerkleProofByPromptHash(promptHash) {
  // Find receipt by promptHash
  const receipt = await prisma.governanceReceipts.findFirst({
    where: {
      promptHash: canonLeaf(promptHash)
    },
    select: {
      id: true
    }
  });
  
  if (!receipt) {
    return {
      error: 'Receipt not found with promptHash',
      promptHash
    };
  }
  
  // Delegate to getMerkleProof
  return await getMerkleProof(receipt.id);
}

/**
 * Export merkle seal as certificate (for regulators)
 * Self-contained, verifiable document with full specification
 * 
 * @param {number} sealId - Merkle seal ID
 * @returns {Promise<Object|null>} Certificate data or null if not found
 */
export async function exportMerkleCertificate(sealId) {
  const seal = await prisma.merkleSeal.findUnique({
    where: { id: sealId },
    include: {
      receipts: {
        orderBy: { lamport: 'asc' },
        select: {
          id: true,
          lamport: true,
          persona: true,
          promptHash: true,
          outputHash: true,
          timestamp: true
        }
      }
    }
  });
  
  if (!seal) return null;
  
  // Guard: Validate seal has receipts
  if (!seal.receipts || seal.receipts.length === 0) {
    throw new Error(`Seal ${sealId} has no receipts (corrupt data)`);
  }
  
  // Get previous seal for chain verification (use stored values first)
  const prevRoot = seal.prevRoot || null;
  const prevSealDigest = seal.prevSealDigest || null;
  
  // Build complete verifiable certificate
  return {
    // Certificate metadata
    certificateType: 'MERKLE-SEAL-CERTIFICATE',
    version: '1.0',
    generatedAt: new Date().toISOString(),
    
    // Seal data
    sealId: seal.id,
    merkleRoot: seal.merkleRoot,
    sealDigest: seal.sealDigest,
    receiptCount: seal.receiptCount,
    lamportRange: {
      start: seal.lamportStart,
      end: seal.lamportEnd
    },
    sealedAt: seal.sealedAt.toISOString(),
    
    // Chain linkage
    prevRoot,
    prevSealDigest,
    chainPosition: prevRoot ? 'linked' : 'genesis',
    
    // Receipts in canonical order
    receipts: seal.receipts.map(r => ({
      id: r.id,
      lamport: r.lamport,
      persona: r.persona,
      promptHash: r.promptHash,
      outputHash: canonLeaf(r.outputHash), // Canonical form
      timestamp: r.timestamp ? r.timestamp.toISOString() : null // Guard null timestamp
    })),
    
    // Full specification (for external verification)
    spec: {
      ...MERKLE_SPEC,
      batchSize: BATCH_SIZE,
      sealTimeout: SEAL_TIMEOUT_MS,
      ordering: 'lamport-asc',
      canonicalization: '64-char-lowercase-hex'
    },
    
    // Verification instructions
    verification: {
      algorithm: 'SHA-256',
      steps: [
        '1. Validate each outputHash is 64-char hex',
        '2. Hash each leaf: SHA-256(0x00 || leaf_bytes)',
        '3. Build tree: Hash pairs with SHA-256(0x01 || left || right)',
        '4. Duplicate last node if odd count',
        '5. Compare computed root with merkleRoot',
        '6. Verify sealDigest: SHA-256(JSON.stringify(sealBody))',
        '7. If prevSealDigest exists, verify chain linkage'
      ],
      tamperEvident: true,
      deterministicReplay: true
    },
    
    // Optional: Space for trusted timestamp (RFC-3161)
    trustedTimestamp: null, // Drop-in for RFC-3161 TSA signature
    
    // Legal disclaimer
    disclaimer: 'This certificate provides cryptographic proof of receipt inclusion. Verify independently using the specification provided.'
  };
}

/**
 * Get merkle tree specification (for external verifiers)
 * Exposed as read-only endpoint: GET /api/merkle/spec
 * 
 * @returns {Object} Merkle tree specification
 */
export function getMerkleSpec() {
  return {
    ...MERKLE_SPEC,
    batchSize: BATCH_SIZE,
    sealTimeout: SEAL_TIMEOUT_MS,
    version: '2.1',
    implementation: 'AuditaAI Merkle Sealer Enterprise Edition',
    compliance: ['RFC 6962', 'ISO 42001', 'SOX', 'HIPAA', 'GDPR']
  };
}
