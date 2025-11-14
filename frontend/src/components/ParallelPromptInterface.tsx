'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, MessageSquare, Zap, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model: 'standard' | 'rosetta';
  timestamp: Date;
  forge?: {
    F: number;
    O: number;
    R: number;
    G: number;
    E: number;
    Φ?: number;
    calculation_details?: Record<
      string,
      {
        formula: string;
        values: number[];
        average: number;
      }
    >;
  };
}

interface ConversationMetrics {
  totalQueries: number;
  averageFORGE: {
    F: number;
    O: number;
    R: number;
    G: number;
    E: number;
    overall?: number;
  };
}

interface ParallelPromptInterfaceProps {
  standardModelId: string;
  rosettaModelId: string;
  standardModelName: string;
  rosettaModelName: string;
}

export default function ParallelPromptInterface({
  standardModelId,
  rosettaModelId,
  standardModelName,
  rosettaModelName
}: ParallelPromptInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [standardMetrics, setStandardMetrics] = useState<ConversationMetrics>({
    totalQueries: 0,
    averageFORGE: { F: 0, O: 0, R: 0, G: 0, E: 0, overall: 0 }
  });
  const [rosettaMetrics, setRosettaMetrics] = useState<ConversationMetrics>({
    totalQueries: 0,
    averageFORGE: { F: 0, O: 0, R: 0, G: 0, E: 0, overall: 0 }
  });

  // Helper to compute overall FORGE score (Φ) from different shapes
  const computeForgeOverall = (f: any) => {
    if (!f) return 0;
    if (typeof f.Φ === 'number') return f.Φ;
    if (typeof f.overall === 'number') return f.overall;
    const sum = (f.F ?? 0) + (f.O ?? 0) + (f.R ?? 0) + (f.G ?? 0) + (f.E ?? 0);
    return sum / 5;
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    const userPrompt = prompt;
    setPrompt('');

    try {
      // Send prompt to both models in parallel
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const endpoint = BACKEND_URL
        ? `${BACKEND_URL}/api/live-demo/parallel-prompt`
        : '/api/live-demo/parallel-prompt';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-consent': 'true'
        },
        body: JSON.stringify({
          prompt: userPrompt,
          standardModelId,
          rosettaModelId
        })
      });

      if (!response.ok) {
        const err = await response.json();
        setErrorMsg(err.error ? `${err.error}${err.details ? ': ' + err.details : ''}` : 'Parallel prompting failed.');
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: userPrompt,
        model: 'standard',
        timestamp: new Date()
      };

      // Add responses
      const standardResponse: Message = {
        role: 'assistant',
        content: result.standardResponse.content,
        model: 'standard',
        timestamp: new Date(),
        forge: result.standardResponse.forge
      };
      const rosettaResponse: Message = {
        role: 'assistant',
        content: result.rosettaResponse.content,
        model: 'rosetta',
        timestamp: new Date(),
        forge: result.rosettaResponse.forge
      };

      // Append user + both model responses to conversation
      setMessages((prev) => [...prev, userMessage, standardResponse, rosettaResponse]);

      // Update conversation metrics so the header and deltas render
      setStandardMetrics(result.standardMetrics || result.standardMetricsForge || { totalQueries: 0, averageFORGE: { F: 0, O: 0, R: 0, G: 0, E: 0, overall: 0 } });
      setRosettaMetrics(result.rosettaMetrics || result.rosettaMetricsForge || { totalQueries: 0, averageFORGE: { F: 0, O: 0, R: 0, G: 0, E: 0, overall: 0 } });
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to send prompt.');
      console.error('Failed to send prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate improvement percentage between rosetta and standard for a FORGE pillar
  const calculateImprovement = (metric: keyof typeof standardMetrics.averageFORGE | 'overall') => {
    const key = metric as string;
    const standard = (standardMetrics.averageFORGE as any)[key];
    const rosetta = (rosettaMetrics.averageFORGE as any)[key];
    if (!standard || standard === 0) return 0;
    return ((rosetta - standard) / standard) * 100;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {errorMsg && (
        <div className="col-span-3 bg-red-100 text-red-700 border border-red-300 rounded p-2 mb-2 text-sm">
          <b>Parallel Prompt Error:</b> {errorMsg}
        </div>
      )}
      <Card className="flex flex-col">
      <CardHeader className="border-b p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {standardModelName}
          </CardTitle>
          <Badge variant="secondary" className="text-xs h-5">Standard</Badge>
        </div>
        {standardMetrics.totalQueries > 0 && (
          <div className="mt-2 space-y-1.5">
            <div className="text-xs font-medium">Average FORGE Φ: {((standardMetrics.averageFORGE.overall ?? standardMetrics.averageFORGE.F ?? 0) * 100).toFixed(1)}%</div>
            <div className="grid grid-cols-5 gap-1 text-xs">
              <div className="text-center">
                <div className="font-medium">C</div>
                <div className="text-xs">{(standardMetrics.averageFORGE.O * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium">R</div>
                <div className="text-xs">{(standardMetrics.averageFORGE.R * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium">I</div>
                <div className="text-xs">{(standardMetrics.averageFORGE.G * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium">E</div>
                <div className="text-xs">{(standardMetrics.averageFORGE.E * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium">S</div>
                <div className="text-xs">{(standardMetrics.averageFORGE.F * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-3 space-y-2 max-h-[500px]">
          {messages.filter(m => m.model === 'standard' || m.role === 'user').map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                  : 'bg-muted max-w-[80%]'
              }`}
            >
              <div className="text-xs whitespace-pre-wrap">{msg.content}</div>
              {msg.forge && (
                <div className="mt-1.5 pt-1.5 border-t border-border/50">
                  <div className="text-xs font-mono flex items-center gap-2">
                    <span>
                      FORGE Φ: {(computeForgeOverall(msg.forge) * 100).toFixed(1)}%
                    </span>
                    {msg.forge.calculation_details && (
                      <span
                        className="underline decoration-dotted cursor-help text-blue-500"
                        title={Object.entries(msg.forge.calculation_details || {})
                          .map(([pillar, details]) => {
                            const d = details as any;
                            const values = Array.isArray(d.values) ? d.values.join(', ') : '';
                            return `${pillar}: ${d.formula || ''}\n  ${values}\n  avg: ${d.average ?? ''}`;
                          }).join('\n\n')}
                      >
                        (how calculated)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Center: Prompt Input & Metrics */}
      <Card className="flex flex-col">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-base">Parallel Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between p-3">
          <div className="space-y-3">
            {rosettaMetrics.totalQueries > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium">Performance Improvement</h4>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Fabrication (F)</span>
                    <span className="font-medium text-green-600">
                      +{calculateImprovement('F').toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={rosettaMetrics.averageFORGE.F * 100} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Oversight (O)</span>
                    <span className="font-medium text-green-600">
                      +{calculateImprovement('O').toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={rosettaMetrics.averageFORGE.O * 100} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Refusal (R)</span>
                    <span className="font-medium text-green-600">
                      +{calculateImprovement('R').toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={rosettaMetrics.averageFORGE.R * 100} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Guidance (G)</span>
                    <span className="font-medium text-green-600">
                      +{calculateImprovement('G').toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={rosettaMetrics.averageFORGE.G * 100} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Evidence (E)</span>
                    <span className="font-medium text-green-600">
                      +{calculateImprovement('E').toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={rosettaMetrics.averageFORGE.E * 100} className="h-1.5" />
                </div>

                <div className="pt-1.5 border-t">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Overall Improvement</span>
                    <span className="text-green-600">
                      +{calculateImprovement('overall').toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {rosettaMetrics.totalQueries} queries processed
                  </div>
                </div>
              </div>
            )}

            {rosettaMetrics.totalQueries === 0 && (
              <div className="text-center text-muted-foreground py-6">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Send a prompt to both models to compare performance</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 mt-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt to test both models..."
              className="min-h-[80px] text-sm"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full h-9 text-sm" disabled={isLoading || !prompt.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send to Both Models
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right: Rosetta Model Chat */}
      <Card className="flex flex-col">
        <CardHeader className="border-b p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              {rosettaModelName}
            </CardTitle>
            <Badge className="bg-green-600 text-xs h-5">
              <Zap className="h-3 w-3 mr-1" />
              Rosetta
            </Badge>
          </div>
          {rosettaMetrics.totalQueries > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="text-xs font-medium">Average FORGE Φ: {((rosettaMetrics.averageFORGE.overall ?? rosettaMetrics.averageFORGE.F ?? 0) * 100).toFixed(1)}%</div>
              <div className="grid grid-cols-5 gap-1 text-xs">
                <div className="text-center">
                  <div className="font-medium">C</div>
                  <div className="text-xs">{(rosettaMetrics.averageFORGE.O * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">R</div>
                  <div className="text-xs">{(rosettaMetrics.averageFORGE.R * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">I</div>
                  <div className="text-xs">{(rosettaMetrics.averageFORGE.G * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">E</div>
                  <div className="text-xs">{(rosettaMetrics.averageFORGE.E * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">S</div>
                  <div className="text-xs">{(rosettaMetrics.averageFORGE.F * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-3 space-y-2 max-h-[500px]">
          {messages.filter(m => m.model === 'rosetta' || m.role === 'user').map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                  : 'bg-green-50 dark:bg-green-900/20 max-w-[80%]'
              }`}
            >
              <div className="text-xs whitespace-pre-wrap">{msg.content}</div>
              {msg.forge && (
                <div className="mt-1.5 pt-1.5 border-t border-border/50">
                  <div className="text-xs font-mono flex items-center gap-2">
                    <span>
                      FORGE: {(computeForgeOverall(msg.forge) * 100).toFixed(1)}%
                    </span>
                    {msg.forge.calculation_details && (
                      <span
                        className="underline decoration-dotted cursor-help text-blue-500"
                        title={Object.entries(msg.forge.calculation_details || {})
                          .map(([pillar, details]) => {
                            const d = details as any;
                            const values = Array.isArray(d.values) ? d.values.join(', ') : '';
                            return `${pillar}: ${d.formula || ''}\n  ${values}\n  avg: ${d.average ?? ''}`;
                          }).join('\n\n')}
                      >
                        (how calculated)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
