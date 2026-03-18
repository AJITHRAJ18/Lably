// ============================================================
// Lably — Rate Limiter Middleware
// Uses express-rate-limit to protect expensive endpoints.
// ============================================================

import rateLimit from "express-rate-limit";

/**
 * translateLimiter — 10 translation requests per hour per IP.
 * Prevents AI cost abuse from a single source.
 */
export const translateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "rate_limit_exceeded",
    message:
      "You have exceeded the translation limit. Please wait before trying again.",
  },
});

/**
 * checkoutLimiter — 20 checkout requests per hour per IP.
 * Prevents checkout session spam.
 */
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "rate_limit_exceeded",
    message: "Too many checkout attempts. Please try again later.",
  },
});

/**
 * globalLimiter — 200 requests per 15 minutes per IP.
 * A blanket protection for all routes.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "rate_limit_exceeded",
    message: "Too many requests. Please slow down.",
  },
});
