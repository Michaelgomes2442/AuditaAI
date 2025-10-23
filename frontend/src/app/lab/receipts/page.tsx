'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface Receipt {
  timestamp: string;
  event: string;
  lamport: number;
  self_hash: string;
  calc_hash?: string;
  verified?: boolean;
  path: string;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [registry, setRegistry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      // Fetch registry from backend
      const response = await fetch('http://localhost:3001/api/receipts/registry');
      if (response.ok) {
        const data = await response.json();
        setRegistry(data);
        
        // Convert registry to receipt format
        const receiptList = data.map((entry: any) => ({
          timestamp: entry.ts,
          event: entry.event,
          lamport: entry.lamport,
          self_hash: entry.self_hash,
          calc_hash: entry.calc_hash,
          verified: entry.verified,
          path: entry.path
        }));
        setReceipts(receiptList);
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyReceipt = async (path: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/receipts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      
      if (response.ok) {
        const result = await response.json();
        setSelectedReceipt(result);
        fetchReceipts(); // Refresh list
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] animate-grid-flow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/lab" className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm">
              ← Back to Lab
            </Link>
            <div className="text-gray-500">|</div>
            <h1 className="text-xl font-mono font-bold">Δ-Receipts Registry</h1>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">LIVE</span>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white transition-colors font-mono text-sm">
            Home
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-mono">
            Governance Receipt Ledger
          </h2>
          <p className="text-xl text-gray-300 font-mono mb-2">
            Cryptographically Sealed Audit Trail
          </p>
          <p className="text-gray-400 font-mono text-sm max-w-3xl">
            Every governance event generates an encrypted .ben receipt with Lamport clock ordering. 
            Receipts are Fernet-encrypted, SHA-256 hashed, and stored immutably.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-cyan-400 mb-2">Total Receipts</div>
            <div className="text-3xl font-bold font-mono text-white">{receipts.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-green-400 mb-2">Verified</div>
            <div className="text-3xl font-bold font-mono text-white">
              {receipts.filter(r => r.verified).length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-purple-400 mb-2">Latest Lamport</div>
            <div className="text-3xl font-bold font-mono text-white">
              {Math.max(...receipts.map(r => r.lamport || 0), 0)}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-orange-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-orange-400 mb-2">Event Types</div>
            <div className="text-3xl font-bold font-mono text-white">
              {new Set(receipts.map(r => r.event)).size}
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 mb-12">
          <h3 className="text-xl font-mono font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Receipt Chain
          </h3>

          {loading ? (
            <div className="text-center py-12 text-gray-400 font-mono">
              Loading receipts...
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-mono">
              No receipts found. Generate governance events to create receipts.
            </div>
          ) : (
            <div className="space-y-3">
              {receipts.sort((a, b) => b.lamport - a.lamport).map((receipt, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/70 border border-slate-600 rounded-lg p-4 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-cyan-400 font-mono font-bold text-lg">
                        L{receipt.lamport}
                      </div>
                      <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 font-mono text-sm">
                        {receipt.event}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {receipt.verified ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-mono">VERIFIED</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            verifyReceipt(receipt.path);
                          }}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-mono rounded transition-colors"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                    <div>
                      <div className="text-gray-500 mb-1">Timestamp</div>
                      <div className="text-gray-300">{new Date(receipt.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Hash</div>
                      <div className="text-gray-300 truncate" title={receipt.self_hash}>
                        {receipt.self_hash.substring(0, 16)}...
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Receipt Detail */}
        {selectedReceipt && (
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6">
            <h3 className="text-xl font-mono font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Receipt Details
            </h3>

            <div className="space-y-4 font-mono text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 mb-2">Event Type</div>
                  <div className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300">
                    {selectedReceipt.event}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-2">Lamport Counter</div>
                  <div className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300">
                    {selectedReceipt.lamport}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2">Timestamp (UTC)</div>
                <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-gray-300">
                  {selectedReceipt.timestamp}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2">Self Hash (SHA-256)</div>
                <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-gray-300 break-all">
                  {selectedReceipt.self_hash}
                </div>
              </div>

              {selectedReceipt.calc_hash && (
                <div>
                  <div className="text-gray-500 mb-2">Calculated Hash</div>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-gray-300 break-all">
                    {selectedReceipt.calc_hash}
                  </div>
                </div>
              )}

              <div>
                <div className="text-gray-500 mb-2">File Path</div>
                <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-gray-300 break-all">
                  {selectedReceipt.path}
                </div>
              </div>

              {selectedReceipt.verified !== undefined && (
                <div className="mt-6 p-4 rounded-lg border-2" style={{
                  backgroundColor: selectedReceipt.verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: selectedReceipt.verified ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                }}>
                  <div className="flex items-center gap-3">
                    {selectedReceipt.verified ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <div>
                          <div className="font-bold text-green-400 text-lg">Verification Passed</div>
                          <div className="text-green-300 text-xs">Hash matches - receipt is authentic</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <div>
                          <div className="font-bold text-red-400 text-lg">Verification Failed</div>
                          <div className="text-red-300 text-xs">Hash mismatch - potential tampering detected</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-12 bg-slate-800/30 border border-slate-600 rounded-lg p-8">
          <h3 className="text-xl font-mono font-bold text-white mb-4">Receipt Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-mono">
            <div>
              <div className="text-cyan-400 font-bold mb-2">1. Event Capture</div>
              <div className="text-gray-400">
                Every governance action (boot, sync, analysis) generates a timestamped event with Lamport clock ordering for causal consistency.
              </div>
            </div>
            <div>
              <div className="text-purple-400 font-bold mb-2">2. Cryptographic Seal</div>
              <div className="text-gray-400">
                Event data is hashed with SHA-256, encrypted with Fernet (AES-128), and stored as .ben receipt files. Tamper-evident by design.
              </div>
            </div>
            <div>
              <div className="text-green-400 font-bold mb-2">3. Chain Verification</div>
              <div className="text-gray-400">
                Receipts link via prev_digest creating an append-only chain. Verification recalculates hash and confirms integrity.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
