import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, CalendarCheck, Star,
  Car, DollarSign, Navigation, Phone, Shield,
  CheckCircle, XCircle, TrendingUp, Route,
  CircleDot, Timer, Wallet
} from '../../utils/icons';
import TrackingMap from '../TrackingMap';
import DriverOtpVerification from '../DriverOtpVerification';
import { useIsMobile } from '../../utils/motion';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => {
  const isMobile = useIsMobile();
  return (
    <motion.div
      initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isMobile ? { duration: 0 } : { duration: 0.5, delay }}
      className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#003893]/20 shadow-sm transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  );
};

const StatCardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden animate-pulse shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100"></div>
    </div>
    <div className="w-20 h-8 bg-slate-100 rounded-lg mb-2"></div>
    <div className="w-28 h-4 bg-slate-100 rounded-md"></div>
    <div className="w-24 h-3 bg-slate-100 rounded mt-2"></div>
  </div>
);

const DriverOverview = ({
  user,
  isOnline,
  setIsOnline,
  rideCancelStatus,
  rideNotifications,
  notificationStatus,
  handleAcceptRide,
  handleDeclineRide,
  ridesError,
  fetchCurrentRides,
  ridesLoading,
  stats,
  activeRide,
  currentRide,
  distanceToDestination,
  handleDistanceUpdate,
  handleCancelPickup,
  handleDriverArrived,
  btnLoading,
  showOtpModal,
  setShowOtpModal,
  handleCompleteRide,
  setActiveRide,
  setAllRides,
  upcomingAssignments,
  weeklyEarnings,
  maxEarning,
  avgRating,
  ratedRides,
  recentReviews
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="max-w-7xl mx-auto text-left">
      {/* Header */}
      <motion.div
        initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={isMobile ? { duration: 0 } : { duration: 0.4 }}
        className="mb-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#003893]/10 flex items-center justify-center text-[#003893] text-lg font-bold font-serif">
                {user.fullName?.charAt(0) || 'D'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif text-slate-800">
                  <span className="text-[#003893]">{user.fullName?.split(' ')[0]}</span>'s Command Center
                </h1>
                <p className="text-slate-500 text-sm">Chauffeur Dashboard</p>
              </div>
            </div>
          </div>

          {/* Online/Offline Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${isOnline
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
          >
            <CircleDot size={18} className={isOnline ? 'animate-pulse' : ''} />
            <span>{isOnline ? 'Online — Accepting Rides' : 'Offline — Not Accepting'}</span>
          </button>
        </div>
      </motion.div>

      {/* Ride Cancel Toast Alert */}
      <AnimatePresence>
        {rideCancelStatus && (
          <motion.div
            initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
            transition={isMobile ? { duration: 0 } : undefined}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center space-x-2 text-sm font-bold uppercase tracking-wider"
          >
            <span>{rideCancelStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Booking Notifications */}
      <AnimatePresence>
        {rideNotifications.map((ride) => {
          const status = notificationStatus[ride._id];
          return (
            <motion.div
              key={ride._id}
              initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={isMobile ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
              transition={isMobile ? { duration: 0 } : undefined}
              className={`mb-6 p-6 rounded-2xl border shadow-lg relative overflow-hidden transition-all duration-300 ${status === 'booking has taken'
                ? 'bg-red-55 border-red-200 text-red-700'
                : status === 'booking confirmed by me'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 shadow-slate-100'
                }`}
            >
              {/* Visual Accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status === 'booking has taken'
                ? 'bg-red-500'
                : status === 'booking confirmed by me'
                  ? 'bg-emerald-500'
                  : 'bg-[#003893]'
                }`} />

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full font-mono font-semibold text-slate-500">
                      RIDE REQUEST: {ride._id.substring(0, 8)}...
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#003893]/10 text-[#003893] rounded-full uppercase tracking-wider font-bold">
                      {ride.vehicleType}
                    </span>
                  </div>

                  <div className="text-sm font-sans space-y-1">
                    <p className="text-slate-800"><strong className="text-slate-500">Passenger:</strong> {ride.passengerDetails?.fullName} ({ride.passengerDetails?.phone})</p>
                    <p className="text-slate-600"><strong className="text-slate-500">Pickup:</strong> {ride.pickupLocation}</p>
                    <p className="text-slate-600"><strong className="text-slate-500">Drop-off:</strong> {ride.dropoffLocation}</p>
                    {ride.passengerDetails?.specialInstructions && (
                      <p className="text-xs text-slate-400 italic">"{ride.passengerDetails.specialInstructions}"</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-mono text-[9px]">Chauffeur Fare</span>
                    <span className="text-2xl font-bold text-[#003893]">₹{ride.fare.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2">
                    {status ? (
                      <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase tracking-wider">
                        {status}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAcceptRide(ride._id)}
                          className="bg-[#003893] text-white hover:bg-[#002d72] px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-[#003893]/10"
                        >
                          Accept Pickup
                        </button>
                        <button
                          onClick={() => handleDeclineRide(ride._id)}
                          className="border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 px-4 py-2.5 rounded-xl text-xs transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Notifications */}
      {ridesError && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex justify-between items-center">
          <span>{ridesError}</span>
          <button
            onClick={() => fetchCurrentRides(true)}
            className="px-3 py-1 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors border border-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {ridesLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={index * 0.1} />
          ))
        )}
      </div>

      {/* Current Ride + Upcoming Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Active Ride */}
        <motion.div
          initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={isMobile ? { duration: 0 } : { duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Navigation size={20} className="text-[#003893]" />
              <h2 className="text-lg font-serif text-slate-800">Current Ride</h2>
              <span className="text-xs bg-[#003893]/10 text-[#003893] px-2 py-0.5 rounded-full font-medium animate-pulse">
                In Progress
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">{currentRide?.id}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
            {activeRide ? (
              <>
                {/* Passenger Info */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {activeRide.passengerDetails?.fullName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">{activeRide.passengerDetails?.fullName}</p>
                      <p className="text-xs text-slate-500">Passenger • {activeRide.passengerDetails?.phone}</p>
                    </div>
                  </div>
                  <a href={`tel:${activeRide.passengerDetails?.phone}`} className="flex items-center space-x-2 bg-[#003893]/10 text-[#003893] px-4 py-2 rounded-lg hover:bg-[#003893]/20 transition-colors text-sm">
                    <Phone size={14} />
                    <span>Call</span>
                  </a>
                </div>

                {/* Route */}
                <div className="flex items-start space-x-3 mb-5">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></div>
                    <div className="w-[2px] h-10 bg-gradient-to-b from-emerald-500/50 to-red-500/50 my-1"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-500/20"></div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Pickup</p>
                      <p className="text-sm text-slate-800">{activeRide.pickupLocation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Drop-off</p>
                      <p className="text-sm text-slate-800">{activeRide.dropoffLocation}</p>
                    </div>
                  </div>
                </div>

                {/* Ride Details */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-slate-500 text-xs mb-1">
                      <Route size={12} />
                      <span>Vehicle</span>
                    </div>
                    <p className="text-slate-800 font-semibold text-xs truncate">{activeRide.vehicleType}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-slate-500 text-xs mb-1">
                      <Clock size={12} />
                      <span>Date/Time</span>
                    </div>
                    <p className="text-slate-800 font-semibold text-[10px]">{activeRide.pickupDate} {activeRide.pickupTime}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-slate-500 text-xs mb-1">
                      <Wallet size={12} />
                      <span>Fare</span>
                    </div>
                    <p className="text-[#003893] font-semibold">₹{activeRide.fare.toLocaleString()}</p>
                  </div>
                </div>

                {/* Ride Live Tracking Map */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Live Route Tracking Map</p>
                    {activeRide.status === 'ride_started' && distanceToDestination !== null && (
                      <span className="text-[11px] font-bold text-[#003893] bg-[#003893]/10 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                        Destination: {(distanceToDestination / 1000).toFixed(2)} km away
                      </span>
                    )}
                  </div>
                  <div className="relative bg-slate-50 border border-slate-200 rounded-2xl h-80 overflow-hidden shadow-inner">
                    <TrackingMap
                      role="driver"
                      rideId={activeRide?._id}
                      userId={user?._id}
                      pickupLocation={activeRide?.pickupLocation}
                      dropoffLocation={activeRide?.dropoffLocation}
                      onDistanceUpdate={handleDistanceUpdate}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  {activeRide.status === 'driver_assigned' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => handleCancelPickup(activeRide._id)}
                        className="w-full sm:flex-1 flex items-center justify-center space-x-2 bg-red-50 border border-red-250 text-red-650 py-3.5 rounded-xl hover:bg-red-100/50 transition-colors font-semibold text-sm cursor-pointer"
                      >
                        <XCircle size={16} />
                        <span>Cancel Pickup</span>
                      </button>
                      <button
                        onClick={() => handleDriverArrived(activeRide._id)}
                        disabled={btnLoading}
                        className="w-full sm:flex-1 flex items-center justify-center space-x-2 bg-[#003893] text-white py-3.5 rounded-xl hover:bg-[#002d72] transition-colors font-bold text-sm cursor-pointer disabled:opacity-50"
                      >
                        {btnLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            <span>I Have Arrived</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {activeRide.status === 'driver_arrived' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => handleCancelPickup(activeRide._id)}
                        className="w-full sm:flex-1 flex items-center justify-center space-x-2 bg-red-50 border border-red-250 text-red-650 py-3.5 rounded-xl hover:bg-red-100/50 transition-colors font-semibold text-sm cursor-pointer"
                      >
                        <XCircle size={16} />
                        <span>Cancel Pickup</span>
                      </button>
                      <button
                        onClick={() => setShowOtpModal(true)}
                        className="w-full sm:flex-1 flex items-center justify-center space-x-2 bg-[#003893] text-white py-3.5 rounded-xl hover:bg-[#002d72] transition-colors font-bold text-sm animate-pulse cursor-pointer"
                      >
                        <Shield size={16} />
                        <span>Start Ride (Enter OTP)</span>
                      </button>
                    </div>
                  )}

                  {activeRide.status === 'ride_started' && (
                    <div className="space-y-3">
                      {distanceToDestination !== null && distanceToDestination <= 500 ? (
                        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-center text-xs text-emerald-800 font-bold mb-2 animate-pulse flex items-center justify-center space-x-1">
                          <span>🎉</span>
                          <span>Arrived at Destination! Please complete the luxury ride.</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs text-blue-700 font-semibold mb-2">
                          OTP Verified. Chauffeur Navigation Active.
                        </div>
                      )}
                      <button
                        onClick={() => handleCompleteRide(activeRide._id)}
                        disabled={btnLoading}
                        className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl transition-all font-bold text-sm cursor-pointer disabled:opacity-50 text-white ${distanceToDestination !== null && distanceToDestination <= 500
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 border border-emerald-400 ring-2 ring-emerald-300 ring-offset-2 animate-bounce'
                            : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
                      >
                        {btnLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            <span>Complete Luxury Ride</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* OTP Verification Modal Overlay */}
                {showOtpModal && (
                  <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 pt-20">
                    <div className="w-full max-w-md">
                      <DriverOtpVerification
                        bookingId={activeRide._id}
                        clientName={activeRide.passengerDetails?.fullName || 'Client'}
                        onVerificationSuccess={(updatedRide) => {
                          setActiveRide(updatedRide);
                          setAllRides(current => current.map(r => r._id === updatedRide._id ? updatedRide : r));
                          setShowOtpModal(false);
                        }}
                        onCancel={() => setShowOtpModal(false)}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 font-sans">
                <Navigation size={32} className="mx-auto mb-2 text-[#003893] animate-pulse" />
                <p className="text-sm text-slate-600">No active luxury trip currently.</p>
                <p className="text-xs text-slate-400 mt-1">Accept an incoming passenger request above to begin.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Assignments */}
        <motion.div
          initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={isMobile ? { duration: 0 } : { duration: 0.5, delay: 0.5 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-6">
            <CalendarCheck size={20} className="text-[#003893]" />
            <h2 className="text-lg font-serif text-slate-800">Upcoming</h2>
            <span className="text-xs bg-[#003893]/10 text-[#003893] px-2 py-0.5 rounded-full font-medium">
              {upcomingAssignments.length}
            </span>
          </div>
          <div className="space-y-3" style={{ contain: 'layout paint' }}>
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 border border-dashed border-slate-200 rounded-xl font-sans">
                <CalendarCheck size={28} className="mx-auto mb-2 text-[#003893]/40" />
                <p className="text-slate-600">No upcoming assignments</p>
                <p className="text-xs text-slate-400 mt-1">Pending trips assigned to you will show up here.</p>
              </div>
            ) : (
              upcomingAssignments.map((ride) => (
                <div
                  key={ride.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#003893]/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-400">{ride.id}</span>
                    <span className="text-xs text-[#003893] font-medium">{ride.fare}</span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium mb-1">{ride.passenger}</p>
                  <p className="text-xs text-slate-500 mb-2">{ride.time}</p>
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <MapPin size={11} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{ride.pickup}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                    <MapPin size={11} className="text-red-500 shrink-0" />
                    <span className="truncate">{ride.drop}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Weekly Earnings + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Earnings Chart */}
        <motion.div
          initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={isMobile ? { duration: 0 } : { duration: 0.5, delay: 0.6 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <DollarSign size={20} className="text-[#003893]" />
              <h2 className="text-lg font-serif text-slate-800">Weekly Earnings</h2>
            </div>
            <span className="text-sm text-emerald-600 font-medium">
              ₹{weeklyEarnings.reduce((a, b) => a + b.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-end justify-between space-x-2 h-44">
            {weeklyEarnings.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <span className="text-[10px] text-slate-500 mb-2">₹{(day.amount / 1000).toFixed(1)}k</span>
                <div className="w-full relative group">
                  <div
                    className="w-full bg-gradient-to-t from-[#003893] to-[#3b82f6] rounded-lg transition-all duration-300 hover:opacity-80 cursor-pointer"
                    style={{ height: `${(day.amount / maxEarning) * 120}px` }}
                  ></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.rides} rides
                  </div>
                </div>
                <span className="text-xs text-slate-500 mt-2">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total: {weeklyEarnings.reduce((a, b) => a + b.rides, 0)} rides</span>
            <span>Avg: ₹{Math.round(weeklyEarnings.reduce((a, b) => a + b.amount, 0) / 7).toLocaleString()}/day</span>
          </div>
        </motion.div>

        {/* Recent Reviews */}
        <motion.div
          initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={isMobile ? { duration: 0 } : { duration: 0.5, delay: 0.7 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Star size={20} className="text-[#003893]" />
              <h2 className="text-lg font-serif text-slate-800">Recent Reviews</h2>
            </div>
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-[#f2b705] fill-[#f2b705]" />
              <span className="text-sm text-slate-800 font-medium">{avgRating}</span>
              <span className="text-xs text-slate-400">({ratedRides.length})</span>
            </div>
          </div>
          <div className="space-y-4" style={{ contain: 'layout paint' }}>
            {recentReviews.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Star className="mx-auto mb-2 text-slate-400 animate-pulse" size={24} />
                <p>No client reviews yet.</p>
                <p className="text-xs text-slate-400 mt-1">Passenger feedback will appear here once trips are completed and rated.</p>
              </div>
            ) : (
              recentReviews.map((review, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {review.passenger.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-800 font-medium">{review.passenger}</span>
                    </div>
                    <span className="text-xs text-slate-400">{review.date}</span>
                  </div>
                  <div className="flex items-center space-x-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < review.rating ? 'text-[#f2b705] fill-[#f2b705]' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic mb-2">"{review.comment}"</p>
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {review.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="bg-[#003893]/10 text-[#003893] text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#003893]/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Vehicle Info */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <Car size={18} className="text-[#003893]" />
              <span className="text-sm font-semibold text-[#003893]">Your Vehicle</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Model</p>
                <p className="text-slate-800 font-medium">{user.vehicleType || 'Mercedes S-Class'}</p>
              </div>
              <div>
                <p className="text-slate-400">Plate No.</p>
                <p className="text-slate-800 font-medium font-mono">{user.vehicleNumber || 'WB-02-AB-1234'}</p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <p className="text-emerald-600 font-medium">Active</p>
              </div>
              <div>
                <p className="text-slate-400">License Number</p>
                <p className="text-[#003893] font-medium font-mono">{user.licenseNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DriverOverview;
