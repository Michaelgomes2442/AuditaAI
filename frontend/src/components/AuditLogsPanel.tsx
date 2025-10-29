"use client";

import React, { useEffect, useState } from 'react';
import { fetchAuditLogs } from '@/lib/dashboard';

export default function AuditLogsPanel({ refreshKey }: { refreshKey?: number }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAuditLogs(20).then((data) => {
      if (!mounted) return;
      setLogs(data || []);
    }).catch((err) => {
      console.warn('AuditLogsPanel fetch error', err);
      setLogs([]);
    }).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [refreshKey]);

  return (
    <div className="bg-slate-900/40 border border-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Audit Logs</h3>
        <div className="text-sm text-gray-400">Recent events</div>
      </div>

      {loading && <div className="text-sm text-gray-400">Loading logs…</div>}

      {!loading && logs.length === 0 && (
        <div className="text-sm text-gray-500">No audit events found.</div>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((l: any, idx: number) => (
            <div key={`log-${idx}`} className="p-2 bg-slate-800/30 border border-white/5 rounded flex items-center justify-between">
              <div className="text-xs text-gray-300">
                <div className="font-mono text-sm">{l.action || l.type || 'event'}</div>
                <div className="text-xs text-gray-500">{new Date(l.ts || l.timestamp || Date.now()).toLocaleString('en-US', { timeZone: 'UTC' })}</div>
              </div>
              <div className="text-xs text-gray-400">Lamport: {l.lamport ?? l.lamport_id ?? '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
