import React, { useState } from 'react';
import { BarChart3 } from '../../utils/icons';

const StatCard = ({ icon: Icon, image, imageClass = "w-14 h-14", label, value, trend }) => (
  <div
    className="bg-[#FDE77B] border-2 border-[#003893]/20 rounded-2xl p-6 hover:border-[#003893]/40 hover:shadow-md transition-all duration-300 group shadow-sm"
  >
    <div className="flex items-start justify-between mb-4">
      {image ? (
        <img src={image} alt={label} className={`${imageClass} object-contain`} />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white text-[#003893] border border-[#003893]/20 shadow-sm">
          <Icon size={22} />
        </div>
      )}
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-xs ${
          trend >= 0 
            ? 'bg-emerald-700 text-white border-emerald-800' 
            : 'bg-red-600 text-white border-red-700'
        }`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-slate-900 mb-1 font-serif">{value || '0'}</p>
    <p className="text-sm text-slate-800 font-bold">{label}</p>
  </div>
);

const StatCardSkeleton = () => (
  <div className="bg-[#FDE77B]/80 border-2 border-[#003893]/15 rounded-2xl p-6 relative overflow-hidden animate-pulse shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-white/50"></div>
      <div className="w-12 h-5 rounded-full bg-white/50"></div>
    </div>
    <div className="w-20 h-8 bg-white/50 rounded-lg mb-2"></div>
    <div className="w-28 h-4 bg-white/50 rounded-md"></div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 h-80 flex flex-col justify-between animate-pulse shadow-sm">
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <div className="w-32 h-5 bg-slate-100 rounded-md"></div>
        <div className="w-48 h-3 bg-slate-100 rounded-md"></div>
      </div>
      <div className="flex space-x-2">
        <div className="w-24 h-8 bg-slate-100 rounded-lg"></div>
        <div className="w-24 h-8 bg-slate-100 rounded-lg"></div>
      </div>
    </div>
    <div className="flex-1 w-full bg-slate-50 rounded-xl flex items-end p-4 space-x-3">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 bg-slate-100 rounded-t-lg" style={{ height: `${20 + i * 10}%` }}></div>
      ))}
    </div>
  </div>
);

const BusinessAnalyticsChart = ({ data }) => {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' or 'bookings'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 h-80 flex items-center justify-center text-slate-400 shadow-sm">
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
      const cpX1 = points[i - 1].x + chartWidth / (data.length - 1) / 3;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i].x - chartWidth / (data.length - 1) / 3;
      const cpY2 = points[i].y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  return (
    <div className="bg-[#FDE77B] border-2 border-[#003893]/20 rounded-2xl p-6 mb-8 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-serif text-[#003893] font-bold">Business Analytics</h2>
          <p className="text-xs text-slate-700 font-semibold">Weekly performance summary</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'revenue'
                ? 'bg-[#003893] text-white shadow-lg shadow-[#003893]/15'
                : 'bg-white border border-[#003893]/35 text-[#003893] hover:bg-[#003893]/10'
              }`}
          >
            Revenue (INR)
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'bookings'
                ? 'bg-[#003893] text-white shadow-lg shadow-[#003893]/15'
                : 'bg-white border border-[#003893]/35 text-[#003893] hover:bg-[#003893]/10'
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
              <stop offset="0%" stopColor="#003893" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#003893" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const val = Math.round(maxValue - ratio * maxValue);
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#003893"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#003893"
                  fontSize="8"
                  textAnchor="end"
                  className="font-mono font-bold fill-[#003893]"
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
              fill="#003893"
              fontSize="8"
              textAnchor="middle"
              className="font-mono font-bold fill-[#003893]"
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
            stroke="#003893"
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
                fill={hoveredIndex === index ? "#f2b705" : "#003893"}
                stroke="#fff"
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
            className="absolute z-10 bg-white border border-slate-200 text-slate-800 p-3 rounded-xl shadow-xl text-xs pointer-events-none transition-all duration-75"
            style={{
              left: `${((points[hoveredIndex].x - paddingLeft) / chartWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 35}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-semibold text-slate-500 mb-1">{points[hoveredIndex].label}</p>
            <p className="text-[#003893] font-semibold font-mono">
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

const AdminOverview = ({ statsData, statsLoading }) => {
  const stats = [
    { image: '/User.png', label: 'Total Users', value: statsData ? statsData.totalUsers.toString() : '', trend: statsData?.trends?.userTrend },
    { image: '/Car.png', imageClass: 'w-20 h-20', label: 'Approved Chauffeurs', value: statsData ? statsData.approvedDrivers.toString() : '', trend: statsData?.trends?.approvedTrend },
    { image: '/Warning.png', label: 'Pending Approvals', value: statsData ? statsData.pendingDriverApprovals.toString() : '', trend: statsData?.trends?.pendingTrend },
    { image: '/Growth.png', label: 'Total Drivers Registered', value: statsData ? statsData.totalDrivers.toString() : '', trend: statsData?.trends?.driverTrend },
  ];

  return (
    <>
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
          <BarChart3 size={18} className="text-[#003893]" />
          <h2 className="text-xl font-serif text-slate-900 font-bold">Business Overview</h2>
        </div>

        {statsLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden animate-pulse shadow-sm">
                  <div className="w-24 h-4 bg-slate-100 rounded mb-2"></div>
                  <div className="w-16 h-8 bg-slate-100 rounded mb-2"></div>
                  <div className="w-20 h-3 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
            <ChartSkeleton />
          </div>
        ) : statsData ? (
          <>
            {/* Business Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#003893]/25 transition-all shadow-sm">
                <p className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{statsData.businessStats?.totalRides || 0}</p>
                <p className="text-[11px] text-slate-600 font-medium mt-1">All-time bookings</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#003893]/25 transition-all shadow-sm">
                <p className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">Completed Rides</p>
                <p className="text-2xl font-bold text-emerald-700 font-mono">{statsData.businessStats?.completedRides || 0}</p>
                <p className="text-[11px] text-slate-600 font-medium mt-1">Successfully delivered</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#003893]/25 transition-all shadow-sm">
                <p className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">Active Rides</p>
                <p className="text-2xl font-bold text-blue-700 font-mono">{statsData.businessStats?.activeRides || 0}</p>
                <p className="text-[11px] text-slate-600 font-medium mt-1">In progress on the road</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#003893]/25 transition-all shadow-sm">
                <p className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">Total Earnings</p>
                <p className="text-2xl font-bold text-[#003893] font-mono">₹{(statsData.businessStats?.totalRevenue || 0).toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-600 font-medium mt-1">Completed ride fares</p>
              </div>
            </div>

            {/* Dynamic SVG business chart */}
            <BusinessAnalyticsChart data={statsData.chartData} />
          </>
        ) : null}
      </div>
    </>
  );
};

export default AdminOverview;
