import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock, Navigation, LogOut, User, LayoutDashboard, CalendarCheck, TrendingUp, Star, Timer
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import { api } from '../services/authService';
import { getSocketUrl } from '../utils/urls';
import NotFoundPage from './NotFoundPage';
import { deleteAccount, updateProfile } from '../services/authService';
import DriverOverview from '../components/dashboard/DriverOverview';
import DriverActivity from '../components/dashboard/DriverActivity';
import DriverProfile from '../components/dashboard/DriverProfile';

const DriverDashboard = () => {
  const { user, loading, logout, updateUser } = useAuth();
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
  const [distanceToDestination, setDistanceToDestination] = useState(null);

  const handleDistanceUpdate = (distanceInMeters) => {
    setDistanceToDestination(distanceInMeters);
  };

  useEffect(() => {
    if (!activeRide) {
      setDistanceToDestination(null);
    }
  }, [activeRide]);

  const socketRef = useRef(null);



  // Load current rides from DB
  const fetchCurrentRides = useCallback(async (force = false) => {
    if (hasFetched.current && !force) return;
    hasFetched.current = true;

    try {
      setRidesLoading(true);
      setRidesError(null);
      const response = await api.get('/rides');

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
  }, [user?._id]);

  // Initialize socket connection and listeners
  useEffect(() => {
    // If the auth session is still loading/null, wait to prevent uncaught TypeErrors.
    if (!user) return;

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true
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

    socket.on('ride-deleted', (data) => {
      const { rideId } = data;
      setRideNotifications(current => current.filter(r => r._id !== rideId));
      setAllRides(current => current.filter(r => r._id !== rideId));
    });

    fetchCurrentRides();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOnline, user?._id, fetchCurrentRides]);

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
      const response = await api.put(`/rides/${rideId}/accept`, {});

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
      const response = await api.put(`/rides/${rideId}/cancel`, {});

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
      const response = await api.patch(`/rides/${rideId}/driver-arrived`, {});

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
    if (distanceToDestination !== null && distanceToDestination > 500) {
      const distanceInKm = (distanceToDestination / 1000).toFixed(2);
      const confirmCompletion = window.confirm(
        `You are still ${distanceInKm} km away from the destination. Are you sure you want to complete this luxury ride early?`
      );
      if (!confirmCompletion) {
        return;
      }
    }

    setBtnLoading(true);
    try {
      const response = await api.patch(`/rides/${rideId}/complete`, {});

      if (response.data.success) {
        setActiveRide(null);
        setDistanceToDestination(null);
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DriverOverview
            user={user}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            rideCancelStatus={rideCancelStatus}
            rideNotifications={rideNotifications}
            notificationStatus={notificationStatus}
            handleAcceptRide={handleAcceptRide}
            handleDeclineRide={handleDeclineRide}
            ridesError={ridesError}
            fetchCurrentRides={fetchCurrentRides}
            ridesLoading={ridesLoading}
            stats={stats}
            activeRide={activeRide}
            distanceToDestination={distanceToDestination}
            handleDistanceUpdate={handleDistanceUpdate}
            handleCancelPickup={handleCancelPickup}
            handleDriverArrived={handleDriverArrived}
            btnLoading={btnLoading}
            showOtpModal={showOtpModal}
            setShowOtpModal={setShowOtpModal}
            handleCompleteRide={handleCompleteRide}
            setActiveRide={setActiveRide}
            setAllRides={setAllRides}
            upcomingAssignments={upcomingAssignments}
            weeklyEarnings={weeklyEarnings}
            maxEarning={maxEarning}
            avgRating={avgRating}
            ratedRides={ratedRides}
            recentReviews={recentReviews}
          />
        );
      case 'activity':
        return (
          <DriverActivity
            ridesLoading={ridesLoading}
            getFilteredDriverRides={getFilteredDriverRides}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'profile':
        return (
          <DriverProfile
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleSaveProfile={handleSaveProfile}
            profileSaving={profileSaving}
            profileError={profileError}
            profileSuccess={profileSuccess}
            user={user}
            handleDeleteAccount={handleDeleteAccount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 text-slate-950 pt-[76px] flex flex-col">
      {isMobileViewport ? (
        // Mobile Tabbed Layout
        <div className="flex flex-col flex-1 pb-20">
          <main className="flex-grow p-4">
            {renderActiveTab()}
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
                      className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${isActive
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
              {renderActiveTab()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
