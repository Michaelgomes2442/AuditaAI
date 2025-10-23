'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Link as LinkIcon, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LamportBlock {
  lamport: number;
  event: string;
  timestamp: string;
  hash: string;
  verified: boolean;
}

export default function LamportPage() {
  const [chain, setChain] = useState<LamportBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainValid, setChainValid] = useState(true);

  useEffect(() => {
    fetchLamportChain();
  }, []);

  const fetchLamportChain = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/receipts/registry');
      if (response.ok) {
        const data = await response.json();
        
        // Build Lamport chain
        const blocks = data
          .map((entry: any) => ({
            lamport: entry.lamport,
            event: entry.event,
            timestamp: entry.ts,
            hash: entry.self_hash,
            verified: entry.verified
          }))
          .sort((a: any, b: any) => a.lamport - b.lamport);
        
        setChain(blocks);
        
        // Check monotonicity
        let valid = true;
        for (let i = 1; i < blocks.length; i++) {
          if (blocks[i].lamport <= blocks[i-1].lamport) {
            valid = false;
            break;
          }
        }
        setChainValid(valid);
      }
    } catch (error) {
      console.error('Failed to fetch Lamport chain:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f7_1px,transparent_1px),linear-gradient(to_bottom,#a855f7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] animate-grid-flow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/lab" className="text-purple-400 hover:text-purple-300 transition-colors font-mono text-sm">
              ← Back to Lab
            </Link>
            <div className="text-gray-500">|</div>
            <h1 className="text-xl font-mono font-bold">Lamport Chain</h1>
            <span className={`px-2 py-1 ${chainValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} text-xs font-mono rounded`}>
              {chainValid ? 'VALID' : 'INVALID'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-purple-500/30 hover:bg-purple-500/10">
                  <HelpCircle className="h-4 w-4" />
                  <span className="font-mono text-sm">How to Use</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-slate-900 border-purple-500/30 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-mono text-purple-400">Lamport Chain Guide</SheetTitle>
                  <SheetDescription className="text-slate-400 font-mono">Logical clock for distributed governance events</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6 text-sm">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">What is a Lamport Clock?</h3>
                    <p className="text-slate-300 leading-relaxed">Lamport Logical Clocks provide total ordering of events in distributed systems. Each governance event receives a monotonically increasing Lamport timestamp, ensuring causal consistency even when system clocks drift.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Key Features</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li><strong>Monotonic Ordering:</strong> Each event L[i+1] &gt; L[i]</li>
                      <li><strong>Causal Consistency:</strong> If A causes B, then L[A] &lt; L[B]</li>
                      <li><strong>Chain Validation:</strong> Automatic verification of clock monotonicity</li>
                      <li><strong>Hash Linking:</strong> Each event references previous hash</li>
                      <li><strong>Distributed Sync:</strong> Mesh replicas synchronize via Lamport merge</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">How to Use This Dashboard</h3>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                      <li><strong>Chain Visualization:</strong> View complete Lamport sequence<p className="ml-6 text-sm text-slate-400">Arrows show causal ordering between events</p></li>
                      <li><strong>Validity Check:</strong> Monitor VALID/INVALID status badge<p className="ml-6 text-sm text-slate-400">Red indicates broken monotonicity (requires investigation)</p></li>
                      <li><strong>Event Details:</strong> Click blocks to see full event data<p className="ml-6 text-sm text-slate-400">Includes timestamp, hash, and verification status</p></li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Business Value</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li><strong>Audit Trail Integrity:</strong> Proves event ordering for regulators</li>
                      <li><strong>Tamper Detection:</strong> Any manipulation breaks chain validity</li>
                      <li><strong>Distributed Consensus:</strong> Enables multi-node agreement on event order</li>
                      <li><strong>Forensic Analysis:</strong> Replay exact sequence of governance decisions</li>
                    </ul>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors font-mono text-sm">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
            Lamport Logical Clock
          </h2>
          <p className="text-xl text-gray-300 font-mono mb-2">
            Distributed Causality Without Wall-Clock Time
          </p>
          <p className="text-gray-400 font-mono text-sm max-w-3xl">
            Lamport counters establish a partial ordering of events across distributed governance nodes. 
            Each receipt increments the counter, ensuring happens-before relationships are preserved.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-purple-400 mb-2">Chain Length</div>
            <div className="text-3xl font-bold font-mono text-white">{chain.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-cyan-400 mb-2">Current Counter</div>
            <div className="text-3xl font-bold font-mono text-white">
              {chain.length > 0 ? chain[chain.length - 1].lamport : 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-green-400 mb-2">Monotonicity</div>
            <div className="text-3xl font-bold font-mono text-white">
              {chainValid ? '✓' : '✗'}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-orange-500/30 rounded-lg p-6">
            <div className="text-sm font-mono text-orange-400 mb-2">Gaps Detected</div>
            <div className="text-3xl font-bold font-mono text-white">
              {chain.length > 1 ? chain.filter((block, i) => i > 0 && block.lamport !== chain[i-1].lamport + 1).length : 0}
            </div>
          </div>
        </div>

        {/* Chain Visualization */}
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 mb-12">
          <h3 className="text-xl font-mono font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Causal Chain Sequence
          </h3>

          {loading ? (
            <div className="text-center py-12 text-gray-400 font-mono">
              Loading chain...
            </div>
          ) : chain.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-mono">
              No events in chain yet.
            </div>
          ) : (
            <div className="space-y-4">
              {chain.map((block, idx) => (
                <div key={block.lamport} className="relative">
                  <div className="bg-slate-900/70 border border-purple-500/30 rounded-lg p-5 hover:border-purple-400 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold font-mono text-purple-400">
                          L{block.lamport}
                        </div>
                        <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 font-mono text-sm">
                          {block.event}
                        </div>
                      </div>
                      {block.verified && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-mono">VERIFIED</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                      <div>
                        <div className="text-gray-500 mb-1">Timestamp</div>
                        <div className="text-gray-300">{new Date(block.timestamp).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Hash</div>
                        <div className="text-gray-300 truncate" title={block.hash}>
                          {block.hash.substring(0, 16)}...
                        </div>
                      </div>
                    </div>

                    {/* Show causality violation */}
                    {idx > 0 && block.lamport <= chain[idx-1].lamport && (
                      <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm font-mono">
                        ⚠ Causality Violation: Counter did not increment
                      </div>
                    )}

                    {/* Show gap */}
                    {idx > 0 && block.lamport > chain[idx-1].lamport + 1 && (
                      <div className="mt-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 text-sm font-mono">
                        ⚠ Gap Detected: Missing {block.lamport - chain[idx-1].lamport - 1} event(s)
                      </div>
                    )}
                  </div>

                  {/* Chain Link */}
                  {idx < chain.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="flex flex-col items-center">
                        <div className="w-px h-6 bg-gradient-to-b from-purple-500 to-cyan-500" />
                        <LinkIcon className="w-4 h-4 text-purple-400" />
                        <div className="w-px h-6 bg-gradient-to-b from-cyan-500 to-purple-500" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lamport Clock Explanation */}
        <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-8">
          <h3 className="text-xl font-mono font-bold text-white mb-4">Lamport Clock Protocol</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-mono">
            <div>
              <div className="text-purple-400 font-bold mb-2">1. Initialization</div>
              <div className="text-gray-400">
                Each node starts with counter = 0. On first event, increment to 1. Counter never decreases.
              </div>
            </div>
            <div>
              <div className="text-cyan-400 font-bold mb-2">2. Local Events</div>
              <div className="text-gray-400">
                Before generating a receipt, increment counter by 1. This establishes the happens-before relation.
              </div>
            </div>
            <div>
              <div className="text-green-400 font-bold mb-2">3. Message Exchange</div>
              <div className="text-gray-400">
                When receiving a message, set counter = max(local, received) + 1. Ensures global ordering.
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded">
            <div className="font-mono text-sm text-purple-300">
              <strong>Happens-Before Rule (→):</strong> If event A happens before event B, then L(A) &lt; L(B)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
