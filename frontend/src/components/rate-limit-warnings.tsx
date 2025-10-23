'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RateLimitWarning {
  provider: string;
  limitType: string;
  percentage: number;
  current: number;
  max: number;
  resetAt: string;
}

export function RateLimitWarnings() {
  const [warnings, setWarnings] = useState<RateLimitWarning[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWarnings();
    const interval = setInterval(fetchWarnings, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchWarnings = async () => {
    try {
      const response = await fetch('/api/rate-limits/warnings');
      if (!response.ok) return;
      const data = await response.json();
      setWarnings(data.warnings || []);
    } catch (error) {
      console.error('Error fetching rate limit warnings:', error);
    }
  };

  const getWarningKey = (warning: RateLimitWarning) => 
    `${warning.provider}-${warning.limitType}-${new Date(warning.resetAt).getTime()}`;

  const dismissWarning = (warning: RateLimitWarning) => {
    const key = getWarningKey(warning);
    setDismissed(prev => new Set([...prev, key]));
  };

  const activeWarnings = warnings.filter(w => !dismissed.has(getWarningKey(w)));

  if (activeWarnings.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {activeWarnings.map((warning, index) => (
        <Alert
          key={getWarningKey(warning)}
          variant={warning.percentage >= 100 ? 'destructive' : 'default'}
          className="pr-12 shadow-lg border-2"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {warning.percentage >= 100 ? 'Rate Limit Exceeded' : 'Approaching Rate Limit'}
          </AlertTitle>
          <AlertDescription className="text-sm">
            <p className="mb-2">
              {warning.provider.charAt(0).toUpperCase() + warning.provider.slice(1)} {warning.limitType}:{' '}
              <span className="font-medium">
                {warning.current.toLocaleString()} / {warning.max.toLocaleString()}
              </span>{' '}
              ({warning.percentage.toFixed(1)}%)
            </p>
            <div className="flex gap-2">
              <Link href="/rate-limits">
                <Button variant="outline" size="sm">
                  Manage Limits
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissWarning(warning)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => dismissWarning(warning)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
