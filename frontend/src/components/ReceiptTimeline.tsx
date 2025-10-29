"use client";

import React, { useEffect, useState } from 'react';
import { fetchReceipts } from '@/lib/dashboard';

export default function ReceiptTimeline({ refreshKey }: { refreshKey?: number }) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchReceipts().then((data) => {
      if (!mounted) return;
      const list = (data?.receipts || data || []).slice().sort((a: any, b: any) => (a.lamport || 0) - (b.lamport || 0));
      setReceipts(list);
    }).catch((err) => {
      console.warn('ReceiptTimeline fetch error', err);
      setReceipts([]);
    }).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [refreshKey]);

  return (
    <div className="bg-slate-900/40 border border-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Receipt Chain Timeline</h3>
        <div className="text-sm text-gray-400">Lamport ordered</div>
      </div>

      {loading && <div className="text-sm text-gray-400">Loading receipts…</div>}

      {!loading && receipts.length === 0 && (
        <div className="text-sm text-gray-500">No receipts available.</div>
      )}

      {!loading && receipts.length > 0 && (
        <div className="overflow-x-auto py-2">
          <div className="flex gap-6 items-center px-2">
            {receipts.map((r, idx) => (
              <button key={`receipt-${r.lamport}-${idx}`} onClick={() => setSelected(r)} className="min-w-[140px] p-3 bg-slate-800/30 border border-white/5 rounded-lg text-left hover:scale-105 transition-transform">
                <div className="text-xs text-gray-400">#{r.lamport}</div>
                <div className="text-sm font-mono text-white truncate">{r.type || r.receipt_type || 'receipt'}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(r.timestamp || r.ts || Date.now()).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Details drawer */}
      {selected && (
        <div className="mt-4 bg-slate-800/30 border border-white/5 rounded p-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-300 font-mono font-semibold">Receipt #{selected.lamport}</div>
              <div className="text-xs text-gray-400">{selected.type || selected.receipt_type}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(null)} className="text-xs px-2 py-1 bg-slate-700/30 rounded">Close</button>
            </div>
          </div>
          <pre className="mt-3 max-h-52 overflow-y-auto text-xs text-slate-300 bg-slate-900/50 p-3 rounded">{JSON.stringify(selected, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
