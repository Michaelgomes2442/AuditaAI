'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Search, Filter, Download, Calendar, User, Activity,
  CheckCircle, XCircle, AlertTriangle, Info, FileText, Clock
} from 'lucide-react';

type AuditCategory = 'AUTH' | 'ACCESS' | 'DATA' | 'CONFIG' | 'VERIFICATION' | 'SYSTEM';
type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  category: AuditCategory;
  details?: any;
  metadata?: any;
  status: AuditStatus;
  lamport: number;
  hashPointer?: string;
  createdAt: string;
  user?: {
    name?: string;
    email: string;
  };
}

interface AuditStats {
  total: number;
  today: number;
  byCategory: Record<AuditCategory, number>;
  byStatus: Record<AuditStatus, number>;
}

const categoryColors: Record<AuditCategory, string> = {
  AUTH: 'bg-blue-500',
  ACCESS: 'bg-purple-500',
  DATA: 'bg-green-500',
  CONFIG: 'bg-yellow-500',
  VERIFICATION: 'bg-orange-500',
  SYSTEM: 'bg-gray-500',
};

const statusIcons: Record<AuditStatus, any> = {
  SUCCESS: CheckCircle,
  FAILURE: XCircle,
  WARNING: AlertTriangle,
  INFO: Info,
};

const statusColors: Record<AuditStatus, string> = {
  SUCCESS: 'text-green-500',
  FAILURE: 'text-red-500',
  WARNING: 'text-yellow-500',
  INFO: 'text-blue-500',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Pagination
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [categoryFilter, statusFilter, startDate, endDate, limit, offset]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.pagination.total);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-logs/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const handleSearch = () => {
    setOffset(0);
    fetchLogs();
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
      });
      
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/audit-logs/export?${params}`);
      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: `Audit logs exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      });
    }
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete audit trail of all system activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today.toLocaleString()}</div>
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
                {stats.total > 0
                  ? ((stats.byStatus.SUCCESS / stats.total) * 100).toFixed(1)
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(stats.byCategory).filter(v => v > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="AUTH">Authentication</SelectItem>
                  <SelectItem value="ACCESS">Access Control</SelectItem>
                  <SelectItem value="DATA">Data Changes</SelectItem>
                  <SelectItem value="CONFIG">Configuration</SelectItem>
                  <SelectItem value="VERIFICATION">Verification</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILURE">Failure</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Limit</Label>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 records</SelectItem>
                  <SelectItem value="50">50 records</SelectItem>
                  <SelectItem value="100">100 records</SelectItem>
                  <SelectItem value="200">200 records</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            Showing {logs.length} of {total.toLocaleString()} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const StatusIcon = statusIcons[log.status];
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => viewDetails(log)}
                  >
                    <StatusIcon className={`h-5 w-5 mt-0.5 ${statusColors[log.status]}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{log.action}</div>
                          {log.user && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {log.user.name || log.user.email}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={categoryColors[log.category]}>
                            {log.category}
                          </Badge>
                          <Badge variant="outline">{log.status}</Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.createdAt)}
                        </div>
                        {log.hashPointer && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Verified (Lamport: {log.lamport})
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {offset + 1} - {Math.min(offset + limit, total)} of {total.toLocaleString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit event
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <div className="font-mono">{selectedLog.id}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Lamport Clock</Label>
                  <div className="font-mono">{selectedLog.lamport}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Badge className={categoryColors[selectedLog.category]}>
                    {selectedLog.category}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline">{selectedLog.status}</Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <div className="font-medium">{selectedLog.action}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">User</Label>
                  <div>{selectedLog.user?.name || selectedLog.user?.email || 'Unknown'}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Timestamp</Label>
                  <div>{formatDate(selectedLog.createdAt)}</div>
                </div>
                {selectedLog.hashPointer && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Hash Pointer (Blockchain Verification)</Label>
                    <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                      {selectedLog.hashPointer}
                    </div>
                  </div>
                )}
              </div>

              {selectedLog.details && (
                <div>
                  <Label className="text-xs text-muted-foreground">Details</Label>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto mt-2">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <Label className="text-xs text-muted-foreground">Metadata</Label>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto mt-2">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
