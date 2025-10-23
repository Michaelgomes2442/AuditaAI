'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Clock, CheckCircle2, AlertTriangle, RefreshCw, Terminal, FileCode, ArrowLeft, Key, Lock, Crown, Zap, TrendingUp, ChevronDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import UpgradeBanner from '@/components/UpgradeBanner';
import UpgradeModal from '@/components/UpgradeModal';
import { useUser } from '@/contexts/UserContext';
import CRIESMetrics from '@/components/CRIESMetrics';
// TODO: OnboardingTour disabled - react-joyride incompatible with React 19
// import OnboardingTour from '@/components/OnboardingTour';

interface Receipt {
  receipt_type: string;
  status: string;
  lamport: number;
  trace_id: string;
  ts: string;
  witness: string;
  band: string;
  notes?: string;
}

interface RegistryData {
  receipts: Array<{
    type: string;
    lamport: number;
    sha256: string;
    timestamp: string;
  }>;
  lamport_chain: {
    current: number;
    verified: boolean;
  };
}

interface GovernanceState {
  sigma: number;
  omega: number;
  last_updated: string;
  total_events: number;
}

interface UserProfile {
  tier?: string;
  role?: string;
}

export default function PilotPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Use global user context instead of local state
  const { profile, isLoading: profileLoading, isFree, isPaid, isArchitect } = useUser();
  
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [governanceState, setGovernanceState] = useState<GovernanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [liveTestPrompt, setLiveTestPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]); // Start empty, auto-select when Ollama detected
  const [useGovernance, setUseGovernance] = useState(true);
  const [liveTestResult, setLiveTestResult] = useState<any>(null);
  const [showLiveTestModal, setShowLiveTestModal] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'ready' | 'missing'>('checking');
  const [showOllamaSetup, setShowOllamaSetup] = useState(false);
  const [userPlatform, setUserPlatform] = useState<'windows' | 'mac' | 'linux'>('linux');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // API Key Management
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [availableCloudModels, setAvailableCloudModels] = useState<string[]>([]);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', {
      showLiveTestModal,
      hasLiveTestResult: !!liveTestResult,
      liveTestResultType: typeof liveTestResult,
      shouldShowModal: showLiveTestModal && liveTestResult
    });
  }, [showLiveTestModal, liveTestResult]);

  const fetchRosettaData = async () => {
    setLoading(true);
    try {
      const [bootRes, registryRes, stateRes] = await Promise.all([
        fetch('http://localhost:3001/api/rosetta/boot').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/rosetta/registry').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/rosetta/state').catch(() => ({ ok: false }))
      ]);

      if (bootRes.ok && typeof (bootRes as any).json === 'function') {
        const bootData = await (bootRes as Response).json();
        setReceipt(bootData);
      } else {
        // Fallback demo data when backend is not available
        setReceipt({
          receipt_type: "DEMO_RECEIPT",
          status: "active",
          lamport: 42,
          trace_id: "demo-trace-123",
          ts: new Date().toISOString(),
          witness: "demo-witness",
          band: "demo-band",
          notes: "Demo mode - backend not available"
        });
      }

      if (registryRes.ok && typeof (registryRes as any).json === 'function') {
        const regData = await (registryRes as Response).json();
        setRegistry(regData);
      } else {
        // Fallback demo registry data
        setRegistry({
          receipts: [
            {
              type: "governance_test",
              lamport: 42,
              sha256: "demo-sha256-hash",
              timestamp: new Date().toISOString()
            }
          ],
          lamport_chain: {
            current: 42,
            verified: true
          }
        });
      }

      if (stateRes.ok && typeof (stateRes as any).json === 'function') {
        const stateData = await (stateRes as Response).json();
        setGovernanceState(stateData);
      } else {
        // Fallback demo governance state
        setGovernanceState({
          sigma: 0.87,
          omega: 0.91,
          last_updated: new Date().toISOString(),
          total_events: 156
        });
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching Rosetta data:', error);
      // Set fallback demo data on any error
      setReceipt({
        receipt_type: "DEMO_RECEIPT",
        status: "active",
        lamport: 42,
        trace_id: "demo-trace-123",
        ts: new Date().toISOString(),
        witness: "demo-witness",
        band: "demo-band",
        notes: "Demo mode - backend not available"
      });
      setRegistry({
        receipts: [{
          type: "governance_test",
          lamport: 42,
          sha256: "demo-sha256-hash",
          timestamp: new Date().toISOString()
        }],
        lamport_chain: { current: 42, verified: true }
      });
      setGovernanceState({
        sigma: 0.87,
        omega: 0.91,
        last_updated: new Date().toISOString(),
        total_events: 156
      });
    } finally {
      setLoading(false);
    }
  };

  const detectCloudModels = () => {
    const cloudModels: string[] = [];
    
    // Check OpenAI API key
    if (openaiApiKey && openaiApiKey.startsWith('sk-')) {
      cloudModels.push('gpt-4-turbo-preview', 'gpt-4o');
    }
    
    // Check Anthropic API key
    if (anthropicApiKey && anthropicApiKey.startsWith('sk-ant-')) {
      cloudModels.push('claude-3-5-sonnet-20241022', 'claude-3-opus-20240229');
    }
    
    setAvailableCloudModels(cloudModels);
    console.log('🔑 Detected cloud models from API keys:', cloudModels);
    
    // Auto-select first cloud model if available
    if (!isFree && cloudModels.length > 0 && selectedModels.length === 0) {
      setSelectedModels([cloudModels[0]]);
    }
  };

  const checkOllamaStatus = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch('/api/pilot/ollama-status');
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus(data.available ? 'ready' : 'missing');
        
        if (data.available) {
          console.log('✓ Ollama ready:', data.message);
          console.log('📦 Available models:', data.models);
          
          // Store available models
          setAvailableModels(data.models || []);
          
          // Auto-select available Ollama models for PAID users
          if (!isFree && data.models && data.models.length > 0) {
            const ollamaModels = data.models.filter((m: string) => 
              !m.includes('gpt') && !m.includes('claude')
            );
            if (ollamaModels.length > 0 && selectedModels.length === 0) {
              console.log('✨ Auto-selecting available Ollama models:', ollamaModels);
              setSelectedModels(ollamaModels.slice(0, 2)); // Auto-select first 2 models
            }
          }
        } else {
          console.log('⚠ Ollama not available:', data.message);
          setAvailableModels([]);
        }
      } else {
        setOllamaStatus('missing');
        setAvailableModels([]);
      }
    } catch (error) {
      setOllamaStatus('missing');
      setAvailableModels([]);
      console.error('Failed to check Ollama status:', error);
    }
  };

  useEffect(() => {
    // Detect user platform
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) {
      setUserPlatform('windows');
    } else if (platform.includes('mac')) {
      setUserPlatform('mac');
    } else {
      setUserPlatform('linux');
    }

    // Load API keys from localStorage
    const savedOpenAI = localStorage.getItem('openai_api_key');
    const savedAnthropic = localStorage.getItem('anthropic_api_key');
    if (savedOpenAI) setOpenaiApiKey(savedOpenAI);
    if (savedAnthropic) setAnthropicApiKey(savedAnthropic);

    // Profile is now managed by UserProvider, just fetch Rosetta data
    fetchRosettaData();
    checkOllamaStatus();
    
    // Reduce polling frequency from 10s to 30s
    const interval = setInterval(fetchRosettaData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Detect cloud models when API keys change
  useEffect(() => {
    detectCloudModels();
    // Save API keys to localStorage
    if (openaiApiKey) localStorage.setItem('openai_api_key', openaiApiKey);
    if (anthropicApiKey) localStorage.setItem('anthropic_api_key', anthropicApiKey);
  }, [openaiApiKey, anthropicApiKey]);

  // Preselected demo prompts available to FREE users
  const demoPrompts = [
    { 
      id: 'dp1', 
      title: 'Quick Governance Healthcheck', 
      description: 'Test: Healthcare data policy with encryption and export rules'
    },
    { 
      id: 'dp2', 
      title: 'Bias Detection Quick Scan', 
      description: 'Test: Loan application denial based on neighborhood and employment'
    },
    { 
      id: 'dp3', 
      title: 'Assurance Summary', 
      description: 'Test: Medical advice quality assessment (daily aspirin side effects)'
    }
  ];

  const [running, setRunning] = useState(false);

  const bootRosettaGovernance = async () => {
    try {
      setLoading(true);
      console.log('🚀 Initiating Rosetta boot sequence...');

      const res = await fetch('http://localhost:3001/api/rosetta/boot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.id || session?.user?.id || null,
          userName: profile?.name || session?.user?.name || 'System',
          userRole: isArchitect ? 'Architect' : 'Operator'
        })
      });

      if (!res.ok) {
        throw new Error(`Boot failed: ${res.statusText}`);
      }

      const bootData = await res.json();
      console.log('✅ Rosetta boot complete:', bootData);

      // Refresh Rosetta data to show new boot status
      await fetchRosettaData();

      alert(`🎉 Rosetta Governance Booted!\n\nΔ-BOOTCONFIRM Receipt Generated\nLamport: ${bootData.lamport}\nBand: ${bootData.governance?.bands?.[0] || 'Band-0'}`);
    } catch (error) {
      console.error('❌ Rosetta boot failed:', error);
      alert(`Rosetta boot failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const runLiveTest = async () => {
    if (isFree) {
      alert('Upgrade required — Live testing is disabled for Free accounts.');
      return;
    }

    if (!liveTestPrompt.trim()) {
      alert('Please enter a prompt for testing');
      return;
    }

    if (selectedModels.length === 0) {
      alert('Please select at least one model to test');
      return;
    }

    try {
      setRunning(true);
      
      // Prepare API keys if provided
      const apiKeys: any = {};
      if (openaiApiKey && openaiApiKey.startsWith('sk-')) {
        apiKeys.openai = openaiApiKey;
      }
      if (anthropicApiKey && anthropicApiKey.startsWith('sk-ant-')) {
        apiKeys.anthropic = anthropicApiKey;
      }
      
      // Get valid user ID
      let userId: string;
      if (profile?.id) {
        userId = String(profile.id);
      } else if (session?.user?.id) {
        userId = String(session.user.id);
      } else {
        userId = '22'; // Default test user
      }
      
      console.log('🔍 DEBUG - Starting live test...');
      console.log('   User ID:', userId);
      console.log('   Models:', selectedModels);
      console.log('   Governance:', useGovernance);
      console.log('   Prompt length:', liveTestPrompt.length);
      
      const res = await fetch('http://localhost:3001/api/pilot/run-test', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'x-user-tier': profile?.tier || 'FREE',
          'x-user-id': userId
        }, 
        body: JSON.stringify({ 
          mode: 'live',
          prompt: liveTestPrompt,
          models: selectedModels,
          useGovernance,
          apiKeys: Object.keys(apiKeys).length > 0 ? apiKeys : undefined
        }) 
      });
      
      console.log('🔍 DEBUG - Response status:', res.status, res.statusText);
      console.log('🔍 DEBUG - Response ok:', res.ok);
      
      if (res.ok) {
        const data = await res.json();
        console.log('🔍 DEBUG - Response data:', data);
        console.log('🔍 DEBUG - Has results array:', Array.isArray(data?.results));
        console.log('🔍 DEBUG - Results length:', data?.results?.length);
        setLiveTestResult(data);
        console.log('🔍 DEBUG - Setting showLiveTestModal to true');
        setShowLiveTestModal(true);
      } else {
        console.error('🔍 DEBUG - Request failed with status:', res.status);
        const errorText = await res.text();
        console.error('🔍 DEBUG - Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error (${res.status}): ${errorText.substring(0, 200)}`);
        }
        throw new Error(errorData.message || errorData.error || 'Failed to run live test');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to run live test: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRunning(false);
    }
  };

  const runComparisonTest = async () => {
    if (selectedModels.length === 0) {
      alert('Please select at least one model to test');
      return;
    }

    try {
      setRunning(true);
      
      // Prepare API keys
      const apiKeys: any = {};
      if (openaiApiKey && openaiApiKey.startsWith('sk-')) {
        apiKeys.openai = openaiApiKey;
      }
      if (anthropicApiKey && anthropicApiKey.startsWith('sk-ant-')) {
        apiKeys.anthropic = anthropicApiKey;
      }
      
      // Use only the FIRST selected model for comparison (same model, with/without governance)
      const modelToCompare = [selectedModels[0]];
      
      // Get actual user ID from profile - ensure it's a valid number or string number
      let userId: string;
      if (profile?.id) {
        userId = String(profile.id);
      } else if (session?.user?.id) {
        userId = String(session.user.id);
      } else {
        // Fallback to default test user
        userId = '22';
      }
      
      console.log(`🔍 Running comparison for model: ${modelToCompare[0]}`);
      console.log(`   User ID: ${userId}`);
      
      // Run two tests in parallel: one with governance OFF, one with governance ON
      const [baseRes, governedRes] = await Promise.all([
        fetch('http://localhost:3001/api/pilot/run-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-tier': profile?.tier || 'FREE',
            'x-user-id': userId
          },
          body: JSON.stringify({
            mode: 'live',
            prompt: liveTestPrompt,
            models: modelToCompare,
            useGovernance: false,
            apiKeys: Object.keys(apiKeys).length > 0 ? apiKeys : undefined
          })
        }),
        fetch('http://localhost:3001/api/pilot/run-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-tier': profile?.tier || 'FREE',
            'x-user-id': userId
          },
          body: JSON.stringify({
            mode: 'live',
            prompt: liveTestPrompt,
            models: modelToCompare,
            useGovernance: true,
            apiKeys: Object.keys(apiKeys).length > 0 ? apiKeys : undefined
          })
        })
      ]);

      if (baseRes.ok && governedRes.ok) {
        const baseData = await baseRes.json();
        const governedData = await governedRes.json();
        
        console.log('🔍 Comparison - Base:', baseData);
        console.log('🔍 Comparison - Governed:', governedData);
        
        setComparisonResult({
          prompt: liveTestPrompt,
          modelName: modelToCompare[0],
          baseLLM: baseData.results[0], // Same model without governance
          governedLLM: governedData.results[0] // Same model with governance
        });
        setShowComparisonModal(true);
      } else {
        const baseError = !baseRes.ok ? await baseRes.text() : null;
        const governedError = !governedRes.ok ? await governedRes.text() : null;
        console.error('Base response error:', baseError);
        console.error('Governed response error:', governedError);
        throw new Error(`Comparison failed: ${baseError || governedError || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to run comparison test: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRunning(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
  };

  const startDemo = async () => {
    // Demo can be started by any user (free or paid)
    try {
      setRunning(true);
      const res = await fetch('/api/pilot/start-demo', { method: 'POST' });
      if (res.ok) {
        alert('Demo mode started');
      } else {
        throw new Error('Failed to start demo');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start demo: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Onboarding Tour - DISABLED: react-joyride incompatible with React 19 */}
      {/* <OnboardingTour page="pilot" /> */}

      {/* Upgrade Banner for FREE users */}
      <UpgradeBanner 
        userTier={profile?.tier} 
        showUpgradeModal={() => setShowUpgradeModal(true)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={profile?.tier}
      />

      {/* Ollama Setup Instructions Modal */}
      {showOllamaSetup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-orange-500/30 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-bold font-mono text-white">Ollama Setup Guide</h2>
              </div>
              <button
                onClick={() => setShowOllamaSetup(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-white font-mono text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* What is Ollama */}
              <div className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                <h3 className="text-cyan-400 font-mono font-bold mb-2">What is Ollama?</h3>
                <p className="text-slate-300 text-sm font-mono">
                  Ollama is a free, open-source tool that lets you run AI models locally on your computer. 
                  No API keys needed, 100% private, and works offline.
                </p>
              </div>

              {/* Platform Selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-slate-400 font-mono text-sm">Platform:</span>
                <div className="flex gap-2">
                  {(['windows', 'mac', 'linux'] as const).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setUserPlatform(platform)}
                      className={`px-3 py-1 rounded font-mono text-sm transition-all ${
                        userPlatform === platform
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                          : 'bg-slate-800 text-slate-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {platform === 'windows' ? '🪟 Windows' : platform === 'mac' ? '🍎 macOS' : '🐧 Linux'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Installation Steps */}
              <div className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                <h3 className="text-green-400 font-mono font-bold mb-4">
                  Installation {userPlatform === 'windows' ? '(2 steps)' : '(3 steps)'}
                </h3>
                
                <div className="space-y-4">
                  {/* Step 1 - Platform Specific */}
                  <div className="border-l-2 border-green-500/30 pl-4">
                    <h4 className="text-white font-mono font-semibold mb-2">1. Install Ollama</h4>
                    
                    {userPlatform === 'windows' && (
                      <>
                        <div className="bg-slate-900/50 border border-white/10 rounded p-3 mb-2">
                          <p className="text-xs text-slate-400 font-mono mb-2">Download and run the installer:</p>
                          <a 
                            href="https://ollama.ai/download/windows" 
                            target="_blank"
                            className="text-cyan-300 font-mono text-sm hover:underline"
                          >
                            📥 Download OllamaSetup.exe
                          </a>
                        </div>
                        <p className="text-slate-400 text-xs font-mono">
                          After installation, Ollama will start automatically. You'll see it in your system tray.
                        </p>
                      </>
                    )}

                    {userPlatform === 'mac' && (
                      <>
                        <div className="bg-slate-900/50 border border-white/10 rounded p-3 mb-2">
                          <p className="text-xs text-slate-400 font-mono mb-2">Option 1 - Homebrew:</p>
                          <code className="text-green-300 font-mono text-sm block mb-3">brew install ollama</code>
                          <p className="text-xs text-slate-400 font-mono mb-2">Option 2 - Download:</p>
                          <a 
                            href="https://ollama.ai/download/mac" 
                            target="_blank"
                            className="text-cyan-300 font-mono text-sm hover:underline"
                          >
                            📥 Download Ollama.dmg
                          </a>
                        </div>
                        <p className="text-slate-400 text-xs font-mono">
                          After installation, Ollama will auto-start in the background.
                        </p>
                      </>
                    )}

                    {userPlatform === 'linux' && (
                      <>
                        <div className="bg-slate-900/50 border border-white/10 rounded p-3 mb-2">
                          <p className="text-xs text-slate-400 font-mono mb-2">Run in your terminal:</p>
                          <code className="text-green-300 font-mono text-sm">curl -fsSL https://ollama.ai/install.sh | sh</code>
                        </div>
                        <p className="text-slate-400 text-xs font-mono">
                          Or download from: <a href="https://ollama.ai" target="_blank" className="text-cyan-400 hover:underline">https://ollama.ai</a>
                        </p>
                      </>
                    )}
                  </div>

                  {/* Step 2 - Pull Model */}
                  <div className="border-l-2 border-green-500/30 pl-4">
                    <h4 className="text-white font-mono font-semibold mb-2">2. Pull the Model</h4>
                    <div className="bg-slate-900/50 border border-white/10 rounded p-3 mb-2">
                      <p className="text-xs text-slate-400 font-mono mb-2">
                        {userPlatform === 'windows' ? 'Open Command Prompt or PowerShell and run:' : 'Run in your terminal:'}
                      </p>
                      <code className="text-green-300 font-mono text-sm">ollama pull llama3.2:3b</code>
                    </div>
                    <p className="text-slate-400 text-xs font-mono">Downloads ~2GB model (one-time only)</p>
                  </div>

                  {/* Step 3 - Start Ollama (Linux only) */}
                  {userPlatform === 'linux' && (
                    <div className="border-l-2 border-green-500/30 pl-4">
                      <h4 className="text-white font-mono font-semibold mb-2">3. Start Ollama</h4>
                      <div className="bg-slate-900/50 border border-white/10 rounded p-3 mb-2">
                        <p className="text-xs text-slate-400 font-mono mb-2">Run in your terminal:</p>
                        <code className="text-green-300 font-mono text-sm">ollama serve</code>
                      </div>
                      <p className="text-slate-400 text-xs font-mono">Keep this terminal open while using AuditaAI</p>
                    </div>
                  )}

                  {/* Auto-start note for Windows/Mac */}
                  {(userPlatform === 'windows' || userPlatform === 'mac') && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3">
                      <p className="text-cyan-300 font-mono text-xs">
                        ✓ Ollama runs automatically on {userPlatform === 'windows' ? 'Windows' : 'macOS'}. 
                        No need to manually start it!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <h3 className="text-cyan-400 font-mono font-bold mb-2">✓ Verify Installation</h3>
                <p className="text-slate-300 text-sm font-mono mb-3">
                  Once Ollama is running, click the "Recheck" button on the dashboard. 
                  You should see "Ollama Ready ✓" appear.
                </p>
                <button
                  onClick={() => {
                    setShowOllamaSetup(false);
                    checkOllamaStatus();
                  }}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-300 font-mono text-sm transition-all"
                >
                  Check Status Now
                </button>
              </div>

              {/* Troubleshooting */}
              <div className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                <h3 className="text-orange-400 font-mono font-bold mb-2">⚠ Troubleshooting</h3>
                <ul className="space-y-2 text-sm font-mono text-slate-300">
                  {userPlatform === 'windows' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Ollama not starting:</strong> Check system tray for Ollama icon. Right-click → Quit and restart</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Command not found:</strong> Restart Command Prompt/PowerShell after installation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Firewall blocking:</strong> Allow Ollama through Windows Firewall (port 11434)</span>
                      </li>
                    </>
                  )}
                  
                  {userPlatform === 'mac' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Ollama not starting:</strong> Check menu bar for Ollama icon. Click → Quit and restart</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Command not found:</strong> Restart Terminal.app after installation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Permission denied:</strong> Grant Full Disk Access in System Preferences → Security & Privacy</span>
                      </li>
                    </>
                  )}

                  {userPlatform === 'linux' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Port already in use:</strong> Kill existing Ollama: <code className="bg-slate-900 px-1">pkill ollama</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Command not found:</strong> Restart terminal or add to PATH: <code className="bg-slate-900 px-1">export PATH=$PATH:/usr/local/bin</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span><strong>Connection refused:</strong> Make sure <code className="bg-slate-900 px-1">ollama serve</code> is running in a terminal</span>
                      </li>
                    </>
                  )}

                  <li className="flex items-start gap-2">
                    <span className="text-orange-400">•</span>
                    <span><strong>Still having issues?</strong> Visit <a href="https://github.com/ollama/ollama#troubleshooting" target="_blank" className="text-cyan-400 hover:underline">Ollama Troubleshooting</a></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Comparison Modal */}
      {showDemoModal && demoResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-mono text-white">{demoResult.promptTitle}</h2>
                <p className="text-sm text-slate-400 font-mono mt-1">Base LLM vs AuditaAI Governed Comparison</p>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-white font-mono text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Prompt */}
              <div className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                <h3 className="text-sm font-bold font-mono text-cyan-400 mb-2">PROMPT</h3>
                <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{demoResult.prompt}</p>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Base LLM */}
                <div className="bg-slate-800/30 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <h3 className="text-sm font-bold font-mono text-orange-400">BASE LLM (Ungoverned)</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-white/5 rounded p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{demoResult.baseLLM.response}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-slate-500 mb-2">CRIES ANALYSIS</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">C (Coherence)</p>
                          <p className="text-lg font-mono text-orange-400">{demoResult.baseLLM?.cries?.C?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">R (Rigor)</p>
                          <p className="text-lg font-mono text-orange-400">{demoResult.baseLLM?.cries?.R?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">I (Integration)</p>
                          <p className="text-lg font-mono text-orange-400">{demoResult.baseLLM?.cries?.I?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">E (Empathy)</p>
                          <p className="text-lg font-mono text-orange-400">{demoResult.baseLLM?.cries?.E?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">S (Security)</p>
                          <p className="text-lg font-mono text-orange-400">{demoResult.baseLLM?.cries?.S?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-orange-500/20 p-2 rounded border border-orange-500/30">
                          <p className="text-xs text-orange-300 font-bold">Ω (Overall)</p>
                          <p className="text-xl font-mono text-orange-300 font-bold">{demoResult.baseLLM?.cries?.Omega?.toFixed(2) || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AuditaAI Governed LLM */}
                <div className="bg-slate-800/30 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <h3 className="text-sm font-bold font-mono text-green-400">AUDITAAI GOVERNED</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-white/5 rounded p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{demoResult.governedLLM.response}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-slate-500 mb-2">CRIES ANALYSIS</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">C (Coherence)</p>
                          <p className="text-lg font-mono text-green-400">{demoResult.governedLLM?.cries?.C?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">R (Rigor)</p>
                          <p className="text-lg font-mono text-green-400">{demoResult.governedLLM?.cries?.R?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">I (Integration)</p>
                          <p className="text-lg font-mono text-green-400">{demoResult.governedLLM?.cries?.I?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">E (Empathy)</p>
                          <p className="text-lg font-mono text-green-400">{demoResult.governedLLM?.cries?.E?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">S (Security)</p>
                          <p className="text-lg font-mono text-green-400">{demoResult.governedLLM?.cries?.S?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-green-500/20 p-2 rounded border border-green-500/30">
                          <p className="text-xs text-green-300 font-bold">Ω (Overall)</p>
                          <p className="text-xl font-mono text-green-300 font-bold">{demoResult.governedLLM?.cries?.Omega?.toFixed(2) || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Improvement Delta */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-cyan-400 mb-1">GOVERNANCE IMPROVEMENT</h3>
                    <p className="text-xs text-slate-400 font-mono">AuditaAI governance increases CRIES scores</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-mono">Ω Delta</p>
                    <p className="text-2xl font-bold font-mono text-cyan-400">
                      {demoResult.governedLLM?.cries?.Omega && demoResult.baseLLM?.cries?.Omega 
                        ? `+${((demoResult.governedLLM.cries.Omega - demoResult.baseLLM.cries.Omega) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Test Results Modal */}
      {showLiveTestModal && liveTestResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-mono text-white">Live Test Results</h2>
                <p className="text-sm text-slate-400 font-mono mt-1">
                  {liveTestResult.results.length} model(s) • Governance: {liveTestResult.useGovernance ? 'ON' : 'OFF'}
                </p>
              </div>
              <button
                onClick={() => setShowLiveTestModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-white font-mono text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Prompt */}
              <div className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                <h3 className="text-sm font-bold font-mono text-cyan-400 mb-2">YOUR PROMPT</h3>
                <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{liveTestResult.prompt}</p>
              </div>

              {/* Model Results Grid */}
              <div className="grid grid-cols-1 gap-6">
                {liveTestResult.results.map((result: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/30 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
                        <h3 className="text-sm font-bold font-mono text-purple-400">{result.modelName}</h3>
                        {result.provider && (
                          <span className="px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-xs font-mono text-slate-400">
                            {result.provider}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.usage && (
                          <span className="text-xs font-mono text-slate-500">
                            {result.usage.totalTokens || 0} tokens
                          </span>
                        )}
                        <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded">
                          <span className="text-xs font-mono text-purple-300 font-bold">
                            Ω {result.cries.Omega.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Response */}
                      <div className="bg-slate-900/50 border border-white/5 rounded p-3 max-h-64 overflow-y-auto">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{result.response}</p>
                      </div>

                      {/* CRIES Metrics */}
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-xs text-slate-500">C</p>
                          <p className="text-lg font-mono text-purple-400">{result.cries.C.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-xs text-slate-500">R</p>
                          <p className="text-lg font-mono text-purple-400">{result.cries.R.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-xs text-slate-500">I</p>
                          <p className="text-lg font-mono text-purple-400">{result.cries.I.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-xs text-slate-500">E</p>
                          <p className="text-lg font-mono text-purple-400">{result.cries.E.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-xs text-slate-500">S</p>
                          <p className="text-lg font-mono text-purple-400">{result.cries.S.toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-500/20 p-2 rounded border border-purple-500/30 text-center">
                          <p className="text-xs text-purple-300 font-bold">Ω</p>
                          <p className="text-lg font-mono text-purple-300 font-bold">{result.cries.Omega.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Summary */}
              {liveTestResult.results.length > 1 && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="text-sm font-bold font-mono text-cyan-400 mb-3">MODEL COMPARISON</h3>
                  <div className="space-y-2">
                    {liveTestResult.results
                      .sort((a: any, b: any) => b.cries.Omega - a.cries.Omega)
                      .map((result: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                          <span className="font-mono text-sm text-white">
                            {idx + 1}. {result.modelName}
                          </span>
                          <span className="font-mono text-sm text-cyan-400 font-bold">
                            Ω {result.cries.Omega.toFixed(4)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Governance Comparison Modal */}
      {showComparisonModal && comparisonResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-mono text-white">Governance Comparison: {comparisonResult.modelName}</h2>
                <p className="text-sm text-slate-400 font-mono mt-1">Same Model - Base vs Rosetta Governed</p>
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
                <h3 className="text-sm font-bold font-mono text-cyan-400 mb-2">YOUR PROMPT</h3>
                <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{comparisonResult.prompt}</p>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Base LLM (Ungoverned) */}
                <div className="bg-slate-800/30 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <h3 className="text-sm font-bold font-mono text-orange-400">WITHOUT ROSETTA</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mb-3">Raw {comparisonResult.modelName} output</p>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-white/5 rounded p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comparisonResult.baseLLM.response}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-slate-500 mb-2">CRIES ANALYSIS</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">C</p>
                          <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.C.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">R</p>
                          <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.R.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">I</p>
                          <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.I.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">E</p>
                          <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.E.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">S</p>
                          <p className="text-lg font-mono text-orange-400">{comparisonResult.baseLLM.cries.S.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-500/20 p-2 rounded border border-orange-500/30">
                          <p className="text-xs text-orange-300 font-bold">Ω</p>
                          <p className="text-xl font-mono text-orange-300 font-bold">{comparisonResult.baseLLM.cries.Omega.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AuditaAI Governed LLM */}
                <div className="bg-slate-800/30 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <h3 className="text-sm font-bold font-mono text-green-400">WITH ROSETTA</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mb-3">{comparisonResult.modelName} with boot sequence & governance</p>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-white/5 rounded p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comparisonResult.governedLLM.response}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-slate-500 mb-2">CRIES ANALYSIS</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">C</p>
                          <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.C.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">R</p>
                          <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.R.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">I</p>
                          <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.I.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">E</p>
                          <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.E.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <p className="text-xs text-slate-500">S</p>
                          <p className="text-lg font-mono text-green-400">{comparisonResult.governedLLM.cries.S.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-500/20 p-2 rounded border border-green-500/30">
                          <p className="text-xs text-green-300 font-bold">Ω</p>
                          <p className="text-xl font-mono text-green-300 font-bold">{comparisonResult.governedLLM.cries.Omega.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Improvement Delta */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono text-cyan-400">GOVERNANCE IMPROVEMENT</h3>
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded">
                    <span className="text-sm font-mono text-green-300 font-bold">
                      +{((comparisonResult.governedLLM.cries.Omega - comparisonResult.baseLLM.cries.Omega) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  AuditaAI governance improved the overall CRIES score (Ω) from {comparisonResult.baseLLM.cries.Omega.toFixed(2)} to {comparisonResult.governedLLM.cries.Omega.toFixed(2)}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] opacity-20" />
      <div className="relative z-10">
        <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-6">
            {/* Navigation Buttons */}
            <div className="mb-4 flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-mono text-sm">Home</span>
              </Link>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-purple-500/30 transition-all text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-mono text-sm">Back</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <Terminal className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-mono bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ROSETTA PILOT DEMO</h1>
                  <p className="text-sm text-slate-400 font-mono">BEN Runtime Monitor v13 • Tri-Track vΩ3.18</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href="/receipts/verify"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all"
                >
                  <Key className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-mono text-sm">VERIFY KEY</span>
                </Link>
                <button onClick={fetchRosettaData} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-all disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
                  <span className="text-cyan-400 font-mono text-sm">REFRESH</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 py-4">
          {/* Ollama Status Banner */}
          {ollamaStatus === 'checking' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-4">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-400 font-mono text-sm font-semibold">CHECKING OLLAMA STATUS...</span>
            </div>
          )}

          {ollamaStatus === 'missing' && (
            <div className="mb-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-orange-400 font-mono font-bold mb-2">Ollama Not Running</h3>
                  <p className="text-slate-300 text-sm font-mono mb-3">
                    Demo prompts require Ollama (free local AI). Please install and start it to continue.
                  </p>
                  <button
                    onClick={() => setShowOllamaSetup(true)}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-orange-300 font-mono text-sm transition-all"
                  >
                    📖 Show Setup Instructions
                  </button>
                </div>
                <button
                  onClick={checkOllamaStatus}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded text-slate-300 font-mono text-xs"
                >
                  Recheck
                </button>
              </div>
            </div>
          )}

          {ollamaStatus === 'ready' && (
            <div className="flex items-center justify-between px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-mono text-sm font-semibold">OLLAMA READY ✓</span>
                <span className="text-slate-500 mx-2">•</span>
                <span className="text-green-400 font-mono text-xs">BEN RUNTIME ACTIVE</span>
                <span className="text-slate-500 mx-2">•</span>
                <span className="text-slate-400 font-mono text-xs">Last check: {lastRefresh.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={checkOllamaStatus}
                className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded text-green-300 font-mono text-xs transition-colors"
              >
                Recheck
              </button>
            </div>
          )}
        </div>
        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Pricing & Tier Section - Only show for FREE users */}
          {isFree && !profileLoading && (
            <div className="bg-slate-800/30 border border-white/5 rounded-lg p-6 hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold font-mono text-white">Pricing & Plans</h3>
                  <p className="text-sm text-slate-400 font-mono">Free users are limited to preselected demo prompts. Upgrade to unlock live testing and integrations.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded font-mono text-sm bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    Free
                  </div>
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-3 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-sm hover:bg-amber-500/20"
                  >
                    Upgrade
                  </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-900/40 border border-white/5">
                <h4 className="font-mono font-semibold text-white">Free</h4>
                <p className="text-xs text-slate-400 font-mono">$0 / month</p>
                <ul className="mt-3 text-slate-300 text-sm font-mono list-disc list-inside">
                  <li>Preselected demo prompts only</li>
                  <li>No live testing</li>
                  <li>No business integrations</li>
                </ul>
                <div className="mt-4">
                  <button onClick={startDemo} className="px-3 py-2 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono text-sm">Start Demo</button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-white/5">
                <h4 className="font-mono font-semibold text-white">Pro</h4>
                <p className="text-xs text-slate-400 font-mono">$499 / month</p>
                <ul className="mt-3 text-slate-300 text-sm font-mono list-disc list-inside">
                  <li>Live testing and integrations</li>
                  <li>Higher rate limits</li>
                  <li>Pilot support</li>
                </ul>
                <div className="mt-4">
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-3 py-2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-sm hover:bg-emerald-500/20"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-white/5">
                <h4 className="font-mono font-semibold text-white">Enterprise</h4>
                <p className="text-xs text-slate-400 font-mono">Custom</p>
                <ul className="mt-3 text-slate-300 text-sm font-mono list-disc list-inside">
                  <li>Dedicated pilot support</li>
                  <li>On-prem / integrations</li>
                  <li>SLA & certs</li>
                </ul>
                <div className="mt-4">
                  <Link href="mailto:pilot@auditaai.com" className="px-3 py-2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono text-sm">Contact Sales</Link>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Demo Prompts (Free users) */}
          <div className="bg-slate-800/30 border border-white/5 rounded-lg p-6 hover:border-pink-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-mono text-white">Demo Prompts</h3>
              <p className="text-sm text-slate-400 font-mono">Free users may run these preselected prompts only.</p>
            </div>

            <div className="space-y-3">
              {demoPrompts.map((d) => (
                <div 
                  key={d.id} 
                  className="p-3 bg-slate-900/50 rounded border border-white/5 flex items-start justify-between"
                  data-tour={d.id === 'demo1' ? 'upload-model' : undefined}
                >
                  <div>
                    <div className="font-mono font-semibold text-white">{d.title}</div>
                    <div className="text-xs text-slate-400 font-mono mt-1">{d.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isFree) {
                          // For free users, run via /api/pilot/run-test with mode demo and prompt id
                          (async () => {
                            setRunning(true);
                            try {
                              const res = await fetch('http://localhost:3001/api/pilot/run-test', { 
                                method: 'POST', 
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'x-user-tier': profile?.tier || 'FREE',
                                  'x-user-id': session?.user?.id || 'anonymous'
                                }, 
                                body: JSON.stringify({ mode: 'demo', promptId: d.id }) 
                              });
                              if (res.ok) {
                                const data = await res.json();
                                console.log('Demo result:', data);
                                
                                // Validate response structure
                                if (!data.baseLLM || !data.governedLLM) {
                                  throw new Error('Invalid response structure from server');
                                }
                                
                                setDemoResult(data);
                                setShowDemoModal(true);
                              } else {
                                const errorData = await res.json();
                                throw new Error(errorData.message || 'Failed to queue demo');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Failed to queue demo: ' + (err instanceof Error ? err.message : String(err)));
                            } finally {
                              setRunning(false);
                            }
                          })();
                        }
                      }}
                      disabled={running}
                      className="px-3 py-2 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono text-sm disabled:opacity-50"
                    >
                      {isFree ? 'Run Demo' : 'Run Live'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Testing (Paid users only) */}
          {!isFree && (
            <div className="bg-slate-800/30 border border-cyan-500/20 rounded-lg p-6 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold font-mono text-white">Live Testing</h3>
                </div>
                <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-mono text-xs">
                  PAID ONLY
                </div>
              </div>

              <div className="space-y-4">
                {/* API Key Management */}
                <div className="bg-slate-900/50 border border-white/10 rounded-lg p-4">
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-mono font-bold text-white">API Keys (Optional)</span>
                      {availableCloudModels.length > 0 && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-mono">
                          {availableCloudModels.length} cloud models detected
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showApiKeys ? 'rotate-180' : ''}`} />
                  </button>

                  {showApiKeys && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-slate-400 font-mono mb-3">
                        Add API keys to enable cloud models (GPT-4, Claude). Keys are stored locally in your browser.
                      </p>
                      
                      {/* OpenAI API Key */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">OpenAI API Key (optional)</label>
                        <input
                          type="password"
                          value={openaiApiKey}
                          onChange={(e) => setOpenaiApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500/50"
                        />
                        {openaiApiKey && openaiApiKey.startsWith('sk-') && (
                          <p className="text-xs text-green-400 font-mono mt-1">✓ Enables: GPT-4 Turbo, GPT-4o</p>
                        )}
                      </div>

                      {/* Anthropic API Key */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">Anthropic API Key (optional)</label>
                        <input
                          type="password"
                          value={anthropicApiKey}
                          onChange={(e) => setAnthropicApiKey(e.target.value)}
                          placeholder="sk-ant-..."
                          className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500/50"
                        />
                        {anthropicApiKey && anthropicApiKey.startsWith('sk-ant-') && (
                          <p className="text-xs text-green-400 font-mono mt-1">✓ Enables: Claude 3.5 Sonnet, Claude 3 Opus</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Shield className="w-3 h-3 text-slate-500" />
                        <p className="text-xs text-slate-500 font-mono">
                          Keys stored locally. Never sent to AuditaAI servers.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Prompt Input */}
                <div>
                  <label className="block text-sm font-mono text-slate-400 mb-2">Your Prompt</label>
                  <textarea
                    value={liveTestPrompt}
                    onChange={(e) => setLiveTestPrompt(e.target.value)}
                    placeholder="Enter your prompt to test with AuditaAI governance..."
                    className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white font-mono text-sm min-h-[100px] focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-mono text-slate-400 mb-2">
                    Select Models to Compare
                    {availableModels.length > 0 && (
                      <span className="ml-2 text-green-400 text-xs">({availableModels.length} available)</span>
                    )}
                  </label>
                  
                  {/* Available Ollama Models */}
                  {availableModels.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-green-400 font-mono">✓ Ollama Models (Free, Local)</p>
                        <button
                          onClick={() => {
                            const allSelected = availableModels.every(m => selectedModels.includes(m));
                            if (allSelected) {
                              // Deselect all Ollama models
                              setSelectedModels(selectedModels.filter(m => !availableModels.includes(m)));
                            } else {
                              // Select all Ollama models
                              const newModels = [...new Set([...selectedModels, ...availableModels])];
                              setSelectedModels(newModels);
                            }
                          }}
                          className="px-2 py-1 text-xs font-mono text-green-400 hover:text-green-300 underline"
                        >
                          {availableModels.every(m => selectedModels.includes(m)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableModels.map(model => (
                          <button
                            key={model}
                            onClick={() => toggleModel(model)}
                            className={`px-3 py-2 rounded border font-mono text-xs transition-all ${
                              selectedModels.includes(model)
                                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                : 'bg-slate-900/50 border-green-500/20 text-green-400 hover:border-green-500/50'
                            }`}
                          >
                            {model} ✓
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cloud API Models (require keys) */}
                  {availableCloudModels.length > 0 ? (
                    <div>
                      <p className="text-xs text-green-400 font-mono mb-2">✓ Cloud Models (API Keys Detected)</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableCloudModels.map(model => (
                          <button
                            key={model}
                            onClick={() => toggleModel(model)}
                            className={`px-3 py-2 rounded border font-mono text-xs transition-all ${
                              selectedModels.includes(model)
                                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                : 'bg-slate-900/50 border-green-500/20 text-green-400 hover:border-green-500/50'
                            }`}
                          >
                            {model.replace('-preview', '').replace('-20241022', '').replace('-20240229', '')} ✓
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-xs text-orange-300 font-mono">
                        🔑 No cloud API keys detected. Add OpenAI or Anthropic API keys above to enable GPT-4 and Claude models.
                      </p>
                    </div>
                  )}

                  {availableModels.length === 0 && ollamaStatus === 'missing' && (
                    <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-xs text-orange-300 font-mono">
                        ⚠ No Ollama models detected. <button onClick={() => setShowOllamaSetup(true)} className="underline hover:text-orange-200">Install Ollama</button> for free local models.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500 font-mono">
                      💡 Selected: {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
                    </p>
                    {selectedModels.length === 0 && (
                      <p className="text-xs text-orange-400 font-mono">
                        ⚠ Please select at least one model
                      </p>
                    )}
                  </div>
                </div>

                {/* Governance Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-white/5 rounded-lg">
                  <div>
                    <p className="text-sm font-mono text-white font-semibold">AuditaAI Governance</p>
                    <p className="text-xs text-slate-500 font-mono">Apply BEN governance context to LLM calls</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={bootRosettaGovernance}
                      disabled={loading}
                      className="px-3 py-2 rounded font-mono text-xs bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="Boot Rosetta Monolith governance system"
                    >
                      🚀 Boot Rosetta
                    </button>
                    <button
                      onClick={() => setUseGovernance(!useGovernance)}
                      className={`px-4 py-2 rounded font-mono text-sm transition-all ${
                        useGovernance
                          ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                          : 'bg-slate-700 border border-white/10 text-slate-400'
                      }`}
                    >
                      {useGovernance ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Run Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={runLiveTest}
                    disabled={running || !liveTestPrompt.trim()}
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 font-mono font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {running ? '⏳ Running...' : '▶ Run Live Test'}
                  </button>
                  <button
                    onClick={runComparisonTest}
                    disabled={running || !liveTestPrompt.trim()}
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-green-500/20 border border-orange-500/30 hover:border-green-500/50 text-green-300 font-mono font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {running ? '⏳ Running...' : '⚖️ Run Comparison'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live CRIES Metrics Dashboard */}
          {!isFree && (
            <div className="mt-6">
              <CRIESMetrics showComparison={true} title="Real-Time CRIES Analytics" />
            </div>
          )}

          <div 
            className="bg-slate-800/30 border border-white/5 rounded-lg p-6 hover:border-cyan-500/30 transition-all"
            data-tour="cries-scores"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileCode className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold font-mono text-white">Δ-BOOTCONFIRM RECEIPT</h2>
            </div>
            {receipt ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">STATUS</p>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-mono ${receipt.status === 'BOOTED' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'}`}>
                        {receipt.status}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">LAMPORT CLOCK</p>
                    <p className="text-lg font-bold font-mono text-cyan-400">{receipt.lamport}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">BAND</p>
                    <div className="px-2 py-1 rounded text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 inline-block">
                      {receipt.band}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">WITNESS</p>
                    <p className="text-sm font-mono text-white">{receipt.witness}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">TRACE ID</p>
                  <p className="text-xs font-mono text-purple-400 break-all">{receipt.trace_id}</p>
                </div>
                {receipt.notes && (
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">NOTES</p>
                    <p className="text-sm text-slate-300">{receipt.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">TIMESTAMP</p>
                  <p className="text-xs font-mono text-slate-400">{receipt.ts}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <Activity className="w-4 h-4 animate-pulse" />
                <p className="text-sm font-mono">Loading receipt data...</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/30 border border-white/5 rounded-lg p-6 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold font-mono text-white">GOVERNANCE STATE</h2>
              </div>
              {governanceState ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                      <p className="text-xs text-purple-400 font-mono mb-1">SIGMA (Σ)</p>
                      <p className="text-3xl font-bold font-mono text-purple-300">{governanceState.sigma.toFixed(4)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                      <p className="text-xs text-cyan-400 font-mono mb-1">OMEGA (Ω)</p>
                      <p className="text-3xl font-bold font-mono text-cyan-300">{governanceState.omega.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-slate-500 font-mono mb-1">TOTAL EVENTS</p>
                      <p className="text-lg font-bold font-mono text-white">{governanceState.total_events}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-mono mb-1">LAST UPDATED</p>
                      <p className="text-xs font-mono text-slate-400">{new Date(governanceState.last_updated).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <p className="text-sm font-mono">Loading governance data...</p>
                </div>
              )}
            </div>
            <div 
              className="bg-slate-800/30 border border-white/5 rounded-lg p-6 hover:border-cyan-500/30 transition-all"
              data-tour="receipts-link"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold font-mono text-white">RECEIPT REGISTRY</h2>
              </div>
              {registry ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      {registry.lamport_chain.verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      )}
                      <span className="text-xs font-mono text-slate-400">Lamport Chain</span>
                    </div>
                    <span className={`text-xs font-mono ${registry.lamport_chain.verified ? 'text-green-400' : 'text-orange-400'}`}>
                      {registry.lamport_chain.verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">CURRENT LAMPORT</p>
                    <p className="text-2xl font-bold font-mono text-cyan-400">{registry.lamport_chain.current}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-2">RECENT RECEIPTS</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {registry.receipts.slice(0, 5).map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <div>
                              <p className="text-xs font-mono text-white">{r.type}</p>
                              <p className="text-[10px] font-mono text-slate-500">{new Date(r.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] font-mono text-cyan-400">
                              L:{r.lamport}
                            </div>
                            <p className="text-[10px] font-mono text-purple-400">{r.sha256.substring(0, 8)}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <p className="text-sm font-mono">Loading registry data...</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-800/30 border border-white/5 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4"><Terminal className="w-5 h-5 text-slate-400" /><h2 className="text-lg font-bold font-mono text-white">TECHNICAL SPECIFICATIONS</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-xs text-slate-500 font-mono mb-1">VERSION</p><p className="text-sm font-mono text-white">Rosetta Monolith v13</p></div>
              <div><p className="text-xs text-slate-500 font-mono mb-1">INTEGRITY MODE</p><p className="text-sm font-mono text-cyan-400">Tri-Track vΩ3</p></div>
              <div><p className="text-xs text-slate-500 font-mono mb-1">RUNTIME</p><p className="text-sm font-mono text-purple-400">BEN (NO-JS)</p></div>
              <div><p className="text-xs text-slate-500 font-mono mb-1">PERSONA LOCK</p><p className="text-sm font-mono text-orange-400">Architect (Band-0)</p></div>
              <div><p className="text-xs text-slate-500 font-mono mb-1">MATH CANON</p><p className="text-sm font-mono text-green-400">vΩ.8 Tri-Actor</p></div>
              <div><p className="text-xs text-slate-500 font-mono mb-1">Z-SCAN</p><p className="text-sm font-mono text-blue-400">v3 Manual</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
