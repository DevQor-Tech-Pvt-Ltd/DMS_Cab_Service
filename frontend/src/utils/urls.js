/**
 * Dynamic URL resolution utility for DMS Cab Service.
 * 
 * Automatically detects if the app is running locally (localhost/127.0.0.1)
 * and routes to the local backend server. In production, uses the
 * configured VITE_API_URL environment variable.
 * 
 * This ensures seamless development without .env changes and
 * production deployment without code changes.
 */

const LOCAL_API_URL = 'http://localhost:5000/api/v1';
const LOCAL_SOCKET_URL = 'http://localhost:5000';

/**
 * Check if the application is running on localhost.
 * @returns {boolean}
 */
const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  );
};

/**
 * Get the API base URL for HTTP requests.
 * On localhost, always targets the local backend.
 * In production, uses the configured VITE_API_URL.
 * @returns {string} The full API base URL (e.g., "http://localhost:5000/api/v1")
 */
export const getApiUrl = () => {
  if (isLocalhost()) {
    return LOCAL_API_URL;
  }
  return import.meta.env.VITE_API_URL || LOCAL_API_URL;
};

/**
 * Get the Socket.IO server URL for WebSocket connections.
 * On localhost, always targets the local backend.
 * In production, derives the socket URL from VITE_API_URL by stripping the API path.
 * @returns {string} The Socket.IO server URL (e.g., "http://localhost:5000")
 */
export const getSocketUrl = () => {
  if (isLocalhost()) {
    return LOCAL_SOCKET_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace('/api/v1', '');
  }
  return LOCAL_SOCKET_URL;
};
