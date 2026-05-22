import React, { useState, useEffect, useRef } from 'react';
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

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div
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
  </div>
);

const StatCardSkeleton = () => (
  <div className="bg-[#111620] border border-white/5 rounded-2xl p-6 relative overflow-hidden animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-white/5"></div>
      <div className="w-12 h-5 rounded-full bg-white/5"></div>
    </div>
    <div className="w-20 h-8 bg-white/5 rounded-lg mb-2"></div>
    <div className="w-28 h-4 bg-white/5 rounded-md"></div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-[#111620] border border-white/5 rounded-2xl p-6 h-80 flex flex-col justify-between animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <div className="w-32 h-5 bg-white/5 rounded-md"></div>
        <div className="w-48 h-3 bg-white/5 rounded-md"></div>
      </div>
      <div className="flex space-x-2">
        <div className="w-24 h-8 bg-white/5 rounded-lg"></div>
        <div className="w-24 h-8 bg-white/5 rounded-lg"></div>
      </div>
    </div>
    <div className="flex-1 w-full bg-white/5 rounded-xl flex items-end p-4 space-x-3">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 bg-white/[0.03] rounded-t-lg" style={{ height: `${20 + i * 10}%` }}></div>
      ))}
    </div>
  </div>
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

const BusinessAnalyticsChart = ({ data }) => {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' or 'bookings'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#111620] border border-white/5 rounded-2xl p-6 h-80 flex items-center justify-center text-gray-500">
        No business data available to chart.
      </div>
    );
  }

  // Find max value for scaling
  const values = data.map(d => activeTab === 'revenue' ? d.revenue : d.bookings);
  const maxValue = Math.max(...values, 10);
  
  // Chart dimensions
  const width = 500;
  const height = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const value = activeTab === 'revenue' ? d.revenue : d.bookings;
    const y = paddingTop + chartHeight - (value / maxValue) * chartHeight;
    return { x, y, label: d.label, val: value };
  });

  // Build SVG path
  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX1 = points[i-1].x + chartWidth / (data.length - 1) / 3;
      const cpY1 = points[i-1].y;
      const cpX2 = points[i].x - chartWidth / (data.length - 1) / 3;
      const cpY2 = points[i].y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  return (
    <div className="bg-[#111620] border border-white/5 rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-serif text-white">Business Analytics</h2>
          <p className="text-xs text-gray-400">Weekly performance summary</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'revenue' 
                ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/10' 
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Revenue (INR)
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bookings' 
                ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/10' 
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Rides Booked
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const val = Math.round(maxValue - ratio * maxValue);
            return (
              <g key={idx} className="opacity-20">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#fff" 
                  strokeWidth="0.5" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  fill="#fff" 
                  fontSize="8" 
                  textAnchor="end" 
                  className="font-mono font-light fill-gray-400"
                >
                  {activeTab === 'revenue' ? `₹${val}` : val}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {points.map((pt, index) => (
            <text
              key={index}
              x={pt.x}
              y={height - 10}
              fill="#9ca3af"
              fontSize="8"
              textAnchor="middle"
              className="font-mono font-light"
            >
              {pt.label}
            </text>
          ))}

          {/* Area Fill */}
          <path d={areaD} fill="url(#chartGrad)" />

          {/* Glowing Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#d4af37" 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />

          {/* Interactive Hover / Points */}
          {points.map((pt, index) => (
            <g 
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === index ? "6" : "3.5"}
                fill={hoveredIndex === index ? "#fff" : "#d4af37"}
                stroke="#111620"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="15"
                fill="transparent"
              />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && (
          <div 
            className="absolute z-10 bg-[#161c2a] border border-[#d4af37]/30 text-white p-3 rounded-xl shadow-2xl text-xs pointer-events-none transition-all duration-75"
            style={{
              left: `${((points[hoveredIndex].x - paddingLeft) / chartWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 35}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-semibold text-gray-300 mb-1">{points[hoveredIndex].label}</p>
            <p className="text-[#d4af37] font-semibold font-mono">
              {activeTab === 'revenue' 
                ? `Revenue: ₹${points[hoveredIndex].val.toLocaleString('en-IN')}`
                : `Bookings: ${points[hoveredIndex].val} rides`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

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

  const hasFetched = useRef(false);

  // Redirect non-admin or unauthenticated users (e.g. on logout)
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

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
    { icon: Users, label: 'Total Users', value: statsData ? statsData.totalUsers.toString() : '', trend: statsData?.trends?.userTrend, color: 'bg-blue-500/10 text-blue-400' },
    { icon: Car, label: 'Approved Chauffeurs', value: statsData ? statsData.approvedDrivers.toString() : '', trend: statsData?.trends?.approvedTrend, color: 'bg-[#d4af37]/10 text-[#d4af37]' },
    { icon: AlertTriangle, label: 'Pending Approvals', value: statsData ? statsData.pendingDriverApprovals.toString() : '', trend: statsData?.trends?.pendingTrend, color: 'bg-amber-500/10 text-amber-400' },
    { icon: TrendingUp, label: 'Total Drivers Registered', value: statsData ? statsData.totalDrivers.toString() : '', trend: statsData?.trends?.driverTrend, color: 'bg-purple-500/10 text-purple-400' },
  ];



  return (
    <div className="min-h-screen bg-[#060a11] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#d4af37]" />
            </div>
            <h1 className="text-3xl font-serif text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-400 ml-[52px]">
            Welcome back, <span className="text-[#d4af37]">{user.fullName}</span>. Here's your command center.
          </p>
        </div>

        {/* Notifications */}
        {statsError && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex justify-between items-center">
            <span>{statsError}</span>
            <button
              onClick={() => {
                hasFetched.current = false;
                fetchData(true);
              }}
              className="px-3 py-1 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors border border-red-500/30"
            >
              Retry
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : statsData ? (
            stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))
          ) : null}
        </div>

        {/* Business Overview Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 size={18} className="text-[#d4af37]" />
            <h2 className="text-xl font-serif text-white">Business Overview</h2>
          </div>

          {statsLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#111620] border border-white/5 rounded-2xl p-5 relative overflow-hidden animate-pulse">
                    <div className="w-24 h-4 bg-white/5 rounded mb-2"></div>
                    <div className="w-16 h-8 bg-white/5 rounded mb-2"></div>
                    <div className="w-20 h-3 bg-white/5 rounded"></div>
                  </div>
                ))}
              </div>
              <ChartSkeleton />
            </div>
          ) : statsData ? (
            <>
              {/* Business Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <div className="bg-[#111620] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-white font-mono">{statsData.businessStats?.totalRides || 0}</p>
                  <p className="text-[10px] text-gray-500 mt-1">All-time bookings</p>
                </div>
                <div className="bg-[#111620] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Completed Rides</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{statsData.businessStats?.completedRides || 0}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Successfully delivered</p>
                </div>
                <div className="bg-[#111620] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Active Rides</p>
                  <p className="text-2xl font-bold text-blue-400 font-mono">{statsData.businessStats?.activeRides || 0}</p>
                  <p className="text-[10px] text-gray-500 mt-1">In progress on the road</p>
                </div>
                <div className="bg-[#111620] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Total Earnings</p>
                  <p className="text-2xl font-bold text-[#d4af37] font-mono font-sans">₹{(statsData.businessStats?.totalRevenue || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Completed ride fares</p>
                </div>
              </div>

              {/* Dynamic SVG business chart */}
              <BusinessAnalyticsChart data={statsData.chartData} />
            </>
          ) : null}
        </div>

        {/* Main Content Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-[#111620] border border-white/5 rounded-2xl p-6 h-80 relative overflow-hidden animate-pulse">
              <div className="w-48 h-6 bg-white/5 rounded mb-6"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex space-x-4 items-center">
                    <div className="w-9 h-9 rounded-lg bg-white/5"></div>
                    <div className="flex-1 h-4 bg-white/5 rounded"></div>
                    <div className="w-16 h-3 bg-white/5 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111620] border border-white/5 rounded-2xl p-6 h-80 relative overflow-hidden animate-pulse">
              <div className="w-48 h-6 bg-white/5 rounded mb-6"></div>
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="w-28 h-4 bg-white/5 rounded"></div>
                      <div className="w-10 h-4 bg-white/5 rounded"></div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : statsData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-[#111620] border border-white/5 rounded-2xl p-6">
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
            </div>

            {/* Quick Stats Sidebar */}
            <div className="bg-[#111620] border border-white/5 rounded-2xl p-6">
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
            </div>
          </div>
        ) : null}

        {/* Pending Driver Approvals */}
        <div className="mt-6 bg-[#111620] border border-white/5 rounded-2xl p-6">
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
            <div>
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
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

              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {drivers.map((driver) => (
                  <div key={driver._id} className="bg-[#161c2a] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-sm font-medium">
                        {driver.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{driver.fullName}</h4>
                        <span className="text-[10px] text-gray-500">ID: {driver._id.substring(18)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Contact</p>
                        <p className="text-xs text-white break-all">{driver.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{driver.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Credentials</p>
                        <p className="text-xs text-gray-300 font-mono">Vehicle: {driver.vehicleNumber}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">License: {driver.licenseNumber}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {driver.rcDocument && (
                          <button
                            onClick={() => setSelectedDoc({
                              docData: driver.rcDocument,
                              docTitle: 'RC Document (Vehicle Registration)',
                              driverName: driver.fullName
                            })}
                            className="flex items-center space-x-1 text-[11px] bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={12} />
                            <span>RC Copy</span>
                          </button>
                        )}
                        {driver.licenseDocument && (
                          <button
                            onClick={() => setSelectedDoc({
                              docData: driver.licenseDocument,
                              docTitle: 'Chauffeur Driving License',
                              driverName: driver.fullName
                            })}
                            className="flex items-center space-x-1 text-[11px] bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={12} />
                            <span>License</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleReject(driver._id)}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(driver._id)}
                        className="flex-1 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                      >
                        <CheckCircle size={14} />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Approved Chauffeurs */}
        <div className="mt-8 bg-[#111620] border border-white/5 rounded-2xl p-6">
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
            <div>
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
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

              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {approvedDriversList.map((driver) => (
                  <div key={driver._id} className="bg-[#161c2a] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-sm font-medium">
                        {driver.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{driver.fullName}</h4>
                        <span className="text-[10px] text-gray-500">ID: {driver._id.substring(18)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Contact</p>
                        <p className="text-xs text-white break-all">{driver.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{driver.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Credentials</p>
                        <p className="text-xs text-gray-300 font-mono">Vehicle: {driver.vehicleNumber}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">License: {driver.licenseNumber}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {driver.rcDocument ? (
                          <button
                            onClick={() => setSelectedDoc({
                              docData: driver.rcDocument,
                              docTitle: 'RC Document (Vehicle Registration)',
                              driverName: driver.fullName
                            })}
                            className="flex items-center space-x-1 text-[11px] bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={12} />
                            <span>RC Copy</span>
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
                            className="flex items-center space-x-1 text-[11px] bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={12} />
                            <span>License</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600 italic">No License</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium">
                        <CheckCircle size={10} />
                        <span>Approved</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Approved on: {driver.approvalDate ? new Date(driver.approvalDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
