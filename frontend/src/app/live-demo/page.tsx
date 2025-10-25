'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Zap, TrendingUp, AlertTriangle, CheckCircle, Activity, RefreshCw, Download, GitCompare, MessageSquare, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface CRIESMetrics {
  completeness: number;
  reliability: number;
  integrity: number;
  effectiveness: number;
  security: number;
  overall: number;
  triTrackScore?: number; // Math Canon vΩ.8 tri-track weighted score
  tracks?: {
    A: any;
    B: any;
    C: any;
  };
  weights?: { wA: number; wB: number; wC: number };
  sigma?: number; // Canonical σ value
}

interface ModelData {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'alert' | 'booting';
  cries: CRIESMetrics;
  rosettaBooted: boolean;
  endpoint?: string;
  queriesPerHour: number;
  alerts: number;
  bootedAt?: string;
  lastUpdate?: string;
  rosettaMetadata?: {
    bootSequence: string[];
    band: string;
    mode: string;
    witness: string;
    monolithSHA256: string;
    monolithSize: number;
  };
  governance?: {
    sigma: number;
    sigmaStar: number;
    omega: number;
    triTrack: { wA: number; wB: number; wC: number };
  };
}

interface ComparisonData {
  standardModel: ModelData | null;
  rosettaModel: ModelData | null;
  improvement: {
    completeness: number;
    reliability: number;
    integrity: number;
    effectiveness: number;
    security: number;
    overall: number;
  } | null;
}

