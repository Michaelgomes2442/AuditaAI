'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Shield,
  Eye,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import { io, Socket } from 'socket.io-client';

interface CRIESScore {
  completeness: number;
  reliability: number;
  integrity: number;
  effectiveness: number;
  security: number;
  overall: number;
  timestamp: string;
  modelName: string;
}

interface ConsensusEvent {
  id: string;
  type: 'ACHIEVED' | 'DIVERGENCE' | 'PENDING';
  models: string[];
  confidence: number;
  timestamp: string;
  lamportClock: number;
}

interface DashboardMetrics {
  activeAudits: number;
  totalAudits: number;
  consensusRate: number;
  averageCRIES: number;
  lamportClock: number;
  sigmaScore: number;
  omegaScore: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeAudits: 0,
    totalAudits: 0,
    consensusRate: 0,
    averageCRIES: 0,
    lamportClock: 0,
    sigmaScore: 0,
    omegaScore: 0
  });
  const [recentScores, setRecentScores] = useState<CRIESScore[]>([]);
  const [consensusEvents, setConsensusEvents] = useState<ConsensusEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const socket: Socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('[Dashboard] Socket.IO connected:', socket.id);
      setIsConnected(true);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Join organization room if user has orgId
      if (session?.user?.id) {
        socket.emit('join-org', '1'); // Default to org 1 for pilot
      }
    });

    socket.on('disconnect', () => {
      console.log('[Dashboard] Socket.IO disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Dashboard] Connection error:', error);
      setIsConnected(false);
    });

    // Listen for audit updates
    socket.on('audit-update', (data) => {
      console.log('[Dashboard] Audit update:', data);
      setLastUpdate(new Date().toLocaleTimeString());
      
      if (data.type === 'BLOCK_CREATED') {
        setMetrics(prev => ({
          ...prev,
          totalAudits: prev.totalAudits + 1
        }));
      } else if (data.type === 'RECORD_CREATED') {
        setMetrics(prev => ({
          ...prev,
          activeAudits: prev.activeAudits + 1,
          totalAudits: prev.totalAudits + 1
        }));
      }
    });

    // Listen for metrics updates
    socket.on('metrics-update', (data) => {
      console.log('[Dashboard] Metrics update:', data);
      if (data.metrics) {
        setMetrics(prev => ({
          ...prev,
          averageCRIES: data.metrics.averageCRIES || prev.averageCRIES,
          sigmaScore: data.metrics.Sigma || prev.sigmaScore,
          omegaScore: data.metrics.Omega || prev.omegaScore,
          consensusRate: data.metrics.consensusRate || prev.consensusRate
        }));
        setLastUpdate(new Date().toLocaleTimeString());
      }
    });

    // Listen for CRIES score updates (from live tests)
    socket.on('cries-score', (data) => {
      console.log('[Dashboard] CRIES score:', data);
      setRecentScores(prev => [data, ...prev].slice(0, 10));
      setLastUpdate(new Date().toLocaleTimeString());
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [session]);

  // Format score with color coding
  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-400';
    if (score >= 0.70) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Format consensus type badge
  const getConsensusBadge = (type: string) => {
    switch (type) {
      case 'ACHIEVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'DIVERGENCE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <Link href="/lab">
                <Button variant="ghost" size="sm">
                  Lab
                </Button>
              </Link>
              <Link href="/pilot">
                <Button variant="ghost" size="sm">
                  Pilot
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-gray-400">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
              {session?.user?.email && (
                <span className="text-sm text-gray-400">{session.user.email}</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Live Dashboard
          </h1>
          <p className="text-gray-400">
            Real-time audit metrics and consensus events
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Last update: {lastUpdate}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Audits */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Audits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.activeAudits > 0 ? (
                <div className="text-3xl font-bold text-blue-400">
                  {metrics.activeAudits}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Awaiting results...</div>
              )}
              {metrics.totalAudits > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.totalAudits} total
                </p>
              )}
            </CardContent>
          </Card>

          {/* Average CRIES Score */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Avg CRIES Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.averageCRIES > 0 ? (
                <div className={`text-3xl font-bold ${getScoreColor(metrics.averageCRIES)}`}>
                  {(metrics.averageCRIES * 100).toFixed(1)}%
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Awaiting results...</div>
              )}
            </CardContent>
          </Card>

          {/* Consensus Rate */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Consensus Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.consensusRate > 0 ? (
                <div className="text-3xl font-bold text-green-400">
                  {(metrics.consensusRate * 100).toFixed(1)}%
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Awaiting results...</div>
              )}
            </CardContent>
          </Card>

          {/* Lamport Clock */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Lamport Clock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.lamportClock > 0 ? (
                <div className="text-3xl font-bold text-purple-400 font-mono">
                  {metrics.lamportClock.toLocaleString()}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Awaiting results...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sigma & Omega Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sigma Score (System Integrity) */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Sigma Score (Σ)
              </CardTitle>
              <CardDescription>
                System integrity and audit chain verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.sigmaScore > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-bold ${getScoreColor(metrics.sigmaScore)}`}>
                      {(metrics.sigmaScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${metrics.sigmaScore * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 italic">
                  Awaiting results...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Omega Score (Witness Consensus) */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                Omega Score (Ω)
              </CardTitle>
              <CardDescription>
                Cross-model witness consensus strength
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.omegaScore > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-bold ${getScoreColor(metrics.omegaScore)}`}>
                      {(metrics.omegaScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${metrics.omegaScore * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 italic">
                  Awaiting results...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent CRIES Scores */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Recent CRIES Scores
            </CardTitle>
            <CardDescription>
              Live scores as tests complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentScores.length > 0 ? (
              <div className="space-y-3">
                {recentScores.map((score, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white mb-1">{score.modelName}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(score.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-3 sm:mr-4 w-full sm:w-auto">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">C</div>
                        <div className={`text-sm font-bold ${getScoreColor(score.completeness)}`}>
                          {(score.completeness * 100).toFixed(0)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">R</div>
                        <div className={`text-sm font-bold ${getScoreColor(score.reliability)}`}>
                          {(score.reliability * 100).toFixed(0)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">I</div>
                        <div className={`text-sm font-bold ${getScoreColor(score.integrity)}`}>
                          {(score.integrity * 100).toFixed(0)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">E</div>
                        <div className={`text-sm font-bold ${getScoreColor(score.effectiveness)}`}>
                          {(score.effectiveness * 100).toFixed(0)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">S</div>
                        <div className={`text-sm font-bold ${getScoreColor(score.security)}`}>
                          {(score.security * 100).toFixed(0)}
                        </div>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.overall)}`}>
                      {(score.overall * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 italic">Awaiting results...</p>
                <p className="text-sm text-gray-600 mt-2">
                  Run tests in the Lab to see live CRIES scores here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consensus Events Stream */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Consensus Events Stream
            </CardTitle>
            <CardDescription>
              Real-time witness consensus updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consensusEvents.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {consensusEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getConsensusBadge(event.type)}`}>
                        {event.type}
                      </div>
                      <div className="text-sm text-gray-400">
                        {event.models.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-gray-500">
                        Confidence: <span className="text-white font-medium">{(event.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-gray-600 font-mono text-xs">
                        L:{event.lamportClock}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 italic">Awaiting results...</p>
                <p className="text-sm text-gray-600 mt-2">
                  Run witness comparisons to see consensus events here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Monitoring Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Performance Monitoring
          </h2>
          <PerformanceMetrics />
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <RefreshCw className={`w-5 h-5 text-blue-400 mt-0.5 ${isConnected ? 'animate-spin' : ''}`} />
            <div>
              <p className="text-sm text-blue-400 font-medium mb-1">
                Live Updates {isConnected ? 'Active' : 'Reconnecting...'}
              </p>
              <p className="text-xs text-gray-400">
                This dashboard automatically updates in real-time as audits complete. 
                {!isConnected && ' Connection lost - attempting to reconnect...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
