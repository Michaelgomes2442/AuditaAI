'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Eye,
  CheckCircle2,
  Target,
  Calendar
} from 'lucide-react';

export default function PitchPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 0,
      title: 'AuditaAI',
      subtitle: 'AI Audit Infrastructure for the Enterprise',
      content: (
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AuditaAI
            </h1>
            <p className="text-3xl text-gray-300">
              Verifiable AI Audits at Scale
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">CRIES</div>
              <div className="text-sm text-gray-400">Audit Methodology</div>
            </div>
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <Eye className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">Witness</div>
              <div className="text-sm text-gray-400">Cross-Model Consensus</div>
            </div>
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">Lamport</div>
              <div className="text-sm text-gray-400">Immutable Chain</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: 'The Problem',
      subtitle: 'AI Trust Crisis in Enterprise',
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-red-400 mb-4">$10B+ Lost Annually</h3>
                <p className="text-gray-300 text-lg">
                  Enterprises lose billions due to AI hallucinations, bias, and unreliable outputs
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-red-400 mb-4">Zero Accountability</h3>
                <p className="text-gray-300 text-lg">
                  No way to verify AI outputs or prove compliance to regulators
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-red-400 mb-4">Manual Audits</h3>
                <p className="text-gray-300 text-lg">
                  Current audits take weeks, cost $50K+, and can't scale to production
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-red-400 mb-4">Regulatory Pressure</h3>
                <p className="text-gray-300 text-lg">
                  EU AI Act, Biden Executive Order demand verifiable AI audits
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'The Solution',
      subtitle: 'CRIES + Witness + Lamport Chain',
      content: (
        <div className="space-y-8">
          <div className="space-y-6">
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-2">CRIES Methodology</h3>
                    <p className="text-gray-300 mb-3">
                      5-dimensional audit framework: Completeness, Reliability, Integrity, Effectiveness, Security
                    </p>
                    <div className="text-sm text-gray-400">
                      Automated Track-C executor analyzes AI outputs in real-time
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Eye className="w-8 h-8 text-purple-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-purple-400 mb-2">Witness Consensus</h3>
                    <p className="text-gray-300 mb-3">
                      Multiple AI models cross-verify each other's outputs for Byzantine fault tolerance
                    </p>
                    <div className="text-sm text-gray-400">
                      Detects divergence, hallucinations, and adversarial attacks
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-green-400 mb-2">Lamport Chain</h3>
                    <p className="text-gray-300 mb-3">
                      Immutable cryptographic audit trail with logical timestamps
                    </p>
                    <div className="text-sm text-gray-400">
                      Every audit receipt is chained and verifiable by regulators
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Market Opportunity',
      subtitle: 'AI Governance & Compliance',
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">$12.5B</div>
                <div className="text-xl text-gray-400 mb-4">TAM by 2028</div>
                <div className="text-sm text-gray-500">
                  AI governance & compliance market (Gartner)
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">85%</div>
                <div className="text-xl text-gray-400 mb-4">Fortune 500</div>
                <div className="text-sm text-gray-500">
                  Plan to deploy AI auditing by 2026 (Deloitte)
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <DollarSign className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">$3.2B</div>
                <div className="text-xl text-gray-400 mb-4">SAM</div>
                <div className="text-sm text-gray-500">
                  Serviceable addressable market (Healthcare, Finance, Legal)
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <div className="text-5xl font-bold text-white mb-2">$480M</div>
                <div className="text-xl text-gray-400 mb-4">SOM</div>
                <div className="text-sm text-gray-500">
                  Serviceable obtainable market (Year 3 target)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Traction',
      subtitle: 'Early Validation',
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">Live</div>
                <div className="text-gray-400">Platform Status</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">3</div>
                <div className="text-gray-400">Pricing Tiers</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">Real</div>
                <div className="text-gray-400">Test Data</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Technical Milestones</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">CRIES methodology implemented & tested</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Witness consensus protocol operational</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Lamport chain receipts verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Real-time dashboard with live metrics</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Multi-model comparison UI complete</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 5,
      title: 'Pricing',
      subtitle: 'SaaS Model with Enterprise Tiers',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-blue-400 mb-4">FREE</h3>
                <div className="text-4xl font-bold text-white mb-4">$0</div>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>• 100 audits/month</div>
                  <div>• Basic CRIES scores</div>
                  <div>• Community support</div>
                  <div>• Public receipts</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-blue-400 mb-4">PRO</h3>
                <div className="text-4xl font-bold text-white mb-4">$499<span className="text-lg text-gray-400">/mo</span></div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>• Unlimited audits</div>
                  <div>• Witness consensus</div>
                  <div>• Priority support</div>
                  <div>• API access</div>
                  <div>• Private receipts</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-purple-400 mb-4">ENTERPRISE</h3>
                <div className="text-4xl font-bold text-white mb-4">Custom</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>• Dedicated infrastructure</div>
                  <div>• SLA guarantees</div>
                  <div>• Custom integrations</div>
                  <div>• Compliance reports</div>
                  <div>• White-label options</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Revenue Projections</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400 mb-2">Year 1</div>
                  <div className="text-2xl text-white">$2.4M ARR</div>
                  <div className="text-sm text-gray-500 mt-2">500 PRO + 10 Enterprise</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400 mb-2">Year 2</div>
                  <div className="text-2xl text-white">$12M ARR</div>
                  <div className="text-sm text-gray-500 mt-2">2,000 PRO + 50 Enterprise</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400 mb-2">Year 3</div>
                  <div className="text-2xl text-white">$48M ARR</div>
                  <div className="text-sm text-gray-500 mt-2">8,000 PRO + 200 Enterprise</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 6,
      title: 'Team',
      subtitle: 'AI Safety & Distributed Systems Experts',
      content: (
        <div className="space-y-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Founding Team</h3>
                <p className="text-gray-400">Deep expertise in AI safety, cryptography, and enterprise software</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">CEO / CTO</h4>
                  <p className="text-sm text-gray-400 mb-3">AI Safety Researcher</p>
                  <div className="text-xs text-gray-500">
                    • Built distributed audit systems<br/>
                    • Published on AI verification<br/>
                    • 10+ years in AI/ML
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Advisors</h4>
                  <p className="text-sm text-gray-400 mb-3">Industry Veterans</p>
                  <div className="text-xs text-gray-500">
                    • AI governance experts<br/>
                    • Enterprise SaaS leaders<br/>
                    • Regulatory compliance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Why We'll Win</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <div className="font-medium text-white mb-1">First Mover</div>
                    <div className="text-sm text-gray-400">Only real-time AI audit platform live today</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <div className="font-medium text-white mb-1">Technical Moat</div>
                    <div className="text-sm text-gray-400">CRIES + Witness + Lamport chain proprietary</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <div className="font-medium text-white mb-1">Market Timing</div>
                    <div className="text-sm text-gray-400">EU AI Act enforcement starts 2025</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <div className="font-medium text-white mb-1">Team</div>
                    <div className="text-sm text-gray-400">Proven track record in AI safety</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 7,
      title: 'The Ask',
      subtitle: 'Seed Round: $2M',
      content: (
        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
            <CardContent className="p-12 text-center">
              <h3 className="text-5xl font-bold text-white mb-4">$2M Seed Round</h3>
              <p className="text-2xl text-gray-300 mb-8">18-month runway to $5M ARR</p>
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">50%</div>
                  <div className="text-gray-400">Engineering</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-2">30%</div>
                  <div className="text-gray-400">Sales & Marketing</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">20%</div>
                  <div className="text-gray-400">Operations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">12-Month Milestones</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">100 paying customers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">$1.2M ARR achieved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">5 enterprise contracts signed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">SOC 2 Type II certified</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">EU AI Act compliance validated</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Use of Funds</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Engineering (6 hires)</span>
                      <span className="text-white font-medium">$1M</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Sales & Marketing</span>
                      <span className="text-white font-medium">$600K</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Operations & Legal</span>
                      <span className="text-white font-medium">$400K</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl px-12 py-6">
              <Calendar className="w-6 h-6 mr-3" />
              Schedule Demo Call
            </Button>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Pitch Mode
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Slide {currentSlide + 1} of {slides.length}
              </span>
              <Link href="/walkthrough">
                <Button variant="outline" size="sm">
                  Interactive Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Slide Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative">
          {/* Slide Content */}
          <div className="min-h-[600px] bg-gray-900/30 rounded-2xl border border-gray-800 p-12">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">
                {slides[currentSlide].title}
              </h2>
              <p className="text-xl text-gray-400">
                {slides[currentSlide].subtitle}
              </p>
            </div>
            <div className="mt-8">
              {slides[currentSlide].content}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="border-gray-700"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            {/* Slide Indicators */}
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-blue-500 w-8'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="border-gray-700"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Use arrow keys to navigate • Press Esc to exit
          </div>
        </div>
      </div>

      {/* Keyboard Navigation */}
      <div
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) nextSlide();
          if (e.key === 'ArrowLeft' && currentSlide > 0) prevSlide();
        }}
        tabIndex={0}
        className="fixed inset-0 pointer-events-none"
      />
    </div>
  );
}
