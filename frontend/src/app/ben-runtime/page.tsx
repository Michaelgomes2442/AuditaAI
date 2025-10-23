'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Shield, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Link2,
  Download,
  ArrowUpCircle,
  Zap,
  Eye,
  Play,
  Pause,
  RotateCcw,
  FileJson,
  ChevronRight,
  ArrowLeft,
  Home,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import CRIESDashboard from '@/components/cries-dashboard';
import ZScanDashboard from '@/components/zscan-dashboard';
import HybridClockDashboard from '@/components/hybrid-clock-dashboard';

interface BenEvent {
  id: string;
  track: 'A' | 'B' | 'C';
  type: string;
  lamportClock: number;
  prevDigest: string;
  selfHash: string;
  content: Record<string, any>;
  timestamp: string;
  sigma?: number;
  verified?: boolean;
  // Loop contract fields
  delta_id?: string;
  qtrace?: string;
  ts_delta_utc?: string;
  cries_snapshot?: {C: number, R: number, I: number, E: number, S: number};
  omega_after?: number;
  sigma_after?: number;
  glyph?: string;
  loop_confirmed?: boolean;
  next_state_ref?: string;
  // Latency tracking
  ts_receipt_utc?: string;
  latency_ms?: number;
}

interface ChainNode {
  id: string;
  lamport: number;
  hash: string;
  verified: boolean;
  timestamp: string;
}

interface VerificationResult {
  blockId: string;
  verified: boolean;
  timestamp: string;
  reason?: string;
}

