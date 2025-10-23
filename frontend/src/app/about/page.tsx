import Link from "next/link";
import { Shield, Users, Target, Zap, Brain, Lock, ArrowRight, Info } from "lucide-react";

export default function AboutPage() {
  const mission = [
    {
      icon: Brain,
      title: "AI Governance Revolution",
      description: "Building the future of trustworthy AI through transparent governance frameworks and real-time auditability."
    },
    {
      icon: Lock,
      title: "Security First",
      description: "Cryptographic verification and deterministic ordering ensure every AI interaction is secure and auditable."
    },
    {
      icon: Zap,
      title: "Performance & Trust",
      description: "20-30% improvements in governance metrics without sacrificing model performance or speed."
    }
  ];

  const values = [
    { label: "Transparency", description: "Every decision auditable" },
    { label: "Open Source", description: "Community-driven development" },
    { label: "Research-Led", description: "Evidence-based improvements" },
    { label: "Security", description: "Cryptographic guarantees" }
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
        {/* Header */}
        <header className="container mx-auto px-8 py-8 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <Shield className="h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-mono font-bold">AuditaAI<span className="text-purple-400">/</span>About</span>
            </Link>
            <div className="flex items-center space-x-1 text-sm font-mono">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400">SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Info className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-mono text-purple-400">ABOUT AUDITAAI</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-mono font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Building Trust in AI
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              AuditaAI is a research-driven platform that brings enterprise-grade governance 
              to AI deployments. Powered by the Rosetta Cognitive OS, we make AI systems 
              transparent, auditable, and trustworthy.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="container mx-auto px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-mono font-bold mb-8 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Our Mission
              </span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {mission.map((item, idx) => (
                <div
                  key={idx}
                  className="group relative p-8 rounded-xl bg-slate-800/50 border border-white/10 backdrop-blur-sm hover:bg-slate-800/80 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />
                  
                  {/* Content */}
                  <div className="relative space-y-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 w-fit">
                      <item.icon className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-mono font-bold">{item.title}</h3>
                    <p className="text-slate-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-4xl mx-auto p-8 rounded-xl bg-slate-800/50 border border-white/10 backdrop-blur-sm">
            <div className="flex items-start space-x-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <Target className="h-12 w-12 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-mono font-bold mb-4">Rosetta Cognitive OS</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Our core technology is the Rosetta Monolith - a 2.9MB governance framework 
                  that boots in three steps (init → lock → handshake) to provide comprehensive 
                  AI oversight. The Tri-Track integrity model ensures reliability, security, 
                  and deterministic behavior.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                    <div className="text-cyan-400 mb-1">CRIES Score</div>
                    <div className="text-2xl font-bold">87.3%</div>
                    <div className="text-slate-500">+18.9% vs baseline</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                    <div className="text-purple-400 mb-1">Boot Time</div>
                    <div className="text-2xl font-bold">3-Step</div>
                    <div className="text-slate-500">Band-0 NO-JS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="container mx-auto px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-mono font-bold mb-8 text-center">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Core Values
              </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {values.map((value, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-lg bg-slate-800/50 border border-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <div className="text-xl font-mono font-bold text-cyan-400 mb-2">
                    {value.label}
                  </div>
                  <div className="text-slate-400">{value.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-4xl mx-auto p-8 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
            <h3 className="text-3xl font-mono font-bold mb-4">Join the Future of AI Governance</h3>
            <p className="text-slate-300 mb-6 text-lg">
              Experience transparent, auditable AI with real-time governance metrics.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link 
                href="/get-started"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-mono transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link 
                href="/live-demo"
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-mono transition-colors"
              >
                Try Live Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-8 py-8 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-slate-400 font-mono">
            <div>© 2024 AuditaAI. Powered by Rosetta OS v13</div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              <span>MISSION ACTIVE</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
