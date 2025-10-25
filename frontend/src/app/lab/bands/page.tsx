"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Layers, CheckCircle2, Lock, Zap, Code, Database, Network, AlertTriangle, HelpCircle, Home } from "lucide-react";
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

interface Band {
  id: number;
  name: string;
  role: string;
  capabilities: string[];
  artifacts: string;
  status: "active" | "research" | "planned";
  description: string;
}

export default function BandsPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [selectedBand, setSelectedBand] = useState<number>(0);
  const [bands, setBands] = useState<Band[]>([]);
  const [currentBand, setCurrentBand] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real band configuration from backend
  useEffect(() => {
    const fetchBandsData = async () => {
      try {
        setLoading(true);
        
  const response = await fetch(`${BACKEND_URL ?? ''}/api/governance/bands`);
        if (!response.ok) throw new Error('Failed to fetch bands configuration');
        const data = await response.json();
        
        setBands(data.bands || []);
        setCurrentBand(data.current_band || "0");
        setError(null);
      } catch (err) {
        console.error('Failed to load bands data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Fallback to default bands
        setBands(getDefaultBands());
      } finally {
        setLoading(false);
      }
    };
    
    fetchBandsData();
    const interval = setInterval(fetchBandsData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Fallback default bands
  function getDefaultBands(): Band[] {
    return [
    {
      id: 0,
      name: "Band-0",
      role: "Core Automations",
      capabilities: ["Checkpoint", "Hash-Verify", "Log-Rotate", "Schedule", "Self-Audit"],
      artifacts: "Declarative blocks (scriptless)",
      status: "active",
      description: "Foundation layer with scriptless declarative governance. Pure data-driven receipts, no executable code. Band-0 receipts are the source of truth."
    },
    {
      id: 1,
      name: "Band-1",
      role: "Adaptive Governance",
      capabilities: ["Advisors", "Temporal (TGL)", "Causal (CAG)", "Symbolic-Neural"],
      artifacts: "auditaai_band1_*.py",
      status: "active",
      description: "Learning layer with offline batch advisors. Proposes bounded policy updates based on temporal decay, causal graphs, and symbolic reasoning."
    },
    {
      id: 2,
      name: "Band-2",
      role: "Meta-Governance",
      capabilities: ["Q-Trace", "Meta-Update", "Reflective Feedback", "Sharded Lamport"],
      artifacts: "auditaai_band2_*.py",
      status: "active",
      description: "Meta-governance with Q-Trace causal provenance engine. Sharded Lamport chains, Merkle checkpoints, and witness consensus for governance maturity >98%."
    },
    {
      id: 5,
      name: "Band-5",
      role: "Cross-Model Witness",
      capabilities: ["Multi-LLM Consensus", "Claim/Verify", "Divergence Detection", "Quorum Voting"],
      artifacts: "CMW receipts v3.21-v3.23",
      status: "research",
      description: "Cross-Model Witness (CMW) with GPT-5, Claude-Opus, Gemini-2, Mistral-Next. 2-of-3 async quorum for distributed verification."
    },
    {
      id: 8,
      name: "Band-8",
      role: "Audit Mesh (AMESH)",
      capabilities: ["Peer Announce", "Mesh Exchange", "Consensus/Divergence", "Two-Peer Rehearsal"],
      artifacts: "Mesh receipts v3.33-v3.36",
      status: "research",
      description: "Distributed audit mesh for peer-to-peer governance. Offline self-contained two-peer rehearsal with mesh consensus protocols."
    },
    {
      id: 10,
      name: "Band-10",
      role: "Crypto & Replay",
      capabilities: ["Cryptographic Signing", "Replay Audit", "Temporal Verification", "Legal Hold"],
      artifacts: "Crypto receipts + replay logs",
      status: "planned",
      description: "Cryptographic layer with RFC-3161 timestamping, digital signatures, and complete replay audit trails for legal compliance."
    },
    {
      id: 90,
      name: "Band-Z",
      role: "Audit Kernel",
      capabilities: ["Legal Lock", "Compliance Gate", "Regulatory Freeze", "Immutable Archive"],
      artifacts: "Band-Z kernel receipts",
      status: "research",
      description: "Final audit kernel with legal lock capabilities. Immutable governance freeze for regulatory compliance and litigation hold."
    }
    ];
  }

  const stackLayers = [
    { name: "Application Layer", bands: [0], color: "from-cyan-500 to-blue-500" },
    { name: "Learning Layer", bands: [1], color: "from-purple-500 to-pink-500" },
    { name: "Meta-Governance", bands: [2], color: "from-violet-500 to-purple-500" },
    { name: "Distributed Systems", bands: [5, 8], color: "from-orange-500 to-red-500" },
    { name: "Security & Compliance", bands: [10, 90], color: "from-green-500 to-emerald-500" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "research": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "planned": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getBandColor = (id: number) => {
    if (id === 0) return "from-cyan-500 to-blue-500";
    if (id === 1) return "from-purple-500 to-pink-500";
    if (id === 2) return "from-violet-500 to-purple-500";
    if (id === 5) return "from-pink-500 to-rose-500";
    if (id === 8) return "from-lime-500 to-green-500";
    if (id === 10) return "from-amber-500 to-orange-500";
    if (id === 90) return "from-red-500 to-rose-500";
    return "from-slate-500 to-slate-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="container mx-auto px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/lab" className="flex items-center space-x-3">
              <Shield className="h-7 w-7 text-amber-400" />
              <span className="text-xl font-mono font-bold">
                Audit<span className="text-amber-400">a</span>AI Lab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/lab"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-amber-500/30 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-mono text-sm">Back to Lab</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-amber-500/30 transition-all"
              >
                <Home className="h-4 w-4" />
                <span className="font-mono text-sm">Home</span>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 hover:bg-amber-500/10">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-mono text-sm">How to Use</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-amber-500/30 overflow-y-auto max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-mono text-amber-400">Bands Station Guide</DialogTitle>
                    <DialogDescription className="text-slate-400 font-mono">
                      Layered governance architecture from Band-0 to Band-Z
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-6 space-y-6 text-sm">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">What are Bands?</h3>
                      <p className="text-slate-300 leading-relaxed">
                        Bands are AuditaAI's layered governance architecture. Each band (0-Z) represents a different level of automation, trust, and capability. Lower bands (0-2) handle core infrastructure, mid bands (3-5) manage policy and consensus, upper bands (6-Z) enable research and experimentation.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Key Features</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><strong>Band-0:</strong> Scriptless declarative blocks (checkpoint, verify, log-rotate)</li>
                        <li><strong>Band-1:</strong> CRIES runtime with sigma/epsilon gates</li>
                        <li><strong>Band-2:</strong> Q-Trace causal provenance chains</li>
                        <li><strong>Band-3:</strong> Policy fields and risk quantification (ERL)</li>
                        <li><strong>Band-5:</strong> Cross-model witness and consensus</li>
                        <li><strong>Band-Z:</strong> Experimental features and sandbox</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">How to Use This Dashboard</h3>
                      <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li>
                          <strong>Band Explorer:</strong> Click each band to see capabilities and artifacts
                          <p className="ml-6 text-sm text-slate-400">Active bands show green status, research bands show yellow</p>
                        </li>
                        <li>
                          <strong>Capability Matrix:</strong> Review what each band can and cannot do
                          <p className="ml-6 text-sm text-slate-400">Lower bands = more restricted, higher bands = more flexible</p>
                        </li>
                        <li>
                          <strong>Artifact Types:</strong> Understand governance outputs per band
                          <p className="ml-6 text-sm text-slate-400">Declarative blocks → Receipts → Policies → Experiments</p>
                        </li>
                        <li>
                          <strong>Status Tracking:</strong> Monitor which bands are production-ready
                          <p className="ml-6 text-sm text-slate-400">Active = deployed, Research = testing, Planned = roadmap</p>
                        </li>
                      </ol>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Business Value for Investors</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><strong>Scalable Architecture:</strong> Add new capabilities without breaking existing systems</li>
                        <li><strong>Clear Separation:</strong> Critical infrastructure (Band-0) isolated from experiments (Band-Z)</li>
                        <li><strong>Progressive Trust:</strong> Lower bands require higher verification, upper bands allow innovation</li>
                        <li><strong>Regulatory Mapping:</strong> Each band maps to specific compliance requirements</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Band Hierarchy</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Band-0</Badge>
                          <span className="text-slate-300">Core automations (scriptless)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Band-1</Badge>
                          <span className="text-slate-300">CRIES runtime governance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Band-2</Badge>
                          <span className="text-slate-300">Q-Trace provenance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Band-3+</Badge>
                          <span className="text-slate-300">Policy, risk, witness, research</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center space-x-1 text-sm font-mono">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400">BANDS ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-mono font-bold">Band Architecture</h1>
              <p className="text-slate-400 font-mono text-sm">0-Z Governance Stack</p>
            </div>
          </div>
          <p className="text-slate-300 font-mono text-sm max-w-3xl">
            Hierarchical governance architecture from Band-0 (Core) through Band-Z (Audit Kernel). 
            Each band adds capabilities while maintaining immutability of lower bands.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 font-mono text-sm">Loading band configuration from governance state...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-yellow-900/20 border-yellow-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Using Fallback Configuration
              </CardTitle>
              <CardDescription className="text-yellow-300/70">
                {error} - Displaying default band architecture.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Data View */}
        {!loading && (
          <>
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Total Bands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-amber-400">7</div>
              <p className="text-xs text-slate-500 font-mono mt-1">0, 1, 2, 5, 8, 10, Z</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Active Bands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-green-400">3</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Bands 0, 1, 2</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Research</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-yellow-400">3</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Bands 5, 8, Z</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-slate-400">Planned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-blue-400">1</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Band-10</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stack" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-600">
            <TabsTrigger value="stack" className="font-mono">Stack View</TabsTrigger>
            <TabsTrigger value="bands" className="font-mono">Band Details</TabsTrigger>
            <TabsTrigger value="flows" className="font-mono">Data Flows</TabsTrigger>
            <TabsTrigger value="spec" className="font-mono">Specification</TabsTrigger>
          </TabsList>

          {/* Stack View Tab */}
          <TabsContent value="stack" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-400" />
                  Governance Stack Layers
                </CardTitle>
                <CardDescription className="font-mono">
                  Hierarchical architecture with capability isolation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stackLayers.reverse().map((layer, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-sm font-bold text-slate-300">{layer.name}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {layer.bands.length} band{layer.bands.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {layer.bands.map((bandId) => {
                        const band = bands.find(b => b.id === bandId);
                        if (!band) return null;
                        return (
                          <div
                            key={band.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedBand === band.id
                                ? "bg-amber-500/10 border-amber-500"
                                : "bg-slate-900/50 border-slate-700 hover:border-amber-500/30"
                            }`}
                            onClick={() => setSelectedBand(band.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getBandColor(band.id)}`}>
                                <span className="text-white font-mono text-sm font-bold">{band.name}</span>
                              </div>
                              <Badge className={`font-mono text-xs border ${getStatusColor(band.status)}`}>
                                {band.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs font-mono text-slate-400 mb-1">{band.role}</div>
                            <div className="text-xs font-mono text-slate-500">{band.artifacts}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Band Details Tab */}
          <TabsContent value="bands" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {bands.map((band) => (
                <Card
                  key={band.id}
                  className={`bg-slate-800/50 border cursor-pointer transition-all ${
                    selectedBand === band.id
                      ? "border-amber-500 shadow-lg shadow-amber-500/20"
                      : "border-slate-600 hover:border-amber-500/30"
                  }`}
                  onClick={() => setSelectedBand(band.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getBandColor(band.id)}`}>
                        <span className="text-white font-mono text-lg font-bold">{band.name}</span>
                      </div>
                      <Badge className={`font-mono text-xs border ${getStatusColor(band.status)}`}>
                        {band.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardTitle className="font-mono text-xl">{band.role}</CardTitle>
                    <CardDescription className="font-mono text-sm">
                      {band.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-2">Capabilities</div>
                      <div className="flex flex-wrap gap-2">
                        {band.capabilities.map((cap) => (
                          <Badge key={cap} variant="secondary" className="font-mono text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-700">
                      <div className="text-xs text-slate-500 font-mono mb-1">Artifacts</div>
                      <div className="text-sm font-mono text-amber-400">{band.artifacts}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Data Flows Tab */}
          <TabsContent value="flows" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Network className="h-5 w-5 text-blue-400" />
                  Inter-Band Data Flows
                </CardTitle>
                <CardDescription className="font-mono">
                  How data and receipts flow between bands
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-mono text-sm font-bold">
                      Band-0
                    </div>
                    <span className="text-slate-400 font-mono">→</span>
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono text-sm font-bold">
                      Band-1
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    Band-0 receipts feed into Band-1 advisors for offline learning. 
                    Band-1 proposes policy updates as new Band-0 receipts (Δ-TRUST-UPDATE, Δ-POLICY-TUNE).
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-mono text-sm font-bold">
                      Band-0
                    </div>
                    <span className="text-slate-400 font-mono">→</span>
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-violet-500 to-purple-500 text-white font-mono text-sm font-bold">
                      Band-2
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    Band-2 Q-Trace ingests Band-0 events for causal provenance tracking. 
                    Sharded Lamport chains with Merkle checkpoints ensure governance maturity.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-violet-500 to-purple-500 text-white font-mono text-sm font-bold">
                      Band-2
                    </div>
                    <span className="text-slate-400 font-mono">⇄</span>
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-pink-500 to-rose-500 text-white font-mono text-sm font-bold">
                      Band-5
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    Band-5 CMW provides witness consensus for Band-2 Q-Trace receipts. 
                    2-of-3 quorum across GPT-5, Claude, Gemini, Mistral validates governance decisions.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-pink-500 to-rose-500 text-white font-mono text-sm font-bold">
                      Band-5
                    </div>
                    <span className="text-slate-400 font-mono">⇄</span>
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-lime-500 to-green-500 text-white font-mono text-sm font-bold">
                      Band-8
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    Band-8 AMESH extends witness consensus to distributed mesh topology. 
                    Peer announce/exchange enables offline two-peer rehearsal with eventual consistency.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-slate-400 font-mono text-sm">All Bands</span>
                    <span className="text-slate-400 font-mono">→</span>
                    <div className="px-3 py-1 rounded bg-gradient-to-r from-red-500 to-rose-500 text-white font-mono text-sm font-bold">
                      Band-Z
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    Band-Z Audit Kernel provides legal lock and immutable archive for all bands. 
                    Regulatory freeze capability for compliance and litigation hold.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specification Tab */}
          <TabsContent value="spec" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="font-mono">Band Architecture Specification</CardTitle>
                <CardDescription className="font-mono">
                  System Stack Map from Rosetta Monolith
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300 overflow-x-auto">
{`# System Stack Map — Bands 0–Z

┌─────────────────────────────────────────────────────────────┐
│ Band-Z — Audit Kernel (Legal Lock)                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Band-10 — Crypto & Replay Audit Layer                  │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Band-8 — Audit Mesh (AMESH)                        │ │ │
│ │ │ ┌─────────────────────────────────────────────────┐ │ │ │
│ │ │ │ Band-5 — Cross-Model Witness (CMW)             │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ Band-2 — Meta-Governance (Q-Trace)         │ │ │ │ │
│ │ │ │ │ ┌─────────────────────────────────────────┐ │ │ │ │ │
│ │ │ │ │ │ Band-1 — Adaptive Governance           │ │ │ │ │ │
│ │ │ │ │ │ ┌─────────────────────────────────────┐ │ │ │ │ │ │
│ │ │ │ │ │ │ Band-0 — Core Automations          │ │ │ │ │ │ │
│ │ │ │ │ │ │  • Checkpoint                      │ │ │ │ │ │ │
│ │ │ │ │ │ │  • Hash-Verify                     │ │ │ │ │ │ │
│ │ │ │ │ │ │  • Log-Rotate                      │ │ │ │ │ │ │
│ │ │ │ │ │ │  • Schedule                        │ │ │ │ │ │ │
│ │ │ │ │ │ │  • Self-Audit                      │ │ │ │ │ │ │
│ │ │ │ │ │ └─────────────────────────────────────┘ │ │ │ │ │ │
│ │ │ │ │ │  Artifacts: Declarative blocks         │ │ │ │ │ │
│ │ │ │ │ └─────────────────────────────────────────┘ │ │ │ │ │
│ │ │ │ │  Advisors: Temporal • Causal • Symbolic    │ │ │ │ │
│ │ │ │ │  Artifacts: auditaai_band1_*.py            │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────┘ │ │ │ │
│ │ │ │  Q-Trace: Sharded Lamport • Merkle            │ │ │ │
│ │ │ │  Artifacts: auditaai_band2_*.py               │ │ │ │
│ │ │ └─────────────────────────────────────────────────┘ │ │ │
│ │ │  CMW: Multi-LLM Consensus • 2-of-3 Quorum        │ │ │
│ │ │  Receipts: v3.21-v3.23                           │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │  AMESH: Peer-to-Peer • Mesh Consensus               │ │
│ │  Receipts: v3.33-v3.36                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│  Crypto: RFC-3161 • Digital Signatures                   │
│  Receipts: Crypto + Replay logs                          │
└─────────────────────────────────────────────────────────────┘
 Audit Kernel: Legal Lock • Compliance Gate
 Receipts: Band-Z kernel receipts

═══════════════════════════════════════════════════════════════
 DESIGN PRINCIPLES
═══════════════════════════════════════════════════════════════

1. Immutability: Lower bands cannot be modified by higher bands
2. Capability Isolation: Each band adds new capabilities
3. Data Flow: Upward propagation, downward immutability
4. Receipt Chain: All bands emit Lamport-ordered receipts
5. Witness Consensus: Multi-layer verification (Bands 2, 5, 8)
6. Legal Lock: Band-Z provides ultimate governance freeze

═══════════════════════════════════════════════════════════════
 BAND STATUS
═══════════════════════════════════════════════════════════════

ACTIVE:    Bands 0, 1, 2 (Production)
RESEARCH:  Bands 5, 8, Z (Prototype)
PLANNED:   Band-10 (Specification)
`}
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
