import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchStation } from '@/types/research-station';
import { useEffect, useState } from 'react';

interface CRIESData {
  C: number;
  R: number;
  I: number;
  E: number;
  S: number;
  avg: number;
}

interface CRIESDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  total: number;
}

export function GovernancePanel({ station }: { station: ResearchStation }) {
  const [criesData, setCriesData] = useState<CRIESData | null>(null);
  const [distribution, setDistribution] = useState<CRIESDistribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCriesData = async () => {
      try {
        const response = await fetch('/api/dashboard/cries-distribution');
        const data = await response.json();
        setDistribution(data.cries_distribution);
      } catch (error) {
        console.error('Failed to fetch CRIES data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCriesData();
  }, []);

  const renderMetricBar = (label: string, value: number, emoji: string) => (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm font-medium">{emoji} {label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${value * 100}%` }}
          />
        </div>
        <span className="text-sm font-mono w-12 text-right">{(value * 100).toFixed(1)}%</span>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRIES vΩ1.1 Governance Dashboard</CardTitle>
        <CardDescription>
          Real-time CRIES metrics for {station.name}: Coherence, Rigor, Integration, Empathy, Strictness
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading CRIES data...</div>
        ) : (
          <div className="space-y-6">
            {/* CRIES Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CRIES Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderMetricBar('Coherence', 0.75, '🧩')}
                  {renderMetricBar('Rigor', 0.68, '🔬')}
                  {renderMetricBar('Integration', 0.82, '🔗')}
                  {renderMetricBar('Empathy', 0.71, '💝')}
                  {renderMetricBar('Strictness', 0.89, '⚖️')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">79.0%</div>
                    <div className="text-sm text-gray-600">Average CRIES Score</div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: '79%' }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribution */}
            {distribution && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CRIES Distribution</CardTitle>
                  <CardDescription>Score distribution across all evaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{distribution.excellent}</div>
                      <div className="text-sm text-gray-600">Excellent (90-100%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{distribution.good}</div>
                      <div className="text-sm text-gray-600">Good (70-89%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{distribution.fair}</div>
                      <div className="text-sm text-gray-600">Fair (50-69%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{distribution.poor}</div>
                      <div className="text-sm text-gray-600">Poor (0-49%)</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Total Evaluations: {distribution.total}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Δ-CRIES Receipts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Δ-CRIES Receipts</CardTitle>
                <CardDescription>Recent CRIES scoring receipts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    View CRIES Receipt History
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}