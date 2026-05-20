import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, CalendarCheck, Star,
  Car, CreditCard, ChevronRight, Heart,
  Navigation, Phone, Shield, Award,
  History, Plus, ArrowRight
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import TrackingMap from '../components/TrackingMap';
import io from 'socket.io-client';
import axios from 'axios';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-[#111620] border border-white/5 rounded-2xl p-6 hover:border-[#d4af37]/20 transition-all duration-300"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </motion.div>
);

const ClientDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ridesList, setRidesList] = useState([]);
  const [resendingOtpId, setResendingOtpId] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Rating states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Redirect to home page if not authenticated (e.g. on logout)
  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Load user saved addresses from localStorage
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`dms_luxe_addresses_${user._id}`);
    if (saved) {
      setSavedAddresses(JSON.parse(saved));
    } else {
      setSavedAddresses([]);
    }
  }, [user]);

  const handleAddAddress = () => {
    const label = prompt("Enter Address Label (e.g. Home, Office, Airport):");
    if (!label) return;
    const address = prompt(`Enter Address Details for ${label}:`);
    if (!address) return;

    const newAddr = {
      label,
      address,
      icon: label.toLowerCase().includes('home') ? 'heart' : label.toLowerCase().includes('office') ? 'office' : 'map'
    };

    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    localStorage.setItem(`dms_luxe_addresses_${user._id}`, JSON.stringify(updated));
  };

  useEffect(() => {
    // If the auth session is loading/null, wait to prevent fetching without active token
    if (!user) return;

    const fetchRides = async () => {
      try {
        const token = localStorage.getItem('dms_luxe_token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response.data.success) {
          setRidesList(response.data.rides);
        }
      } catch (err) {
        console.error('Failed to fetch client rides:', err);
      }
    };
    fetchRides();
  }, [user]);

  // Handle real-time socket events for client rides
  useEffect(() => {
    if (!user || ridesList.length === 0) return;

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    // Listen to updates for all client rides
    ridesList.forEach(ride => {
      socket.on(`ride_status_${ride._id}`, (data) => {
        setRidesList(prev => 
          prev.map(r => r._id === ride._id ? { ...r, ...data } : r)
        );
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, ridesList.length]);

  // Loading Screen: displayed while the user session is loading from local storage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a11] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#d4af37] font-serif text-sm tracking-wider uppercase animate-pulse">Loading Client Command Center...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Format live rides from database
  const liveRides = ridesList.map(r => ({
    _id: r._id,
    id: `#RD-${r._id.substring(18, 24).toUpperCase()}`,
    date: r.pickupDate,
    time: r.pickupTime,
    pickup: r.pickupLocation,
    drop: r.dropoffLocation,
    vehicle: r.vehicleType,
    driver: r.driver ? r.driver.fullName : 'Pending Assignment',
    status: r.status,
    phone: r.driver ? r.driver.phone : '',
    paymentMethod: r.paymentMethod,
    paymentStatus: r.paymentStatus,
    fare: r.fare || 0,
    rating: r.rating
  }));

  // Filter actual active and upcoming bookings
  const upcomingRides = liveRides.filter(r => 
    ['pending', 'accepted', 'driver_assigned', 'driver_arrived', 'ride_started'].includes(r.status)
  );

  // Filter completed and cancelled ride history
  const rideHistory = liveRides.filter(r => 
    ['completed', 'cancelled'].includes(r.status)
  ).map(r => ({
    _id: r._id,
    id: r.id,
    date: r.date,
    from: r.pickup,
    to: r.drop,
    amount: `₹${r.fare ? r.fare.toLocaleString() : '0'}`,
    status: r.status,
    rating: r.rating
  }));

  const handleOpenRatingModal = (rideId) => {
    setSelectedRideId(rideId);
    setUserRating(5);
    setHoverRating(0);
    setFeedbackText('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!selectedRideId) return;

    setRatingSubmitting(true);
    try {
      const token = localStorage.getItem('dms_luxe_token');
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides/${selectedRideId}/rate`,
        {
          rating: userRating,
          feedback: feedbackText
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setRidesList(prev =>
          prev.map(r => r._id === selectedRideId ? { ...r, rating: userRating, feedback: feedbackText } : r)
        );
        setShowRatingModal(false);
        alert('Thank you for rating your ride!');
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
      alert(err.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Action helper to resend OTP
  const handleResendOtp = async (rideId) => {
    setResendingOtpId(rideId);
    try {
      const token = localStorage.getItem('dms_luxe_token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides/${rideId}/resend-otp`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        alert('A fresh verification OTP has been emailed to you.');
      }
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      alert(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendingOtpId(null);
    }
  };

  // Helper to map saved address icons
  const getAddressIcon = (iconName) => {
    switch (iconName) {
      case 'heart':
      case 'home':
        return Heart;
      case 'office':
      case 'navigation':
        return Navigation;
      default:
        return MapPin;
    }
  };

  // Compute dynamic user analytics stats
  const totalRides = ridesList.length;
  const upcomingCount = upcomingRides.length;

  const ratedRides = ridesList.filter(r => r.rating);
  const avgRating = ratedRides.length > 0
    ? (ratedRides.reduce((sum, r) => sum + r.rating, 0) / ratedRides.length).toFixed(1)
    : '5.0';

  const totalSpentAmount = ridesList
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.fare || 0), 0);

  // loyalty points calculations: 1 point for every ₹20 spent on completed luxury travels
  const loyaltyPoints = Math.floor(totalSpentAmount / 20);
  const nextTierPoints = loyaltyPoints < 1000 ? 1000 : loyaltyPoints < 2500 ? 2500 : 5000;
  const tierName = loyaltyPoints < 1000 ? 'Bronze Member' : loyaltyPoints < 2500 ? 'Silver Member' : 'Gold Member';
  const percentageToNext = Math.min(100, Math.round((loyaltyPoints / nextTierPoints) * 100));

  const stats = [
    { icon: CalendarCheck, label: 'Total Rides', value: totalRides.toString(), sub: 'Since joining', color: 'bg-[#d4af37]/10 text-[#d4af37]' },
    { icon: Clock, label: 'Upcoming', value: upcomingCount.toString(), sub: upcomingCount > 0 ? `Next trip: ${upcomingRides[0].date}` : 'No upcoming trips', color: 'bg-blue-500/10 text-blue-400' },
    { icon: Star, label: 'Avg Rating Given', value: avgRating, sub: 'Across completed trips', color: 'bg-amber-500/10 text-amber-400' },
    { icon: CreditCard, label: 'Total Spent', value: `₹${totalSpentAmount.toLocaleString()}`, sub: 'This year', color: 'bg-emerald-500/10 text-emerald-400' },
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-lg font-bold font-serif">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif text-white">
                    Welcome, <span className="text-[#d4af37]">{user.fullName?.split(' ')[0]}</span>
                  </h1>
                  <p className="text-gray-400 text-sm">Your personal luxury travel hub</p>
                </div>
              </div>
            </div>
            <Link
              to="/get-started"
              className="flex items-center justify-center space-x-2 bg-[#ffe392] text-black px-6 py-3 rounded-xl hover:bg-[#e6c87a] transition-colors font-semibold shadow-lg shadow-[#ffe392]/10 text-sm"
            >
              <Plus size={18} />
              <span>Book a New Ride</span>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={index * 0.1} />
          ))}
        </div>

        {/* Live Trip tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10 bg-[#111620] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Navigation size={18} className="text-[#d4af37]" />
            <h2 className="text-lg font-serif text-white">Live Ride & Chauffeur Tracking</h2>
          </div>
          <TrackingMap role="client" />
        </motion.div>

        {/* Upcoming Rides + Saved Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upcoming Rides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Car size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-serif text-white">Upcoming Rides</h2>
              </div>
              <Link
                to="/get-started"
                className="text-xs text-[#d4af37] hover:text-white transition-colors flex items-center space-x-1"
              >
                <span>Book New</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {upcomingRides.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Car size={40} className="mx-auto mb-3 opacity-30" />
                <p>No upcoming rides. Book your next journey!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="bg-[#0a0f18] border border-white/5 rounded-xl p-5 hover:border-[#d4af37]/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-gray-500">{ride.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                          ride.status === 'ride_started'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ride.status === 'driver_arrived'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                            : ride.status === 'driver_assigned'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : ride.status === 'completed'
                            ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {ride.status === 'ride_started' 
                            ? 'In Transit' 
                            : ride.status === 'driver_arrived' 
                            ? 'Chauffeur Arrived' 
                            : ride.status === 'driver_assigned' 
                            ? 'Chauffeur Assigned'
                            : ride.status === 'completed'
                            ? 'Completed'
                            : 'Matching Chauffeur'}
                        </span>
                        {ride.paymentMethod && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            ride.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : ride.paymentStatus === 'failed'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]'
                          }`}>
                            {ride.paymentStatus === 'paid' ? 'Paid' : ride.paymentMethod === 'cash' ? 'Cash Pickup' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white font-medium">{ride.date}</p>
                        <p className="text-xs text-gray-400">{ride.time}</p>
                      </div>
                    </div>

                    {/* OTP Alert Message Box */}
                    {['driver_assigned', 'driver_arrived'].includes(ride.status) && (
                      <div className="mb-4 p-4 bg-[#111620] border border-[#d4af37]/20 rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold text-[#d4af37]">Ride Verification Code</p>
                            <p className="text-xs text-gray-400 mt-1">
                              OTP sent to email. Only share it with your driver when they arrive to start the ride.
                            </p>
                          </div>
                          <button
                            onClick={() => handleResendOtp(ride._id)}
                            disabled={resendingOtpId === ride._id}
                            className="bg-transparent border border-[#d4af37]/30 hover:border-[#d4af37] text-[#d4af37] text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-center"
                          >
                            {resendingOtpId === ride._id ? 'Sending...' : 'Resend Code'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-3 mb-4">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></div>
                        <div className="w-[1px] h-8 bg-white/10 my-1"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-red-400/20"></div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Pickup</p>
                          <p className="text-sm text-gray-200">{ride.pickup}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Drop-off</p>
                          <p className="text-sm text-gray-200">{ride.drop}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Car size={13} />
                          <span>{ride.vehicle}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Shield size={13} />
                          <span>{ride.driver}</span>
                        </span>
                      </div>
                      {ride.status !== 'pending' && ride.phone && (
                        <a 
                          href={`tel:${ride.phone}`}
                          className="flex items-center space-x-1 text-xs text-[#d4af37] hover:text-white transition-colors"
                        >
                          <Phone size={13} />
                          <span>Contact Chauffeur</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Saved Addresses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <MapPin size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-serif text-white">Saved Addresses</h2>
            </div>
            <div className="space-y-3">
              {savedAddresses.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-gray-500 text-xs">
                  <p className="mb-2">No saved addresses yet.</p>
                </div>
              ) : (
                savedAddresses.map((addr) => {
                  const AddrIcon = getAddressIcon(addr.icon);
                  return (
                    <div
                      key={addr.label}
                      className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                        <AddrIcon size={16} className="text-[#d4af37]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{addr.label}</p>
                        <p className="text-xs text-gray-400 truncate">{addr.address}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-[#d4af37] transition-colors mt-1 shrink-0" />
                    </div>
                  );
                })
              )}
              <button
                onClick={handleAddAddress}
                className="w-full flex items-center justify-center space-x-2 py-3 mt-2 rounded-xl border border-dashed border-white/10 text-gray-500 hover:border-[#d4af37]/30 hover:text-[#d4af37] transition-all text-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            </div>

            {/* Membership Badge */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5 border border-[#d4af37]/20">
              <div className="flex items-center space-x-2 mb-2">
                <Award size={18} className="text-[#d4af37]" />
                <span className="text-sm font-semibold text-[#d4af37]">{tierName}</span>
              </div>
              <p className="text-xs text-gray-400">You've earned {loyaltyPoints.toLocaleString()} loyalty points. Redeem for free rides!</p>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#ffe392] rounded-full" style={{ width: `${percentageToNext}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">{loyaltyPoints.toLocaleString()} / {nextTierPoints.toLocaleString()} pts to Next Level</p>
            </div>
          </motion.div>
        </div>

        {/* Ride History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-[#111620] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <History size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-serif text-white">Recent Ride History</h2>
            </div>
            {rideHistory.length > 0 && (
              <button className="text-xs text-[#d4af37] hover:text-white transition-colors flex items-center space-x-1">
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {rideHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-white/5 rounded-xl">
              <History size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No completed journeys yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] lg:min-w-0">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Ride ID</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Date</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">From</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">To</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Amount</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rideHistory.map((ride) => (
                    <tr key={ride.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-sm font-mono text-gray-400">{ride.id}</td>
                      <td className="py-4 text-sm text-gray-300">{ride.date}</td>
                      <td className="py-4 text-sm text-gray-300">{ride.from}</td>
                      <td className="py-4 text-sm text-gray-300">{ride.to}</td>
                      <td className="py-4 text-sm text-white font-medium">{ride.amount}</td>
                      <td className="py-4">
                        {ride.status === 'completed' ? (
                          ride.rating ? (
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={13}
                                  className={i < ride.rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-gray-600'}
                                />
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenRatingModal(ride._id)}
                              className="text-xs bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 hover:bg-[#d4af37] hover:text-[#060a11] px-2.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                            >
                              Rate Ride
                            </button>
                          )
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Premium Dark/Gold Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-[#060a11]/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#111620] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Visual Gold Bar at top */}
            <div className="absolute left-0 right-0 top-0 h-1.5 bg-[#d4af37]" />

            <h3 className="text-xl font-serif text-white mb-2">Rate Your Journey</h3>
            <p className="text-xs text-gray-400 mb-6">Your feedback helps us maintain our peak chauffeur service standards.</p>

            <form onSubmit={handleSubmitRating} className="space-y-6">
              {/* Stars */}
              <div className="flex flex-col items-center justify-center py-2 bg-[#0a0f18] rounded-xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Select Rating</p>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isLit = (hoverRating || userRating) >= starValue;
                    return (
                      <button
                        type="button"
                        key={starValue}
                        onClick={() => setUserRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform active:scale-95 cursor-pointer"
                      >
                        <Star
                          size={32}
                          className={`transition-colors duration-200 ${
                            isLit
                              ? 'text-[#d4af37] fill-[#d4af37]'
                              : 'text-gray-700 hover:text-gray-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-[#d4af37] mt-2 h-4">
                  {userRating === 5 && 'Exceeded Expectations • 5/5'}
                  {userRating === 4 && 'Very Satisfied • 4/5'}
                  {userRating === 3 && 'Good Service • 3/5'}
                  {userRating === 2 && 'Needs Improvement • 2/5'}
                  {userRating === 1 && 'Unsatisfactory • 1/5'}
                </span>
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">Chauffeur & Journey Comments</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share details about the cleanliness, driving safety, or courtesy..."
                  className="w-full h-24 bg-[#0a0f18] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ratingSubmitting}
                  className="flex-1 bg-[#d4af37] text-[#060a11] hover:bg-[#ffe392] py-3 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-[#d4af37]/10 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                >
                  {ratingSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#060a11] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
