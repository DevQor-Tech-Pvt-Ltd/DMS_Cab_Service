import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, CalendarCheck, Star,
  Car, DollarSign, ChevronRight, Navigation,
  Phone, Shield, Award, CheckCircle,
  XCircle, TrendingUp, Fuel, Route,
  CircleDot, Users, Timer, Wallet,
  LayoutDashboard, LogOut, User, X
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TrackingMap from '../components/TrackingMap';
import DriverOtpVerification from '../components/DriverOtpVerification';
import io from 'socket.io-client';
import axios from 'axios';
import { isMobile } from '../utils/motion';
import NotFoundPage from './NotFoundPage';
import { deleteAccount, updateProfile } from '../services/authService';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
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

const DriverDashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth < 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [isOnline, setIsOnline] = useState(true);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update URL search parameters when tab changes
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync tab with URL parameter on direct load/navigate
  useEffect(() => {
    const tab = searchParams.get('tab') || 'dashboard';
    if (['dashboard', 'activity', 'profile'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load profile details
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

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
        const token = sessionStorage.getItem('dms_luxe_token');
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
      const token = sessionStorage.getItem('dms_luxe_token');
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
      const token = sessionStorage.getItem('dms_luxe_token');
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
      const token = sessionStorage.getItem('dms_luxe_token');
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
      const token = sessionStorage.getItem('dms_luxe_token');
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

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your driver account? This action will deactivate your profile and log you out, but your ride history and earnings log will be preserved for compliance."
    );
    if (!confirmDelete) return;

    try {
      const response = await deleteAccount();
      alert(response.message || 'Driver account deleted successfully.');
      
      // Clear session storage context
      sessionStorage.removeItem('dms_luxe_token');
      sessionStorage.removeItem('dms_luxe_user');
      sessionStorage.removeItem('dms_luxe_tab_id');
      window.name = '';
      
      // Redirect to home
      window.location.replace('/');
    } catch (err) {
      console.error('Failed to delete driver account:', err);
      alert(err.response?.data?.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const payload = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
      };

      const response = await updateProfile(payload);
      if (response.success) {
        updateUser(response.user);
        setProfileSuccess('Profile settings successfully saved!');
        alert('Profile settings successfully saved!');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to save driver profile settings:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save profile settings.';
      setProfileError(msg);
      alert(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const getFilteredDriverRides = () => {
    const driverRides = allRides.filter(r => r.driver && r.driver._id === user?._id);
    if (!searchQuery.trim()) return driverRides;
    const q = searchQuery.toLowerCase();
    return driverRides.filter(ride => 
      (ride.passengerDetails?.fullName || '').toLowerCase().includes(q) ||
      (ride.pickupLocation || '').toLowerCase().includes(q) ||
      (ride.dropoffLocation || '').toLowerCase().includes(q) ||
      (ride.pickupDate || '').toLowerCase().includes(q) ||
      (ride.status || '').toLowerCase().includes(q) ||
      (`#RD-${ride._id.substring(18, 24).toUpperCase()}`).toLowerCase().includes(q)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003893] font-serif text-sm tracking-wider uppercase animate-pulse">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <NotFoundPage />;
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
    { icon: CalendarCheck, label: 'Completed Rides', value: completedCount.toString(), sub: 'Lifetime total', color: 'bg-[#003893]/10 text-[#003893]' },
    { icon: TrendingUp, label: 'Earnings (MTD)', value: `₹${mtdEarnings.toLocaleString()}`, sub: `${monthNames[currentMonth]} ${currentYear}`, color: 'bg-emerald-50 text-emerald-600' },
    { icon: Star, label: 'Driver Rating', value: avgRating, sub: `Based on ${ratedRides.length} review${ratedRides.length === 1 ? '' : 's'}`, color: 'bg-amber-50 text-amber-600' },
    { icon: Timer, label: 'Hours Online', value: hoursOnline.toString(), sub: 'This month', color: 'bg-blue-50 text-blue-600' },
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

  const renderDesktopHome = () => {
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
                  ? 'bg-red-50 border-red-200 text-red-700'
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
                <span className="text-xs bg-emerald-550/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium animate-pulse">
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
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Live Route Tracking Map</p>
                    <div className="relative bg-slate-50 border border-slate-200 rounded-2xl h-80 overflow-hidden shadow-inner">
                      <TrackingMap role="driver" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                    {activeRide.status === 'driver_assigned' && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleCancelPickup(activeRide._id)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl hover:bg-red-100/50 transition-colors font-medium text-sm"
                        >
                          <XCircle size={16} />
                          <span>Cancel Pickup</span>
                        </button>
                        <button
                          onClick={() => handleDriverArrived(activeRide._id)}
                          disabled={btnLoading}
                          className="flex-1 flex items-center justify-center space-x-2 bg-[#003893] text-white py-3 rounded-xl hover:bg-[#002d72] transition-colors font-bold text-sm cursor-pointer disabled:opacity-50"
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
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleCancelPickup(activeRide._id)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl hover:bg-red-100/50 transition-colors font-medium text-sm"
                        >
                          <XCircle size={16} />
                          <span>Cancel Pickup</span>
                        </button>
                        <button
                          onClick={() => setShowOtpModal(true)}
                          className="flex-1 flex items-center justify-center space-x-2 bg-[#003893] text-white py-3 rounded-xl hover:bg-[#002d72] transition-colors font-bold text-sm animate-pulse cursor-pointer"
                        >
                          <Shield size={16} />
                          <span>Start Ride (Enter OTP)</span>
                        </button>
                      </div>
                    )}

                    {activeRide.status === 'ride_started' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-700 font-semibold mb-2">
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
                /* Static Default Demo Ride (fallback) */
                <>
                  <div className="text-center py-6 text-slate-400 font-sans">
                    <Navigation size={32} className="mx-auto mb-2 text-[#003893] animate-pulse" />
                    <p className="text-sm text-slate-600">No active luxury trip currently.</p>
                    <p className="text-xs text-slate-400 mt-1">Accept an incoming passenger request above to begin.</p>
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
              {weeklyEarnings.map((day, index) => (
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
                    <p className="text-sm text-slate-600 italic">"{review.comment}"</p>
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

  const renderMobileHome = () => renderDesktopHome();
  const renderMobileActivity = () => renderDesktopActivity();
  const renderMobileProfile = () => renderDesktopProfile();

  const renderDesktopActivity = () => {
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
          ) : getFilteredDriverRides().length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
              <Car size={32} className="mx-auto mb-2 opacity-35" />
              <p className="text-sm font-medium text-slate-600">No journeys logged yet.</p>
              <p className="text-xs text-slate-400 mt-1">Pending trips assigned to you will appear here after completion.</p>
            </div>
          ) : (
            getFilteredDriverRides().map((ride, idx) => {
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
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isCompleted 
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

  const renderDesktopProfile = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-7xl mx-auto">
        {/* Left: Chauffeur Profile details form */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">Account Settings</h2>
            <p className="text-xs text-slate-400 mt-1">Manage your premium chauffeur profile credentials.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
            {/* Header info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#003893]/10 flex items-center justify-center text-[#003893] border-2 border-[#003893] text-2xl font-bold font-serif relative">
                {profileForm.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Personal Information</h4>
                <p className="text-[10px] text-slate-400">Update your details and how we contact you.</p>
              </div>
            </div>

            {/* Fields form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                />
              </div>
            </div>

            {profileError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">{profileError}</div>
            )}
            {profileSuccess && (
              <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">{profileSuccess}</div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="bg-[#003893] hover:bg-[#002d72] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                {profileSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Vehicle verification + Danger Zone */}
        <div className="lg:col-span-4 space-y-6">
          {/* Vehicle Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <Car size={18} className="text-[#003893]" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Your Vehicle Details</h4>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Model / Class</span>
                <span className="text-slate-800 font-semibold">{user.vehicleType || 'Mercedes S-Class'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">License Plate</span>
                <span className="text-slate-800 font-semibold font-mono">{user.vehicleNumber || 'WB-02-AB-1234'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">License Number</span>
                <span className="text-slate-800 font-semibold font-mono">{user.licenseNumber || 'N/A'}</span>
              </div>
              <div className="pt-2">
                <span className="bg-emerald-100 border border-emerald-200 text-emerald-600 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full">
                  Verified Chauffeur
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 space-y-4 text-left">
            <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Danger Zone</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              Once you delete your account, your profile will be permanently deactivated. Your historical ride log and earnings statements are legally retained for financial compliance.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-white hover:bg-red-600 border border-red-200 hover:border-red-600 text-red-600 hover:text-white py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 text-slate-950 pt-[76px] flex flex-col">
      {isMobileViewport ? (
        // Mobile Tabbed Layout
        <div className="flex flex-col flex-1 pb-20">
          <main className="flex-grow p-4">
            {activeTab === 'dashboard' && renderMobileHome()}
            {activeTab === 'activity' && renderMobileActivity()}
            {activeTab === 'profile' && renderMobileProfile()}
          </main>

          {/* Bottom Tab Bar */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-6 flex justify-between items-center z-40 shadow-lg">
            {[
              { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
              { id: 'activity', label: 'ACTIVITY', icon: Clock },
              { id: 'profile', label: 'PROFILE', icon: User }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex flex-col items-center space-y-1.5 focus:outline-none cursor-pointer"
                >
                  <div className={`p-1.5 rounded-full ${isActive ? 'bg-[#003893]/10 text-[#003893] border border-[#003893]/20' : 'text-slate-400'}`}>
                    <TabIcon size={20} />
                  </div>
                  <span className={`text-[9px] font-bold tracking-wider ${isActive ? 'text-[#003893]' : 'text-slate-400'}`}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : (
        // Desktop Layout
        <div className="flex flex-1 min-h-[calc(100vh-76px)]">
          {/* Left Sidebar */}
          <aside className="w-72 bg-slate-50 border-r border-slate-200/60 flex flex-col justify-between p-6 shrink-0 h-[calc(100vh-76px)] sticky top-[76px]">
            <div className="space-y-8 text-left">
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'activity', label: 'Activity', icon: Clock },
                  { id: 'profile', label: 'Profile', icon: User }
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#eef4ff] border border-[#d0e0fc] text-[#003893]'
                          : 'text-[#64748b] hover:text-[#003893] hover:bg-slate-100/50 border border-transparent'
                      }`}
                    >
                      <IconComponent size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom User profile snippet */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-between text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#003893]/10 border border-[#b9d3ff] flex items-center justify-center text-[#003893] font-bold text-sm">
                  {user.fullName?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 truncate max-w-[110px]">{user.fullName || 'Chauffeur'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.role || 'CHAUFFEUR'}</p>
                </div>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Main Content Pane */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'dashboard' && renderDesktopHome()}
              {activeTab === 'activity' && renderDesktopActivity()}
              {activeTab === 'profile' && renderDesktopProfile()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
