/**
 * Helper functions for saving and retrieving test results
 * Used to build historical performance data
 */

export interface SaveTestResultParams {
  userId: number;
  modelName: string;
  modelProvider: string;
  prompt: string;
  response?: string;
  criesScore?: number;
  responseTime?: number;
  tokenCount?: number;
  cost?: number;
  status: 'completed' | 'failed' | 'pending';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Save a test result to the database for historical tracking
 * Call this whenever a test completes (success or failure)
 */
export async function saveTestResult(params: SaveTestResultParams): Promise<boolean> {
  try {
    const response = await fetch('/api/test-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to save test result:', error);
    return false;
  }
}

/**
 * Helper to save a successful test result
 */
export async function saveSuccessfulTest(
  userId: number,
  modelName: string,
  modelProvider: string,
  prompt: string,
  response: string,
  criesScore: number,
  responseTime: number,
  tokenCount?: number,
  cost?: number,
  metadata?: Record<string, any>
) {
  return saveTestResult({
    userId,
    modelName,
    modelProvider,
    prompt,
    response,
    criesScore,
    responseTime,
    tokenCount,
    cost,
    status: 'completed',
    metadata,
  });
}

/**
 * Helper to save a failed test result
 */
export async function saveFailedTest(
  userId: number,
  modelName: string,
  modelProvider: string,
  prompt: string,
  errorMessage: string,
  metadata?: Record<string, any>
) {
  return saveTestResult({
    userId,
    modelName,
    modelProvider,
    prompt,
    status: 'failed',
    errorMessage,
    metadata,
  });
}
