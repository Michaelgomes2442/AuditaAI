'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Webhook as WebhookIcon,
  Plus,
  Trash2,
  Edit,
  TestTube,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RotateCcw,
  Eye,
  Zap,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Webhook {
  id: number;
  name: string;
  description: string | null;
  url: string;
  secret: string | null;
  events: string[];
  method: string;
  headers: any;
  payloadTemplate: any;
  isActive: boolean;
  retryEnabled: boolean;
  maxRetries: number;
  retryDelay: number;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  lastTriggered: string | null;
  lastSuccess: string | null;
  lastFailure: string | null;
  lastError: string | null;
  createdAt: string;
}

interface WebhookLog {
  id: number;
  webhookId: number;
  event: string;
  statusCode: number | null;
  success: boolean;
  attempt: number;
  responseTime: number | null;
  error: string | null;
  createdAt: string;
}

const EVENT_TYPES = [
  { value: 'test.completed', label: 'Test Completed', description: 'When a test run completes successfully' },
  { value: 'test.failed', label: 'Test Failed', description: 'When a test run fails' },
  { value: 'test.started', label: 'Test Started', description: 'When a test run begins' },
  { value: 'threshold.breached', label: 'Threshold Breached', description: 'When a metric exceeds threshold' },
  { value: 'rate-limit.warning', label: 'Rate Limit Warning', description: 'Approaching rate limit' },
  { value: 'rate-limit.exceeded', label: 'Rate Limit Exceeded', description: 'Rate limit reached' },
  { value: 'model.degradation', label: 'Model Degradation', description: 'Performance degradation detected' },
  { value: 'cost.alert', label: 'Cost Alert', description: 'Cost threshold exceeded' },
];

