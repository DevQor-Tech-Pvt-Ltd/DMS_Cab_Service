import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Car, CalendarCheck, TrendingUp, 
  Shield, Clock, CheckCircle, XCircle, 
  ChevronRight, Activity, BarChart3, 
  UserCheck, UserX, AlertTriangle, FileText, Eye, X
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getPendingDrivers, approveDriver, rejectDriver, getApprovedDrivers } from '../services/adminService';

const StatCard = ({ icon: Icon, label, value, trend, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-[#111620] border border-white/5 rounded-2xl p-6 hover:border-[#d4af37]/20 transition-all duration-300 group"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
  </motion.div>
);

const iconMap = {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertTriangle,
  Clock
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'} ago`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [approvedDriversList, setApprovedDriversList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null); // { docData, docTitle, driverName }

  // Redirect non-admin or unauthenticated users (e.g. on logout)
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const statsRes = await getDashboardStats();
      const driversRes = await getPendingDrivers();
      const approvedRes = await getApprovedDrivers();
      if (statsRes.success) setStatsData(statsRes.stats);
      if (driversRes.success) setDrivers(driversRes.drivers);
      if (approvedRes.success) setApprovedDriversList(approvedRes.drivers);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const handleApprove = async (driverId) => {
    try {
      setError('');
      setSuccessMessage('');
      const res = await approveDriver(driverId);
      if (res.success) {
        setSuccessMessage(res.message || 'Driver approved successfully!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to approve driver.');
    }
  };

  const handleReject = async (driverId) => {
    try {
      setError('');
      setSuccessMessage('');
      const res = await rejectDriver(driverId);
      if (res.success) {
        setSuccessMessage(res.message || 'Driver application rejected.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to reject driver.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060a11] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#d4af37] font-serif text-sm tracking-wider uppercase animate-pulse">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const stats = [
    { icon: Users, label: 'Total Users', value: statsData ? statsData.totalUsers : '1,247', trend: 12, color: 'bg-blue-500/10 text-blue-400' },
    { icon: Car, label: 'Approved Chauffeurs', value: statsData ? statsData.approvedDrivers : '12', trend: 5, color: 'bg-[#d4af37]/10 text-[#d4af37]' },
    { icon: AlertTriangle, label: 'Pending Approvals', value: statsData ? statsData.pendingDriverApprovals : '3', trend: -20, color: 'bg-amber-500/10 text-amber-400' },
    { icon: TrendingUp, label: 'Total Drivers Registered', value: statsData ? statsData.totalDrivers : '15', trend: 8, color: 'bg-purple-500/10 text-purple-400' },
  ];



  return (
    <div className="min-h-screen bg-[#060a11] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#d4af37]" />
            </div>
            <h1 className="text-3xl font-serif text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-400 ml-[52px]">
            Welcome back, <span className="text-[#d4af37]">{user.fullName}</span>. Here's your command center.
          </p>
        </motion.div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={index * 0.1} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Activity size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-serif text-white">System Activity Logs</h2>
              </div>
            </div>
            <div className="space-y-1">
              {!statsData?.activities || statsData.activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No system activity logs recorded yet.
                </div>
              ) : (
                statsData.activities.map((activity, index) => {
                  const colorMap = {
                    success: 'text-emerald-400 bg-emerald-500/10',
                    info: 'text-blue-400 bg-blue-500/10',
                    warning: 'text-amber-400 bg-amber-500/10',
                    error: 'text-red-400 bg-red-500/10',
                  };
                  const colors = colorMap[activity.type] || colorMap.info;
                  const ActivityIcon = iconMap[activity.iconName] || Clock;
                  return (
                    <div 
                      key={index} 
                      className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
                        <ActivityIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{activity.text}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 shrink-0">
                        <Clock size={12} />
                        <span>{formatRelativeTime(activity.time)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Quick Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-serif text-white">Chauffeur Quality Index</h2>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Application Success Rate</span>
                  <span className="text-white font-medium">
                    {statsData?.qualityIndex ? `${statsData.qualityIndex.applicationSuccessRate}%` : '100%'}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#ffe392] rounded-full transition-all duration-500" 
                    style={{ width: `${statsData?.qualityIndex ? statsData.qualityIndex.applicationSuccessRate : 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Document Authenticity Index</span>
                  <span className="text-white font-medium">
                    {statsData?.qualityIndex ? `${statsData.qualityIndex.documentAuthenticityIndex}%` : '100%'}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500" 
                    style={{ width: `${statsData?.qualityIndex ? statsData.qualityIndex.documentAuthenticityIndex : 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Background Verification Check</span>
                  <span className="text-white font-medium">
                    {statsData?.qualityIndex ? `${statsData.qualityIndex.backgroundVerificationCheck}%` : '100%'}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-500" 
                    style={{ width: `${statsData?.qualityIndex ? statsData.qualityIndex.backgroundVerificationCheck : 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pending Driver Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 bg-[#111620] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={20} className="text-amber-400" />
              <h2 className="text-lg font-serif text-white">Pending Chauffeur Approvals</h2>
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                {drivers.length}
              </span>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="mx-auto mb-3 animate-spin text-[#d4af37]" size={28} />
              <p>Loading application data...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="mx-auto mb-3 text-emerald-500" size={32} />
              <p>All driver applications are processed. No pending approvals!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] lg:min-w-0">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Chauffeur</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Contact</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Vehicle / License No.</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Attached Documents</th>
                    <th className="text-right text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {drivers.map((driver) => (
                    <tr key={driver._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-sm font-medium">
                            {driver.fullName.charAt(0)}
                          </div>
                          <span className="text-sm text-white font-medium">{driver.fullName}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-white">{driver.email}</p>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-300 font-mono">Vehicle: {driver.vehicleNumber}</p>
                        <p className="text-xs text-gray-500 font-mono">License: {driver.licenseNumber}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          {driver.rcDocument && (
                            <button
                              onClick={() => setSelectedDoc({
                                docData: driver.rcDocument,
                                docTitle: 'RC Document (Vehicle Registration)',
                                driverName: driver.fullName
                              })}
                              className="flex items-center space-x-1 text-xs bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye size={12} />
                              <span>View RC Copy</span>
                            </button>
                          )}
                          {driver.licenseDocument && (
                            <button
                              onClick={() => setSelectedDoc({
                                docData: driver.licenseDocument,
                                docTitle: 'Chauffeur Driving License',
                                driverName: driver.fullName
                              })}
                              className="flex items-center space-x-1 text-xs bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye size={12} />
                              <span>View License</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleApprove(driver._id)}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" 
                            title="Approve Driver Application"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(driver._id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" 
                            title="Reject Driver Application"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Approved Chauffeurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 bg-[#111620] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <UserCheck size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-serif text-white">Approved Chauffeurs</h2>
              <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] px-2 py-0.5 rounded-full font-medium">
                {approvedDriversList.length}
              </span>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="mx-auto mb-3 animate-spin text-[#d4af37]" size={28} />
              <p>Loading chauffeur data...</p>
            </div>
          ) : approvedDriversList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="mx-auto mb-3 text-gray-600" size={32} />
              <p>No approved drivers found. Approve some applications to populate the list!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] lg:min-w-0">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Chauffeur</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Contact</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Vehicle / License No.</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Verification Documents</th>
                    <th className="text-right text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Status / Approved On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {approvedDriversList.map((driver) => (
                    <tr key={driver._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-sm font-medium">
                            {driver.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium block">{driver.fullName}</span>
                            <span className="text-xs text-gray-500">ID: {driver._id.substring(18)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-white">{driver.email}</p>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-300 font-mono">Vehicle: {driver.vehicleNumber}</p>
                        <p className="text-xs text-gray-500 font-mono">License: {driver.licenseNumber}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          {driver.rcDocument ? (
                            <button
                              onClick={() => setSelectedDoc({
                                docData: driver.rcDocument,
                                docTitle: 'RC Document (Vehicle Registration)',
                                driverName: driver.fullName
                              })}
                              className="flex items-center space-x-1 text-xs bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye size={12} />
                              <span>View RC Copy</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-600 italic">No RC Document</span>
                          )}
                          {driver.licenseDocument ? (
                            <button
                              onClick={() => setSelectedDoc({
                                docData: driver.licenseDocument,
                                docTitle: 'Chauffeur Driving License',
                                driverName: driver.fullName
                              })}
                              className="flex items-center space-x-1 text-xs bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye size={12} />
                              <span>View License</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-600 italic">No License</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium mb-1">
                          <CheckCircle size={10} />
                          <span>Approved</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {driver.approvalDate ? new Date(driver.approvalDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-[#111620] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0f18]">
                <div>
                  <h3 className="text-lg font-serif text-white">{selectedDoc.docTitle}</h3>
                  <p className="text-xs text-[#d4af37]">Applicant: {selectedDoc.driverName}</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex justify-center items-center max-h-[60vh] overflow-y-auto bg-black/20">
                {selectedDoc.docData.startsWith('data:application/pdf') || selectedDoc.docData.endsWith('.pdf') ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <FileText size={48} className="text-[#d4af37] mb-3" />
                    <p className="text-sm mb-4">PDF Document Uploaded</p>
                    <a
                      href={selectedDoc.docData}
                      download={`${selectedDoc.driverName.replace(/\s+/g, '_')}_document.pdf`}
                      className="px-4 py-2 bg-[#ffe392] text-black rounded-lg text-sm font-semibold hover:bg-[#e6c87a] transition-all"
                    >
                      Download & Open PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={selectedDoc.docData}
                    alt={selectedDoc.docTitle}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg border border-white/5"
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#0a0f18] border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-5 py-2 text-sm text-gray-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
