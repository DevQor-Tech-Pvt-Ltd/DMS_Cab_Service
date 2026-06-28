import apiClient from './apiClient';

export const api = apiClient;

// Stub setAuthToken for compatibility with other files (safe to deprecate)
export const setAuthToken = (token) => {};

export const register = (payload) => api.post('/auth/register', payload).then((res) => res.data);
export const login = (payload) => api.post('/auth/login', payload).then((res) => res.data);
export const logout = () => api.post('/auth/logout').then((res) => res.data);
export const getMe = () => api.get('/auth/me').then((res) => res.data);
export const updateProfile = (payload) => api.put('/auth/update-profile', payload).then((res) => res.data);
export const deleteAccount = () => api.delete('/auth/delete-account').then((res) => res.data);
export const submitContactInquiry = (payload) => api.post('/auth/contact-inquiry', payload).then((res) => {
  if (!res.data.success) {
    const err = new Error(res.data.message || 'Email could not be sent.');
    err.response = res;
    throw err;
  }
  return res.data;
});
