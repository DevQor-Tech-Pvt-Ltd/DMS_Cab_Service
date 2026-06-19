import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ChevronRight, ArrowRight, Heart, Navigation } from '../../utils/icons';
import TrackingMap from '../TrackingMap';

const ClientOverview = ({
  user,
  activeRide,
  savedAddresses,
  ridesList,
  totalRidesCount,
  navigate,
  handleTabChange,
  renderActiveRideCard,
  getAddressIcon
}) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Responsive mobile vs desktop view inside the component
  return (
    <div className="space-y-6 text-left">
      {/* Weather / Time / Kolkata header row */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
        <div className="space-y-1">
          <div className="text-xs text-[#003893] font-medium flex items-center justify-center space-x-1">
            <span>☀️</span>
            <span>28°C</span>
          </div>
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Partly Cloudy</div>
        </div>
        <div className="space-y-1 border-x border-slate-200">
          <div className="text-xs text-slate-800 font-mono font-semibold">{formattedTime}</div>
          <div className="text-[9px] text-slate-500 font-semibold uppercase">{formattedDate}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-[#003893] font-medium truncate px-1">Kolkata</div>
          <div className="text-[9px] text-slate-500 font-semibold uppercase">West Bengal</div>
        </div>
      </div>

      {/* Main Grid: Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative bg-slate-50 border border-slate-200 rounded-2xl h-80 lg:h-[384px] overflow-hidden shadow-inner">
            <TrackingMap 
              role="client" 
              rideId={activeRide?._id} 
              userId={user?._id} 
              pickupLocation={activeRide?.pickupLocation}
              dropoffLocation={activeRide?.dropoffLocation}
            />
          </div>

          {activeRide ? renderActiveRideCard(activeRide) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-slate-800 font-serif text-lg font-bold">Where to?</h3>
                <button onClick={() => handleTabChange('activity')} className="text-xs text-[#003893] flex items-center space-x-1">
                  <Clock size={12} />
                  <span>History</span>
                </button>
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  readOnly
                  onClick={() => navigate('/get-started')}
                  placeholder="Enter destination"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-xs text-slate-800 cursor-pointer placeholder-slate-400"
                />
              </div>

              {/* Preset location items */}
              <div className="space-y-1">
                {savedAddresses.map((addr) => {
                  const AddrIcon = getAddressIcon(addr.icon);
                  return (
                    <div
                      key={addr.label}
                      onClick={() => navigate('/get-started', { state: { pickupLocation: '', dropoffLocation: addr.address } })}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 active:bg-slate-50 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#003893]/10 flex items-center justify-center shrink-0">
                          <AddrIcon size={14} className="text-[#003893]" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">{addr.label}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{addr.address}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-[#003893]" />
                    </div>
                  );
                })}
              </div>

              <Link
                to="/get-started"
                className="w-full bg-[#003893] text-white hover:bg-[#002d72] font-bold py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <span>Book a Ride Now</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* Info Column (Desktop Sidebar equivalent) */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          {/* Stats Box */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total Rides</span>
              <h3 className="text-3xl font-serif text-slate-800 font-bold mt-1">{totalRidesCount}</h3>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <span className="text-[10px] text-[#003893] font-bold uppercase tracking-widest block">Member Status</span>
              <h3 className="text-xl font-serif text-[#003893] font-bold mt-1">Gold Member</h3>
            </div>
          </div>

          {/* Quick Go Shortcuts */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Quick Shortcuts</h4>
            <button
              onClick={() => navigate('/get-started', { state: { pickupLocation: '', dropoffLocation: '221B, Southern Avenue, Kalighat' } })}
              className="w-full bg-white border border-slate-100 hover:border-[#003893]/30 p-3 rounded-xl flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#003893]/10 flex items-center justify-center text-[#003893] shrink-0">
                  <Heart size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800">Go Home</h4>
                  <p className="text-[9px] text-slate-400 truncate">221B, Southern Avenue, Kalighat</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-[#003893] shrink-0" />
            </button>

            <button
              onClick={() => navigate('/get-started', { state: { pickupLocation: '', dropoffLocation: 'TCS Tower, Action Area II, New Town' } })}
              className="w-full bg-white border border-slate-100 hover:border-[#003893]/30 p-3 rounded-xl flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Navigation size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800">Office</h4>
                  <p className="text-[9px] text-slate-400 truncate">TCS Tower, Action Area II, New Town</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-[#003893] shrink-0" />
            </button>
          </div>

          {/* Refer a friend */}
          <div className="bg-gradient-to-r from-[#003893]/5 to-transparent border border-[#003893]/10 rounded-2xl p-5 relative overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800">Refer a friend</h4>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Get ₹200 credit for every new premium member you refer.</p>
            <button className="text-[10px] text-[#003893] font-bold uppercase mt-3 flex items-center space-x-1 hover:underline">
              <span>Share Link</span>
              <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOverview;
