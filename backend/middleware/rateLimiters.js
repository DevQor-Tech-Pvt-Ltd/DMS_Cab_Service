/**
 * DMS Cab ServicesE - Professional Rate Limiting Architecture
 * 
 * WHY ROUTE-SPECIFIC LIMITERS EXIST:
 * - Traditional global rate limiting blocks essential low-bandwidth real-time traffic (like driver GPS polling)
 *   while leaving highly sensitive endpoints (like login/register) vulnerable to dictionary or brute-force attacks.
 * - Route-specific limiters apply granular control, aligning request ceilings with actual client operations.
 * 
 * SECURITY BENEFITS:
 * - Mitigation of Brute-Force & Credential Stuffing: Tight windows on Login/OTP block high-volume automated attacks.
 * - Resource Exhaustion & DoS Prevention: Preventing clients from spamming resource-heavy operations like database transactions (booking rides).
 * - IP Spoofing Prevention: Combines standard headers with express trust proxy configuration to ensure rate limits are bound to true client IPs.
 * 
 * SCALABILITY & REDIS CONSIDERATIONS:
 * - This architecture is memory-store by default but fully modularized.
 * - To transition to distributed caching (Redis) for microservices or auto-scaling environments:
 *   1. Install 'rate-limit-redis' and 'ioredis' (or 'redis')
 *   2. Inject a new 'store' property into the base options template (as highlighted below)
 *   No changes to route files or endpoint controllers will be required!
 */

const rateLimit = require('express-rate-limit');

/**
 * Reusable Rate Limiter Factory function
 * @param {Object} options Configuration options for rate limiting
 * @param {number} options.windowMs Time window in milliseconds
 * @param {number} options.maxProd Request limit in Production environments
 * @param {number} options.maxDev Request limit in Development/testing environments
 * @param {string} options.message Custom error warning returned to the user
 * @param {string} options.apiName Identifier used for security console logging
 */
const createLimiter = ({ windowMs, maxProd, maxDev, message, apiName }) => {
  const isDev = process.env.NODE_ENV === 'development';
  const limit = isDev ? maxDev : maxProd;

  return rateLimit({
    windowMs,
    max: limit,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the old `X-RateLimit-*` headers to follow standards

    // Standardized JSON response formatting
    handler: (req, res, next, options) => {
      // Professional logging for audit trails and security analytics
      const logger = require('../utils/logger');
      logger.warn(
        `[SECURITY WARNING] [RATE_LIMIT_EXCEEDED] API: ${apiName} | IP: ${req.ip} | Method: ${req.method} | Path: ${req.originalUrl}`
      );

      res.status(options.statusCode || 429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
        error: 'Too Many Requests'
      });
    },

    // ==========================================
    // FUTURE REDIS INTEGRATION READY TEMPLATE:
    // ==========================================
    // To migrate to Redis for multi-node deployments, uncomment and populate:
    // 
    // store: new RedisStore({
    //   sendCommand: (...args) => redisClient.call(...args),
    // }),
  });
};

// ----------------------------------------------------
// ROUTE-SPECIFIC LIMITER INSTANCES
// ----------------------------------------------------

/**
 * A) Login Route Limiter
 * Protects auth/login against credential-stuffing and brute-force bot sweeps.
 */
const loginLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 Minutes
  maxProd: 10,              // Strict limit for protection
  maxDev: 1000,
  message: 'Too many login attempts. Please try again later.',
  apiName: 'AUTH_LOGIN'
});

/**
 * B) Signup Route Limiter
 * Heavy throttling to prevent automated bot account registration.
 */
const signupLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 Hour
  maxProd: 5,               // Highly strict limit
  maxDev: 1000,
  message: 'Too many signup attempts from this address. Please try again in an hour.',
  apiName: 'AUTH_REGISTER'
});

/**
 * C) Ride Booking Route Limiter
 * Prevents double-booking spikes and server overload during peak ride booking hours.
 */
const rideBookingLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 Minute
  maxProd: 30,         // Clean threshold for clients
  maxDev: 1000,
  message: 'Too many ride booking attempts. Please wait a moment before trying again.',
  apiName: 'RIDE_BOOKING'
});

/**
 * D) Driver Live Location Update Limiter
 * High request frequency allowed for real-time tracking while preventing infinite loop overloads.
 */
const driverLocationLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 Minute
  maxProd: 120,        // High ceiling for rapid polling
  maxDev: 5000,
  message: 'Location transmission limits exceeded. Rate capped to prevent socket saturation.',
  apiName: 'DRIVER_LOCATION'
});

/**
 * E) OTP Verification Limiter
 * Prevents brute-forcing short OTP codes.
 */
const otpVerificationLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 Minutes
  maxProd: 5,
  maxDev: 1000,
  message: 'Too many verification attempts. Please request a new OTP code.',
  apiName: 'AUTH_OTP'
});

/**
 * F) Payment APIs Limiter
 * Guards checkout gates from automated cards-testing/carding fraud.
 */
const paymentLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 Minute
  maxProd: 20,
  maxDev: 1000,
  message: 'Too many payment transaction attempts. Please wait before retrying.',
  apiName: 'PAYMENT_API'
});

/**
 * G) Contact Inquiry Limiter
 * Prevents SMTP spam abuse on the unauthenticated public contact form.
 */
const contactInquiryLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  maxProd: 3,                // Very strict — public, unauthenticated endpoint
  maxDev: 1000,
  message: 'Too many contact inquiries. Please try again later.',
  apiName: 'CONTACT_INQUIRY'
});

module.exports = {
  loginLimiter,
  signupLimiter,
  rideBookingLimiter,
  driverLocationLimiter,
  otpVerificationLimiter,
  paymentLimiter,
  contactInquiryLimiter
};
