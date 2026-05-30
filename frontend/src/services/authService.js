import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const storedToken = sessionStorage.getItem('dms_luxe_token');
if (storedToken) {
  setAuthToken(storedToken);
}

export const register = (payload) => api.post('/auth/register', payload).then((res) => {
  if (res.data?.token) {
    setAuthToken(res.data.token);
  }
  return res.data;
});

export const login = (payload) => api.post('/auth/login', payload).then((res) => {
  if (res.data?.token) {
    setAuthToken(res.data.token);
  }
  return res.data;
});

export const logout = () => api.post('/auth/logout').then((res) => {
  setAuthToken(null);
  return res.data;
});

export const getMe = () => api.get('/auth/me').then((res) => res.data);

export const updateProfile = (payload) => api.put('/auth/update-profile', payload).then((res) => res.data);
export const deleteAccount = () => api.delete('/auth/delete-account').then((res) => res.data);
export const submitContactInquiry = (payload) => api.post('/auth/contact-inquiry', payload).then((res) => res.data);
