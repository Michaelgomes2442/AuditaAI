'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RateLimit {
  id: number;
  provider: string;
  limitType: string;
  limitPeriod: string;
  maxLimit: number;
  currentUsage: number;
  resetAt: string;
  warningThreshold: number;
  lastWarningAt: string | null;
}

export default function RateLimitsPage() {
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showConfig, setShowConfig] = useState(false);
  const { toast } = useToast();

  // Configuration state
  const [newLimit, setNewLimit] = useState({
    provider: 'openai',
    limitType: 'requests',
    limitPeriod: 'minute',
    maxLimit: 60,
    warningThreshold: 80,
  });

  useEffect(() => {
    fetchRateLimits();
    const interval = setInterval(fetchRateLimits, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchRateLimits = async () => {
    try {
      const response = await fetch('/api/rate-limits');
      if (!response.ok) throw new Error('Failed to fetch rate limits');
      const data = await response.json();
      setRateLimits(data.rateLimits || []);
    } catch (error) {
      console.error('Error fetching rate limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRateLimit = async () => {
    try {
      const response = await fetch('/api/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLimit),
      });

      if (!response.ok) throw new Error('Failed to create rate limit');

      const data = await response.json();
      toast({
        title: 'Rate limit created',
        description: `${newLimit.provider} ${newLimit.limitType} limit added`,
      });

      setRateLimits([...rateLimits, data.rateLimit]);
      setShowConfig(false);
      setNewLimit({
        provider: 'openai',
        limitType: 'requests',
        limitPeriod: 'minute',
        maxLimit: 60,
        warningThreshold: 80,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create rate limit',
        variant: 'destructive',
      });
    }
  };

  const updateRateLimit = async (id: number, updates: Partial<RateLimit>) => {
    try {
      const response = await fetch(`/api/rate-limits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update rate limit');

      const data = await response.json();
      setRateLimits(rateLimits.map(rl => rl.id === id ? data.rateLimit : rl));
      
      toast({
        title: 'Rate limit updated',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update rate limit',
        variant: 'destructive',
      });
    }
  };

  const resetUsage = async (id: number) => {
    try {
      const response = await fetch(`/api/rate-limits/${id}/reset`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reset usage');

      const data = await response.json();
      setRateLimits(rateLimits.map(rl => rl.id === id ? data.rateLimit : rl));
      
      toast({
        title: 'Usage reset',
        description: 'Rate limit counter has been reset',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset usage',
        variant: 'destructive',
      });
    }
  };

  const deleteRateLimit = async (id: number) => {
    try {
      const response = await fetch(`/api/rate-limits/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete rate limit');

      setRateLimits(rateLimits.filter(rl => rl.id !== id));
      
      toast({
        title: 'Rate limit deleted',
        description: 'Limit removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete rate limit',
        variant: 'destructive',
      });
    }
  };

  const getUsagePercentage = (limit: RateLimit): number => {
    return Math.min((limit.currentUsage / limit.maxLimit) * 100, 100);
  };

  const getStatusColor = (limit: RateLimit): string => {
    const percentage = getUsagePercentage(limit);
    if (percentage >= limit.warningThreshold) return 'destructive';
    if (percentage >= limit.warningThreshold * 0.7) return 'warning';
    return 'default';
  };

  const getStatusIcon = (limit: RateLimit) => {
    const percentage = getUsagePercentage(limit);
    if (percentage >= limit.warningThreshold) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (percentage >= limit.warningThreshold * 0.7) {
      return <Activity className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getTimeUntilReset = (resetAt: string): string => {
    const now = new Date();
    const reset = new Date(resetAt);
    const diff = reset.getTime() - now.getTime();
    
    if (diff <= 0) return 'Resetting...';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const filteredLimits = selectedProvider === 'all'
    ? rateLimits
    : rateLimits.filter(rl => rl.provider === selectedProvider);

  const providers = Array.from(new Set(rateLimits.map(rl => rl.provider)));

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Rate Limits</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage API usage limits across providers
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map(provider => (
                <SelectItem key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowConfig(!showConfig)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Limits
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active rate limits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {rateLimits.filter(rl => getUsagePercentage(rl) >= rl.warningThreshold * 0.7).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approaching threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {rateLimits.filter(rl => getUsagePercentage(rl) >= rl.warningThreshold).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              At or above limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active providers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Form */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Create Rate Limit</CardTitle>
            <CardDescription>
              Configure a new rate limit for API usage monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={newLimit.provider}
                  onValueChange={(value) => setNewLimit({ ...newLimit, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="cohere">Cohere</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Limit Type</Label>
                <Select
                  value={newLimit.limitType}
                  onValueChange={(value) => setNewLimit({ ...newLimit, limitType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requests">Requests</SelectItem>
                    <SelectItem value="tokens">Tokens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select
                  value={newLimit.limitPeriod}
                  onValueChange={(value) => setNewLimit({ ...newLimit, limitPeriod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Per Minute</SelectItem>
                    <SelectItem value="hour">Per Hour</SelectItem>
                    <SelectItem value="day">Per Day</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Limit</Label>
                <Input
                  type="number"
                  value={newLimit.maxLimit}
                  onChange={(e) => setNewLimit({ ...newLimit, maxLimit: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Warning Threshold (%)</Label>
                <Input
                  type="number"
                  value={newLimit.warningThreshold}
                  onChange={(e) => setNewLimit({ ...newLimit, warningThreshold: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={createRateLimit} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Create Limit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Limits List */}
      <div className="space-y-4">
        {filteredLimits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rate limits configured</h3>
              <p className="text-muted-foreground mb-4">
                {selectedProvider === 'all'
                  ? 'Create your first rate limit to start monitoring API usage'
                  : `No limits configured for ${selectedProvider}`}
              </p>
              <Button onClick={() => setShowConfig(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Limits
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredLimits.map((limit) => {
            const percentage = getUsagePercentage(limit);
            const statusColor = getStatusColor(limit);

            return (
              <Card key={limit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(limit)}
                      <div>
                        <CardTitle className="text-lg">
                          {limit.provider.charAt(0).toUpperCase() + limit.provider.slice(1)} - {limit.limitType}
                        </CardTitle>
                        <CardDescription>
                          Per {limit.limitPeriod} • Resets in {getTimeUntilReset(limit.resetAt)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColor as any}>
                        {percentage.toFixed(1)}% Used
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUsage(limit.id)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRateLimit(limit.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {limit.currentUsage.toLocaleString()} / {limit.maxLimit.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {(limit.maxLimit - limit.currentUsage).toLocaleString()} remaining
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    
                    {/* Warning threshold indicator */}
                    <div className="relative h-1">
                      <div
                        className="absolute h-1 w-0.5 bg-yellow-500"
                        style={{ left: `${limit.warningThreshold}%` }}
                      />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Limit Type</p>
                      <p className="text-sm font-medium capitalize">{limit.limitType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Period</p>
                      <p className="text-sm font-medium capitalize">{limit.limitPeriod}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Warning At</p>
                      <p className="text-sm font-medium">{limit.warningThreshold}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Warning</p>
                      <p className="text-sm font-medium">
                        {limit.lastWarningAt 
                          ? new Date(limit.lastWarningAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Warning Message */}
                  {percentage >= limit.warningThreshold && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-destructive">Rate limit threshold exceeded</p>
                        <p className="text-muted-foreground mt-1">
                          You've used {percentage.toFixed(1)}% of your {limit.limitPeriod}ly {limit.limitType} quota.
                          Consider reducing usage or increasing your limit.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
