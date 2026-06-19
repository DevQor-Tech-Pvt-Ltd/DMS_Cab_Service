import axios from 'axios';
import { getApiUrl } from '../utils/urls';

// Create centralized axios instance
const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for token injection or config setups
apiClient.interceptors.request.use(
  (config) => {
    // If the backend requires token headers instead of cookies:
    // (We use HttpOnly cookies, which are injected automatically by the browser)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to retry request with exponential backoff
const retryRequest = async (config) => {
  config.__retryCount = config.__retryCount || 0;
  if (config.__retryCount >= 3) {
    return null;
  }
  config.__retryCount += 1;
  const backoff = Math.pow(2, config.__retryCount) * 1000;
  await new Promise((resolve) => setTimeout(resolve, backoff));
  return apiClient(config);
};

// Response interceptor for automatic retry, refresh token, and global error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // 1. Retry mechanism for network failures and 5xx server issues
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
    const isServerError = error.response && error.response.status >= 500;

    if ((isNetworkError || isServerError) && !originalRequest._retryCountExceeded) {
      originalRequest.__retryCount = originalRequest.__retryCount || 0;
      if (originalRequest.__retryCount < 3) {
        const retried = await retryRequest(originalRequest);
        if (retried) return retried;
      } else {
        originalRequest._retryCountExceeded = true;
      }
    }

    // 2. Token refresh mechanism for 401 Unauthorized errors
    const isAuthPath = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/logout');
    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthPath) {
      originalRequest._retry = true;
      try {
        // Make a call to getMe endpoint. The backend protect middleware handles 
        // silent refresh automatically using the HttpOnly refreshToken cookie
        const res = await axios.get(`${getApiUrl()}/auth/me`, { withCredentials: true });
        if (res.data && res.data.success) {
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('API Client: Silent refresh failed. Redirecting to auth.', refreshError);
        // Clear local credentials on hard auth failure
        sessionStorage.removeItem('dms_luxe_user');
        sessionStorage.removeItem('dms_luxe_tab_id');
        window.name = '';
        
        // Prevent redirect loops if already on auth page
        if (!window.location.pathname.includes('/auth')) {
          window.location.replace('/auth');
        }
      }
    }

    // 3. Global error handling and response formatting mapping
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected API error occurred',
      status: error.response?.status || 500,
      success: false,
      errorCode: error.response?.data?.errorCode || 'API_COMMUNICATION_FAILED',
      errors: error.response?.data?.errors || [],
      originalError: error,
    };

    return Promise.reject(customError);
  }
);

export default apiClient;
export { apiClient as api };