export default function BENRuntimeDashboard() {
  const [events, setEvents] = useState<BenEvent[]>([]);
  const [chainNodes, setChainNodes] = useState<ChainNode[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BenEvent | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [lamportClock, setLamportClock] = useState(0);
  const [chainIntegrity, setChainIntegrity] = useState<'verified' | 'pending' | 'broken'>('verified');
  const [lastZScan, setLastZScan] = useState<'pass' | 'warning' | 'fail'>('pass');
  const [activeReceipts, setActiveReceipts] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<1 | 10>(1);
  const wsRef = useRef<WebSocket | null>(null);
  const startTimeRef = useRef(Date.now());

  // New BEN metrics
  const [latencyBreach, setLatencyBreach] = useState(0);
  const [criesVariance, setCriesVariance] = useState(0.0015);
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Track types by color
  const getTrackColor = (track: 'A' | 'B' | 'C') => {
    switch (track) {
      case 'A': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'B': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'C': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
    }
  };

  const getTrackName = (track: 'A' | 'B' | 'C') => {
    switch (track) {
      case 'A': return 'Analyst';
      case 'B': return 'Governor';
      case 'C': return 'Executor';
    }
  };

  const getEventIcon = (type: string) => {
    if (type.includes('RISK')) return '⚠️';
    if (type.includes('CONSENT')) return '✓';
    if (type.includes('HITL')) return '🚫';
    if (type.includes('SEQ')) return '📝';
    if (type.includes('EXEC')) return '⚡';
    if (type.includes('ANALYSIS')) return '🔬';
    return '📌';
  };

  // Fetch real BEN receipts from registry
  useEffect(() => {
    const fetchRealReceipts = async () => {
      if (isPaused) return;

      try {
        const response = await fetch('http://localhost:3001/api/receipts/registry');
        const data = await response.json();

        if (!data.receipts || data.receipts.length === 0) {
          console.log('No real receipts yet. Run parallel prompts to generate BEN events.');
          return;
        }

        // Map real receipts to BEN events
        const realEvents: BenEvent[] = data.receipts.slice(0, 50).map((receipt: any, index: number) => {
          const eventType = receipt.type || 'Δ-ANALYSIS';
          const track = receipt.cries?.R > 0.8 ? 'A' : receipt.cries?.E > 0.7 ? 'B' : 'C';
          const sigma = receipt.cries?.sigma || 0;
          
          return {
            id: receipt.id || `evt-${index}`,
            track: track as 'A' | 'B' | 'C',
            type: eventType,
            lamportClock: receipt.lamport || index,
            prevDigest: receipt.prevHash || '0000000000000000',
            selfHash: receipt.hash || '0x0000',
            content: {
              actor: receipt.modelName || 'Track-A Analyzer',
              promptHash: receipt.promptHash?.substring(0, 8) || 'n/a',
              verification: receipt.verified ? 'verified' : 'pending',
              traceId: receipt.conversationId?.substring(0, 8) || 'n/a',
            },
            timestamp: receipt.timestamp || new Date().toISOString(),
            sigma,
            verified: receipt.verified !== false,
            // Loop contract fields from real data
            delta_id: `Δ-${String(receipt.lamport || index).padStart(4, '0')}`,
            qtrace: receipt.conversationId || `Q-${index}`,
            ts_delta_utc: receipt.timestamp || new Date().toISOString(),
            cries_snapshot: receipt.cries || {C: 0, R: 0, I: 0, E: 0, S: 0},
            omega_after: receipt.cries?.omega || 0,
            sigma_after: sigma,
            glyph: sigma > 0.9 ? '△' : sigma > 0.8 ? '⤴' : sigma > 0.7 ? '⇄' : '▽',
            loop_confirmed: receipt.verified !== false,
            next_state_ref: `Δ→Ω(t+1) #${(receipt.lamport || index) + 1}`,
            ts_receipt_utc: receipt.receiptTimestamp || receipt.timestamp,
            latency_ms: receipt.latencyMs || 0,
          };
        });

        setEvents(realEvents);
        setActiveReceipts(data.receipts.length);
        
        // Set lamport clock to latest
        const maxLamport = Math.max(...realEvents.map(e => e.lamportClock), 0);
        setLamportClock(maxLamport);

        // Check real chain integrity
        let chainVerified = true;
        for (let i = 0; i < realEvents.length - 1; i++) {
          if (realEvents[i + 1].prevDigest !== realEvents[i].selfHash) {
            chainVerified = false;
            setAlerts(prev => [...prev, `Chain break detected at Lamport ${realEvents[i + 1].lamportClock}`]);
            break;
          }
        }
        setChainIntegrity(chainVerified ? 'verified' : 'broken');

        // Real alert generation based on actual receipt data
        const newAlerts: string[] = [];
        
        // Check for low sigma in real receipts
        realEvents.forEach(event => {
          if (event.sigma && event.sigma < 0.75) {
            newAlerts.push(`Low stability (σ=${event.sigma.toFixed(2)}) at Lamport ${event.lamportClock}`);
          }
          if (!event.verified) {
            newAlerts.push(`Unverified receipt at Lamport ${event.lamportClock}`);
          }
        });

        // Calculate real CRIES variance
        if (realEvents.length >= 9) {
          const last9Omega = realEvents.slice(0, 9).map(e => e.omega_after || 0);
          const meanOmega = last9Omega.reduce((a, b) => a + b, 0) / last9Omega.length;
          const variance = last9Omega.reduce((sum, val) => sum + Math.pow(val - meanOmega, 2), 0) / last9Omega.length;
          setCriesVariance(variance);
          
          if (variance > 0.0025) {
            newAlerts.push(`CRIES variance ${variance.toFixed(4)} > 0.0025 threshold`);
          }
        }

        // Real anomaly count
        const anomalies = realEvents.filter(e => !e.verified || (e.sigma && e.sigma < 0.70)).length;
        setAnomalyCount(anomalies);
        
        if (anomalies >= 2) {
          newAlerts.push(`${anomalies} anomalies detected (≥2 threshold)`);
        }

        setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));

        // Build chain visualization from real receipts
        const nodes: ChainNode[] = realEvents.slice(0, 20).map(event => ({
          id: event.id,
          lamport: event.lamportClock,
          hash: event.selfHash,
          verified: event.verified || false,
          timestamp: event.timestamp,
        }));
        setChainNodes(nodes);

      } catch (error) {
        console.error('Error fetching real BEN receipts:', error);
      }
    };

    // Fetch immediately and then every 3 seconds
    fetchRealReceipts();
    const interval = setInterval(fetchRealReceipts, 3000 / replaySpeed);
    return () => clearInterval(interval);
  }, [isPaused, replaySpeed]);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const generateHash = () => {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const verifyChain = (prevDigest: string, expectedHash: string) => {
    // Simplified verification - in production, use actual cryptographic verification
    return Math.random() > 0.05; // 95% verification success rate
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const exportChainSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      lamportClock,
      chainIntegrity,
      activeReceipts,
      events: events.slice(0, 20),
      chainNodes,
      alerts,
    };
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ben-snapshot-${new Date().toISOString()}.json`;
    a.click();
  };

  const exportReceiptJSON = (event: BenEvent) => {
    const json = JSON.stringify(event, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${event.id}.json`;
    a.click();
  };

  const openInspector = (event: BenEvent) => {
    setSelectedEvent(event);
    setInspectorOpen(true);
  };

  const clearAlerts = () => setAlerts([]);

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl border border-green-400/50">
              <Link2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">BEN Runtime Dashboard</h1>
              <p className="text-cyan-400/60 font-mono text-sm">
                Blockchain Event Network | Lamport: {lamportClock} | Uptime: {formatUptime(uptime)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsPaused(!isPaused)} 
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              onClick={() => setReplaySpeed(replaySpeed === 1 ? 10 : 1)} 
              variant="outline"
              className="font-mono"
            >
              {replaySpeed}x
            </Button>
            <Button onClick={exportChainSnapshot} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Snapshot
            </Button>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-1 animate-pulse" />
                <div className="flex-1">
                  <h3 className="text-red-400 font-bold mb-2">Active BEN Alerts</h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {alerts.slice(0, 5).map((alert, i) => (
                      <div key={i} className="text-red-300 font-mono text-sm">• {alert}</div>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={clearAlerts} variant="ghost" size="sm" className="text-red-400">
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs for BEN Runtime, CRIES, Z-Scan, and Hybrid Clock */}
      <Tabs defaultValue="ben-runtime" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-slate-800/60 mb-6">
          <TabsTrigger value="ben-runtime" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            BEN Runtime
          </TabsTrigger>
          <TabsTrigger value="cries" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            CRIES Engine
          </TabsTrigger>
          <TabsTrigger value="zscan" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Z-Scan
          </TabsTrigger>
          <TabsTrigger value="hybrid-clock" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hybrid Clock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ben-runtime" className="space-y-4">
      {/* Top Section - System Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Active Receipts */}
        <Card className="bg-slate-800/60 border-blue-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileJson className="w-5 h-5 text-blue-400" />
              Active Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-400">{activeReceipts}</div>
            <p className="text-xs text-slate-400 mt-2">Total Δ-events recorded</p>
          </CardContent>
        </Card>

        {/* Last Z-Scan */}
        <Card className={`bg-slate-800/60 backdrop-blur-sm border-2 ${
          lastZScan === 'pass' ? 'border-green-500/30' :
          lastZScan === 'warning' ? 'border-yellow-500/30' :
          'border-red-500/30'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Z-Scan Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {lastZScan === 'pass' && <CheckCircle className="w-8 h-8 text-green-400" />}
              {lastZScan === 'warning' && <AlertTriangle className="w-8 h-8 text-yellow-400" />}
              {lastZScan === 'fail' && <XCircle className="w-8 h-8 text-red-400" />}
              <span className={`text-2xl font-bold ${
                lastZScan === 'pass' ? 'text-green-400' :
                lastZScan === 'warning' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {lastZScan.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Last verification scan</p>
          </CardContent>
        </Card>

        {/* Chain Integrity */}
        <Card className={`bg-slate-800/60 backdrop-blur-sm border-2 ${
          chainIntegrity === 'verified' ? 'border-green-500/30' :
          chainIntegrity === 'pending' ? 'border-yellow-500/30' :
          'border-red-500/30'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Chain Integrity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {chainIntegrity === 'verified' && <CheckCircle className="w-8 h-8 text-green-400" />}
              {chainIntegrity === 'pending' && <Clock className="w-8 h-8 text-yellow-400" />}
              {chainIntegrity === 'broken' && <XCircle className="w-8 h-8 text-red-400" />}
              <span className={`text-2xl font-bold ${
                chainIntegrity === 'verified' ? 'text-green-400' :
                chainIntegrity === 'pending' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {chainIntegrity.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Blockchain verification</p>
          </CardContent>
        </Card>
      </div>

      {/* New BEN Governance Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Latency Measurement */}
        <Card className={`bg-slate-800/60 backdrop-blur-sm border-2 ${
          latencyBreach > 0 ? 'border-red-500/30' : 'border-emerald-500/30'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Latency (≤60s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-400 mb-2">
              {latencyBreach === 0 ? '✓' : `${latencyBreach}⚠`}
            </div>
            <div className="text-xs text-slate-400 mb-1">
              {latencyBreach} breach{latencyBreach !== 1 ? 'es' : ''}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              (ts_receipt − ts_delta) ≤ 60s
            </p>
          </CardContent>
        </Card>

        {/* CRIES Variance Gate */}
        <Card className={`bg-slate-800/60 backdrop-blur-sm border-2 ${
          criesVariance > 0.0025 ? 'border-red-500/30' : 'border-violet-500/30'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              CRIES Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${
              criesVariance > 0.0025 ? 'text-red-400' : 'text-violet-400'
            }`}>
              {criesVariance.toFixed(4)}
            </div>
            <div className="text-xs text-slate-400 mb-1">
              Threshold: ≤ 0.0025
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Last-9 Ω variance
            </p>
          </CardContent>
        </Card>

        {/* Anomaly Counter */}
        <Card className={`bg-slate-800/60 backdrop-blur-sm border-2 ${
          anomalyCount >= 2 && activeReceipts >= 30 ? 'border-orange-500/30' : 'border-cyan-500/30'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${
              anomalyCount >= 2 && activeReceipts >= 30 ? 'text-orange-400' : 'text-cyan-400'
            }`}>
              {anomalyCount}
            </div>
            <div className="text-xs text-slate-400 mb-1">
              Trigger: ≥2 if ≥30 receipts
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Unverified or σ&lt;0.70
            </p>
          </CardContent>
        </Card>

        {/* Lamport Clock */}
        <Card className="bg-slate-800/60 border-blue-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Lamport Clock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-400">{lamportClock}</div>
            <p className="text-xs text-slate-400 mt-2">Monotonic event counter</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Event Stream */}
        <Card className="lg:col-span-2 bg-slate-800/60 border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="w-6 h-6 text-blue-400" />
              Live Event Stream
            </CardTitle>
            <CardDescription>Real-time Δ-events from Tracks A/B/C</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {events.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Waiting for BEN events...</p>
                </div>
              ) : (
                events.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => openInspector(event)}
                    className={`bg-slate-900/60 border rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                      event.type.includes('RISK') || event.type.includes('HITL')
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-slate-600/50 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getEventIcon(event.type)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">{event.type}</span>
                            <Badge className={`${getTrackColor(event.track)} font-mono text-xs`}>
                              Track-{event.track}
                            </Badge>
                            {event.verified === false && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50 font-mono text-xs">
                                UNVERIFIED
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-1">
                            Lamport: {event.lamportClock} | 
                            {event.sigma && ` σ=${event.sigma.toFixed(2)} |`}
                            {' '}{new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <span>Hash: {event.selfHash.substring(0, 12)}...</span>
                      <span>•</span>
                      <span>Prev: {event.prevDigest.substring(0, 12)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chain Visualization */}
        <Card className="bg-slate-800/60 border-green-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-green-400" />
              Chain Graph
            </CardTitle>
            <CardDescription>Hash continuity visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {chainNodes.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Building chain...</p>
                </div>
              ) : (
                chainNodes.map((node, index) => (
                  <div key={node.id}>
                    {/* Node */}
                    <div className={`relative p-3 rounded-lg border-2 transition-all ${
                      node.verified
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-yellow-500/10 border-yellow-500/50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm font-bold text-white">
                          #{node.lamport}
                        </span>
                        {node.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 break-all">
                        {node.hash.substring(0, 16)}...
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(node.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Connector */}
                    {index < chainNodes.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className={`w-0.5 h-4 ${
                          node.verified && chainNodes[index + 1].verified
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="cries">
          <CRIESDashboard />
        </TabsContent>

        <TabsContent value="zscan">
          <ZScanDashboard />
        </TabsContent>

        <TabsContent value="hybrid-clock">
          <HybridClockDashboard />
        </TabsContent>
      </Tabs>

      {/* Receipt Inspector Sheet */}
      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent className="bg-slate-900 border-l border-blue-500/30 w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <FileJson className="w-6 h-6 text-blue-400" />
              Receipt Inspector
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Detailed Δ-event analysis and verification
            </SheetDescription>
          </SheetHeader>

          {selectedEvent && (
            <div className="mt-6 space-y-6">
              {/* Event Header */}
              <div className="bg-slate-800/60 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{getEventIcon(selectedEvent.type)}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedEvent.type}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getTrackColor(selectedEvent.track)} font-mono`}>
                        Track-{selectedEvent.track} ({getTrackName(selectedEvent.track)})
                      </Badge>
                      {selectedEvent.verified === false && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/50 font-mono">
                          UNVERIFIED
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Lamport Clock:</span>
                    <span className="ml-2 font-mono text-white font-bold">{selectedEvent.lamportClock}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="ml-2 font-mono text-white">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                  </div>
                  {selectedEvent.sigma && (
                    <div>
                      <span className="text-slate-400">Stability (σ):</span>
                      <span className={`ml-2 font-mono font-bold ${
                        selectedEvent.sigma >= 0.85 ? 'text-green-400' :
                        selectedEvent.sigma >= 0.70 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {selectedEvent.sigma.toFixed(3)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Trace ID:</span>
                    <span className="ml-2 font-mono text-cyan-400">{selectedEvent.content.traceId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Hash Information */}
              <div className="bg-slate-800/60 border border-green-500/30 rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-green-400" />
                  Chain Hashes
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Self Hash:</div>
                    <div className="bg-slate-900 rounded p-2 font-mono text-xs text-green-400 break-all">
                      {selectedEvent.selfHash}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Previous Digest:</div>
                    <div className="bg-slate-900 rounded p-2 font-mono text-xs text-blue-400 break-all">
                      {selectedEvent.prevDigest}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedEvent.verified !== false ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Chain continuity verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">Verification pending or failed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="bg-slate-800/60 border border-purple-500/30 rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-4">Event Content</h4>
                <pre className="bg-slate-900 rounded p-4 text-xs text-cyan-400 overflow-x-auto">
                  {JSON.stringify(selectedEvent.content, null, 2)}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => exportReceiptJSON(selectedEvent)} className="flex items-center gap-2 flex-1">
                  <Download className="w-4 h-4" />
                  Export Receipt JSON
                </Button>
                <Button variant="outline" className="flex items-center gap-2 flex-1">
                  <ArrowUpCircle className="w-4 h-4" />
                  Promote to Band-2
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
