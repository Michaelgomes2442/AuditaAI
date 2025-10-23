'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Download,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface CRIESScore {
  completeness: number;
  reliability: number;
  integrity: number;
  effectiveness: number;
  security: number;
  overall: number;
}

interface ModelComparison {
  id: string;
  prompt: string;
  modelA: {
    name: string;
    output: string;
    cries: CRIESScore;
  };
  modelB: {
    name: string;
    output: string;
    cries: CRIESScore;
  };
  modelC: {
    name: string;
    output: string;
    cries: CRIESScore;
  };
  consensus: 'ACHIEVED' | 'DIVERGENCE' | 'PARTIAL';
  timestamp: string;
  lamportClock: number;
}

interface ComparisonTableProps {
  comparisons: ModelComparison[];
  onRefresh?: () => void;
}

export default function ComparisonTable({ comparisons, onRefresh }: ComparisonTableProps) {
  const [sortBy, setSortBy] = useState<'timestamp' | 'lamport' | 'consensus'>('timestamp');
  const [filterConsensus, setFilterConsensus] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter comparisons
  const filteredComparisons = comparisons.filter(comp => {
    if (filterConsensus === 'all') return true;
    return comp.consensus === filterConsensus;
  });

  // Sort comparisons
  const sortedComparisons = [...filteredComparisons].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'lamport':
        return b.lamportClock - a.lamportClock;
      case 'consensus':
        return a.consensus.localeCompare(b.consensus);
      default:
        return 0;
    }
  });

  // Toggle row expansion
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Lamport Clock',
      'Prompt',
      'Consensus',
      'Model A',
      'Model A Output',
      'Model A CRIES',
      'Model B',
      'Model B Output',
      'Model B CRIES',
      'Model C',
      'Model C Output',
      'Model C CRIES'
    ];

    const rows = sortedComparisons.map(comp => [
      new Date(comp.timestamp).toISOString(),
      comp.lamportClock,
      comp.prompt.replace(/,/g, ';'), // Escape commas
      comp.consensus,
      comp.modelA.name,
      comp.modelA.output.replace(/,/g, ';').substring(0, 200),
      comp.modelA.cries.overall.toFixed(3),
      comp.modelB.name,
      comp.modelB.output.replace(/,/g, ';').substring(0, 200),
      comp.modelB.cries.overall.toFixed(3),
      comp.modelC.name,
      comp.modelC.output.replace(/,/g, ';').substring(0, 200),
      comp.modelC.cries.overall.toFixed(3)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get consensus badge styling
  const getConsensusBadge = (consensus: string) => {
    switch (consensus) {
      case 'ACHIEVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'DIVERGENCE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PARTIAL':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get consensus icon
  const getConsensusIcon = (consensus: string) => {
    switch (consensus) {
      case 'ACHIEVED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'DIVERGENCE':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  // Calculate score diff with color coding
  const getScoreDiff = (scoreA: number, scoreB: number) => {
    const diff = scoreA - scoreB;
    const absDiff = Math.abs(diff);
    
    if (absDiff < 0.05) {
      return <span className="text-gray-500 flex items-center gap-1"><Minus className="w-3 h-3" /> ~0%</span>;
    }
    
    const color = diff > 0 ? 'text-green-400' : 'text-red-400';
    const icon = diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
    
    return (
      <span className={`${color} flex items-center gap-1`}>
        {icon}
        {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
      </span>
    );
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-400';
    if (score >= 0.70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Comparison</CardTitle>
              <CardDescription>
                Side-by-side analysis of {sortedComparisons.length} comparisons
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="border-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Timestamp</SelectItem>
                  <SelectItem value="lamport">Lamport Clock</SelectItem>
                  <SelectItem value="consensus">Consensus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filter:</span>
              <Select value={filterConsensus} onValueChange={setFilterConsensus}>
                <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ACHIEVED">Achieved</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="DIVERGENCE">Divergence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(filterConsensus !== 'all' || sortBy !== 'timestamp') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterConsensus('all');
                  setSortBy('timestamp');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <div className="space-y-3">
        {sortedComparisons.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 italic">No comparisons found</p>
              <p className="text-sm text-gray-600 mt-2">
                Run witness comparisons to see results here
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedComparisons.map((comparison) => {
            const isExpanded = expandedRows.has(comparison.id);

            return (
              <Card key={comparison.id} className="bg-gray-900/50 border-gray-800 overflow-hidden">
                {/* Header Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleRow(comparison.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${getConsensusBadge(comparison.consensus)}`}>
                          {getConsensusIcon(comparison.consensus)}
                          {comparison.consensus}
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          L:{comparison.lamportClock}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comparison.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 truncate">
                        {comparison.prompt}
                      </p>
                    </div>
                    <div className="ml-4">
                      <Button variant="ghost" size="sm">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-800">
                    {/* CRIES Scores Comparison */}
                    <div className="p-4 bg-gray-950/50">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">CRIES Scores</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Model A */}
                        <div className="space-y-2">
                          <div className="font-medium text-white text-sm">{comparison.modelA.name}</div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">C</span>
                              <span className={getScoreColor(comparison.modelA.cries.completeness)}>
                                {(comparison.modelA.cries.completeness * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">R</span>
                              <span className={getScoreColor(comparison.modelA.cries.reliability)}>
                                {(comparison.modelA.cries.reliability * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">I</span>
                              <span className={getScoreColor(comparison.modelA.cries.integrity)}>
                                {(comparison.modelA.cries.integrity * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">E</span>
                              <span className={getScoreColor(comparison.modelA.cries.effectiveness)}>
                                {(comparison.modelA.cries.effectiveness * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">S</span>
                              <span className={getScoreColor(comparison.modelA.cries.security)}>
                                {(comparison.modelA.cries.security * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold pt-1 border-t border-gray-800">
                              <span className="text-gray-400">Overall</span>
                              <span className={getScoreColor(comparison.modelA.cries.overall)}>
                                {(comparison.modelA.cries.overall * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Model B */}
                        <div className="space-y-2">
                          <div className="font-medium text-white text-sm">{comparison.modelB.name}</div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">C</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelB.cries.completeness)}>
                                  {(comparison.modelB.cries.completeness * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelB.cries.completeness, comparison.modelA.cries.completeness)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">R</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelB.cries.reliability)}>
                                  {(comparison.modelB.cries.reliability * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelB.cries.reliability, comparison.modelA.cries.reliability)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">I</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelB.cries.integrity)}>
                                  {(comparison.modelB.cries.integrity * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelB.cries.integrity, comparison.modelA.cries.integrity)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">E</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelB.cries.effectiveness)}>
                                  {(comparison.modelB.cries.effectiveness * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelB.cries.effectiveness, comparison.modelA.cries.effectiveness)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">S</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelB.cries.security)}>
                                  {(comparison.modelB.cries.security * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelB.cries.security, comparison.modelA.cries.security)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold pt-1 border-t border-gray-800">
                              <span className="text-gray-400">Overall</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelB.cries.overall)}>
                                  {(comparison.modelB.cries.overall * 100).toFixed(1)}%
                                </span>
                                {getScoreDiff(comparison.modelB.cries.overall, comparison.modelA.cries.overall)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Model C */}
                        <div className="space-y-2">
                          <div className="font-medium text-white text-sm">{comparison.modelC.name}</div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">C</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelC.cries.completeness)}>
                                  {(comparison.modelC.cries.completeness * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelC.cries.completeness, comparison.modelA.cries.completeness)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">R</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelC.cries.reliability)}>
                                  {(comparison.modelC.cries.reliability * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelC.cries.reliability, comparison.modelA.cries.reliability)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">I</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelC.cries.integrity)}>
                                  {(comparison.modelC.cries.integrity * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelC.cries.integrity, comparison.modelA.cries.integrity)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">E</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelC.cries.effectiveness)}>
                                  {(comparison.modelC.cries.effectiveness * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelC.cries.effectiveness, comparison.modelA.cries.effectiveness)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">S</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelC.cries.security)}>
                                  {(comparison.modelC.cries.security * 100).toFixed(0)}%
                                </span>
                                {getScoreDiff(comparison.modelC.cries.security, comparison.modelA.cries.security)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold pt-1 border-t border-gray-800">
                              <span className="text-gray-400">Overall</span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(comparison.modelC.cries.overall)}>
                                  {(comparison.modelC.cries.overall * 100).toFixed(1)}%
                                </span>
                                {getScoreDiff(comparison.modelC.cries.overall, comparison.modelA.cries.overall)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Model Outputs */}
                    <div className="p-4 border-t border-gray-800">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Model Outputs</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Model A Output */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500">{comparison.modelA.name}</div>
                          <div className="p-3 bg-gray-950 rounded border border-gray-800 text-xs text-gray-300 max-h-48 overflow-y-auto">
                            {comparison.modelA.output}
                          </div>
                        </div>

                        {/* Model B Output */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500">{comparison.modelB.name}</div>
                          <div className="p-3 bg-gray-950 rounded border border-gray-800 text-xs text-gray-300 max-h-48 overflow-y-auto">
                            {comparison.modelB.output}
                          </div>
                        </div>

                        {/* Model C Output */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500">{comparison.modelC.name}</div>
                          <div className="p-3 bg-gray-950 rounded border border-gray-800 text-xs text-gray-300 max-h-48 overflow-y-auto">
                            {comparison.modelC.output}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divergence Alerts */}
                    {comparison.consensus === 'DIVERGENCE' && (
                      <div className="p-4 bg-red-500/10 border-t border-red-500/30">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-400 mb-1">
                              Divergence Detected
                            </p>
                            <p className="text-xs text-gray-400">
                              Models produced significantly different outputs or CRIES scores. 
                              Review responses carefully for consensus issues.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
