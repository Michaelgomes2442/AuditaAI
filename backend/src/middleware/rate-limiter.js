/**
 * Rate Limiting Middleware for AuditaAI
 * 
 * Protects expensive endpoints from abuse while maintaining
 * good user experience for legitimate usage.
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Default rate limit for general API endpoints
export const defaultRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per minute
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: ipKeyGenerator // Use IPv6-compatible key generator
});

// Strict rate limit for expensive LLM operations
export const llmRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // 10 LLM calls per minute
  message: {
    error: 'llm_rate_limit_exceeded',
    message: 'Too many LLM requests. Please wait before making more calls.',
    retryAfter: 60,
    hint: 'This endpoint makes expensive API calls. Consider batching your requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // If authenticated, use userId, otherwise use IPv6-compatible IP
    const userId = req.user?.id || req.session?.userId;
    if (userId) {
      return `user-${userId}`;
    }
    return ipKeyGenerator(req);
  },
  // Skip rate limiting for admins
  skip: (req) => {
    return req.user?.role === 'ADMIN' || req.user?.role === 'ARCHITECT';
  }
});

// Very strict rate limit for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'auth_rate_limit_exceeded',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email + IPv6-compatible IP for auth endpoints
    const identifier = req.body?.email || req.body?.username;
    if (identifier) {
      return `auth-${identifier}`;
    }
    return `auth-${ipKeyGenerator(req)}`;
  },
  // Increase delay with each failed attempt
  handler: (req, res) => {
    res.status(429).json({
      error: 'auth_rate_limit_exceeded',
      message: 'Too many login attempts. Your account may be locked. Please try again in 15 minutes or contact support.',
      retryAfter: 900
    });
  }
});

// Lenient rate limit for read-only endpoints
export const readOnlyRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 200, // 200 requests per minute
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests, please slow down.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator // Use IPv6-compatible key generator
});

// Export configuration for testing/monitoring
export const rateLimitConfig = {
  default: { windowMs: 60000, max: 100 },
  llm: { windowMs: 60000, max: 10 },
  auth: { windowMs: 900000, max: 5 },
  readOnly: { windowMs: 60000, max: 200 }
};

export default {
  defaultRateLimiter,
  llmRateLimiter,
  authRateLimiter,
  readOnlyRateLimiter,
  rateLimitConfig
};
