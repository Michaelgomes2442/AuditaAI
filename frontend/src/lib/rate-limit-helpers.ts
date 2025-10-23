import { prisma } from '@/lib/prismadb';

interface RateLimitCheck {
  allowed: boolean;
  limit?: {
    current: number;
    max: number;
    resetAt: Date;
  };
  warning?: string;
}

/**
 * Check and increment rate limit for a user's API usage
 */
export async function checkAndIncrementRateLimit(
  userId: number,
  provider: string,
  limitType: 'requests' | 'tokens',
  amount: number = 1
): Promise<RateLimitCheck> {
  try {
    // Find all applicable rate limits
    const rateLimits = await prisma.apiRateLimit.findMany({
      where: {
        userId,
        provider,
        limitType,
      },
    });

    if (rateLimits.length === 0) {
      // No rate limits configured, allow request
      return { allowed: true };
    }

    // Check each rate limit
    for (const rateLimit of rateLimits) {
      const now = new Date();
      
      // Reset if expired
      if (new Date(rateLimit.resetAt) <= now) {
        const resetAt = getNextResetTime(rateLimit.limitPeriod);
        await prisma.apiRateLimit.update({
          where: { id: rateLimit.id },
          data: {
            currentUsage: 0,
            resetAt,
            lastWarningAt: null,
          },
        });
        rateLimit.currentUsage = 0;
      }

      // Check if limit would be exceeded
      if (rateLimit.currentUsage + amount > rateLimit.maxLimit) {
        return {
          allowed: false,
          limit: {
            current: rateLimit.currentUsage,
            max: rateLimit.maxLimit,
            resetAt: new Date(rateLimit.resetAt),
          },
        };
      }

      // Increment usage
      const updated = await prisma.apiRateLimit.update({
        where: { id: rateLimit.id },
        data: {
          currentUsage: {
            increment: amount,
          },
        },
      });

      // Check if warning threshold exceeded
      const usagePercentage = ((updated.currentUsage / updated.maxLimit) * 100);
      let warning: string | undefined;

      if (usagePercentage >= updated.warningThreshold) {
        warning = `You've used ${usagePercentage.toFixed(1)}% of your ${updated.limitPeriod}ly ${updated.limitType} quota for ${provider}`;
        
        // Update last warning time
        await prisma.apiRateLimit.update({
          where: { id: rateLimit.id },
          data: { lastWarningAt: new Date() },
        });
      }

      return {
        allowed: true,
        limit: {
          current: updated.currentUsage,
          max: updated.maxLimit,
          resetAt: new Date(updated.resetAt),
        },
        warning,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request but log the issue
    return { allowed: true };
  }
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(
  userId: number,
  provider?: string
) {
  try {
    const where = provider
      ? { userId, provider }
      : { userId };

    const rateLimits = await prisma.apiRateLimit.findMany({
      where,
      orderBy: [
        { provider: 'asc' },
        { limitType: 'asc' },
      ],
    });

    return rateLimits.map(rl => ({
      id: rl.id,
      provider: rl.provider,
      limitType: rl.limitType,
      limitPeriod: rl.limitPeriod,
      current: rl.currentUsage,
      max: rl.maxLimit,
      percentage: (rl.currentUsage / rl.maxLimit) * 100,
      resetAt: rl.resetAt,
      isWarning: (rl.currentUsage / rl.maxLimit) * 100 >= rl.warningThreshold,
      isCritical: rl.currentUsage >= rl.maxLimit,
    }));
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return [];
  }
}

/**
 * Reset all expired rate limits for a user
 */
export async function resetExpiredRateLimits(userId: number) {
  try {
    const now = new Date();
    
    const expiredLimits = await prisma.apiRateLimit.findMany({
      where: {
        userId,
        resetAt: {
          lte: now,
        },
      },
    });

    const updates = expiredLimits.map(rl => {
      const resetAt = getNextResetTime(rl.limitPeriod);
      return prisma.apiRateLimit.update({
        where: { id: rl.id },
        data: {
          currentUsage: 0,
          resetAt,
          lastWarningAt: null,
        },
      });
    });

    await Promise.all(updates);
    return expiredLimits.length;
  } catch (error) {
    console.error('Error resetting expired rate limits:', error);
    return 0;
  }
}

// Helper function to calculate next reset time
function getNextResetTime(period: string): Date {
  const now = new Date();
  
  switch (period) {
    case 'minute':
      return new Date(now.getTime() + 60 * 1000);
    case 'hour':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'month':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour
  }
}
