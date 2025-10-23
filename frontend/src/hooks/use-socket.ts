import { useCallback, useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

type AuditUpdate = {
  type: 'RECORD_CREATED' | 'BLOCK_CREATED';
  record: any;
  blockHash?: string;
};

type MetricsUpdate = {
  blockHash: string;
  metrics: {
    consistency: number;
    reproducibility: number;
    integrity: number;
    explainability: number;
    security: number;
    timestamp: string;
    recordsAnalyzed: number;
  };
  timestamp: string;
};

type VerificationResult = {
  success: boolean;
  blockHash: string;
  error?: string;
};

export function useSocket(orgId?: string) {
  const socket = useRef<Socket | null>(null);
  const [lastAuditUpdate, setLastAuditUpdate] = useState<AuditUpdate | null>(null);
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState<MetricsUpdate | null>(null);
  const [lastVerification, setLastVerification] = useState<VerificationResult | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socket.current = io(SOCKET_URL);

    // Set up event listeners
    if (socket.current) {
      socket.current.on('audit-update', (update: AuditUpdate) => {
        console.log('Received audit update:', update);
        setLastAuditUpdate(update);
      });

      socket.current.on('metrics-update', (update: MetricsUpdate) => {
        console.log('Received metrics update:', update);
        setLastMetricsUpdate(update);
      });

      socket.current.on('verification-result', (result: VerificationResult) => {
        console.log('Received verification result:', result);
        setLastVerification(result);
      });

      // Join organization room if orgId is provided
      if (orgId) {
        socket.current.emit('join-org', orgId);
      }
    }

    // Clean up on unmount
    return () => {
      if (socket.current) {
        socket.current.off('audit-update');
        socket.current.off('metrics-update');
        socket.current.off('verification-result');
        socket.current.disconnect();
      }
    };
  }, [orgId]);

  type UpdateFilters = {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    orgId?: string;
  };

  const updateFilters = useCallback((filters: UpdateFilters) => {
    if (socket.current) {
      socket.current.emit("setFilters", {
        userId: filters.userId,
        eventType: filters.eventType,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        orgId: filters.orgId,
      });
    }
  }, []);

  const joinOrganization = useCallback((newOrgId: string | number) => {
    if (socket.current) {
      socket.current.emit('join-org', newOrgId);
    }
  }, []);

  return {
    socket: socket.current,
    updateFilters,
    joinOrganization,
    lastAuditUpdate,
    lastMetricsUpdate,
    lastVerification,
  };
}