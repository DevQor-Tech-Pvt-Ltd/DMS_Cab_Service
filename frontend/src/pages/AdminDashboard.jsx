import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, FileText, Eye, X
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getPendingDrivers, approveDriver, rejectDriver, getApprovedDrivers } from '../services/adminService';
import NotFoundPage from './NotFoundPage';

// Import modular dashboard subcomponents
import AdminOverview from '../components/dashboard/AdminOverview';
import AdminPendingDrivers from '../components/dashboard/AdminPendingDrivers';
import AdminApprovedDrivers from '../components/dashboard/AdminApprovedDrivers';
import AdminLogs from '../components/dashboard/AdminLogs';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [approvedDriversList, setApprovedDriversList] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null); // { docData, docTitle, driverName }
  const [visibleLogsCount, setVisibleLogsCount] = useState(5);

  const hasFetched = useRef(false);

  const fetchData = async (forceRetry = false) => {
    if (hasFetched.current && !forceRetry) return;
    hasFetched.current = true;

    try {
      setStatsLoading(true);
      setLoading(true);
      setStatsError(null);

      // Perform parallel requests for maximum production performance
      const [statsRes, driversRes, approvedRes] = await Promise.all([
        getDashboardStats(),
        getPendingDrivers(),
        getApprovedDrivers()
      ]);

      if (statsRes.success) {
        setStatsData(statsRes.stats);
      } else {
        throw new Error(statsRes.message || 'Failed to fetch dashboard statistics.');
      }

      if (driversRes.success) {
        setDrivers(driversRes.drivers);
      }
      if (approvedRes.success) {
        setApprovedDriversList(approvedRes.drivers);
      }
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
      setStatsError(err.message || 'Failed to load dashboard data. Please check your network connection.');
      // Allow retry if it failed
      hasFetched.current = false;
    } finally {
      setStatsLoading(false);
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
      setStatsError(null);
      setSuccessMessage('');
      const res = await approveDriver(driverId);
      if (res.success) {
        setSuccessMessage(res.message || 'Driver approved successfully!');
        // Pass forceRetry to re-fetch new statistics
        fetchData(true);
      }
    } catch (err) {
      console.error(err);
      setStatsError(err?.response?.data?.message || 'Failed to approve driver.');
    }
  };

  const handleReject = async (driverId) => {
    try {
      setStatsError(null);
      setSuccessMessage('');
      const res = await rejectDriver(driverId);
      if (res.success) {
        setSuccessMessage(res.message || 'Driver application rejected.');
        // Pass forceRetry to re-fetch new statistics
        fetchData(true);
      }
    } catch (err) {
      console.error(err);
      setStatsError(err?.response?.data?.message || 'Failed to reject driver.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003893] font-serif text-sm tracking-wider uppercase animate-pulse">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#003893]/10 flex items-center justify-center border border-[#003893]/20">
              <Shield size={20} className="text-[#003893]" />
            </div>
            <h1 className="text-3xl font-serif text-slate-900 font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-slate-600 font-medium ml-[52px]">
            Welcome back, <span className="text-[#003893] font-bold">{user.fullName}</span>. Here's your command center.
          </p>
        </div>

        {/* Notifications */}
        {statsError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex justify-between items-center">
            <span>{statsError}</span>
            <button
              onClick={() => {
                hasFetched.current = false;
                fetchData(true);
              }}
              className="px-3 py-1 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors border border-red-300"
            >
              Retry
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-250 px-4 py-3 text-sm text-emerald-700 font-semibold shadow-xs">
            {successMessage}
          </div>
        )}

        {/* Stats Grid & Business Overview Section */}
        <AdminOverview statsData={statsData} statsLoading={statsLoading} />

        {/* Main Content Grid: Logs & Sidebar quality index */}
        <AdminLogs
          statsData={statsData}
          visibleLogsCount={visibleLogsCount}
          setVisibleLogsCount={setVisibleLogsCount}
        />

        {/* Pending Driver Approvals */}
        <AdminPendingDrivers
          drivers={drivers}
          loading={loading}
          handleApprove={handleApprove}
          handleReject={handleReject}
          setSelectedDoc={setSelectedDoc}
        />

        {/* Approved Chauffeurs */}
        <AdminApprovedDrivers
          approvedDriversList={approvedDriversList}
          loading={loading}
          setSelectedDoc={setSelectedDoc}
        />
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
