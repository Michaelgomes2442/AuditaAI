'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  StopCircle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

type TestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

interface ModelTest {
  id: string;
  modelName: string;
  modelType: string;
  status: TestStatus;
  progress: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  criesScore?: number;
  error?: string;
}

interface BatchTestConfig {
  prompt: string;
  maxTokens: number;
  temperature: number;
  selectedModels: string[];
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'OpenAI' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', type: 'Anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', type: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', type: 'Google' },
  { id: 'llama-3-70b', name: 'Llama 3 70B', type: 'Meta' },
  { id: 'mistral-large', name: 'Mistral Large', type: 'Mistral' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', type: 'Mistral' },
];

export default function BatchTestingPage() {
  const [config, setConfig] = useState<BatchTestConfig>({
    prompt: 'Explain quantum computing in simple terms.',
    maxTokens: 500,
    temperature: 0.7,
    selectedModels: [],
  });

  const [tests, setTests] = useState<ModelTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Select/deselect models
  const toggleModel = (modelId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedModels: prev.selectedModels.includes(modelId)
        ? prev.selectedModels.filter(id => id !== modelId)
        : [...prev.selectedModels, modelId]
    }));
  };

  const selectAll = () => {
    setConfig(prev => ({
      ...prev,
      selectedModels: AVAILABLE_MODELS.map(m => m.id)
    }));
  };

  const deselectAll = () => {
    setConfig(prev => ({ ...prev, selectedModels: [] }));
  };

  // Start batch testing
  const startBatchTest = () => {
    if (config.selectedModels.length === 0) {
      alert('Please select at least one model');
      return;
    }

    const newTests: ModelTest[] = config.selectedModels.map(modelId => {
      const model = AVAILABLE_MODELS.find(m => m.id === modelId)!;
      return {
        id: `${modelId}-${Date.now()}`,
        modelName: model.name,
        modelType: model.type,
        status: 'pending',
        progress: 0,
      };
    });

    setTests(newTests);
    setIsRunning(true);
    setIsPaused(false);
    setCompletedCount(0);
  };

  // Simulate test execution
  useEffect(() => {
    if (!isRunning || isPaused || tests.length === 0) return;

    const interval = setInterval(() => {
      setTests(prevTests => {
        let updated = [...prevTests];
        let hasChanges = false;

        // Find next pending test to run
        const pendingIndex = updated.findIndex(t => t.status === 'pending');
        
        // Check if any test is running
        const runningIndex = updated.findIndex(t => t.status === 'running');

        if (runningIndex !== -1) {
          // Update running test progress
          const test = updated[runningIndex];
          if (test.progress < 100) {
            test.progress = Math.min(100, test.progress + Math.random() * 15);
            hasChanges = true;
          } else {
            // Complete the test
            const success = Math.random() > 0.15; // 85% success rate
            test.status = success ? 'completed' : 'failed';
            test.endTime = Date.now();
            test.duration = test.startTime ? test.endTime - test.startTime : 0;
            test.criesScore = success ? Math.floor(Math.random() * 30 + 70) : undefined;
            test.error = success ? undefined : 'Test execution failed: API timeout';
            hasChanges = true;
            setCompletedCount(prev => prev + 1);
          }
        } else if (pendingIndex !== -1) {
          // Start next pending test
          updated[pendingIndex].status = 'running';
          updated[pendingIndex].startTime = Date.now();
          updated[pendingIndex].progress = 5;
          hasChanges = true;
        } else {
          // All tests completed
          const allDone = updated.every(t => t.status === 'completed' || t.status === 'failed');
          if (allDone) {
            setIsRunning(false);
          }
        }

        return hasChanges ? updated : prevTests;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, tests.length]);

  const pauseTests = () => {
    setIsPaused(true);
  };

  const resumeTests = () => {
    setIsPaused(false);
  };

  const stopTests = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTests(prev => prev.map(t => 
      t.status === 'running' || t.status === 'pending' 
        ? { ...t, status: 'failed', error: 'Stopped by user' }
        : t
    ));
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    const variants = {
      pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return variants[status];
  };

  const overallProgress = tests.length > 0 
    ? (completedCount / tests.length) * 100 
    : 0;

  const passedTests = tests.filter(t => t.status === 'completed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const avgScore = tests.filter(t => t.criesScore).length > 0
    ? tests.filter(t => t.criesScore).reduce((sum, t) => sum + (t.criesScore || 0), 0) / tests.filter(t => t.criesScore).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/lab">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Lab
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Batch Testing</h1>
                <p className="text-sm text-gray-400">Run parallel tests across multiple models</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>Configure batch test parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Test Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={config.prompt}
                    onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                    placeholder="Enter your test prompt..."
                    className="bg-gray-800 border-gray-700 min-h-[100px]"
                    disabled={isRunning}
                  />
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                      className="bg-gray-800 border-gray-700"
                      disabled={isRunning}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                      className="bg-gray-800 border-gray-700"
                      disabled={isRunning}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Selection */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Models</CardTitle>
                    <CardDescription>{config.selectedModels.length} selected</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      disabled={isRunning}
                      className="text-xs"
                    >
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAll}
                      disabled={isRunning}
                      className="text-xs"
                    >
                      None
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVAILABLE_MODELS.map((model) => (
                  <div key={model.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={model.id}
                      checked={config.selectedModels.includes(model.id)}
                      onCheckedChange={() => toggleModel(model.id)}
                      disabled={isRunning}
                    />
                    <label
                      htmlFor={model.id}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div>{model.name}</div>
                      <div className="text-xs text-gray-500">{model.type}</div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Control Buttons */}
            <div className="space-y-2">
              {!isRunning ? (
                <Button
                  onClick={startBatchTest}
                  className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  size="lg"
                  disabled={config.selectedModels.length === 0}
                >
                  <Play className="w-4 h-4" />
                  Start Batch Test
                </Button>
              ) : (
                <div className="flex gap-2">
                  {!isPaused ? (
                    <Button
                      onClick={pauseTests}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={resumeTests}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={stopTests}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Progress */}
            {tests.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Overall Progress</span>
                    <Badge variant="outline">{completedCount}/{tests.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={overallProgress} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{passedTests}</div>
                      <div className="text-xs text-gray-400">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{failedTests}</div>
                      <div className="text-xs text-gray-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{avgScore.toFixed(1)}%</div>
                      <div className="text-xs text-gray-400">Avg Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Queue */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Test Queue
                </CardTitle>
                <CardDescription>
                  {tests.length === 0 ? 'Configure and start tests' : 'Monitoring test execution'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tests.length > 0 ? (
                  <div className="space-y-3">
                    {tests.map((test) => (
                      <div
                        key={test.id}
                        className="p-4 rounded-lg border border-gray-800 bg-gray-900/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(test.status)}
                            <div>
                              <div className="font-medium">{test.modelName}</div>
                              <div className="text-xs text-gray-500">{test.modelType}</div>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(test.status)}>
                            {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                          </Badge>
                        </div>

                        {test.status === 'running' && (
                          <div className="space-y-2">
                            <Progress value={test.progress} className="h-1.5" />
                            <div className="text-xs text-gray-500">
                              {test.progress.toFixed(0)}% complete
                            </div>
                          </div>
                        )}

                        {test.status === 'completed' && test.criesScore !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">CRIES Score:</span>
                            <span className="font-bold text-green-400">{test.criesScore}%</span>
                          </div>
                        )}

                        {test.status === 'failed' && test.error && (
                          <div className="flex items-start gap-2 text-xs text-red-400 mt-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{test.error}</span>
                          </div>
                        )}

                        {test.duration !== undefined && (
                          <div className="text-xs text-gray-500 mt-2">
                            Duration: {(test.duration / 1000).toFixed(1)}s
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Play className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">No tests running</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Select models and click "Start Batch Test" to begin
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
