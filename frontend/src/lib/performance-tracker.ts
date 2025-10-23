/**
 * Performance Tracking Utility
 * 
 * Tracks API response times, CRIES calculation durations, and witness consensus latency.
 * Sends metrics to /api/performance endpoint for aggregation and monitoring.
 */

export interface PerformanceTiming {
  apiResponseTime?: number;
  criesCalculationTime?: number;
  witnessLatency?: number;
  operation: string;
}

export class PerformanceTracker {
  private startTime: number;
  private checkpoints: Map<string, number>;

  constructor() {
    this.startTime = performance.now();
    this.checkpoints = new Map();
  }

  /**
   * Mark a checkpoint in the operation timeline
   */
  checkpoint(name: string): void {
    this.checkpoints.set(name, performance.now());
  }

  /**
   * Get elapsed time since start or since a specific checkpoint
   */
  elapsed(since?: string): number {
    const now = performance.now();
    if (since && this.checkpoints.has(since)) {
      return now - this.checkpoints.get(since)!;
    }
    return now - this.startTime;
  }

  /**
   * Complete tracking and send metrics to backend
   */
  async complete(timing: PerformanceTiming): Promise<void> {
    try {
      // Send to performance tracking endpoint
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timing),
      });
    } catch (error) {
      // Silently fail - don't disrupt user operations for tracking
      console.warn('Failed to record performance metrics:', error);
    }
  }
}

/**
 * Track API call performance
 */
export async function trackAPICall<T>(
  operation: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const tracker = new PerformanceTracker();
  
  try {
    const result = await apiCall();
    const apiResponseTime = tracker.elapsed();
    
    await tracker.complete({
      apiResponseTime: Math.round(apiResponseTime),
      operation,
    });
    
    return result;
  } catch (error) {
    // Still record timing even on errors
    const apiResponseTime = tracker.elapsed();
    await tracker.complete({
      apiResponseTime: Math.round(apiResponseTime),
      operation: `${operation}_error`,
    });
    throw error;
  }
}

/**
 * Track CRIES calculation performance
 */
export async function trackCRIESCalculation<T>(
  operation: string,
  calculation: () => Promise<T>
): Promise<T> {
  const tracker = new PerformanceTracker();
  
  try {
    const result = await calculation();
    const criesCalculationTime = tracker.elapsed();
    
    await tracker.complete({
      criesCalculationTime: Math.round(criesCalculationTime),
      operation,
    });
    
    return result;
  } catch (error) {
    const criesCalculationTime = tracker.elapsed();
    await tracker.complete({
      criesCalculationTime: Math.round(criesCalculationTime),
      operation: `${operation}_error`,
    });
    throw error;
  }
}

/**
 * Track witness consensus performance
 */
export async function trackWitnessConsensus<T>(
  operation: string,
  consensus: () => Promise<T>
): Promise<T> {
  const tracker = new PerformanceTracker();
  
  try {
    const result = await consensus();
    const witnessLatency = tracker.elapsed();
    
    await tracker.complete({
      witnessLatency: Math.round(witnessLatency),
      operation,
    });
    
    return result;
  } catch (error) {
    const witnessLatency = tracker.elapsed();
    await tracker.complete({
      witnessLatency: Math.round(witnessLatency),
      operation: `${operation}_error`,
    });
    throw error;
  }
}

/**
 * Track full audit operation (API + CRIES + Witness)
 */
export async function trackFullAudit(
  operation: string,
  stages: {
    api: () => Promise<any>;
    cries: () => Promise<any>;
    witness: () => Promise<any>;
  }
): Promise<{ api: any; cries: any; witness: any }> {
  const tracker = new PerformanceTracker();
  
  // Execute stages sequentially
  tracker.checkpoint('api_start');
  const apiResult = await stages.api();
  const apiTime = tracker.elapsed('api_start');
  
  tracker.checkpoint('cries_start');
  const criesResult = await stages.cries();
  const criesTime = tracker.elapsed('cries_start');
  
  tracker.checkpoint('witness_start');
  const witnessResult = await stages.witness();
  const witnessTime = tracker.elapsed('witness_start');
  
  await tracker.complete({
    apiResponseTime: Math.round(apiTime),
    criesCalculationTime: Math.round(criesTime),
    witnessLatency: Math.round(witnessTime),
    operation,
  });
  
  return {
    api: apiResult,
    cries: criesResult,
    witness: witnessResult,
  };
}

/**
 * Example usage:
 * 
 * // Track simple API call
 * const data = await trackAPICall('fetch_models', () => 
 *   fetch('/api/models').then(r => r.json())
 * );
 * 
 * // Track CRIES calculation
 * const score = await trackCRIESCalculation('calculate_score', () =>
 *   calculateCRIESScore(modelOutput)
 * );
 * 
 * // Track witness consensus
 * const consensus = await trackWitnessConsensus('verify_consensus', () =>
 *   witnessConsensusCheck(results)
 * );
 * 
 * // Track full audit pipeline
 * const results = await trackFullAudit('full_audit_gpt4', {
 *   api: () => callLLMAPI('gpt-4', prompt),
 *   cries: () => analyzeCRIES(response),
 *   witness: () => verifyWithWitnesses(response),
 * });
 */
