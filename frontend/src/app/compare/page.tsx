'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdvancedFilters, { FilterCriteria } from '@/components/AdvancedFilters';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle } from 'lucide-react';

interface ModelResult {
  id: string;
  modelName: string;
  modelType: string;
  timestamp: string;
  overallScore: number;
  completeness: number;
  reliability: number;
  integrity: number;
  effectiveness: number;
  security: number;
  passed: boolean;
}

export default function ModelComparisonPage() {
  // Mock data - in production, this would come from API
  const allResults: ModelResult[] = [
    {
      id: '1',
      modelName: 'GPT-4 Turbo',
      modelType: 'GPT-4',
      timestamp: '2025-10-21T10:30:00Z',
      overallScore: 92,
      completeness: 95,
      reliability: 91,
      integrity: 89,
      effectiveness: 94,
      security: 91,
      passed: true,
    },
    {
      id: '2',
      modelName: 'GPT-3.5 Turbo',
      modelType: 'GPT-3.5',
      timestamp: '2025-10-21T09:15:00Z',
      overallScore: 78,
      completeness: 82,
      reliability: 75,
      integrity: 76,
      effectiveness: 80,
      security: 77,
      passed: true,
    },
    {
      id: '3',
      modelName: 'Claude 3 Opus',
      modelType: 'Claude',
      timestamp: '2025-10-20T16:45:00Z',
      overallScore: 88,
      completeness: 90,
      reliability: 87,
      integrity: 85,
      effectiveness: 91,
      security: 87,
      passed: true,
    },
    {
      id: '4',
      modelName: 'Gemini Pro',
      modelType: 'Gemini',
      timestamp: '2025-10-20T14:20:00Z',
      overallScore: 85,
      completeness: 88,
      reliability: 83,
      integrity: 82,
      effectiveness: 87,
      security: 85,
      passed: true,
    },
    {
      id: '5',
      modelName: 'Llama 3 70B',
      modelType: 'Llama',
      timestamp: '2025-10-19T11:00:00Z',
      overallScore: 81,
      completeness: 84,
      reliability: 79,
      integrity: 78,
      effectiveness: 83,
      security: 81,
      passed: true,
    },
    {
      id: '6',
      modelName: 'Mistral Large',
      modelType: 'Mistral',
      timestamp: '2025-10-19T08:30:00Z',
      overallScore: 65,
      completeness: 70,
      reliability: 62,
      integrity: 63,
      effectiveness: 68,
      security: 62,
      passed: false,
    },
    {
      id: '7',
      modelName: 'GPT-4 Vision',
      modelType: 'GPT-4',
      timestamp: '2025-10-18T15:10:00Z',
      overallScore: 90,
      completeness: 93,
      reliability: 89,
      integrity: 87,
      effectiveness: 92,
      security: 89,
      passed: true,
    },
    {
      id: '8',
      modelName: 'Custom Model A',
      modelType: 'Custom',
      timestamp: '2025-10-18T12:00:00Z',
      overallScore: 55,
      completeness: 60,
      reliability: 52,
      integrity: 51,
      effectiveness: 58,
      security: 54,
      passed: false,
    },
  ];

  const [filteredResults, setFilteredResults] = useState<ModelResult[]>(allResults);

  // Apply filters
  const applyFilters = (filters: FilterCriteria) => {
    let results = [...allResults];

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      results = results.filter(r => new Date(r.timestamp) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      results = results.filter(r => new Date(r.timestamp) <= toDate);
    }

    // Overall score filter
    if (filters.minScore !== undefined) {
      results = results.filter(r => r.overallScore >= filters.minScore!);
    }
    if (filters.maxScore !== undefined) {
      results = results.filter(r => r.overallScore <= filters.maxScore!);
    }

    // Model type filter
    if (filters.modelType && filters.modelType !== 'All Models') {
      results = results.filter(r => r.modelType === filters.modelType);
    }

    // Status filter
    if (filters.status === 'passed') {
      results = results.filter(r => r.passed);
    } else if (filters.status === 'failed') {
      results = results.filter(r => !r.passed);
    }

    // Individual CRIES dimensions
    if (filters.minCompleteness !== undefined) {
      results = results.filter(r => r.completeness >= filters.minCompleteness!);
    }
    if (filters.minReliability !== undefined) {
      results = results.filter(r => r.reliability >= filters.minReliability!);
    }
    if (filters.minIntegrity !== undefined) {
      results = results.filter(r => r.integrity >= filters.minIntegrity!);
    }
    if (filters.minEffectiveness !== undefined) {
      results = results.filter(r => r.effectiveness >= filters.minEffectiveness!);
    }
    if (filters.minSecurity !== undefined) {
      results = results.filter(r => r.security >= filters.minSecurity!);
    }

    setFilteredResults(results);
  };

  const handleReset = () => {
    setFilteredResults(allResults);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const passed = filteredResults.filter(r => r.passed).length;
    const failed = filteredResults.filter(r => !r.passed).length;
    const avgScore = filteredResults.length > 0
      ? filteredResults.reduce((sum, r) => sum + r.overallScore, 0) / filteredResults.length
      : 0;
    
    return { passed, failed, avgScore: avgScore.toFixed(1) };
  }, [filteredResults]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getTrendIcon = (score: number) => {
    if (score >= 85) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (score >= 70) return <Minus className="w-4 h-4 text-yellow-400" />;
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Model Comparison</h1>
                <p className="text-sm text-gray-400">Compare CRIES scores across models</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-400">Total Results</div>
              <div className="text-3xl font-bold text-white mt-2">
                {filteredResults.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-400">Passed</div>
              <div className="text-3xl font-bold text-green-400 mt-2">
                {stats.passed}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-400">Failed</div>
              <div className="text-3xl font-bold text-red-400 mt-2">
                {stats.failed}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-400">Avg Score</div>
              <div className={`text-3xl font-bold mt-2 ${getScoreColor(Number(stats.avgScore))}`}>
                {stats.avgScore}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          onFiltersChange={applyFilters}
          onReset={handleReset}
        />

        {/* Results Table */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {filteredResults.length} model{filteredResults.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredResults.length > 0 ? (
              <div className="space-y-3">
                {filteredResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors bg-gray-900/30"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Model Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white truncate">{result.modelName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {result.modelType}
                          </Badge>
                          {result.passed ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Passed
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {/* CRIES Scores */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(result.overallScore)}
                          <div>
                            <div className="text-xs text-gray-400">Overall</div>
                            <div className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>
                              {result.overallScore}%
                            </div>
                          </div>
                        </div>
                        <div className="hidden md:flex gap-3">
                          <div className="text-center">
                            <div className="text-xs text-blue-400">C</div>
                            <div className="text-sm font-semibold">{result.completeness}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-purple-400">R</div>
                            <div className="text-sm font-semibold">{result.reliability}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-pink-400">I</div>
                            <div className="text-sm font-semibold">{result.integrity}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-green-400">E</div>
                            <div className="text-sm font-semibold">{result.effectiveness}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-orange-400">S</div>
                            <div className="text-sm font-semibold">{result.security}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No results match your filters</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleReset}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
