'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Sigma, Omega, TrendingUp, Calculator, Zap, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface TrackData {
  C: number;
  R: number;
  I: number;
  E: number;
  S: number;
  sigma: number;
  role?: string;
  description?: string;
}

interface TriTrackState {
  tracks: {
    A: TrackData;
    B: TrackData;
    C: TrackData;
  };
  weights: {
    wA: number;
    wB: number;
    wC: number;
  };
  sigma: number;
  omega: number;
  deltaClarity: number;
  sigmaStar: number;
  mathCanon: string;
  timestamp: string;
}

interface Conversation {
  conversationId: string;
  modelName: string;
  timestamp: string;
  sigma: number;
  lamport: number;
}

export default function MathCanonPage() {
  const [tritrackState, setTritrackState] = useState<TriTrackState | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string>('aggregate');

  const loadConversations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/conversations/aggregate');
      const data = await response.json();
      if (data.conversations && data.conversations.length > 0) {
        const convList = data.conversations.map((c: any) => ({
          conversationId: c.conversationId,
          modelName: c.modelName || 'Unknown',
          timestamp: c.timestamp,
          sigma: c.cries?.sigma || 0,
          lamport: c.lamport || 0
        }));
        setConversations(convList);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // Enterprise feature - backend required
      console.log('Enterprise feature: Backend required for conversation data');
    }
  };

  const loadTritrackState = async () => {
    try {
      const url = selectedConversation === 'aggregate' 
        ? 'http://localhost:3001/api/math-canon/tritrack-state'
        : `http://localhost:3001/api/math-canon/tritrack-state?conversationId=${selectedConversation}`;
      const response = await fetch(url);
      const data = await response.json();
      setTritrackState(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load Tri-Track state:', error);
      // Enterprise feature - backend required
      console.log('Enterprise feature: Backend required for Tri-Track state');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    loadTritrackState();
  }, []);

  useEffect(() => {
    loadTritrackState();
  }, [selectedConversation]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadConversations();
        loadTritrackState();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedConversation]);

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 0.9) return 'bg-green-500/20 border-green-500/30';
    if (score >= 0.7) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-900" />

      <div className="relative max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/lab" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              BACK TO LAB
            </Link>
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-orange-500/30 hover:bg-orange-500/10">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-mono text-sm">How to Use</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-slate-900 border-orange-500/30 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-mono text-orange-400">Math Canon Guide</SheetTitle>
                    <SheetDescription className="text-slate-400 font-mono">CRIES formulas from Rosetta.html vΩ.8</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6 text-sm">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">What is Math Canon?</h3>
                      <p className="text-slate-300 leading-relaxed">Math Canon vΩ.8 contains the canonical mathematical formulas for CRIES governance. These formulas (from Rosetta.html lines 444-445) define how sigma (σ), omega (Ω), and tri-track weights are calculated across the entire AuditaAI system.</p>
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                        <p className="text-xs text-blue-300 font-mono"><strong>Without Rosetta Boot (Baseline):</strong></p>
                        <p className="text-xs text-blue-200 font-mono ml-3">Track A = Track-A Analyzer monitoring LLM | Track B = Inactive | Track C = Core LLM</p>
                        <p className="text-xs text-green-300 font-mono"><strong>With Rosetta Boot (Governed):</strong></p>
                        <p className="text-xs text-green-200 font-mono ml-3">Track A = BEN Analyst (outputs CRIES) | Track B = AuditaAI Governance | Track C = Core LLM</p>
                        <p className="text-xs text-yellow-300 font-mono mt-2">Track C is always the core LLM. Comparison shows improvement with governance.</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Key Formulas</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-xs">
                        <li><strong>σ (Sigma):</strong> σ = √(C² + R² + I² + E² + S²) / √5</li>
                        <li><strong>Ω (Omega):</strong> Ω = wA·σA + wB·σB + wC·σC</li>
                        <li><strong>Δ Clarity:</strong> ΔΩ = Ωt - Ωt-1</li>
                        <li><strong>Weights:</strong> wA + wB + wC = 1.0</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">How to Use This Dashboard</h3>
                      <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li><strong>Select Session:</strong> Choose which conversation to track<p className="ml-6 text-sm text-slate-400">Dropdown shows active LLM sessions with model name and timestamp</p></li>
                        <li><strong>Track Sigma:</strong> View C, R, I, E, S scores for all 3 tracks<p className="ml-6 text-sm text-slate-400">Track A = BEN Analyst (if Rosetta booted) or Track-A Analyzer, Track B = AuditaAI Governance (if booted), Track C = Core LLM (always active)</p></li>
                        <li><strong>Composite Omega:</strong> Monitor weighted average across tracks<p className="ml-6 text-sm text-slate-400">Ω = wA·σA + wB·σB + wC·σC, where Ω &gt; 0.74 = passing governance threshold</p></li>
                        <li><strong>Compare Modes:</strong> See improvement with Rosetta boot<p className="ml-6 text-sm text-slate-400">Unbooted: Basic monitoring | Booted: Full governance stack</p></li>
                        <li><strong>Auto-Refresh:</strong> Toggle live updates every 3 seconds<p className="ml-6 text-sm text-slate-400">Watch real-time changes as selected session executes</p></li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Business Value</h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li><strong>Canonical Source:</strong> Single mathematical truth for all governance calculations</li>
                        <li><strong>Version Control:</strong> vΩ.8 ensures consistency across system updates</li>
                        <li><strong>Auditable:</strong> Every Ω/σ value traceable to canonical formulas</li>
                        <li><strong>Research Ready:</strong> Formula evolution tracked in Rosetta versions</li>
                      </ul>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Link href="/" className="text-gray-400 hover:text-white transition-colors font-mono text-sm">
                HOME
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-3">
                <Calculator className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-mono text-orange-400">MATH CANON vΩ.8</span>
              </div>
              <h1 className="text-4xl font-mono font-bold bg-gradient-to-r from-white via-orange-200 to-yellow-200 bg-clip-text text-transparent">
                Math Canon vΩ.8
              </h1>
              <p className="text-slate-300 text-sm mt-2 font-mono">
                Sigma/Omega calculations from Rosetta.html lines 444-445
              </p>
            </div>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-bold transition-all text-sm ${
                autoRefresh
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                  : 'bg-slate-500/20 border border-slate-500/30 text-slate-400 hover:bg-slate-500/30'
              }`}
            >
              {autoRefresh ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  LIVE UPDATE
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  PAUSED
                </>
              )}
            </button>
          </div>
        </div>

        {/* Session Selector */}
        <div className="bg-slate-800/50 rounded-xl border border-cyan-500/20 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-mono font-bold text-cyan-400 mb-2">SELECT CONVERSATION</h3>
              <p className="text-sm text-slate-400 font-mono">Choose which model session to analyze, or view aggregate</p>
            </div>
            <div className="text-sm text-slate-400 font-mono">
              {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="mt-4">
            <select
              value={selectedConversation}
              onChange={(e) => setSelectedConversation(e.target.value)}
              className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="aggregate">📊 Aggregate - All Conversations (Average CRIES)</option>
              {conversations.map((conv) => (
                <option key={conv.conversationId} value={conv.conversationId}>
                  🤖 {conv.modelName} • σ={conv.sigma.toFixed(3)} • L={conv.lamport} • {new Date(conv.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          {selectedConversation !== 'aggregate' && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 font-mono">
                ℹ️ Viewing single conversation. Track C shows raw LLM output, Track A shows BEN analysis, Track B shows governance layer (if Rosetta booted).
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-800/70 border border-orange-500/30 rounded-lg">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-orange-400 font-mono">Loading Math Canon state...</div>
            </div>
          </div>
        ) : !tritrackState ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-gradient-to-r from-slate-800/70 to-slate-900/70 border border-orange-500/30 rounded-xl p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-full flex items-center justify-center">
                <Calculator className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-mono font-bold text-white mb-2">Enterprise Backend Required</h3>
              <p className="text-slate-300 font-mono text-sm mb-4">
                Math Canon vΩ.8 visualization requires the AuditaAI backend server for real-time CRIES calculations and Tri-Track state.
              </p>
              <div className="text-xs text-slate-500 font-mono bg-slate-900/50 p-3 rounded border border-slate-600/50">
                <div className="font-semibold text-orange-400 mb-1">For Enterprise Deployments:</div>
                <div>• Deploy backend with Math Canon processing</div>
                <div>• Enable real-time CRIES calculations</div>
                <div>• Configure Tri-Track state monitoring</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sigma & Omega Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* Sigma (σ) */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Sigma className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-mono font-bold text-purple-400">Sigma (σ)</h2>
                    <p className="text-xs text-slate-300 font-mono">Governance Window</p>
                  </div>
                </div>
                
                <div className={`text-5xl font-mono font-bold mb-4 ${getScoreColor(tritrackState.sigma)}`}>
                  {tritrackState.sigma.toFixed(4)}
                </div>
                
                <div className="space-y-2 text-sm font-mono">
                  <div className="text-slate-300">
                    <span className="text-purple-400">Equation:</span> σᵗ = wA·σAᵗ + wB·σBᵗ + wC·σCᵗ
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div>
                      <span className="text-slate-400">wA:</span>{' '}
                      <span className="text-cyan-400">{tritrackState.weights.wA}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">wB:</span>{' '}
                      <span className="text-green-400">{tritrackState.weights.wB}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">wC:</span>{' '}
                      <span className="text-orange-400">{tritrackState.weights.wC}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Omega (Ω) */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-cyan-500/20">
                    <Omega className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-mono font-bold text-cyan-400">Omega (Ω)</h2>
                    <p className="text-xs text-slate-300 font-mono">Clarity/Alignment</p>
                  </div>
                </div>
                
                <div className={`text-5xl font-mono font-bold mb-4 ${getScoreColor(tritrackState.omega)}`}>
                  {tritrackState.omega.toFixed(4)}
                </div>
                
                <div className="space-y-2 text-sm font-mono">
                  <div className="text-slate-300">
                    <span className="text-cyan-400">Equation:</span> Ωᵗ₊₁ = Ωᵗ + η·Δclarity − γB·max(0, σᵗ − σ*)
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div>
                      <span className="text-slate-400">Δclarity:</span>{' '}
                      <span className="text-green-400">{tritrackState.deltaClarity.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">σ*:</span>{' '}
                      <span className="text-yellow-400">{tritrackState.sigmaStar.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tri-Track Breakdown */}
            <div className="bg-slate-800/50 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-mono font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  TRI-TRACK CRIES BREAKDOWN
                </h2>
                <p className="text-slate-400 text-sm mt-1 font-mono">
                  Individual track contributions to weighted Sigma
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Track-A (Analyst) */}
                <div className="border border-cyan-500/20 rounded-lg p-4 bg-cyan-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-mono font-bold text-cyan-400">
                        TRACK-A • {tritrackState.tracks.A.role}
                      </h3>
                      <p className="text-xs text-slate-300 font-mono mt-1">
                        {tritrackState.tracks.A.description}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${getScoreBg(tritrackState.tracks.A.sigma)}`}>
                      <div className="text-sm font-mono text-slate-400">σA</div>
                      <div className={`text-2xl font-mono font-bold ${getScoreColor(tritrackState.tracks.A.sigma)}`}>
                        {tritrackState.tracks.A.sigma.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {(['C', 'R', 'I', 'E', 'S'] as const).map(metric => (
                      <div key={metric} className="text-center">
                        <div className="text-xs text-slate-400 font-mono mb-1">{metric}</div>
                        <div className={`text-lg font-mono font-bold ${getScoreColor(tritrackState.tracks.A[metric])}`}>
                          {tritrackState.tracks.A[metric].toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Track-B (Governor) */}
                <div className="border border-green-500/20 rounded-lg p-4 bg-green-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-mono font-bold text-green-400">
                        TRACK-B • {tritrackState.tracks.B.role}
                      </h3>
                      <p className="text-xs text-slate-300 font-mono mt-1">
                        {tritrackState.tracks.B.description}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${getScoreBg(tritrackState.tracks.B.sigma)}`}>
                      <div className="text-sm font-mono text-slate-400">σB</div>
                      <div className={`text-2xl font-mono font-bold ${getScoreColor(tritrackState.tracks.B.sigma)}`}>
                        {tritrackState.tracks.B.sigma.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {(['C', 'R', 'I', 'E', 'S'] as const).map(metric => (
                      <div key={metric} className="text-center">
                        <div className="text-xs text-slate-400 font-mono mb-1">{metric}</div>
                        <div className={`text-lg font-mono font-bold ${getScoreColor(tritrackState.tracks.B[metric])}`}>
                          {tritrackState.tracks.B[metric].toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Track-C (Executor) */}
                <div className="border border-orange-500/20 rounded-lg p-4 bg-orange-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-mono font-bold text-orange-400">
                        TRACK-C • {tritrackState.tracks.C.role}
                      </h3>
                      <p className="text-xs text-slate-300 font-mono mt-1">
                        {tritrackState.tracks.C.description}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${getScoreBg(tritrackState.tracks.C.sigma)}`}>
                      <div className="text-sm font-mono text-slate-400">σC</div>
                      <div className={`text-2xl font-mono font-bold ${getScoreColor(tritrackState.tracks.C.sigma)}`}>
                        {tritrackState.tracks.C.sigma.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {(['C', 'R', 'I', 'E', 'S'] as const).map(metric => (
                      <div key={metric} className="text-center">
                        <div className="text-xs text-slate-400 font-mono mb-1">{metric}</div>
                        <div className={`text-lg font-mono font-bold ${getScoreColor(tritrackState.tracks.C[metric])}`}>
                          {tritrackState.tracks.C[metric].toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-lg font-mono font-bold text-purple-400 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                GOVERNANCE ARCHITECTURE FLOW
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Track C - Core LLM */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <div className="text-orange-400 font-mono font-bold mb-2">Track C: Core LLM</div>
                  <div className="text-xs text-slate-300 font-mono space-y-1">
                    <div>• Raw model output</div>
                    <div>• Baseline CRIES</div>
                    <div>• σC = {tritrackState.tracks.C.sigma.toFixed(4)}</div>
                    <div className="text-orange-300 mt-2">Always active</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <div className="text-slate-400 font-mono text-2xl">→</div>
                </div>

                {/* Track A - BEN Analyst */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="text-cyan-400 font-mono font-bold mb-2">Track A: BEN Analyst</div>
                  <div className="text-xs text-slate-300 font-mono space-y-1">
                    <div>• Analyzes Track C</div>
                    <div>• Outputs CRIES</div>
                    <div>• σA = {tritrackState.tracks.A.sigma.toFixed(4)}</div>
                    <div className="text-cyan-300 mt-2">+{((tritrackState.tracks.A.sigma - tritrackState.tracks.C.sigma) * 100).toFixed(1)}% improvement</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center col-span-1">
                  <div className="text-slate-400 font-mono text-2xl">→</div>
                </div>

                {/* Track B - Governance */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 md:col-span-2">
                  <div className="text-green-400 font-mono font-bold mb-2">Track B: AuditaAI Governance</div>
                  <div className="text-xs text-slate-300 font-mono space-y-1">
                    <div>• Applies policy & safety to Track A</div>
                    <div>• Full governance stack</div>
                    <div>• σB = {tritrackState.tracks.B.sigma.toFixed(4)}</div>
                    <div className="text-green-300 mt-2">
                      {tritrackState.tracks.B.sigma > 0 
                        ? `+${((tritrackState.tracks.B.sigma - tritrackState.tracks.A.sigma) * 100).toFixed(1)}% over Track A (Rosetta booted)`
                        : 'Inactive (Rosetta not booted)'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-400 font-mono text-center">
                σ (Sigma) = {tritrackState.weights.wA}·σA + {tritrackState.weights.wB}·σB + {tritrackState.weights.wC}·σC = {tritrackState.sigma.toFixed(4)}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm font-mono text-slate-300">
                  <p className="text-blue-400 font-bold mb-2">MATH CANON vΩ.8</p>
                  <p>
                    This page displays real-time Sigma and Omega calculations from the Rosetta Math Canon.
                    Sigma represents the weighted governance window across all three tracks (BEN Analyst, AuditaAI Governance, Core LLM).
                    Omega represents clarity/alignment, adjusted by learning rate and penalty factors.
                  </p>
                  <p className="mt-2">
                    <span className="text-blue-400">Source:</span> Rosetta.html lines 444-445 • 
                    <span className="text-blue-400 ml-2">Weights:</span> wA={tritrackState.weights.wA}, wB={tritrackState.weights.wB}, wC={tritrackState.weights.wC} • 
                    <span className="text-blue-400 ml-2">Updated:</span> {new Date(tritrackState.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 font-mono">Failed to load Math Canon state</p>
          </div>
        )}
      </div>
    </div>
  );
}
