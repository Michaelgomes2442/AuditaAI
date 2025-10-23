"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
const socket_io_1 = require("socket.io");
const governance_1 = require("./lib/governance.cjs");
function setupWebSocket(server, prisma) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    // Store connected clients with their filters and organization
    const clients = new Map();
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        // Store client's initial filters
        socket.on("setFilters", (filters) => {
            clients.set(socket.id, filters);
        });
        // Handle organization room joining
        socket.on("join-org", (orgId) => {
            if (!socket.user)
                return;
            const orgIdNum = parseInt(orgId);
            if (isNaN(orgIdNum))
                return;
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
        notifyClients: async (auditRecord) => {
            const matchingClients = new Map(); // orgId -> Set of socket IDs
            // Group matching clients by organization
            clients.forEach((filters, socketId) => {
                if (!filters.orgId)
                    return;
                let matches = true;
                if (filters.userId && auditRecord.userId.toString() !== filters.userId) {
                    matches = false;
                }
                if (filters.eventType && auditRecord.action !== filters.eventType) {
                    matches = false;
                }
                if (filters.startDate && new Date(auditRecord.createdAt) < new Date(filters.startDate)) {
                    matches = false;
                }
                if (filters.endDate && new Date(auditRecord.createdAt) > new Date(filters.endDate)) {
                    matches = false;
                }
                if (matches) {
                    if (!matchingClients.has(filters.orgId)) {
                        matchingClients.set(filters.orgId, new Set());
                    }
                    matchingClients.get(filters.orgId)?.add(socketId);
                }
            });
            // Process each organization's updates
            for (const [orgId, socketIds] of matchingClients.entries()) {
                // Check for block creation threshold
                const recentRecords = await prisma.auditRecord.findMany({
                    where: {
                        organizationId: orgId,
                        blockHash: null
                    },
                    orderBy: { createdAt: 'asc' },
                    take: 100,
                    include: {
                        user: {
                            select: {
                                id: true,
                                orgId: true,
                                email: true
                            }
                        }
                    }
                });
                if (recentRecords.length >= 10) { // Threshold for creating a new block
                    const latestRecord = await prisma.auditRecord.findFirst({
                        where: {
                            organizationId: orgId,
                            blockHash: { not: null }
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                    const previousHash = latestRecord?.blockHash || '0'.repeat(64);
                    const blockData = {
                        previousHash,
                        records: recentRecords,
                        timestamp: Date.now(),
                        lamportClock: Math.max(...recentRecords.map((r) => r.lamport))
                    };
                    const blockHash = (0, governance_1.generateBlockHash)(blockData);
                    // Update records with block hash
                    await prisma.auditRecord.updateMany({
                        where: {
                            id: {
                                in: recentRecords.map((r) => r.id)
                            }
                        },
                        data: {
                            blockHash
                        }
                    });
                    // Calculate CRIES metrics for the block
                    const metrics = (0, governance_1.calculateCRIESMetrics)(recentRecords);
                    await prisma.block.create({
                        data: {
                            hash: blockHash,
                            previousHash: previousHash,
                            organizationId: orgId,
                            lamportClock: blockData.lamportClock,
                            metricsData: metrics
                        }
                    });
                    // Broadcast block creation and metrics to matching clients
                    socketIds.forEach(socketId => {
                        const socket = io.sockets.sockets.get(socketId);
                        if (!socket)
                            return;
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
                }
                else {
                    // Broadcast single record update to matching clients
                    socketIds.forEach(socketId => {
                        const socket = io.sockets.sockets.get(socketId);
                        if (!socket)
                            return;
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
