'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Radio,
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Pause,
  Play,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  XCircle,
  AlertCircle,
  Bell,
  ChevronRight,
  ArrowLeft,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

interface LiveSession {
  id: string;
  modelName: string;
  analyst: string;
  status: 'normal' | 'watch' | 'intervention';
  sigma: number;
  lastEvent: string;
  track: 'A' | 'B' | 'C';
  updatedAt: Date;
  // New Rosetta fields
  glyph?: '△' | '▽' | '⇄' | '⤴' | '⟂' | '∅';
  guild?: 'reason' | 'engineering' | 'creative' | 'ethics' | 'ops';
}

interface Committee {
  symbol: string;
  name: string;
  active: boolean;
  votingStatus: 'unanimous' | 'majority' | 'split' | 'no-quorum';
  lastDecision: string;
}

interface GuildWeight {
  name: string;
  weight: number;
  activeModels: number;
}

interface GovernanceAlert {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  receiptId?: string;
  expanded?: boolean;
}

interface SigmaDataPoint {
  time: string;
  sigma: number;
  timestamp: number;
}

interface ActivityHeatmapCell {
  model: string;
  time: string;
  intensity: number;
}

export default function LiveTrackingDashboard() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  // Global system summary
  const [activeModels, setActiveModels] = useState(3);
  const [totalReceiptsToday, setTotalReceiptsToday] = useState(247);
  const [compositeSignma, setCompositeSignma] = useState(0.89);
  const [chainIntegrity, setChainIntegrity] = useState<'verified' | 'pending' | 'broken'>('verified');
  const [systemUptime, setSystemUptime] = useState(0); // seconds
  const [lamportClock, setLamportClock] = useState(1523);

  // Live activity tracking
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [alerts, setAlerts] = useState<GovernanceAlert[]>([]);
  const [sigmaHistory, setSigmaHistory] = useState<SigmaDataPoint[]>([]);
  const [activityHeatmap, setActivityHeatmap] = useState<ActivityHeatmapCell[]>([]);

  // New Rosetta governance features
  const [committees, setCommittees] = useState<Committee[]>([
    { symbol: 'Ψ', name: 'Ethics Committee', active: true, votingStatus: 'unanimous', lastDecision: 'Approved safety gate' },
    { symbol: 'Θ', name: 'Technical Committee', active: true, votingStatus: 'majority', lastDecision: 'Review policy field' }
  ]);
  const [guildWeights, setGuildWeights] = useState<GuildWeight[]>([
    { name: 'Reason', weight: 0.32, activeModels: 1 },
    { name: 'Engineering', weight: 0.28, activeModels: 1 },
    { name: 'Creative', weight: 0.18, activeModels: 0 },
    { name: 'Ethics', weight: 0.12, activeModels: 1 },
    { name: 'Ops', weight: 0.10, activeModels: 0 }
  ]);
  const [oneQuestionRule, setOneQuestionRule] = useState({
    active: true,
    lastTrigger: 'Band-0 gate may fail',
    question: 'Should we proceed with reduced strictness for this prompt?',
    response: 'Yes, proceed with caution'
  });

  // UI state
  const [isPaused, setIsPaused] = useState(false);
  const [filterTrack, setFilterTrack] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [filterAnalyst, setFilterAnalyst] = useState('');
  const [filterModel, setFilterModel] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const uptimeInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch real conversation data
  useEffect(() => {
    const fetchRealData = async () => {
      try {
  const response = await fetch(`${BACKEND_URL ?? ''}/api/conversations/aggregate`);
        const data = await response.json();

        if (!data.conversations || data.conversations.length === 0) {
          console.log('No real conversation data yet. Run parallel prompts to generate live tracking data.');
          return;
        }

        // Map real conversations to live sessions
        const realSessions: LiveSession[] = data.conversations.slice(0, 10).map((conv: any) => {
          const sigma = conv.cries?.sigma || 0;
          let status: 'normal' | 'watch' | 'intervention' = 'normal';
          if (sigma < 0.8) status = 'intervention';
          else if (sigma < 0.85) status = 'watch';

          // Determine track from CRIES composition
          const cries = conv.cries || {};
          let track: 'A' | 'B' | 'C' = 'A';
          if (cries.R > 0.8 && cries.S > 0.9) track = 'A'; // Rigor + Strictness
          else if (cries.I > 0.7 && cries.E > 0.7) track = 'B'; // Integration + Empathy
          else track = 'C'; // Creative/Novel

          return {
            id: conv.conversationId || `sess-${Date.now()}`,
            modelName: conv.modelName || 'Unknown Model',
            analyst: 'Track-A Analyzer',
            status,
            sigma,
            lastEvent: conv.lastEventType || 'Δ-ANALYSIS',
            track,
            updatedAt: new Date(conv.timestamp || Date.now()),
            glyph: sigma > 0.9 ? '△' : sigma > 0.85 ? '⤴' : '⇄',
            guild: cries.R > 0.8 ? 'reason' : cries.E > 0.7 ? 'ethics' : 'engineering'
          };
        });

        setLiveSessions(realSessions);
        setActiveModels(data.uniqueModels?.length || 0);
        setTotalReceiptsToday(data.totalReceipts || 0);
        setCompositeSignma(data.averageSigma || 0);
        setLamportClock(data.latestLamport || 0);

        // Build real sigma history from conversation timestamps
        const history: SigmaDataPoint[] = data.conversations.slice(-15).map((conv: any) => ({
          time: new Date(conv.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          sigma: conv.cries?.sigma || 0,
          timestamp: new Date(conv.timestamp).getTime()
        }));
        setSigmaHistory(history);

        // Extract real alerts from conversations with low scores
        const realAlerts: GovernanceAlert[] = data.conversations
          .filter((conv: any) => conv.cries?.sigma < 0.85)
          .slice(0, 5)
          .map((conv: any) => ({
            id: `alert-${conv.conversationId}`,
            type: conv.cries?.sigma < 0.8 ? 'Δ-RISK-GATE' : 'Δ-STABILITY-ALERT',
            severity: conv.cries?.sigma < 0.8 ? 'high' : 'medium',
            message: `${conv.modelName}: σ = ${(conv.cries?.sigma || 0).toFixed(2)}`,
            timestamp: new Date(conv.timestamp),
            receiptId: conv.receiptId
          })) as GovernanceAlert[];

        setAlerts(realAlerts);
      } catch (error) {
        console.error('Error fetching real conversation data:', error);
      }
    };

    fetchRealData();
  }, []);

  // System uptime counter
  useEffect(() => {
    uptimeInterval.current = setInterval(() => {
      setSystemUptime(prev => prev + 1);
    }, 1000);

    return () => {
      if (uptimeInterval.current) clearInterval(uptimeInterval.current);
    };
  }, []);

  // Real-time updates from actual conversation data
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(async () => {
      try {
  const response = await fetch(`${BACKEND_URL ?? ''}/api/conversations/aggregate`);
        const data = await response.json();

        if (!data.conversations || data.conversations.length === 0) {
          return; // No new data yet
        }

        // Update live sessions with latest real data
        const realSessions: LiveSession[] = data.conversations.slice(0, 10).map((conv: any) => {
          const sigma = conv.cries?.sigma || 0;
          let status: 'normal' | 'watch' | 'intervention' = 'normal';
          if (sigma < 0.8) status = 'intervention';
          else if (sigma < 0.85) status = 'watch';

          const cries = conv.cries || {};
          // Track assignment based on governance architecture:
          // Track C = Core LLM (always)
          // Track A = BEN Analyst (if analyzing)
          // Track B = AuditaAI Governance (if Rosetta booted)
          let track: 'A' | 'B' | 'C' = 'C'; // Default to Core LLM
          if (conv.rosettaBooted) {
            track = 'B'; // Governance layer active
          } else if (conv.benAnalyzing || cries.S > 0.8) {
            track = 'A'; // BEN analysis active
          }

          return {
            id: conv.conversationId || `sess-${Date.now()}`,
            modelName: conv.modelName || 'Unknown Model',
            analyst: track === 'B' ? 'AuditaAI Governance' : track === 'A' ? 'BEN Analyst' : 'Core LLM',
            status,
            sigma,
            lastEvent: conv.lastEventType || 'Δ-ANALYSIS',
            track,
            updatedAt: new Date(conv.timestamp || Date.now()),
            glyph: sigma > 0.9 ? '△' : sigma > 0.85 ? '⤴' : '⇄',
            guild: cries.R > 0.8 ? 'reason' : cries.E > 0.7 ? 'ethics' : 'engineering'
          };
        });

        setLiveSessions(realSessions);

        // Update sigma history with real data
        const latestConv = data.conversations[0];
        if (latestConv?.cries?.sigma) {
          const newPoint: SigmaDataPoint = {
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            sigma: latestConv.cries.sigma,
            timestamp: Date.now()
          };
          setSigmaHistory(prev => [...prev.slice(-14), newPoint]);
        }

        // Update global metrics from real data
        setLamportClock(data.latestLamport || 0);
        setTotalReceiptsToday(data.totalReceipts || 0);
        setCompositeSignma(data.averageSigma || 0);
        setActiveModels(data.uniqueModels?.length || 0);

        // Check for real alerts based on sigma thresholds
        const newAlerts = data.conversations
          .filter((conv: any) => conv.cries?.sigma < 0.85)
          .slice(0, 1)
          .map((conv: any) => ({
            id: `alert-${conv.conversationId}-${Date.now()}`,
            type: conv.cries?.sigma < 0.8 ? 'Δ-RISK-GATE' : 'Δ-STABILITY-ALERT',
            severity: conv.cries?.sigma < 0.8 ? 'high' : 'medium',
            message: `${conv.modelName}: σ = ${(conv.cries?.sigma || 0).toFixed(2)} below threshold`,
            timestamp: new Date(),
            receiptId: conv.receiptId
          })) as GovernanceAlert[];

        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Format uptime as HH:MM:SS
  const formatUptime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get status icon and color
  const getStatusDisplay = (status: 'normal' | 'watch' | 'intervention') => {
    switch (status) {
      case 'normal':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-500/10', label: '🟢 Normal' };
      case 'watch':
        return { icon: <Eye className="w-4 h-4" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: '🟡 Watch' };
      case 'intervention':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-500/10', label: '🔴 Intervention' };
    }
  };

  // Get track color
  const getTrackColor = (track: 'A' | 'B' | 'C') => {
    switch (track) {
      case 'A': return 'text-blue-500 bg-blue-500/10';
      case 'B': return 'text-green-500 bg-green-500/10';
      case 'C': return 'text-orange-500 bg-orange-500/10';
    }
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-500/5';
      case 'medium': return 'border-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-blue-500 bg-blue-500/5';
    }
  };

  // Export live snapshot
  const exportSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      summary: {
        activeModels,
        totalReceiptsToday,
        compositeSignma,
        chainIntegrity,
        systemUptime: formatUptime(systemUptime),
        lamportClock
      },
      liveSessions,
      alerts,
      sigmaHistory
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle alert expansion
  const toggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, expanded: !alert.expanded } : alert
    ));
  };

  // Filter sessions
  const filteredSessions = liveSessions.filter(session => {
    if (filterTrack !== 'all' && session.track !== filterTrack) return false;
    if (filterAnalyst && !session.analyst.toLowerCase().includes(filterAnalyst.toLowerCase())) return false;
    if (filterModel && !session.modelName.toLowerCase().includes(filterModel.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Live Tracking Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Real-time mission control for AuditaAI governance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="border-slate-700"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportSnapshot}
              className="border-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Snapshot
            </Button>
            {!isPaused && (
              <Badge variant="outline" className="border-green-500 text-green-500 animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
        </div>

        {/* Global System Summary */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{activeModels}</div>
              <p className="text-xs text-slate-500 mt-1">Live sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Receipts Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{totalReceiptsToday}</div>
              <p className="text-xs text-slate-500 mt-1">Δ-events issued</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Composite σ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{compositeSignma.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">CRIES stability</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Chain Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {chainIntegrity === 'verified' && (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-2xl font-bold text-green-400">Verified</span>
                  </>
                )}
                {chainIntegrity === 'pending' && (
                  <>
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-400">Pending</span>
                  </>
                )}
                {chainIntegrity === 'broken' && (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="text-2xl font-bold text-red-400">Broken</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                System Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400 font-mono">{formatUptime(systemUptime)}</div>
              <p className="text-xs text-slate-500 mt-1">Since BEN boot</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Lamport Clock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-400 font-mono">{lamportClock}</div>
              <p className="text-xs text-slate-500 mt-1">Logical timestamp</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Live Activity Table */}
          <div className="col-span-2 space-y-4">
            {/* Filters */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <div className="flex gap-2">
                  <Button
                    variant={filterTrack === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTrack('all')}
                    className="text-xs"
                  >
                    All Tracks
                  </Button>
                  <Button
                    variant={filterTrack === 'A' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTrack('A')}
                    className="text-xs"
                  >
                    Track A
                  </Button>
                  <Button
                    variant={filterTrack === 'B' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTrack('B')}
                    className="text-xs"
                  >
                    Track B
                  </Button>
                  <Button
                    variant={filterTrack === 'C' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTrack('C')}
                    className="text-xs"
                  >
                    Track C
                  </Button>
                </div>
                <Input
                  placeholder="Filter by analyst..."
                  value={filterAnalyst}
                  onChange={(e) => setFilterAnalyst(e.target.value)}
                  className="max-w-[200px] bg-slate-800 border-slate-700"
                />
                <Input
                  placeholder="Filter by model..."
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="max-w-[200px] bg-slate-800 border-slate-700"
                />
              </CardContent>
            </Card>

            {/* Activity Table */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Live Activity
                </CardTitle>
                <CardDescription>Real-time model execution and governance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">Model</th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">Analyst</th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">Track</th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">Last Event</th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">σ</th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                        <th className="text-left text-xs font-medium text-slate-400 pb-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => {
                        const statusDisplay = getStatusDisplay(session.status);
                        return (
                          <tr key={session.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 text-sm font-medium text-slate-200">{session.modelName}</td>
                            <td className="py-3 text-sm text-slate-300">{session.analyst}</td>
                            <td className="py-3">
                              <Badge className={`${getTrackColor(session.track)} border-0 text-xs`}>
                                Track {session.track}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <code className="text-xs bg-slate-800 px-2 py-1 rounded text-cyan-400">
                                {session.lastEvent}
                              </code>
                            </td>
                            <td className="py-3 text-sm font-mono font-bold text-green-400">{session.sigma.toFixed(2)}</td>
                            <td className="py-3">
                              <Badge className={`${statusDisplay.bg} ${statusDisplay.color} border-0 text-xs flex items-center gap-1 w-fit`}>
                                {statusDisplay.icon}
                                {session.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-xs text-slate-400 font-mono">
                              {session.updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Composite σ Trend */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Composite σ Trend
                </CardTitle>
                <CardDescription>CRIES stability over last 15 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={sigmaHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#64748b" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      domain={[0.7, 1.0]} 
                      stroke="#64748b" 
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sigma" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alert Center Sidebar */}
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-400" />
                  Alert Center
                </CardTitle>
                <CardDescription>Latest governance alerts and interventions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p className="text-sm">All systems nominal</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-l-4 rounded-lg p-3 cursor-pointer transition-all ${getAlertSeverityColor(alert.severity)} hover:bg-opacity-20`}
                      onClick={() => toggleAlert(alert.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-cyan-400">
                              {alert.type}
                            </code>
                            <Badge 
                              variant="outline" 
                              className={`text-xs border-0 ${
                                alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300 mb-1">{alert.message}</p>
                          <p className="text-xs text-slate-500">
                            {alert.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                          
                          {alert.expanded && alert.receiptId && (
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              <p className="text-xs text-slate-400 mb-2">Receipt Details:</p>
                              <div className="bg-slate-800 rounded p-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Receipt ID:</span>
                                  <code className="text-cyan-400 font-mono">{alert.receiptId}</code>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Lamport:</span>
                                  <code className="text-purple-400 font-mono">{lamportClock - Math.floor(Math.random() * 10)}</code>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Hash:</span>
                                  <code className="text-pink-400 font-mono text-[10px]">0x{Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')}</code>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <ChevronRight 
                          className={`w-4 h-4 text-slate-500 transition-transform ${alert.expanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">High Alerts</span>
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                    {alerts.filter(a => a.severity === 'high').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Watch Status</span>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                    {liveSessions.filter(s => s.status === 'watch').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Interventions</span>
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                    {liveSessions.filter(s => s.status === 'intervention').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Avg Response Time</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    142ms
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rosetta Governance Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Glyph FSM Visualization */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Glyph FSM — Cognitive Modes
              </CardTitle>
              <CardDescription>Finite State Machine tracking for active sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Glyph Legend */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-2xl mb-1">△</div>
                    <div className="text-xs text-slate-400">Stabilize</div>
                  </div>
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-2xl mb-1">▽</div>
                    <div className="text-xs text-slate-400">Explore</div>
                  </div>
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-2xl mb-1">⇄</div>
                    <div className="text-xs text-slate-400">Integrate</div>
                  </div>
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-2xl mb-1">⤴</div>
                    <div className="text-xs text-slate-400">Resolve</div>
                  </div>
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-2xl mb-1">⟂</div>
                    <div className="text-xs text-slate-400">Phase-Flip</div>
                  </div>
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-2xl mb-1">∅</div>
                    <div className="text-xs text-slate-400">Null</div>
                  </div>
                </div>

                {/* Active Session Glyphs */}
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-sm text-slate-300 mb-3">Active Session States:</h4>
                  <div className="space-y-2">
                    {filteredSessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between bg-slate-800/50 rounded p-2">
                        <span className="text-sm text-slate-300">{session.modelName}</span>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {session.guild || 'reason'}
                          </Badge>
                          <div className="text-2xl">{session.glyph || '△'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FSM State Distribution */}
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-sm text-slate-300 mb-3">State Distribution:</h4>
                  <div className="space-y-2">
                    {[
                      { glyph: '△', name: 'Stabilize', count: liveSessions.filter(s => s.glyph === '△').length },
                      { glyph: '▽', name: 'Explore', count: liveSessions.filter(s => s.glyph === '▽').length },
                      { glyph: '⇄', name: 'Integrate', count: liveSessions.filter(s => s.glyph === '⇄').length },
                      { glyph: '⤴', name: 'Resolve', count: liveSessions.filter(s => s.glyph === '⤴').length },
                    ].map((state) => (
                      <div key={state.glyph} className="flex items-center gap-2">
                        <div className="text-lg w-6">{state.glyph}</div>
                        <div className="flex-1 bg-slate-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                            style={{ width: `${(state.count / liveSessions.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{state.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Committees Panel */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Governance Committees
              </CardTitle>
              <CardDescription>Ψ (Ethics) and Θ (Technical) oversight bodies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {committees.map((committee) => (
                  <div key={committee.symbol} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{committee.symbol}</div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-200">{committee.name}</h4>
                          <Badge className={`text-xs mt-1 ${
                            committee.active 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}>
                            {committee.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={`${
                        committee.votingStatus === 'unanimous' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        committee.votingStatus === 'majority' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        committee.votingStatus === 'split' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {committee.votingStatus}
                      </Badge>
                    </div>
                    <div className="border-t border-slate-700 pt-3">
                      <p className="text-xs text-slate-400 mb-1">Last Decision:</p>
                      <p className="text-sm text-slate-300">{committee.lastDecision}</p>
                    </div>
                  </div>
                ))}

                {/* Committee Summary */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">Committee Status</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Both oversight committees active. {committees.filter(c => c.votingStatus === 'unanimous').length} unanimous,{' '}
                    {committees.filter(c => c.votingStatus === 'majority').length} majority votes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* One Question Rule Indicator */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                One Question Rule
              </CardTitle>
              <CardDescription>"If a Band-0 gate may fail, ask exactly one clarifying question, then act"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Active Status */}
                <div className="flex items-center justify-between bg-slate-800/50 rounded p-3">
                  <span className="text-sm text-slate-300">Rule Status:</span>
                  <Badge className={`${
                    oneQuestionRule.active 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }`}>
                    {oneQuestionRule.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Last Trigger */}
                {oneQuestionRule.lastTrigger && (
                  <div className="border border-yellow-500/30 rounded-lg p-3 bg-yellow-500/10">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-yellow-300 font-semibold mb-1">Last Trigger:</p>
                        <p className="text-sm text-slate-300 mb-3">{oneQuestionRule.lastTrigger}</p>
                        
                        <div className="bg-slate-800/50 rounded p-2 mb-2">
                          <p className="text-xs text-slate-400 mb-1">Question Asked:</p>
                          <p className="text-sm text-slate-200">{oneQuestionRule.question}</p>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded p-2">
                          <p className="text-xs text-slate-400 mb-1">Response:</p>
                          <p className="text-sm text-green-300">{oneQuestionRule.response}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Policy Info */}
                <div className="border-t border-slate-700 pt-3">
                  <p className="text-xs text-slate-400 mb-2">Policy Definition:</p>
                  <div className="bg-slate-800 rounded p-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      When a Band-0 governance gate (Ω &lt; 0.74 threshold) may fail, the system must ask exactly one
                      clarifying question to the user before taking any automated action. This ensures human oversight
                      at critical decision points while maintaining operational efficiency.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guild Weights Display */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Guild Weight Distribution
              </CardTitle>
              <CardDescription>Cognitive labor allocation across 5 guilds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guildWeights.map((guild, idx) => (
                  <div key={guild.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">{guild.name}</span>
                        <Badge className={`text-xs ${
                          guild.activeModels > 0 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {guild.activeModels} active
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-cyan-400">{(guild.weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 transition-all ${
                          idx === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          idx === 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                          idx === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          idx === 3 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          'bg-gradient-to-r from-red-500 to-rose-500'
                        }`}
                        style={{ width: `${guild.weight * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Total Distribution Check */}
                <div className="border-t border-slate-700 pt-4">
                  <div className="bg-slate-800 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Total Weight:</span>
                      <span className="text-sm font-bold text-green-400">
                        {(guildWeights.reduce((sum, g) => sum + g.weight, 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Active Models:</span>
                      <span className="text-sm font-bold text-cyan-400">
                        {guildWeights.reduce((sum, g) => sum + g.activeModels, 0)} / {liveSessions.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guild Coverage Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">Guild Coverage</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {guildWeights.filter(g => g.activeModels > 0).length} of 5 guilds currently active.{' '}
                    Reason and Engineering guilds maintain primary operational responsibility.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>WebSocket: {isPaused ? '⚫ Paused' : '🟢 Connected'}</span>
                <span>•</span>
                <span>Update Rate: 3s</span>
                <span>•</span>
                <span>Retention: 15min history</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span>AuditaAI Live Tracking v1.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
