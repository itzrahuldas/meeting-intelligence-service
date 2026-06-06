import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 * Applied to every route to protect against DoS / brute-force.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP. Please try again in 15 minutes.',
    },
  },
  skip: (req) => req.path === '/health', // Never throttle health checks
});

/**
 * Stricter limiter for auth endpoints — 10 attempts per 15 minutes per IP.
 * Prevents brute-force attacks on login/register.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
});

/**
 * AI analysis limiter — 20 analyses per hour per IP.
 * Each call hits the Gemini API which has its own quotas.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'AI analysis quota exceeded. Please try again in 1 hour.',
    },
  },
});
