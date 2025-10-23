import { describe, it, expect } from 'vitest';
import { generateBlockHash, calculateCRIESMetrics } from './governance';
import type { AuditRecord } from '@prisma/client';
import type { Prisma } from '@prisma/client';

type BlockData = { 
  previousHash: string;
  records: AuditRecord[];
  timestamp: number;
  lamportClock: number;
};

const createTestRecord = (overrides?: Partial<AuditRecord>): AuditRecord => ({
  id: 1,
  action: 'TEST',
  category: 'TEST',
  details: null as Prisma.JsonValue,
  metadata: null as Prisma.JsonValue,
  status: 'COMPLETE',
  userId: 1,
  organizationId: 1,
  lamport: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  hashPointer: '0'.repeat(64),
  blockHash: null,
  ...overrides
});

describe('Governance Module', () => {
  describe('generateBlockHash', () => {
    it('should generate consistent hashes for the same input', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const blockData = {
        previousHash: '0'.repeat(64),
        records: [createTestRecord({
          createdAt: now,
          updatedAt: now
        })],
        timestamp: 1704067200000, // 2024-01-01T00:00:00Z
        lamportClock: 1
      };

      const hash1 = generateBlockHash(blockData);
      const hash2 = generateBlockHash(blockData);
      expect(hash1).to.equal(hash2);
      expect(hash1).to.match(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    it('should generate different hashes for different inputs', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const baseData = {
        previousHash: '0'.repeat(64),
        records: [createTestRecord({
          createdAt: now,
          updatedAt: now
        })],
        timestamp: 1704067200000,
        lamportClock: 1
      };

      // Change lamport clock
      const blockData2 = {
        ...baseData,
        lamportClock: 2
      };

      const hash1 = generateBlockHash(baseData);
      const hash2 = generateBlockHash(blockData2);
      expect(hash1).to.not.equal(hash2);
    });
  });

  describe('calculateCRIESMetrics', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const validRecord: AuditRecord = createTestRecord({
      details: { test: true } as Prisma.JsonValue,
      metadata: { version: '1.0' } as Prisma.JsonValue,
      createdAt: now,
      updatedAt: now
    });

    it('should calculate perfect scores for valid records', () => {
      const records = [
        { ...validRecord },
        {
          ...validRecord,
          id: 2,
          lamport: 2,
          createdAt: new Date('2024-01-01T00:00:01Z'),
          updatedAt: new Date('2024-01-01T00:00:01Z'),
          hashPointer: '1'.repeat(64)
        }
      ];

      const metrics = calculateCRIESMetrics(records);
      expect(metrics.consistency).to.equal(1);
      expect(metrics.reproducibility).to.equal(1);
      expect(metrics.integrity).to.equal(1);
      expect(metrics.explainability).to.equal(1);
      expect(metrics.security).to.equal(1);
      expect(metrics.recordsAnalyzed).to.equal(2);
    });

    it('should handle lamport clock violations', () => {
      const records = [
        { ...validRecord },
        {
          ...validRecord,
          id: 2,
          lamport: 1, // Same as previous
          createdAt: new Date('2024-01-01T00:00:01Z'),
          updatedAt: new Date('2024-01-01T00:00:01Z'),
          hashPointer: '1'.repeat(64)
        }
      ];

      const metrics = calculateCRIESMetrics(records);
      expect(metrics.consistency).to.be.lessThan(1);
      expect(metrics.reproducibility).to.equal(1);
      expect(metrics.integrity).to.equal(1);
      expect(metrics.explainability).to.equal(1);
      expect(metrics.security).to.equal(1);
    });

    it('should handle missing metadata', () => {
      const records = [
        { ...validRecord, metadata: null }
      ];

      const metrics = calculateCRIESMetrics(records);
      expect(metrics.consistency).to.equal(1);
      expect(metrics.reproducibility).to.equal(0);
      expect(metrics.integrity).to.equal(1);
      expect(metrics.explainability).to.equal(1);
      expect(metrics.security).to.equal(1);
    });

    it('should handle missing user', () => {
      const records = [
        { ...validRecord, userId: undefined as unknown as number }
      ];

      const metrics = calculateCRIESMetrics(records);
      expect(metrics.consistency).to.equal(1);
      expect(metrics.reproducibility).to.equal(1);
      expect(metrics.integrity).to.equal(1);
      expect(metrics.explainability).to.equal(1);
      expect(metrics.security).to.equal(0); // User required but not included
    });

    it('should handle missing category or action', () => {
      const records = [
        { ...validRecord, category: '' }
      ];

      const metrics = calculateCRIESMetrics(records);
      expect(metrics.consistency).to.equal(1);
      expect(metrics.reproducibility).to.equal(1);
      expect(metrics.integrity).to.equal(1);
      expect(metrics.explainability).to.equal(0);
      expect(metrics.security).to.equal(0);
    });

    it('should handle empty record list', () => {
      const metrics = calculateCRIESMetrics([]);
      expect(metrics.consistency).to.equal(1);
      expect(metrics.reproducibility).to.equal(1);
      expect(metrics.integrity).to.equal(1);
      expect(metrics.explainability).to.equal(1);
      expect(metrics.security).to.equal(1);
      expect(metrics.recordsAnalyzed).to.equal(0);
    });
  });
});