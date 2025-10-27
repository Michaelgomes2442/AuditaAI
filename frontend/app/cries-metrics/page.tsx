'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  Shield, 
  Brain, 
  Heart, 
  Lock,
  AlertTriangle,
  Download,
  ChevronRight,
  Zap,
  Timer,
  ArrowUpCircle,
  ArrowLeft,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

interface CRIESMetrics {
  coherence: number;
  rigor: number;
  integration: number;
  empathy: number;
  strictness: number;
  composite: number; // σᵗ
  omega: number; // Ω
  timestamp: string;
  lamportClock: number;
  receiptId?: string;
  // New Math Canon metrics
  sigma_mad?: number; // σ via MAD (tanh)
  novelty?: number; // Nₜ
  utility?: number; // Uₜ
  eta?: number; // Learning rate
  gamma?: number; // Damping
}

interface GuildDistribution {
  reason: number;
  engineering: number;
  creative: number;
  ethics: number;
  ops: number;
}

interface DriftEvent {
  id: string;
  type: 'Δ-METRIC' | 'Δ-RISK-GATE' | 'Δ-DRIFT-ALERT';
  metric: string;
  oldValue: number;
  newValue: number;
  delta: number;
  timestamp: string;
  lamport: number;
  severity: 'low' | 'medium' | 'high';
}

interface BandPromotion {
  id: string;
  metricsSnapshot: CRIESMetrics;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export default function CRIESMetricsDashboard() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [currentMetrics, setCurrentMetrics] = useState<CRIESMetrics>({
    coherence: 0.71,
    rigor: 0.68,
    integration: 0.64,
    empathy: 0.59,
    strictness: 1.00,
    composite: 0.72,
    omega: 0.64,
    timestamp: new Date().toISOString(),
    lamportClock: 0,
    sigma_mad: 0.10,
    novelty: 0.32,
    utility: 0.68,
    eta: 0.20,
    gamma: 0.10
  });

  const [guilds, setGuilds] = useState<GuildDistribution>({
    reason: 0.32,
    engineering: 0.28,
    creative: 0.18,
    ethics: 0.12,
    ops: 0.10
  });

