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
    let storedUser = null;
    try {
      const userJson = sessionStorage.getItem('dms_luxe_user');
      storedUser = userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      console.error('Error parsing stored user:', e);
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
          setUser(response.user);
          sessionStorage.setItem('dms_luxe_user', JSON.stringify(response.user));
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
    const { token, refreshToken, ...userProfile } = userData;
    sessionStorage.setItem('dms_luxe_user', JSON.stringify(userProfile));
    setUser(userProfile);
    setLoading(false);
  };

  const logout = async () => {
    const userId = user?._id;
    try {
      await logoutService();
    } catch (error) {
      console.warn('Logout failed:', error);
    }
    if (userId) {
      localStorage.removeItem(`dms_luxe_upi_${userId}`);
    }
    sessionStorage.removeItem('dms_luxe_user');
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
