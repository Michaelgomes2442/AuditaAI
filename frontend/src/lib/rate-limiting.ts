import { PrismaClient } from '@/generated/prisma';
import type { UserTier } from '@/generated/prisma';

const prisma = new PrismaClient();

// Tier-based rate limits (requests per hour)
export const TIER_LIMITS = {
  FREE: {
    openai: 10,
    anthropic: 10,
    google: 10,
    default: 10
  },
  PAID: {
    openai: 100,
    anthropic: 100,
    google: 100,
    default: 100
  },
  ARCHITECT: {
    openai: 1000,
    anthropic: 1000,
    google: 1000,
    default: 1000
  }
} as const;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until reset
}

/**
 * Check if a user can make an API request
 */
export async function checkRateLimit(
  userId: number,
  userTier: UserTier,
  provider: string,
  endpoint: string = 'chat'
): Promise<RateLimitResult> {
  const now = new Date();
  
  // Get or create quota record
  let quota = await prisma.rateLimitQuota.findUnique({
    where: {
      userId_provider_endpoint: {
        userId,
        provider,
        endpoint
      }
    }
  });

  // Determine the limit for this tier
  const limit = TIER_LIMITS[userTier]?.[provider as keyof typeof TIER_LIMITS.FREE] 
    || TIER_LIMITS[userTier]?.default 
    || TIER_LIMITS.FREE.default;

  // Create new quota if doesn't exist
  if (!quota) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    quota = await prisma.rateLimitQuota.create({
      data: {
        userId,
        provider,
        endpoint,
        limit,
        used: 0,
        resetAt,
        windowMinutes: 60
      }
    });
  }

  // Reset quota if window has expired
  if (quota.resetAt <= now) {
    const resetAt = new Date(now.getTime() + quota.windowMinutes * 60 * 1000);
    quota = await prisma.rateLimitQuota.update({
      where: { id: quota.id },
      data: {
        used: 0,
        resetAt,
        limit // Update limit in case tier changed
      }
    });
  }

  const remaining = Math.max(0, quota.limit - quota.used);
  const allowed = quota.used < quota.limit;
  const retryAfter = allowed ? undefined : Math.ceil((quota.resetAt.getTime() - now.getTime()) / 1000);

  return {
    allowed,
    limit: quota.limit,
    used: quota.used,
    remaining,
    resetAt: quota.resetAt,
    retryAfter
  };
}

/**
 * Track an API call (increment the counter)
 */
export async function trackApiCall(
  userId: number,
  userTier: UserTier,
  provider: string,
  endpoint: string = 'chat'
): Promise<void> {
  const now = new Date();
  
  // Get or create quota record
  let quota = await prisma.rateLimitQuota.findUnique({
    where: {
      userId_provider_endpoint: {
        userId,
        provider,
        endpoint
      }
    }
  });

  const limit = TIER_LIMITS[userTier]?.[provider as keyof typeof TIER_LIMITS.FREE] 
    || TIER_LIMITS[userTier]?.default 
    || TIER_LIMITS.FREE.default;

  if (!quota) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000);
    await prisma.rateLimitQuota.create({
      data: {
        userId,
        provider,
        endpoint,
        limit,
        used: 1,
        resetAt,
        windowMinutes: 60
      }
    });
    return;
  }

  // Reset if window expired
  if (quota.resetAt <= now) {
    const resetAt = new Date(now.getTime() + quota.windowMinutes * 60 * 1000);
    await prisma.rateLimitQuota.update({
      where: { id: quota.id },
      data: {
        used: 1,
        resetAt,
        limit
      }
    });
    return;
  }

  // Increment counter
  await prisma.rateLimitQuota.update({
    where: { id: quota.id },
    data: {
      used: { increment: 1 }
    }
  });
}

/**
 * Get all rate limit quotas for a user
 */
export async function getUserQuotas(userId: number) {
  return prisma.rateLimitQuota.findMany({
    where: { userId },
    orderBy: { provider: 'asc' }
  });
}

/**
 * Reset a specific quota (admin only)
 */
export async function resetQuota(
  userId: number,
  provider: string,
  endpoint: string = 'chat'
): Promise<void> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + 60 * 60 * 1000);
  
  await prisma.rateLimitQuota.updateMany({
    where: {
      userId,
      provider,
      endpoint
    },
    data: {
      used: 0,
      resetAt
    }
  });
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Get warning level based on usage percentage
 */
export function getWarningLevel(percentage: number): 'safe' | 'warning' | 'danger' | 'exceeded' {
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 90) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'safe';
}
