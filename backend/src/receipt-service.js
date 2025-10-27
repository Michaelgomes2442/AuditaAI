import crypto from 'crypto';
import { createOptimizedPrismaClient } from './prisma-optimize.ts';

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
   * Uses Math Canon vΩ.8 weights: Coherence 0.4, Reliability 0.4, Integrity 0.2
   */
  calculateCRIESMetrics(text, prompt = '') {
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

    const tokens = text.split(/\s+/).filter(t => t.length > 0);
    const tokenCount = tokens.length;

    // Coherence: Based on sentence structure and logical flow (0.4 weight)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = tokenCount / Math.max(sentences.length, 1);
    const coherence = Math.min(1.0, Math.max(0.1,
      0.3 + (avgSentenceLength / 20) * 0.4 + (sentences.length / text.length) * 1000 * 0.3
    ));

    // Reliability: Based on factual consistency and citation patterns (0.4 weight)
    const hasNumbers = /\d/.test(text);
    const hasCitations = /\[\d+\]|\(\d{4}\)|et al\.|according to/i.test(text);
    const repetitionRatio = this.calculateRepetitionRatio(tokens);
    const reliability = Math.min(1.0, Math.max(0.1,
      0.4 + (hasNumbers ? 0.2 : 0) + (hasCitations ? 0.2 : 0) - repetitionRatio * 0.3
    ));

    // Integrity: Based on manipulation detection and bias balance (0.2 weight)
    const sentimentBalance = this.calculateSentimentBalance(text);
    const manipulationScore = this.detectManipulation(text);
    const integrity = Math.min(1.0, Math.max(0.1,
      0.5 + sentimentBalance * 0.3 - manipulationScore * 0.4
    ));

    // Effectiveness: Based on goal achievement and response quality (weighted)
    const effectiveness = Math.min(1.0, Math.max(0.1,
      0.3 + (tokenCount / 100) * 0.3 + (prompt ? this.calculateRelevance(text, prompt) : 0.4)
    ));

    // Security: Based on safe content and vulnerability detection (weighted)
    const security = Math.min(1.0, Math.max(0.1,
      0.6 - (this.containsHarmfulContent(text) ? 0.4 : 0) - (this.hasVulnerabilities(text) ? 0.3 : 0)
    ));

    // Apply Math Canon vΩ.8 weights
    const weightedOverall = (coherence * 0.4) + (reliability * 0.4) + (integrity * 0.2);

    return {
      // Short form for storage
      C: Number(coherence.toFixed(4)),
      R: Number(reliability.toFixed(4)),
      I: Number(integrity.toFixed(4)),
      E: Number(effectiveness.toFixed(4)),
      S: Number(security.toFixed(4)),
      overall: Number(weightedOverall.toFixed(4)),
      // Long form for API responses
      coherence: Number(coherence.toFixed(4)),
      reliability: Number(reliability.toFixed(4)),
      integrity: Number(integrity.toFixed(4)),
      effectiveness: Number(effectiveness.toFixed(4)),
      security: Number(security.toFixed(4)),
      explanations: {
        coherence_explanation: `Sentence structure analysis (${sentences.length} sentences, avg ${avgSentenceLength.toFixed(1)} words)`,
        reliability_explanation: `Factual consistency check (${hasCitations ? 'with' : 'without'} citations, ${repetitionRatio.toFixed(2)} repetition ratio)`,
        integrity_explanation: `Bias detection (${sentimentBalance.toFixed(2)} balance, ${manipulationScore.toFixed(2)} manipulation score)`,
        effectiveness_explanation: `Response quality assessment (${tokenCount} tokens, ${prompt ? 'prompt-aligned' : 'general'} content)`,
        security_explanation: `Safety analysis (${this.containsHarmfulContent(text) ? 'potential risks detected' : 'content appears safe'})`
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

    receiptData.signature = signature;
    receiptData.public_key = publicKey;

    // Calculate self_hash (must include signature)
    const selfHash = crypto.createHash('sha256')
      .update(JSON.stringify(receiptData))
      .digest('hex');

    receiptData.self_hash = selfHash;

    // Update signature data with actual hash
    const finalSignatureData = JSON.stringify({
      analysis_id: receiptData.analysis_id,
      self_hash: selfHash,
      timestamp: receiptData.ts
    });
    receiptData.signature = crypto.createHmac('sha256', privateKey)
      .update(finalSignatureData)
      .digest('hex');

    // Persist to database
    const savedReceipt = await this.prisma.bENReceipt.create({
      data: {
        receiptType: 'ANALYSIS',
        lamportClock: lamportClock,
        userId: userId,
        payload: receiptData,
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
      ...receiptData,
      id: savedReceipt.id,
      hash: selfHash,
      timestamp: receiptData.ts,
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
        chain_position: -1,
        error: 'Receipt not found'
      };
    }

    // Verify self-hash
    const payload = receipt.payload;
    const calculatedHash = crypto.createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    const hashIntegrity = calculatedHash === receipt.digest;

    if (!hashIntegrity) {
      return {
        valid: false,
        hash_integrity: false,
        chain_position: receipt.lamportClock,
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
          chain_position: receipt.lamportClock,
          error: 'Previous receipt not found in chain'
        };
      }

      if (prevReceipt.lamportClock >= receipt.lamportClock) {
        return {
          valid: false,
          hash_integrity: true,
          chain_position: receipt.lamportClock,
          error: 'Lamport clock not monotonic'
        };
      }
    }

    return {
      valid: true,
      hash_integrity: true,
      chain_position: receipt.lamportClock
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
          witnessModel: true,
          payload: true
        }
      }),
      this.prisma.bENReceipt.count({ where })
    ]);

    return {
      receipts,
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