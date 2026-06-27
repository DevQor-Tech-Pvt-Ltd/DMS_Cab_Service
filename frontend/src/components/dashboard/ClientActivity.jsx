import React, { useState } from 'react';
import ImageWithFallback from '../ImageWithFallback';
import { Car, Clock, Star } from '../../utils/icons';

const ClientActivity = ({
  ridesList,
  ridesLoading,
  resendingOtpId,
  searchQuery,
  getFilteredRides,
  handleResendOtp,
  handleOpenRatingModal,
  navigate
}) => {
  const [activeActivityTab, setActiveActivityTab] = useState('past');

  const getVehicleImage = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('innova')) return '/innova2.jpg';
    if (t.includes('ertiga')) return '/ertiga2.jpg';
    if (t.includes('dzire') || t.includes('desire') || t.includes('msdesire')) return '/msdesire.jpg';
    if (t.includes('v-class') || t.includes('v class') || t.includes('van')) return '/ertiga2.jpg';
    if (t.includes('range rover') || t.includes('rover') || t.includes('suv')) return '/innova2.jpg';
    return '/ertiga2.jpg';
  };

  const filteredRides = getFilteredRides().filter(ride => {
    const status = (ride.status || '').toLowerCase();
    if (activeActivityTab === 'upcoming') {
      return ['pending', 'driver_assigned', 'driver_arrived', 'ride_started'].includes(status);
    } else {
      return ['completed', 'cancelled'].includes(status);
    }
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Ride Activity</h2>
          <p className="text-xs text-slate-400 mt-1">Review your recent movements and trip expenses.</p>
        </div>
      </div>

      {/* Tab switcher: Past / Upcoming */}
      <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-full max-w-xs">
        <button
          onClick={() => setActiveActivityTab('past')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${activeActivityTab === 'past' ? 'bg-[#003893]/10 border border-[#003893]/20 text-[#003893]' : 'text-slate-500 hover:text-[#003893] border border-transparent'}`}
        >
          Past
        </button>
        <button
          onClick={() => setActiveActivityTab('upcoming')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${activeActivityTab === 'upcoming' ? 'bg-[#003893]/10 border border-[#003893]/20 text-[#003893]' : 'text-slate-500 hover:text-[#003893] border border-transparent'}`}
        >
          Upcoming
        </button>
      </div>

      {/* Activity list */}
      <div className="space-y-4">
        {ridesLoading ? (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-2xl">
            <div className="w-8 h-8 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs">Loading rides history...</p>
          </div>
        ) : ridesList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
            <Car size={32} className="mx-auto mb-2 opacity-35" />
            <p className="text-xs">No journeys logged yet.</p>
            <button onClick={() => navigate('/get-started')} className="text-xs text-[#003893] font-bold mt-2 hover:underline">Book your first ride now</button>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
            <Car size={32} className="mx-auto mb-2 opacity-35" />
            {searchQuery.trim() ? (
              <p className="text-xs">No {activeActivityTab} journeys match your search query: "{searchQuery}"</p>
            ) : activeActivityTab === 'upcoming' ? (
              <>
                <p className="text-xs">You have no active or upcoming bookings.</p>
                <button onClick={() => navigate('/get-started')} className="text-xs text-[#003893] font-bold mt-2 hover:underline">Book a new ride now</button>
              </>
            ) : (
              <>
                <p className="text-xs">No completed or cancelled journeys logged yet.</p>
                <button onClick={() => navigate('/get-started')} className="text-xs text-[#003893] font-bold mt-2 hover:underline">Book a ride now</button>
              </>
            )}
          </div>
        ) : (
          filteredRides.map((ride, idx) => {
            const hasDriver = ride.driver && ride.driver.fullName;
            const isCompleted = ride.status === 'completed';
            const isCancelled = ride.status === 'cancelled';
            const isRated = !!ride.rating;

            return (
              <div key={ride._id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-[#003893]/20 transition-all shadow-sm">
                {/* Vehicle Image */}
                <div className="w-full md:w-48 h-40 md:h-auto overflow-hidden relative bg-black/5 shrink-0">
                  <ImageWithFallback src={getVehicleImage(ride.vehicleType)} alt={ride.vehicleType} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-2 left-2 bg-[#003893] px-2 py-0.5 rounded text-white border border-[#003893]/10">
                    <span className="text-[9px] font-semibold tracking-wider uppercase">{ride.vehicleType || 'Premium XL'}</span>
                  </div>
                </div>

                {/* Details content */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isCompleted
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                          : isCancelled
                            ? 'bg-red-100 text-red-600 border border-red-200'
                            : 'bg-amber-100 text-amber-600 border border-amber-200 animate-pulse'
                          }`}>{ride.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ride.pickupDate} • {ride.pickupTime}</span>
                      </div>

                      <div className="flex items-start space-x-3 mt-4 text-xs text-slate-600">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div className="w-[1px] h-6 bg-slate-200 my-0.5" />
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-slate-800">{ride.pickupLocation}</p>
                          <p className="font-semibold text-slate-800">{ride.dropoffLocation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-serif font-bold text-slate-800">₹{(ride.fare || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{ride.paymentMethod} • {ride.paymentStatus}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px] text-slate-400 font-medium">
                    <div className="flex space-x-4">
                      <span>⏱️ {isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'Active'}</span>
                      {hasDriver ? (
                        <span>📍 Assigned Chauffeur: {ride.driver.fullName} ({ride.driver.vehicleNumber})</span>
                      ) : (
                        <span>📍 Chauffeur: Pending Allocation</span>
                      )}
                    </div>

                    <div className="flex space-x-4 items-center">
                      {isCompleted && !isRated && (
                        <button
                          onClick={() => handleOpenRatingModal(ride._id)}
                          className="bg-[#003893] text-white px-3 py-1 rounded-lg text-[9px] uppercase font-bold tracking-wider hover:bg-[#002d72] transition-colors cursor-pointer"
                        >
                          Rate Trip
                        </button>
                      )}
                      {isCompleted && isRated && (
                        <div className="flex flex-col items-end">
                          <span className="text-amber-500 font-bold text-[9px] uppercase tracking-wider flex items-center">
                            ⭐ {ride.rating}/5 Rated
                          </span>
                          {ride.ratingTags && ride.ratingTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5 justify-end max-w-[200px]">
                              {ride.ratingTags.map((tag, tIdx) => (
                                <span key={tIdx} className="bg-slate-200/70 text-slate-600 text-[7.5px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {['driver_assigned', 'driver_arrived'].includes(ride.status) && (
                        <button
                          onClick={() => handleResendOtp(ride._id)}
                          disabled={resendingOtpId === ride._id}
                          className="text-xs font-bold text-[#003893] hover:text-[#002d72] hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          {resendingOtpId === ride._id ? 'Resending...' : 'Resend OTP Email'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/get-started', { state: { pickupLocation: ride.pickupLocation, dropoffLocation: ride.dropoffLocation } })}
                        className="text-[#003893] hover:text-[#002d72] uppercase font-bold text-[9px] tracking-wider"
                      >
                        Rebook Trip
                      </button>
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

export default ClientActivity;
