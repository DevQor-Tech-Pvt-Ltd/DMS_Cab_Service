import React from 'react';
import { Car, Clock } from '../../utils/icons';

const DriverActivity = ({
  ridesLoading,
  getFilteredDriverRides,
  searchQuery,
  setSearchQuery
}) => {
  const filteredRides = getFilteredDriverRides();

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Your Ride Log</h2>
          <p className="text-xs text-slate-400 mt-1">Review all your completed, cancelled, and active chauffeured journeys.</p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by passenger, route, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-4">
        {ridesLoading ? (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-2xl">
            <div className="w-8 h-8 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs">Loading rides log...</p>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
            <Car size={32} className="mx-auto mb-2 opacity-35" />
            <p className="text-sm font-medium text-slate-600">No journeys logged yet.</p>
            <p className="text-xs text-slate-400 mt-1">Pending trips assigned to you will appear here after completion.</p>
          </div>
        ) : (
          filteredRides.map((ride, idx) => {
            const isCompleted = ride.status === 'completed';
            const isCancelled = ride.status === 'cancelled';
            const rideIdShort = `#RD-${ride._id.substring(18, 24).toUpperCase()}`;

            return (
              <div key={ride._id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-[#003893]/20 transition-all shadow-sm">
                {/* Left Detail strip */}
                <div className="bg-[#003893]/5 border-r border-slate-200 p-6 flex flex-col justify-center items-center shrink-0 w-full md:w-44 text-center">
                  <span className="text-xs font-mono text-slate-400 block mb-1">{rideIdShort}</span>
                  <span className="text-2xl font-bold text-[#003893] block">₹{ride.fare.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mt-1">{ride.vehicleType}</span>
                </div>

                {/* Route & Passenger Detail */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${isCompleted
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                          : isCancelled
                            ? 'bg-red-100 text-red-600 border border-red-200'
                            : 'bg-blue-100 text-blue-600 border border-blue-200'
                          }`}>
                          {ride.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">{ride.pickupDate} • {ride.pickupTime}</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 text-left mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="truncate"><strong className="text-slate-500">From:</strong> {ride.pickupLocation}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="truncate"><strong className="text-slate-500">To:</strong> {ride.dropoffLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Passenger Details */}
                    <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-left shrink-0 w-full md:w-56">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Passenger Details</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{ride.passengerDetails?.fullName || 'Client'}</p>
                      <p className="text-xs text-slate-500">{ride.passengerDetails?.phone}</p>
                      {ride.feedback && (
                        <div className="mt-2 bg-white/60 p-2 rounded-lg border border-slate-100 text-[11px] italic text-slate-500">
                          "{ride.feedback}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DriverActivity;
