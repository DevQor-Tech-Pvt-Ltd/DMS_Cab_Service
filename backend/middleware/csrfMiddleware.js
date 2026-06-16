const { isOriginAllowed } = require('../utils/corsOriginValidator');
const logger = require('../utils/logger');

/**
 * Custom CSRF Protection Middleware
 * Checks Origin and Referer headers against the CORS allowed origins list
 * on state-changing requests (POST, PUT, PATCH, DELETE).
 */
module.exports = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Validate Origin header
    if (origin) {
      if (!isOriginAllowed(origin)) {
        logger.warn(`[CSRF BLOCKED] Rejected request from unauthorized origin: ${origin} | Path: ${req.originalUrl}`);
        return res.status(403).json({
          success: false,
          message: 'CSRF validation failed: Origin not allowed.'
        });
      }
    } else if (referer) {
      // Fallback to Referer header if Origin is missing
      try {
        const refererUrl = new URL(referer);
        if (!isOriginAllowed(refererUrl.origin)) {
          logger.warn(`[CSRF BLOCKED] Rejected request from unauthorized referer: ${refererUrl.origin} | Path: ${req.originalUrl}`);
          return res.status(403).json({
            success: false,
            message: 'CSRF validation failed: Referer not allowed.'
          });
        }
      } catch (err) {
        logger.warn(`[CSRF BLOCKED] Invalid referer header format: ${referer} | Path: ${req.originalUrl}`);
        return res.status(403).json({
          success: false,
          message: 'CSRF validation failed: Invalid Referer.'
        });
      }
    } else {
      // Require at least one of the headers in production
      if (process.env.NODE_ENV === 'production') {
        logger.warn(`[CSRF BLOCKED] Missing both Origin and Referer headers for state-changing request | Path: ${req.originalUrl}`);
        return res.status(403).json({
          success: false,
          message: 'CSRF validation failed: Missing origin/referer headers.'
        });
      }
    }
  }
  next();
};