export default function LiveDemoPage() {
  const router = useRouter();
  const [models, setModels] = useState<ModelData[]>([]);
  const [comparison, setComparison] = useState<ComparisonData>({
    standardModel: null,
    rosettaModel: null,
    improvement: null
  });
  const [isTracking, setIsTracking] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);

  // Load models and comparison data
  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL ?? ''}/api/live-demo/models`);
      const data = await response.json();
      setModels(data.models || []);
      
      // Load comparison if available
  const compResponse = await fetch(`${BACKEND_URL ?? ''}/api/live-demo/comparison`);
      const compData = await compResponse.json();
      setComparison(compData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  // Auto-refresh when tracking is active
  useEffect(() => {
    loadData();
    
    if (isTracking) {
      const interval = setInterval(() => {
        loadData();
        // Update tracking history
        fetch(`${BACKEND_URL ?? ''}/api/live-demo/tracking-history`)
          .then(res => res.json())
          .then(data => setTrackingHistory(data.history || []));
      }, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isTracking, loadData]);

  const handleImportModel = async (modelData: any) => {
    try {
      const response = await fetch(`${BACKEND_URL ?? ''}/api/live-demo/import-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
      });
      
      const result = await response.json();
      await loadData();
      setImportDialogOpen(false);
      return result;
    } catch (error) {
      console.error('Failed to import model:', error);
      throw error;
    }
  };

  const handleBootWithRosetta = async (modelId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL ?? ''}/api/live-demo/boot-rosetta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      
      const result = await response.json();
      await loadData();
      return result;
    } catch (error) {
      console.error('Failed to boot with Rosetta:', error);
      throw error;
    }
  };

  const handleCompareModels = async (standardId: string, rosettaId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL ?? ''}/api/live-demo/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardId, rosettaId })
      });
      
      const result = await response.json();
      setComparison(result);
    } catch (error) {
      console.error('Failed to compare models:', error);
    }
  };

  const toggleTracking = async () => {
    const newState = !isTracking;
    setIsTracking(newState);
    
    try {
      await fetch(`${BACKEND_URL ?? ''}/api/live-demo/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
    } catch (error) {
      console.error('Failed to toggle tracking:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400 bg-green-500/20 border border-green-500/30';
    if (score >= 0.7) return 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border border-red-500/30';
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement >= 0.15) return 'text-green-400';
    if (improvement >= 0.05) return 'text-yellow-400';
    return 'text-slate-400';
  };

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

      <div className="relative max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-sm">Back</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-mono text-purple-400">LIVE APPLICATION DEMO</span>
              </div>
              <h1 className="text-4xl font-mono font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Live Application Demo
              </h1>
              <p className="text-slate-300 text-sm mt-2 font-mono">
                Math Canon vΩ.8 • Tri-Track CRIES • Rosetta Monolith v13 (Tri-Track vΩ3.18)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleTracking}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-bold transition-all text-sm ${
                  isTracking
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {isTracking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    STOP TRACKING
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    START TRACKING
                  </>
                )}
              </button>
              <button
                onClick={() => setImportDialogOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-mono font-bold transition-all text-sm"
              >
                <Upload className="w-4 h-4" />
                IMPORT MODEL
              </button>
            </div>
          </div>

          {/* Live Tracking Indicator */}
          {isTracking && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-green-400 font-mono font-bold text-sm">
                  LIVE TRACKING ACTIVE - Metrics updating every 2 seconds
                </span>
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="models" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-white/10 p-1 rounded-lg backdrop-blur-sm">
            <TabsTrigger 
              value="models" 
              className="font-mono text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              MODELS
            </TabsTrigger>
            <TabsTrigger 
              value="parallel" 
              className="font-mono text-sm data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              PARALLEL PROMPTING
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              className="font-mono text-sm data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 data-[state=active]:border-orange-500/30"
            >
              <GitCompare className="w-3.5 h-3.5 mr-1.5" />
              COMPARISON
            </TabsTrigger>
            <TabsTrigger 
              value="tracking" 
              className="font-mono text-sm data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:border-green-500/30"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              TRACKING
            </TabsTrigger>
          </TabsList>

          {/* Model Library Tab */}
          <TabsContent value="models">
            <div className="bg-slate-800/50 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-mono font-bold text-cyan-400">MODEL LIBRARY</h2>
                <p className="text-slate-300 text-sm mt-1 font-mono">
                  {models.length} models • {models.filter(m => m.rosettaBooted).length} Rosetta-booted • Math Canon vΩ.8 (Tri-Track)
                </p>
              </div>

              <div className="p-6">
                {models.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-xl bg-slate-700/50 w-fit mx-auto mb-4">
                      <Activity className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-mono font-bold text-white mb-2">
                      NO ACTIVE MODELS
                    </h3>
                    <p className="text-slate-400 text-sm mb-2 font-mono max-w-md mx-auto">
                      CRIES metrics require <span className="text-cyan-400">real LLM prompting</span> through Tri-Track governance.
                    </p>
                    <p className="text-slate-500 text-xs mb-4 font-mono max-w-lg mx-auto">
                      Track-A (Analyst), Track-B (Governor), and Track-C (Executor) must analyze actual LLM responses.
                      Each prompt generates a Δ-ANALYSIS receipt with Lamport clock increment.
                    </p>
                    <p className="text-orange-400 text-xs mb-6 font-mono">
                      ⚠ Scores cannot be computed without real prompts and responses
                    </p>
                    <button
                      onClick={() => setImportDialogOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-mono font-bold transition-all"
                    >
                      IMPORT MODEL TO START
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className="group relative border border-white/10 rounded-xl p-6 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all duration-300"
                      >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />
                        
                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-mono font-bold text-white text-base mb-1">
                                {model.name}
                              </h3>
                              <p className="text-xs text-slate-400 font-mono">{model.type}</p>
                            </div>
                            {model.rosettaBooted && (
                              <div className="px-2 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 flex items-center">
                                <Zap className="w-3 h-3 mr-1 text-purple-400" />
                                <span className="text-purple-400 font-mono text-xs font-bold">ROSETTA</span>
                              </div>
                            )}
                          </div>

                          {/* CRIES Score */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-mono font-bold text-slate-400">
                                CRIES SCORE {model.rosettaBooted && '(Math Canon vΩ.8)'}
                              </span>
                              <span
                                className={`text-xl font-mono font-bold px-3 py-1 rounded-md ${getScoreColor(
                                model.cries.overall
                              )}`}
                            >
                              {model.cries.overall.toFixed(4)}
                            </span>
                            </div>

                            {/* Tri-Track Weights (if Rosetta booted) */}
                            {model.rosettaBooted && model.governance && (
                              <div className="mb-3 p-2 rounded-md bg-purple-500/10 border border-purple-500/20">
                                <div className="text-xs font-mono text-purple-300 mb-1">
                                  Tri-Track Weights: A={model.governance.triTrack.wA} · B={model.governance.triTrack.wB} · C={model.governance.triTrack.wC}
                                </div>
                                <div className="text-xs font-mono text-slate-400">
                                  σ={model.governance.sigma.toFixed(4)} | Ω={model.governance.omega.toFixed(4)} | σ*={model.governance.sigmaStar.toFixed(2)}
                                </div>
                              </div>
                            )}

                            {/* Metric Bars - Use canonical CRIES labels */}
                            <div className="space-y-2">
                              {[
                                { key: 'completeness', label: 'C (Completeness)', value: model.cries.completeness },
                                { key: 'reliability', label: 'R (Reliability)', value: model.cries.reliability },
                                { key: 'integrity', label: 'I (Integrity)', value: model.cries.integrity },
                                { key: 'effectiveness', label: 'E (Effectiveness)', value: model.cries.effectiveness },
                                { key: 'security', label: 'S (Security)', value: model.cries.security }
                              ].map(({ key, label, value }) => (
                                  <div key={key}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-slate-400 font-mono">{label}</span>
                                      <span className="font-mono text-cyan-400">{value.toFixed(4)}</span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 rounded-full h-2 border border-white/5">
                                      <div
                                        className={`h-2 rounded-full ${
                                          value >= 0.9
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                            : value >= 0.7
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                                        }`}
                                        style={{ width: `${value * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-between text-xs text-slate-400 font-mono mb-4 pt-4 border-t border-white/5">
                          <span>{model.queriesPerHour} queries/hr</span>
                          <span>{model.alerts} alerts</span>
                        </div>

                        {/* Rosetta Metadata (if booted) */}
                        {model.rosettaBooted && model.rosettaMetadata && (
                          <div className="mb-4 p-3 rounded-md bg-purple-900/20 border border-purple-500/20">
                            <div className="text-xs font-mono text-purple-300 font-bold mb-2">
                              ROSETTA MONOLITH v13
                            </div>
                            <div className="space-y-1 text-xs font-mono text-slate-400">
                              <div>Band: {model.rosettaMetadata.band}</div>
                              <div>Mode: {model.rosettaMetadata.mode}</div>
                              <div>SHA256: {model.rosettaMetadata.monolithSHA256}</div>
                              <div>Size: {(model.rosettaMetadata.monolithSize / 1024).toFixed(1)}KB</div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {!model.rosettaBooted && (
                            <button
                              onClick={() => handleBootWithRosetta(model.id)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-mono font-bold text-xs transition-all"
                            >
                              <Zap className="w-3.5 h-3.5 inline mr-1" />
                              BOOT ROSETTA
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedForComparison(model.id);
                              // Switch to comparison tab
                              document.querySelector('[value="comparison"]')?.dispatchEvent(
                                new MouseEvent('click', { bubbles: true })
                              );
                            }}
                            className="flex-1 px-4 py-2 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-300 rounded-lg font-mono font-bold text-xs transition-all"
                          >
                            <GitCompare className="w-3.5 h-3.5 inline mr-1" />
                            COMPARE
                          </button>
                        </div>

                        {model.lastUpdate && (
                          <p className="text-xs text-slate-500 font-mono mt-3 pt-3 border-t border-white/5">
                            UPDATED {new Date(model.lastUpdate).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Parallel Prompting Tab */}
          <TabsContent value="parallel">
            <div className="bg-slate-800/50 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-mono font-bold text-purple-400">PARALLEL PROMPTING</h2>
                <p className="text-slate-300 text-sm mt-1 font-mono">
                  Query both models simultaneously and compare real-time CRIES scores
                </p>
              </div>

              <div className="p-6">
                {!comparison.standardModel || !comparison.rosettaModel ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-xl bg-slate-700/50 w-fit mx-auto mb-4">
                      <MessageSquare className="w-12 h-12 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-mono font-bold text-white mb-2">
                      NO MODELS AVAILABLE
                    </h3>
                    <p className="text-slate-400 text-sm mb-6 font-mono">
                      Import a model and boot it with Rosetta OS to enable parallel prompting
                    </p>
                    <button
                      onClick={() => setImportDialogOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-mono font-bold transition-all"
                    >
                      IMPORT MODEL
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5" />
                        <div>
                          <h4 className="font-mono font-bold text-purple-400 text-sm">REAL TIME CRIES CALCULATION</h4>
                          <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed">
                            Enter a prompt to query both {comparison.standardModel.name} (standard) and{' '}
                            {comparison.rosettaModel.name} (Rosetta). CRIES metrics are calculated based on
                            actual response quality, completeness, and governance adherence.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Parallel Prompt Interface Component */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-center text-gray-600 text-sm mb-3">
                        Parallel prompting interface will appear here
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• Standard Model: {comparison.standardModel.name}</p>
                        <p>• Rosetta Model: {comparison.rosettaModel.name}</p>
                        <p>• Mode: Parallel execution with real-time CRIES calculation</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* CRIES Comparison Tab */}
          <TabsContent value="comparison">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">CRIES Comparison</h2>
                <p className="text-gray-600 text-sm mt-0.5">
                  Compare standard model performance vs Rosetta-booted cognitive OS
                </p>
              </div>

              <div className="p-4">
                {!comparison.standardModel || !comparison.rosettaModel ? (
                  <div className="text-center py-8">
                    <GitCompare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      No comparison available
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Import a model and boot it with Rosetta OS to see the comparison
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Model Headers */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {comparison.standardModel.name}
                        </h3>
                        <Badge className="bg-gray-100 text-gray-800 text-xs">Standard Model</Badge>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {comparison.rosettaModel.name}
                        </h3>
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Rosetta Cognitive OS
                        </Badge>
                      </div>
                    </div>

                    {/* Overall Score Comparison */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Overall CRIES Score
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-1">
                            {comparison.standardModel.cries.overall.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-600">Standard</p>
                        </div>
                        <div className="text-center">
                          <TrendingUp
                            className={`w-8 h-8 mx-auto mb-1 ${getImprovementColor(
                              comparison.improvement?.overall || 0
                            )}`}
                          />
                          <div
                            className={`text-2xl font-bold ${getImprovementColor(
                              comparison.improvement?.overall || 0
                            )}`}
                          >
                            +{((comparison.improvement?.overall || 0) * 100).toFixed(1)}%
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">Improvement</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-1">
                            {comparison.rosettaModel.cries.overall.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-600">Rosetta</p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Metrics Comparison */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Detailed Metrics Breakdown
                      </h4>
                      <div className="space-y-3">
                        {(['completeness', 'reliability', 'integrity', 'effectiveness', 'security'] as const).map(
                          (metric) => (
                            <div key={metric} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-900 capitalize">
                                  {metric}
                                </h5>
                                <span
                                  className={`text-lg font-bold ${getImprovementColor(
                                    comparison.improvement?.[metric] || 0
                                  )}`}
                                >
                                  +{((comparison.improvement?.[metric] || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-600">Standard</span>
                                    <span className="font-medium text-sm">
                                      {comparison.standardModel?.cries[metric].toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{
                                        width: `${(comparison.standardModel?.cries[metric] || 0) * 100}%`
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-600">Rosetta</span>
                                    <span className="font-medium text-sm">
                                      {comparison.rosettaModel?.cries[metric].toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-purple-500 h-2 rounded-full"
                                      style={{
                                        width: `${(comparison.rosettaModel?.cries[metric] || 0) * 100}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Performance Statistics
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2 text-xs">Standard Model</h5>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Queries/Hour:</span>
                              <span className="font-medium">
                                {comparison.standardModel.queriesPerHour}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Active Alerts:</span>
                              <span className="font-medium text-red-600">
                                {comparison.standardModel.alerts}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Status:</span>
                              <Badge
                                className={
                                  comparison.standardModel.status === 'active'
                                    ? 'bg-green-100 text-green-800 text-xs h-5'
                                    : 'bg-red-100 text-red-800 text-xs h-5'
                                }
                              >
                                {comparison.standardModel.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2 text-xs">Rosetta Model</h5>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Queries/Hour:</span>
                              <span className="font-medium">
                                {comparison.rosettaModel.queriesPerHour}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Active Alerts:</span>
                              <span className="font-medium text-green-600">
                                {comparison.rosettaModel.alerts}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Status:</span>
                              <Badge
                                className={
                                  comparison.rosettaModel.status === 'active'
                                    ? 'bg-green-100 text-green-800 text-xs h-5'
                                    : 'bg-red-100 text-red-800 text-xs h-5'
                                }
                              >
                                {comparison.rosettaModel.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Live Tracking Tab */}
          <TabsContent value="tracking">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Live Tracking</h2>
                    <p className="text-gray-600 text-sm mt-0.5">
                      Real-time CRIES metrics monitoring • Updated every 2 seconds
                    </p>
                  </div>
                  {isTracking && (
                    <Badge className="bg-green-100 text-green-800 text-xs h-5">
                      <Activity className="w-3 h-3 mr-1 animate-pulse" />
                      Live
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4">
                {!isTracking ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Live tracking not active
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Click "Start Tracking" to begin real-time CRIES monitoring
                    </p>
                    <button
                      onClick={toggleTracking}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm"
                    >
                      <Activity className="w-4 h-4 inline mr-1.5" />
                      Start Tracking
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-600 animate-pulse" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-base">{model.name}</h3>
                              <p className="text-xs text-gray-600">{model.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {model.rosettaBooted && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs h-5">
                                <Zap className="w-3 h-3 mr-1" />
                                Rosetta
                              </Badge>
                            )}
                            <Badge
                              className={
                                model.status === 'active'
                                  ? 'bg-green-100 text-green-800 text-xs h-5'
                                  : 'bg-red-100 text-red-800 text-xs h-5'
                              }
                            >
                              {model.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Live Metrics Grid */}
                        <div className="grid grid-cols-6 gap-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-purple-600 mb-0.5">
                              {model.cries.overall.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600">Overall</div>
                          </div>
                          {(['completeness', 'reliability', 'integrity', 'effectiveness', 'security'] as const).map(
                            (metric) => (
                              <div key={metric} className="text-center">
                                <div
                                  className={`text-xl font-bold mb-0.5 ${
                                    model.cries[metric] >= 0.9
                                      ? 'text-green-600'
                                      : model.cries[metric] >= 0.7
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {model.cries[metric].toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-600 capitalize">
                                  {metric.slice(0, 4)}
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* Live Stats */}
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs">
                          <span className="text-gray-600">
                            {model.queriesPerHour} queries/hour
                          </span>
                          <span className="text-gray-600">{model.alerts} active alerts</span>
                          <span className="text-gray-500">
                            Updated {new Date(model.lastUpdate || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Import Model Dialog */}
        {importDialogOpen && (
          <ModelImportDialog
            onClose={() => setImportDialogOpen(false)}
            onImport={handleImportModel}
          />
        )}
      </div>
    </div>
  );
}

// Model Import Dialog Component
function ModelImportDialog({
  onClose,
  onImport
}: {
  onClose: () => void;
  onImport: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Language Model',
    endpoint: '',
    apiKey: ''
  });
  const [importing, setImporting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    try {
      await onImport(formData);
      onClose();
    } catch (error) {
      alert('Failed to import model');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Import Model</h2>
          <p className="text-gray-600 text-sm mt-0.5">Connect your AI model for CRIES tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="e.g., GPT-4 Production"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option>Language Model</option>
              <option>Vision Model</option>
              <option>Multimodal Model</option>
              <option>Custom Model</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint
            </label>
            <input
              type="url"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="https://api.example.com/v1/chat"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key (Optional)
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="sk-..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {importing ? 'Importing...' : 'Import Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
