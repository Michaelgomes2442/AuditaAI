'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Zap, Sparkles, Lock, Crown, Play, Copy, Check } from 'lucide-react';
import AuthNav from '@/components/AuthNav';
import Link from 'next/link';

interface UserProfile {
  tier?: string;
  role?: string;
}

interface DemoPrompt {
  id: string;
  category: string;
  title: string;
  prompt: string;
  description: string;
}

interface ModelResult {
  model: string;
  output: string;
  criesScore: number;
  completeness: number;
  reliability: number;
  integrity: number;
  effectiveness: number;
  security: number;
  executionTime: number;
}

const PREDEFINED_PROMPTS: DemoPrompt[] = [
  {
    id: 'code-review',
    category: 'Code Analysis',
    title: 'Security Code Review',
    prompt: 'Review this authentication function for security vulnerabilities:\n\nfunction login(username, password) {\n  const query = `SELECT * FROM users WHERE username=\'${username}\' AND password=\'${password}\'`;\n  return db.execute(query);\n}',
    description: 'Analyze code for SQL injection and security issues'
  },
  {
    id: 'data-analysis',
    category: 'Data Science',
    title: 'Sales Data Insights',
    prompt: 'Analyze quarterly sales data and identify trends:\nQ1: $125K, Q2: $148K, Q3: $132K, Q4: $167K\nProduct categories: Electronics (40%), Clothing (25%), Home (20%), Other (15%)',
    description: 'Extract insights and patterns from business data'
  },
  {
    id: 'creative-writing',
    category: 'Creative',
    title: 'Marketing Copy',
    prompt: 'Write compelling product copy for an AI-powered audit platform that ensures governance and compliance through blockchain-verified event logs.',
    description: 'Generate engaging marketing content'
  },
  {
    id: 'technical-doc',
    category: 'Documentation',
    title: 'API Documentation',
    prompt: 'Document this REST API endpoint:\nPOST /api/audit/verify\nBody: { "eventId": string, "signature": string }\nReturns: { "valid": boolean, "lamportClock": number, "criesScore": object }',
    description: 'Create clear technical documentation'
  },
  {
    id: 'problem-solving',
    category: 'Logic',
    title: 'Algorithm Optimization',
    prompt: 'Optimize this sorting algorithm for better time complexity:\n\nfunction bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}',
    description: 'Improve algorithm efficiency and performance'
  },
  {
    id: 'compliance',
    category: 'Governance',
    title: 'GDPR Compliance Check',
    prompt: 'Review this data collection form for GDPR compliance:\n- Email (required)\n- Full name (required)\n- Phone number (optional)\n- Date of birth (required)\n- Marketing consent (pre-checked)\n- Data stored indefinitely',
    description: 'Ensure regulatory compliance'
  }
];

const DEMO_MODELS = [
  { id: 'standard', name: 'Standard GPT-4', color: 'from-slate-500 to-slate-600' },
  { id: 'rosetta', name: 'Rosetta-Booted GPT-4', color: 'from-cyan-500 to-blue-500' }
];

