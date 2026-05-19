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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dms_luxe_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('dms_luxe_token', token);
      setAuthToken(token);
    } else {
      localStorage.removeItem('dms_luxe_token');
      setAuthToken(null);
    }
  }, [token]);

  useEffect(() => {
    const restoreUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        setUser(response.user);
      } catch (error) {
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.warn('Logout failed:', error);
    }
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
