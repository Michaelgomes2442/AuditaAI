'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Clock, CheckCircle2, AlertTriangle, 
  RefreshCw, Terminal, FileCode, ArrowLeft, Key, Lock, 
  Crown, Zap, TrendingUp, ChevronDown, Play, Pause, 
  Download, BarChart3, List, GitBranch, Filter, GitCompare, Database
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { io, Socket } from 'socket.io-client';

// ============ TYPES ============

interface Receipt {
  id: number;
  lamport: number;
  timestamp: string;
  currDigest: string;
  prevDigest: string | null;
  conversationId?: string;
  traceId?: string;
  persona: string;
  model?: string;
  criesCoherence?: number;
  criesRigor?: number;
  criesIntegrity?: number;
  criesEmpathy?: number;
  criesStrictness?: number;
  criesOmega?: number;
  promptHash?: string;
  outputHash?: string;
  prompt?: string;
  output?: string;
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
    lamport: number;
    currDigest: string;
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
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [useGovernance, setUseGovernance] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  
  // API Keys state
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  // Results state
  const [currentResult, setCurrentResult] = useState<PilotRunResult | null>(null);
  const [runHistory, setRunHistory] = useState<PilotRunResult[]>([]);
  
  // Parallel comparison state
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  
  // Receipts state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [receiptFilter, setReceiptFilter] = useState<'session' | 'all' | 'lab'>('session');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'testing' | 'receipts' | 'timeline' | 'analytics'>('testing');
  const [isPaused, setIsPaused] = useState(false);
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
  
  // WebSocket ref
  const socketRef = useRef<Socket | null>(null);

  // ============ EFFECTS ============

  // Load API keys from localStorage
  useEffect(() => {
    const savedOpenAI = localStorage.getItem('openaiApiKey');
    const savedAnthropic = localStorage.getItem('anthropicApiKey');
    if (savedOpenAI) setOpenaiApiKey(savedOpenAI);
    if (savedAnthropic) setAnthropicApiKey(savedAnthropic);
  }, []);

  // Save API keys to localStorage
  useEffect(() => {
    if (openaiApiKey) localStorage.setItem('openaiApiKey', openaiApiKey);
  }, [openaiApiKey]);

  useEffect(() => {
    if (anthropicApiKey) localStorage.setItem('anthropicApiKey', anthropicApiKey);
  }, [anthropicApiKey]);

