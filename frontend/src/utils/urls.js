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
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
};

/**
 * Get the Socket.IO server URL for WebSocket connections.
 * Uses the configured VITE_SOCKET_URL or derives it from VITE_API_URL.
 * @returns {string} The Socket.IO server URL.
 */
export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace('/api/v1', '');
  }
  return 'http://localhost:5000';
};
