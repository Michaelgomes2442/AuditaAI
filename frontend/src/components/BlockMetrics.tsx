import { useSocket } from '@/hooks/use-socket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

type MetricsData = {
  consistency: number;
  reproducibility: number;
  integrity: number;
  explainability: number;
  security: number;
  timestamp: string;
  recordsAnalyzed: number;
};

export function BlockMetrics({ orgId }: { orgId: string }) {
  const { lastMetricsUpdate } = useSocket(orgId);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    if (lastMetricsUpdate) {
      setMetrics(lastMetricsUpdate.metrics);
    }
  }, [lastMetricsUpdate]);

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CRIES Metrics</CardTitle>
          <CardDescription>Waiting for block creation...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRIES Metrics</CardTitle>
        <CardDescription>
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium">Consistency</h4>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${metrics.consistency * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(metrics.consistency * 100)}%
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium">Reproducibility</h4>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${metrics.reproducibility * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(metrics.reproducibility * 100)}%
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium">Integrity</h4>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-yellow-500"
                  style={{ width: `${metrics.integrity * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(metrics.integrity * 100)}%
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium">Explainability</h4>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${metrics.explainability * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(metrics.explainability * 100)}%
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium">Security</h4>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${metrics.security * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(metrics.security * 100)}%
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Based on {metrics.recordsAnalyzed} records
        </div>
      </CardContent>
    </Card>
  );
}