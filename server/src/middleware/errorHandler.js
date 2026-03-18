// ============================================================
// Lably — Global Error Handler Middleware
// Catches all errors thrown in routes and services.
// Returns a consistent JSON error shape — never leaks
// internal stack traces in production.
// ============================================================

import config from "../config/index.js";

/**
 * Enterprise error handler.
 * Must have 4 parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Log the full error for diagnostics
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);
  if (config.isDev) console.error(err.stack);

  // Determine status code
  const status =
    err.status ||
    err.statusCode ||
    (err.name === "ValidationError" ? 400 : 500);

  // Never expose internal error details in production
  const message = config.isDev
    ? err.message
    : status < 500
    ? err.message
    : "An unexpected error occurred. Please try again.";

  res.status(status).json({
    error: err.code || "server_error",
    message,
    ...(config.isDev && { stack: err.stack }),
  });
}

/**
 * createError — helper to throw HTTP errors with a status code.
 * Usage: throw createError(400, "bad_request", "Invalid file type.");
 */
export function createError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}
