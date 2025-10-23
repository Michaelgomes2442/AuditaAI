"use client";

import { ExportButton } from "@/components/export-button";
import { LogFilters } from "@/components/log-filters";
import { FilterSkeleton, LogSkeleton } from "@/components/log-skeleton";
import { useInfiniteLogs } from "@/hooks/use-infinite-logs";
import { useCallback, useState } from "react";
import useSWR from "swr";
import { Activity, Clock, User as UserIcon } from "lucide-react";

interface LogFilters {
  userId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
}

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

interface User {
  id: string;
  name: string;
}

export default function LogsPage() {
  const [filters, setFilters] = useState<LogFilters>({
    userId: undefined,
    eventType: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const fetcher = useCallback((url: string) => fetch(url).then((r) => r.json()), []);
  
  const { data: users } = useSWR<User[]>("/api/users", fetcher);
  const { data: eventTypes } = useSWR<string[]>("/api/logs/event-types", fetcher);
  const { logs, isLoading, hasMore, loaderRef } = useInfiniteLogs({
    filters,
  });

  const handleFiltersChange = useCallback((newFilters: LogFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      <div className="relative">
        <div className="container mx-auto px-8 py-12 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Activity className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-mono font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                    AUDIT LOGS
                  </h1>
                  <p className="text-slate-400 font-mono text-sm mt-1">Real-time system activity monitoring</p>
                </div>
              </div>
              <ExportButton filters={filters} />
            </div>
          </div>

          {/* Filters */}
          {!users || !eventTypes ? (
            <FilterSkeleton />
          ) : (
            <div className="mb-6">
              <LogFilters
                users={users}
                eventTypes={eventTypes}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          )}

          {/* Logs Display */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="space-y-3">
            {!logs || (isLoading && logs.length === 0) ? (
              <LogSkeleton />
            ) : (
              <>
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30 border border-white/5 hover:border-cyan-500/30 transition-all group">
                    <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                      <Clock className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          <span className="font-mono font-bold text-white">
                            {log.user?.name || "Unknown User"}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-400">
                          {log.eventType}
                        </span>
                      </div>
                      {log.details && (
                        <p className="mt-2 text-sm text-slate-400 font-mono">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-mono">
                      No logs found matching the selected filters.
                    </p>
                  </div>
                )}
                {hasMore && (
                  <div ref={loaderRef} className="py-4">
                    <LogSkeleton />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}