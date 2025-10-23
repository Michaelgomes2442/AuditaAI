'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Rocket, Sparkles, Code, Lightbulb, HelpCircle, ChevronRight, ExternalLink, Code2, Layers, GitBranch, Shield, ArrowLeft, FileText, ArrowRight } from 'lucide-react';
import { docSections, DocArticle, DocSection } from '@/lib/docs-content';

export default function DocsPage() {
  const router = useRouter();
  const docSections = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Quick start guide, installation, and basic concepts",
      links: [
        { label: "Introduction to AuditaAI", href: "/get-started" },
        { label: "Rosetta OS Overview", href: "#rosetta-overview" },
        { label: "System Requirements", href: "#requirements" },
      ],
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Code2,
      title: "Implementation",
      description: "Technical documentation and implementation guides",
      links: [
        { label: "Rosetta Boot Sequence", href: "/ROSETTA_IMPLEMENTATION.md" },
        { label: "Pilot Architecture", href: "/PILOT_ARCHITECTURE.md" },
        { label: "BEN Runtime Integration", href: "#ben-runtime" },
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Layers,
      title: "API Reference",
      description: "Complete API documentation and endpoints",
      links: [
        { label: "REST API", href: "/api" },
        { label: "WebSocket Events", href: "#websocket" },
        { label: "Authentication", href: "#auth-api" },
      ],
      color: "from-orange-500 to-red-500"
    },
    {
      icon: GitBranch,
      title: "Advanced Topics",
      description: "Deep dives into governance and CRIES metrics",
      links: [
        { label: "CRIES Calculation", href: "#cries" },
        { label: "Tri-Track Integrity Model", href: "#tri-track" },
        { label: "Z-Scan Verification", href: "#zscan" },
      ],
      color: "from-green-500 to-emerald-500"
    },
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
              <Shield className="h-8 w-8 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-mono font-bold">AuditaAI<span className="text-cyan-400">/</span>Docs</span>
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
                <span className="text-green-400">SYSTEM READY</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-mono text-cyan-400">DOCUMENTATION v13.0</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-mono font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              Documentation Hub
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              Comprehensive guides, API references, and technical documentation for building 
              with AuditaAI's Rosetta Cognitive OS and governance framework.
            </p>

            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-slate-400">
                <Code2 className="h-4 w-4" />
                <span className="font-mono">Open Source</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <GitBranch className="h-4 w-4" />
                <span className="font-mono">v13 TriTrack vΩ3.18</span>
              </div>
            </div>
          </div>
        </section>

        {/* Canonical Specifications */}
        <section className="container mx-auto px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-mono font-bold mb-6 text-cyan-400">
              Canonical Rosetta Monolith v13 Specifications
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Core Metadata */}
              <div className="p-6 rounded-xl bg-slate-800/50 border border-cyan-500/30 backdrop-blur-sm">
                <h3 className="text-lg font-mono font-bold text-cyan-300 mb-4">Core Metadata</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Version:</span>
                    <span className="text-white">Rosetta v13</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Integrity:</span>
                    <span className="text-cyan-400">Tri-Track vΩ3.18</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Runtime:</span>
                    <span className="text-green-400">BEN (NO-JS)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Persona:</span>
                    <span className="text-yellow-400">Architect (Band-0)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Baseline Lamport:</span>
                    <span className="text-white">68</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Math Canon:</span>
                    <span className="text-purple-400">vΩ.8 / vΩ.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Z-Scan:</span>
                    <span className="text-orange-400">v3 + v4</span>
                  </div>
                </div>
              </div>

              {/* File Integrity */}
              <div className="p-6 rounded-xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm md:col-span-2">
                <h3 className="text-lg font-mono font-bold text-purple-300 mb-4">Cryptographic Fingerprints</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-slate-400 mb-1">File SHA256:</div>
                    <div className="text-white bg-slate-900/50 p-3 rounded border border-slate-700 break-all">
                      d1cfc4d691604f2f6ec41b6880e51165c61ff9ee5380570bca4e775a906e4cb5
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Projection SHA256:</div>
                    <div className="text-cyan-300 bg-slate-900/50 p-3 rounded border border-slate-700 break-all">
                      010c373dd208bbb22e7b7e15bf41f031ec5ea15a74ca0447e37090db68fef2ac
                    </div>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-2">
                    ✓ Verified against workspace/CORE/Rosetta.html canonical monolith
                  </div>
                </div>
              </div>
            </div>

            {/* Math Canon Formulas */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-green-500/30 backdrop-blur-sm">
              <h3 className="text-lg font-mono font-bold text-green-300 mb-4">Math Canon vΩ.8 — Tri-Actor Coupling Equations</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-mono text-green-200 mb-2">Weighted Sigma (σ):</div>
                  <div className="bg-slate-900/70 p-4 rounded border border-green-500/20 font-mono">
                    <div className="text-white text-base mb-2">
                      σᵗ = w<sub>A</sub>·σ<sub>A</sub><sup>t</sup> + w<sub>B</sub>·σ<sub>B</sub><sup>t</sup> + w<sub>C</sub>·σ<sub>C</sub><sup>t</sup>
                    </div>
                    <div className="text-slate-400 text-xs">
                      where w<sub>A</sub>+w<sub>B</sub>+w<sub>C</sub>=1
                    </div>
                    <div className="text-cyan-300 text-xs mt-1">
                      defaults: (0.4, 0.4, 0.2)
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-mono text-purple-200 mb-2">Omega (Ω) Update:</div>
                  <div className="bg-slate-900/70 p-4 rounded border border-purple-500/20 font-mono">
                    <div className="text-white text-base mb-2">
                      Ω<sup>t+1</sup> = Ω<sup>t</sup> + η·Δclarity − γ<sub>B</sub>·max(0, σᵗ − σ*)
                    </div>
                    <div className="text-slate-400 text-xs">
                      η=0.1 (learning rate)
                    </div>
                    <div className="text-slate-400 text-xs">
                      γ<sub>B</sub>=0.15 (penalty), σ*=0.15 (threshold)
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-900/50 rounded border border-cyan-500/20">
                <div className="text-xs font-mono text-cyan-300 mb-2">CRIES Components (5-vector):</div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-slate-800 rounded border border-slate-700">
                    <div className="text-white font-bold">C</div>
                    <div className="text-slate-400 text-[10px]">Completeness</div>
                  </div>
                  <div className="p-2 bg-slate-800 rounded border border-slate-700">
                    <div className="text-white font-bold">R</div>
                    <div className="text-slate-400 text-[10px]">Reliability</div>
                  </div>
                  <div className="p-2 bg-slate-800 rounded border border-slate-700">
                    <div className="text-white font-bold">I</div>
                    <div className="text-slate-400 text-[10px]">Integrity</div>
                  </div>
                  <div className="p-2 bg-slate-800 rounded border border-slate-700">
                    <div className="text-white font-bold">E</div>
                    <div className="text-slate-400 text-[10px]">Effectiveness</div>
                  </div>
                  <div className="p-2 bg-slate-800 rounded border border-slate-700">
                    <div className="text-white font-bold">S</div>
                    <div className="text-slate-400 text-[10px]">Security</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="container mx-auto px-8 py-8">
          <div className="grid md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {docSections.map((section, idx) => (
              <div
                key={idx}
                className="group relative p-8 rounded-xl bg-slate-800/50 border border-white/10 backdrop-blur-sm hover:bg-slate-800/80 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`} />
                
                {/* Content */}
                <div className="relative space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${section.color} bg-opacity-10`}>
                      <section.icon className={`h-6 w-6 text-transparent bg-gradient-to-r ${section.color} bg-clip-text`} />
                    </div>
                    <h3 className="text-2xl font-mono font-bold">{section.title}</h3>
                  </div>
                  
                  <p className="text-slate-400">{section.description}</p>
                  
                  <div className="space-y-2 pt-4">
                    {section.links.map((link, linkIdx) => (
                      <a
                        key={linkIdx}
                        href={link.href}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 hover:border-white/10 transition-all group/link"
                      >
                        <span className="text-sm font-mono text-slate-300 group-hover/link:text-white">
                          {link.label}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-500 group-hover/link:text-cyan-400 group-hover/link:translate-x-1 transition-all" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-4xl mx-auto p-8 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
            <h3 className="text-2xl font-mono font-bold mb-4">Need Help?</h3>
            <p className="text-slate-300 mb-6">
              Can't find what you're looking for? Try our interactive demo or join the community.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/live-demo"
                className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-mono transition-colors"
              >
                Try Live Demo
              </Link>
              <Link 
                href="/get-started"
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-mono transition-colors"
              >
                Get Started Guide
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-8 py-8 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-slate-400 font-mono">
            <div>© 2024 AuditaAI. Powered by Rosetta OS v13</div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>DOCS ONLINE</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
