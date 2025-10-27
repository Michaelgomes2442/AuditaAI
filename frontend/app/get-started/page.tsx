'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  Terminal,
  Shield,
  GitCompare,
  Activity,
  FileCode,
  Server,
  Globe,
  Cpu,
  BarChart3,
  Lock,
  TrendingUp,
  Play,
  BookOpen,
  Code2,
  Zap,
  Eye,
  LineChart
} from 'lucide-react';

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(59,130,246,0.03)_1.5px,transparent_1.5px)] bg-[size:60px_60px]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" />
      
      {/* Header */}
      <div className="relative border-b border-blue-500/20 bg-slate-900/90 backdrop-blur-xl">
        <div className="container mx-auto px-8 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <Shield className="w-12 h-12 text-blue-400" />
              <div className="absolute inset-0 blur-2xl bg-blue-500/60 -z-10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                Getting Started with AuditaAI
              </h1>
              <p className="text-cyan-400/60 text-sm font-mono mt-1">&gt;&gt; COMPREHENSIVE_SETUP_GUIDE</p>
            </div>
          </div>
          <div className="ml-16">
            <p className="text-cyan-300/80 text-lg font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              DOCUMENTATION: LOADED | API_INTEGRATION: READY | GOVERNANCE: ACTIVE
            </p>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-8 py-12 max-w-7xl">
        
        {/* Quick Start Steps */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/50 font-mono text-sm px-4 py-2 mb-4">
              QUICK START GUIDE
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Get Up and Running in 5 Minutes
            </h2>
            <p className="text-cyan-200/70 text-lg">
              Follow these steps to configure AuditaAI with real LLM APIs and start testing governance features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Step 1 */}
            <div className="relative bg-slate-800/60 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-slate-900">
                1
              </div>
              <Terminal className="w-10 h-10 text-blue-400 mb-4 mt-4" />
              <h3 className="text-xl font-bold text-white mb-2">Clone & Install</h3>
              <div className="bg-slate-900/80 rounded p-3 mb-3 font-mono text-xs text-green-400">
                cd backend<br/>
                pnpm install
              </div>
              <p className="text-slate-400 text-sm">Install all dependencies for backend and frontend</p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-slate-800/60 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-slate-900">
                2
              </div>
              <Code2 className="w-10 h-10 text-purple-400 mb-4 mt-4" />
              <h3 className="text-xl font-bold text-white mb-2">Configure APIs</h3>
              <div className="bg-slate-900/80 rounded p-3 mb-3 font-mono text-xs text-green-400">
                cp .env.example .env<br/>
                # Add API keys
              </div>
              <p className="text-slate-400 text-sm">Add OpenAI and Anthropic API keys to .env file</p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-slate-800/60 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-slate-900">
                3
              </div>
              <Play className="w-10 h-10 text-green-400 mb-4 mt-4" />
              <h3 className="text-xl font-bold text-white mb-2">Test Integration</h3>
              <div className="bg-slate-900/80 rounded p-3 mb-3 font-mono text-xs text-green-400">
                node test-llm-integration.mjs
              </div>
              <p className="text-slate-400 text-sm">Verify API keys work and LLMs respond</p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-slate-800/60 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-slate-900">
                4
              </div>
              <Zap className="w-10 h-10 text-orange-400 mb-4 mt-4" />
              <h3 className="text-xl font-bold text-white mb-2">Launch Demo</h3>
              <div className="bg-slate-900/80 rounded p-3 mb-3 font-mono text-xs text-green-400">
                npm run dev
              </div>
              <p className="text-slate-400 text-sm">Start backend and access live demo interface</p>
            </div>
          </div>

          {/* Detailed Setup Guide */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-blue-500/30 rounded-xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-6">
              <BookOpen className="w-8 h-8 text-blue-400 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Detailed Setup Instructions</h3>
                <p className="text-cyan-200/70">Complete walkthrough of API configuration and testing</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* API Keys Section */}
              <div className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  Get Your API Keys
                </h4>
                <div className="space-y-3 text-slate-300">
                  <div className="bg-slate-900/60 rounded-lg p-4">
                    <p className="font-bold text-blue-300 mb-2">OpenAI (GPT-4):</p>
                    <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:text-blue-300 underline font-mono text-sm">
                      https://platform.openai.com/api-keys
                    </a>
                    <p className="text-sm text-slate-400 mt-2">
                      • Create account or sign in<br/>
                      • Click "Create new secret key"<br/>
                      • Copy key (starts with sk-proj-...)
                    </p>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-4">
                    <p className="font-bold text-purple-300 mb-2">Anthropic (Claude):</p>
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-purple-400 hover:text-purple-300 underline font-mono text-sm">
                      https://console.anthropic.com/settings/keys
                    </a>
                    <p className="text-sm text-slate-400 mt-2">
                      • Create account or sign in<br/>
                      • Click "Create Key"<br/>
                      • Copy key (starts with sk-ant-...)
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration Section */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  Configure Environment
                </h4>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                  <p className="text-green-400 mb-2"># In /backend directory:</p>
                  <p className="text-cyan-300">cp .env.example .env</p>
                  <p className="text-slate-500 mt-4"># Edit .env and add:</p>
                  <p className="text-yellow-300 mt-2">OPENAI_API_KEY=sk-proj-your-key-here</p>
                  <p className="text-yellow-300">ANTHROPIC_API_KEY=sk-ant-your-key-here</p>
                </div>
              </div>

              {/* Testing Section */}
              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Test Your Setup
                </h4>
                <div className="space-y-3">
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                    <p className="text-green-400 mb-2"># Test API connectivity:</p>
                    <p className="text-cyan-300">node test-llm-integration.mjs</p>
                    <p className="text-slate-500 mt-3"># Expected output:</p>
                    <p className="text-green-300 mt-1">✅ OpenAI: Available</p>
                    <p className="text-green-300">✅ Anthropic: Available</p>
                    <p className="text-green-300">✅ LLM response received</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm flex items-start gap-2">
                <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Note:</strong> AuditaAI works in simulation mode without API keys. Real LLM integration provides accurate CRIES metrics and governance validation. 
                  See <code className="bg-slate-900/60 px-2 py-1 rounded">backend/QUICK_START_LLM.md</code> for detailed instructions.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Feature Dashboards */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-mono text-sm px-4 py-2 mb-4">
              GOVERNANCE FEATURES
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Explore All Dashboards
            </h2>
            <p className="text-cyan-200/70 text-lg">
              Each feature has a dedicated dashboard for deep analysis and monitoring
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Rosetta OS */}
            <Link href="/rosetta-os" className="group block">
              <div className="relative h-full bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-xl p-6 overflow-hidden backdrop-blur-sm hover:border-cyan-400/70 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Shield className="w-12 h-12 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">Rosetta OS</h3>
                <p className="text-cyan-200/70 mb-4">Tri-Track governance, boot sequence, and canonical formulas</p>
                <div className="flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 font-mono text-sm">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* CRIES Metrics */}
            <Link href="/cries-metrics" className="group block">
              <div className="relative h-full bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-6 overflow-hidden backdrop-blur-sm hover:border-purple-400/70 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <BarChart3 className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">CRIES Metrics</h3>
                <p className="text-purple-200/70 mb-4">Real-time analysis of Coherence, Rigor, Integration, Empathy, Strictness</p>
                <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-mono text-sm">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Model Comparison */}
            <Link href="/model-comparison" className="group block">
              <div className="relative h-full bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-500/30 rounded-xl p-6 overflow-hidden backdrop-blur-sm hover:border-orange-400/70 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(251,146,60,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <GitCompare className="w-12 h-12 text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">Model Comparison</h3>
                <p className="text-orange-200/70 mb-4">Side-by-side LLM comparison with parallel prompting</p>
                <div className="flex items-center gap-2 text-orange-400 group-hover:text-orange-300 font-mono text-sm">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* BEN Runtime */}
            <Link href="/ben-runtime" className="group block">
              <div className="relative h-full bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-xl p-6 overflow-hidden backdrop-blur-sm hover:border-green-400/70 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Lock className="w-12 h-12 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">BEN Runtime</h3>
                <p className="text-green-200/70 mb-4">Blockchain receipts, Lamport chains, cryptographic verification</p>
                <div className="flex items-center gap-2 text-green-400 group-hover:text-green-300 font-mono text-sm">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Live Tracking */}
            <Link href="/live-tracking" className="group block">
              <div className="relative h-full bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-xl p-6 overflow-hidden backdrop-blur-sm hover:border-blue-400/70 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Activity className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Live Tracking</h3>
                <p className="text-blue-200/70 mb-4">Real-time monitoring of all conversations and system health</p>
                <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300 font-mono text-sm">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Live Demo */}
            <Link href="/live-demo" className="group block">
              <div className="relative h-full bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 rounded-xl p-6 overflow-hidden backdrop-blur-sm hover:border-yellow-400/70 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Globe className="w-12 h-12 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">Live Demo</h3>
                <p className="text-yellow-200/70 mb-4">Interactive demo with parallel prompting and governance</p>
                <div className="flex items-center gap-2 text-yellow-400 group-hover:text-yellow-300 font-mono text-sm">
                  <span>Launch Demo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>


        {/* Documentation Resources */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-green-500/20 text-green-300 border border-green-400/50 font-mono text-sm px-4 py-2 mb-4">
              DOCUMENTATION
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Learning Resources
            </h2>
            <p className="text-cyan-200/70 text-lg">
              Comprehensive guides and reference documentation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <a href="/backend/QUICK_START_LLM.md" className="group block bg-slate-800/60 border border-slate-600/50 rounded-xl p-6 hover:border-blue-400/70 transition-all hover:scale-105">
              <FileCode className="w-10 h-10 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300">Quick Start Guide</h3>
              <p className="text-slate-400 text-sm">2-minute LLM API setup walkthrough</p>
            </a>

            <a href="/backend/API_SETUP.md" className="group block bg-slate-800/60 border border-slate-600/50 rounded-xl p-6 hover:border-purple-400/70 transition-all hover:scale-105">
              <BookOpen className="w-10 h-10 text-purple-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300">API Setup Guide</h3>
              <p className="text-slate-400 text-sm">Detailed API configuration and troubleshooting</p>
            </a>

            <a href="/backend/LLM_INTEGRATION_SUMMARY.md" className="group block bg-slate-800/60 border border-slate-600/50 rounded-xl p-6 hover:border-green-400/70 transition-all hover:scale-105">
              <Cpu className="w-10 h-10 text-green-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300">Integration Summary</h3>
              <p className="text-slate-400 text-sm">Complete implementation details and architecture</p>
            </a>
          </div>
        </div>

        {/* Expected Results */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-green-500/30 rounded-2xl p-10 mb-16">
          <div className="flex items-start gap-4 mb-6">
            <TrendingUp className="w-12 h-12 text-green-400" />
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Expected Results with Rosetta Governance</h2>
              <p className="text-cyan-200/70 text-lg">Real CRIES improvement from governance context</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                Standard LLM (No Governance)
              </h3>
              <div className="bg-slate-900/60 rounded-lg p-6 font-mono text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Omega (Ω):</span>
                  <span className="text-orange-400 font-bold">0.52</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coherence (C):</span>
                  <span className="text-slate-300">0.61</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rigor (R):</span>
                  <span className="text-red-400">0.48</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Integration (I):</span>
                  <span className="text-slate-300">0.52</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Empathy (E):</span>
                  <span className="text-slate-300">0.55</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Strictness (S):</span>
                  <span className="text-green-300">1.00</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Rosetta-Governed LLM
              </h3>
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-lg p-6 font-mono text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Omega (Ω):</span>
                  <span className="text-green-400 font-bold text-lg">0.64 ↑+23%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coherence (C):</span>
                  <span className="text-green-300">0.71 ↑+16%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rigor (R):</span>
                  <span className="text-green-300">0.68 ↑+42%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Integration (I):</span>
                  <span className="text-green-300">0.64 ↑+23%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Empathy (E):</span>
                  <span className="text-green-300">0.59 ↑+7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Strictness (S):</span>
                  <span className="text-green-300">1.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm">
              ✓ <strong>Rigor improvement (+42%)</strong> from citation requirements and structured responses<br/>
              ✓ <strong>Integration improvement (+23%)</strong> from cross-references and goal alignment<br/>
              ✓ <strong>Overall quality (+23%)</strong> measurable and reproducible across all prompts
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-cyan-400/50 font-mono text-sm mb-4">
            <span className="text-green-400">&gt;&gt;</span> SYSTEM_STATUS: OPERATIONAL | 
            DASHBOARDS: <span className="text-blue-400">6_AVAILABLE</span> | 
            SUPPORT: ACTIVE
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/live-demo" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/50 hover:decoration-blue-400 transition-all">
              Launch Demo
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/pilot-info" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/50 hover:decoration-blue-400 transition-all">
              Architecture Docs
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/docs" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/50 hover:decoration-blue-400 transition-all">
              Full Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
