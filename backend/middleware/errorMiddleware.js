const logger = require('../utils/logger');
const Sentry = require("@sentry/node");

/**
 * Standardized Global Error Responder Middleware (Phase 8 & 9)
 * Ensures consistent output format: { success: false, message: "...", errorCode: "..." }
 * and strips out call stack traces in production environments.
 */
module.exports = (err, req, res, next) => {
  // Determine status code and errorCode
  const status = err.status || err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // Capture unhandled server exceptions (500+) in Sentry
  if (status >= 500 && process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // Log error using Winston logger
  logger.error(
    `[API Error] status=${status} code=${errorCode} message="${err.message}" url=${req.originalUrl} ip=${req.ip} stack=${err.stack || '(no stack)'}`
  );

  // Strip error message details for sensitive 5xx errors in production
  let message = err.message;
  if (status >= 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected server error occurred. Please contact support.';
  }

  return res.status(status).json({
    success: false,
    message,
    errorCode,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
