'use client';

import React, { useEffect, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Activity, TrendingUp, Shield, Zap } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface FORGEData {
  F: number; // Fabrication Detection
  O: number; // Oversight Quality
  R: number; // Refusal Accuracy
  G: number; // Guidance Quality
  E: number; // Evidence Grounding
  // Legacy backward-compat mapping (for older clients) — migrating to FORGE
  C?: number; // Mapped from O (Oversight)
  I?: number; // Deprecated (mapped to FORGE 'G' guidance)
  S?: number; // Mapped from F (Fabrication)
  avg: number; // Average score
  sub_metrics?: {
    F?: Record<string, number>;
    O?: Record<string, number>;
    R?: Record<string, number>;
    G?: Record<string, number>;
    E?: Record<string, number>;
    // Legacy (backward compatibility)
    C?: Record<string, number>;
    I?: Record<string, number>;
    S?: Record<string, number>;
  };
}

interface FORGEUpdate {
  standard: FORGEData;
  governed: FORGEData;
  improvement: number;
  timestamp: string;
  model?: string;
}

interface FORGEMetricsProps {
  showComparison?: boolean;
  title?: string;
}

export default function FORGEMetrics({ showComparison = false, title = "Live FORGE Metrics" }: FORGEMetricsProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<FORGEUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    const options = {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    };

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const socketInstance = BACKEND_URL ? io(BACKEND_URL, options) : io(options);

    socketInstance.on('connect', () => {
      console.log('✅ FORGE WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ FORGE WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('forge-update', (data: FORGEUpdate) => {
      console.log('📊 FORGE Update received:', data);
      setLatestMetrics(data);
      
      // Trigger pulse animation
      setAnimatePulse(true);
      setTimeout(() => setAnimatePulse(false), 1000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const getColorClass = (value: number): string => {
    if (value >= 0.9) return 'text-emerald-500'; // 💚 Excellent
    if (value >= 0.7) return 'text-green-500';   // 🟢 Good
    if (value >= 0.4) return 'text-yellow-500';  // 🟡 Fair
    return 'text-red-500';                       // 🔴 Poor
  };

  const getStatusEmoji = (value: number): string => {
    if (value >= 0.9) return '💚';
    if (value >= 0.7) return '🟢';
    if (value >= 0.4) return '🟡';
    return '🔴';
  };

  const getBackgroundClass = (value: number): string => {
    if (value >= 0.9) return 'bg-emerald-500/10 border-emerald-500/30';
    if (value >= 0.7) return 'bg-green-500/10 border-green-500/30';
    if (value >= 0.4) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const renderMetricBar = (label: string, value: number, icon: React.ReactNode, subMetrics?: Record<string, number>) => {
    const percentage = Math.round(value * 100);
    const colorClass = getColorClass(value);
    const emoji = getStatusEmoji(value);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="text-gray-400">{icon}</span>
                <span className="font-medium text-gray-200 underline decoration-dotted">{label}</span>
              </div>
            </PopoverTrigger>
            {subMetrics && (
              <PopoverContent align="start">
                <div className="text-xs font-mono">
                  <div className="mb-1 font-bold">{label} Sub-metrics</div>
                  {Object.entries(subMetrics).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}</span>
                      <span>{v.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            )}
          </Popover>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${colorClass} font-bold transition-colors duration-300`}>
              {percentage}%
            </span>
            <span className="text-xl">{emoji}</span>
          </div>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderComparisonView = (metrics: FORGEUpdate) => {
    const metricLabels = [
      { key: 'fabrication', label: 'Fabrication', icon: '🎭' },
      { key: 'oversight', label: 'Oversight', icon: '👁️' },
      { key: 'refusal', label: 'Refusal', icon: '�️' },
      { key: 'guidance', label: 'Guidance', icon: '🧭' },
      { key: 'evidence', label: 'Evidence', icon: '�' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standard (Ungoverned) */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Standard Response
            </h4>
            <div className="space-y-3">
              {metricLabels.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{icon} {label}</span>
                    <span className={`text-sm font-bold ${getColorClass(metrics.standard[key as keyof FORGEData] as number)}`}>
                    {Math.round((metrics.standard[key as keyof FORGEData] as number) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Governed */}
          <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
            <h4 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rosetta Governed
            </h4>
            <div className="space-y-3">
              {metricLabels.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{icon} {label}</span>
                  <span className={`text-sm font-bold ${getColorClass(metrics.governed[key as keyof FORGEData] as number)}`}>
                    {Math.round((metrics.governed[key as keyof FORGEData] as number) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Improvement Summary */}
        <div className={`p-4 rounded-lg border-2 ${getBackgroundClass(metrics.improvement)} transition-all duration-500`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className={`w-6 h-6 ${getColorClass(metrics.improvement)}`} />
              <div>
                <div className="text-xs text-gray-400">Governance Improvement</div>
                <div className={`text-2xl font-bold ${getColorClass(metrics.improvement)}`}>
                  +{Math.round(metrics.improvement * 100)}%
                </div>
              </div>
            </div>
            <div className="text-4xl">{getStatusEmoji(metrics.improvement)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderSingleMetrics = (metrics: FORGEData) => {
    return (
      <div className="space-y-4">
        {renderMetricBar('Fabrication', metrics.F, '🎭', metrics.sub_metrics?.F)}
        {renderMetricBar('Oversight', metrics.O, '�️', metrics.sub_metrics?.O)}
        {renderMetricBar('Refusal', metrics.R, '�️', metrics.sub_metrics?.R)}
        {renderMetricBar('Guidance', metrics.G, '🧭', metrics.sub_metrics?.G)}
        {renderMetricBar('Evidence', metrics.E, '📚', metrics.sub_metrics?.E)}

        <div className={`mt-6 p-4 rounded-lg border-2 ${getBackgroundClass(metrics.avg)}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-200">Overall FORGE Score (Φ)</span>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${getColorClass(metrics.avg)}`}>
                {Math.round(metrics.avg * 100)}%
              </span>
              <span className="text-3xl">{getStatusEmoji(metrics.avg)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className={`w-6 h-6 ${animatePulse ? 'text-purple-400 animate-pulse' : 'text-gray-400'}`} />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Metrics Display */}
      {!latestMetrics && (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Waiting for FORGE data...</p>
          <p className="text-xs mt-2">Run a test to see live metrics</p>
        </div>
      )}

      {latestMetrics && (
        <div className={`transition-opacity duration-300 ${animatePulse ? 'opacity-80' : 'opacity-100'}`}>
          {showComparison ? (
            renderComparisonView(latestMetrics)
          ) : (
            renderSingleMetrics(latestMetrics.governed || latestMetrics.standard)
          )}

          {/* Timestamp */}
          {latestMetrics.timestamp && (
            <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
              <span>Last updated: {new Date(latestMetrics.timestamp).toLocaleTimeString()}</span>
              {latestMetrics.model && <span>Model: {latestMetrics.model}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
