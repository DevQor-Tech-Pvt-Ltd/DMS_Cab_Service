/**
 * Shared CORS origin validation for DMS Cab Service.
 *
 * Used by both Express CORS middleware (app.js) and Socket.IO CORS (server.js)
 * to ensure consistent origin allow-listing without code duplication.
 */

// Cache the allowed origins list to prevent repeating splits and mapping on every request check
let cachedAllowedOrigins = null;

/**
 * Build and cache the list of allowed origins from environment config.
 * @returns {string[]}
 */
const getAllowedOrigins = () => {
  if (cachedAllowedOrigins) {
    return cachedAllowedOrigins;
  }

  const list = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
    : ['http://localhost:5173', 'http://localhost:4173'];

  // Add the known production deployment origin
  if (!list.includes('https://dms-cab-service.vercel.app')) {
    list.push('https://dms-cab-service.vercel.app');
  }

  cachedAllowedOrigins = list;
  return list;
};

/**
 * Check whether a request origin is allowed.
 * Matches against:
 *  - Exact entries in the CLIENT_URL env var
 *  - Any localhost origin (for development)
 *
 * @param {string|undefined} origin
 * @returns {boolean}
 */
const isOriginAllowed = (origin) => {
  // Allow requests with no origin (mobile apps, curl, server-to-server)
  if (!origin) return true;

  const allowedOrigins = getAllowedOrigins();

  // Exact match against allow-list
  if (allowedOrigins.includes(origin)) return true;

  // Allow any localhost origin for development convenience
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;

  return false;
};

module.exports = { isOriginAllowed, getAllowedOrigins };
