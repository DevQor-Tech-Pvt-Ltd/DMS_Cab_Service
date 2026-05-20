import { api } from './authService';

export const getDashboardStats = () => 
  api.get('/admin/dashboard-stats').then((res) => res.data);

export const getPendingDrivers = () => 
  api.get('/admin/pending-drivers').then((res) => res.data);

export const approveDriver = (driverId) => 
  api.patch(`/admin/approve-driver/${driverId}`).then((res) => res.data);

export const rejectDriver = (driverId, reason = '') => 
  api.patch(`/admin/reject-driver/${driverId}`, { reason }).then((res) => res.data);

export const getApprovedDrivers = () => 
  api.get('/admin/approved-drivers').then((res) => res.data);
