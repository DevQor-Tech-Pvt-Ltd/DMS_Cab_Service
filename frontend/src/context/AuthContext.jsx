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
      try {
        const response = await getMe();
        if (response.success && response.user) {
          setUser(response.user);
          sessionStorage.setItem('dms_luxe_user', JSON.stringify(response.user));
        } else {
          throw new Error('Verification failed or user empty');
        }
      } catch (error) {
        console.warn('Session verification failed, logging out:', error.message);
        setUser(null);
        sessionStorage.removeItem('dms_luxe_user');
        sessionStorage.removeItem('dms_luxe_tab_id');
        window.name = '';
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
