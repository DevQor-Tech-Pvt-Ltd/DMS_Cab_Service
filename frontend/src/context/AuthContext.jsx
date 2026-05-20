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
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('dms_luxe_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('dms_luxe_token'));
  const [loading, setLoading] = useState(() => !!localStorage.getItem('dms_luxe_token'));

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('dms_luxe_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setAuthToken(storedToken);
        const response = await getMe();
        setUser(response.user);
        localStorage.setItem('dms_luxe_user', JSON.stringify(response.user));
      } catch (error) {
        console.warn('Session verification failed, logging out:', error);
        setUser(null);
        setToken(null);
        localStorage.removeItem('dms_luxe_token');
        localStorage.removeItem('dms_luxe_user');
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (userData, authToken) => {
    localStorage.setItem('dms_luxe_token', authToken);
    localStorage.setItem('dms_luxe_user', JSON.stringify(userData));
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
    localStorage.removeItem('dms_luxe_token');
    localStorage.removeItem('dms_luxe_user');
    setAuthToken(null);
    setUser(null);
    setToken(null);
    setLoading(false);
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('dms_luxe_user', JSON.stringify(updatedUserData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
