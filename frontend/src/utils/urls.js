/**
 * Dynamic URL resolution utility for DMS Cab Service.
 * 
 * Retrieves API and Socket URLs from environment variables,
 * ensuring no localhost or hardcoded production domains are compiled
 * directly into the client bundles.
 */

/**
 * Get the API base URL for HTTP requests.
 * Uses the configured VITE_API_URL.
 * @returns {string} The full API base URL.
 */
export const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url && import.meta.env.PROD) {
    // In production build fallback to a relative path instead of localhost
    return '/api/v1';
  }

  const finalUrl = url || 'http://localhost:5000/api/v1';

  // Upgrade HTTP to HTTPS for non-localhost URLs in production mode to prevent mixed content
  if (import.meta.env.PROD && finalUrl.startsWith('http://') && !finalUrl.includes('localhost')) {
    return finalUrl.replace('http://', 'https://');
  }

  return finalUrl;
};

/**
 * Get the Socket.IO server URL for WebSocket connections.
 * Uses the configured VITE_SOCKET_URL or derives it from VITE_API_URL.
 * @returns {string} The Socket.IO server URL.
 */
export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (import.meta.env.PROD && socketUrl.startsWith('http://') && !socketUrl.includes('localhost')) {
      return socketUrl.replace('http://', 'https://');
    }
    return socketUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    let resolved = apiUrl.replace('/api/v1', '');
    if (import.meta.env.PROD && resolved.startsWith('http://') && !resolved.includes('localhost')) {
      return resolved.replace('http://', 'https://');
    }
    return resolved;
  }

  if (import.meta.env.PROD) {
    // In production build fallback to current window location origin instead of localhost
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  return 'http://localhost:5000';
};
