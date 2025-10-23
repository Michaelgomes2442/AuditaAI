import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { setupWebSocket } from '../websocket';
import { Server } from 'http';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  AuthenticatedSocket 
} from '../types/audit';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Block Creation Integration', () => {
  let server: Server;
  let ws: ReturnType<typeof setupWebSocket>;
  let org: { id: number } | undefined;
  let user: { id: number } | undefined;
  let mockSocket: { id: string; emit: Mock; on: Function; user?: any };
  let events: any[] = [];
  let notifyClients: (record: any) => Promise<void>;

  beforeEach(async () => {
    server = createServer();

    // Clean up existing test data in correct order
    await prisma.block.deleteMany({
      where: {
        organization: {
          name: 'Test Organization'
        }
      }
    });
    await prisma.auditRecord.deleteMany({
      where: {
        user: {
          email: 'test@example.com'
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com'
      }
    });
    await prisma.organization.deleteMany({
      where: {
        name: 'Test Organization'
      }
    });
  });

  afterEach(async () => {
    // Close server first to stop any ongoing operations
    if (ws?.io) {
      ws.io.close();
    }
    server.close();

    // Clean up test data in correct order
    if (org) {
      await prisma.block.deleteMany({
        where: {
          organizationId: org.id
        }
      });
      await prisma.auditRecord.deleteMany({
        where: {
          organizationId: org.id
        }
      });
      await prisma.user.deleteMany({
        where: {
          organizationId: org.id
        }
      });
      await prisma.organization.deleteMany({
        where: {
          id: org.id
        }
      });
    }
  });

  it('should create block after 10 records and notify clients', async () => {
    // Create test org and user
    org = await prisma.organization.create({
      data: {
        name: 'Test Organization'
      }
    });

    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        organizationId: org.id,
        role: 'USER'
      }
    });

    // Create 10 audit records
    const recordPromises = Array.from({ length: 10 }).map((_, i) => {
      return prisma.auditRecord.create({
        data: {
          action: `TEST_${i}`,
          category: 'TEST',
          details: { test: true },
          metadata: { version: '1.0' },
          status: 'COMPLETE',
          userId: user!.id,
          organizationId: org!.id,
          lamport: i + 1,
          hashPointer: '0'.repeat(64)
        }
      });
    });

    console.log('Creating records for org:', org!.id);
    const records = await Promise.all(recordPromises);

    // Verify records were created
    const allRecords = await prisma.auditRecord.findMany({
      where: {
        organizationId: org!.id,
        blockHash: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    console.log('Found records:', allRecords.map(r => ({ id: r.id, orgId: r.organizationId })));
    expect(allRecords.length).toBe(10);

    // Get the last record with user data
    const lastRecord = await prisma.auditRecord.findFirstOrThrow({
      where: {
        id: records[records.length - 1].id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            organizationId: true
          }
        }
      }
    });

    // Start the server listening
    await new Promise<void>((resolve) => {
      server.listen(() => resolve());
    });

    // Set up WebSocket server first
    ws = setupWebSocket(server, prisma);
    notifyClients = ws.notifyClients;

    // Initialize clients Map for WebSocket server
    const socketServer = ws as unknown as {
      clients: Map<string, {
        userId?: string;
        eventType?: string;
        startDate?: string;
        endDate?: string;
        orgId?: number;
      }>;
      io: SocketServer<ClientToServerEvents, ServerToClientEvents>;
    };
    socketServer.clients = new Map();

    // Set up mock socket with user context and proper auth
    mockSocket = {
      id: 'test-socket',
      emit: vi.fn(),
      on: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      to: vi.fn(),
      use: vi.fn(),
      send: vi.fn(),
      write: vi.fn(),
      removeListener: vi.fn(),
      removeAllListeners: vi.fn(),
      disconnect: vi.fn(),
      volatile: { emit: vi.fn() },
      broadcast: { emit: vi.fn() },
      rooms: new Set(),
      user: {
        id: user!.id,
        orgId: org!.id,
        role: 'USER'
      }
    } as unknown as AuthenticatedSocket;
    
    // Set up socket map for Socket.IO server
    Object.defineProperty(socketServer.io.sockets, 'sockets', {
      value: new Map([[mockSocket.id, mockSocket]]),
      writable: true
    });

    // Get event handlers from Socket.IO lifecycle
    const connectionListeners = ws.io.listeners('connection') as Array<(socket: any) => void>;
    const connectionListener = connectionListeners[0];
    connectionListener?.(mockSocket);

    // Get the event handlers by type casting to vitest Mock
    const handlers = (mockSocket.on as Mock).mock.calls as Array<[string, Function]>;
    const setFiltersHandler = handlers.find(call => call[0] === 'setFilters')?.[1];
    const joinOrgHandler = handlers.find(call => call[0] === 'join-org')?.[1];

    // Trigger the events
    setFiltersHandler?.({ 
      orgId: org!.id, 
      userId: user!.id.toString() 
    });
    joinOrgHandler?.(org!.id);

    // Set up WebSocket events listener
    const events: any[] = [];

    // Set up WebSocket events listener
    mockSocket.emit.mockImplementation((event: string, data: any) => {
      console.log(`Socket event received: ${event}`, data);
      events.push({ event, data });
    });

    // Get the last record
    console.log('Current org:', org!.id);
    const record = await prisma.auditRecord.findFirstOrThrow({
      where: {
        organizationId: org!.id,
        blockHash: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            organizationId: true
          }
        }
      }
    });

    // Notify about the last record to trigger block creation
    console.log('Sending notification for record:', record);
    await notifyClients(record);

    // Wait for block creation and verify socket events
    console.log('Waiting for block creation...');
    let retries = 5;
    let block = null;
    while (retries > 0 && !block) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const pendingRecords = await prisma.auditRecord.findMany({
        where: {
          organizationId: org!.id,
          blockHash: null
        }
      });
      console.log(`Found ${pendingRecords.length} pending records`);

      block = await prisma.block.findFirst({
        where: {
          organizationId: org!.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      console.log(`Block found: ${block ? 'yes' : 'no'}`);
      retries--;
    }

    // Verify block was created
    expect(block).not.toBeNull();
    expect(block?.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(block?.previousHash).toBe('0'.repeat(64));
    expect(block?.metricsData).not.toBeNull();

    // Verify all records were updated with block hash
    const updatedRecords = await prisma.auditRecord.findMany({
      where: {
        organizationId: org!.id,
        blockHash: block?.hash
      }
    });

    expect(updatedRecords.length).toBe(10);

    // Verify socket events were emitted
    expect(mockSocket.emit).toHaveBeenCalledWith('audit-update', expect.objectContaining({
      type: 'BLOCK_CREATED',
      blockHash: block?.hash
    }));

    expect(mockSocket.emit).toHaveBeenCalledWith('metrics-update', expect.objectContaining({
      blockHash: block?.hash,
      metrics: expect.objectContaining({
        recordsAnalyzed: 10,
        consistency: expect.any(Number),
        integrity: expect.any(Number)
      })
    }));
  });
});