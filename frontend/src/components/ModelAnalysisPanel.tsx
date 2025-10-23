import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchStation, AIModelProfile } from '@/types/research-station';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ModelAnalysisData {
  modelId: string;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
  driftScore: number;
  lastChecked: Date;
}

export function ModelAnalysisPanel({ station }: { station: ResearchStation }) {
  const [selectedModel, setSelectedModel] = useState<AIModelProfile | null>(null);
  const [analysisData, setAnalysisData] = useState<ModelAnalysisData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startAnalysis = async (model: AIModelProfile) => {
    setIsAnalyzing(true);
    try {
      // This would be replaced with actual API call
      const result = await fetch(`/api/analyze/${model.id}`);
      const data = await result.json();
      setAnalysisData(prev => [...prev, data]);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Analysis Dashboard</CardTitle>
          <CardDescription>
            Monitor and analyze AI model behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {station.models.map(model => (
                <Card key={model.id} className={`cursor-pointer ${
                  selectedModel?.id === model.id ? 'border-primary' : ''
                }`} onClick={() => setSelectedModel(model)}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {model.provider} - v{model.version}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedModel && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Analysis for {selectedModel.name}
                  </h3>
                  <Button 
                    onClick={() => startAnalysis(selectedModel)}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Behavioral Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Behavioral metrics visualization */}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Performance metrics visualization */}
                    </CardContent>
                  </Card>
                </div>

                {station.type !== 'BASIC' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Analytics</CardTitle>
                      <CardDescription>
                        Detailed model behavior analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Advanced analytics components */}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}