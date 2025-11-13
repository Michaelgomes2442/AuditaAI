  import crypto from 'crypto';
import { createOptimizedPrismaClient } from './prisma-optimize.js';
import { computeForge } from './forge/v1/index.js';

// Helper function to recursively sort object keys for consistent hashing
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  return sorted;
}

/**
 * Receipt Service - Manages Δ-Receipt hash chains and verification
 * Implements Rosetta Monolith receipt system with continuous hash linkage
 */
class ReceiptService {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Get the latest receipt for hash chain continuity
   */
  async getLatestReceipt() {
    // Guard: if prisma model accessor isn't available (some clients/wrappers)
    // fall back to a raw query that returns the same shape.
    try {
      if (this.prisma && this.prisma.bENReceipt && typeof this.prisma.bENReceipt.findFirst === 'function') {
        return await this.prisma.bENReceipt.findFirst({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            lamportClock: true,
            digest: true,
            receiptType: true,
            realTimestamp: true
          },
          cacheStrategy: {
            swr: 60, // Stale-while-revalidating for 60 seconds
            ttl: 60, // Cache results for 60 seconds
          }
        });
      }

      // Raw SQL fallback (return a consistent shape)
      const rows = await this.prisma.$queryRaw`
        SELECT id, lamport_clock as "lamportClock", digest, receipt_type as "receiptType", real_timestamp as "realTimestamp"
        FROM ben_receipts
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) return null;
      return {
        id: row.id,
        lamportClock: row.lamportClock,
        digest: row.digest,
        receiptType: row.receiptType,
        realTimestamp: row.realTimestamp
      };
    } catch (err) {
      console.warn('getLatestReceipt fallback failed:', err?.message || err);
      return null;
    }
  }

  /**
   * Generate deterministic FORGE metrics from text analysis
   * Uses FORGE production scoring
   */
  async calculateFORGEMetrics(text, prompt = '') {
    // Use FORGE computation (domain-adaptive)
    const forgeResult = await computeForge(prompt, text);

    if (!text || typeof text !== 'string') {
      return {
        F: 0.1, O: 0.1, R: 0.1, G: 0.1, E: 0.1,
        overall: 0.1,
        domain: 'GENERAL',
        explanations: {
          fabrication: 'Invalid input text',
          oversight: 'Invalid input text',
          refusal: 'Invalid input text',
          guidance: 'Invalid input text',
          evidence: 'Invalid input text'
        }
      };
    }

    try {
      return {
        // Short form for storage
        F: forgeResult.F,
        O: forgeResult.O,
        R: forgeResult.R,
        G: forgeResult.G,
        E: forgeResult.E,
        Φ: forgeResult.Φ,
        overall: forgeResult.Φ,
        // Long form for API responses
        fabrication: forgeResult.F,
        oversight: forgeResult.O,
        refusal: forgeResult.R,
        guidance: forgeResult.G,
        evidence: forgeResult.E,
        explanations: forgeResult.components || null
      };
    } catch (error) {
      console.warn('FORGE computation failed, using fallback:', error.message);
      // Fallback to a conservative default
      return {
        F: 0.2, O: 0.2, R: 0.2, G: 0.2, E: 0.2,
        overall: 0.2,
        fabrication: 0.2,
        oversight: 0.2,
        refusal: 0.2,
        guidance: 0.2,
        evidence: 0.2,
        explanations: null
      };
    }
  }

  /**
   * Fallback lightweight metrics calculation for error cases
   */
  fallbackMetrics(text, prompt = '') {
    const tokens = text.split(/\s+/).filter(t => t.length > 0);
    const tokenCount = tokens.length;

    // Basic sentence structure -> oversight
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const oversight = Math.min(1.0, Math.max(0.1, sentences.length > 0 ? 0.5 : 0.1));

    // Basic refusal/reliability proxy -> refusal
    const hasCitations = /\[\d+\]|\(\d{4}\)|according to|research shows/i.test(text);
    const refusal = Math.min(1.0, Math.max(0.1, hasCitations ? 0.6 : 0.3));

    // Basic integrity -> guidance proxy
    const guidance = Math.min(1.0, Math.max(0.1, 0.5));

    // Basic effectiveness -> evidence proxy
    const evidence = Math.min(1.0, Math.max(0.1, tokenCount > 10 ? 0.5 : 0.2));

    // Basic security/harm detection -> fabrication proxy
    const hasHarmful = /\b(kill|harm|attack|steal)\b/i.test(text);
    const fabrication = Math.min(1.0, Math.max(0.1, hasHarmful ? 0.2 : 0.7));

    // Use canonical Ω weights even in fallback (map into FORGE order)
    const overall = (oversight * 0.28) + (refusal * 0.20) + (guidance * 0.20) + (evidence * 0.16) + (fabrication * 0.16);

    return {
      // Storage short-form using FORGE letters
      F: Number(fabrication.toFixed(4)),
      O: Number(oversight.toFixed(4)),
      R: Number(refusal.toFixed(4)),
      G: Number(guidance.toFixed(4)),
      E: Number(evidence.toFixed(4)),
      overall: Number(overall.toFixed(4)),

      // Long-form API fields
      fabrication: Number(fabrication.toFixed(4)),
      oversight: Number(oversight.toFixed(4)),
      refusal: Number(refusal.toFixed(4)),
      guidance: Number(guidance.toFixed(4)),
      evidence: Number(evidence.toFixed(4)),

      explanations: {
        fabrication: 'Fallback: Harmful content detection mapped to fabrication risk',
        oversight: 'Fallback: Basic sentence structure analysis mapped to oversight',
        refusal: 'Fallback: Citation pattern detection mapped to refusal/reliability',
        guidance: 'Fallback: Basic integrity check mapped to guidance',
        evidence: 'Fallback: Response length and relevance mapped to evidence grounding'
      }
    };
  }

  calculateRepetitionRatio(tokens) {
    const uniqueTokens = new Set(tokens.map(t => t.toLowerCase()));
    return 1 - (uniqueTokens.size / tokens.length);
  }

  calculateSentimentBalance(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => count + (lowerText.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (lowerText.split(word).length - 1), 0);

    const total = positiveCount + negativeCount;
    return total === 0 ? 0.5 : Math.abs(positiveCount - negativeCount) / total;
  }

  detectManipulation(text) {
    // Simple manipulation detection based on patterns
    const manipulationPatterns = [
      /absolutely|definitely|obviously|certainly/gi,
      /everyone knows|it's clear that|undoubtedly/gi,
      /fake news|conspiracy|they don't want you to know/gi
    ];

    let score = 0;
    manipulationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 0.1;
    });

    return Math.min(1.0, score);
  }

  calculateRelevance(text, prompt) {
    const promptWords = prompt.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);

    const commonWords = promptWords.filter(word =>
      word.length > 3 && textWords.includes(word)
    );

    return Math.min(1.0, commonWords.length / Math.max(promptWords.length, 1));
  }

  containsHarmfulContent(text) {
    const harmfulPatterns = [
      /hack|exploit|vulnerability|attack/i,
      /password|credential|secret|key/i,
      /illegal|crime|fraud/i
    ];

    return harmfulPatterns.some(pattern => pattern.test(text));
  }

  hasVulnerabilities(text) {
    // Check for potential code injection, XSS, etc.
    const vulnPatterns = [
      /<script|<iframe|<object/i,
      /javascript:|data:|vbscript:/i,
      /eval\(|Function\(|setTimeout.*\)/i
    ];

    return vulnPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Generate Δ-ANALYSIS receipt with proper hash chain
   */
  async generateAnalysisReceipt(modelId, prompt, response, forgeMetrics, userId = null, metadata = {}) {
    // Get the latest receipt for hash chain continuity
    const latestReceipt = await this.getLatestReceipt();
    // Increment lamport clock atomically using database.
    // Use Prisma model upsert if available, otherwise fall back to a safe raw SQL upsert.
    let lamportResult = null;
    try {
      if (this.prisma && this.prisma.lamportCounter && typeof this.prisma.lamportCounter.upsert === 'function') {
        lamportResult = await this.prisma.lamportCounter.upsert({
          where: { id: 1 },
          update: { currentValue: { increment: 1 }, lastUpdated: new Date() },
          create: { id: 1, currentValue: 1, lastUpdated: new Date() }
        });
      } else {
        // Raw SQL fallback using Postgres ON CONFLICT ... DO UPDATE RETURNING
        const rows = await this.prisma.$queryRaw`
          INSERT INTO lamport_counter (id, "currentValue", "lastUpdated")
          VALUES (1, 1, now())
          ON CONFLICT (id) DO UPDATE
            SET "currentValue" = lamport_counter."currentValue" + 1, "lastUpdated" = now()
          RETURNING id, "currentValue", "lastUpdated";
        `;
        lamportResult = Array.isArray(rows) ? rows[0] : rows;
      }
    } catch (err) {
      console.warn('lamportCounter increment failed, falling back to safe default:', err?.message || err);
      lamportResult = { currentValue: 0 }; // safe fallback
    }

    // Ensure we have an explicit lamportClock number
    const lamportClock = lamportResult?.currentValue ?? lamportResult?.current_value ?? 0;

    // Find the correct previous receipt based on lamport clock (sequential ordering)
    // Since lamport clocks are incremented atomically, previous receipt has lamportClock = currentLamport - 1
    let previousReceipt = null;
    try {
      if (lamportClock > 0) {
        previousReceipt = await this.prisma.bENReceipt.findFirst({
          where: { lamportClock: lamportClock - 1 },
          select: { digest: true }
        });
      }
    } catch (err) {
      console.warn('previousReceipt lookup failed:', err?.message || err);
      previousReceipt = null;
    }

    const receiptData = {
      analysis_id: `ANALYSIS-${modelId}-L${lamportClock}-${Date.now()}`,
      conversation_id: 'default',
      forge: {
        F: Math.round((forgeMetrics?.F ?? forgeMetrics?.fabrication ?? 0) * 10000) / 10000,
        O: Math.round((forgeMetrics?.O ?? forgeMetrics?.oversight ?? 0) * 10000) / 10000,
        R: Math.round((forgeMetrics?.R ?? forgeMetrics?.refusal ?? 0) * 10000) / 10000,
        G: Math.round((forgeMetrics?.G ?? forgeMetrics?.guidance ?? 0) * 10000) / 10000,
        E: Math.round((forgeMetrics?.E ?? forgeMetrics?.evidence ?? 0) * 10000) / 10000,
        overall: Math.round((forgeMetrics?.overall ?? forgeMetrics?.Φ ?? 0) * 10000) / 10000
      },
      digest_verified: false,
      lamport: lamportClock,
      previous_hash: previousReceipt ? previousReceipt.digest : null,
      receipt_type: "ANALYSIS",
      risk_flags: [],
      self_hash: '', // Will be calculated
      sigma_window: {
        σ: forgeMetrics.overall,
        "σ*": 0.15 // Standard threshold (kept for legacy analysis compatibility)
      },
      trace_id: `TRACE-${Date.now()}`,
      tri_actor_role: "Track-A/Analyst",
      ts: new Date().toISOString(),
      model: modelId,
      prompt: prompt,
      response: response,
      metadata: {
        ...metadata,
        governance_version: 'FORGEv1',
        forged_applied: true
      }
    };

    // --- Registry append logic ---
    // Append a summary of this receipt to backend/receipts/registry.json
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const REGISTRY_PATH = path.join(__dirname, '../receipts/registry.json');
      let registry = [];
      if (fs.existsSync(REGISTRY_PATH)) {
        try {
          registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
        } catch (e) {
          console.warn('Failed to parse registry.json, starting fresh:', e.message);
          registry = [];
        }
      }
      // Only store a summary, not the full receipt
      const summary = {
        analysis_id: receiptData.analysis_id,
        lamport: lamportClock,
        event: 'Δ-ANALYSIS',
        self_hash: '', // Will be filled after hash calculation
        ts: receiptData.ts,
        model: modelId,
        forge: receiptData.forge,
        userId: userId,
        metadata: receiptData.metadata
      };
      // We'll fill self_hash after hash calculation below
      registry.push(summary);
      // Write back after hash is calculated (see below)
      var registryWritePending = { registry, summaryIndex: registry.length - 1, REGISTRY_PATH, fs };
    } catch (e) {
      console.warn('Failed to append to registry.json:', e.message);
    }

    // Generate cryptographic signature (simplified for testing)
    // Use deterministic key for testing so signatures can be verified
    const privateKey = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
    const signatureData = JSON.stringify({
      analysis_id: receiptData.analysis_id,
      self_hash: '', // Will be filled after hash calculation
      timestamp: receiptData.ts
    });
    const signature = crypto.createHmac('sha256', privateKey)
      .update(signatureData)
      .digest('hex');

    // Create the final receipt data object
    const finalReceiptData = {
      ...receiptData,
      signature: crypto.createHmac('sha256', privateKey)
        .update(JSON.stringify({
          analysis_id: receiptData.analysis_id,
          self_hash: '', // Same as initial signature generation
          timestamp: receiptData.ts
        }))
        .digest('hex'),
      public_key: publicKey
    };

    // Calculate self_hash excluding the self_hash, signature, and lamport fields
    const sortedReceiptData = Object.keys(finalReceiptData).sort().reduce((result, key) => {
      // Exclude self_hash, signature, and lamport from hash calculation as they are derived or metadata
      if (key !== 'self_hash' && key !== 'signature' && key !== 'lamport') {
        result[key] = finalReceiptData[key];
      }
      return result;
    }, {});
    const deeplySortedReceiptData = sortObjectKeys(sortedReceiptData);
    console.log('DEBUG: Hash calculation - sorted keys:', Object.keys(deeplySortedReceiptData));
    console.log('DEBUG: Hash calculation - JSON length:', JSON.stringify(deeplySortedReceiptData).length);
    console.log('DEBUG: Hash calculation - JSON string:', JSON.stringify(deeplySortedReceiptData));
    const selfHash = crypto.createHash('sha256')
      .update(JSON.stringify(deeplySortedReceiptData))
      .digest('hex');
    console.log('DEBUG: Calculated selfHash:', selfHash);

    finalReceiptData.self_hash = selfHash;

    // --- Complete registry append with self_hash ---
    if (typeof registryWritePending === 'object' && registryWritePending.registry && registryWritePending.summaryIndex >= 0) {
      try {
        registryWritePending.registry[registryWritePending.summaryIndex].self_hash = selfHash;
        registryWritePending.fs.writeFileSync(
          registryWritePending.REGISTRY_PATH,
          JSON.stringify(registryWritePending.registry, null, 2),
          'utf-8'
        );
      } catch (e) {
        console.warn('Failed to write updated registry.json:', e.message);
      }
    }

    // Verify the hash integrity immediately after calculation
    const verificationPayload = Object.keys(finalReceiptData).sort().reduce((result, key) => {
      // Exclude self_hash, signature, and lamport from hash calculation as they are derived or metadata
      if (key !== 'self_hash' && key !== 'signature' && key !== 'lamport') {
        result[key] = finalReceiptData[key];
      }
      return result;
    }, {});
    const deeplySortedVerificationPayload = sortObjectKeys(verificationPayload);
    const calculatedVerificationHash = crypto.createHash('sha256')
      .update(JSON.stringify(deeplySortedVerificationPayload))
      .digest('hex');
    const digestVerified = calculatedVerificationHash === selfHash;

    // Update digest_verified based on verification result
    finalReceiptData.digest_verified = digestVerified;

    console.log('DEBUG: Hash verification - calculated:', calculatedVerificationHash);
    console.log('DEBUG: Hash verification - stored:', selfHash);
    console.log('DEBUG: Digest verified:', digestVerified);

    // Update signature with actual hash
    finalReceiptData.signature = crypto.createHmac('sha256', privateKey)
      .update(JSON.stringify({
        analysis_id: finalReceiptData.analysis_id,
        self_hash: selfHash,
        timestamp: finalReceiptData.ts
      }))
      .digest('hex');

    // Use the correctly determined previous receipt digest
    const computedPreviousDigest = previousReceipt ? previousReceipt.digest : null;

    const savedReceipt = await this.prisma.bENReceipt.create({
      data: {
        // Use the delta-analysis type string to match payload.receipt_type
        receiptType: 'ANALYSIS',
        lamportClock: lamportClock,
        realTimestamp: new Date(),
        userId: userId,
        payload: finalReceiptData,
        digest: selfHash,
        previousDigest: computedPreviousDigest,
        witnessModel: modelId,
        metadata: {
          prompt_length: prompt.length,
          response_length: response.length,
          forge_overall: forgeMetrics.overall
        }
      }
    });

    return {
      ...finalReceiptData,
      id: savedReceipt.id,
      hash: selfHash,
      timestamp: finalReceiptData.ts,
      db_id: savedReceipt.id // Keep for backward compatibility
    };
  }

  /**
   * Verify receipt hash chain integrity
   */
  async verifyReceiptChain(receiptId) {
    const receipt = await this.prisma.bENReceipt.findUnique({
      where: { id: receiptId },
      select: {
        id: true,
        digest: true,
        previousDigest: true,
        payload: true,
        lamportClock: true
      }
    });

    if (!receipt) {
      return {
        valid: false,
        hash_integrity: false,
        chain_integrity: false,
        chain_position: -1,
        governance_valid: false,
        error: 'Receipt not found'
      };
    }

    // Verify self-hash - recreate the exact conditions from generation
    const payload = { ...receipt.payload };

    // Reset digest_verified to false as used during generation
    payload.digest_verified = false;

    // Reset signature to initial state as used in generation
    const privateKey = process.env.NODE_ENV === 'test' ?
      Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex') :
      crypto.randomBytes(32);
    payload.signature = crypto.createHmac('sha256', privateKey)
      .update(JSON.stringify({
        analysis_id: payload.analysis_id,
        self_hash: 'placeholder', // Use 'placeholder' as in generation
        timestamp: payload.ts
      }))
      .digest('hex');

    // previous_hash should already be correct in the payload
    const sortedPayload = Object.keys(payload).sort().reduce((result, key) => {
      // Exclude self_hash, signature, and lamport from hash calculation as they are derived or metadata
      // Note: digest_verified is included in hash calculation
      if (key !== 'self_hash' && key !== 'signature' && key !== 'lamport') {
        result[key] = payload[key];
      }
      return result;
    }, {});
    const deeplySortedPayload = sortObjectKeys(sortedPayload);
    console.log('DEBUG: Verification - sorted keys:', Object.keys(deeplySortedPayload));
    console.log('DEBUG: Verification - JSON length:', JSON.stringify(deeplySortedPayload).length);
    console.log('DEBUG: Verification - JSON string:', JSON.stringify(deeplySortedPayload));
    const calculatedHash = crypto.createHash('sha256')
      .update(JSON.stringify(deeplySortedPayload))
      .digest('hex');
    console.log('DEBUG: Verification calculated hash:', calculatedHash);
    console.log('DEBUG: Stored digest:', receipt.digest);

    const hashIntegrity = calculatedHash === receipt.digest;

    if (!hashIntegrity) {
      return {
        valid: false,
        hash_integrity: false,
        chain_position: receipt.lamportClock,
        error: 'hash'
      };
    }

    // Verify chain continuity
    if (receipt.previousDigest) {
      const prevReceipt = await this.prisma.bENReceipt.findFirst({
        where: { digest: receipt.previousDigest },
        select: { lamportClock: true }
      });

      if (!prevReceipt) {
        return {
          valid: false,
          hash_integrity: false,
          chain_position: receipt.lamportClock,
          error: 'chain_discontinuity'
        };
      }

      if (prevReceipt.lamportClock >= receipt.lamportClock) {
        return {
          valid: false,
          hash_integrity: false,
          chain_position: receipt.lamportClock,
          error: 'chain_discontinuity'
        };
      }
    }

    return {
      valid: true,
      hash_integrity: true,
      chain_integrity: true,
      chain_position: receipt.lamportClock,
      governance_valid: true
    };
  }

  /**
   * Export receipts in NDJSON format
   */
  async exportReceiptsNDJSON(startDate = null, endDate = null, limit = 1000) {
    const where = {};
    if (startDate || endDate) {
      where.realTimestamp = {};
      if (startDate) where.realTimestamp.gte = new Date(startDate);
      if (endDate) where.realTimestamp.lte = new Date(endDate);
    }

    const receipts = await this.prisma.bENReceipt.findMany({
      where,
      orderBy: { lamportClock: 'asc' },
      cacheStrategy: {
        swr: Number(process.env.RECEIPT_CACHE_SWR || 60),
        ttl: Number(process.env.RECEIPT_CACHE_TTL || 60),
      },
      take: limit,
      select: {
        id: true,
        receiptType: true,
        lamportClock: true,
        realTimestamp: true,
        payload: true,
        digest: true,
        previousDigest: true,
        witnessModel: true
      }
    });

    return receipts.map(receipt => JSON.stringify({
      id: receipt.id,
      hash: receipt.digest,
      signature: receipt.payload.signature,
      data: receipt.payload
    })).join('\n');
  }

  /**
   * Get receipts for export in JSON format (for test compatibility)
   */
  async getReceiptsForExport(startDate = null, endDate = null, limit = 1000) {
    const where = {};
    if (startDate || endDate) {
      where.realTimestamp = {};
      if (startDate) where.realTimestamp.gte = new Date(startDate);
      if (endDate) where.realTimestamp.lte = new Date(endDate);
    }

    const receipts = await this.prisma.bENReceipt.findMany({
      where,
      orderBy: { lamportClock: 'asc' },
      cacheStrategy: {
        swr: Number(process.env.RECEIPT_CACHE_SWR || 60),
        ttl: Number(process.env.RECEIPT_CACHE_TTL || 60),
      },
      take: limit,
      select: {
        id: true,
        receiptType: true,
        lamportClock: true,
        realTimestamp: true,
        payload: true,
        digest: true,
        previousDigest: true,
        witnessModel: true
      }
    });

    // Transform to expected format with hash/previous_hash properties
    return receipts.map(receipt => ({
      id: receipt.id,
      hash: receipt.digest,
      previous_hash: receipt.previousDigest,
      lamport_clock: receipt.lamportClock,
      timestamp: receipt.realTimestamp,
      type: receipt.receiptType,
      payload: receipt.payload
    }));
  }

  /**
   * Get receipt by ID with verification status
   */
  async getReceiptById(id) {
    const receipt = await this.prisma.bENReceipt.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        receiptType: true,
        lamportClock: true,
        realTimestamp: true,
        payload: true,
        digest: true,
        previousDigest: true,
        witnessModel: true,
        witnessSignature: true
      }
    });

    if (!receipt) return null;

    const verification = await this.verifyReceiptChain(receipt.id);

    return {
      ...receipt,
      verification
    };
  }

  /**
   * Get receipts with pagination
   */
  async getReceipts(page = 1, limit = 50, type = null) {
    console.log(`ReceiptService.getReceipts called with page=${page}, limit=${limit}, type=${type}`);
    const skip = (page - 1) * limit;
    console.log(`Calculated skip=${skip} for page=${page} limit=${limit}`);
    const where = type ? { receiptType: type } : {};

    const [receipts, total] = await Promise.all([
      this.prisma.bENReceipt.findMany({
        where,
        orderBy: { lamportClock: 'asc' }, // Changed to asc for proper hash chaining
        skip,
        take: limit,
        cacheStrategy: {
          swr: Number(process.env.RECEIPT_CACHE_SWR || 60),
          ttl: Number(process.env.RECEIPT_CACHE_TTL || 60),
        },
        select: {
          id: true,
          receiptType: true,
          lamportClock: true,
          realTimestamp: true,
          digest: true,
          previousDigest: true,
          witnessModel: true,
          payload: true
        }
      }),
      this.prisma.bENReceipt.count({ where })
    ]);

    console.log(`Found ${receipts.length} receipts out of ${total} total, first receipt id: ${receipts[0]?.id}, last receipt id: ${receipts[receipts.length-1]?.id}`);

    // Transform receipts to match expected API format
    const transformedReceipts = receipts.map(receipt => ({
      id: receipt.id,
      hash: receipt.digest,
      previous_hash: receipt.previousDigest,
      timestamp: receipt.realTimestamp,
      data: receipt.payload,
      signature: receipt.payload?.signature || null,
      public_key: receipt.payload?.public_key || null,
      metadata: receipt.payload?.metadata || null,
      type: receipt.receiptType,
      model: receipt.witnessModel
    }));

    return {
      receipts: transformedReceipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

// Export class for instantiation with prisma client
export { ReceiptService };
export default ReceiptService;