export default function DemoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<DemoPrompt | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Determine if user is free tier (only after profile is loaded)
  const isFree = profile?.tier === 'FREE';
  const isPaid = profile?.tier === 'PAID' || profile?.tier === 'ARCHITECT' || profile?.role === 'ARCHITECT' || profile?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile({ tier: data.tier, role: data.role });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handlePromptSelect = (prompt: DemoPrompt) => {
    setSelectedPrompt(prompt);
    setCustomPrompt(prompt.prompt);
    setResults([]);
  };

  const handleRunDemo = async () => {
    if (!customPrompt.trim()) return;

    setIsRunning(true);
    setResults([]);

    try {
      const response = await fetch('/api/demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          models: DEMO_MODELS.map(m => m.id)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Error running demo:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

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

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-900" />

      <div className="relative">
        <AuthNav />

        <div className="container mx-auto px-8 py-12 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-mono text-cyan-400">
                {isFree ? 'FREE DEMO' : 'FULL ACCESS DEMO'}
              </span>
            </div>
            <h1 className="text-4xl font-mono font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              Interactive Demo
            </h1>
            <p className="text-slate-300 text-sm mt-2 font-mono">
              {isFree 
                ? 'Try predefined prompts to see Rosetta governance in action'
                : 'Full access: Use your own prompts and compare any models'
              }
            </p>
          </div>

          {/* Tier Badge */}
          {isFree && (
            <div className="mb-6 p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-orange-400 mt-0.5" />
                  <div>
                    <h3 className="font-mono font-bold text-orange-400 mb-1">Free Demo Mode</h3>
                    <p className="text-sm text-slate-300 mb-2">
                      You're using predefined prompts. Upgrade to unlock custom prompts, model uploads, and full API access.
                    </p>
                    <Link href="/pricing">
                      <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all text-sm font-mono font-bold">
                        <Crown className="h-4 w-4" />
                        <span>UPGRADE TO PAID</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Prompt Selection */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
                <h2 className="text-lg font-mono font-bold mb-4 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  <span>Example Prompts</span>
                </h2>
                <div className="space-y-2">
                  {PREDEFINED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handlePromptSelect(prompt)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedPrompt?.id === prompt.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-white/10 hover:border-cyan-500/50 bg-white/5'
                      }`}
                    >
                      <div className="text-xs font-mono text-cyan-400 mb-1">{prompt.category}</div>
                      <div className="font-mono font-bold text-sm mb-1">{prompt.title}</div>
                      <div className="text-xs text-slate-400">{prompt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {isPaid && (
                <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Crown className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-mono font-bold text-green-400">PAID ACCESS</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    You can edit any prompt or write your own custom prompts in the editor.
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Prompt Editor & Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prompt Editor */}
              <div className="p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-mono font-bold">Prompt Editor</h2>
                  <button
                    onClick={handleRunDemo}
                    disabled={isRunning || !customPrompt.trim()}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono font-bold text-sm"
                  >
                    <Play className="h-4 w-4" />
                    <span>{isRunning ? 'RUNNING...' : 'RUN DEMO'}</span>
                  </button>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => isPaid && setCustomPrompt(e.target.value)}
                  readOnly={isFree}
                  placeholder={isFree ? 'Select a prompt from the left panel...' : 'Enter your custom prompt here...'}
                  className={`w-full h-48 p-4 rounded-lg border font-mono text-sm resize-none ${
                    isFree
                      ? 'border-white/10 bg-slate-800/50 cursor-not-allowed'
                      : 'border-white/10 bg-slate-800/50 focus:border-cyan-500 focus:outline-none'
                  }`}
                />
                {isFree && (
                  <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>Custom prompts available in paid tier</span>
                  </p>
                )}
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result, idx) => {
                    const model = DEMO_MODELS[idx];
                    return (
                      <div key={result.model} className="p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-mono font-bold bg-gradient-to-r ${model.color} bg-clip-text text-transparent`}>
                            {model.name}
                          </h3>
                          <button
                            onClick={() => handleCopy(result.output, result.model)}
                            className="p-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors"
                          >
                            {copiedId === result.model ? (
                              <Check className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                        </div>

                        {/* CRIES Score */}
                        <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-white/10">
                          <div className="text-xs font-mono text-slate-400 mb-2">CRIES SCORE</div>
                          <div className="text-2xl font-mono font-bold text-cyan-400 mb-2">
                            {(result.criesScore * 100).toFixed(1)}%
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-xs">
                            <div>
                              <div className="text-slate-500">C</div>
                              <div className="font-mono">{(result.completeness * 100).toFixed(0)}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">R</div>
                              <div className="font-mono">{(result.reliability * 100).toFixed(0)}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">I</div>
                              <div className="font-mono">{(result.integrity * 100).toFixed(0)}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">E</div>
                              <div className="font-mono">{(result.effectiveness * 100).toFixed(0)}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">S</div>
                              <div className="font-mono">{(result.security * 100).toFixed(0)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Output */}
                        <div className="mb-3">
                          <div className="text-xs font-mono text-slate-400 mb-2">OUTPUT</div>
                          <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {result.output}
                          </div>
                        </div>

                        {/* Execution Time */}
                        <div className="text-xs font-mono text-slate-500">
                          Execution: {result.executionTime}ms
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {results.length === 0 && !isRunning && (
                <div className="p-12 rounded-lg border border-dashed border-white/10 text-center">
                  <Zap className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-mono">
                    {selectedPrompt 
                      ? 'Click "RUN DEMO" to see the comparison'
                      : 'Select a prompt to get started'
                    }
                  </p>
                </div>
              )}

              {isRunning && (
                <div className="p-12 rounded-lg border border-white/10 bg-white/5 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-slate-400 font-mono">Running models...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
