'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Clock, CheckCircle2, AlertTriangle, 
  RefreshCw, Terminal, FileCode, ArrowLeft, Key, Lock, 
  Crown, Zap, TrendingUp, ChevronDown, Play, Pause, 
  Download, BarChart3, List, GitBranch, Filter
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';

// ============ TYPES ============

interface Receipt {
  id: number;
  type: string;
  lamport: number;
  timestamp: string;
  witness: string;
  band: string;
  digest: string;
  prev_digest: string | null;
  session_id: string;
  run_id: string;
  source: string;
  cries: {
    C: number;
    R: number;
    I: number;
    E: number;
    S: number;
    Omega: number;
  } | null;
  payload: any;
}

interface PilotRunResult {
  success: boolean;
  response: string;
  cries: {
    C: number;
    R: number;
    I: number;
    E: number;
    S: number;
    Omega: number;
  };
  receipts: Array<{
    id: number;
    type: string;
    lamport: number;
    digest: string;
    timestamp: string;
  }>;
  executionTime: number;
}

// ============ MAIN COMPONENT ============

export default function PilotPageNew() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const router = useRouter();
  const { data: session } = useSession();
  const { profile, isLoading: profileLoading, isFree, isPaid, isArchitect } = useUser();

  // Session state
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  
  // Prompt input state
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [useGovernance, setUseGovernance] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  
  // Results state
  const [currentResult, setCurrentResult] = useState<PilotRunResult | null>(null);
  const [runHistory, setRunHistory] = useState<PilotRunResult[]>([]);
  
  // Receipts state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [receiptFilter, setReceiptFilter] = useState<'session' | 'all' | 'lab'>('session');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'testing' | 'receipts' | 'timeline' | 'analytics'>('testing');
  const [isPaused, setIsPaused] = useState(false);
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // ============ EFFECTS ============

  // Setup WebSocket for real-time receipt updates
  useEffect(() => {
    const ws = new WebSocket(BACKEND_URL.replace('http', 'ws'));
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected for live receipts');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'receipt-generated' && data.sessionId === sessionId) {
          const newReceipt: Receipt = data.receipt;
          
          if (isPaused) {
            // Queue receipts while paused
            setPendingReceipts(prev => [...prev, newReceipt]);
          } else {
            // Add immediately
            setReceipts(prev => [newReceipt, ...prev]);
          }
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [BACKEND_URL, sessionId, isPaused]);

  // Load initial receipts
  useEffect(() => {
    loadReceipts();
  }, [receiptFilter]);

  // Filter receipts based on active filter
  useEffect(() => {
    let filtered = [...receipts];
    
    if (receiptFilter === 'session') {
      filtered = filtered.filter(r => r.session_id === sessionId);
    } else if (receiptFilter === 'lab') {
      filtered = filtered.filter(r => r.source === 'lab');
    }
    
    setFilteredReceipts(filtered);
  }, [receipts, receiptFilter, sessionId]);

  // ============ FUNCTIONS ============

  const loadReceipts = async () => {
    try {
      const params = new URLSearchParams();
      if (receiptFilter === 'session') params.set('sessionId', sessionId);
      if (receiptFilter === 'lab') params.set('source', 'lab');
      
      const response = await fetch(`${BACKEND_URL}/api/pilot/receipts?${params}`);
      const data = await response.json();
      
      if (data.receipts) {
        setReceipts(data.receipts);
      }
    } catch (error) {
      console.error('Failed to load receipts:', error);
    }
  };

  const runPrompt = async () => {
    if (!prompt.trim() || isRunning) return;
    
    setIsRunning(true);
    const runId = `run-${Date.now()}`;
    setCurrentRunId(runId);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/pilot/run-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          useGovernance,
          sessionId,
          runId
        })
      });
      
      const result: PilotRunResult = await response.json();
      
      if (result.success) {
        setCurrentResult(result);
        setRunHistory(prev => [result, ...prev]);
        
        // Receipts will come via WebSocket
        console.log(`✅ Run complete: ${result.receipts.length} receipts generated`);
      } else {
        console.error('Run failed:', result);
      }
    } catch (error) {
      console.error('Error running prompt:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const togglePause = () => {
    if (isPaused) {
      // Resume: flush pending receipts
      setReceipts(prev => [...pendingReceipts, ...prev]);
      setPendingReceipts([]);
    }
    setIsPaused(!isPaused);
  };

  const exportReceipts = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/pilot/export-receipts?sessionId=${sessionId}&format=json`
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts-${sessionId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const verifyChain = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pilot/verify-chain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      const result = await response.json();
      
      alert(
        result.valid
          ? `✅ Chain Verified!\n\nTotal: ${result.totalReceipts}\nValid: ${result.validReceipts}\nMerkle Seals: ${result.merkleSealsValid}`
          : `❌ Chain Invalid\n\nIssues: ${result.issues.length}\n${result.issues.map((i: any) => i.message).join('\n')}`
      );
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  // ============ RENDER HELPERS ============

  const renderPromptEditor = () => (
    <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-bold font-mono text-white mb-4 flex items-center gap-2">
        <Terminal className="w-5 h-5 text-cyan-400" />
        Prompt Editor
      </h3>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt here..."
        className="w-full h-32 bg-slate-950 border border-white/20 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 resize-none"
      />
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 font-mono mb-2 block">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-slate-950 border border-white/20 rounded-lg p-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          </select>
        </div>
        
        <div>
          <label className="text-sm text-slate-400 font-mono mb-2 block">Governance</label>
          <button
            onClick={() => setUseGovernance(!useGovernance)}
            className={`w-full p-2 rounded-lg font-mono text-sm transition-all ${
              useGovernance
                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                : 'bg-slate-950 border border-white/20 text-slate-400'
            }`}
          >
            {useGovernance ? '✓ Enabled' : '✗ Disabled'}
          </button>
        </div>
      </div>
      
      <button
        onClick={runPrompt}
        disabled={isRunning || !prompt.trim()}
        className="mt-4 w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-mono font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        {isRunning ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Run Prompt
          </>
        )}
      </button>
    </div>
  );

  const renderResults = () => {
    if (!currentResult) {
      return (
        <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6 text-center">
          <p className="text-slate-400 font-mono text-sm">
            No results yet. Run a prompt to see output.
          </p>
        </div>
      );
    }
    
    return (
      <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Response
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {currentResult.executionTime}ms
          </span>
        </div>
        
        <div className="bg-slate-950 border border-white/10 rounded-lg p-4 mb-4">
          <p className="text-slate-300 font-mono text-sm whitespace-pre-wrap">
            {currentResult.response}
          </p>
        </div>
        
        {currentResult.cries && (
          <div className="bg-slate-950 border border-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold font-mono text-cyan-400 mb-2">CRIES Metrics</h4>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(currentResult.cries).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-slate-500 font-mono">{key}</div>
                  <div className="text-lg font-bold font-mono text-white">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReceiptsPanel = () => (
    <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Live Receipts
          {pendingReceipts.length > 0 && (
            <span className="bg-orange-500/20 text-orange-300 text-xs font-mono px-2 py-1 rounded">
              {pendingReceipts.length} pending
            </span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className={`p-2 rounded-lg font-mono text-sm transition-all ${
              isPaused
                ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                : 'bg-slate-950 border border-white/20 text-slate-400 hover:border-cyan-500'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          
          <button
            onClick={exportReceipts}
            className="p-2 bg-slate-950 border border-white/20 rounded-lg text-slate-400 hover:border-cyan-500 transition-all"
            title="Export Receipts"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={verifyChain}
            className="p-2 bg-slate-950 border border-white/20 rounded-lg text-slate-400 hover:border-green-500 transition-all"
            title="Verify Chain"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['session', 'all', 'lab'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setReceiptFilter(filter)}
            className={`px-3 py-1 rounded font-mono text-xs transition-all ${
              receiptFilter === filter
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-slate-950 text-slate-400 border border-white/10 hover:border-white/20'
            }`}
          >
            {filter === 'session' ? 'Current Session' : filter === 'all' ? 'All Receipts' : 'Lab Examples'}
          </button>
        ))}
      </div>
      
      {/* Receipts list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredReceipts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-sm">
            No receipts yet
          </div>
        ) : (
          filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-slate-950 border border-white/10 rounded-lg p-3 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-cyan-400">
                  {receipt.type}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  λ={receipt.lamport}
                </span>
              </div>
              
              <div className="text-xs text-slate-400 font-mono mb-1">
                Digest: {receipt.digest.substring(0, 16)}...
              </div>
              
              {receipt.cries && (
                <div className="flex gap-2 text-xs font-mono">
                  <span className="text-slate-500">Ω={receipt.cries.Omega.toFixed(2)}</span>
                  <span className="text-slate-500">C={receipt.cries.C.toFixed(1)}</span>
                  <span className="text-slate-500">R={receipt.cries.R.toFixed(1)}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTimelineView = () => (
    <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-bold font-mono text-white mb-4 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-cyan-400" />
        Receipt Timeline
      </h3>
      
      <div className="relative space-y-4">
        {filteredReceipts.map((receipt, index) => (
          <div key={receipt.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${
                receipt.type === 'Δ-ANALYSIS' ? 'bg-cyan-500' :
                receipt.type === 'Δ-GOVERNANCE' ? 'bg-green-500' :
                receipt.type === 'Δ-EXECUTION' ? 'bg-purple-500' :
                'bg-orange-500'
              }`} />
              {index < filteredReceipts.length - 1 && (
                <div className="w-0.5 h-full bg-white/10 flex-1 my-1" />
              )}
            </div>
            
            {/* Receipt card */}
            <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold font-mono text-white">
                  {receipt.type}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(receipt.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="text-xs text-slate-400 font-mono space-y-1">
                <div>Lamport: {receipt.lamport}</div>
                <div>Witness: {receipt.witness}</div>
                <div>Digest: {receipt.digest.substring(0, 32)}...</div>
                {receipt.prev_digest && (
                  <div>Prev: {receipt.prev_digest.substring(0, 32)}...</div>
                )}
              </div>
              
              {receipt.cries && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-mono text-slate-500">
                    CRIES: Ω={receipt.cries.Omega.toFixed(2)} | 
                    C={receipt.cries.C.toFixed(1)} | 
                    R={receipt.cries.R.toFixed(1)} | 
                    I={receipt.cries.I.toFixed(1)} | 
                    E={receipt.cries.E.toFixed(1)} | 
                    S={receipt.cries.S.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => {
    const analysisReceipts = filteredReceipts.filter(r => r.type === 'Δ-ANALYSIS' && r.cries);
    
    if (analysisReceipts.length === 0) {
      return (
        <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-mono text-sm">
            No CRIES data yet. Run some prompts to see analytics.
          </p>
        </div>
      );
    }
    
    const avgCRIES = analysisReceipts.reduce((acc, r) => {
      if (!r.cries) return acc;
      return {
        C: acc.C + r.cries.C,
        R: acc.R + r.cries.R,
        I: acc.I + r.cries.I,
        E: acc.E + r.cries.E,
        S: acc.S + r.cries.S,
        Omega: acc.Omega + r.cries.Omega
      };
    }, { C: 0, R: 0, I: 0, E: 0, S: 0, Omega: 0 });
    
    Object.keys(avgCRIES).forEach(key => {
      avgCRIES[key as keyof typeof avgCRIES] /= analysisReceipts.length;
    });
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Session Analytics
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-950 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-slate-500 font-mono mb-1">Total Runs</div>
              <div className="text-2xl font-bold font-mono text-white">{analysisReceipts.length}</div>
            </div>
            
            <div className="bg-slate-950 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-slate-500 font-mono mb-1">Avg Ω Score</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {avgCRIES.Omega.toFixed(2)}
              </div>
            </div>
          </div>
          
          <h4 className="text-sm font-bold font-mono text-white mb-3">Average CRIES Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(avgCRIES).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-16">{key}</span>
                <div className="flex-1 bg-slate-950 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full"
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-white w-12 text-right">
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-white mb-4">Recent Runs</h3>
          
          <div className="space-y-2">
            {analysisReceipts.slice(0, 5).map((receipt, index) => (
              <div
                key={receipt.id}
                className="bg-slate-950 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-slate-500 font-mono">
                    Run #{analysisReceipts.length - index}
                  </div>
                  <div className="text-sm font-mono text-white">
                    {new Date(receipt.timestamp).toLocaleString()}
                  </div>
                </div>
                
                {receipt.cries && (
                  <div className="text-lg font-bold font-mono text-cyan-400">
                    Ω={receipt.cries.Omega.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============ MAIN RENDER ============

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-cyan-400" />
                Pilot Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 font-mono">
                Session: {sessionId.substring(0, 12)}...
              </span>
              {profile && (
                <span className={`px-3 py-1 rounded font-mono text-xs ${
                  isFree ? 'bg-slate-800 text-slate-400' :
                  isPaid ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' :
                  'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                }`}>
                  {profile.tier?.toUpperCase() || 'FREE'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-slate-950/30">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'testing', label: 'Testing', icon: Terminal },
              { id: 'receipts', label: 'Receipts', icon: Shield },
              { id: 'timeline', label: 'Timeline', icon: GitBranch },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 font-mono text-sm transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-cyan-500 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'testing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Prompt Editor */}
            <div className="space-y-6">
              {renderPromptEditor()}
            </div>
            
            {/* Right: Results + Live Receipts */}
            <div className="space-y-6">
              {renderResults()}
              {renderReceiptsPanel()}
            </div>
          </div>
        )}
        
        {activeTab === 'receipts' && (
          <div className="max-w-4xl mx-auto">
            {renderReceiptsPanel()}
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto">
            {renderTimelineView()}
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="max-w-4xl mx-auto">
            {renderAnalytics()}
          </div>
        )}
      </main>
    </div>
  );
}
