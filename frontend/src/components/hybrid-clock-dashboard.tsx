/**
 * Hybrid Clock Dashboard
 * 
 * Real-time visualization of Lamport-Real Hybrid Clock System:
 * - Current Lamport clock + UTC timestamp
 * - Clock drift metrics
 * - Timeline visualization (Lamport vs Real Time)
 * - Clock synchronization controls
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HybridTimestamp {
  lamport: number;
  wallClock: string;
  drift: number;
  node: string;
}

interface ClockStats {
  currentLamport: number;
  currentWallClock: string;
  currentHybridTime: HybridTimestamp;
  totalReceipts: number;
  avgTimeBetweenEventsMs: number;
  avgTimeBetweenEventsSeconds: number;
  avgLamportIncrement: number;
  node: string;
}

interface DriftMetrics {
  avgTimeBetweenEventsMs: number;
  avgTimeBetweenEventsSeconds: number;
  avgLamportIncrement: number;
  expectedTimePerLamport: number;
  totalReceipts: number;
  node: string;
}

export default function HybridClockDashboard() {
  const [clockStats, setClockStats] = useState<ClockStats | null>(null);
  const [driftMetrics, setDriftMetrics] = useState<DriftMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load clock data
  const loadClockData = async () => {
    setIsLoading(true);
    try {
      const [clockRes, driftRes] = await Promise.all([
        fetch('/api/ben/clock'),
        fetch('/api/ben/clock/drift'),
      ]);

      const clockData = await clockRes.json();
      const driftData = await driftRes.json();

      if (clockData.success) {
        setClockStats(clockData.data.stats);
      }

      if (driftData.success) {
        setDriftMetrics(driftData.data.drift);
        setHealthStatus(driftData.data.healthStatus);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load clock data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate clock sync (for demo purposes)
  const syncClock = async () => {
    setIsSyncing(true);
    try {
      // In production, this would sync with NTP server
      // For now, just reload the data
      await loadClockData();
    } catch (error) {
      console.error('Failed to sync clock:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadClockData();
    const interval = setInterval(loadClockData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getHealthBadge = () => {
    const variants: Record<typeof healthStatus, 'default' | 'secondary' | 'destructive'> = {
      healthy: 'default',
      warning: 'secondary',
      critical: 'destructive',
    };
    return (
      <Badge variant={variants[healthStatus]}>
        {healthStatus.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Hybrid Clock System
          </h2>
          <p className="text-muted-foreground">
            Lamport-Real Hybrid Clock (Logical + Physical Time)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getHealthBadge()}
          <Button
            onClick={syncClock}
            disabled={isSyncing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Clock
          </Button>
        </div>
      </div>

      {/* Current Clock State */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Lamport Clock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {clockStats?.currentLamport.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Logical monotonic counter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Wall Clock (UTC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {clockStats?.currentWallClock
                ? formatTimestamp(clockStats.currentWallClock)
                : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Physical timestamp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getHealthIcon()}
              Clock Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {healthStatus}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Node: {clockStats?.node || 'unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Drift Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Clock Drift Metrics
          </CardTitle>
          <CardDescription>
            Timing statistics and drift analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {driftMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Event Interval</p>
                <p className="text-2xl font-bold">
                  {driftMetrics.avgTimeBetweenEventsSeconds.toFixed(2)}s
                </p>
                <p className="text-xs text-muted-foreground">
                  {driftMetrics.avgTimeBetweenEventsMs.toFixed(0)}ms
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Lamport Increment</p>
                <p className="text-2xl font-bold">
                  {driftMetrics.avgLamportIncrement.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  per event
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Time per Lamport Tick</p>
                <p className="text-2xl font-bold">
                  {driftMetrics.expectedTimePerLamport.toFixed(0)}ms
                </p>
                <p className="text-xs text-muted-foreground">
                  expected interval
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">
                  {driftMetrics.totalReceipts.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  receipts analyzed
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading drift metrics...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clock Synchronization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Hybrid Clock Architecture</CardTitle>
          <CardDescription>
            How Lamport-Real hybrid clocks ensure total ordering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Lamport Clock (Logical Time)</h4>
            <p className="text-sm text-muted-foreground">
              Monotonically increasing counter that captures causality. Every event increments 
              the counter, ensuring events can be ordered by their logical clock value.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Wall Clock (Physical Time)</h4>
            <p className="text-sm text-muted-foreground">
              UTC timestamp from system clock (ideally synchronized with NTP). Provides 
              correlation with real-world time for queries like "what happened at 2pm?"
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Hybrid Ordering</h4>
            <p className="text-sm text-muted-foreground">
              Events are ordered first by Lamport clock (causality), then by wall clock 
              (physical time), then by node ID (determinism). This guarantees total ordering 
              across distributed systems.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Drift Detection</h4>
            <p className="text-sm text-muted-foreground">
              Clock drift is monitored by comparing expected time intervals with actual wall 
              clock differences. Excessive drift (&gt;5s) triggers synchronization to prevent 
              clock skew.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
