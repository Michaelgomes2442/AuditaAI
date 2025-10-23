import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchStation } from '@/types/research-station';

export function GovernancePanel({ station }: { station: ResearchStation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Dashboard</CardTitle>
        <CardDescription>
          Audit trails, compliance metrics, and governance controls for {station.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Active Audits</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Compliance Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Pending Reviews</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center text-muted-foreground">
            Governance panel content will be implemented here.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}