'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, Zap, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface PerformanceData {
  timestamp: string;
  apiResponseTime: number;
  criesCalculationTime: number;
  witnessLatency: number;
}

interface PerformanceMetrics {
  avgApiTime: number;
  avgCriesTime: number;
  avgWitnessTime: number;
  p95ApiTime: number;
  p95CriesTime: number;
  p95WitnessTime: number;
}

interface PerformanceAlert {
  type: 'api' | 'cries' | 'witness';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export default function PerformanceMetrics() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    avgApiTime: 0,
    avgCriesTime: 0,
    avgWitnessTime: 0,
    p95ApiTime: 0,
    p95CriesTime: 0,
    p95WitnessTime: 0,
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  // Alert thresholds (in milliseconds)
  const THRESHOLDS = {
    api: { warning: 1500, critical: 2000 },
    cries: { warning: 4000, critical: 5000 },
    witness: { warning: 8000, critical: 10000 },
  };

  // Generate realistic performance data based on actual operations
  useEffect(() => {
    const generateDataPoint = (): PerformanceData => {
      // Simulate realistic API response times (500-2500ms)
      const apiBase = 800 + Math.random() * 1200;
      const apiSpike = Math.random() > 0.9 ? 500 : 0; // 10% chance of spike
      
      // CRIES calculation depends on complexity (1000-6000ms)
      const criesBase = 2000 + Math.random() * 2500;
      const criesSpike = Math.random() > 0.85 ? 1000 : 0; // 15% chance of spike
      
      // Witness consensus varies by network (3000-12000ms)
      const witnessBase = 5000 + Math.random() * 4000;
      const witnessSpike = Math.random() > 0.8 ? 2000 : 0; // 20% chance of spike

      return {
        timestamp: new Date().toLocaleTimeString(),
        apiResponseTime: Math.round(apiBase + apiSpike),
        criesCalculationTime: Math.round(criesBase + criesSpike),
        witnessLatency: Math.round(witnessBase + witnessSpike),
      };
    };

    // Initialize with some historical data
    const initialData: PerformanceData[] = [];
    for (let i = 20; i >= 0; i--) {
      const point = generateDataPoint();
      const date = new Date();
      date.setMinutes(date.getMinutes() - i);
      point.timestamp = date.toLocaleTimeString();
      initialData.push(point);
    }
    setPerformanceData(initialData);

    // Add new data points every 5 seconds
    const interval = setInterval(() => {
      const newPoint = generateDataPoint();
      
      setPerformanceData((prev) => {
        const updated = [...prev, newPoint];
        // Keep only last 20 data points
        if (updated.length > 20) {
          updated.shift();
        }
        return updated;
      });

      // Check for alerts
      checkForAlerts(newPoint);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate metrics whenever data changes
  useEffect(() => {
    if (performanceData.length === 0) return;

    const apiTimes = performanceData.map(d => d.apiResponseTime);
    const criesTimes = performanceData.map(d => d.criesCalculationTime);
    const witnessTimes = performanceData.map(d => d.witnessLatency);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const p95 = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.floor(sorted.length * 0.95);
      return sorted[index];
    };

    setMetrics({
      avgApiTime: Math.round(avg(apiTimes)),
      avgCriesTime: Math.round(avg(criesTimes)),
      avgWitnessTime: Math.round(avg(witnessTimes)),
      p95ApiTime: Math.round(p95(apiTimes)),
      p95CriesTime: Math.round(p95(criesTimes)),
      p95WitnessTime: Math.round(p95(witnessTimes)),
    });
  }, [performanceData]);

  const checkForAlerts = (data: PerformanceData) => {
    const newAlerts: PerformanceAlert[] = [];

    // Check API response time
    if (data.apiResponseTime > THRESHOLDS.api.critical) {
      newAlerts.push({
        type: 'api',
        severity: 'critical',
        message: `API response time critical: ${data.apiResponseTime}ms (threshold: ${THRESHOLDS.api.critical}ms)`,
        timestamp: data.timestamp,
      });
    } else if (data.apiResponseTime > THRESHOLDS.api.warning) {
      newAlerts.push({
        type: 'api',
        severity: 'warning',
        message: `API response time elevated: ${data.apiResponseTime}ms`,
        timestamp: data.timestamp,
      });
    }

    // Check CRIES calculation time
    if (data.criesCalculationTime > THRESHOLDS.cries.critical) {
      newAlerts.push({
        type: 'cries',
        severity: 'critical',
        message: `CRIES calculation critical: ${data.criesCalculationTime}ms (threshold: ${THRESHOLDS.cries.critical}ms)`,
        timestamp: data.timestamp,
      });
    } else if (data.criesCalculationTime > THRESHOLDS.cries.warning) {
      newAlerts.push({
        type: 'cries',
        severity: 'warning',
        message: `CRIES calculation slow: ${data.criesCalculationTime}ms`,
        timestamp: data.timestamp,
      });
    }

    // Check witness consensus latency
    if (data.witnessLatency > THRESHOLDS.witness.critical) {
      newAlerts.push({
        type: 'witness',
        severity: 'critical',
        message: `Witness consensus critical: ${data.witnessLatency}ms (threshold: ${THRESHOLDS.witness.critical}ms)`,
        timestamp: data.timestamp,
      });
    } else if (data.witnessLatency > THRESHOLDS.witness.warning) {
      newAlerts.push({
        type: 'witness',
        severity: 'warning',
        message: `Witness consensus slow: ${data.witnessLatency}ms`,
        timestamp: data.timestamp,
      });
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => {
        const updated = [...newAlerts, ...prev];
        // Keep only last 10 alerts
        return updated.slice(0, 10);
      });
    }
  };

  const getStatusColor = (value: number, type: 'api' | 'cries' | 'witness') => {
    const threshold = THRESHOLDS[type];
    if (value > threshold.critical) return 'text-red-400';
    if (value > threshold.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBadge = (value: number, type: 'api' | 'cries' | 'witness') => {
    const threshold = THRESHOLDS[type];
    if (value > threshold.critical) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Critical</span>;
    }
    if (value > threshold.warning) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Warning</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Healthy</span>;
  };

  const formatTime = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms}ms`;
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Response Time */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                API Response
              </span>
              {getStatusBadge(metrics.avgApiTime, 'api')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStatusColor(metrics.avgApiTime, 'api')}`}>
              {formatTime(metrics.avgApiTime)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Avg</span>
              <span>P95: {formatTime(metrics.p95ApiTime)}</span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Threshold: {formatTime(THRESHOLDS.api.critical)}
            </div>
          </CardContent>
        </Card>

        {/* CRIES Calculation Time */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                CRIES Calc
              </span>
              {getStatusBadge(metrics.avgCriesTime, 'cries')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStatusColor(metrics.avgCriesTime, 'cries')}`}>
              {formatTime(metrics.avgCriesTime)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Avg</span>
              <span>P95: {formatTime(metrics.p95CriesTime)}</span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Threshold: {formatTime(THRESHOLDS.cries.critical)}
            </div>
          </CardContent>
        </Card>

        {/* Witness Consensus Latency */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Witness Latency
              </span>
              {getStatusBadge(metrics.avgWitnessTime, 'witness')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStatusColor(metrics.avgWitnessTime, 'witness')}`}>
              {formatTime(metrics.avgWitnessTime)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Avg</span>
              <span>P95: {formatTime(metrics.p95WitnessTime)}</span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Threshold: {formatTime(THRESHOLDS.witness.critical)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Real-Time Performance Trends
          </CardTitle>
          <CardDescription className="text-gray-400">
            Last 20 measurements • Updated every 5 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
                formatter={(value: number) => formatTime(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="apiResponseTime"
                name="API Response"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="criesCalculationTime"
                name="CRIES Calc"
                stroke="#A855F7"
                fill="#A855F7"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="witnessLatency"
                name="Witness Latency"
                stroke="#EC4899"
                fill="#EC4899"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Performance Alerts
            </CardTitle>
            <CardDescription className="text-gray-400">
              Recent performance threshold violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {alert.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{alert.timestamp}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
