import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, CalendarCheck, Star,
  Car, DollarSign, ChevronRight, Navigation,
  Phone, Shield, Award, CheckCircle,
  XCircle, TrendingUp, Fuel, Route,
  CircleDot, Users, Timer, Wallet
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import TrackingMap from '../components/TrackingMap';
import DriverOtpVerification from '../components/DriverOtpVerification';
import io from 'socket.io-client';
import axios from 'axios';
import { isMobile } from '../utils/motion';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={isMobile ? { duration: 0 } : { duration: 0.5, delay }}
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

const StatCardSkeleton = () => (
  <div className="bg-[#111620] border border-white/5 rounded-2xl p-6 relative overflow-hidden animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-white/5"></div>
    </div>
    <div className="w-20 h-8 bg-white/5 rounded-lg mb-2"></div>
    <div className="w-28 h-4 bg-white/5 rounded-md"></div>
    <div className="w-24 h-3 bg-white/5 rounded mt-2"></div>
  </div>
);

const DriverDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  
  // Dynamic Ride tracking states
  const [activeRide, setActiveRide] = useState(null);
  const [allRides, setAllRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [ridesError, setRidesError] = useState(null);
  const hasFetched = useRef(false);
  const [rideNotifications, setRideNotifications] = useState([]);
  const [notificationStatus, setNotificationStatus] = useState({});
  const [rideCancelStatus, setRideCancelStatus] = useState(null);
  
  // OTP modal and action button loader states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const socketRef = useRef(null);

  // Redirect to home page if not authenticated (e.g. on logout)
  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Initialize socket connection and listeners
  useEffect(() => {
    // If the auth session is still loading/null, wait to prevent uncaught TypeErrors.
    if (!user) return;

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5000';
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Driver Dashboard Socket connected:', socket.id);
    });

    // Listen to real-time status updates for the active ride
    if (activeRide?._id) {
      socket.on(`ride_status_${activeRide._id}`, (data) => {
        setActiveRide(prev => {
          if (!prev) return null;
          return { ...prev, ...data };
        });
      });
    }

    socket.on('new-booking', (ride) => {
      // Only receive booking requests if driver is online
      if (isOnline) {
        // Read handled list from localStorage
        const handledList = JSON.parse(localStorage.getItem(`dms_luxe_handled_rides_${user?._id}`) || '[]');
        if (handledList.includes(ride._id)) return;

        setRideNotifications(prev => {
          if (prev.some(r => r._id === ride._id)) return prev;
          return [ride, ...prev];
        });
        setAllRides(prev => {
          if (prev.some(r => r._id === ride._id)) return prev;
          return [ride, ...prev];
        });
      }
    });

    socket.on('booking-accepted', (data) => {
      const { rideId, driverId, driverName } = data;
      
      // Update notification text and remove instantly for other drivers
      if (driverId !== user?._id) {
        setNotificationStatus(prev => ({
          ...prev,
          [rideId]: 'booking has taken'
        }));

        // Accepted rides disappear instantly from other drivers' dashboards in real-time
        setRideNotifications(current => current.filter(r => r._id !== rideId));
      }
    });

    socket.on('ride-cancelled', (data) => {
      const { rideId } = data;

      // Remove from pending queue instantly so it disappears without refresh
      setRideNotifications(current => current.filter(r => r._id !== rideId));
      setAllRides(current => current.map(r => r._id === rideId ? { ...r, status: 'cancelled' } : r));

      setActiveRide(prev => {
        if (prev && prev._id === rideId) {
          setRideCancelStatus('ride cancel');
          setTimeout(() => setRideCancelStatus(null), 5000);
          return null;
        }
        return prev;
      });
    });

    // Load current rides from DB on mount
    const fetchCurrentRides = async (force = false) => {
      if (hasFetched.current && !force) return;
      hasFetched.current = true;

      try {
        setRidesLoading(true);
        setRidesError(null);
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
          setAllRides(response.data.rides);

          // Look for any active/assigned ride for this driver in non-completed, non-cancelled states
          const active = response.data.rides.find(
            r => r.driver && 
                 r.driver._id === user?._id && 
                 ['driver_assigned', 'driver_arrived', 'ride_started'].includes(r.status)
          );
          if (active) setActiveRide(active);

          // Read handled list from localStorage to filter out already accepted/declined requests
          const handledList = JSON.parse(localStorage.getItem(`dms_luxe_handled_rides_${user?._id}`) || '[]');

          // Populate the pending rides queue so new logins or reconnects automatically see active requests!
          const pendings = response.data.rides.filter(
            r => r.status === 'pending' && !handledList.includes(r._id)
          );
          setRideNotifications(pendings);
        } else {
          throw new Error(response.data.message || 'Failed to fetch rides.');
        }
      } catch (err) {
        console.error('Failed to load current rides:', err);
        setRidesError(err.response?.data?.message || err.message || 'Failed to load rides. Please check your connection.');
        hasFetched.current = false;
      } finally {
        setRidesLoading(false);
      }
    };

    fetchCurrentRides();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOnline, user?._id]);

  // Real-time status sync for active ride
  useEffect(() => {
    if (!user || !socketRef.current) return;
    const socket = socketRef.current;

    if (activeRide?._id) {
      const handleActiveRideUpdate = (data) => {
        setActiveRide(prev => prev && prev._id === activeRide._id ? { ...prev, ...data } : prev);
        setAllRides(current => current.map(r => r._id === activeRide._id ? { ...r, ...data } : r));
      };

      socket.on(`ride_status_${activeRide._id}`, handleActiveRideUpdate);
      return () => {
        socket.off(`ride_status_${activeRide._id}`, handleActiveRideUpdate);
      };
    }
  }, [user, activeRide?._id]);

  // Real-time ratings and comments sync for completed rides
  useEffect(() => {
    if (!user || !socketRef.current || allRides.length === 0) return;
    const socket = socketRef.current;

    const myCompletedRides = allRides.filter(r => r.driver && r.driver._id === user._id && r.status === 'completed');
    
    myCompletedRides.forEach(ride => {
      const handleRideRateFeedback = (data) => {
        if (data.rating || data.feedback) {
          setAllRides(current => current.map(r => r._id === ride._id ? { ...r, ...data } : r));
        }
      };

      socket.on(`ride_status_${ride._id}`, handleRideRateFeedback);
    });

    return () => {
      myCompletedRides.forEach(ride => {
        socket.off(`ride_status_${ride._id}`);
      });
    };
  }, [user, allRides.length]);

  // Action handlers
  const handleAcceptRide = async (rideId) => {
    try {
      const token = localStorage.getItem('dms_luxe_token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides/${rideId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Save to handled list in localStorage
        const handledList = JSON.parse(localStorage.getItem(`dms_luxe_handled_rides_${user?._id}`) || '[]');
        if (!handledList.includes(rideId)) {
          handledList.push(rideId);
          localStorage.setItem(`dms_luxe_handled_rides_${user?._id}`, JSON.stringify(handledList));
        }

        // Driver accepted successfully
        setActiveRide(response.data.ride);
        setAllRides(prev => prev.map(r => r._id === rideId ? response.data.ride : r));
        setNotificationStatus(prev => ({
          ...prev,
          [rideId]: 'booking confirmed by me'
        }));

        // Clean up from notification banner list shortly
        setTimeout(() => {
          setRideNotifications(prev => prev.filter(r => r._id !== rideId));
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to accept ride:', err);
      // Already taken by another driver
      setNotificationStatus(prev => ({
        ...prev,
        [rideId]: 'booking has taken'
      }));
      setTimeout(() => {
        setRideNotifications(prev => prev.filter(r => r._id !== rideId));
      }, 4000);
    }
  };

  const handleDeclineRide = (rideId) => {
    const handledList = JSON.parse(localStorage.getItem(`dms_luxe_handled_rides_${user?._id}`) || '[]');
    if (!handledList.includes(rideId)) {
      handledList.push(rideId);
      localStorage.setItem(`dms_luxe_handled_rides_${user?._id}`, JSON.stringify(handledList));
    }
    setRideNotifications(prev => prev.filter(r => r._id !== rideId));
  };

  const handleCancelPickup = async (rideId) => {
    try {
      const token = localStorage.getItem('dms_luxe_token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides/${rideId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setActiveRide(null);
        setAllRides(current => current.map(r => r._id === rideId ? { ...r, status: 'cancelled' } : r));
        setRideCancelStatus('ride cancel');
        setTimeout(() => setRideCancelStatus(null), 5000);
      }
    } catch (err) {
      console.error('Failed to cancel pickup:', err);
      alert('Failed to cancel pickup. Please try again.');
    }
  };

  const handleDriverArrived = async (rideId) => {
    setBtnLoading(true);
    try {
      const token = localStorage.getItem('dms_luxe_token');
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides/${rideId}/driver-arrived`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setActiveRide(response.data.ride);
        setAllRides(current => current.map(r => r._id === rideId ? response.data.ride : r));
      }
    } catch (err) {
      console.error('Failed to update driver arrival:', err);
      alert(err.response?.data?.message || 'Failed to update arrival state.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCompleteRide = async (rideId) => {
    setBtnLoading(true);
    try {
      const token = localStorage.getItem('dms_luxe_token');
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides/${rideId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setActiveRide(null);
        setAllRides(current => current.map(r => r._id === rideId ? { ...r, status: 'completed', completedAt: new Date() } : r));
        alert('Journey completed successfully. Invoice has been sent to client email.');
      }
    } catch (err) {
      console.error('Failed to complete ride:', err);
      alert(err.response?.data?.message || 'Failed to complete journey.');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a11] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#d4af37] font-serif text-sm tracking-wider uppercase animate-pulse">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Dynamic stats calculation
  const completedRides = allRides.filter(r => r.driver && r.driver._id === user?._id && r.status === 'completed');
  const completedCount = completedRides.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const mtdEarnings = completedRides
    .filter(r => {
      const compDate = new Date(r.completedAt || r.updatedAt);
      return compDate.getMonth() === currentMonth && compDate.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + (r.fare || 0), 0);

  const ratedRides = completedRides.filter(r => r.rating);
  const avgRating = ratedRides.length > 0
    ? (ratedRides.reduce((sum, r) => sum + r.rating, 0) / ratedRides.length).toFixed(1)
    : '5.0';

  const tripHours = completedRides.reduce((sum, r) => {
    if (r.rideStartedAt && r.completedAt) {
      const diff = new Date(r.completedAt) - new Date(r.rideStartedAt);
      return sum + (diff / (1000 * 60 * 60));
    }
    return sum + 0.75;
  }, 0);
  const hoursOnline = Math.max(8, Math.round(tripHours + (completedRides.length * 4)));

  const stats = [
    { icon: CalendarCheck, label: 'Completed Rides', value: completedCount.toString(), sub: 'Lifetime total', color: 'bg-[#d4af37]/10 text-[#d4af37]' },
    { icon: TrendingUp, label: 'Earnings (MTD)', value: `₹${mtdEarnings.toLocaleString()}`, sub: `${monthNames[currentMonth]} ${currentYear}`, color: 'bg-emerald-500/10 text-emerald-400' },
    { icon: Star, label: 'Driver Rating', value: avgRating, sub: `Based on ${ratedRides.length} review${ratedRides.length === 1 ? '' : 's'}`, color: 'bg-amber-500/10 text-amber-400' },
    { icon: Timer, label: 'Hours Online', value: hoursOnline.toString(), sub: 'This month', color: 'bg-blue-500/10 text-blue-400' },
  ];

  const currentRide = activeRide ? {
    id: `#RD-${activeRide._id.substring(18, 24).toUpperCase()}`,
    passenger: activeRide.passengerDetails?.fullName || 'Client',
    phone: activeRide.passengerDetails?.phone || '',
    pickup: activeRide.pickupLocation,
    drop: activeRide.dropoffLocation,
    vehicle: activeRide.vehicleType,
    fare: `₹${activeRide.fare.toLocaleString()}`,
    status: activeRide.status,
  } : null;

  const upcomingAssignments = allRides.filter(r =>
    r.driver &&
    r.driver._id === user?._id &&
    ['driver_assigned', 'driver_arrived'].includes(r.status) &&
    (!activeRide || r._id !== activeRide._id)
  ).map(r => ({
    _id: r._id,
    id: `#RD-${r._id.substring(18, 24).toUpperCase()}`,
    passenger: r.passengerDetails?.fullName || 'Client',
    time: `${r.pickupDate} ${r.pickupTime}`,
    pickup: r.pickupLocation,
    drop: r.dropoffLocation,
    fare: `₹${r.fare ? r.fare.toLocaleString() : '0'}`,
    status: r.status
  }));

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyEarnings = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weeklyEarnings.push({
      day: daysOfWeek[d.getDay()],
      dateStr: d.toDateString(),
      amount: 0,
      rides: 0
    });
  }
  
  completedRides.forEach(r => {
    const dateStr = new Date(r.completedAt || r.updatedAt).toDateString();
    const match = weeklyEarnings.find(w => w.dateStr === dateStr);
    if (match) {
      match.amount += r.fare || 0;
      match.rides += 1;
    }
  });

  const maxEarning = Math.max(...weeklyEarnings.map(d => d.amount), 1);

  const recentReviews = completedRides
    .filter(r => r.rating)
    .slice(0, 5)
    .map(r => {
      const timeStr = r.completedAt ? new Date(r.completedAt).toLocaleDateString() : 'Recently';
      return {
        passenger: r.passengerDetails?.fullName || 'Client',
        rating: r.rating,
        comment: r.feedback || 'Excellent journey.',
        date: timeStr
      };
    });

  return (
    <div className="min-h-screen bg-[#060a11] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
                <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-lg font-bold font-serif">
                  {user.fullName?.charAt(0) || 'D'}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif text-white">
                    <span className="text-[#d4af37]">{user.fullName?.split(' ')[0]}</span>'s Command Center
                  </h1>
                  <p className="text-gray-400 text-sm">Chauffeur Dashboard</p>
                </div>
              </div>
            </div>

            {/* Online/Offline Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                isOnline
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
                className={`mb-6 p-6 rounded-2xl border backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300 ${
                  status === 'booking has taken'
                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                    : status === 'booking confirmed by me'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-[#111620]/95 border-[#d4af37]/30 shadow-[#d4af37]/5'
                }`}
              >
                {/* Visual Accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  status === 'booking has taken'
                    ? 'bg-red-500'
                    : status === 'booking confirmed by me'
                    ? 'bg-emerald-500'
                    : 'bg-[#d4af37]'
                }`} />

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full font-mono font-semibold text-gray-400">
                        RIDE REQUEST: {ride._id.substring(0, 8)}...
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] rounded-full uppercase tracking-wider font-bold">
                        {ride.vehicleType}
                      </span>
                    </div>
                    
                    <div className="text-sm font-sans space-y-1">
                      <p className="text-white"><strong className="text-gray-400">Passenger:</strong> {ride.passengerDetails?.fullName} ({ride.passengerDetails?.phone})</p>
                      <p className="text-gray-300"><strong className="text-gray-400">Pickup:</strong> {ride.pickupLocation}</p>
                      <p className="text-gray-300"><strong className="text-gray-400">Drop-off:</strong> {ride.dropoffLocation}</p>
                      {ride.passengerDetails?.specialInstructions && (
                        <p className="text-xs text-gray-500 italic">"{ride.passengerDetails.specialInstructions}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase block font-mono text-[9px]">Chauffeur Fare</span>
                      <span className="text-2xl font-bold text-[#d4af37]">₹{ride.fare.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                      {status ? (
                        <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
                          {status}
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAcceptRide(ride._id)}
                            className="bg-[#d4af37] text-[#060a11] hover:bg-[#ffe392] px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-[#d4af37]/10"
                          >
                            Accept Pickup
                          </button>
                          <button
                            onClick={() => handleDeclineRide(ride._id)}
                            className="border border-white/10 hover:border-white/20 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-xs transition-colors"
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
            className="lg:col-span-2 bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Navigation size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-serif text-white">Current Ride</h2>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium animate-pulse">
                  In Progress
                </span>
              </div>
              <span className="text-xs font-mono text-gray-500">{currentRide.id}</span>
            </div>

            <div className="bg-[#0a0f18] border border-white/5 rounded-xl p-5">
              {activeRide ? (
                <>
                  {/* Passenger Info */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {activeRide.passengerDetails?.fullName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{activeRide.passengerDetails?.fullName}</p>
                        <p className="text-xs text-gray-500">Passenger • {activeRide.passengerDetails?.phone}</p>
                      </div>
                    </div>
                    <a href={`tel:${activeRide.passengerDetails?.phone}`} className="flex items-center space-x-2 bg-[#d4af37]/10 text-[#d4af37] px-4 py-2 rounded-lg hover:bg-[#d4af37]/20 transition-colors text-sm">
                      <Phone size={14} />
                      <span>Call</span>
                    </a>
                  </div>

                  {/* Route */}
                  <div className="flex items-start space-x-3 mb-5">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></div>
                      <div className="w-[2px] h-10 bg-gradient-to-b from-emerald-400/50 to-red-400/50 my-1"></div>
                      <div className="w-3 h-3 rounded-full bg-red-400 ring-2 ring-red-400/20"></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Pickup</p>
                        <p className="text-sm text-gray-200">{activeRide.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Drop-off</p>
                        <p className="text-sm text-gray-200">{activeRide.dropoffLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ride Details */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                        <Route size={12} />
                        <span>Vehicle</span>
                      </div>
                      <p className="text-white font-semibold text-xs truncate">{activeRide.vehicleType}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                        <Clock size={12} />
                        <span>Date/Time</span>
                      </div>
                      <p className="text-white font-semibold text-[10px]">{activeRide.pickupDate} {activeRide.pickupTime}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                        <Wallet size={12} />
                        <span>Fare</span>
                      </div>
                      <p className="text-[#d4af37] font-semibold">₹{activeRide.fare.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Ride Live Tracking Map */}
                  <div className="mt-6 border-t border-white/5 pt-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Live Route Tracking Map</p>
                    <TrackingMap role="driver" />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                    {activeRide.status === 'driver_assigned' && (
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleCancelPickup(activeRide._id)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 py-3 rounded-xl hover:bg-red-500/20 transition-colors font-medium text-sm"
                        >
                          <XCircle size={16} />
                          <span>Cancel Pickup</span>
                        </button>
                        <button 
                          onClick={() => handleDriverArrived(activeRide._id)}
                          disabled={btnLoading}
                          className="flex-1 flex items-center justify-center space-x-2 bg-[#d4af37] text-[#060a11] py-3 rounded-xl hover:bg-[#ffe392] transition-colors font-bold text-sm cursor-pointer disabled:opacity-50"
                        >
                          {btnLoading ? (
                            <div className="w-5 h-5 border-2 border-[#060a11] border-t-transparent rounded-full animate-spin"></div>
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
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleCancelPickup(activeRide._id)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 py-3 rounded-xl hover:bg-red-500/20 transition-colors font-medium text-sm"
                        >
                          <XCircle size={16} />
                          <span>Cancel Pickup</span>
                        </button>
                        <button 
                          onClick={() => setShowOtpModal(true)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-[#d4af37] text-[#060a11] py-3 rounded-xl hover:bg-[#ffe392] transition-colors font-bold text-sm animate-pulse cursor-pointer"
                        >
                          <Shield size={16} />
                          <span>Start Ride (Enter OTP)</span>
                        </button>
                      </div>
                    )}

                    {activeRide.status === 'ride_started' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-semibold mb-2">
                          OTP Verified. Chauffeur Navigation Active.
                        </div>
                        <button 
                          onClick={() => handleCompleteRide(activeRide._id)}
                          disabled={btnLoading}
                          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white py-3.5 rounded-xl hover:bg-emerald-500 transition-colors font-bold text-sm cursor-pointer disabled:opacity-50"
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
                    <div className="fixed inset-0 z-50 bg-[#060a11]/90 backdrop-blur-md flex items-center justify-center p-4">
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
                /* Static Default Demo Ride (fallback) */
                <>
                  <div className="text-center py-6 text-gray-500 font-sans">
                    <Navigation size={32} className="mx-auto mb-2 text-[#d4af37] animate-pulse" />
                    <p className="text-sm text-gray-300">No active luxury trip currently.</p>
                    <p className="text-xs text-gray-500 mt-1">Accept an incoming passenger request above to begin.</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Upcoming Assignments */}
          <motion.div
            initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : { duration: 0.5, delay: 0.5 }}
            className="bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <CalendarCheck size={20} className="text-[#d4af37]" />
              <h2 className="text-lg font-serif text-white">Upcoming</h2>
              <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] px-2 py-0.5 rounded-full font-medium">
                {upcomingAssignments.length}
              </span>
            </div>
            <div className="space-y-3" style={{ contain: 'layout paint' }}>
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm bg-[#0a0f18] border border-dashed border-white/5 rounded-xl font-sans">
                  <CalendarCheck size={28} className="mx-auto mb-2 text-[#d4af37]/40" />
                  <p className="text-gray-400">No upcoming assignments</p>
                  <p className="text-xs text-gray-600 mt-1">Pending trips assigned to you will show up here.</p>
                </div>
              ) : (
                upcomingAssignments.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-4 rounded-xl bg-[#0a0f18] border border-white/5 hover:border-[#d4af37]/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-gray-500">{ride.id}</span>
                      <span className="text-xs text-[#d4af37] font-medium">{ride.fare}</span>
                    </div>
                    <p className="text-sm text-white font-medium mb-1">{ride.passenger}</p>
                    <p className="text-xs text-gray-500 mb-2">{ride.time}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <MapPin size={11} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{ride.pickup}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                      <MapPin size={11} className="text-red-400 shrink-0" />
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
            className="bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <DollarSign size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-serif text-white">Weekly Earnings</h2>
              </div>
              <span className="text-sm text-emerald-400 font-medium">
                ₹{weeklyEarnings.reduce((a, b) => a + b.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-end justify-between space-x-2 h-44">
              {weeklyEarnings.map((day, index) => (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] text-gray-500 mb-2">₹{(day.amount / 1000).toFixed(1)}k</span>
                  <div className="w-full relative group">
                    <div
                      className="w-full bg-gradient-to-t from-[#d4af37] to-[#ffe392] rounded-lg transition-all duration-300 hover:opacity-80 cursor-pointer"
                      style={{ height: `${(day.amount / maxEarning) * 120}px` }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a2030] text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {day.rides} rides
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
              <span>Total: {weeklyEarnings.reduce((a, b) => a + b.rides, 0)} rides</span>
              <span>Avg: ₹{Math.round(weeklyEarnings.reduce((a, b) => a + b.amount, 0) / 7).toLocaleString()}/day</span>
            </div>
          </motion.div>

          {/* Recent Reviews */}
          <motion.div
            initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : { duration: 0.5, delay: 0.7 }}
            className="bg-[#111620] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Star size={20} className="text-[#d4af37]" />
                <h2 className="text-lg font-serif text-white">Recent Reviews</h2>
              </div>
              <div className="flex items-center space-x-1">
                <Star size={14} className="text-[#d4af37] fill-[#d4af37]" />
                <span className="text-sm text-white font-medium">{avgRating}</span>
                <span className="text-xs text-gray-500">({ratedRides.length})</span>
              </div>
            </div>
            <div className="space-y-4" style={{ contain: 'layout paint' }}>
              {recentReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm bg-[#0a0f18] border border-dashed border-white/5 rounded-xl">
                  <Star className="mx-auto mb-2 text-gray-600 animate-pulse" size={24} />
                  <p>No client reviews yet.</p>
                  <p className="text-xs text-gray-600 mt-1">Passenger feedback will appear here once trips are completed and rated.</p>
                </div>
              ) : (
                recentReviews.map((review, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-[#0a0f18] border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">
                          {review.passenger.charAt(0)}
                        </div>
                        <span className="text-sm text-white font-medium">{review.passenger}</span>
                      </div>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                    <div className="flex items-center space-x-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < review.rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-gray-600'}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 italic">"{review.comment}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Vehicle Info */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5 border border-[#d4af37]/20">
              <div className="flex items-center space-x-2 mb-3">
                <Car size={18} className="text-[#d4af37]" />
                <span className="text-sm font-semibold text-[#d4af37]">Your Vehicle</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Model</p>
                  <p className="text-white font-medium">{user.vehicleType || 'Mercedes S-Class'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Plate No.</p>
                  <p className="text-white font-medium font-mono">{user.vehicleNumber || 'WB-02-AB-1234'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="text-emerald-400 font-medium">Active</p>
                </div>
                <div>
                  <p className="text-gray-500">License Number</p>
                  <p className="text-amber-400 font-medium font-mono">{user.licenseNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