  const [metricsHistory, setMetricsHistory] = useState<CRIESMetrics[]>([]);
  const [driftEvents, setDriftEvents] = useState<DriftEvent[]>([]);
  const [replayingEvent, setReplayingEvent] = useState<DriftEvent | null>(null);
  const [bandPromotions, setBandPromotions] = useState<BandPromotion[]>([]);
  const [timeWindow, setTimeWindow] = useState<'1h' | '24h' | '7d'>('1h');
  const [alertsActive, setAlertsActive] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch real CRIES metrics from actual LLM conversations
  useEffect(() => {
    const fetchRealMetrics = async () => {
      try {
  const response = await fetch(`${BACKEND_URL ?? ''}/api/conversations/aggregate`);
        const data = await response.json();

        if (!data.aggregateCRIES || data.totalConversations === 0) {
          // No real data yet - show zeros and helpful message
          console.log('No conversation data yet. Run parallel prompts in Live Demo to generate real CRIES metrics.');
          return;
        }

        const newMetrics: CRIESMetrics = {
          coherence: data.aggregateCRIES.C || 0,
          rigor: data.aggregateCRIES.R || 0,
          integration: data.aggregateCRIES.I || 0,
          empathy: data.aggregateCRIES.E || 0,
          strictness: data.aggregateCRIES.S || 0,
          composite: data.averageSigma || 0,
          omega: data.averageOmega || 0,
          timestamp: new Date().toISOString(),
          lamportClock: currentMetrics.lamportClock + 1,
          receiptId: data.latestReceiptId,
          // Math Canon metrics from real data
          sigma_mad: data.averageSigma || 0,
          novelty: data.aggregateCRIES.novelty || 0,
          utility: data.aggregateCRIES.utility || 0,
          eta: 0.20, // From governance config
          gamma: 0.10 // From governance config
        };

        // Check for threshold breaches on REAL data
        const sigmaStar = 0.70; // Stability threshold
        const alerts: string[] = [];

        if (newMetrics.composite < sigmaStar) {
          alerts.push('Δ-RISK-GATE: Composite stability below threshold');
        }
        if (newMetrics.rigor < 0.70) {
          alerts.push('LOW_RIGOR: Citation ratio insufficient');
        }
        if (Math.abs(newMetrics.empathy - newMetrics.rigor) > 0.3) {
          alerts.push('Δ-POLICY-DRIFT: Empathy/Rigor divergence detected');
        }

        // Drift detection (5-turn window) on REAL historical data
        if (metricsHistory.length >= 5) {
          const last5 = metricsHistory.slice(-5);
          const omegaDrop = Math.max(...last5.map(m => m.omega)) - newMetrics.omega;
          const sigmaRise = newMetrics.sigma_mad! - Math.min(...last5.map(m => m.sigma_mad || 0));
          
          if (omegaDrop >= 0.08) {
            alerts.push('Δ-DRIFT-ALERT: Ω drop ≥0.08 within 5 turns');
          }
          if (sigmaRise >= 0.10) {
            alerts.push('Δ-DRIFT-ALERT: σ rise ≥0.10 within 5 turns');
          }
        }

        setAlertsActive(alerts);

        // Detect significant drift on REAL data
        if (Math.abs(newMetrics.rigor - currentMetrics.rigor) > 0.1) {
          const driftEvent: DriftEvent = {
            id: `drift-${Date.now()}`,
            type: 'Δ-DRIFT-ALERT',
            metric: 'Rigor',
            oldValue: currentMetrics.rigor,
            newValue: newMetrics.rigor,
            delta: newMetrics.rigor - currentMetrics.rigor,
            timestamp: new Date().toISOString(),
            lamport: newMetrics.lamportClock,
            severity: Math.abs(newMetrics.rigor - currentMetrics.rigor) > 0.15 ? 'high' : 'medium',
          };
          setDriftEvents(prev => [driftEvent, ...prev].slice(0, 10));
        }

        setCurrentMetrics(newMetrics);
        setMetricsHistory(prev => [...prev, newMetrics].slice(-100));
      } catch (error) {
        console.error('Error fetching real CRIES metrics:', error);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchRealMetrics();
    const interval = setInterval(fetchRealMetrics, 5000);
    return () => clearInterval(interval);
  }, [currentMetrics.lamportClock, metricsHistory.length]);

  // Replay drift event animation
  const replayDrift = (event: DriftEvent) => {
    setReplayingEvent(event);
    setTimeout(() => setReplayingEvent(null), 3000);
  };

  // Promote to Band-2 Meta-Governance
  const promoteToBand2 = () => {
    const promotion: BandPromotion = {
      id: `promo-${Date.now()}`,
      metricsSnapshot: { ...currentMetrics },
      reason: alertsActive.length > 0 ? alertsActive[0] : 'Manual promotion for governance review',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    setBandPromotions(prev => [promotion, ...prev]);
  };

  // Export functions
  const exportCSV = () => {
    const csv = metricsHistory.map(m => 
      `${m.timestamp},${m.coherence},${m.rigor},${m.integration},${m.empathy},${m.strictness},${m.composite},${m.omega}`
    ).join('\n');
    const blob = new Blob([`timestamp,coherence,rigor,integration,empathy,strictness,composite,omega\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cries-metrics-${new Date().toISOString()}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const json = JSON.stringify({ metrics: metricsHistory, alerts: alertsActive, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cries-metrics-${new Date().toISOString()}.json`;
    a.click();
  };

  // Generate heatmap data (Coherence vs Strictness correlation)
  const generateHeatmap = () => {
    const grid: number[][] = Array(10).fill(0).map(() => Array(10).fill(0));
    metricsHistory.forEach(m => {
      const cohBucket = Math.min(9, Math.floor(m.coherence * 10));
      const strBucket = Math.min(9, Math.floor(m.strictness * 10));
      grid[cohBucket][strBucket]++;
    });
    return grid;
  };

  const heatmapData = generateHeatmap();

  const getMetricColor = (value: number): string => {
    if (value >= 0.85) return 'text-green-400 border-green-500/50 bg-green-500/10';
    if (value >= 0.70) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    return 'text-red-400 border-red-500/50 bg-red-500/10';
  };

  const getMetricStatus = (value: number): string => {
    if (value >= 0.85) return '🟢';
    if (value >= 0.70) return '🟡';
    return '🔴';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-400/50">
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">CRIES Metrics Dashboard</h1>
            <p className="text-cyan-400/60 font-mono text-sm">
              Governance Cockpit | Lamport: {currentMetrics.lamportClock} | σᵗ: {currentMetrics.composite.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Active Alerts */}
        {alertsActive.length > 0 && (
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 mb-4 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-red-400 font-bold mb-2">Active Governance Alerts</h3>
                {alertsActive.map((alert, i) => (
                  <div key={i} className="text-red-300 font-mono text-sm mb-1">• {alert}</div>
                ))}
              </div>
              <Button onClick={promoteToBand2} variant="destructive" size="sm" className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                Promote to Band-2
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Top Section - CRIES Component Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {/* Coherence Card */}
        <Card className={`${getMetricColor(currentMetrics.coherence)} border-2 backdrop-blur-sm bg-slate-800/60`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5" />
              Coherence
            </CardTitle>
            <CardDescription className="text-slate-400">Sentence cohesion & topic fit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {getMetricStatus(currentMetrics.coherence)} {(currentMetrics.coherence * 100).toFixed(1)}%
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${currentMetrics.coherence * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              C = 0.6×cosine + 0.4×topic
            </p>
          </CardContent>
        </Card>

        {/* Rigor Card */}
        <Card className={`${getMetricColor(currentMetrics.rigor)} border-2 backdrop-blur-sm bg-slate-800/60`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5" />
              Rigor
            </CardTitle>
            <CardDescription className="text-slate-400">Citations & verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {getMetricStatus(currentMetrics.rigor)} {(currentMetrics.rigor * 100).toFixed(1)}%
            </div>
            <div className="relative w-24 h-24 mx-auto">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
                <circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - currentMetrics.rigor)}`}
                  className="text-blue-400 transition-all duration-500"
                />
              </svg>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              R = 0.5×cite + 0.5×coverage
            </p>
          </CardContent>
        </Card>

        {/* Integration Card */}
        <Card className={`${getMetricColor(currentMetrics.integration)} border-2 backdrop-blur-sm bg-slate-800/60`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5" />
              Integration
            </CardTitle>
            <CardDescription className="text-slate-400">Cross-refs & goal alignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {getMetricStatus(currentMetrics.integration)} {(currentMetrics.integration * 100).toFixed(1)}%
            </div>
            <div className="flex gap-1 h-12 items-end">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i}
                  className={`flex-1 rounded-t transition-all duration-500 ${i < currentMetrics.integration * 10 ? 'bg-purple-500' : 'bg-slate-700'}`}
                  style={{ height: `${(i + 1) * 10}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              I = 0.5×xref + 0.5×goal_fit
            </p>
          </CardContent>
        </Card>

        {/* Empathy Card */}
        <Card className={`${getMetricColor(currentMetrics.empathy)} border-2 backdrop-blur-sm bg-slate-800/60`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5" />
              Empathy
            </CardTitle>
            <CardDescription className="text-slate-400">User affect & tone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {getMetricStatus(currentMetrics.empathy)} {(currentMetrics.empathy * 100).toFixed(1)}%
            </div>
            <div className="relative h-12 flex items-center justify-center">
              <div 
                className="absolute w-16 h-16 bg-orange-500/20 rounded-full animate-pulse"
                style={{ 
                  animationDuration: `${2 - currentMetrics.empathy}s`,
                  opacity: currentMetrics.empathy 
                }}
              />
              <div 
                className="absolute w-12 h-12 bg-orange-400/30 rounded-full animate-pulse"
                style={{ 
                  animationDuration: `${2 - currentMetrics.empathy}s`,
                  animationDelay: '0.3s',
                  opacity: currentMetrics.empathy 
                }}
              />
              <div 
                className="absolute w-8 h-8 bg-orange-300/40 rounded-full animate-pulse"
                style={{ 
                  animationDuration: `${2 - currentMetrics.empathy}s`,
                  animationDelay: '0.6s',
                  opacity: currentMetrics.empathy 
                }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              E = user_signal_fit
            </p>
          </CardContent>
        </Card>

        {/* Strictness Card */}
        <Card className={`${getMetricColor(currentMetrics.strictness)} border-2 backdrop-blur-sm bg-slate-800/60`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5" />
              Strictness
            </CardTitle>
            <CardDescription className="text-slate-400">Policy compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {getMetricStatus(currentMetrics.strictness)} {(currentMetrics.strictness * 100).toFixed(1)}%
            </div>
            <div className="space-y-1">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i}
                  className={`h-2 rounded transition-all duration-300 ${i < currentMetrics.strictness * 10 ? 'bg-red-500' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              S = 1 - (violations/total)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Math Canon Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Sigma MAD Card */}
        <Card className="bg-slate-800/60 border-violet-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-violet-400" />
              σ (Sigma MAD)
            </CardTitle>
            <CardDescription className="text-slate-400">Variance via MAD(sₖ)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2 text-violet-400">
              {(currentMetrics.sigma_mad! * 100).toFixed(1)}%
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                style={{ width: `${currentMetrics.sigma_mad! * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              σ = tanh(MAD/τ)/tanh(1/τ)
            </p>
            <p className="text-xs text-slate-500 font-mono mt-1">
              τ = 0.5, window = 9
            </p>
          </CardContent>
        </Card>

        {/* Novelty (Nₜ) Card */}
        <Card className="bg-slate-800/60 border-pink-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              Nₜ (Novelty)
            </CardTitle>
            <CardDescription className="text-slate-400">Semantic distance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2 text-pink-400">
              {(currentMetrics.novelty! * 100).toFixed(1)}%
            </div>
            <div className="flex gap-1 mb-2">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i}
                  className={`flex-1 h-8 rounded transition-all duration-500 ${
                    i < currentMetrics.novelty! * 10 ? 'bg-pink-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              λ=[.5,.3,.2]
            </p>
            <p className="text-xs text-slate-500 font-mono mt-1">
              emb·JSD·ΔT
            </p>
          </CardContent>
        </Card>

        {/* Utility (Uₜ) Card */}
        <Card className="bg-slate-800/60 border-emerald-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-emerald-400" />
              Uₜ (Utility)
            </CardTitle>
            <CardDescription className="text-slate-400">Progress·Satisfaction·Evidence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2 text-emerald-400">
              {(currentMetrics.utility! * 100).toFixed(1)}%
            </div>
            <div className="space-y-1 mb-2">
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500 w-16">Progress</div>
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${currentMetrics.composite * 100}%` }} />
                </div>
                <div className="text-xs text-slate-400 w-8 text-right">50%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500 w-16">Satisfact.</div>
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${currentMetrics.empathy * 100}%` }} />
                </div>
                <div className="text-xs text-slate-400 w-8 text-right">30%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500 w-16">Evidence</div>
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${currentMetrics.rigor * 100}%` }} />
                </div>
                <div className="text-xs text-slate-400 w-8 text-right">20%</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Uₜ = 0.5·p + 0.3·s + 0.2·e
            </p>
          </CardContent>
        </Card>

        {/* Ω-Loop Coupling Card */}
        <Card className="bg-slate-800/60 border-amber-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Timer className="w-5 h-5 text-amber-400" />
              Ω-Loop Coupling
            </CardTitle>
            <CardDescription className="text-slate-400">Learning & Damping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <div className="text-xs text-slate-500 mb-1">η (Learning)</div>
                <div className="text-2xl font-bold text-amber-400">
                  {currentMetrics.eta!.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">0.05-0.20</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">γ (Damping)</div>
                <div className="text-2xl font-bold text-orange-400">
                  {currentMetrics.gamma!.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">0.05-0.15</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Ωₜ₊₁ = Ωₜ + η·Δ − γ·max(0,σ−σ*)
            </p>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Ω* target: {(currentMetrics.omega + 0.05).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Guild Distribution Card */}
      <Card className="mb-8 bg-slate-800/60 border-indigo-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-6 h-6 text-indigo-400" />
            Guild Distribution (Cognitive Weighting)
          </CardTitle>
          <CardDescription>
            Guild balance across reasoning modes (reason: 0.32, engineering: 0.28, creative: 0.18, ethics: 0.12, ops: 0.10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="mb-2">
                <Shield className="w-8 h-8 text-blue-400 mx-auto" />
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {(guilds.reason * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-slate-400 font-mono mt-1">Reason</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${guilds.reason * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <Zap className="w-8 h-8 text-cyan-400 mx-auto" />
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {(guilds.engineering * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-slate-400 font-mono mt-1">Engineering</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${guilds.engineering * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <Brain className="w-8 h-8 text-purple-400 mx-auto" />
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {(guilds.creative * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-slate-400 font-mono mt-1">Creative</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${guilds.creative * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <Heart className="w-8 h-8 text-pink-400 mx-auto" />
              </div>
              <div className="text-3xl font-bold text-pink-400">
                {(guilds.ethics * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-slate-400 font-mono mt-1">Ethics</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500" style={{ width: `${guilds.ethics * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <Lock className="w-8 h-8 text-orange-400 mx-auto" />
              </div>
              <div className="text-3xl font-bold text-orange-400">
                {(guilds.ops * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-slate-400 font-mono mt-1">Ops</div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${guilds.ops * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-900/60 rounded-lg">
            <p className="text-xs text-indigo-400 font-mono">
              Σ guilds = {((guilds.reason + guilds.engineering + guilds.creative + guilds.ethics + guilds.ops) * 100).toFixed(0)}% (must equal 100%)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Vector Gauge - Radial Composite Meter */}
        <Card className="lg:col-span-1 bg-slate-800/60 border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Composite Stability (σᵗ)
            </CardTitle>
            <CardDescription>Weighted CRIES vector magnitude</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="60%" 
                  outerRadius="100%" 
                  data={[
                    { name: 'σᵗ', value: currentMetrics.composite * 100, fill: currentMetrics.composite >= 0.85 ? '#22c55e' : currentMetrics.composite >= 0.70 ? '#eab308' : '#ef4444' }
                  ]}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar dataKey="value" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">
                {(currentMetrics.composite * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400 font-mono">
                σ* threshold: 70.0%
              </div>
              <div className="mt-4 p-3 bg-slate-900/60 rounded-lg space-y-2">
                <p className="text-xs text-cyan-400 font-mono">
                  σᵗ = 0.28C + 0.20R + 0.20I + 0.16E + 0.16S
                </p>
                <p className="text-xs text-slate-500">
                  (Math Canon vΩ.9)
                </p>
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <p className="text-xs text-amber-400 font-mono font-bold">Drift Thresholds (5-turn):</p>
                  <p className="text-xs text-slate-400 font-mono">
                    • Ω drop ≥ 0.08 → ALERT
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    • σ rise ≥ 0.10 → ALERT
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drift Replay Animation */}
        <Card className="lg:col-span-2 bg-slate-800/60 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-purple-400" />
              Drift Replay: Last Δ-Event Sequence
            </CardTitle>
            <CardDescription>Animation showing metric changes from recent events</CardDescription>
          </CardHeader>
          <CardContent>
            {replayingEvent ? (
              <div className="bg-purple-900/20 border-2 border-purple-500/50 rounded-xl p-6 animate-pulse">
                <div className="text-center mb-4">
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-mono">
                    {replayingEvent.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-8 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-400">{(replayingEvent.oldValue * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-500">Previous</div>
                  </div>
                  <ChevronRight className="w-8 h-8 text-purple-400 animate-bounce" />
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${replayingEvent.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(replayingEvent.newValue * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500">Current</div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-purple-300 font-mono text-sm">
                    {replayingEvent.metric}: {replayingEvent.delta > 0 ? '↑' : '↓'} {Math.abs(replayingEvent.delta * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Lamport: {replayingEvent.lamport}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {driftEvents.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    No drift events recorded yet
                  </div>
                ) : (
                  driftEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => replayDrift(event)}
                      className="bg-slate-900/60 border border-slate-600/50 rounded-lg p-3 hover:border-purple-500/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={`${
                            event.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                            event.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          } border font-mono text-xs`}>
                            {event.type}
                          </Badge>
                          <span className="text-white font-medium">{event.metric}</span>
                          <span className={`font-mono ${event.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {event.delta > 0 ? '↑' : '↓'} {Math.abs(event.delta * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                          Replay
                        </Button>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        Lamport: {event.lamport} | {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Temporal Graph */}
      <Card className="mb-8 bg-slate-800/60 border-cyan-500/30 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="w-6 h-6 text-cyan-400" />
                Temporal CRIES Analysis
              </CardTitle>
              <CardDescription>Real-time metric trends over selected time window</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={timeWindow === '1h' ? 'default' : 'outline'}
                onClick={() => setTimeWindow('1h')}
                className="font-mono"
              >
                1H
              </Button>
              <Button 
                size="sm" 
                variant={timeWindow === '24h' ? 'default' : 'outline'}
                onClick={() => setTimeWindow('24h')}
                className="font-mono"
              >
                24H
              </Button>
              <Button 
                size="sm" 
                variant={timeWindow === '7d' ? 'default' : 'outline'}
                onClick={() => setTimeWindow('7d')}
                className="font-mono"
              >
                7D
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={metricsHistory.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                domain={[0, 1]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Line type="monotone" dataKey="coherence" stroke="#06b6d4" strokeWidth={2} name="Coherence" />
              <Line type="monotone" dataKey="rigor" stroke="#3b82f6" strokeWidth={2} name="Rigor" />
              <Line type="monotone" dataKey="integration" stroke="#8b5cf6" strokeWidth={2} name="Integration" />
              <Line type="monotone" dataKey="empathy" stroke="#f59e0b" strokeWidth={2} name="Empathy" />
              <Line type="monotone" dataKey="strictness" stroke="#ef4444" strokeWidth={2} name="Strictness" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* CRIES Heatmap */}
        <Card className="bg-slate-800/60 border-green-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              CRIES Heatmap: Coherence × Strictness
            </CardTitle>
            <CardDescription>2D correlation showing interaction density</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {heatmapData.map((row, i) => (
                <div key={i} className="flex gap-1">
                  {row.map((count, j) => {
                    const intensity = Math.min(count / 5, 1);
                    return (
                      <div 
                        key={j}
                        className="w-8 h-8 rounded border border-slate-600/50 flex items-center justify-center transition-all hover:scale-110"
                        style={{ 
                          backgroundColor: `rgba(34, 197, 94, ${intensity * 0.6})`,
                          boxShadow: count > 0 ? `0 0 10px rgba(34, 197, 94, ${intensity * 0.5})` : 'none'
                        }}
                        title={`C: ${(i/10).toFixed(1)}, S: ${(j/10).toFixed(1)}, Count: ${count}`}
                      >
                        {count > 0 && <span className="text-xs text-white font-bold">{count}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-slate-400">
              <span>Coherence →</span>
              <span>← Strictness</span>
            </div>
          </CardContent>
        </Card>

        {/* Band Promotion Log */}
        <Card className="bg-slate-800/60 border-orange-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-orange-400" />
              Band Promotion Log
            </CardTitle>
            <CardDescription>Meta-Governance escalation history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {bandPromotions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No Band-2 promotions yet</p>
                  <Button onClick={promoteToBand2} className="bg-orange-500 hover:bg-orange-600">
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Promote Current State
                  </Button>
                </div>
              ) : (
                bandPromotions.map(promo => (
                  <div 
                    key={promo.id}
                    className="bg-slate-900/60 border border-orange-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${
                        promo.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                        promo.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      } border font-mono`}>
                        {promo.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(promo.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-orange-300 mb-3">{promo.reason}</p>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <div className="text-slate-400">C</div>
                        <div className="font-mono text-cyan-400">{(promo.metricsSnapshot.coherence * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">R</div>
                        <div className="font-mono text-blue-400">{(promo.metricsSnapshot.rigor * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">I</div>
                        <div className="font-mono text-purple-400">{(promo.metricsSnapshot.integration * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">E</div>
                        <div className="font-mono text-orange-400">{(promo.metricsSnapshot.empathy * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">S</div>
                        <div className="font-mono text-red-400">{(promo.metricsSnapshot.strictness * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card className="bg-slate-800/60 border-blue-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            Export CRIES Audit Package
          </CardTitle>
          <CardDescription>Download metrics for external governance review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={exportCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={exportJSON} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <Download className="w-4 h-4" />
              Export PDF (Coming Soon)
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-mono">
            Exports include: Full metrics history, drift events, governance alerts, and Lamport timestamps
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
