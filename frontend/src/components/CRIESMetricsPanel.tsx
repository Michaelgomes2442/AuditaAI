import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchStation } from '@/types/research-station';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState } from 'react';

interface MetricsData {
  timestamp: string;
  C: number; // Coherence
  R: number; // Rigor
  I: number; // Integration
  E: number; // Empathy
  S: number; // Strictness
  avg: number; // Average
}

export function CRIESMetricsPanel({ station }: { station: ResearchStation }) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // This would be replaced with real data from your API
  const dummyData: MetricsData[] = [
    {
      timestamp: '2025-10-20T10:00:00Z',
      C: 0.85,
      R: 0.78,
      I: 0.92,
      E: 0.88,
      S: 0.95,
      avg: 0.88
    },
    // ... more data points
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CRIES Metrics Overview</CardTitle>
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
              <Line type="monotone" dataKey="C" stroke="#8884d8" name="Coherence" />
              <Line type="monotone" dataKey="R" stroke="#82ca9d" name="Rigor" />
              <Line type="monotone" dataKey="I" stroke="#ffc658" name="Integration" />
              <Line type="monotone" dataKey="E" stroke="#ff7300" name="Empathy" />
              <Line type="monotone" dataKey="S" stroke="#00C49F" name="Strictness" />
              <Line type="monotone" dataKey="avg" stroke="#ff0000" name="Average" strokeWidth={3} />
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