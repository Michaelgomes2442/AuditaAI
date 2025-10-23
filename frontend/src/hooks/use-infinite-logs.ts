import { useCallback, useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { useSocket } from "./use-socket";

interface Log {
  id: string;
  userId: string;
  eventType: string;
  timestamp: string;
  details: string;
  user: {
    id: string;
    name: string;
  } | null;
}

interface ApiResponse {
  logs: Log[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseInfiniteLogs {
  filters: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    orgId?: string;
  };
}

export function useInfiniteLogs({ filters }: UseInfiniteLogs) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const { socket, updateFilters, lastAuditUpdate } = useSocket();
  const [realtimeLogs, setRealtimeLogs] = useState<Log[]>([]);
  const [auditRecords, setAuditRecords] = useState<any[]>([]);

  // Handle audit updates in realtime
  useEffect(() => {
    if (lastAuditUpdate) {
      const { type, record } = lastAuditUpdate;
      if (type === 'RECORD_CREATED') {
        setAuditRecords(prev => [record, ...prev]);
      } else if (type === 'BLOCK_CREATED') {
        // Remove records that are now part of the block and update their status
        setAuditRecords(prev => prev.filter(r => r.blockHash !== lastAuditUpdate.blockHash));
      }
    }
  }, [lastAuditUpdate]);

  // Define the key for each page
  const getKey = useCallback(
    (pageIndex: number, previousPageData: ApiResponse | null) => {
      // First page, we don't have any previous page data
      if (pageIndex === 0) {
        return `/api/logs?${new URLSearchParams({
          userId: filters.userId || "",
          eventType: filters.eventType || "",
          startDate: filters.startDate?.toISOString() || "",
          endDate: filters.endDate?.toISOString() || "",
        })}`;
      }

      // We've reached the end
      if (previousPageData && !previousPageData.hasMore) return null;

      // Add the cursor to the API endpoint
      return `/api/logs?${new URLSearchParams({
        cursor: previousPageData?.nextCursor || "",
        userId: filters.userId || "",
        eventType: filters.eventType || "",
        startDate: filters.startDate?.toISOString() || "",
        endDate: filters.endDate?.toISOString() || "",
      })}`;
    },
    [filters]
  );

  const fetcher = useCallback((url: string) => fetch(url).then((r) => r.json()), []);

  const { data, error, size, setSize, isLoading } = useSWRInfinite<ApiResponse>(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateAll: false,
    }
  );

  // Update filters in socket when they change
  useEffect(() => {
    updateFilters(filters);
  }, [filters, updateFilters]);

  // Listen for new logs
  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (newLog: Log) => {
      setRealtimeLogs((prev) => [newLog, ...prev]);
    };

    socket.on("newLog", handleNewLog);

    return () => {
      socket.off("newLog", handleNewLog);
    };
  }, [socket]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          !isLoading &&
          data &&
          data[data.length - 1]?.hasMore
        ) {
          setSize(size + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoading, data, setSize, size]);

  const logs = [
    ...realtimeLogs,
    ...(data ? data.flatMap((page) => page.logs) : []),
  ];
  
  const hasMore = data ? data[data.length - 1]?.hasMore : false;

  return {
    logs,
    auditRecords,
    error,
    isLoading,
    hasMore,
    loaderRef,
  };
}