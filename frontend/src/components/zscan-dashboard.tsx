'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  TrendingUp,
  Eye,
  Play
} from 'lucide-react';

interface ZScanResult {
  ruleType: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  passed: boolean;
  message: string;
  affectedReceiptId?: string;
  affectedLamportClock?: number;
  details?: Record<string, any>;
}

interface ZScanSummary {
  scanId: number;
  totalRules: number;
  passed: number;
  warnings: number;
  critical: number;
  results: ZScanResult[];
}

interface ZScanHistoryItem {
  id: number;
  totalRules: number;
  passed: number;
  warnings: number;
  critical: number;
  createdAt: string;
}

interface ZScanStats {
  totalScans: number;
  totalPassed: number;
  totalWarnings: number;
  totalCritical: number;
  recentAvgPassed: number;
  latestScan: ZScanHistoryItem | null;
}

export default function ZScanDashboard() {
  const [running, setRunning] = useState(false);
  const [lastScan, setLastScan] = useState<ZScanSummary | null>(null);
  const [history, setHistory] = useState<ZScanHistoryItem[]>([]);
  const [stats, setStats] = useState<ZScanStats | null>(null);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/zscan/run?limit=10');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load Z-Scan history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/zscan/run?stats=true');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load Z-Scan stats:', error);
    }
  };

  const runScan = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/zscan/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      setLastScan(data.scan);
      await loadHistory();
      await loadStats();
    } catch (error) {
      console.error('Z-Scan failed:', error);
    } finally {
      setRunning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'INFO': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="h-4 w-4" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4" />;
      case 'INFO': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getHealthStatus = (critical: number, warnings: number) => {
    if (critical > 0) return { status: 'Critical', color: 'text-red-600', icon: <XCircle /> };
    if (warnings > 0) return { status: 'Warning', color: 'text-yellow-600', icon: <AlertTriangle /> };
    return { status: 'Healthy', color: 'text-green-600', icon: <CheckCircle /> };
  };

  const passRate = lastScan 
    ? (lastScan.passed / lastScan.totalRules) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Total Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Passed Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPassed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.totalWarnings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Critical Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalCritical}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Z-Scan Verification
            </span>
            <Button onClick={runScan} disabled={running} className="gap-2">
              <Play className="h-4 w-4" />
              {running ? 'Scanning...' : 'Run Scan'}
            </Button>
          </CardTitle>
          <CardDescription>
            Automated verification of receipt chains, governance policies, and system integrity
          </CardDescription>
        </CardHeader>
        {lastScan && (
          <CardContent className="space-y-4">
            {/* Scan Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Pass Rate</div>
                <div className="text-3xl font-bold">{passRate.toFixed(1)}%</div>
                <Progress value={passRate} className="h-2 mt-2" />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Rules Checked</div>
                <div className="text-3xl font-bold">{lastScan.totalRules}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <div className={`text-xl font-bold flex items-center justify-center gap-2 ${getHealthStatus(lastScan.critical, lastScan.warnings).color}`}>
                  {getHealthStatus(lastScan.critical, lastScan.warnings).icon}
                  {getHealthStatus(lastScan.critical, lastScan.warnings).status}
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div>
              <h4 className="text-sm font-medium mb-3">Verification Results</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lastScan.results.map((result, i) => (
                  <div
                    key={i}
                    className={`p-3 border rounded-lg ${getSeverityColor(result.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {getSeverityIcon(result.severity)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{result.ruleType}</div>
                          <div className="text-sm mt-1">{result.message}</div>
                          {result.affectedLamportClock && (
                            <div className="text-xs mt-1 font-mono">
                              Lamport: {result.affectedLamportClock}
                            </div>
                          )}
                          {result.details && Object.keys(result.details).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer hover:underline">
                                View Details
                              </summary>
                              <pre className="text-xs mt-1 p-2 bg-white/50 rounded overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      <Badge variant={result.passed ? 'default' : 'destructive'} className="ml-2">
                        {result.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Scan History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((scan) => {
                const health = getHealthStatus(scan.critical, scan.warnings);
                const rate = (scan.passed / scan.totalRules) * 100;
                return (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={health.color}>{health.icon}</div>
                      <div>
                        <div className="font-medium text-sm">Scan #{scan.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(scan.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-mono font-bold">{rate.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Pass Rate</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {scan.passed}
                        </Badge>
                        {scan.warnings > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            {scan.warnings}
                          </Badge>
                        )}
                        {scan.critical > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            {scan.critical}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
