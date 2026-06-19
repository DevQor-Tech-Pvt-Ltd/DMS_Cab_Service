import React from 'react';
import {
  Activity, Clock, BarChart3, Users, CheckCircle, Shield, UserCheck, XCircle, AlertTriangle
} from '../../utils/icons';

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

const AdminLogs = ({
  statsData,
  visibleLogsCount,
  setVisibleLogsCount
}) => {
  if (!statsData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Activity */}
      <div className="lg:col-span-2 bg-[#FDE77B] border-2 border-[#003893]/20 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity size={20} className="text-[#003893]" />
            <h2 className="text-lg font-serif text-[#003893] font-bold">System Activity Logs</h2>
          </div>
        </div>
        <div className="space-y-1">
          {!statsData?.activities || statsData.activities.length === 0 ? (
            <div className="text-center py-8 text-slate-800 text-sm font-semibold">
              No system activity logs recorded yet.
            </div>
          ) : (
            <>
              {statsData.activities.slice(0, visibleLogsCount).map((activity, index) => {
                const colorMap = {
                  success: 'text-white bg-emerald-700 shadow-sm border border-emerald-800',
                  info: 'text-white bg-[#003893] shadow-sm border border-[#003893]/20',
                  warning: 'text-white bg-amber-600 shadow-sm border border-amber-700',
                  error: 'text-white bg-red-600 shadow-sm border border-red-700',
                };
                const colors = colorMap[activity.type] || colorMap.info;
                const ActivityIcon = iconMap[activity.iconName] || Clock;
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
                      <ActivityIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-slate-900 font-bold truncate">{activity.text}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-800 font-bold shrink-0">
                      <Clock size={12} />
                      <span>{formatRelativeTime(activity.time)}</span>
                    </div>
                  </div>
                );
              })}
              {statsData.activities.length > visibleLogsCount && (
                <div className="mt-4 pt-2 border-t border-[#003893]/15 flex justify-center">
                  <button
                    onClick={() => setVisibleLogsCount(prev => prev + 3)}
                    className="w-full py-2 bg-white border border-[#003893]/35 text-[#003893] hover:bg-[#003893] hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Load More Logs (+3)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Stats Sidebar */}
      <div className="bg-[#FDE77B] border-2 border-[#003893]/20 rounded-2xl p-6 shadow-md animate-none">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 size={20} className="text-[#003893]" />
          <h2 className="text-lg font-serif text-[#003893] font-bold">Chauffeur Quality Index</h2>
        </div>
        <div className="space-y-5 text-left">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-900 font-bold">Application Success Rate</span>
              <span className="text-[#003893] font-extrabold">
                {statsData?.qualityIndex ? `${statsData.qualityIndex.applicationSuccessRate}%` : '100%'}
              </span>
            </div>
            <div className="h-2 bg-white border border-[#003893]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#003893] to-[#f2b705] rounded-full transition-all duration-500"
                style={{ width: `${statsData?.qualityIndex ? statsData.qualityIndex.applicationSuccessRate : 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-900 font-bold">Document Authenticity Index</span>
              <span className="text-[#003893] font-extrabold">
                {statsData?.qualityIndex ? `${statsData.qualityIndex.documentAuthenticityIndex}%` : '100%'}
              </span>
            </div>
            <div className="h-2 bg-white border border-[#003893]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${statsData?.qualityIndex ? statsData.qualityIndex.documentAuthenticityIndex : 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-900 font-bold">Background Verification Check</span>
              <span className="text-[#003893] font-extrabold">
                {statsData?.qualityIndex ? `${statsData.qualityIndex.backgroundVerificationCheck}%` : '100%'}
              </span>
            </div>
            <div className="h-2 bg-white border border-[#003893]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${statsData?.qualityIndex ? statsData.qualityIndex.backgroundVerificationCheck : 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
