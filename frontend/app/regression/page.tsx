'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, TrendingUp, Target, PlayCircle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RegressionBaseline {
  id: number;
  modelName: string;
  modelVersion: string | null;
  testType: string;
  avgResponseTime: number;
  avgCost: number;
  avgQualityScore: number;
  avgAccuracy: number;
  successRate: number;
  alertThreshold: number;
  sampleSize: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RegressionComparison {
  baseline: RegressionBaseline;
  currentMetrics: {
    avgResponseTime: number;
    avgCost: number;
    avgQualityScore: number;
    avgAccuracy: number;
    successRate: number;
    sampleSize: number;
  };
  degradation: {
    responseTime: number;
    cost: number;
    qualityScore: number;
    accuracy: number;
    successRate: number;
  };
  hasRegression: boolean;
  degradedMetrics: string[];
}

export default function RegressionTestingPage() {
  const [baselines, setBaselines] = useState<RegressionBaseline[]>([]);
  const [comparisons, setComparisons] = useState<RegressionComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [runningTests, setRunningTests] = useState(false);

  // Form state
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState('');
  const [testType, setTestType] = useState('general');
  const [alertThreshold, setAlertThreshold] = useState('10');

  useEffect(() => {
    fetchBaselines();
    fetchComparisons();
  }, []);

  const fetchBaselines = async () => {
    try {
      const res = await fetch('/api/regression/baselines');
      const data = await res.json();
      setBaselines(data.baselines || []);
    } catch (error) {
      console.error('Error fetching baselines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisons = async () => {
    try {
      const res = await fetch('/api/regression/compare');
      const data = await res.json();
      setComparisons(data.comparisons || []);
    } catch (error) {
      console.error('Error fetching comparisons:', error);
    }
  };

  const handleCreateBaseline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/regression/baselines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName,
          modelVersion: modelVersion || null,
          testType,
          alertThreshold: parseFloat(alertThreshold),
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setModelName('');
        setModelVersion('');
        setTestType('general');
        setAlertThreshold('10');
        fetchBaselines();
      }
    } catch (error) {
      console.error('Error creating baseline:', error);
    }
  };

  const handleRunRegressionTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/regression/run', {
        method: 'POST',
      });

      if (res.ok) {
        // Refresh comparisons after running tests
        setTimeout(() => {
          fetchComparisons();
          setRunningTests(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error running regression tests:', error);
      setRunningTests(false);
    }
  };

  const handleToggleBaseline = async (id: number, isActive: boolean) => {
    try {
      await fetch(`/api/regression/baselines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      fetchBaselines();
    } catch (error) {
      console.error('Error toggling baseline:', error);
    }
  };

  const getStatusColor = (degradation: number) => {
    if (degradation <= 0) return 'text-green-600';
    if (degradation < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (degradation: number) => {
    if (degradation <= 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (degradation < 10) return <Activity className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const activeBaselines = baselines.filter(b => b.isActive);
  const regressions = comparisons.filter(c => c.hasRegression);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Regression Testing</h1>
          <p className="text-muted-foreground">
            Automated performance monitoring and baseline comparison
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="outline"
          >
            <Target className="w-4 h-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'New Baseline'}
          </Button>
          <Button
            onClick={handleRunRegressionTests}
            disabled={runningTests || activeBaselines.length === 0}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {runningTests ? 'Running...' : 'Run Regression Tests'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Baselines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBaselines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tests Run Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comparisons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Regressions Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{regressions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {comparisons.length > 0
                ? Math.round(((comparisons.length - regressions.length) / comparisons.length) * 100)
                : 100}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Baseline Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Baseline</CardTitle>
            <CardDescription>
              Establish a performance baseline from recent test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBaseline} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g., gpt-4"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelVersion">Model Version (Optional)</Label>
                  <Input
                    id="modelVersion"
                    value={modelVersion}
                    onChange={(e) => setModelVersion(e.target.value)}
                    placeholder="e.g., 0125-preview"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger id="testType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="reasoning">Reasoning</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                  <Input
                    id="alertThreshold"
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when performance degrades by this percentage
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Baseline</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Regression Alerts */}
      {regressions.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Performance Regressions Detected</AlertTitle>
          <AlertDescription>
            {regressions.length} model{regressions.length > 1 ? 's' : ''} showing performance
            degradation beyond acceptable thresholds.
          </AlertDescription>
        </Alert>
      )}

      {/* Comparison Results */}
      {comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Regression Test Results</CardTitle>
            <CardDescription>
              Comparing current performance against established baselines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisons.map((comparison, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {comparison.baseline.modelName}
                          {comparison.baseline.modelVersion &&
                            ` (${comparison.baseline.modelVersion})`}
                        </h3>
                        <Badge variant="outline">{comparison.baseline.testType}</Badge>
                        {comparison.hasRegression ? (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Regression
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Passing
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sample: {comparison.currentMetrics.sampleSize} tests vs baseline{' '}
                        {comparison.baseline.sampleSize} tests
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(comparison.degradation.responseTime)}
                        <span>Response Time</span>
                      </div>
                      <div className="text-sm font-medium">
                        {comparison.currentMetrics.avgResponseTime.toFixed(0)}ms
                      </div>
                      <div
                        className={`text-xs ${getStatusColor(comparison.degradation.responseTime)}`}
                      >
                        {comparison.degradation.responseTime > 0 ? '+' : ''}
                        {comparison.degradation.responseTime.toFixed(1)}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(comparison.degradation.cost)}
                        <span>Cost</span>
                      </div>
                      <div className="text-sm font-medium">
                        ${comparison.currentMetrics.avgCost.toFixed(4)}
                      </div>
                      <div className={`text-xs ${getStatusColor(comparison.degradation.cost)}`}>
                        {comparison.degradation.cost > 0 ? '+' : ''}
                        {comparison.degradation.cost.toFixed(1)}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(comparison.degradation.qualityScore)}
                        <span>Quality</span>
                      </div>
                      <div className="text-sm font-medium">
                        {comparison.currentMetrics.avgQualityScore.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs ${getStatusColor(comparison.degradation.qualityScore)}`}
                      >
                        {comparison.degradation.qualityScore > 0 ? '+' : ''}
                        {comparison.degradation.qualityScore.toFixed(1)}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(comparison.degradation.accuracy)}
                        <span>Accuracy</span>
                      </div>
                      <div className="text-sm font-medium">
                        {comparison.currentMetrics.avgAccuracy.toFixed(1)}%
                      </div>
                      <div className={`text-xs ${getStatusColor(comparison.degradation.accuracy)}`}>
                        {comparison.degradation.accuracy > 0 ? '+' : ''}
                        {comparison.degradation.accuracy.toFixed(1)}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(comparison.degradation.successRate)}
                        <span>Success Rate</span>
                      </div>
                      <div className="text-sm font-medium">
                        {comparison.currentMetrics.successRate.toFixed(1)}%
                      </div>
                      <div
                        className={`text-xs ${getStatusColor(comparison.degradation.successRate)}`}
                      >
                        {comparison.degradation.successRate > 0 ? '+' : ''}
                        {comparison.degradation.successRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {comparison.degradedMetrics.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <strong>Degraded metrics:</strong> {comparison.degradedMetrics.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baselines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Baselines</CardTitle>
          <CardDescription>
            Established performance benchmarks for automated regression testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading baselines...</div>
          ) : baselines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No baselines created yet. Create your first baseline to start automated regression
              testing.
            </div>
          ) : (
            <div className="space-y-3">
              {baselines.map((baseline) => (
                <div key={baseline.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {baseline.modelName}
                        {baseline.modelVersion && ` (${baseline.modelVersion})`}
                      </h3>
                      <Badge variant="outline">{baseline.testType}</Badge>
                      <Badge variant={baseline.isActive ? 'default' : 'secondary'}>
                        {baseline.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleBaseline(baseline.id, !baseline.isActive)}
                    >
                      {baseline.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Response Time</div>
                      <div className="font-medium">{baseline.avgResponseTime.toFixed(0)}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Cost</div>
                      <div className="font-medium">${baseline.avgCost.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Quality</div>
                      <div className="font-medium">{baseline.avgQualityScore.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Accuracy</div>
                      <div className="font-medium">{baseline.avgAccuracy.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Success Rate</div>
                      <div className="font-medium">{baseline.successRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Alert Threshold</div>
                      <div className="font-medium">{baseline.alertThreshold}%</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Created {new Date(baseline.createdAt).toLocaleDateString()} • Sample size:{' '}
                    {baseline.sampleSize} tests
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
