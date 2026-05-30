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
    const storedToken = sessionStorage.getItem('dms_luxe_token');
    
    if (storedToken && (!tabId || tabId !== sessionTabId)) {
      // Non-matching tab/window context, clear copied session for security
      sessionStorage.removeItem('dms_luxe_token');
      sessionStorage.removeItem('dms_luxe_user');
      sessionStorage.removeItem('dms_luxe_tab_id');
      return { token: null, user: null, loading: false };
    }

    let storedUser = null;
    if (storedToken) {
      try {
        const userJson = sessionStorage.getItem('dms_luxe_user');
        storedUser = userJson ? JSON.parse(userJson) : null;
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    return {
      token: storedToken || null,
      user: storedUser || null,
      // If we have token but no user object, we must load. Otherwise, we can render immediately.
      loading: !!storedToken && !storedUser
    };
  };

  const initialState = getInitialAuthState();
  const [user, setUser] = useState(initialState.user);
  const [token, setToken] = useState(initialState.token);
  const [loading, setLoading] = useState(initialState.loading);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = sessionStorage.getItem('dms_luxe_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setAuthToken(storedToken);
        const response = await getMe();
        setUser(response.user);
        sessionStorage.setItem('dms_luxe_user', JSON.stringify(response.user));
      } catch (error) {
        console.warn('Session verification failed, logging out:', error);
        setUser(null);
        setToken(null);
        sessionStorage.removeItem('dms_luxe_token');
        sessionStorage.removeItem('dms_luxe_user');
        sessionStorage.removeItem('dms_luxe_tab_id');
        window.name = '';
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (userData, authToken) => {
    // Generate unique tab ID and bind it to window.name and sessionStorage
    const tabId = 'tab_' + Math.random().toString(36).substring(2, 9);
    window.name = tabId;
    sessionStorage.setItem('dms_luxe_tab_id', tabId);

    sessionStorage.setItem('dms_luxe_token', authToken);
    sessionStorage.setItem('dms_luxe_user', JSON.stringify(userData));
    setAuthToken(authToken);
    setUser(userData);
    setToken(authToken);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.warn('Logout failed:', error);
    }
    sessionStorage.removeItem('dms_luxe_token');
    sessionStorage.removeItem('dms_luxe_user');
    sessionStorage.removeItem('dms_luxe_tab_id');
    window.name = '';
    setAuthToken(null);
    setUser(null);
    setToken(null);
    setLoading(false);
    window.location.replace('/');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    sessionStorage.setItem('dms_luxe_user', JSON.stringify(updatedUserData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
