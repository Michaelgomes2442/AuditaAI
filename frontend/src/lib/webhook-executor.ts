import { PrismaClient } from '@/generated/prisma';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface WebhookExecutionResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

/**
 * Execute a webhook with retry logic
 */
export async function executeWebhook(
  webhook: any,
  event: string,
  payload: any
): Promise<WebhookExecutionResult> {
  const startTime = Date.now();
  let attempt = 1;
  let lastError: string | undefined;

  // Merge custom payload template with data
  const finalPayload = webhook.payloadTemplate
    ? mergePayloadTemplate(webhook.payloadTemplate, payload)
    : payload;

  while (attempt <= (webhook.retryEnabled ? webhook.maxRetries : 1)) {
    try {
      const result = await sendWebhookRequest(webhook, finalPayload, attempt);
      
      // Log successful delivery
      await logWebhookDelivery(webhook.id, event, finalPayload, result, attempt);

      // Update webhook stats
      await updateWebhookStats(webhook.id, true);

      return result;
    } catch (error: any) {
      lastError = error.message || 'Unknown error';

      // Log failed delivery
      await logWebhookDelivery(
        webhook.id,
        event,
        finalPayload,
        {
          success: false,
          error: lastError,
          responseTime: Date.now() - startTime,
        },
        attempt
      );

      // If retries enabled and we haven't reached max, wait and retry
      if (webhook.retryEnabled && attempt < webhook.maxRetries) {
        const delay = webhook.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await sleep(delay);
        attempt++;
      } else {
        // Update webhook stats for failure
        await updateWebhookStats(webhook.id, false, lastError);
        return {
          success: false,
          error: lastError,
          responseTime: Date.now() - startTime,
        };
      }
    }
  }

  // Should not reach here, but just in case
  return {
    success: false,
    error: lastError || 'Max retries exceeded',
  };
}

/**
 * Send the actual HTTP request to the webhook URL
 */
async function sendWebhookRequest(
  webhook: any,
  payload: any,
  attempt: number
): Promise<WebhookExecutionResult> {
  const startTime = Date.now();

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'AuditaAI-Webhook/1.0',
    'X-Webhook-ID': webhook.id.toString(),
    'X-Webhook-Attempt': attempt.toString(),
    ...(webhook.headers || {}),
  };

  // Add HMAC signature if secret is configured
  if (webhook.secret) {
    const signature = generateHmacSignature(payload, webhook.secret);
    headers['X-Webhook-Signature'] = signature;
  }

  const response = await fetch(webhook.url, {
    method: webhook.method,
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  const responseTime = Date.now() - startTime;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return {
    success: true,
    statusCode: response.status,
    responseTime,
  };
}

/**
 * Log webhook delivery attempt
 */
async function logWebhookDelivery(
  webhookId: number,
  event: string,
  payload: any,
  result: Partial<WebhookExecutionResult>,
  attempt: number
) {
  try {
    await prisma.webhookLog.create({
      data: {
        webhookId,
        event,
        payload,
        url: '', // Will be filled from webhook
        method: 'POST',
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        attempt,
        success: result.success || false,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Failed to log webhook delivery:', error);
  }
}

/**
 * Update webhook statistics
 */
async function updateWebhookStats(
  webhookId: number,
  success: boolean,
  error?: string
) {
  try {
    const now = new Date();
    
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        totalCalls: { increment: 1 },
        ...(success
          ? {
              successCount: { increment: 1 },
              lastSuccess: now,
              lastTriggered: now,
            }
          : {
              failureCount: { increment: 1 },
              lastFailure: now,
              lastTriggered: now,
              lastError: error,
            }),
      },
    });
  } catch (err) {
    console.error('Failed to update webhook stats:', err);
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateHmacSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Merge custom payload template with actual data
 * Supports simple {{variable}} syntax
 */
function mergePayloadTemplate(template: any, data: any): any {
  const templateStr = JSON.stringify(template);
  const mergedStr = templateStr.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? JSON.stringify(data[key]) : match;
  });
  return JSON.parse(mergedStr);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(
  userId: number,
  event: string,
  payload: any
): Promise<void> {
  try {
    // Find all active webhooks for this user that listen to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: {
          has: event,
        },
      },
    });

    // Execute all matching webhooks in parallel (fire and forget)
    const promises = webhooks.map(webhook =>
      executeWebhook(webhook, event, payload).catch(error => {
        console.error(`Webhook ${webhook.id} execution failed:`, error);
      })
    );

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Failed to trigger webhooks:', error);
  }
}
