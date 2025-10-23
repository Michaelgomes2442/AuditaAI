'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Loader2, AlertCircle } from 'lucide-react';

interface TestResult {
  id: number;
  modelName: string;
  modelProvider: string;
  criesScore: number | null;
  responseTime: number | null;
  tokenCount: number | null;
  cost: number | null;
  createdAt: string;
}

interface TrendsData {
  results: TestResult[];
  models: { modelName: string; modelProvider: string }[];
  startDate: string;
  endDate: string;
}

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrendsData | null>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [metric, setMetric] = useState<'criesScore' | 'responseTime' | 'cost'>('criesScore');

  useEffect(() => {
    fetchTrends();
  }, [timeRange, selectedModel]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: timeRange });
      if (selectedModel !== 'all') {
        params.append('model', selectedModel);
      }

      const response = await fetch(`/api/analytics/trends?${params}`);
      if (response.ok) {
        const trendsData = await response.json();
        setData(trendsData);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!data?.results.length) return [];

    // Group by date for daily aggregation
    const grouped = data.results.reduce((acc: any, result) => {
      const date = new Date(result.createdAt).toLocaleDateString();
      
      if (!acc[date]) {
        acc[date] = {
          date,
          values: [],
          models: new Set(),
        };
      }
      
      const value = result[metric];
      if (value !== null && value !== undefined) {
        acc[date].values.push(value);
        acc[date].models.add(result.modelName);
      }
      
      return acc;
    }, {});

    // Calculate averages for each date
    return Object.values(grouped).map((day: any) => ({
      date: day.date,
      average: day.values.reduce((sum: number, val: number) => sum + val, 0) / day.values.length,
      count: day.values.length,
      models: day.models.size,
    }));
  };

  const getModelComparison = () => {
    if (!data?.results.length) return [];

    const modelData = data.results.reduce((acc: any, result) => {
      if (!acc[result.modelName]) {
        acc[result.modelName] = {
          modelName: result.modelName,
          values: [],
        };
      }
      
      const value = result[metric];
      if (value !== null && value !== undefined) {
        acc[result.modelName].values.push(value);
      }
      
      return acc;
    }, {});

    return Object.values(modelData).map((model: any) => ({
      modelName: model.modelName,
      average: model.values.reduce((sum: number, val: number) => sum + val, 0) / model.values.length,
      count: model.values.length,
      min: Math.min(...model.values),
      max: Math.max(...model.values),
    }));
  };

  const getStats = () => {
    if (!data?.results.length) {
      return { total: 0, avgScore: 0, trend: 0 };
    }

    const validResults = data.results.filter((r) => r[metric] !== null);
    const total = validResults.length;
    const values = validResults.map((r) => r[metric] as number);
    const avgScore = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(values.length / 2);
    if (midpoint > 0) {
      const firstHalf = values.slice(0, midpoint);
      const secondHalf = values.slice(midpoint);
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
      return { total, avgScore, trend };
    }

    return { total, avgScore, trend: 0 };
  };

  const chartData = getChartData();
  const modelComparison = getModelComparison();
  const stats = getStats();

  const getMetricLabel = () => {
    switch (metric) {
      case 'criesScore':
        return 'CRIES Score';
      case 'responseTime':
        return 'Response Time (ms)';
      case 'cost':
        return 'Cost ($)';
    }
  };

  const formatValue = (value: number) => {
    switch (metric) {
      case 'criesScore':
        return value.toFixed(1);
      case 'responseTime':
        return `${value.toFixed(0)}ms`;
      case 'cost':
        return `$${value.toFixed(4)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Performance Trends</h1>
        <p className="text-muted-foreground">
          Analyze model performance over time with real test data
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Time Range</label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Model</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {data?.models.map((model) => (
                <SelectItem key={model.modelName} value={model.modelName}>
                  {model.modelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Metric</label>
          <Select value={metric} onValueChange={(val: any) => setMetric(val)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="criesScore">CRIES Score</SelectItem>
              <SelectItem value="responseTime">Response Time</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!data?.results.length ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground mb-4">
            No test results found for the selected time range.
          </p>
          <p className="text-sm text-muted-foreground">
            Run some tests to see performance trends here.
          </p>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Tests</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Average {getMetricLabel()}</p>
                  <p className="text-3xl font-bold">{formatValue(stats.avgScore)}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trend</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">{stats.trend.toFixed(1)}%</p>
                    {stats.trend > 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    ) : stats.trend < 0 ? (
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">{getMetricLabel()} Over Time</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-1">{payload[0].payload.date}</p>
                          <p className="text-sm">
                            Average: <span className="font-medium">{formatValue(payload[0].value as number)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tests: {payload[0].payload.count}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke="#667eea"
                  fill="#667eea"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Model Comparison */}
          {selectedModel === 'all' && modelComparison.length > 1 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Model Comparison</h2>
              <div className="space-y-4">
                {modelComparison.map((model: any) => (
                  <div key={model.modelName} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">{model.modelName}</p>
                      <p className="text-sm text-muted-foreground">{model.count} tests</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatValue(model.average)}</p>
                      <p className="text-xs text-muted-foreground">
                        Range: {formatValue(model.min)} - {formatValue(model.max)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