const HTTP_METHODS = ['POST', 'PUT', 'PATCH', 'GET'];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const { toast } = useToast();

  // New webhook form
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    description: '',
    url: '',
    secret: '',
    events: [] as string[],
    method: 'POST',
    headers: '{}',
    payloadTemplate: '{}',
    retryEnabled: true,
    maxRetries: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      if (!response.ok) throw new Error('Failed to fetch webhooks');
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async (webhookId: number) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setWebhookLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhook logs',
        variant: 'destructive',
      });
    }
  };

  const createWebhook = async () => {
    try {
      let headers, payloadTemplate;
      try {
        headers = JSON.parse(newWebhook.headers);
        payloadTemplate = JSON.parse(newWebhook.payloadTemplate);
      } catch (e) {
        toast({
          title: 'Invalid JSON',
          description: 'Headers and Payload Template must be valid JSON',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newWebhook,
          headers,
          payloadTemplate,
        }),
      });

      if (!response.ok) throw new Error('Failed to create webhook');

      const data = await response.json();
      setWebhooks([...webhooks, data.webhook]);
      setShowCreateDialog(false);
      setNewWebhook({
        name: '',
        description: '',
        url: '',
        secret: '',
        events: [],
        method: 'POST',
        headers: '{}',
        payloadTemplate: '{}',
        retryEnabled: true,
        maxRetries: 3,
        retryDelay: 1000,
      });

      toast({
        title: 'Webhook Created',
        description: `${newWebhook.name} has been configured`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
    }
  };

  const toggleWebhook = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle webhook');

      const data = await response.json();
      setWebhooks(webhooks.map(w => w.id === webhook.id ? data.webhook : w));

      toast({
        title: webhook.isActive ? 'Webhook Disabled' : 'Webhook Enabled',
        description: `${webhook.name} is now ${webhook.isActive ? 'inactive' : 'active'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle webhook',
        variant: 'destructive',
      });
    }
  };

  const deleteWebhook = async (id: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete webhook');

      setWebhooks(webhooks.filter(w => w.id !== id));
      toast({
        title: 'Webhook Deleted',
        description: 'Webhook has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const testWebhook = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/test`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to test webhook');

      const data = await response.json();
      
      toast({
        title: data.success ? 'Test Successful' : 'Test Failed',
        description: data.success 
          ? `Webhook responded with status ${data.statusCode}`
          : `Error: ${data.error}`,
        variant: data.success ? 'default' : 'destructive',
      });

      fetchWebhooks(); // Refresh stats
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    }
  };

  const viewLogs = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    fetchWebhookLogs(webhook.id);
    setShowLogsDialog(true);
  };

  const getSuccessRate = (webhook: Webhook): number => {
    if (webhook.totalCalls === 0) return 0;
    return Math.round((webhook.successCount / webhook.totalCalls) * 100);
  };

  const getStatusBadge = (webhook: Webhook) => {
    if (!webhook.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    const successRate = getSuccessRate(webhook);
    if (successRate >= 95) {
      return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
    }
    if (successRate >= 70) {
      return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>;
    }
    return <Badge variant="destructive">Error</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <WebhookIcon className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Configure webhooks for test events and system notifications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Webhook Name*</Label>
                  <Input
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    placeholder="Production Slack Notifications"
                  />
                </div>

                <div className="space-y-2">
                  <Label>HTTP Method</Label>
                  <Select
                    value={newWebhook.method}
                    onValueChange={(value) => setNewWebhook({ ...newWebhook, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HTTP_METHODS.map(method => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                  placeholder="Send test completion events to Slack"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook URL*</Label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label>Secret (Optional)</Label>
                <Input
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  placeholder="Used for HMAC signature verification"
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label>Event Triggers*</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {EVENT_TYPES.map(event => (
                    <div key={event.value} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={event.value}
                        checked={newWebhook.events.includes(event.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({
                              ...newWebhook,
                              events: [...newWebhook.events, event.value]
                            });
                          } else {
                            setNewWebhook({
                              ...newWebhook,
                              events: newWebhook.events.filter(ev => ev !== event.value)
                            });
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={event.value} className="cursor-pointer text-sm">
                          {event.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custom Headers (JSON)</Label>
                  <Textarea
                    value={newWebhook.headers}
                    onChange={(e) => setNewWebhook({ ...newWebhook, headers: e.target.value })}
                    placeholder='{"Authorization": "Bearer token"}'
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payload Template (JSON)</Label>
                  <Textarea
                    value={newWebhook.payloadTemplate}
                    onChange={(e) => setNewWebhook({ ...newWebhook, payloadTemplate: e.target.value })}
                    placeholder='{"text": "{{message}}"}'
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Retries</Label>
                    <p className="text-xs text-muted-foreground">Automatically retry failed requests</p>
                  </div>
                  <Switch
                    checked={newWebhook.retryEnabled}
                    onCheckedChange={(checked) => setNewWebhook({ ...newWebhook, retryEnabled: checked })}
                  />
                </div>

                {newWebhook.retryEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Retries</Label>
                      <Input
                        type="number"
                        value={newWebhook.maxRetries}
                        onChange={(e) => setNewWebhook({ ...newWebhook, maxRetries: parseInt(e.target.value) })}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Retry Delay (ms)</Label>
                      <Input
                        type="number"
                        value={newWebhook.retryDelay}
                        onChange={(e) => setNewWebhook({ ...newWebhook, retryDelay: parseInt(e.target.value) })}
                        min="100"
                        step="100"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createWebhook} 
                  disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                >
                  Create Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {webhooks.filter(w => w.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooks.reduce((sum, w) => sum + w.totalCalls, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooks.length > 0
                ? Math.round(
                    (webhooks.reduce((sum, w) => sum + w.successCount, 0) /
                      Math.max(webhooks.reduce((sum, w) => sum + w.totalCalls, 0), 1)) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <WebhookIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first webhook to receive event notifications
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{webhook.name}</CardTitle>
                      {getStatusBadge(webhook)}
                    </div>
                    <CardDescription className="mt-1">
                      {webhook.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={() => toggleWebhook(webhook)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* URL and Method */}
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">{webhook.method}</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {webhook.url}
                  </code>
                </div>

                {/* Event Tags */}
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((event, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                    <p className="text-lg font-semibold">{webhook.totalCalls}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-lg font-semibold text-green-500">
                      {getSuccessRate(webhook)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Failures</p>
                    <p className="text-lg font-semibold text-destructive">
                      {webhook.failureCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Triggered</p>
                    <p className="text-sm font-medium">
                      {webhook.lastTriggered
                        ? new Date(webhook.lastTriggered).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Last Error */}
                {webhook.lastError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="text-sm flex-1">
                        <p className="font-medium text-destructive">Last Error</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {webhook.lastError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook(webhook)}
                    disabled={!webhook.isActive}
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewLogs(webhook)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWebhook(webhook.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Webhook Logs: {selectedWebhook?.name}</DialogTitle>
            <DialogDescription>
              Recent delivery attempts for this webhook
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {webhookLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No logs available</p>
            ) : (
              webhookLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 text-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge variant="outline">{log.event}</Badge>
                      {log.statusCode && (
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.statusCode}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Attempt:</span> {log.attempt}
                    </div>
                    {log.responseTime && (
                      <div>
                        <span className="text-muted-foreground">Response Time:</span> {log.responseTime}ms
                      </div>
                    )}
                  </div>

                  {log.error && (
                    <div className="mt-2 bg-destructive/10 rounded p-2 text-xs">
                      <p className="font-medium text-destructive">Error:</p>
                      <p className="text-muted-foreground mt-1">{log.error}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
