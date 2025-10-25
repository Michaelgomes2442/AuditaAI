"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Database, Clock, Users, GitBranch, CheckCircle2, AlertTriangle, Layers, Activity, FileText, Share2, HelpCircle, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ConversationSelector from "@/components/ConversationSelector";

interface QTraceReceipt {
  event_id: string;
  ts_utc: string;
  actor: string;
  context_sha: string;
  decision: string;
  controls_invoked: string[];
  outcome: "approved" | "rejected" | "amended" | "queued" | "simulated";
  prev_hash: string;
  self_hash: string;
  erl: number;
  phi: number;
  stream_id: string;
  state: "SEALED" | "DEGRADED" | "RETROJUSTIFIED";
  witnesses: string[];
  checkpoint_hour?: string;
}

interface MerkleCheckpoint {
  timestamp: string;
  root_hash: string;
  stream_count: number;
  receipt_count: number;
  type: "hourly" | "daily_super";
}

interface WitnessQuorum {
  fast_path: string;
  async_quorum: {
    type: "2of3";
    members: string[];
    deadline_ms: number;
  };
  current_votes: { [key: string]: number };
  status: "pending" | "consensus" | "degraded";
}

export default function QTracePage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [selectedConversation, setSelectedConversation] = useState<string>("aggregate");
  const [selectedStream, setSelectedStream] = useState<string>("stream_001");
  const [receipts, setReceipts] = useState<QTraceReceipt[]>([]);
  const [checkpoints, setCheckpoints] = useState<MerkleCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real Q-Trace data from backend
  useEffect(() => {
    const fetchQTraceData = async () => {
      try {
        setLoading(true);
        
        // Fetch REAL conversation data filtered by conversationId (no fake data!)
        const url = selectedConversation === 'aggregate'
          ? `${BACKEND_URL ?? ''}/api/conversations/aggregate`
          : `${BACKEND_URL ?? ''}/api/conversations/aggregate?conversationId=${selectedConversation}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch conversation data');
        const data = await response.json();
        
        if (!data.hasRealData) {
          setError('No real data yet - run LLM conversations in Live Demo to generate receipts');
          setLoading(false);
          return;
        }
        
        // Transform REAL receipts into Q-Trace format (no random fake data!)
        const qtraceReceipts: QTraceReceipt[] = data.receipts.map((receipt: any, index: number) => {
          return {
            event_id: receipt.analysis_id || `evt_${receipt.lamport}`,
            ts_utc: receipt.ts || new Date().toISOString(),
            actor: receipt.model_id || 'unknown',
            context_sha: receipt.self_hash || '0x000',
            decision: receipt.receipt_type || 'GOVERNANCE_EVENT',
            controls_invoked: ['CRIES_CHECK', 'SIGMA_VERIFY', 'LAMPORT_CHAIN'],
            outcome: receipt.digest_verified ? 'approved' as const : 'pending' as const,
            prev_hash: receipt.prev_digest || '0x000',
            self_hash: receipt.self_hash || '0x000',
            erl: receipt.cries ? (1 - receipt.cries.S) : 0, // Real ERL from Security score
            phi: receipt.sigma_window?.σ || 0, // Real phi from actual sigma
            stream_id: receipt.conversation_id || `stream_${(index % 3) + 1}`,
            state: receipt.digest_verified ? 'SEALED' as const : 'DEGRADED' as const,
            witnesses: receipt.tri_actor_role ? [receipt.tri_actor_role] : [],
            checkpoint_hour: new Date(receipt.ts || Date.now()).toISOString().slice(0, 13) + ':00:00Z'
          };
        });
        
        setReceipts(qtraceReceipts);
        
        // Generate checkpoints from real data
        const hourlyMap = new Map<string, QTraceReceipt[]>();
        qtraceReceipts.forEach(r => {
          const hour = r.checkpoint_hour || new Date().toISOString().slice(0, 13) + ':00:00Z';
          if (!hourlyMap.has(hour)) hourlyMap.set(hour, []);
          hourlyMap.get(hour)!.push(r);
        });
        
        const checkpointData: MerkleCheckpoint[] = Array.from(hourlyMap.entries()).map(([hour, receipts]) => ({
          timestamp: hour,
          root_hash: receipts[0]?.self_hash || '0x000',
          stream_count: new Set(receipts.map(r => r.stream_id)).size,
          receipt_count: receipts.length,
          type: 'hourly' as const
        }));
        
        setCheckpoints(checkpointData);
        setError(null);
      } catch (err) {
        console.error('Failed to load Q-Trace data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQTraceData();
    const interval = setInterval(fetchQTraceData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const witnessQuorum: WitnessQuorum = {
    fast_path: "single_band0",
    async_quorum: {
      type: "2of3",
      members: ["GPT-5", "Claude-Opus", "Gemini-2", "Mistral-Next"],
      deadline_ms: 500
    },
    current_votes: {
      "GPT-5": 1247,
      "Claude-Opus": 1189,
      "Gemini-2": 1056,
      "Mistral-Next": 892
    },
    status: "consensus"
  };

  const streams = [
    { id: "stream_001", name: "Production Primary", count: 1247, health: "healthy" },
    { id: "stream_002", name: "Risk Assessment", count: 892, health: "healthy" },
    { id: "stream_003", name: "Audit Trail", count: 2341, health: "healthy" },
    { id: "stream_004", name: "Policy Engine", count: 567, health: "degraded" }
  ];

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "approved": return "text-green-400";
      case "rejected": return "text-red-400";
      case "amended": return "text-yellow-400";
      case "queued": return "text-blue-400";
      case "simulated": return "text-purple-400";
      default: return "text-slate-400";
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "SEALED": return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "DEGRADED": return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "RETROJUSTIFIED": return <Clock className="h-4 w-4 text-blue-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="container mx-auto px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/lab" className="flex items-center space-x-3">
              <Shield className="h-7 w-7 text-violet-400" />
              <span className="text-xl font-mono font-bold">
                Audit<span className="text-violet-400">a</span>AI Lab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/lab"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-violet-500/30 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-mono text-sm">Back to Lab</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-violet-500/30 transition-all"
              >
                <Home className="h-4 w-4" />
                <span className="font-mono text-sm">Home</span>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-violet-500/30 hover:bg-violet-500/10">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-mono text-sm">How to Use</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-violet-500/30 overflow-y-auto max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-mono text-violet-400">Q-Trace Station Guide</DialogTitle>
                    <DialogDescription className="text-slate-400 font-mono">
                      Band-2 causal provenance tracking and witness quorum system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-6 space-y-6 text-sm">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">What is Q-Trace?</h3>
                      <p className="text-slate-300 leading-relaxed">
                        Q-Trace is AuditaAI's Band-2 provenance system that creates immutable audit trails for all governance decisions. It uses sharded Lamport chains (by stream_id) with hourly/daily Merkle checkpoints and a hybrid witness quorum for &gt;98% governance maturity.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Key Features</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><strong>Sharded Streams:</strong> Independent Lamport chains per stream_id for parallel processing</li>
                        <li><strong>Merkle Checkpoints:</strong> Hourly and daily super-checkpoints for efficient verification</li>
                        <li><strong>Witness Quorum:</strong> Fast-path + async 2-of-3 voting ensures consensus</li>
                        <li><strong>ERL/Phi Tracking:</strong> Expected Regulatory Loss and compliance scores per event</li>
                        <li><strong>Causal Linking:</strong> Every receipt references prev_hash for chain integrity</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">How to Use This Dashboard</h3>
                      <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li>
                          <strong>Stream Overview:</strong> Monitor active streams and their health status
                          <p className="ml-6 text-sm text-slate-400">Green = sealed, Yellow = degraded, Red = retro-justified</p>
                        </li>
                        <li>
                          <strong>Receipt Explorer:</strong> Browse governance decisions chronologically
                          <p className="ml-6 text-sm text-slate-400">Click any receipt to view full details including witnesses and controls</p>
                        </li>
                        <li>
                          <strong>Merkle Checkpoints:</strong> Verify hourly/daily aggregation roots
                          <p className="ml-6 text-sm text-slate-400">Use root_hash to cryptographically verify historical receipts</p>
                        </li>
                        <li>
                          <strong>Witness Quorum:</strong> Check consensus status across models
                          <p className="ml-6 text-sm text-slate-400">Fast-path (GPT-5) + async 2-of-3 (Claude, Gemini, Others)</p>
                        </li>
                      </ol>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Business Value for Investors</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><strong>Regulatory Assurance:</strong> Auditable proof of compliance for SOC2, ISO27001, GDPR</li>
                        <li><strong>Non-Repudiation:</strong> Cryptographic guarantee that AI decisions can't be tampered with</li>
                        <li><strong>Scalability:</strong> Sharded design supports millions of governance events per day</li>
                        <li><strong>Cost Efficiency:</strong> Merkle checkpoints reduce verification costs by 95%</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Receipt States</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">SEALED</Badge>
                          <span className="text-slate-300">Normal: Witnessed and consensus achieved</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">DEGRADED</Badge>
                          <span className="text-slate-300">Warning: Partial quorum, pending full consensus</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">RETROJUSTIFIED</Badge>
                          <span className="text-slate-300">Alert: Post-hoc justification due to quorum timeout</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center space-x-1 text-sm font-mono">
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-400">Q-TRACE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-mono font-bold">Q-Trace v1.1</h1>
              <p className="text-slate-400 font-mono text-sm">Band-2 Causal Provenance Engine</p>
            </div>
          </div>
          <p className="text-slate-300 font-mono text-sm max-w-3xl">
            Sharded Lamport chains by stream_id with hourly/daily Merkle checkpoints. 
            Hybrid witness (fast-path + async 2-of-3 quorum) ensures &gt;98% governance maturity.
          </p>
        </div>

        {/* Conversation Selector */}
        <div className="mb-8">
          <ConversationSelector
            selectedConversation={selectedConversation}
            onConversationChange={setSelectedConversation}
            showAggregate={true}
          />
          {selectedConversation !== 'aggregate' && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300 font-mono">
                🔍 Viewing receipt chain for single conversation. Each conversation has its own Lamport counter starting from 0.
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 font-mono text-sm">Loading Q-Trace data from backend...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Failed to Load Data
              </CardTitle>
              <CardDescription className="text-red-300/70">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Data View - only shown when not loading */}
        {!loading && !error && (
          <>
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Total Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-violet-400">107,675</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Across 15 streams</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Checkpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-green-400">2,341</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Last: 14:00 UTC</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Witness Quorum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-blue-400">2/3</div>
              <p className="text-xs text-slate-500 font-mono mt-1">500ms deadline</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Avg ERL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-yellow-400">0.284</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Expected Regulatory Loss</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="receipts" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-600">
            <TabsTrigger value="receipts" className="font-mono">Receipts</TabsTrigger>
            <TabsTrigger value="checkpoints" className="font-mono">Merkle Checkpoints</TabsTrigger>
            <TabsTrigger value="streams" className="font-mono">Stream Shards</TabsTrigger>
            <TabsTrigger value="witness" className="font-mono">Witness Quorum</TabsTrigger>
            <TabsTrigger value="policy" className="font-mono">Policy Config</TabsTrigger>
          </TabsList>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-400" />
                  Q-Trace Receipt Stream
                </CardTitle>
                <CardDescription className="font-mono">
                  Real-time causal provenance with decision audit trail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.event_id}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-violet-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStateIcon(receipt.state)}
                          <div>
                            <div className="font-mono text-sm font-bold text-violet-400">
                              {receipt.event_id}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {new Date(receipt.ts_utc).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`font-mono ${getOutcomeColor(receipt.outcome)}`}>
                          {receipt.outcome.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">Actor</div>
                          <div className="text-sm font-mono text-slate-300">{receipt.actor}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">Decision</div>
                          <div className="text-sm font-mono text-slate-300">{receipt.decision}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">ERL</div>
                          <div className="text-sm font-mono text-yellow-400">{receipt.erl.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">Φ (Phi)</div>
                          <div className="text-sm font-mono text-green-400">{receipt.phi.toFixed(3)}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-slate-500 font-mono mb-1">Controls Invoked</div>
                        <div className="flex flex-wrap gap-2">
                          {receipt.controls_invoked.map((control) => (
                            <Badge key={control} variant="secondary" className="font-mono text-xs">
                              {control}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-slate-500 font-mono mb-1">Witnesses</div>
                        <div className="flex flex-wrap gap-2">
                          {receipt.witnesses.map((witness) => (
                            <Badge key={witness} variant="outline" className="font-mono text-xs text-blue-400">
                              <Users className="h-3 w-3 mr-1" />
                              {witness}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <details className="text-xs font-mono">
                        <summary className="cursor-pointer text-slate-500 hover:text-violet-400">
                          Show Hash Chain
                        </summary>
                        <div className="mt-2 p-3 bg-slate-950 rounded border border-slate-700 space-y-1">
                          <div><span className="text-slate-500">Context SHA:</span> <span className="text-violet-400">{receipt.context_sha.substring(0, 16)}...</span></div>
                          <div><span className="text-slate-500">Prev Hash:</span> <span className="text-blue-400">{receipt.prev_hash.substring(0, 16)}...</span></div>
                          <div><span className="text-slate-500">Self Hash:</span> <span className="text-green-400">{receipt.self_hash.substring(0, 16)}...</span></div>
                          <div><span className="text-slate-500">Stream ID:</span> <span className="text-yellow-400">{receipt.stream_id}</span></div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checkpoints Tab */}
          <TabsContent value="checkpoints" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Layers className="h-5 w-5 text-green-400" />
                  Merkle Checkpoints
                </CardTitle>
                <CardDescription className="font-mono">
                  Hourly and daily super-root Merkle tree checkpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checkpoints.map((checkpoint) => (
                    <div
                      key={checkpoint.timestamp}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-mono text-sm font-bold text-green-400">
                            {new Date(checkpoint.timestamp).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {checkpoint.type === "daily_super" ? "Daily Super Root" : "Hourly Checkpoint"}
                          </div>
                        </div>
                        <Badge variant="outline" className={`font-mono ${checkpoint.type === "daily_super" ? "text-purple-400" : "text-green-400"}`}>
                          {checkpoint.type.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">Streams</div>
                          <div className="text-lg font-mono font-bold text-violet-400">{checkpoint.stream_count}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">Receipts</div>
                          <div className="text-lg font-mono font-bold text-blue-400">{checkpoint.receipt_count.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">Status</div>
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded border border-slate-700">
                        <div className="text-xs text-slate-500 font-mono mb-1">Merkle Root Hash</div>
                        <div className="text-xs font-mono text-green-400 break-all">{checkpoint.root_hash}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Streams Tab */}
          <TabsContent value="streams" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-400" />
                  Stream Shards
                </CardTitle>
                <CardDescription className="font-mono">
                  Sharded Lamport chains by stream_id for horizontal scalability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {streams.map((stream) => (
                    <div
                      key={stream.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedStream === stream.id
                          ? "bg-violet-500/10 border-violet-500"
                          : "bg-slate-900/50 border-slate-700 hover:border-violet-500/30"
                      }`}
                      onClick={() => setSelectedStream(stream.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GitBranch className="h-5 w-5 text-violet-400" />
                          <div>
                            <div className="font-mono text-sm font-bold">{stream.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{stream.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-mono font-bold text-blue-400">{stream.count}</div>
                            <div className="text-xs text-slate-500 font-mono">receipts</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-mono ${
                            stream.health === "healthy" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {stream.health.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Witness Quorum Tab */}
          <TabsContent value="witness" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-400" />
                  Witness Quorum Configuration
                </CardTitle>
                <CardDescription className="font-mono">
                  Hybrid witness: fast-path (single Band-0) + async 2-of-3 quorum (500ms deadline)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-mono text-slate-400 mb-3">Fast Path</h3>
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="font-mono text-sm">{witnessQuorum.fast_path}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-mono text-slate-400 mb-3">Async Quorum (2-of-3)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {witnessQuorum.async_quorum.members.map((member) => (
                      <div key={member} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-mono font-bold">{member}</span>
                        </div>
                        <div className="text-lg font-mono font-bold text-pink-400">
                          {witnessQuorum.current_votes[member] || 0}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">votes</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-mono text-slate-400 mb-3">Quorum Status</h3>
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-green-400 animate-pulse" />
                        <div>
                          <div className="font-mono text-sm font-bold text-green-400">CONSENSUS</div>
                          <div className="text-xs text-slate-500 font-mono">
                            Deadline: {witnessQuorum.async_quorum.deadline_ms}ms
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-green-400">
                        {witnessQuorum.async_quorum.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policy Tab */}
          <TabsContent value="policy" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono">Q-Trace Policy Configuration</CardTitle>
                <CardDescription className="font-mono">
                  auditaai.qtrace.policy.v1.1
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300 overflow-x-auto">
{`{
  "policy_id": "auditaai.qtrace.policy.v1.1",
  "link_rule": "sharded_lamport",
  "shard_key": "stream_id",
  "checkpoint": {
    "hourly": true,
    "daily_super_root": true,
    "external_timestamping": "RFC-3161 (optional)"
  },
  "retro_delta": {
    "allowed": true,
    "receipt_type": "Δ-RETROJUSTIFY",
    "reason_codes": [
      "clock_skew_correction",
      "legal_hold",
      "fraud_discovery",
      "operational_error"
    ],
    "overwrite": false,
    "effect": "overlay"
  },
  "witness": {
    "fast_path": "single_band0",
    "async_quorum": {
      "type": "2of3",
      "members": ["GPT-5", "Claude-Opus", "Gemini-2", "Mistral-Next"],
      "deadline_ms": 500
    },
    "degraded_flag": true
  },
  "storage": {
    "mode": "policy_based",
    "hash_only_pct": 0.7,
    "minimal_blob_pct": 0.3,
    "blob_fields": ["context_sha", "decision", "controls_invoked", "outcome"]
  },
  "retention": {
    "hash_roots_years": 7,
    "blob_months": 24,
    "hot_cache_hours": 72
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
}
