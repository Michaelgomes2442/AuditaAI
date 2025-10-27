import crypto from 'crypto';
import { createOptimizedPrismaClient } from './prisma-optimize.ts';
import { computeCRIES } from './track-a-analyzer.js';

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
    return await this.prisma.bENReceipt.findFirst({
      orderBy: { lamportClock: 'desc' },
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

  /**
   * Generate deterministic CRIES metrics from text analysis
   * Uses Math Canon vΩ.9 canonical formulas from Rosetta.html
   */
  calculateCRIESMetrics(text, prompt = '') {
    // Use canonical CRIES computation from Track-A analyzer
    const criesResult = computeCRIES(prompt, text);

    if (!text || typeof text !== 'string') {
      return {
        C: 0.1, R: 0.1, I: 0.1, E: 0.1, S: 0.1,
        overall: 0.1,
        explanations: {
          coherence: 'Invalid input text',
          reliability: 'Invalid input text',
          integrity: 'Invalid input text',
          effectiveness: 'Invalid input text',
          security: 'Invalid input text'
        }
      };
    }

    try {
      // Use canonical CRIES computation from Rosetta.html
      return {
        // Short form for storage
        C: criesResult.C,
        R: criesResult.R,
        I: criesResult.I,
        E: criesResult.E,
        S: criesResult.S,
        overall: criesResult.Omega, // Canonical Ω calculation
        // Long form for API responses
        coherence: criesResult.C,
        reliability: criesResult.R,
        integrity: criesResult.I,
        effectiveness: criesResult.E,
        security: criesResult.S,
        explanations: {
          coherence: `Coherence: ${criesResult.C.toFixed(3)} - Internal consistency and topic alignment`,
          reliability: `Reliability: ${criesResult.R.toFixed(3)} - Evidentiary support per Math Canon vΩ.9`,
          integrity: `Integrity: ${criesResult.I.toFixed(3)} - Logical consistency and goal alignment`,
          effectiveness: `Effectiveness: ${criesResult.E.toFixed(3)} - Response appropriateness to user intent`,
          security: `Security: ${criesResult.S.toFixed(3)} - Policy compliance and safety`
        }
      };
    } catch (error) {
      console.warn('CRIES computation failed, using fallback:', error.message);
      // Fallback to basic implementation if canonical fails
      return this.fallbackCRIESMetrics(text, prompt);
    }
  }

  /**
   * Fallback CRIES calculation for error cases
   */
  fallbackCRIESMetrics(text, prompt = '') {
    const tokens = text.split(/\s+/).filter(t => t.length > 0);
    const tokenCount = tokens.length;

    // Basic coherence check
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const coherence = Math.min(1.0, Math.max(0.1, sentences.length > 0 ? 0.5 : 0.1));

    // Basic reliability check
    const hasCitations = /\[\d+\]|\(\d{4}\)|according to|research shows/i.test(text);
    const reliability = Math.min(1.0, Math.max(0.1, hasCitations ? 0.6 : 0.3));

    // Basic integrity check
    const integrity = Math.min(1.0, Math.max(0.1, 0.5));

    // Basic effectiveness check
    const effectiveness = Math.min(1.0, Math.max(0.1, tokenCount > 10 ? 0.5 : 0.2));

    // Basic security check
    const hasHarmful = /\b(kill|harm|attack|steal)\b/i.test(text);
    const security = Math.min(1.0, Math.max(0.1, hasHarmful ? 0.2 : 0.7));

    // Use canonical Ω weights even in fallback
    const overall = (coherence * 0.28) + (reliability * 0.20) + (integrity * 0.20) + (effectiveness * 0.16) + (security * 0.16);

    return {
      C: Number(coherence.toFixed(4)),
      R: Number(reliability.toFixed(4)),
      I: Number(integrity.toFixed(4)),
      E: Number(effectiveness.toFixed(4)),
      S: Number(security.toFixed(4)),
      overall: Number(overall.toFixed(4)),
      coherence: Number(coherence.toFixed(4)),
      reliability: Number(reliability.toFixed(4)),
      integrity: Number(integrity.toFixed(4)),
      effectiveness: Number(effectiveness.toFixed(4)),
      security: Number(security.toFixed(4)),
      explanations: {
        coherence: 'Fallback: Basic sentence structure analysis',
        reliability: 'Fallback: Citation pattern detection',
        integrity: 'Fallback: Basic integrity check',
        effectiveness: 'Fallback: Response length and relevance',
        security: 'Fallback: Harmful content detection'
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
  async generateAnalysisReceipt(modelId, prompt, response, criesMetrics, userId = null, metadata = {}) {
    const latestReceipt = await this.getLatestReceipt();
    const lamportClock = latestReceipt ? latestReceipt.lamportClock + 1 : 0;

    const receiptData = {
      analysis_id: `ANALYSIS-${modelId}-L${lamportClock}-${Date.now()}`,
      conversation_id: 'default',
      cries: {
        C: criesMetrics.C,
        E: criesMetrics.E,
        I: criesMetrics.I,
        R: criesMetrics.R,
        S: criesMetrics.S,
        overall: criesMetrics.overall
      },
      digest_verified: false,
      lamport: lamportClock,
      prev_digest: latestReceipt ? latestReceipt.digest : null,
      receipt_type: "Δ-ANALYSIS",
      risk_flags: [],
      self_hash: '', // Will be calculated
      sigma_window: {
        σ: criesMetrics.overall,
        "σ*": 0.15 // Standard threshold
      },
      trace_id: `TRACE-${Date.now()}`,
      tri_actor_role: "Track-A/Analyst",
      ts: new Date().toISOString(),
      model: modelId,
      prompt: prompt,
      response: response,
      metadata: {
        ...metadata,
        governance_version: 'vΩ.8',
        cries_applied: true
      }
    };

    // Generate cryptographic signature (simplified for testing)
    const privateKey = crypto.randomBytes(32);
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
          self_hash: 'placeholder',
          timestamp: receiptData.ts
        }))
        .digest('hex'),
      public_key: publicKey
    };

    // Calculate self_hash on the final object
    const sortedReceiptData = Object.keys(finalReceiptData).sort().reduce((result, key) => {
      result[key] = finalReceiptData[key];
      return result;
    }, {});
    const selfHash = crypto.createHash('sha256')
      .update(JSON.stringify(sortedReceiptData))
      .digest('hex');

    finalReceiptData.self_hash = selfHash;

    // Update signature with actual hash
    finalReceiptData.signature = crypto.createHmac('sha256', privateKey)
      .update(JSON.stringify({
        analysis_id: finalReceiptData.analysis_id,
        self_hash: selfHash,
        timestamp: finalReceiptData.ts
      }))
      .digest('hex');

    // Persist to database
    const savedReceipt = await this.prisma.bENReceipt.create({
      data: {
        receiptType: 'ANALYSIS',
        lamportClock: lamportClock,
        userId: userId,
        payload: finalReceiptData,
        digest: selfHash,
        previousDigest: latestReceipt ? latestReceipt.digest : null,
        witnessModel: modelId,
        metadata: {
          prompt_length: prompt.length,
          response_length: response.length,
          cries_overall: criesMetrics.overall
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

    // Verify self-hash
    const payload = receipt.payload;
    const sortedPayload = Object.keys(payload).sort().reduce((result, key) => {
      result[key] = payload[key];
      return result;
    }, {});
    const calculatedHash = crypto.createHash('sha256')
      .update(JSON.stringify(sortedPayload))
      .digest('hex');

    const hashIntegrity = calculatedHash === receipt.digest;

    if (!hashIntegrity) {
      return {
        valid: false,
        hash_integrity: false,
        chain_integrity: false,
        chain_position: receipt.lamportClock,
        governance_valid: false,
        error: 'Self-hash mismatch'
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
          hash_integrity: true,
          chain_integrity: false,
          chain_position: receipt.lamportClock,
          governance_valid: false,
          error: 'Previous receipt not found in chain'
        };
      }

      if (prevReceipt.lamportClock >= receipt.lamportClock) {
        return {
          valid: false,
          hash_integrity: true,
          chain_integrity: false,
          chain_position: receipt.lamportClock,
          governance_valid: false,
          error: 'Lamport clock not monotonic'
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

    return receipts.map(receipt => JSON.stringify(receipt)).join('\n');
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
    const skip = (page - 1) * limit;
    const where = type ? { receiptType: type } : {};

    const [receipts, total] = await Promise.all([
      this.prisma.bENReceipt.findMany({
        where,
        orderBy: { lamportClock: 'desc' },
        skip,
        take: limit,
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

    // Transform receipts to match expected API format
    const transformedReceipts = receipts.map(receipt => ({
      id: receipt.id,
      hash: receipt.digest,
      previous_hash: receipt.previousDigest,
      timestamp: receipt.realTimestamp,
      data: receipt.payload,
      signature: receipt.payload?.signature || null,
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