/**
 * Shared environment detection utilities for DMS Cab Service.
 *
 * Centralizes deployment-mode detection so cookie settings, logging
 * levels, and CORS policies stay consistent across the codebase.
 */

/**
 * Determine if the server is running in a deployed (non-local) environment.
 * Uses multiple signals for robustness:
 *  1. NODE_ENV === 'production' → deployed
 *  2. NODE_ENV === 'development' → local
 *  3. process.env.RENDER is set (Render auto-sets RENDER=true)
 *  4. CLIENT_URL contains 'https://' (indicates deployed frontend)
 *
 * @returns {boolean}
 */
const isDeployed = () => {
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.RENDER) return true;
  if (process.env.NODE_ENV === 'development') return false;
  const clientUrl = process.env.CLIENT_URL || '';
  return clientUrl.includes('https://');
};

/**
 * Standard httpOnly cookie options for auth tokens.
 * @returns {object}
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: isDeployed(),
  sameSite: isDeployed() ? 'none' : 'lax',
  path: '/',
});

module.exports = { isDeployed, getCookieOptions };
