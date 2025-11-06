'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle, AlertCircle, Shield, Lock, TrendingUp, Database } from 'lucide-react';

interface GovernanceReceipt {
  id: number;
  lamport: string;
  persona: string | null;
  promptHash: string;
  outputHash: string;
  violations: string[];
  timestamp?: string;
  createdAt: Date;
  criesOmega: number;
  criesCoherence: number;
  criesRigor: number;
  criesIntegrity: number;
  criesEmpathy: number;
  criesStrictness: number;
  merkleSealId: number | null;
  merkleSeal?: {
    id: number;
    rootHash: string;
    sealedAt: Date;
  } | null;
}

interface ReceiptStats {
  total: number;
  sealed: number;
  unsealed: number;
  withViolations: number;
  byPersona: Record<string, number>;
  criesRanges: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  sealPercentage: string;
}

export default function ReceiptsPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const [receipts, setReceipts] = useState<GovernanceReceipt[]>([]);
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<GovernanceReceipt | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch receipts from the lab API
      const receiptsResponse = await fetch(`${BACKEND_URL}/api/lab/receipts?take=100`);
      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        if (receiptsData.success && receiptsData.receipts) {
          setReceipts(receiptsData.receipts);
          
          // Calculate stats from receipts
          const total = receiptsData.pagination.total;
          const sealed = receiptsData.receipts.filter((r: GovernanceReceipt) => r.merkleSealId !== null).length;
          const unsealed = total - sealed;
          const withViolations = receiptsData.receipts.filter((r: GovernanceReceipt) => r.violations && r.violations.length > 0).length;
          
          // Group by persona
          const byPersona: Record<string, number> = {};
          receiptsData.receipts.forEach((r: GovernanceReceipt) => {
            if (r.persona) {
              byPersona[r.persona] = (byPersona[r.persona] || 0) + 1;
            }
          });
          
          // Calculate CRIES ranges
          const criesRanges = {
            excellent: receiptsData.receipts.filter((r: GovernanceReceipt) => r.criesOmega >= 0.8).length,
            good: receiptsData.receipts.filter((r: GovernanceReceipt) => r.criesOmega >= 0.6 && r.criesOmega < 0.8).length,
            fair: receiptsData.receipts.filter((r: GovernanceReceipt) => r.criesOmega >= 0.4 && r.criesOmega < 0.6).length,
            poor: receiptsData.receipts.filter((r: GovernanceReceipt) => r.criesOmega < 0.4).length,
          };
          
          setStats({
            total,
            sealed,
            unsealed,
            withViolations,
            byPersona,
            criesRanges,
            sealPercentage: total > 0 ? ((sealed / total) * 100).toFixed(1) : '0.0'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewReceiptDetails = async (id: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/governance/receipts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedReceipt(data);
      }
    } catch (error) {
      console.error('Failed to fetch receipt details:', error);
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
            <div className="text-3xl font-bold font-mono text-white">{stats?.total || 0}</div>
          </div>
          <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-green-400 mb-2">Sealed</div>
            <div className="text-3xl font-bold font-mono text-white">
              {stats?.sealed || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-purple-400 mb-2">Latest Lamport</div>
            <div className="text-3xl font-bold font-mono text-white">
              {receipts.length > 0 ? Math.max(...receipts.map(r => parseInt(r.lamport || '0'))) : 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-orange-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-orange-400 mb-2">Avg CRIES Ω</div>
            <div className="text-3xl font-bold font-mono text-white">
              {receipts.length > 0 
                ? ((receipts.reduce((sum, r) => sum + (r.criesOmega || 0), 0) / receipts.length) * 100).toFixed(1) + '%'
                : '0%'}
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
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-800/70 border border-cyan-500/30 rounded-lg">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-cyan-400 font-mono">Loading receipts...</div>
              </div>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto bg-gradient-to-r from-slate-800/70 to-slate-900/70 border border-orange-500/30 rounded-xl p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-mono font-bold text-white mb-2">Enterprise Backend Required</h3>
                <p className="text-slate-300 font-mono text-sm mb-4">
                  This feature requires the AuditaAI backend server to access live receipt data from the governance ledger.
                </p>
                <div className="text-xs text-slate-500 font-mono bg-slate-900/50 p-3 rounded border border-slate-600/50">
                  <div className="font-semibold text-orange-400 mb-1">For Enterprise Deployments:</div>
                  <div>• Deploy backend server with database access</div>
                  <div>• Enable file system operations for receipt verification</div>
                  <div>• Configure governance event processing</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...receipts]
                .sort((a, b) => parseInt(b.lamport) - parseInt(a.lamport))
                .map((receipt, idx) => (
                <div
                  key={receipt.id}
                  className="bg-slate-900/70 border border-slate-600 rounded-lg p-4 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-cyan-400 font-mono font-bold text-lg">
                        L{receipt.lamport}
                      </div>
                      <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 font-mono text-sm">
                        {receipt.persona || 'System'}
                      </div>
                      {receipt.merkleSealId && (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-mono">SEALED</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 font-mono text-xs">
                        Ω {(receipt.criesOmega * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                    <div>
                      <div className="text-gray-500 mb-1">Timestamp</div>
                      <div className="text-gray-300">
                        {new Date(receipt.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Prompt Hash</div>
                      <div className="text-gray-300 truncate" title={receipt.promptHash}>
                        {receipt.promptHash.substring(0, 16)}...
                      </div>
                    </div>
                  </div>

                  {receipt.violations && receipt.violations.length > 0 && (
                    <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded">
                      <div className="text-red-400 font-mono text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {receipt.violations.length} violation{receipt.violations.length !== 1 ? 's' : ''} detected
                      </div>
                    </div>
                  )}
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
                  <div className="text-gray-500 mb-2">Persona</div>
                  <div className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300">
                    {selectedReceipt.persona || 'System'}
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
                  {new Date(selectedReceipt.createdAt).toISOString()}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2">Prompt Hash (SHA-256)</div>
                <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-gray-300 break-all">
                  {selectedReceipt.promptHash}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2">Output Hash (SHA-256)</div>
                <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded text-gray-300 break-all">
                  {selectedReceipt.outputHash}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2">CRIES Metrics</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded">
                    <div className="text-gray-400 text-xs mb-1">Coherence</div>
                    <div className="text-cyan-300">{(selectedReceipt.criesCoherence * 100).toFixed(1)}%</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded">
                    <div className="text-gray-400 text-xs mb-1">Rigor</div>
                    <div className="text-cyan-300">{(selectedReceipt.criesRigor * 100).toFixed(1)}%</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded">
                    <div className="text-gray-400 text-xs mb-1">Integrity</div>
                    <div className="text-cyan-300">{(selectedReceipt.criesIntegrity * 100).toFixed(1)}%</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded">
                    <div className="text-gray-400 text-xs mb-1">Empathy</div>
                    <div className="text-cyan-300">{(selectedReceipt.criesEmpathy * 100).toFixed(1)}%</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded">
                    <div className="text-gray-400 text-xs mb-1">Strictness</div>
                    <div className="text-cyan-300">{(selectedReceipt.criesStrictness * 100).toFixed(1)}%</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded">
                    <div className="text-gray-400 text-xs mb-1">Omega (Ω)</div>
                    <div className="text-cyan-300 font-bold">{(selectedReceipt.criesOmega * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {selectedReceipt.violations && selectedReceipt.violations.length > 0 && (
                <div>
                  <div className="text-gray-500 mb-2">Violations</div>
                  <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded">
                    <ul className="text-red-300 text-xs space-y-1">
                      {selectedReceipt.violations.map((v, i) => (
                        <li key={i}>• {v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedReceipt.merkleSeal && (
                <div className="mt-6 p-4 rounded-lg border-2 bg-green-500/10 border-green-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <div className="font-bold text-green-400 text-lg">Merkle Sealed</div>
                      <div className="text-green-300 text-xs">
                        Root: {selectedReceipt.merkleSeal.rootHash.substring(0, 16)}...
                      </div>
                      <div className="text-green-300 text-xs">
                        Sealed: {new Date(selectedReceipt.merkleSeal.sealedAt).toLocaleString()}
                      </div>
                    </div>
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
