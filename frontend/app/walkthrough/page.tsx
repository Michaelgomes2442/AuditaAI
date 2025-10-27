'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Shield,
  Upload,
  Activity,
  Users,
  FileText,
  Download,
  ArrowRight,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  Eye,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { exportAuditPDF } from '@/lib/pdf-export';

interface DemoStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  status: 'pending' | 'active' | 'completed';
  action?: () => void;
  autoProgress?: boolean;
}

export default function WalkthroughPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [criesResults, setCriesResults] = useState<any>(null);
  const [witnessData, setWitnessData] = useState<any>(null);
  const [auditReport, setAuditReport] = useState<any>(null);

  const steps: DemoStep[] = [
    {
      id: 1,
      title: 'Upload AI Model',
      subtitle: 'Select your model for analysis',
      description: 'Choose an AI model to evaluate. We support GPT-4, Claude, Gemini, and custom models. The model will be analyzed across all CRIES dimensions.',
      icon: Upload,
      color: 'from-purple-500 to-pink-500',
      status: currentStep === 0 ? 'active' : currentStep > 0 ? 'completed' : 'pending',
      action: () => handleUploadModel()
    },
    {
      id: 2,
      title: 'CRIES Analysis Live',
      subtitle: 'Watch real-time evaluation',
      description: 'Our Track-C Executor analyzes the model across Completeness, Reliability, Integrity, Effectiveness, and Security. Watch the scores update in real-time.',
      icon: Activity,
      color: 'from-cyan-500 to-blue-500',
      status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'pending',
      autoProgress: true
    },
    {
      id: 3,
      title: 'Cross-Model Witness',
      subtitle: 'Multi-LLM consensus verification',
      description: 'Multiple AI models independently verify the results. See consensus, divergence detection, and witness receipts generated in real-time.',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending',
      autoProgress: true
    },
    {
      id: 4,
      title: 'Generate Audit Report',
      subtitle: 'Comprehensive compliance documentation',
      description: 'Review the complete audit report with CRIES scores, witness consensus data, Lamport chain verification, and compliance attestation.',
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
      status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending',
      action: () => handleGenerateReport()
    },
    {
      id: 5,
      title: 'Export Compliance PDF',
      subtitle: 'Download branded report',
      description: 'Export a professional PDF report with your company branding, executive summary, and detailed metrics for stakeholders and auditors.',
      icon: Download,
      color: 'from-blue-500 to-cyan-500',
      status: currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : 'pending',
      action: () => handleExportPDF()
    }
  ];

  const handleUploadModel = async () => {
    setIsRunning(true);
    
    // Simulate model upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Move to next step
    setCurrentStep(1);
    
    // Automatically start CRIES analysis
    setTimeout(() => {
      handleCRIESAnalysis();
    }, 1000);
  };

  const handleCRIESAnalysis = async () => {
    // Simulate real-time CRIES calculation with progressive updates
    const mockScores = {
      completeness: 0,
      reliability: 0,
      integrity: 0,
      effectiveness: 0,
      security: 0,
      overall: 0
    };

    // Animate scores increasing
    const targetScores = {
      completeness: 0.87,
      reliability: 0.92,
      integrity: 0.85,
      effectiveness: 0.89,
      security: 0.91,
      overall: 0.888
    };

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      const progress = i / steps;
      
      setCriesResults({
        completeness: targetScores.completeness * progress,
        reliability: targetScores.reliability * progress,
        integrity: targetScores.integrity * progress,
        effectiveness: targetScores.effectiveness * progress,
        security: targetScores.security * progress,
        overall: targetScores.overall * progress
      });
    }

    // Move to witness step
    setTimeout(() => {
      setCurrentStep(2);
      handleWitnessAnalysis();
    }, 1000);
  };

  const handleWitnessAnalysis = async () => {
    // Simulate witness consensus
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setWitnessData({
      models: ['GPT-4', 'Claude Opus', 'Gemini Pro'],
      consensus: 'ACHIEVED',
      agreements: 3,
      divergences: 0,
      confidence: 0.98
    });

    setTimeout(() => {
      setCurrentStep(3);
      setIsRunning(false);
    }, 1000);
  };

  const handleGenerateReport = async () => {
    setIsRunning(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setAuditReport({
      id: 'AUDIT-' + Date.now(),
      timestamp: new Date().toISOString(),
      model: 'GPT-4 Turbo',
      cries: criesResults,
      witness: witnessData,
      status: 'VERIFIED'
    });

    setCurrentStep(4);
    setIsRunning(false);
  };

  const handleExportPDF = async () => {
    setIsRunning(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate and download actual PDF
    if (auditReport && criesResults && witnessData) {
      exportAuditPDF({
        id: auditReport.receiptHash || 'demo-audit-' + Date.now(),
        prompt: 'Demo walkthrough audit: Analyze the following customer support interaction for quality and compliance...',
        criesScore: {
          completeness: criesResults.completeness,
          reliability: criesResults.reliability,
          integrity: criesResults.integrity,
          effectiveness: criesResults.effectiveness,
          security: criesResults.security,
          overall: criesResults.overall
        },
        witnessResults: witnessData.models.map((model: any) => ({
          modelName: model.name,
          output: model.output,
          criesScore: {
            completeness: criesResults.completeness + (Math.random() * 0.1 - 0.05),
            reliability: criesResults.reliability + (Math.random() * 0.1 - 0.05),
            integrity: criesResults.integrity + (Math.random() * 0.1 - 0.05),
            effectiveness: criesResults.effectiveness + (Math.random() * 0.1 - 0.05),
            security: criesResults.security + (Math.random() * 0.1 - 0.05),
            overall: criesResults.overall + (Math.random() * 0.1 - 0.05)
          },
          timestamp: new Date().toISOString(),
          consensusAchieved: witnessData.consensusAchieved
        })),
        receipt: {
          hash: auditReport.receiptHash,
          lamportClock: auditReport.lamportClock,
          event: auditReport.event,
          timestamp: auditReport.timestamp,
          previousHash: 'c4ca4238a0b923820dcc509a6f75849b' // Demo previous hash
        },
        timestamp: new Date().toISOString(),
        consensusRate: witnessData.consensusRate,
        userEmail: session?.user?.email || undefined
      });
    }
    
    setIsRunning(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setCriesResults(null);
    setWitnessData(null);
    setAuditReport(null);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = steps[currentStep];
      if (nextStep.action) {
        nextStep.action();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="container mx-auto px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Shield className="h-7 w-7 text-cyan-400" />
              <span className="text-xl font-mono font-bold">
                Audit<span className="text-cyan-400">a</span>AI
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="font-mono">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  HOME
                </Button>
              </Link>
              <Link href="/lab">
                <Button variant="outline" size="sm" className="font-mono">
                  <Eye className="h-4 w-4 mr-2" />
                  LAB
                </Button>
              </Link>
              <Link href="/pilot">
                <Button variant="outline" size="sm" className="font-mono">
                  <Zap className="h-4 w-4 mr-2" />
                  PILOT
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
            <span className="text-sm font-mono text-cyan-400">INTERACTIVE WALKTHROUGH</span>
          </div>
          <h1 className="text-5xl font-mono font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Governance in 5 Steps
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Experience the complete AuditaAI workflow from model upload to compliance export. 
            This guided demo shows how we analyze, verify, and certify AI models for investors and stakeholders.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div 
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${
                      step.status === 'completed' 
                        ? 'bg-green-500 border-green-400' 
                        : step.status === 'active'
                        ? 'bg-gradient-to-r ' + step.color + ' border-cyan-400 animate-pulse'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    ) : (
                      <step.icon className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-mono font-bold ${
                      step.status === 'active' ? 'text-cyan-400' : step.status === 'completed' ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      STEP {step.id}
                    </div>
                    <div className={`text-xs font-mono mt-1 max-w-[120px] ${
                      step.status === 'active' ? 'text-white' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${steps[currentStep].color}`}>
                  {(() => {
                    const Icon = steps[currentStep].icon;
                    return <Icon className="h-10 w-10" />;
                  })()}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-mono">{steps[currentStep].title}</CardTitle>
                  <CardDescription className="text-slate-400 font-mono">
                    {steps[currentStep].subtitle}
                  </CardDescription>
                </div>
                {isRunning && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-sm font-mono text-cyan-400">RUNNING</span>
                  </div>
                )}
              </div>
              <p className="text-slate-300">{steps[currentStep].description}</p>
            </CardHeader>
            <CardContent>
              {/* Step-specific content */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-slate-900/50 border border-white/5">
                    <h4 className="font-mono font-bold mb-3 text-cyan-400">SELECT MODEL TYPE</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['GPT-4 Turbo', 'Claude Opus', 'Gemini Pro', 'Custom Model'].map((model, idx) => (
                        <button
                          key={idx}
                          className="p-4 rounded-lg bg-slate-800/50 border border-white/10 hover:border-cyan-500/50 hover:bg-slate-800 transition-all font-mono text-sm"
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && criesResults && (
                <div className="space-y-4">
                  <h4 className="font-mono font-bold mb-3 text-cyan-400">CRIES SCORES</h4>
                  {Object.entries(criesResults).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-slate-300 uppercase">{key}</span>
                        <span className="font-mono font-bold text-cyan-400">{value.toFixed(3)}</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            value >= 0.85 ? 'bg-green-500' : value >= 0.70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStep === 2 && witnessData && (
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                      <div>
                        <div className="font-mono font-bold text-green-400">CONSENSUS ACHIEVED</div>
                        <div className="text-sm text-slate-400">All witness models agree</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-2xl font-mono font-bold text-white">{witnessData.agreements}/3</div>
                        <div className="text-xs text-slate-400 font-mono">AGREEMENTS</div>
                      </div>
                      <div>
                        <div className="text-2xl font-mono font-bold text-white">{witnessData.divergences}</div>
                        <div className="text-xs text-slate-400 font-mono">DIVERGENCES</div>
                      </div>
                      <div>
                        <div className="text-2xl font-mono font-bold text-cyan-400">{(witnessData.confidence * 100).toFixed(0)}%</div>
                        <div className="text-xs text-slate-400 font-mono">CONFIDENCE</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && auditReport && (
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-slate-900/50 border border-white/5 font-mono text-sm">
                    <div className="text-green-400 mb-2">// AUDIT REPORT GENERATED</div>
                    <div className="text-white">{'{'}</div>
                    <div className="pl-4 text-blue-400">"id": <span className="text-yellow-400">"{auditReport.id}"</span>,</div>
                    <div className="pl-4 text-blue-400">"model": <span className="text-yellow-400">"{auditReport.model}"</span>,</div>
                    <div className="pl-4 text-blue-400">"status": <span className="text-green-400">"{auditReport.status}"</span>,</div>
                    <div className="pl-4 text-blue-400">"overall_cries": <span className="text-cyan-400">{criesResults?.overall.toFixed(3)}</span></div>
                    <div className="text-white">{'}'}</div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Download className="h-8 w-8 text-cyan-400" />
                      <div>
                        <div className="font-mono font-bold text-cyan-400">READY FOR EXPORT</div>
                        <div className="text-sm text-slate-400">Professional compliance report</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm font-mono text-slate-300">
                      <div className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" /> Executive Summary</div>
                      <div className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" /> CRIES Breakdown</div>
                      <div className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" /> Witness Consensus Data</div>
                      <div className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" /> Compliance Attestation</div>
                      <div className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" /> Company Branding</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="font-mono"
                  disabled={isRunning}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  RESET DEMO
                </Button>

                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      variant="outline"
                      className="font-mono"
                      disabled={isRunning}
                    >
                      PREVIOUS
                    </Button>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                    <Button
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-mono"
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          NEXT STEP
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link href="/pilot">
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-mono">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        TRY LIVE PILOT
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
          <Card className="bg-slate-800/30 border-white/10">
            <CardHeader>
              <Shield className="h-8 w-8 text-cyan-400 mb-2" />
              <CardTitle className="font-mono text-lg">Enterprise Ready</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Production-grade AI governance with cryptographic receipts and immutable audit trails.
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-white/10">
            <CardHeader>
              <Zap className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle className="font-mono text-lg">Real-Time Analysis</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Watch CRIES scores calculated live as your model is evaluated across all dimensions.
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-white/10">
            <CardHeader>
              <Users className="h-8 w-8 text-orange-400 mb-2" />
              <CardTitle className="font-mono text-lg">Multi-Model Consensus</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Multiple LLMs independently verify results for maximum confidence and trust.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
