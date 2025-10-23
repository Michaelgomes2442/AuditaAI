import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSocket } from '@/hooks/use-socket';
import { ResearchStation } from '@/types/research-station';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CRIESMetricsPanel } from './CRIESMetricsPanel';
import { ModelAnalysisPanel } from './ModelAnalysisPanel';
import { GovernancePanel } from './GovernancePanel';
import { useEffect, useState } from 'react';

export function ResearchStationDashboard({ station }: { station: ResearchStation }) {
  const { lastMetricsUpdate, lastAuditUpdate, lastVerification } = useSocket(station.orgId);
  const [activeModels, setActiveModels] = useState<string[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    if (lastMetricsUpdate) {
      // Update metrics visualization
    }
    if (lastAuditUpdate) {
      // Update audit logs
    }
    if (lastVerification) {
      // Update verification status
    }
  }, [lastMetricsUpdate, lastAuditUpdate, lastVerification]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{station.name}</h2>
          <p className="text-muted-foreground">{station.type} Research Station</p>
        </div>
        <div className="flex items-center space-x-4">
          <Card className="w-fit">
            <CardContent className="py-2">
              <div className="text-sm font-medium">Active Models</div>
              <div className="text-2xl font-bold">{activeModels.length}</div>
            </CardContent>
          </Card>
          <Card className="w-fit">
            <CardContent className="py-2">
              <div className="text-sm font-medium">Alerts</div>
              <div className="text-2xl font-bold text-yellow-500">{alertsCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">CRIES Metrics</TabsTrigger>
          <TabsTrigger value="models">Model Analysis</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          {station.type !== 'BASIC' && (
            <TabsTrigger value="custom">Custom Analysis</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="metrics">
          <CRIESMetricsPanel station={station} />
        </TabsContent>
        <TabsContent value="models">
          <ModelAnalysisPanel station={station} />
        </TabsContent>
        <TabsContent value="governance">
          <GovernancePanel station={station} />
        </TabsContent>
        {station.type !== 'BASIC' && (
          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Custom Analysis Tools</CardTitle>
                <CardDescription>
                  Create and run custom analysis workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Custom analysis tools based on station type */}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}