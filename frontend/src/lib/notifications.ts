/**
 * Email notification helper utilities
 * Integrates with Resend API to send notifications
 */

export type NotificationType =
  | 'test-complete'
  | 'batch-complete'
  | 'score-alert'
  | 'witness-failure'
  | 'scheduled-report';

export interface EmailData {
  to: string;
  subject: string;
  type: NotificationType;
  data: Record<string, any>;
}

/**
 * Send an email notification
 */
export async function sendNotification(emailData: EmailData): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

/**
 * Send test completion notification
 */
export async function notifyTestComplete(
  email: string,
  model: string,
  criesScore: number,
  duration: string,
  prompt?: string
) {
  return sendNotification({
    to: email,
    subject: `Test Complete: ${model}`,
    type: 'test-complete',
    data: { model, criesScore, duration, prompt },
  });
}

/**
 * Send batch test completion notification
 */
export async function notifyBatchComplete(
  email: string,
  results: any[],
  avgScore: number
) {
  const passed = results.filter((r) => r.status === 'completed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  
  return sendNotification({
    to: email,
    subject: `Batch Test Complete: ${passed}/${results.length} Passed`,
    type: 'batch-complete',
    data: { results, avgScore, passed, failed },
  });
}

/**
 * Send score alert notification
 */
export async function notifyScoreAlert(
  email: string,
  model: string,
  score: number,
  threshold: number,
  alertType: 'low-score' | 'score-drop',
  previousScore?: number
) {
  return sendNotification({
    to: email,
    subject: `Performance Alert: ${model} Score ${alertType === 'low-score' ? 'Below' : 'Dropped'}`,
    type: 'score-alert',
    data: { model, score, threshold, alertType, previousScore },
  });
}

/**
 * Send witness failure notification
 */
export async function notifyWitnessFailure(
  email: string,
  testId: string,
  witnessCount: number,
  totalWitnesses: number,
  reason: string
) {
  return sendNotification({
    to: email,
    subject: `Witness Consensus Failure: Test ${testId}`,
    type: 'witness-failure',
    data: { testId, witnessCount, totalWitnesses, reason },
  });
}

/**
 * Send scheduled report
 */
export async function sendScheduledReport(
  email: string,
  period: 'Daily' | 'Weekly' | 'Monthly',
  dateRange: string,
  stats: {
    totalTests: number;
    avgScore: number;
    modelsUsed: number;
    trend: number;
    topModels?: { name: string; score: number }[];
  }
) {
  return sendNotification({
    to: email,
    subject: `${period} Report: ${dateRange}`,
    type: 'scheduled-report',
    data: { period, dateRange, ...stats },
  });
}
