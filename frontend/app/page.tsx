"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  Shield, 
  Zap, 
  Lock, 
  Activity, 
  BarChart3, 
  Cpu, 
  GitCompare,
  ArrowRight,
  CheckCircle2,
  Upload,
  LineChart,
  FileCode,
  Rocket,
  Users,
  Globe,
  TrendingUp,
  User,
  LogOut,
  Settings
} from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();
  const features = [
    {
      icon: Shield,
      title: "Rosetta Cognitive OS",
      description: "Advanced AI governance with Tri-Track integrity model ensuring reliability and security.",
      badge: "CORE TECH",
      color: "from-cyan-500 to-blue-500",
      href: "/rosetta-os"
    },
    {
      icon: BarChart3,
      title: "CRIES Metrics",
      description: "Comprehensive evaluation: Completeness, Reliability, Integrity, Effectiveness, Security.",
      badge: "ANALYTICS",
      color: "from-purple-500 to-pink-500",
      href: "/cries-metrics"
    },
    {
      icon: GitCompare,
      title: "Model Comparison",
      description: "Real-time comparison between standard models and Rosetta-booted implementations.",
      badge: "LIVE DEMO",
      color: "from-orange-500 to-red-500",
      href: "/model-comparison"
    },
    {
      icon: Lock,
      title: "BEN Runtime",
      description: "Blockchain Event Network with deterministic ordering and cryptographic verification.",
      badge: "SECURITY",
      color: "from-green-500 to-emerald-500",
      href: "/ben-runtime"
    },
    {
      icon: TrendingUp,
      title: "Live Tracking",
      description: "Real-time monitoring of governance metrics, receipts, and Z-Scan verification.",
      badge: "MONITORING",
      color: "from-blue-500 to-cyan-500",
      href: "/live-tracking"
    },
    {
      icon: Activity,
      title: "Get Started",
      description: "Complete setup guide with API configuration, testing, and launch instructions.",
      badge: "QUICKSTART",
      color: "from-yellow-500 to-orange-500",
      href: "/get-started"
    }
  ];

  const useCases = [
    {
      icon: Cpu,
      title: "AI Model Governance",
      description: "Deploy LLMs with built-in governance, audit trails, and compliance tracking."
    },
    {
      icon: FileCode,
      title: "Research Labs",
      description: "Experiment with cognitive OS architectures and test governance improvements."
    },
    {
      icon: Upload,
      title: "Model Upload & Boot",
      description: "Import your models, boot with Rosetta OS, and see immediate CRIES improvements."
    },
    {
      icon: LineChart,
      title: "Real-time Analytics",
      description: "Track sigma windows, omega clarity, and Lamport clock ordering in real-time."
    }
  ];

  const stats = [
    { value: "87.3%", label: "Average CRIES Score", trend: "+18.9%" },
    { value: "2.9MB", label: "Rosetta Monolith", trend: "v13 TriTrack" },
    { value: "3-Step", label: "Boot Sequence", trend: "init→lock→handshake" },
    { value: "Band-0", label: "Deterministic", trend: "NO-JS Mode" }
  ];

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

      {/* Content */}
      <div className="relative">
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 relative z-[100]">
          <div className="container mx-auto px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-7 w-7 text-cyan-400" />
                <span className="text-xl font-mono font-bold">Audit<span className="text-cyan-400">a</span>AI</span>
                <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400">
                  v13_ROSETTA
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="#features">
                  <button className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-mono">
                    FEATURES
                  </button>
                </Link>
                <Link href="#demos">
                  <button className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-mono">
                    DEMOS
                  </button>
                </Link>
                <Link href="/docs">
                  <button className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-mono">
                    DOCS
                  </button>
                </Link>
                
                {session ? (
                  // Logged in - show user profile menu
                  <div className="relative group z-[100]">
                    <button className="px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors text-sm font-mono flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{session.user?.name?.split(' ')[0] || 'USER'}</span>
                    </button>
                    
                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                      <div className="p-2 border-b border-white/10">
                        <p className="text-xs font-mono text-slate-400">SIGNED IN AS</p>
                        <p className="text-sm font-mono text-white truncate">{session.user?.email}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/profile">
                          <button className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-white/5 rounded flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>PROFILE</span>
                          </button>
                        </Link>
                        <Link href="/demo">
                          <button className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-white/5 rounded flex items-center space-x-2">
                            <Activity className="h-4 w-4" />
                            <span>DEMO</span>
                          </button>
                        </Link>
                        <Link href="/lab">
                          <button className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-white/5 rounded flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>LAB</span>
                          </button>
                        </Link>
                        <button 
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-red-500/10 text-red-400 rounded flex items-center space-x-2 border-t border-white/10 mt-1 pt-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>SIGN OUT</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Not logged in - show sign in button
                  <Link href="/signin">
                    <button className="px-4 py-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors text-sm font-mono">
                      SIGN IN
                    </button>
                  </Link>
                )}
                
                <Link href="/get-started">
                  <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition-colors text-sm font-mono font-bold">
                    GET STARTED
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sm font-mono text-cyan-400">POWERED BY ROSETTA COGNITIVE OS</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-mono font-bold leading-tight">
                AI Governance
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mt-2">
                  Reimagined
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 leading-relaxed">
                Deploy AI models with enterprise-grade governance, real-time auditing, 
                and cryptographic verification. AuditaAI brings transparency and trust 
                to your AI infrastructure.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {!session ? (
                  <>
                    <Link href="/signup">
                      <button className="group w-full sm:w-auto px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-mono font-bold transition-all flex items-center justify-center">
                        START FREE TRIAL
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                    <Link href="/walkthrough">
                      <button className="group w-full sm:w-auto px-8 py-4 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-white/5 font-mono font-bold transition-all flex items-center justify-center">
                        <Rocket className="mr-2 h-5 w-5" />
                        INTERACTIVE WALKTHROUGH
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/pilot">
                      <button className="group w-full sm:w-auto px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-mono font-bold transition-all flex items-center justify-center">
                        GO TO PILOT DASHBOARD
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                    <Link href="/profile">
                      <button className="group w-full sm:w-auto px-8 py-4 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-white/5 font-mono font-bold transition-all flex items-center justify-center">
                        <User className="mr-2 h-5 w-5" />
                        VIEW PROFILE
                      </button>
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-6 text-sm font-mono">
                <div className="flex items-center text-green-400">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  NO CREDIT CARD
                </div>
                <div className="flex items-center text-green-400">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  OPEN SOURCE
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Holographic Card */}
              <div className="relative p-8 rounded-2xl bg-slate-800/50 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-500 group">
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity" />
                
                {/* Content */}
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-mono font-bold">SYSTEM STATUS</h3>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-mono text-green-400">OPERATIONAL</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {stats.map((stat, i) => (
                      <div key={i} className="p-4 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-mono font-bold text-cyan-400">{stat.value}</div>
                            <div className="text-sm font-mono text-slate-400">{stat.label}</div>
                          </div>
                          <div className="px-3 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-sm font-mono text-green-400">
                            {stat.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How CRIES Works Section */}
        <section className="container mx-auto px-8 py-16 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
                <span className="text-sm font-mono text-cyan-400">METHODOLOGY</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-mono font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                HOW CRIES METRICS ARE CALCULATED
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Each AI model is evaluated by our <span className="text-cyan-400 font-bold">Track-C Executor</span> (LLM-powered analyzer) 
                across five critical dimensions. Here's how it works:
              </p>
            </div>

            {/* Flow Diagram */}
            <div className="mb-12">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 border border-purple-400/30">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <div className="font-mono font-bold text-white">1. Model Input</div>
                    <div className="text-sm text-slate-400">Upload your AI model</div>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-cyan-400 rotate-90 md:rotate-0" />

                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 border border-cyan-400/30">
                    <Cpu className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <div className="font-mono font-bold text-white">2. Track-C Executor</div>
                    <div className="text-sm text-slate-400">LLM analyzer evaluates</div>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-cyan-400 rotate-90 md:rotate-0" />

                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 border border-green-400/30">
                    <Activity className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <div className="font-mono font-bold text-white">3. CRIES Score</div>
                    <div className="text-sm text-slate-400">5 dimensions calculated</div>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-cyan-400 rotate-90 md:rotate-0" />

                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 border border-orange-400/30">
                    <Lock className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <div className="font-mono font-bold text-white">4. Audit Receipt</div>
                    <div className="text-sm text-slate-400">Cryptographic proof</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CRIES Dimensions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  letter: 'C',
                  title: 'Completeness',
                  color: 'from-blue-500 to-cyan-500',
                  definition: 'Does the model provide comprehensive, thorough responses?',
                  calculation: 'Track-C LLM analyzes response coverage, missing elements, and depth of information.'
                },
                {
                  letter: 'R',
                  title: 'Reliability',
                  color: 'from-green-500 to-emerald-500',
                  definition: 'Can the model consistently produce accurate results?',
                  calculation: 'Evaluates consistency across multiple runs, error rates, and output stability.'
                },
                {
                  letter: 'I',
                  title: 'Integrity',
                  color: 'from-purple-500 to-pink-500',
                  definition: 'Does the model maintain ethical boundaries and alignment?',
                  calculation: 'Checks for hallucinations, bias, toxic content, and alignment with intended behavior.'
                },
                {
                  letter: 'E',
                  title: 'Effectiveness',
                  color: 'from-orange-500 to-yellow-500',
                  definition: 'How well does the model accomplish its intended task?',
                  calculation: 'Measures task completion rate, relevance of outputs, and goal achievement.'
                },
                {
                  letter: 'S',
                  title: 'Security',
                  color: 'from-red-500 to-orange-500',
                  definition: 'Is the model resistant to adversarial attacks and prompt injection?',
                  calculation: 'Tests for prompt injection vulnerabilities, jailbreak resistance, and data leakage.'
                }
              ].map((dimension, idx) => (
                <div key={idx} className="group p-6 rounded-xl bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all hover:scale-105">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${dimension.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl font-mono font-bold">{dimension.letter}</span>
                  </div>
                  <h3 className="text-lg font-mono font-bold mb-2 text-white">{dimension.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{dimension.definition}</p>
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs font-mono text-cyan-400 mb-1">CALCULATION:</div>
                    <p className="text-xs text-slate-500">{dimension.calculation}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Example Output */}
            <div className="mt-12 p-8 rounded-xl bg-slate-900 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-mono font-bold text-cyan-400">EXAMPLE CRIES OUTPUT</h3>
                <div className="px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-sm font-mono text-green-400">
                  VERIFIED
                </div>
              </div>
              <div className="font-mono text-sm space-y-1">
                <div className="text-slate-500">// Track-C Executor Analysis Results</div>
                <div className="text-white">{'{'}</div>
                <div className="pl-4 text-blue-400">"completeness": <span className="text-green-400">0.87</span>,</div>
                <div className="pl-4 text-blue-400">"reliability": <span className="text-green-400">0.92</span>,</div>
                <div className="pl-4 text-blue-400">"integrity": <span className="text-green-400">0.85</span>,</div>
                <div className="pl-4 text-blue-400">"effectiveness": <span className="text-green-400">0.89</span>,</div>
                <div className="pl-4 text-blue-400">"security": <span className="text-green-400">0.91</span>,</div>
                <div className="pl-4 text-purple-400">"overall": <span className="text-cyan-400">0.888</span>,</div>
                <div className="pl-4 text-slate-500">"improvement_vs_baseline": <span className="text-yellow-400">"+18.9%"</span></div>
                <div className="text-white">{'}'}</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/pilot">
                <button className="px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-mono font-bold transition-all inline-flex items-center">
                  RUN CRIES ANALYSIS ON YOUR MODEL
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <span className="text-sm font-mono text-purple-400">CORE FEATURES</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-mono font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                EVERYTHING FOR AI GOVERNANCE
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Built on the Rosetta Monolith with comprehensive tooling for model deployment, 
                monitoring, and compliance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <Link key={i} href={feature.href as any}>
                  <div
                    className="group relative p-6 rounded-xl bg-slate-800/50 border border-white/10 backdrop-blur-sm hover:bg-slate-800/80 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full"
                  >
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`} />
                    
                    {/* Content */}
                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} bg-opacity-10`}>
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-slate-400">
                          {feature.badge}
                        </div>
                      </div>
                      <h3 className="text-xl font-mono font-bold">{feature.title}</h3>
                      <p className="text-slate-400">{feature.description}</p>
                      <div className="flex items-center text-sm font-mono text-cyan-400 group-hover:text-cyan-300 transition-colors">
                        <span>Explore Dashboard</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Demos Section */}
        <section id="demos" className="container mx-auto px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
                <span className="text-sm font-mono text-orange-400">INTERACTIVE DEMOS</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-mono font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                SEE AUDITAAI IN ACTION
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Explore our research labs and pilot demos with real-time model comparison
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Pilot Demo Card */}
              <div className="group relative p-8 rounded-2xl bg-slate-800/50 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 blur-2xl transition-opacity" />
                
                <div className="relative space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
                      <Zap className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-mono font-bold">PILOT DEMO</h3>
                      <p className="text-sm font-mono text-slate-400">Test governance improvements</p>
                    </div>
                  </div>

                  <p className="text-slate-300">
                    Run live governance tests on AI models. See CRIES metrics improve in real-time 
                    as Rosetta OS optimizes model behavior.
                  </p>

                  <div className="space-y-2">
                    {['Start/Stop/Reset controls', 'Real-time metric tracking', 'Δ-Receipt generation'].map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm font-mono text-slate-400">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Link href="/pilot">
                    <button className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-mono font-bold transition-all flex items-center justify-center group/btn">
                      LAUNCH PILOT DEMO
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Live Demo Card */}
              <div className="group relative p-8 rounded-2xl bg-slate-800/50 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 blur-2xl transition-opacity" />
                
                <div className="relative space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                      <Rocket className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-mono font-bold">LIVE APPLICATION</h3>
                      <p className="text-sm font-mono text-slate-400">Upload & compare models</p>
                    </div>
                  </div>

                  <p className="text-slate-300">
                    Import your own models, boot them with Rosetta OS, and see detailed 
                    CRIES comparisons with governance enhancements.
                  </p>

                  <div className="space-y-2">
                    {['Model import & upload', 'Rosetta boot sequence', 'Side-by-side comparison'].map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm font-mono text-slate-400">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Link href="/live-demo">
                    <button className="w-full px-6 py-3 rounded-lg border border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 font-mono font-bold transition-all flex items-center justify-center group/btn">
                      LAUNCH LIVE DEMO
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {useCases.map((useCase, i) => (
                <div key={i} className="p-6 rounded-xl bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all">
                  <useCase.icon className="h-8 w-8 text-cyan-400 mb-4" />
                  <h4 className="text-lg font-mono font-bold mb-2">{useCase.title}</h4>
                  <p className="text-sm text-slate-400">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Specs Section */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-2">
                  <span className="text-sm font-mono text-green-400">TECHNICAL SPECS</span>
                </div>
                <h2 className="text-4xl font-mono font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  PROVEN TECHNOLOGY
                </h2>
                <p className="text-lg text-slate-300">
                  AuditaAI is powered by the Rosetta Monolith v13 TriTrack vΩ3, a comprehensive 
                  cognitive operating system designed for enterprise AI governance.
                </p>
                
                <div className="space-y-4">
                  {[
                    { title: "Tri-Track Integrity Model", desc: "Track-A (Analyst), Track-B (Governor), Track-C (Executor) for complete governance" },
                    { title: "Math Canon vΩ.8", desc: "Proven formulas for sigma windows and omega clarity calculations" },
                    { title: "Z-Scan Verification", desc: "6-point verification checklist for structural integrity and compliance" },
                    { title: "Cryptographic Receipts", desc: "SHA-256 hashing, Lamport clocks, and immutable audit trails" }
                  ].map((spec, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/50 border border-white/5">
                      <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-mono font-bold text-cyan-400">{spec.title}</div>
                        <div className="text-sm text-slate-400 mt-1">{spec.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/lab">
                  <button className="px-8 py-4 rounded-lg bg-green-500 hover:bg-green-600 font-mono font-bold transition-all flex items-center group">
                    VIEW RESEARCH DASHBOARD
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              <div className="p-8 rounded-2xl bg-slate-950 border border-white/10 font-mono text-sm">
                <div className="space-y-2">
                  <div className="text-green-400">$ ./test-rosetta-boot.sh</div>
                  <div className="text-slate-300">⚡ Initiating Rosetta Boot Sequence...</div>
                  <div className="text-slate-300">📚 Rosetta Monolith loaded (2,915,552 bytes)</div>
                  <div className="text-blue-400 pl-4">SHA-256: 4cee4082cc722844...</div>
                  <div className="text-slate-300">🔧 BEN Runtime initialized</div>
                  <div className="text-purple-400 pl-4">Boot sequence: init → identity_lock → handshake</div>
                  <div className="text-slate-300">✅ Δ-BOOTCONFIRM emitted</div>
                  <div className="text-green-400">📈 Overall improvement: +18.9%</div>
                  <div className="text-slate-300">🔍 Z-Scan verification: <span className="text-green-400">PASSED</span></div>
                  <div className="text-slate-600 mt-4">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                  <div className="text-yellow-400">✓ Rosetta Boot Sequence Verified</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!session && (
          <section className="container mx-auto px-8 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="relative p-12 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 opacity-10 blur-2xl" />
                
                <div className="relative space-y-6">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-4">
                    <span className="text-sm font-mono text-cyan-400">GET STARTED TODAY</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-mono font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                    REVOLUTIONIZE AI GOVERNANCE
                  </h2>
                  <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                    Join organizations using AuditaAI to deploy AI models with confidence, 
                    transparency, and enterprise-grade security.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/signup">
                      <button className="px-8 py-4 rounded-lg bg-cyan-500 hover:bg-cyan-600 font-mono font-bold transition-all flex items-center group">
                        CREATE FREE ACCOUNT
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                    <Link href="/pilot">
                      <button className="px-8 py-4 rounded-lg border border-white/20 hover:border-cyan-500/50 hover:bg-white/5 font-mono font-bold transition-all">
                        TRY PILOT DEMO
                      </button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-center space-x-8 text-sm font-mono pt-4">
                    <div className="flex items-center text-slate-400">
                      <Users className="h-4 w-4 mr-2" />
                      23+ ACTIVE USERS
                    </div>
                    <div className="flex items-center text-slate-400">
                      <Globe className="h-4 w-4 mr-2" />
                      OPEN SOURCE
                    </div>
                    <div className="flex items-center text-slate-400">
                      <Shield className="h-4 w-4 mr-2" />
                      ENTERPRISE READY
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/10 py-12">
          <div className="container mx-auto px-8">
            <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-cyan-400" />
                  <span className="text-lg font-mono font-bold">AuditaAI</span>
                </div>
                <p className="text-sm text-slate-400 font-mono">
                  Enterprise AI governance powered by Rosetta Cognitive OS
                </p>
              </div>
              <div>
                <h3 className="font-mono font-bold mb-4 text-cyan-400">PRODUCT</h3>
                <ul className="space-y-2 text-sm font-mono text-slate-400">
                  <li><Link href="/pilot" className="hover:text-white">Pilot Demo</Link></li>
                  <li><Link href="/live-demo" className="hover:text-white">Live Demo</Link></li>
                  <li><Link href="/lab" className="hover:text-white">Research Lab</Link></li>
                  <li><Link href="/logs" className="hover:text-white">Audit Logs</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-mono font-bold mb-4 text-purple-400">RESOURCES</h3>
                <ul className="space-y-2 text-sm font-mono text-slate-400">
                  <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                  <li><a href="/ROSETTA_IMPLEMENTATION.md" className="hover:text-white">Implementation</a></li>
                  <li><a href="/PILOT_ARCHITECTURE.md" className="hover:text-white">Architecture</a></li>
                  <li><Link href="/api" className="hover:text-white">API Reference</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-mono font-bold mb-4 text-orange-400">COMPANY</h3>
                <ul className="space-y-2 text-sm font-mono text-slate-400">
                  <li><Link href="/about" className="hover:text-white">About</Link></li>
                  {!session && (
                    <>
                      <li><Link href="/signin" className="hover:text-white">Sign In</Link></li>
                      <li><Link href="/signup" className="hover:text-white">Sign Up</Link></li>
                    </>
                  )}
                  {session && (
                    <>
                      <li><Link href="/pilot" className="hover:text-white">Pilot Dashboard</Link></li>
                      <li><Link href="/profile" className="hover:text-white">Profile</Link></li>
                    </>
                  )}
                  <li><Link href="/get-started" className="hover:text-white">Get Started</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm font-mono text-slate-400">
                <span>© 2025 AuditaAI</span>
                <span className="text-slate-600">|</span>
                <span>Powered by Rosetta Monolith v13 TriTrack vΩ3</span>
                <span className="text-slate-600">|</span>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse mr-2" />
                  <span className="text-green-400">ALL SYSTEMS OPERATIONAL</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
