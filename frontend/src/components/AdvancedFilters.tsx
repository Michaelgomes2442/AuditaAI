'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Calendar, Sliders, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export interface FilterCriteria {
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  maxScore?: number;
  modelType?: string;
  status?: 'all' | 'passed' | 'failed';
  minCompleteness?: number;
  minReliability?: number;
  minIntegrity?: number;
  minEffectiveness?: number;
  minSecurity?: number;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterCriteria) => void;
  onReset: () => void;
}

export default function AdvancedFilters({ onFiltersChange, onReset }: AdvancedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterCriteria>(() => {
    return {
      dateFrom: searchParams?.get('dateFrom') || undefined,
      dateTo: searchParams?.get('dateTo') || undefined,
      minScore: searchParams?.get('minScore') ? Number(searchParams.get('minScore')) : undefined,
      maxScore: searchParams?.get('maxScore') ? Number(searchParams.get('maxScore')) : undefined,
      modelType: searchParams?.get('modelType') || undefined,
      status: (searchParams?.get('status') as FilterCriteria['status']) || 'all',
      minCompleteness: searchParams?.get('minC') ? Number(searchParams.get('minC')) : undefined,
      minReliability: searchParams?.get('minR') ? Number(searchParams.get('minR')) : undefined,
      minIntegrity: searchParams?.get('minI') ? Number(searchParams.get('minI')) : undefined,
      minEffectiveness: searchParams?.get('minE') ? Number(searchParams.get('minE')) : undefined,
      minSecurity: searchParams?.get('minS') ? Number(searchParams.get('minS')) : undefined,
    };
  });

  // Model types available
  const modelTypes = [
    'All Models',
    'GPT-4',
    'GPT-3.5',
    'Claude',
    'Gemini',
    'Llama',
    'Mistral',
    'Custom'
  ];

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.minScore !== undefined) params.set('minScore', filters.minScore.toString());
    if (filters.maxScore !== undefined) params.set('maxScore', filters.maxScore.toString());
    if (filters.modelType && filters.modelType !== 'All Models') params.set('modelType', filters.modelType);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.minCompleteness !== undefined) params.set('minC', filters.minCompleteness.toString());
    if (filters.minReliability !== undefined) params.set('minR', filters.minReliability.toString());
    if (filters.minIntegrity !== undefined) params.set('minI', filters.minIntegrity.toString());
    if (filters.minEffectiveness !== undefined) params.set('minE', filters.minEffectiveness.toString());
    if (filters.minSecurity !== undefined) params.set('minS', filters.minSecurity.toString());

    const queryString = params.toString();
    router.push((queryString ? `?${queryString}` : window.location.pathname) as any, { scroll: false });
    
    onFiltersChange(filters);
  }, [filters, onFiltersChange, router]);

  const handleReset = () => {
    const emptyFilters: FilterCriteria = {
      status: 'all',
    };
    setFilters(emptyFilters);
    router.push(window.location.pathname as any, { scroll: false });
    onReset();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.minScore !== undefined || filters.maxScore !== undefined) count++;
    if (filters.modelType && filters.modelType !== 'All Models') count++;
    if (filters.status !== 'all') count++;
    if (filters.minCompleteness !== undefined) count++;
    if (filters.minReliability !== undefined) count++;
    if (filters.minIntegrity !== undefined) count++;
    if (filters.minEffectiveness !== undefined) count++;
    if (filters.minSecurity !== undefined) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Advanced Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeCount}
            </Badge>
          )}
        </Button>
        
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2 text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Reset All
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Filter Criteria</CardTitle>
                <CardDescription>
                  Narrow down results by date, scores, model type, and status
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom" className="text-xs text-gray-400">From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo" className="text-xs text-gray-400">To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Overall Score Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Overall CRIES Score
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minScore" className="text-xs text-gray-400">Minimum (%)</Label>
                  <Input
                    id="minScore"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minScore ?? ''}
                    onChange={(e) => setFilters({ ...filters, minScore: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore" className="text-xs text-gray-400">Maximum (%)</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.maxScore ?? ''}
                    onChange={(e) => setFilters({ ...filters, maxScore: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="100"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Individual CRIES Dimensions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Individual Dimensions (Minimum %)</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="minC" className="text-xs text-blue-400">C</Label>
                  <Input
                    id="minC"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minCompleteness ?? ''}
                    onChange={(e) => setFilters({ ...filters, minCompleteness: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minR" className="text-xs text-purple-400">R</Label>
                  <Input
                    id="minR"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minReliability ?? ''}
                    onChange={(e) => setFilters({ ...filters, minReliability: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minI" className="text-xs text-pink-400">I</Label>
                  <Input
                    id="minI"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minIntegrity ?? ''}
                    onChange={(e) => setFilters({ ...filters, minIntegrity: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minE" className="text-xs text-green-400">E</Label>
                  <Input
                    id="minE"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minEffectiveness ?? ''}
                    onChange={(e) => setFilters({ ...filters, minEffectiveness: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minS" className="text-xs text-orange-400">S</Label>
                  <Input
                    id="minS"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minSecurity ?? ''}
                    onChange={(e) => setFilters({ ...filters, minSecurity: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Model Type Selection */}
            <div className="space-y-3">
              <Label htmlFor="modelType" className="text-sm font-medium">Model Type</Label>
              <Select
                value={filters.modelType || 'All Models'}
                onValueChange={(value) => setFilters({ ...filters, modelType: value })}
              >
                <SelectTrigger id="modelType" className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  {modelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pass/Fail Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Test Status</Label>
              <div className="flex gap-2">
                <Button
                  variant={filters.status === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                  className="flex-1"
                >
                  All
                </Button>
                <Button
                  variant={filters.status === 'passed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, status: 'passed' })}
                  className="flex-1 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Passed
                </Button>
                <Button
                  variant={filters.status === 'failed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, status: 'failed' })}
                  className="flex-1 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Failed
                </Button>
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeCount > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-gray-400">Active Filters</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.dateFrom && (
                    <Badge variant="secondary" className="gap-1">
                      From: {new Date(filters.dateFrom).toLocaleDateString()}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, dateFrom: undefined })}
                      />
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="secondary" className="gap-1">
                      To: {new Date(filters.dateTo).toLocaleDateString()}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, dateTo: undefined })}
                      />
                    </Badge>
                  )}
                  {filters.minScore !== undefined && (
                    <Badge variant="secondary" className="gap-1">
                      Min Score: {filters.minScore}%
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, minScore: undefined })}
                      />
                    </Badge>
                  )}
                  {filters.maxScore !== undefined && (
                    <Badge variant="secondary" className="gap-1">
                      Max Score: {filters.maxScore}%
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, maxScore: undefined })}
                      />
                    </Badge>
                  )}
                  {filters.modelType && filters.modelType !== 'All Models' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.modelType}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, modelType: undefined })}
                      />
                    </Badge>
                  )}
                  {filters.status !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.status === 'passed' ? 'Passed Only' : 'Failed Only'}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, status: 'all' })}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
