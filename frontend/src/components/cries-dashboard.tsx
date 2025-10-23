'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface CRIESScore {
  composite: number;
  sigma: number;
  tau: number;
  pi: number;
  citations: number;
  recommendations: string[];
  violations: {
    sigma: string[];
    tau: string[];
    pi: string[];
    citations: string[];
  };
}

interface CRIESComputation {
  id: number;
  criesScore: number;
  lamportClock: number;
  receiptId: string;
  computedAt: string;
  analysisData: any;
}

interface CRIESStats {
  totalComputations: number;
  averageScore: number;
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  componentAverages: {
    sigma: number;
    tau: number;
    pi: number;
    citations: number;
  };
}

export default function CRIESDashboard() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [citations, setCitations] = useState('');
  const [score, setScore] = useState<CRIESScore | null>(null);
  const [computing, setComputing] = useState(false);
  const [history, setHistory] = useState<CRIESComputation[]>([]);
  const [stats, setStats] = useState<CRIESStats | null>(null);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/cries/compute?limit=10');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load CRIES history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/cries/compute?stats=true');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load CRIES stats:', error);
    }
  };

  const computeCRIES = async (store = false) => {
    setComputing(true);
    try {
      const citationArray = citations
        .split('\n')
        .filter(c => c.trim())
        .map(c => ({ url: c.trim() }));

      const res = await fetch('/api/cries/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          response,
          citations: citationArray,
          store,
        }),
      });

      const data = await res.json();
      
      if (store) {
        await loadHistory();
        await loadStats();
      } else {
        setScore(data.score);
      }
    } catch (error) {
      console.error('CRIES computation failed:', error);
    } finally {
      setComputing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-blue-600">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-600">Fair</Badge>;
    return <Badge className="bg-red-600">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Computations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComputations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore.toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Excellent ({stats.distribution.excellent})</span>
                </div>
                <div className="flex justify-between">
                  <span>Good ({stats.distribution.good})</span>
                </div>
                <div className="flex justify-between">
                  <span>Fair ({stats.distribution.fair})</span>
                </div>
                <div className="flex justify-between">
                  <span>Poor ({stats.distribution.poor})</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Component Averages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>σ-window:</span>
                  <span className="font-mono">{stats.componentAverages.sigma.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>τ-threshold:</span>
                  <span className="font-mono">{stats.componentAverages.tau.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Π-policy:</span>
                  <span className="font-mono">{stats.componentAverages.pi.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Citations:</span>
                  <span className="font-mono">{stats.componentAverages.citations.toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compute Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Compute CRIES Score</CardTitle>
          <CardDescription>
            Evaluate prompt/response quality with σ-window, τ-threshold, Π-policy, and citation analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Prompt</label>
            <Textarea
              placeholder="Enter the prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Response</label>
            <Textarea
              placeholder="Enter the response..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Citations (one per line)</label>
            <Textarea
              placeholder="https://example.com/source1&#10;https://example.com/source2"
              value={citations}
              onChange={(e) => setCitations(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => computeCRIES(false)}
              disabled={computing || !prompt || !response}
            >
              {computing ? 'Computing...' : 'Compute (Preview)'}
            </Button>
            <Button
              onClick={() => computeCRIES(true)}
              disabled={computing || !prompt || !response}
              variant="outline"
            >
              Compute & Store
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Score Display */}
      {score && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>CRIES Score</span>
              {getScoreBadge(score.composite)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Composite Score */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Composite Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(score.composite)}`}>
                  {score.composite.toFixed(1)}
                </span>
              </div>
              <Progress value={score.composite} className="h-3" />
            </div>

            {/* Component Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">σ-window (Prompt Quality)</span>
                  <span className="font-mono text-sm">{score.sigma.toFixed(1)}</span>
                </div>
                <Progress value={score.sigma} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">τ-threshold (Response Coherence)</span>
                  <span className="font-mono text-sm">{score.tau.toFixed(1)}</span>
                </div>
                <Progress value={score.tau} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Π-policy (Compliance)</span>
                  <span className="font-mono text-sm">{score.pi.toFixed(1)}</span>
                </div>
                <Progress value={score.pi} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Citation Quality</span>
                  <span className="font-mono text-sm">{score.citations.toFixed(1)}</span>
                </div>
                <Progress value={score.citations} className="h-2" />
              </div>
            </div>

            {/* Violations */}
            {(score.violations.sigma.length > 0 ||
              score.violations.tau.length > 0 ||
              score.violations.pi.length > 0 ||
              score.violations.citations.length > 0) && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Violations
                </h4>
                <div className="space-y-2">
                  {score.violations.sigma.map((v, i) => (
                    <div key={i} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="font-mono text-xs">σ:</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  {score.violations.tau.map((v, i) => (
                    <div key={i} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="font-mono text-xs">τ:</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  {score.violations.pi.map((v, i) => (
                    <div key={i} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="font-mono text-xs">Π:</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  {score.violations.citations.map((v, i) => (
                    <div key={i} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="font-mono text-xs">📎:</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {score.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {score.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Computations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">
                        L{comp.lamportClock}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(comp.computedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-xl font-bold ${getScoreColor(comp.criesScore)}`}>
                      {comp.criesScore.toFixed(1)}
                    </div>
                    {getScoreBadge(comp.criesScore)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
