import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { PrismaClient, Prisma } from "@prisma/client";
import { 
  BlockData, 
  ServerToClientEvents, 
  ClientToServerEvents, 
  AuthenticatedSocket,
  AuditRecord,
  AuditUpdatePayload,
  MetricsUpdatePayload,
  VerificationResultPayload,
  CRIESMetrics
} from "./types/audit";
import { generateBlockHash, calculateCRIESMetrics } from "./lib/governance";
import Redis from 'ioredis';
import { randomBytes } from 'crypto';

type AuditRecordWithUser = AuditRecord & {
  user: { id: number; email?: string; orgId?: number };
  organizationId: number;
};

export function setupWebSocket(server: HttpServer, prisma: PrismaClient) {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store connected clients with their filters and organization
  const clients = new Map<string, {
    userId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    orgId?: number;
  }>();

  // Redis client for fallback locking (optional)
  const redisUrl = process.env.REDIS_URL;
  const redis = redisUrl ? new Redis(redisUrl) : null;

  async function acquireRedisLock(orgId: number, ttl = 10000, retries = 5, delay = 100) {
    if (!redis) return null;
    const key = `lock:block:${orgId}`;
    const token = randomBytes(16).toString('hex');
    for (let i = 0; i < retries; i++) {
      const res = await redis.set(key, token, 'PX', ttl, 'NX');
      if (res === 'OK') return token;
      // backoff
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
    return null;
  }

  async function releaseRedisLock(orgId: number, token: string) {
    if (!redis) return false;
    const key = `lock:block:${orgId}`;
    // Use Lua script to release only if token matches
    const script = `if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`;
    const res = await redis.eval(script, 1, key, token);
    return res === 1;
  }

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log("Client connected:", socket.id);

    // Store client's initial filters
    socket.on("setFilters", (filters) => {
      clients.set(socket.id, filters);
    });

    // Handle organization room joining
    socket.on("join-org", (orgId: string | number) => {
      if (!socket.user) return;

      const orgIdNum = typeof orgId === 'string' ? parseInt(orgId) : orgId;
      if (isNaN(orgIdNum)) return;

      const currentFilters = clients.get(socket.id) || {};
      clients.set(socket.id, { ...currentFilters, orgId: orgIdNum });
    });

    // Clean up on disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      clients.delete(socket.id);
    });
  });

  return {
    io,
    // Expose clients map so tests or external code can inspect/manipulate it if needed
    clients,
    notifyClients: async (auditRecord: AuditRecordWithUser) => {
      const matchingClients = new Map<number, Set<string>>(); // orgId -> Set of socket IDs

      // Group matching clients by organization (only pick clients whose filters match this record)
      clients.forEach((filters, socketId) => {
        const socket = io.sockets.sockets.get(socketId) as AuthenticatedSocket | undefined;
        if (!socket || !filters.orgId) return;
        if (filters.orgId !== auditRecord.organizationId) return;

        let matches = true;
        if (filters.userId && auditRecord.userId.toString() !== filters.userId) matches = false;
        if (filters.eventType && auditRecord.action !== filters.eventType) matches = false;
        if (filters.startDate && new Date(auditRecord.createdAt) < new Date(filters.startDate)) matches = false;
        if (filters.endDate && new Date(auditRecord.createdAt) > new Date(filters.endDate)) matches = false;

        if (matches) {
          if (!matchingClients.has(filters.orgId)) matchingClients.set(filters.orgId, new Set());
          matchingClients.get(filters.orgId)?.add(socketId);
        }
      });

  // Determine which organization to process. We always process the org of the incoming
  // auditRecord (so blocks are created even if no clients are currently subscribed).
  const orgId = auditRecord.organizationId;
  const socketIds = matchingClients.get(orgId) || new Set<string>();

  // Process updates for this organization
  // (previous implementation iterated over all matching orgs, but notifyClients is
  // triggered per-record so processing the record's org is sufficient and simpler)
  {
  try {
          // Prefer Redis-based lock if available (fast, works across processes)
          let createdBlock: any = null;
          let redisToken: string | null = null;
          let usedRedisLock = false;

          if (redis) {
            try {
              redisToken = await acquireRedisLock(orgId, 10000, 5, 50);
              if (redisToken) usedRedisLock = true;
            } catch (rErr) {
              console.warn('Redis lock attempt failed:', String(rErr));
            }
          }

          if (usedRedisLock) {
            // We have a Redis lock; perform transaction without advisory lock
            try {
              await prisma.$transaction(async (tx) => {
                const pendingRecords = await tx.auditRecord.findMany({
                  where: { organizationId: orgId, blockHash: null },
                  orderBy: { createdAt: 'asc' },
                  take: 100,
                  include: { user: { select: { id: true, organization: true, email: true } } }
                });

                if (pendingRecords.length < 10) return;

                const latestBlock = await tx.block.findFirst({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
                const previousHash = latestBlock?.hash || '0'.repeat(64);

                const blockData: BlockData = {
                  previousHash,
                  records: pendingRecords as any,
                  timestamp: Date.now(),
                  lamportClock: Math.max(...pendingRecords.map((r: any) => r.lamport || 0))
                };

                const blockHash = generateBlockHash(blockData);

                // Update each record's blockHash individually to avoid potential engine
                // issues with updateMany inside certain transaction contexts.
                await Promise.all(pendingRecords.map((r: any) => tx.auditRecord.update({ where: { id: r.id }, data: { blockHash } })));

                const metrics: CRIESMetrics = calculateCRIESMetrics(pendingRecords as any);
                const metricsJson: Prisma.InputJsonValue = {
                  consistency: metrics.consistency,
                  reproducibility: metrics.reproducibility,
                  integrity: metrics.integrity,
                  explainability: metrics.explainability,
                  security: metrics.security,
                  timestamp: metrics.timestamp.toISOString(),
                  recordsAnalyzed: metrics.recordsAnalyzed
                };

                createdBlock = await tx.block.create({ data: { hash: blockHash, previousHash, organizationId: orgId, lamportClock: blockData.lamportClock, metricsData: metricsJson } });
              });
            } finally {
              // release redis lock
              try { if (redisToken) await releaseRedisLock(orgId, redisToken); } catch (releaseErr) { console.warn('Failed to release redis lock:', String(releaseErr)); }
            }
          } else {
            // No Redis lock available; fall back to advisory lock inside transaction
            await prisma.$transaction(async (tx) => {
              try {
                await tx.$executeRaw`SELECT pg_advisory_xact_lock(${orgId})`;
              } catch (lockErr) {
                console.warn('Advisory lock failed (continuing without lock):', String(lockErr));
              }

              const pendingRecords = await tx.auditRecord.findMany({ where: { organizationId: orgId, blockHash: null }, orderBy: { createdAt: 'asc' }, take: 100, include: { user: { select: { id: true, organization: true, email: true } } } });
              if (pendingRecords.length < 10) return;

              const latestBlock = await tx.block.findFirst({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
              const previousHash = latestBlock?.hash || '0'.repeat(64);

              const blockData: BlockData = { previousHash, records: pendingRecords as any, timestamp: Date.now(), lamportClock: Math.max(...pendingRecords.map((r: any) => r.lamport || 0)) };
              const blockHash = generateBlockHash(blockData);

              // Update each record's blockHash individually to avoid potential engine
              // issues with updateMany inside certain transaction contexts.
              await Promise.all(pendingRecords.map((r: any) => tx.auditRecord.update({ where: { id: r.id }, data: { blockHash } })));

              const metrics: CRIESMetrics = calculateCRIESMetrics(pendingRecords as any);
              const metricsJson: Prisma.InputJsonValue = { consistency: metrics.consistency, reproducibility: metrics.reproducibility, integrity: metrics.integrity, explainability: metrics.explainability, security: metrics.security, timestamp: metrics.timestamp.toISOString(), recordsAnalyzed: metrics.recordsAnalyzed };

              createdBlock = await tx.block.create({ data: { hash: blockHash, previousHash, organizationId: orgId, lamportClock: blockData.lamportClock, metricsData: metricsJson } });
            });
          }

          // After successful commit, emit events to clients
          if (createdBlock) {
            const blockHash = createdBlock.hash;
            const metrics = createdBlock.metricsData as any;

            socketIds.forEach(socketId => {
              const socket = io.sockets.sockets.get(socketId) as any;
              if (!socket) return;

              socket.emit('audit-update', {
                type: 'BLOCK_CREATED',
                record: auditRecord,
                blockHash
              });

              socket.emit('metrics-update', {
                blockHash,
                metrics,
                timestamp: new Date()
              });
            });
          } else {
            // No block created (not enough pending records) — send single-record update
            socketIds.forEach(socketId => {
              const socket = io.sockets.sockets.get(socketId) as any;
              if (!socket) return;

              socket.emit('audit-update', {
                type: 'RECORD_CREATED',
                record: auditRecord
              });
            });
          }
        } catch (err) {
          console.error('Error processing org updates in notifyClients:', String(err));
          // Attempt best-effort notification about the single record to avoid silent failures
          socketIds.forEach(socketId => {
            const socket = io.sockets.sockets.get(socketId) as any;
            if (!socket) return;
            socket.emit('audit-update', {
              type: 'RECORD_CREATED',
              record: auditRecord
            });
          });
        }
      }
    },
  };
}