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

describe('Block Creation Concurrency', () => {
  let server: Server;
  let ws: ReturnType<typeof setupWebSocket>;
  let org: { id: number } | undefined;
  let user: { id: number } | undefined;
  let mockSocket: AuthenticatedSocket;
  let notifyClients: (record: any) => Promise<void>;

  beforeEach(async () => {
    server = createServer();

    // Clean up existing test data in correct order
    await prisma.block.deleteMany({ where: { organizationId: org?.id } });
    await prisma.auditRecord.deleteMany({ where: { user: { email: 'concurrency@example.com' } } });
    await prisma.user.deleteMany({ where: { email: 'concurrency@example.com' } });
    await prisma.organization.deleteMany({ where: { name: 'Concurrency Org' } });
  });

  afterEach(async () => {
    if (ws?.io) ws.io.close();
    server.close();

    if (org) {
      await prisma.block.deleteMany({ where: { organizationId: org.id } });
      await prisma.auditRecord.deleteMany({ where: { organizationId: org.id } });
      await prisma.user.deleteMany({ where: { orgId: org.id } });
      await prisma.organization.deleteMany({ where: { id: org.id } });
    }
  });

  it('only creates one block when notifyClients is called concurrently', async () => {
    // Create org and user
    org = await prisma.organization.create({ data: { name: 'Concurrency Org' } });
    user = await prisma.user.create({ data: { email: 'concurrency@example.com', password: 'pw', orgId: org.id, role: 'USER' } });

    // Create 10 pending audit records
    const records = await Promise.all(Array.from({ length: 10 }).map((_, i) => {
      return prisma.auditRecord.create({
        data: {
          action: `CONCUR_${i}`,
          category: 'SYSTEM',
          details: { test: true },
          metadata: {},
          status: 'SUCCESS',
          userId: user!.id,
          organizationId: org!.id,
          lamport: i + 1,
          hashPointer: '0'.repeat(64)
        }
      });
    }));

    // Start server and websocket
    await new Promise<void>(resolve => server.listen(() => resolve()));
    ws = setupWebSocket(server, prisma);
    notifyClients = ws.notifyClients;

    // Initialize minimal socket map to satisfy notifyClients
    const socketServer = ws as unknown as { clients: Map<string, any>; io: SocketServer };
    socketServer.clients = new Map();

    mockSocket = {
      id: 'concurrency-socket',
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
      user: { id: user!.id, orgId: org!.id, role: 'USER' },
      connected: true,
      handshake: {},
      data: {},
      request: {},
      recovered: false,
      local: {},
      server: undefined,
      adapter: undefined,
      client: undefined,
      conn: undefined,
      nsp: undefined
    } as unknown as AuthenticatedSocket;

    Object.defineProperty(socketServer.io.sockets, 'sockets', { value: new Map([[mockSocket.id, mockSocket]]), writable: true });

    // call notifyClients twice concurrently with the same record (simulate race)
    const record = await prisma.auditRecord.findFirstOrThrow({ where: { organizationId: org.id, blockHash: null }, orderBy: { createdAt: 'desc' } });

    await Promise.all([
      notifyClients(record),
      notifyClients(record)
    ]);

    // Give a small delay for transactions to complete
    await new Promise(r => setTimeout(r, 200));

    // Check blocks present
    const blocks = await prisma.block.findMany({ where: { organizationId: org.id } });
    expect(blocks.length).toBe(1);

    // Check that all records have blockHash set to that block hash
    const updated = await prisma.auditRecord.findMany({ where: { organizationId: org.id, blockHash: blocks[0].hash } });
    expect(updated.length).toBe(10);
  });
});
