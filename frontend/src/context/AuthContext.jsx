import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, logout as logoutService, setAuthToken } from '../services/authService.js';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }) => {
  // Sync and validate tab session before initializing state
  const getInitialAuthState = () => {
    const tabId = window.name;
    const sessionTabId = sessionStorage.getItem('dms_luxe_tab_id');
    
    let storedUser = null;
    try {
      const userJson = sessionStorage.getItem('dms_luxe_user');
      storedUser = userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }

    if (storedUser && (!tabId || tabId !== sessionTabId)) {
      // Non-matching tab/window context, clear copied session for security
      sessionStorage.removeItem('dms_luxe_user');
      sessionStorage.removeItem('dms_luxe_tab_id');
      return { user: null, loading: true };
    }

    return {
      user: storedUser || null,
      loading: true // Always load and verify cookie on start
    };
  };

  const initialState = getInitialAuthState();
  const [user, setUser] = useState(initialState.user);
  const [loading, setLoading] = useState(initialState.loading);

  useEffect(() => {
    const verifySession = async () => {
      // If no stored user, there's nothing to verify — just mark loading done
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        if (response.success && response.user) {
          let token = null;
          let refreshToken = null;
          try {
            const userJson = sessionStorage.getItem('dms_luxe_user');
            const userObj = userJson ? JSON.parse(userJson) : null;
            token = userObj?.token;
            refreshToken = userObj?.refreshToken;
          } catch (e) {
            console.error('Error reading tokens from sessionStorage:', e);
          }
          const mergedUser = {
            ...response.user,
            ...(token && { token }),
            ...(refreshToken && { refreshToken })
          };
          setUser(mergedUser);
          sessionStorage.setItem('dms_luxe_user', JSON.stringify(mergedUser));
        } else {
          throw new Error('Verification failed or user empty');
        }
      } catch (error) {
        console.warn('Session verification failed:', error.message);
        // Only clear session on definitive auth failures (401/403), not on network errors
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          setUser(null);
          sessionStorage.removeItem('dms_luxe_user');
          sessionStorage.removeItem('dms_luxe_tab_id');
          window.name = '';
        }
        // For network errors or 5xx, keep the stored user to allow the dashboard
        // to render — individual API calls will fail and show their own errors
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (userData) => {
    // Generate unique tab ID and bind it to window.name and sessionStorage
    const tabId = 'tab_' + Math.random().toString(36).substring(2, 9);
    window.name = tabId;
    sessionStorage.setItem('dms_luxe_tab_id', tabId);

    sessionStorage.setItem('dms_luxe_user', JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.warn('Logout failed:', error);
    }
    sessionStorage.removeItem('dms_luxe_user');
    sessionStorage.removeItem('dms_luxe_tab_id');
    window.name = '';
    setUser(null);
    setLoading(false);
    window.location.replace('/');
  };

  const updateUser = (updatedUserData) => {
    let token = null;
    let refreshToken = null;
    try {
      const userJson = sessionStorage.getItem('dms_luxe_user');
      const userObj = userJson ? JSON.parse(userJson) : null;
      token = userObj?.token;
      refreshToken = userObj?.refreshToken;
    } catch (e) {
      console.error('Error reading tokens for update:', e);
    }
    const mergedUser = {
      ...updatedUserData,
      ...(token && { token }),
      ...(refreshToken && { refreshToken })
    };
    setUser(mergedUser);
    sessionStorage.setItem('dms_luxe_user', JSON.stringify(mergedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
