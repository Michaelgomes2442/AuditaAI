import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchStation } from '@/types/research-station';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState } from 'react';

interface MetricsData {
  timestamp: string;
  F: number; // Fabrication Detection
  O: number; // Oversight Quality
  R: number; // Refusal Accuracy
  G: number; // Guidance Quality
  E: number; // Evidence Grounding
  avg: number; // Average
}

export function FORGEMetricsPanel({ station }: { station: ResearchStation }) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // This would be replaced with real data from your API
  const dummyData: MetricsData[] = [
    {
      timestamp: '2025-10-20T10:00:00Z',
      F: 0.89,
      O: 0.85,
      R: 0.92,
      G: 0.78,
      E: 0.88,
      avg: 0.86
    },
    // ... more data points
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FORGE Metrics Overview</CardTitle>
          <CardDescription>
            Real-time metrics tracking for {selectedModels.length} selected models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <LineChart width={800} height={400} data={dummyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="F" stroke="#8884d8" name="Fabrication" />
              <Line type="monotone" dataKey="O" stroke="#82ca9d" name="Oversight" />
              <Line type="monotone" dataKey="R" stroke="#ffc658" name="Refusal" />
              <Line type="monotone" dataKey="G" stroke="#ff7300" name="Guidance" />
              <Line type="monotone" dataKey="E" stroke="#00C49F" name="Evidence" />
              <Line type="monotone" dataKey="avg" stroke="#ff0000" name="Average (Φ)" strokeWidth={3} />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Interventions</CardTitle>
            <CardDescription>
              System detected issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Alert components would go here */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>
              Overall system compliance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Compliance metrics would go here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
