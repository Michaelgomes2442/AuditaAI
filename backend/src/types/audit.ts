import { Socket } from 'socket.io';

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

export interface AuditRecord {
  id: number;
  action: string;
  category: AuditCategory | string;
  details?: any;
  metadata?: any;
  userId: number;
  status: AuditStatus | string;
  hashPointer?: string | null;
  blockHash?: string | null;
  lamport: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    email?: string;
    orgId?: number;
  };
}

export interface BlockData {
  previousHash: string;
  records: AuditRecord[];
  timestamp: number;
  lamportClock: number;
}

export interface CRIESMetrics {
  consistency: number;
  reproducibility: number;
  integrity: number;
  explainability: number;
  security: number;
  timestamp: Date;
  recordsAnalyzed: number;
}

export interface AuditUpdatePayload {
  type: 'RECORD_CREATED' | 'BLOCK_CREATED';
  record: AuditRecord;
  blockHash?: string;
}

export interface MetricsUpdatePayload {
  blockHash: string;
  metrics: CRIESMetrics;
  timestamp: Date;
}

export interface VerificationResultPayload {
  success: boolean;
  blockHash: string;
  error?: string;
}

export interface ServerToClientEvents {
  'audit-update': (payload: AuditUpdatePayload) => void;
  'metrics-update': (payload: MetricsUpdatePayload) => void;
  'verification-result': (payload: VerificationResultPayload) => void;
}

export interface ClientToServerEvents {
  'join-org': (orgId: string | number) => void;
  'setFilters': (filters: {
    userId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    orgId?: number;
  }) => void;
}

export interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  user?: { id: number; orgId: number; role?: string };
}
