"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Zap, Brain, Network, Scale, Eye, Award, GitBranch, FileText, Clock, Activity, Cpu, Terminal, Calculator, ArrowLeft, Database, Users, Layers, Lock, GitMerge, Globe } from "lucide-react";
import { useRouter } from 'next/navigation';
import UpgradeModal from "@/components/UpgradeModal";

export default function LabPage() {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const modules = [
    {
      id: "receipts",
      icon: FileText,
      title: "Δ-Receipts Registry",
      subtitle: "Live Audit Trail",
      description: "Real encrypted receipt ledger from /receipts directory. View, verify, and audit governance events.",
      status: "ACTIVE",
      color: "from-cyan-500 to-blue-500",
      href: "/lab/receipts"
    },
    {
      id: "lamport",
      icon: Clock,
      title: "Lamport Chain",
      subtitle: "Causal Ordering",
      description: "Distributed logical clock from registry.json. Track happens-before relationships.",
      status: "ACTIVE",
      color: "from-purple-500 to-pink-500",
      href: "/lab/lamport"
    },
    {
      id: "math",
      icon: Calculator,
      title: "Math Canon vΩ.8",
      subtitle: "Sigma/Omega",
      description: "Real-time Sigma (σ) and Omega (Ω) calculations from Rosetta Math Canon with Tri-Track weighted averages.",
      status: "ACTIVE",
      color: "from-orange-500 to-yellow-500",
      href: "/lab/math"
    },
    {
      id: "cries",
      icon: Activity,
      title: "CRIES Analytics",
      subtitle: "Live Metrics",
      description: "Real Completeness, Reliability, Integrity, Effectiveness, Security from rosetta-boot.js.",
      status: "ACTIVE",
      color: "from-green-500 to-emerald-500",
      href: "/live-demo"
    },
    {
      id: "qtrace",
      icon: Database,
      title: "Q-Trace v1.1",
      subtitle: "Causal Provenance",
      description: "Band-2 meta-governance engine with sharded Lamport chains, Merkle checkpoints, and 2-of-3 witness quorum.",
      status: "RESEARCH",
      color: "from-violet-500 to-purple-500",
      href: "/lab/qtrace"
    },
    {
      id: "witness",
      icon: Users,
      title: "Witness System",
      subtitle: "Cross-Model Consensus",
      description: "Multi-LLM witness consensus (GPT-5, Claude, Gemini, Mistral). Claim/Consensus/Divergence receipts v3.21-v3.23.",
      status: "RESEARCH",
      color: "from-pink-500 to-rose-500",
      href: "/lab/witness"
    },
    {
      id: "bands",
      icon: Layers,
      title: "Band Architecture",
      subtitle: "0-Z Governance Stack",
      description: "Band-0 (Core), Band-1 (Adaptive), Band-2 (Meta), Band-5 (CMW), Band-8 (Mesh), Band-Z (Audit Kernel).",
      status: "RESEARCH",
      color: "from-amber-500 to-orange-500",
      href: "/lab/bands"
    },
    {
      id: "persona",
      icon: Lock,
      title: "Persona Loco",
      subtitle: "Identity Lock",
      description: "Cold boot preamble with role-based access (Architect/Auditor/Witness). Fail-closed security model.",
      status: "RESEARCH",
      color: "from-red-500 to-pink-500",
      href: "/lab/persona"
    },
    {
      id: "receipts-advanced",
      icon: GitMerge,
      title: "Advanced Receipts",
      subtitle: "v3.12-v3.38",
      description: "Audit Sign/Attest/Verify, Policy tuning, ERL/Ethics metrics, Risk gates, Consent management.",
      status: "RESEARCH",
      color: "from-teal-500 to-cyan-500",
      href: "/lab/receipts-advanced"
    },
    {
      id: "mesh",
      icon: Globe,
      title: "Mesh & Replica",
      subtitle: "Distributed Audit",
      description: "Audit Mesh (AMESH) with peer announce/exchange, mesh consensus/divergence, replica promotion v3.29-v3.36.",
      status: "RESEARCH",
      color: "from-lime-500 to-green-500",
      href: "/lab/mesh"
    },
    {
      id: "tritrack",
      icon: Network,
      title: "Tri-Track Governance",
      subtitle: "A/B/C Architecture",
      description: "Track-A Analyst, Track-B Governor, Track-C Executor from Tri-Track model.",
      status: "ACTIVE",
      color: "from-orange-500 to-red-500",
      href: "/pilot"
    },
    {
      id: "ben",
      icon: Cpu,
      title: "BEN Runtime",
      subtitle: "Boot Sequence",
      description: "Blockchain Event Network from ben_governance. Boot confirmations and runtime state.",
      status: "ACTIVE",
      color: "from-indigo-500 to-purple-500",
      href: "/lab/receipts"
    },
    {
      id: "live-demo",
      icon: Zap,
      title: "Live Demo",
      subtitle: "Parallel Prompting",
      description: "Real-time model comparison with Rosetta Cognitive OS boot. See CRIES improvements live.",
      status: "ACTIVE",
      color: "from-purple-500 to-blue-500",
      href: "/live-demo"
    },
    {
      id: "pilot",
      icon: Shield,
      title: "Pilot Dashboard",
      subtitle: "Production Monitor",
      description: "Enterprise pilot deployment with cloud models and complete governance monitoring.",
      status: "ACTIVE",
      color: "from-cyan-500 to-teal-500",
      href: "/pilot"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

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
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
          <div className="container mx-auto px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <Shield className="h-7 w-7 text-cyan-400" />
                <span className="text-xl font-mono font-bold">Audit<span className="text-cyan-400">a</span>AI</span>
              </Link>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-mono text-sm">Back</span>
                </button>
                <div className="flex items-center space-x-1 text-sm font-mono">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400">LAB ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="container mx-auto px-8 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Brain className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-mono text-cyan-400">AUDITAAI LAB</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-mono font-bold leading-tight">
              The Pinnacle of <span className="text-cyan-400">AI Governance</span>
            </h1>
            
            <p className="text-xl text-slate-300 font-mono leading-relaxed max-w-2xl mx-auto">
              Advanced research modules for regulatory synthesis, meta-governance, 
              risk quantification, and adaptive intelligence.
            </p>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="container mx-auto px-4 sm:px-6 md:px-8 pb-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-tour="lab-modules">
            {modules.map((module) => (
                            <Link
                key={module.id}
                href={module.href as any}
                className={`group relative bg-slate-800/50 border border-slate-600 rounded-xl p-8 hover:border-${module.color.split(' ')[1].replace('to-', '')} transition-all hover:shadow-lg hover:shadow-${module.color.split(' ')[1].replace('to-', '')}/20 hover:scale-105`}
                data-tour={module.id === 'witness' ? 'witness-tab' : undefined}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${module.color} text-white text-xs font-mono font-bold`}>
                    {module.status}
                  </span>
                </div>

                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${module.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`} />

                <div className="relative">
                  {/* Icon */}
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${module.color} w-fit mb-6`}>
                    <module.icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-mono font-bold mb-2">{module.title}</h3>
                  <p className="text-sm text-cyan-400 font-mono mb-3">{module.subtitle}</p>
                  <p className="text-slate-300 font-mono text-sm leading-relaxed">
                    {module.description}
                  </p>

                  {/* Arrow */}
                  <div className="mt-6 flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 font-mono text-sm">
                    <span>ENTER MODULE</span>
                    <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-md">
          <div className="container mx-auto px-8 py-12">
            <div className="flex items-center justify-between text-sm text-slate-400 font-mono">
              <div>© 2025 AuditaAI Lab. Powered by Rosetta OS v13 TriTrack</div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>RESEARCH ACTIVE</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
