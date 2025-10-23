import { Server as NetServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { prisma } from '@/lib/prismadb';
import { GovernanceService } from '@/lib/governance';
import type { NextApiResponse } from 'next';
import type { AuditCategory, AuditStatus } from '@/generated/prisma';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketServer;
    };
  };
};

export interface AuditEvent {
  id: number;
  action: string;
  category: string;
  details: any;
  userId: number;
  timestamp: Date;
  status: string;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

let blockBuffer: any[] = [];
const BLOCK_SIZE = 10; // Number of records per block
const BLOCK_TIMEOUT = 5000; // 5 seconds

export class AuditWebSocketService {
  private static instance: AuditWebSocketService;
  private io: SocketServer | null = null;
  private governance: GovernanceService;
  private blockTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.governance = GovernanceService.getInstance();
  }

  static getInstance(): AuditWebSocketService {
    if (!AuditWebSocketService.instance) {
      AuditWebSocketService.instance = new AuditWebSocketService();
    }
    return AuditWebSocketService.instance;
  }

  initialize(server: NetServer) {
    if (this.io) return;

    this.io = new SocketServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected');

      socket.on('join-org', (orgId: string) => {
        socket.join(`org:${orgId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    // Start block timer
    this.startBlockTimer();
  }

  private startBlockTimer() {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }

    this.blockTimer = setInterval(async () => {
      if (blockBuffer.length > 0) {
        await this.processBlock();
      }
    }, BLOCK_TIMEOUT);
  }

  private async processBlock() {
    const records = [...blockBuffer];
    blockBuffer = [];

    try {
      const blockHash = await this.governance.createAuditBlock(records);
      
      // Calculate CRIES metrics for affected organizations
      const orgIds = new Set(records.map(r => r.user?.orgId).filter(Boolean));
      
      for (const orgId of orgIds) {
        const metrics = await this.governance.calculateCRIESMetrics(orgId);
        
        // Notify organization members about new metrics
        this.io?.to(`org:${orgId}`).emit('metrics-update', {
          blockHash,
          metrics,
          timestamp: new Date(),
        });
      }

      // Notify all relevant clients
      records.forEach(record => {
        if (record.user?.orgId) {
          this.io?.to(`org:${record.user.orgId}`).emit('audit-update', {
            type: 'BLOCK_CREATED',
            blockHash,
            record,
          });
        }
      });
    } catch (error) {
      console.error('Error processing audit block:', error);
    }
  }

  async recordAuditEvent(event: AuditEvent) {
    try {
      // Create audit record
      const record = await prisma.auditRecord.create({
        data: {
          action: event.action,
          category: event.category as AuditCategory,
          details: event.details,
          userId: event.userId,
          status: (event.status as AuditStatus) || 'SUCCESS',
          lamport: 0, // Will be set when block is created
        },
        include: {
          user: true,
        },
      });

      // Add to block buffer
      blockBuffer.push(record);

      // Notify clients of new record
      if (record.user?.orgId) {
        this.io?.to(`org:${record.user.orgId}`).emit('audit-update', {
          type: 'RECORD_CREATED',
          record,
        });
      }

      // Process block if buffer is full
      if (blockBuffer.length >= BLOCK_SIZE) {
        await this.processBlock();
      }

      return record;
    } catch (error) {
      console.error('Error creating audit record:', error);
      throw error;
    }
  }

  async verifyAuditTrail(startId: number, endId: number, orgId: number) {
    try {
      const result = await this.governance.verifyAuditTrail(startId, endId);
      
      // Notify organization members about verification result
      this.io?.to(`org:${orgId}`).emit('verification-result', {
        startId,
        endId,
        ...result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      console.error('Error verifying audit trail:', error);
      throw error;
    }
  }
}