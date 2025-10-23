import { createHash } from 'crypto';
import { prisma } from '@/lib/prismadb';
// Removed invalid import: AuditRecord, LamportState from @prisma/client

import type { AuditRecord, LamportState } from "@/generated/prisma";

interface BlockData {
  previousHash: string;
  records: AuditRecord[];
  timestamp: number;
  lamportClock: number;
}

interface VerificationResult {
  isValid: boolean;
  lamportClock: number;
  merkleRoot: string;
  errors?: string[];
}

export class GovernanceService {
  private static instance: GovernanceService;
  private currentLamportClock: number;
  private lastBlockHash: string;

  private constructor() {
    this.currentLamportClock = 0;
    this.lastBlockHash = '';
  }

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async initialize() {
    // Get the latest Lamport clock value from the database
    const latestState = await prisma.lamportState.findFirst({
      orderBy: { lamport: 'desc' },
    });

    if (latestState) {
      this.currentLamportClock = latestState.lamport;
    }

    // Get the last block hash
    const latestRecord = await prisma.auditRecord.findFirst({
      orderBy: { id: 'desc' },
      where: { hashPointer: { not: null } },
    });

    if (latestRecord) {
      this.lastBlockHash = latestRecord.hashPointer || '';
    }
  }

  private incrementLamportClock(): number {
    return ++this.currentLamportClock;
  }

  private calculateMerkleRoot(records: AuditRecord[]): string {
    if (records.length === 0) return '';

    // Convert records to leaves (hash of each record)
    const leaves = records.map(record => 
      this.hashData({
        id: record.id,
        userId: record.userId,
        action: record.action,
        category: record.category,
        details: record.details,
        lamport: record.lamport,
        createdAt: record.createdAt,
      })
    );

    // Build Merkle tree
    const tree = this.buildMerkleTree(leaves);
    return tree[0]; // Root is the first element
  }

  private buildMerkleTree(leaves: string[]): string[] {
    if (leaves.length === 0) return [''];
    if (leaves.length === 1) return leaves;

    const tree: string[] = [...leaves];
    let levelSize = leaves.length;
    
    while (levelSize > 1) {
      for (let i = 0; i < levelSize - 1; i += 2) {
        const hash = this.hashPair(tree[i], tree[i + 1]);
        tree.push(hash);
      }
      
      if (levelSize % 2 === 1) {
        tree.push(tree[levelSize - 1]); // Duplicate last node if odd
      }
      
      levelSize = Math.ceil(levelSize / 2);
    }

    return tree;
  }

  private hashPair(left: string, right: string): string {
    return createHash('sha256')
      .update(left + right)
      .digest('hex');
  }

