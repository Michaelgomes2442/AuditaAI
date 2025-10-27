import { NextRequest, NextResponse } from 'next/server';

// Mock performance data tracking
// In production, this would integrate with actual timing middleware and database
interface PerformanceEntry {
  timestamp: string;
  apiResponseTime: number;
  criesCalculationTime: number;
  witnessLatency: number;
  operation: string;
}

// In-memory storage (would be database in production)
const performanceHistory: PerformanceEntry[] = [];
const MAX_HISTORY = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const operation = searchParams.get('operation');

  let filtered = performanceHistory;
  
  if (operation) {
    filtered = performanceHistory.filter(entry => entry.operation === operation);
  }

  // Return most recent entries
  const recent = filtered.slice(-limit);

  // Calculate aggregates
  const calculateStats = (arr: number[]) => {
    if (arr.length === 0) return { avg: 0, p50: 0, p95: 0, p99: 0 };
    
    const sorted = [...arr].sort((a, b) => a - b);
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    return { avg, p50, p95, p99 };
  };

  const apiTimes = filtered.map(e => e.apiResponseTime);
  const criesTimes = filtered.map(e => e.criesCalculationTime);
  const witnessTimes = filtered.map(e => e.witnessLatency);

  return NextResponse.json({
    data: recent,
    stats: {
      api: calculateStats(apiTimes),
      cries: calculateStats(criesTimes),
      witness: calculateStats(witnessTimes),
    },
    count: filtered.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const entry: PerformanceEntry = {
      timestamp: new Date().toISOString(),
      apiResponseTime: body.apiResponseTime || 0,
      criesCalculationTime: body.criesCalculationTime || 0,
      witnessLatency: body.witnessLatency || 0,
      operation: body.operation || 'unknown',
    };

    performanceHistory.push(entry);

    // Keep only recent history
    if (performanceHistory.length > MAX_HISTORY) {
      performanceHistory.shift();
    }

    return NextResponse.json({
      success: true,
      entry,
      totalEntries: performanceHistory.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
