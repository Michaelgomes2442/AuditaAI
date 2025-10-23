import { Socket } from 'socket.io';

// Audit Types
export enum AuditCategory {
  AUTH = 'AUTH',
  ACCESS = 'ACCESS',
  DATA = 'DATA',
  CONFIG = 'CONFIG',
  VERIFICATION = 'VERIFICATION',
  SYSTEM = 'SYSTEM'
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export interface AuditEvent {
  action: string;
  category: AuditCategory;
  details: any;
  metadata?: any;
  userId: number;
  status: AuditStatus;
}

export interface AuditRecord extends AuditEvent {
  id: number;
  createdAt: Date;
  hashPointer: string | null;
  lamport: number;
  user?: {
    id: number;
    orgId: number;
    email: string;
  };
}

// WebSocket Types
export interface ServerToClientEvents {
  'audit-update': (event: {
    type: 'RECORD_CREATED' | 'BLOCK_CREATED';
    record: AuditRecord;
    blockHash?: string;
  }) => void;
  'metrics-update': (event: {
    blockHash: string;
    metrics: CRIESMetrics;
    timestamp: Date;
  }) => void;
  'verification-result': (result: VerificationResult) => void;
}

export interface ClientToServerEvents {
  'join-org': (orgId: string) => void;
}

export interface VerificationResult {
  isValid: boolean;
  lamportClock: number;
  merkleRoot: string;
  errors?: string[];
  startId?: number;
  endId?: number;
  timestamp?: Date;
}

// Governance Types
export interface CRIESMetrics {
  consistency: number;
  reproducibility: number;
  integrity: number;
  explainability: number;
  security: number;
  timestamp: Date;
  recordsAnalyzed: number;
}

export interface BlockData {
  previousHash: string;
  records: AuditRecord[];
  timestamp: number;
  lamportClock: number;
}

// Custom socket type with auth data
export interface AuthenticatedSocket extends Socket {
  user?: {
    id: number;
    orgId: number;
    role: string;
  };
}