  // Setup Socket.IO for real-time receipt updates
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected for live receipts');
    });
    
    socket.on('receipt-generated', (data) => {
      try {
        // Backend emits: { sessionId, runId, receipts: [...] }
        const { sessionId: msgSessionId, receipts: newReceipts } = data;
        
        // Only process receipts for this session
        if (msgSessionId === sessionId && newReceipts && newReceipts.length > 0) {
          console.log(`📨 Received ${newReceipts.length} receipts via Socket.IO`);
          
          if (isPaused) {
            // Queue receipts while paused
            setPendingReceipts(prev => [...prev, ...newReceipts]);
          } else {
            // Add immediately (prepend to show newest first)
            setReceipts(prev => [...newReceipts, ...prev]);
          }
        }
      } catch (err) {
        console.error('Socket.IO message parse error:', err);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });
    
    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
    
    socketRef.current = socket;
    
    return () => {
      socket.disconnect();
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
      filtered = filtered.filter(r => r.conversationId === sessionId);
    } else if (receiptFilter === 'lab') {
      filtered = filtered.filter(r => r.persona === 'lab' || r.model?.includes('lab'));
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
      
      if (!response.ok) {
        console.warn(`Failed to load receipts: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.receipts) {
        setReceipts(data.receipts);
      }
    } catch (error) {
      // Silently fail if backend not ready yet - this is expected on initial load
      console.debug('Receipts not available yet:', error);
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
          governanceEnabled: useGovernance,
          sessionId,
          runId,
          apiKeys: {
            openai: openaiApiKey || undefined,
            anthropic: anthropicApiKey || undefined,
            google: googleApiKey || undefined
          }
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

  // Run parallel audit (Standard vs Rosetta comparison)
  const runAudit = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    if (isFree) {
      alert('Run Audit requires a paid subscription');
      return;
    }

    setIsRunning(true);
    setCurrentRunId(`run-${Date.now()}`);

    try {
      // Map model selection to API model IDs (using latest stable models)
      const modelMap: { [key: string]: string } = {
        // GPT-5 / o1 Series (Reasoning models)
        'o1': 'o1',
        'o1-mini': 'o1-mini',
        
        // GPT-4 Series
        'gpt-4o': 'gpt-4o',
        'gpt-4o-mini': 'gpt-4o-mini',
        'gpt-4-turbo': 'gpt-4-turbo',
        'gpt-4': 'gpt-4o',
        
        // Claude Series
        'claude-opus-4': 'claude-opus-4-20250514',
        'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
        'claude-3-opus': 'claude-3-opus-20240229',
        'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
        
        // Gemini Series
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-1.5-pro': 'gemini-1.5-pro'
      };

      const standardModelId = modelMap[selectedModel] || 'gpt-4o-mini';
      const rosettaModelId = `${standardModelId}-rosetta`;

      const response = await fetch(`${BACKEND_URL}/api/live-demo/parallel-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          standardModelId,
          rosettaModelId,
          conversationId: currentRunId,
          apiKeys: {
            openai: openaiApiKey || undefined,
            anthropic: anthropicApiKey || undefined,
            google: googleApiKey || undefined
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.standardResponse && data.rosettaResponse) {
        const comparison = {
          prompt: data.prompt || prompt,
          modelName: standardModelId,
          baseLLM: {
            response: data.standardResponse.content,
            cries: data.standardResponse.cries,
            provider: 'standard'
          },
          governedLLM: {
            response: data.rosettaResponse.content,
            cries: data.rosettaResponse.cries,
            provider: 'rosetta'
          },
          standardReceipt: data.standardReceipt,
          rosettaReceipt: data.rosettaReceipt
        };

        setComparisonResult(comparison);
        setShowComparisonModal(true);

        console.log('✅ Audit comparison complete:', comparison);
      } else {
        console.error('Audit failed:', data);
        alert('Audit failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error running audit:', error);
      alert('Error running audit: ' + (error instanceof Error ? error.message : String(error)));
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

  const sealReceipt = async (receiptId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pilot/receipt/${receiptId}/seal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Receipt sealed to Merkle tree!\nRoot: ${data.merkleRoot?.substring(0, 32)}...`);
        // Reload receipts to show updated status
        loadReceipts();
      } else {
        alert(`❌ Seal failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Seal failed:', error);
      alert('❌ Failed to seal receipt');
    }
  };

  const promoteReceipt = async (receiptId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pilot/receipt/${receiptId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Receipt promoted to permanent storage!\nLocation: ${data.storageLocation || 'Archive'}`);
        // Reload receipts to show updated status
        loadReceipts();
      } else {
        alert(`❌ Promotion failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Promotion failed:', error);
      alert('❌ Failed to promote receipt');
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
      
      {/* API Keys Section */}
      <div className="mb-4 border border-white/10 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowApiKeys(!showApiKeys)}
          className="w-full bg-slate-950 hover:bg-slate-900 p-3 flex items-center justify-between text-slate-300 font-mono text-sm transition-colors"
        >
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            API Keys (Optional for Cloud Models)
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showApiKeys ? 'rotate-180' : ''}`} />
        </button>
        
        {showApiKeys && (
          <div className="bg-slate-950/50 p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-mono mb-1 block">OpenAI API Key</label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-mono mb-1 block">Anthropic API Key</label>
              <input
                type="password"
                value={anthropicApiKey}
                onChange={(e) => setAnthropicApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-mono mb-1 block">Google API Key</label>
              <input
                type="password"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </div>
      
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
            <optgroup label="🚀 GPT-5 Series (Reasoning)">
              <option value="o1">o1 (GPT-5)</option>
              <option value="o1-mini">o1-mini</option>
            </optgroup>
            <optgroup label="⚡ GPT-4 Series">
              <option value="gpt-4o">GPT-4o (Latest)</option>
              <option value="gpt-4o-mini">GPT-4o-mini</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-4">GPT-4</option>
            </optgroup>
            <optgroup label="🧠 Claude Series">
              <option value="claude-opus-4">Claude Opus 4</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3.5-haiku">Claude 3.5 Haiku</option>
            </optgroup>
            <optgroup label="🔮 Other Models">
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </optgroup>
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
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={runPrompt}
          disabled={isRunning || !prompt.trim()}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-mono font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
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

        <button
          onClick={runAudit}
          disabled={isRunning || !prompt.trim() || isFree}
          className="bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 hover:from-emerald-600 hover:to-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-mono font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          title={isFree ? 'Run Audit requires a paid subscription' : 'Compare Standard vs Rosetta Governed models'}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <GitCompare className="w-5 h-5" />
              Run Audit
            </>
          )}
        </button>
      </div>
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
              {typeof currentResult.cries === 'object' && Object.entries(currentResult.cries).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-slate-500 font-mono">{key}</div>
                  <div className="text-lg font-bold font-mono text-white">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
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
              className="bg-slate-950 border border-white/10 rounded-lg p-3 hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-cyan-400">
                  {receipt.persona || 'Receipt'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">
                    λ={receipt.lamport}
                  </span>
                  
                  {/* Action buttons - shown on hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => sealReceipt(receipt.id)}
                      className="p-1 bg-green-500/20 border border-green-500/50 rounded text-green-300 hover:bg-green-500/30 transition-all"
                      title="Seal to Merkle Tree"
                    >
                      <Shield className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => promoteReceipt(receipt.id)}
                      className="p-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-300 hover:bg-purple-500/30 transition-all"
                      title="Promote to Permanent Storage"
                    >
                      <Database className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {receipt.currDigest && (
                <div className="text-xs text-slate-400 font-mono mb-1">
                  Digest: {receipt.currDigest.substring(0, 16)}...
                </div>
              )}
              
              {typeof receipt.criesOmega === 'number' && (
                <div className="flex gap-2 text-xs font-mono">
                  <span className="text-slate-500">Ω={receipt.criesOmega.toFixed(2)}</span>
                  <span className="text-slate-500">C={receipt.criesCoherence?.toFixed(1)}</span>
                  <span className="text-slate-500">R={receipt.criesRigor?.toFixed(1)}</span>
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
                receipt.persona === 'Architect' ? 'bg-purple-500' :
                receipt.persona === 'Auditor' ? 'bg-green-500' :
                'bg-cyan-500'
              }`} />
              {index < filteredReceipts.length - 1 && (
                <div className="w-0.5 h-full bg-white/10 flex-1 my-1" />
              )}
            </div>
            
            {/* Receipt card */}
            <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold font-mono text-white">
                  {receipt.persona || 'Receipt'} {receipt.model ? `(${receipt.model})` : ''}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(receipt.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="text-xs text-slate-400 font-mono space-y-1">
                <div>Lamport: {receipt.lamport}</div>
                {receipt.currDigest && (
                  <div>Digest: {receipt.currDigest.substring(0, 32)}...</div>
                )}
                {receipt.prevDigest && (
                  <div>Prev: {receipt.prevDigest.substring(0, 32)}...</div>
                )}
              </div>
              
              {typeof receipt.criesOmega === 'number' && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-mono text-slate-500">
                    CRIES: Ω={receipt.criesOmega.toFixed(2)} | 
                    C={receipt.criesCoherence?.toFixed(1)} | 
                    R={receipt.criesRigor?.toFixed(1)} | 
                    I={receipt.criesIntegrity?.toFixed(1)} | 
                    E={receipt.criesEmpathy?.toFixed(1)} | 
                    S={receipt.criesStrictness?.toFixed(1)}
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
    const analysisReceipts = filteredReceipts.filter(r => r.persona === 'Witness' && r.criesOmega);
    
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
      if (!r.criesOmega) return acc;
      return {
        C: acc.C + (r.criesCoherence || 0),
        R: acc.R + (r.criesRigor || 0),
        I: acc.I + (r.criesIntegrity || 0),
        E: acc.E + (r.criesEmpathy || 0),
        S: acc.S + (r.criesStrictness || 0),
        Omega: acc.Omega + r.criesOmega
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
            {typeof avgCRIES === 'object' && Object.entries(avgCRIES).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-16">{key}</span>
                <div className="flex-1 bg-slate-950 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full"
                    style={{ width: `${((value as number) / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-white w-12 text-right">
                  {(value as number).toFixed(2)}
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
                
                {receipt.criesOmega && (
                  <div className="text-lg font-bold font-mono text-cyan-400">
                    Ω={receipt.criesOmega.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Comparison Modal */}
      {showComparisonModal && comparisonResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-mono text-white">Parallel Audit Comparison</h2>
                <p className="text-sm text-slate-400 font-mono mt-1">Standard LLM vs Rosetta Governed</p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-white font-mono text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Prompt */}
              <div className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                <h3 className="text-sm font-bold font-mono text-cyan-400 mb-2">PROMPT</h3>
                <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{comparisonResult.prompt}</p>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Base LLM */}
                <div className="bg-slate-800/30 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <h3 className="text-sm font-bold font-mono text-orange-400">STANDARD LLM</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-white/5 rounded p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comparisonResult.baseLLM.response}</p>
                    </div>
                    {comparisonResult.baseLLM.cries && (
                      <div className="space-y-2">
                        <p className="text-xs font-mono text-slate-500 mb-2">CRIES ANALYSIS</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">C</p>
                            <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.C?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">R</p>
                            <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.R?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">I</p>
                            <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.I?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">E</p>
                            <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.E?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">S</p>
                            <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.S?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-orange-500/20 p-2 rounded border border-orange-500/30">
                            <p className="text-xs text-orange-300 font-bold">Ω</p>
                            <p className="text-xl font-mono text-orange-300 font-bold">
                              {comparisonResult.baseLLM.cries.Omega?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rosetta Governed LLM */}
                <div className="bg-slate-800/30 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <h3 className="text-sm font-bold font-mono text-green-400">ROSETTA GOVERNED</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-white/5 rounded p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comparisonResult.governedLLM.response}</p>
                    </div>
                    {comparisonResult.governedLLM.cries && (
                      <div className="space-y-2">
                        <p className="text-xs font-mono text-slate-500 mb-2">CRIES ANALYSIS</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">C</p>
                            <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.C?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">R</p>
                            <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.R?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">I</p>
                            <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.I?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">E</p>
                            <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.E?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <p className="text-xs text-slate-500">S</p>
                            <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.S?.toFixed(2) || 'N/A'}</p>
                          </div>
                          <div className="bg-green-500/20 p-2 rounded border border-green-500/30">
                            <p className="text-xs text-green-300 font-bold">Ω</p>
                            <p className="text-xl font-mono text-green-300 font-bold">
                              {comparisonResult.governedLLM.cries.Omega?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Improvement Summary */}
              {comparisonResult.baseLLM.cries && comparisonResult.governedLLM.cries && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <h3 className="text-sm font-bold font-mono text-emerald-400 mb-3">GOVERNANCE IMPACT</h3>
                  <div className="grid grid-cols-6 gap-3">
                    {['C', 'R', 'I', 'E', 'S'].map(metric => {
                      const base = comparisonResult.baseLLM.cries[metric] || 0;
                      const governed = comparisonResult.governedLLM.cries[metric] || 0;
                      const improvement = ((governed - base) / base * 100).toFixed(1);
                      const isPositive = parseFloat(improvement) > 0;
                      return (
                        <div key={metric} className="text-center">
                          <p className="text-xs text-slate-500 mb-1">{metric}</p>
                          <p className={`text-lg font-mono font-bold ${isPositive ? 'text-green-400' : 'text-orange-400'}`}>
                            {isPositive ? '+' : ''}{improvement}%
                          </p>
                        </div>
                      );
                    })}
                    <div className="text-center">
                      <p className="text-xs text-emerald-300 font-bold mb-1">Overall</p>
                      <p className="text-lg font-mono font-bold text-emerald-300">
                        +{(((comparisonResult.governedLLM.cries.Omega - comparisonResult.baseLLM.cries.Omega) / comparisonResult.baseLLM.cries.Omega * 100).toFixed(1))}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
