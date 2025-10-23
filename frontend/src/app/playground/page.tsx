'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { PlayCircle, Save, Copy, Trash2, Loader2, Zap, Clock, DollarSign, Hash } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlaygroundResponse {
  response: string;
  responseTime: number;
  tokenCount: number;
  cost: number;
  modelName: string;
  timestamp: string;
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [model, setModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2000]);
  const [topP, setTopP] = useState([1.0]);
  const [streaming, setStreaming] = useState(true);
  
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PlaygroundResponse[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);

  const modelsByProvider = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-2.1'],
    google: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  };

  const handleProviderChange = (newProvider: 'openai' | 'anthropic' | 'google') => {
    setProvider(newProvider);
    setModel(modelsByProvider[newProvider][0]);
  };

  const handleExecute = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setStreamingText('');
    setResponse(null);

    try {
      const startTime = Date.now();
      
      const res = await fetch('/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider,
          model,
          temperature: temperature[0],
          maxTokens: maxTokens[0],
          topP: topP[0],
          streaming,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to execute');
      }

      if (streaming && res.body) {
        // Handle streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setStreamingText(fullText);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        const responseTime = Date.now() - startTime;
        const result: PlaygroundResponse = {
          response: fullText,
          responseTime,
          tokenCount: Math.ceil(fullText.length / 4), // Rough estimate
          cost: 0.001, // Placeholder
          modelName: model,
          timestamp: new Date().toISOString(),
        };

        setResponse(result);
        setHistory([result, ...history.slice(0, 9)]); // Keep last 10
      } else {
        // Handle non-streaming response
        const data = await res.json();
        const responseTime = Date.now() - startTime;
        
        const result: PlaygroundResponse = {
          response: data.response,
          responseTime,
          tokenCount: data.tokenCount || 0,
          cost: data.cost || 0,
          modelName: model,
          timestamp: new Date().toISOString(),
        };

        setResponse(result);
        setStreamingText(data.response);
        setHistory([result, ...history.slice(0, 9)]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!response) return;

    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Playground ${new Date().toLocaleString()}`,
          description: 'Saved from playground',
          prompt,
          modelName: model,
          modelProvider: provider,
          temperature: temperature[0],
          maxTokens: maxTokens[0],
          topP: topP[0],
        }),
      });

      alert('Saved as template!');
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const handleCopyResponse = () => {
    if (streamingText) {
      navigator.clipboard.writeText(streamingText);
      alert('Copied to clipboard!');
    }
  };

  const handleClear = () => {
    setPrompt('');
    setResponse(null);
    setStreamingText('');
    setError(null);
  };

  const handleLoadHistory = (idx: number) => {
    const item = history[idx];
    setStreamingText(item.response);
    setResponse(item);
    setSelectedHistory(idx);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Playground</h1>
          <p className="text-muted-foreground">
            Test prompts and configurations in real-time
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          Live Testing
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Model Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsByProvider[provider].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-muted-foreground">{temperature[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Higher = more creative, Lower = more focused
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Tokens</Label>
                  <span className="text-sm text-muted-foreground">{maxTokens[0]}</span>
                </div>
                <Slider
                  value={maxTokens}
                  onValueChange={setMaxTokens}
                  min={100}
                  max={4000}
                  step={100}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Top P</Label>
                  <span className="text-sm text-muted-foreground">{topP[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={topP}
                  onValueChange={setTopP}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Streaming</Label>
                <Switch checked={streaming} onCheckedChange={setStreaming} />
              </div>
            </CardContent>
          </Card>

          {/* Response Metrics */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Response Time</span>
                  </div>
                  <span className="font-medium">{response.responseTime}ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Tokens</span>
                  </div>
                  <span className="font-medium">{response.tokenCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Cost</span>
                  </div>
                  <span className="font-medium">${response.cost.toFixed(4)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleLoadHistory(idx)}
                      className={`p-2 border rounded cursor-pointer hover:bg-accent ${
                        selectedHistory === idx ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="text-sm font-medium">{item.modelName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()} • {item.responseTime}ms
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Prompt & Response */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt</CardTitle>
              <CardDescription>Enter your prompt to test</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-[200px] font-mono"
              />
              
              <div className="flex gap-2 mt-4">
                <Button onClick={handleExecute} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
                <Button onClick={handleClear} variant="outline" disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Response Display */}
          {(streamingText || loading) && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Response</CardTitle>
                  <div className="flex gap-2">
                    {response && (
                      <>
                        <Button onClick={handleSaveAsTemplate} variant="outline" size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save as Template
                        </Button>
                        <Button onClick={handleCopyResponse} variant="outline" size="sm">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg min-h-[300px] max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {streamingText}
                    {loading && streaming && <span className="animate-pulse">▊</span>}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!streamingText && !loading && !error && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Ready to test</p>
                  <p className="text-sm">Enter a prompt and click Execute to see results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