  private hashData(data: any): string {
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  async createAuditBlock(records: AuditRecord[]): Promise<string> {
    const blockData: BlockData = {
      previousHash: this.lastBlockHash,
      records,
      timestamp: Date.now(),
      lamportClock: this.incrementLamportClock(),
    };

    const blockHash = this.hashData(blockData);
    const merkleRoot = this.calculateMerkleRoot(records);

    // Update records with hash pointers
    await Promise.all(records.map(record =>
      prisma.auditRecord.update({
        where: { id: record.id },
        data: {
          hashPointer: blockHash,
          metadata: {
            blockHash,
            merkleRoot,
            lamportClock: this.currentLamportClock,
          },
        },
      })
    ));

    // Update Lamport state
    await prisma.lamportState.create({
      data: {
        key: `block:${blockHash}`,
        value: merkleRoot,
        lamport: this.currentLamportClock,
        metadata: {
          blockHash,
          recordCount: records.length,
          timestamp: Date.now(),
        },
      },
    });

    this.lastBlockHash = blockHash;
    return blockHash;
  }

  async verifyAuditTrail(startId: number, endId: number): Promise<VerificationResult> {
    const records = await prisma.auditRecord.findMany({
      where: {
        id: {
          gte: startId,
          lte: endId,
        },
      },
      orderBy: { id: 'asc' },
    });

    if (records.length === 0) {
      return {
        isValid: false,
        lamportClock: this.currentLamportClock,
        merkleRoot: '',
        errors: ['No records found in the specified range'],
      };
    }

    const errors: string[] = [];
    let prevLamport = records[0].lamport - 1;

    // Verify Lamport clock monotonicity
    for (const record of records) {
      if (record.lamport <= prevLamport) {
        errors.push(`Lamport clock violation at record ${record.id}`);
      }
      prevLamport = record.lamport;
    }

    // Verify block hashes
    const blockHashes = new Set(records.map(r => r.hashPointer).filter(Boolean));
    for (const hash of blockHashes) {
      const blockRecords = records.filter(r => r.hashPointer === hash);
      const calculatedRoot = this.calculateMerkleRoot(blockRecords);
      
      const state = await prisma.lamportState.findFirst({
        where: { key: `block:${hash}` },
      });

      if (!state || state.value !== calculatedRoot) {
        errors.push(`Merkle root mismatch for block ${hash}`);
      }
    }

    return {
      isValid: errors.length === 0,
      lamportClock: this.currentLamportClock,
      merkleRoot: this.calculateMerkleRoot(records),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // CRIES metrics calculation
  async calculateCRIESMetrics(orgId: number) {
    const records = await prisma.auditRecord.findMany({
      where: {
        user: {
          orgId,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Analyze last 1000 records
    });

    // Calculate Consistency metric
    const consistency = this.calculateConsistencyScore(records);
    
    // Calculate Reproducibility metric
    const reproducibility = this.calculateReproducibilityScore(records);
    
    // Calculate Integrity metric
    const integrity = this.calculateIntegrityScore(records);
    
    // Calculate Explainability metric
    const explainability = this.calculateExplainabilityScore(records);
    
    // Calculate Security metric
    const security = this.calculateSecurityScore(records);

    return {
      consistency,
      reproducibility,
      integrity,
      explainability,
      security,
      timestamp: new Date(),
      recordsAnalyzed: records.length,
    };
  }

  private calculateConsistencyScore(records: AuditRecord[]): number {
    // Check for Lamport clock consistency and action ordering
    let consistencyViolations = 0;
    for (let i = 1; i < records.length; i++) {
      if (records[i].lamport <= records[i - 1].lamport) {
        consistencyViolations++;
      }
    }
    return 1 - (consistencyViolations / records.length);
  }

  private calculateReproducibilityScore(records: AuditRecord[]): number {
    // Check if actions have sufficient metadata for reproduction
    const reproducibleActions = records.filter(record => 
      record.details && 
      record.metadata &&
      record.hashPointer // Has blockchain verification
    ).length;
    
    return reproducibleActions / records.length;
  }

  private calculateIntegrityScore(records: AuditRecord[]): number {
    // Verify hash chain integrity
    const verifiedHashes = records.filter(record => {
      if (!record.hashPointer) return false;
      const calculatedHash = this.hashData({
        id: record.id,
        userId: record.userId,
        action: record.action,
        category: record.category,
        details: record.details,
        lamport: record.lamport,
        createdAt: record.createdAt,
      });
      return record.hashPointer.includes(calculatedHash);
    }).length;
    
    return verifiedHashes / records.length;
  }

  private calculateExplainabilityScore(records: AuditRecord[]): number {
    // Check for comprehensive action documentation
    const wellDocumentedActions = records.filter(record =>
      record.details &&
      record.category &&
      record.action.length > 10 // Minimum description length
    ).length;
    
    return wellDocumentedActions / records.length;
  }

  private calculateSecurityScore(records: AuditRecord[]): number {
    // Evaluate security aspects like user authentication and authorization
    const secureActions = records.filter(record =>
      record.userId && // User identified
      record.metadata && // Has metadata
      record.status === 'SUCCESS' // Action completed successfully
    ).length;
    
    return secureActions / records.length;
  }
}