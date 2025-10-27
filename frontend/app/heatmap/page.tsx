'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Grid3x3, TrendingUp, TrendingDown, Minus, Info, Download,
  Zap, Clock, DollarSign, Target, Activity, BarChart3
} from 'lucide-react';

interface HeatmapData {
  models: string[];
  metrics: string[];
  data: number[][];
  metadata: {
    min: number;
    max: number;
    avg: number;
  };
}

interface CellData {
  model: string;
  metric: string;
  value: number;
  normalized: number;
  rank: number;
  details?: any;
}

const metricIcons: Record<string, any> = {
  'Response Time': Clock,
  'Cost per Request': DollarSign,
  'Quality Score': Target,
  'Throughput': Zap,
  'Success Rate': Activity,
  'Accuracy': Target,
};

const metricFormats: Record<string, (value: number) => string> = {
  'Response Time': (v) => `${v.toFixed(0)}ms`,
  'Cost per Request': (v) => `$${v.toFixed(4)}`,
  'Quality Score': (v) => `${v.toFixed(1)}%`,
  'Throughput': (v) => `${v.toFixed(1)} req/s`,
  'Success Rate': (v) => `${v.toFixed(1)}%`,
  'Accuracy': (v) => `${v.toFixed(1)}%`,
};

export default function HeatmapPage() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Filters
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [colorScheme, setColorScheme] = useState<'green-red' | 'blue-red' | 'viridis'>('green-red');
  const [showValues, setShowValues] = useState(true);
  const [normalize, setNormalize] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, [selectedMetric, selectedModel]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMetric !== 'all') params.append('metric', selectedMetric);
      if (selectedModel !== 'all') params.append('model', selectedModel);

      const response = await fetch(`/api/heatmap?${params}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap data');

      const data = await response.json();
      setHeatmapData(data);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load heatmap data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getColorForValue = (value: number, min: number, max: number): string => {
    if (!normalize) {
      // Use absolute values
      const normalizedValue = max === min ? 0.5 : (value - min) / (max - min);
      return getColorFromScheme(normalizedValue);
    }
    
    // Normalized 0-1 scale
    return getColorFromScheme(value);
  };

  const getColorFromScheme = (normalized: number): string => {
    // Clamp to 0-1
    normalized = Math.max(0, Math.min(1, normalized));
    
    if (colorScheme === 'green-red') {
      // Green (good) to Red (bad)
      const r = Math.round(255 * normalized);
      const g = Math.round(255 * (1 - normalized));
      return `rgb(${r}, ${g}, 0)`;
    } else if (colorScheme === 'blue-red') {
      // Blue (cold) to Red (hot)
      const r = Math.round(255 * normalized);
      const b = Math.round(255 * (1 - normalized));
      return `rgb(${r}, 0, ${b})`;
    } else {
      // Viridis-inspired
      const colors = [
        [68, 1, 84],    // Purple
        [59, 82, 139],  // Blue
        [33, 145, 140], // Teal
        [94, 201, 98],  // Green
        [253, 231, 37], // Yellow
      ];
      
      const idx = normalized * (colors.length - 1);
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      const t = idx - lower;
      
      const c1 = colors[lower];
      const c2 = colors[upper];
      
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
      
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getTextColor = (bgColor: string): string => {
    // Extract RGB values
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#000000';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const handleCellClick = (model: string, metric: string, value: number) => {
    if (!heatmapData) return;
    
    const min = heatmapData.metadata.min;
    const max = heatmapData.metadata.max;
    const normalized = max === min ? 0.5 : (value - min) / (max - min);
    
    // Calculate rank
    const metricIndex = heatmapData.metrics.indexOf(metric);
    const values = heatmapData.data.map(row => row[metricIndex]).filter(v => v !== null);
    const sortedValues = [...values].sort((a, b) => a - b);
    const rank = sortedValues.indexOf(value) + 1;
    
    setSelectedCell({
      model,
      metric,
      value,
      normalized,
      rank,
    });
    setDetailsOpen(true);
  };

  const handleExport = () => {
    if (!heatmapData) return;
    
    const csv = [
      ['Model', ...heatmapData.metrics].join(','),
      ...heatmapData.models.map((model, i) =>
        [model, ...heatmapData.data[i].map(v => v ?? 'N/A')].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatmap-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Export successful',
      description: 'Heatmap data exported as CSV',
    });
  };

  const getTrendIcon = (value: number, avg: number) => {
    if (value > avg * 1.1) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (value < avg * 0.9) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Grid3x3 className="h-8 w-8" />
            Model Comparison Heatmap
          </h1>
          <p className="text-muted-foreground mt-1">
            Visual performance comparison across models and metrics
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Heatmap Controls</CardTitle>
          <CardDescription>Customize the visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metric Filter</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="Response Time">Response Time</SelectItem>
                  <SelectItem value="Cost per Request">Cost per Request</SelectItem>
                  <SelectItem value="Quality Score">Quality Score</SelectItem>
                  <SelectItem value="Throughput">Throughput</SelectItem>
                  <SelectItem value="Success Rate">Success Rate</SelectItem>
                  <SelectItem value="Accuracy">Accuracy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model Filter</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="GPT-4">GPT-4</SelectItem>
                  <SelectItem value="GPT-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="Claude-3">Claude-3</SelectItem>
                  <SelectItem value="Gemini">Gemini</SelectItem>
                  <SelectItem value="Llama-2">Llama-2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color Scheme</label>
              <Select value={colorScheme} onValueChange={(v: any) => setColorScheme(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green-red">Green-Red</SelectItem>
                  <SelectItem value="blue-red">Blue-Red</SelectItem>
                  <SelectItem value="viridis">Viridis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display</label>
              <div className="flex gap-2">
                <Button
                  variant={showValues ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowValues(!showValues)}
                >
                  Values
                </Button>
                <Button
                  variant={normalize ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNormalize(!normalize)}
                >
                  Normalize
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button onClick={fetchHeatmapData} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {heatmapData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Models Compared
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{heatmapData.models.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metrics Analyzed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{heatmapData.metrics.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Data Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {heatmapData.models.length * heatmapData.metrics.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Heatmap
          </CardTitle>
          <CardDescription>
            Click on any cell for detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading heatmap data...
            </div>
          ) : !heatmapData ? (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border p-3 bg-muted font-semibold text-left min-w-[120px]">
                      Model / Metric
                    </th>
                    {heatmapData.metrics.map((metric) => {
                      const Icon = metricIcons[metric] || Activity;
                      return (
                        <th
                          key={metric}
                          className="border border-border p-3 bg-muted font-semibold text-center min-w-[100px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Icon className="h-4 w-4" />
                            <span className="text-xs">{metric}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.models.map((model, modelIndex) => (
                    <tr key={model}>
                      <td className="border border-border p-3 bg-muted font-semibold">
                        {model}
                      </td>
                      {heatmapData.metrics.map((metric, metricIndex) => {
                        const value = heatmapData.data[modelIndex][metricIndex];
                        if (value === null || value === undefined) {
                          return (
                            <td
                              key={`${model}-${metric}`}
                              className="border border-border p-3 text-center bg-gray-200 dark:bg-gray-800 text-muted-foreground"
                            >
                              N/A
                            </td>
                          );
                        }

                        const bgColor = getColorForValue(
                          value,
                          heatmapData.metadata.min,
                          heatmapData.metadata.max
                        );
                        const textColor = getTextColor(bgColor);
                        const formatter = metricFormats[metric] || ((v: number) => v.toFixed(2));

                        return (
                          <td
                            key={`${model}-${metric}`}
                            className="border border-border p-3 text-center cursor-pointer transition-all hover:opacity-80"
                            style={{ backgroundColor: bgColor, color: textColor }}
                            onClick={() => handleCellClick(model, metric, value)}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {showValues && (
                                <span className="font-semibold text-sm">
                                  {formatter(value)}
                                </span>
                              )}
                              {getTrendIcon(value, heatmapData.metadata.avg)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {heatmapData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Color Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Low</span>
              <div className="flex-1 h-8 rounded" style={{
                background: `linear-gradient(to right, ${getColorFromScheme(0)}, ${getColorFromScheme(0.25)}, ${getColorFromScheme(0.5)}, ${getColorFromScheme(0.75)}, ${getColorFromScheme(1)})`
              }} />
              <span className="text-sm text-muted-foreground">High</span>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>Min: {heatmapData.metadata.min.toFixed(2)}</div>
              <div>Avg: {heatmapData.metadata.avg.toFixed(2)}</div>
              <div>Max: {heatmapData.metadata.max.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cell Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cell Details</DialogTitle>
            <DialogDescription>
              Detailed analysis of this data point
            </DialogDescription>
          </DialogHeader>

          {selectedCell && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Model</label>
                  <div className="font-semibold">{selectedCell.model}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Metric</label>
                  <div className="font-semibold">{selectedCell.metric}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Value</label>
                  <div className="font-semibold">
                    {(metricFormats[selectedCell.metric] || ((v: number) => v.toFixed(2)))(selectedCell.value)}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Rank</label>
                  <div className="font-semibold">#{selectedCell.rank}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Normalized Score</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${selectedCell.normalized * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {(selectedCell.normalized * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    This {selectedCell.metric.toLowerCase()} value for {selectedCell.model} is{' '}
                    {selectedCell.normalized > 0.66 ? 'high' : selectedCell.normalized > 0.33 ? 'moderate' : 'low'}{' '}
                    compared to other models, ranking #{selectedCell.rank} overall.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
