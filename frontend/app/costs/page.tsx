'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, 
  Calendar, PieChart, BarChart3, LineChart, Download,
  Target, Zap, Clock, Activity
} from 'lucide-react';

interface CostData {
  totalCost: number;
  periodCost: number;
  previousPeriodCost: number;
  changePercentage: number;
  byModel: Array<{ model: string; cost: number; count: number }>;
  byProvider: Array<{ provider: string; cost: number; count: number }>;
  byDay: Array<{ date: string; cost: number; count: number }>;
  topExpensive: Array<{ id: number; model: string; cost: number; prompt: string }>;
  budget?: {
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
  forecast: {
    nextWeek: number;
    nextMonth: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export default function CostAnalysisPage() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filters
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Budget management
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  useEffect(() => {
    // Set default dates based on period
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchCostData();
    }
  }, [startDate, endDate, selectedModel, selectedProvider]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      
      if (selectedModel !== 'all') params.append('model', selectedModel);
      if (selectedProvider !== 'all') params.append('provider', selectedProvider);

      const response = await fetch(`/api/cost-analysis?${params}`);
      if (!response.ok) throw new Error('Failed to fetch cost data');

      const data = await response.json();
      setCostData(data);
    } catch (error) {
      console.error('Error fetching cost data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cost analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async () => {
    try {
      const response = await fetch('/api/cost-analysis/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: parseFloat(budgetLimit) }),
      });

      if (!response.ok) throw new Error('Failed to set budget');

      toast({
        title: 'Budget updated',
        description: `Budget limit set to $${budgetLimit}`,
      });

      setShowBudgetForm(false);
      fetchCostData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update budget',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format: 'csv',
      });
      
      if (selectedModel !== 'all') params.append('model', selectedModel);
      if (selectedProvider !== 'all') params.append('provider', selectedProvider);

      const response = await fetch(`/api/cost-analysis/export?${params}`);
      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-analysis-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: 'Cost analysis exported as CSV',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export cost analysis',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(value);
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Cost Analysis Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track spending, manage budgets, and optimize costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBudgetForm(!showBudgetForm)} variant="outline">
            <Target className="h-4 w-4 mr-2" />
            Set Budget
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Budget Form */}
      {showBudgetForm && (
        <Card>
          <CardHeader>
            <CardTitle>Set Monthly Budget</CardTitle>
            <CardDescription>Configure spending limits and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Budget Limit (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleSetBudget}>Save Budget</Button>
                <Button variant="outline" onClick={() => setShowBudgetForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="OpenAI">OpenAI</SelectItem>
                  <SelectItem value="Anthropic">Anthropic</SelectItem>
                  <SelectItem value="Google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading cost data...</div>
      ) : !costData ? (
        <div className="text-center py-12 text-muted-foreground">No cost data available</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costData.totalCost)}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Period Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costData.periodCost)}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {costData.changePercentage > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">+{costData.changePercentage.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">{costData.changePercentage.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Forecast (Next Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costData.forecast.nextMonth)}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {getTrendIcon(costData.forecast.trend)}
                  <span className="text-muted-foreground capitalize">{costData.forecast.trend}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average per Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {costData.byDay.reduce((sum, d) => sum + d.count, 0) > 0
                    ? formatCurrency(
                        costData.periodCost / costData.byDay.reduce((sum, d) => sum + d.count, 0)
                      )
                    : '$0.0000'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This period</p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Alert */}
          {costData.budget && (
            <Card className={costData.budget.percentage >= 90 ? 'border-red-500' : costData.budget.percentage >= 75 ? 'border-yellow-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {costData.budget.percentage >= 90 && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  Budget Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(costData.budget.spent)} of {formatCurrency(costData.budget.limit)}
                    </span>
                    <Badge variant={costData.budget.percentage >= 90 ? 'destructive' : costData.budget.percentage >= 75 ? 'default' : 'secondary'}>
                      {costData.budget.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={costData.budget.percentage} />
                </div>
                
                {costData.budget.percentage >= 90 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <strong>Budget Alert:</strong> You've used over 90% of your monthly budget. 
                      Remaining: {formatCurrency(costData.budget.remaining)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost by Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Cost by Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costData.byModel.map((item) => {
                    const percentage = (item.cost / costData.periodCost) * 100;
                    return (
                      <div key={item.model}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.model}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{formatCurrency(item.cost)}</div>
                            <div className="text-xs text-muted-foreground">{item.count} requests</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="flex-1" />
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cost by Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cost by Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costData.byProvider.map((item) => {
                    const percentage = (item.cost / costData.periodCost) * 100;
                    return (
                      <div key={item.provider}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.provider}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{formatCurrency(item.cost)}</div>
                            <div className="text-xs text-muted-foreground">{item.count} requests</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="flex-1" />
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Daily Cost Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {costData.byDay.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={(day.cost / Math.max(...costData.byDay.map(d => d.cost))) * 100} 
                      />
                    </div>
                    <div className="w-24 text-right text-sm font-medium">
                      {formatCurrency(day.cost)}
                    </div>
                    <div className="w-20 text-right text-xs text-muted-foreground">
                      {day.count} reqs
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Expensive Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Most Expensive Tests
              </CardTitle>
              <CardDescription>Top cost-intensive test executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {costData.topExpensive.map((test, idx) => (
                  <div key={test.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{test.model}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {test.prompt.substring(0, 100)}...
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(test.cost)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Cost Optimization Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {costData.byModel.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <strong>Model Selection:</strong> Consider using GPT-3.5 for simpler tasks. 
                      It's ~10x cheaper than GPT-4 for comparable performance on routine queries.
                    </div>
                  </div>
                )}
                
                {costData.forecast.trend === 'increasing' && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <strong>Rising Costs:</strong> Your spending is trending upward. 
                      Review test frequency and consider implementing rate limiting.
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <Clock className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="text-sm">
                    <strong>Caching:</strong> Implement response caching for repeated prompts to reduce redundant API calls.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
