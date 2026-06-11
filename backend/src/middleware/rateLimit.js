import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for mutation endpoints (POST, PUT, PATCH, DELETE).
 * 100 requests per 15-minute window.
 */
export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 429,
  },
});

/**
 * Stricter limiter for auth routes.
 * 20 requests per 15-minute window.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many auth attempts, please try again later.',
    code: 429,
  },
});
