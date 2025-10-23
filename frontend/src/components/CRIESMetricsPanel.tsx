import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchStation } from '@/types/research-station';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState } from 'react';

interface MetricsData {
  timestamp: string;
  consistency: number;
  reproducibility: number;
  integrity: number;
  explainability: number;
  security: number;
}

export function CRIESMetricsPanel({ station }: { station: ResearchStation }) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // This would be replaced with real data from your API
  const dummyData: MetricsData[] = [
    {
      timestamp: '2025-10-20T10:00:00Z',
      consistency: 0.92,
      reproducibility: 0.88,
      integrity: 0.95,
      explainability: 0.85,
      security: 0.90
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
              <Line type="monotone" dataKey="consistency" stroke="#8884d8" />
              <Line type="monotone" dataKey="reproducibility" stroke="#82ca9d" />
              <Line type="monotone" dataKey="integrity" stroke="#ffc658" />
              <Line type="monotone" dataKey="explainability" stroke="#ff7300" />
              <Line type="monotone" dataKey="security" stroke="#00C49F" />
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