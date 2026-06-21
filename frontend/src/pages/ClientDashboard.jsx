import React, { useState, useEffect, useRef } from 'react';
import ImageWithFallback from '../components/ImageWithFallback';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, CalendarCheck, Star,
  Car, CreditCard, ChevronRight, Heart,
  Navigation, Phone, Shield, Award,
  History, Plus, ArrowRight, Menu, X,
  User, LayoutDashboard, Wallet, Calendar,
  DollarSign, Smartphone, ShieldCheck, Mail, Lock
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import TrackingMap from '../components/TrackingMap';
import EditProfileModal from '../components/EditProfileModal.jsx';
import io from 'socket.io-client';
import { api, getMe } from '../services/authService';
import { getSocketUrl } from '../utils/urls';
import { updateProfile, deleteAccount } from '../services/authService';
import NotFoundPage from './NotFoundPage';
import ClientOverview from '../components/dashboard/ClientOverview';
import ClientActivity from '../components/dashboard/ClientActivity';
import ClientWallet from '../components/dashboard/ClientWallet';
import ClientProfile from '../components/dashboard/ClientProfile';

const SettingsIcon = ({ size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2050/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const BellIcon = ({ size = 18, className = '', fill = 'none' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const ClientDashboard = () => {
  const { user, loading, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Responsive check
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth < 1024);

  // Tab State: 'dashboard', 'activity', 'wallet', 'profile'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');

  // Backend state
  const [ridesList, setRidesList] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [ridesError, setRidesError] = useState(null);
  const hasFetched = useRef(false);
  const [resendingOtpId, setResendingOtpId] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Wallet & Payment state
  const [walletBalance, setWalletBalance] = useState(1500.00);
  const [transactions, setTransactions] = useState([]);
  const [upiId, setUpiId] = useState('');
  const [upiInput, setUpiInput] = useState('');

  // Profile saving state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Top bar search and notifications state
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState([]);

  // Modal States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const selectedRideForRating = ridesList.find(r => r._id === selectedRideId);
  const driverNameForRating = selectedRideForRating?.driver?.fullName || 'Your Chauffeur';
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Edit Profile form fields
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    language: 'English (US)'
  });

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
    if (['dashboard', 'activity', 'wallet', 'profile'].includes(tab)) {
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
        language: 'English (US)'
      });
    }
  }, [user]);

  // Load addresses
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`dms_luxe_addresses_${user._id}`);
    if (saved) {
      setSavedAddresses(JSON.parse(saved));
    } else {
      // Mock some locations if none exist
      const defaults = [
        { label: 'Home', address: '221B, Southern Avenue, Kalighat', icon: 'home' },
        { label: 'Work', address: 'TCS Tower, Action Area II, New Town', icon: 'office' },
        { label: 'Gym', address: 'Cult Fit, Park Street', icon: 'heart' }
      ];
      setSavedAddresses(defaults);
      localStorage.setItem(`dms_luxe_addresses_${user._id}`, JSON.stringify(defaults));
    }
  }, [user]);

  const [txnsLoading, setTxnsLoading] = useState(false);
  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setTxnsLoading(true);
      const response = await api.get('/payment/transactions');
      if (response.data.success) {
        const formatted = response.data.transactions.map(t => {
          let typeLabel = 'Payment';
          if (t.type === 'deposit') typeLabel = 'Added to Wallet';
          if (t.type === 'payment') typeLabel = 'Ride Payment';
          if (t.type === 'refund') typeLabel = 'Refund';
          
          let descText = t.razorpayPaymentId || t.razorpayOrderId || 'Wallet Transaction';
          if (t.ride) {
            descText = `${t.ride.vehicleType || 'Cab'} • ${t.ride.pickupLocation?.split(',')[0]} to ${t.ride.dropoffLocation?.split(',')[0]}`;
          }
          
          return {
            type: typeLabel,
            desc: descText,
            amt: (t.type === 'deposit' || t.type === 'refund' ? '+ ' : '- ') + `₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            date: new Date(t.createdAt).toLocaleString(),
            minus: t.type === 'payment',
            value: t.amount
          };
        });
        setTransactions(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
    } finally {
      setTxnsLoading(false);
    }
  };

  // Sync wallet details from user model and fetch transactions
  useEffect(() => {
    if (!user) return;

    setWalletBalance(user.walletBalance ?? 1500.00);

    // UPI ID
    const savedUpi = localStorage.getItem(`dms_luxe_upi_${user._id}`);
    if (savedUpi !== null) {
      setUpiId(savedUpi);
      setUpiInput(savedUpi);
    } else {
      setUpiId('');
      setUpiInput('');
    }

    fetchTransactions();
  }, [user]);

  // Fetch transactions on tab change to make sure it's fresh
  useEffect(() => {
    if (user && activeTab === 'wallet') {
      fetchTransactions();
    }
  }, [activeTab]);

  const handleAddMoney = () => {
    handleTabChange('wallet');
    setTimeout(() => {
      const btn = document.getElementById('wallet-add-money-btn');
      if (btn) btn.click();
    }, 350);
  };

  const handleLinkUpi = () => {
    if (!upiInput.trim()) {
      alert("Please enter a valid UPI ID");
      return;
    }
    setUpiId(upiInput);
    localStorage.setItem(`dms_luxe_upi_${user._id}`, upiInput);
    alert("UPI ID linked successfully!");
  };

  // Helper to get all transactions (merged localStorage + backend completed rides)
  const getMergedTransactions = () => {
    const rideTxns = ridesList
      .filter(ride => ride.status === 'completed')
      .map(ride => {
        const completedDate = ride.completedAt || ride.updatedAt || new Date().toISOString();
        return {
          type: 'Ride Payment',
          desc: `${ride.vehicleType || 'Premium Cab'} • ${ride.pickupLocation.split(',')[0]} to ${ride.dropoffLocation.split(',')[0]}`,
          amt: `- ₹${(ride.fare || 0).toLocaleString()}`,
          date: new Date(completedDate).toLocaleString(),
          minus: true,
          timestamp: new Date(completedDate).getTime(),
          value: ride.fare || 0
        };
      });

    const localTxns = transactions.map(t => ({
      ...t,
      timestamp: new Date(t.date).getTime()
    }));

    return [...rideTxns, ...localTxns].sort((a, b) => b.timestamp - a.timestamp);
  };

  const getFilteredTransactions = () => {
    const merged = getMergedTransactions();
    if (!searchQuery.trim()) return merged;
    const q = searchQuery.toLowerCase();
    return merged.filter(t =>
      (t.type || '').toLowerCase().includes(q) ||
      (t.desc || '').toLowerCase().includes(q) ||
      (t.date || '').toLowerCase().includes(q) ||
      (t.amt || '').toLowerCase().includes(q)
    );
  };

  const getFilteredRides = () => {
    if (!searchQuery.trim()) return ridesList;
    const q = searchQuery.toLowerCase();
    return ridesList.filter(ride =>
      (ride.vehicleType || '').toLowerCase().includes(q) ||
      (ride.pickupLocation || '').toLowerCase().includes(q) ||
      (ride.dropoffLocation || '').toLowerCase().includes(q) ||
      (ride.pickupDate || '').toLowerCase().includes(q) ||
      (ride.status || '').toLowerCase().includes(q)
    );
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
      console.error('Failed to save profile settings:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save profile settings.';
      setProfileError(msg);
      alert(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  // Load read notifications status
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`dms_luxe_read_notifications_${user._id}`);
    if (saved) {
      setReadNotifIds(JSON.parse(saved));
    }
  }, [user]);

  // Search autocomplete matching logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results = [];

    const actions = [
      { type: 'action', title: 'Go to Dashboard', desc: 'Home overview & maps', tab: 'dashboard', icon: '🏠' },
      { type: 'action', title: 'View Ride Activity', desc: 'Browse booking history & status', tab: 'activity', icon: '⏱️' },
      { type: 'action', title: 'View Wallet Balance', desc: 'Check money & transactions', tab: 'wallet', icon: '💳' },
      { type: 'action', title: 'Top-up Wallet Account', desc: 'Add money to your Swift Wallet', tab: 'wallet', trigger: 'add-money', icon: '➕' },
      { type: 'action', title: 'Link UPI ID', desc: 'Set up UPI address for payments', tab: 'wallet', focusId: 'wallet-upi-input', icon: '🔗' },
      { type: 'action', title: 'Edit Profile Settings', desc: 'Manage your name, email, phone', tab: 'profile', focusId: 'profile-fullname', icon: '👤' },
      { type: 'action', title: 'Add Saved Location', desc: 'Create a new address shortcut', tab: 'profile', trigger: 'add-location', icon: '📍' },
      { type: 'action', title: 'Add Emergency Contact', desc: 'Add contact details for safety', tab: 'profile', trigger: 'add-emergency', icon: '🚨' },
      { type: 'action', title: 'Log Out Session', desc: 'Logout of client portal', trigger: 'logout', icon: '🚪' }
    ];

    actions.forEach(act => {
      if (act.title.toLowerCase().includes(q) || act.desc.toLowerCase().includes(q)) {
        results.push(act);
      }
    });

    const settingsFields = [
      { type: 'setting', title: 'Update Full Name', desc: 'Change display name', tab: 'profile', focusId: 'profile-fullname', icon: '✏️' },
      { type: 'setting', title: 'Update Email Address', desc: 'Change account email login', tab: 'profile', focusId: 'profile-email', icon: '✉️' },
      { type: 'setting', title: 'Update Phone Number', desc: 'Change contact mobile number', tab: 'profile', focusId: 'profile-phone', icon: '📞' },
      { type: 'setting', title: 'Update Preferred Language', desc: 'Change default display language', tab: 'profile', focusId: 'profile-language', icon: '🌐' },
      { type: 'setting', title: 'Toggle Notification Preferences', desc: 'Configure email/sms updates', tab: 'profile', focusId: 'profile-notifications-pref', icon: '🔔' },
      { type: 'setting', title: 'Request Account Deletion', desc: 'Delete client profile information', tab: 'profile', trigger: 'delete-account', icon: '🗑️' }
    ];

    settingsFields.forEach(field => {
      if (field.title.toLowerCase().includes(q) || field.desc.toLowerCase().includes(q)) {
        results.push(field);
      }
    });

    ridesList.forEach(ride => {
      const idStr = ride._id.substring(18, 24).toUpperCase();
      const matchText = `${ride.vehicleType} ${ride.pickupLocation} ${ride.dropoffLocation} ${ride.status} RD-${idStr}`;
      if (matchText.toLowerCase().includes(q)) {
        results.push({
          type: 'ride',
          title: `Ride #${idStr} (${ride.vehicleType})`,
          desc: `${ride.pickupLocation.split(',')[0]} ➔ ${ride.dropoffLocation.split(',')[0]}`,
          tab: 'activity',
          rideId: ride._id,
          icon: '🚗'
        });
      }
    });

    getMergedTransactions().forEach(txn => {
      const matchText = `${txn.type} ${txn.desc} ${txn.amt}`;
      if (matchText.toLowerCase().includes(q)) {
        results.push({
          type: 'transaction',
          title: `Payment: ${txn.type}`,
          desc: `${txn.desc} (${txn.amt})`,
          tab: 'wallet',
          icon: txn.minus ? '📉' : '📈'
        });
      }
    });

    return results.slice(0, 8);
  };

  const handleSearchResultClick = (result) => {
    setSearchQuery('');
    setIsSearchFocused(false);

    if (result.tab) {
      handleTabChange(result.tab);
    }

    if (result.trigger === 'add-money') {
      setTimeout(() => {
        handleAddMoney();
      }, 350);
    } else if (result.trigger === 'add-location') {
      setTimeout(() => {
        handleAddAddress();
      }, 350);
    } else if (result.trigger === 'add-emergency') {
      setTimeout(() => {
        const contactBtn = document.getElementById('profile-emergency-add');
        if (contactBtn) {
          contactBtn.click();
        } else {
          alert('Manage emergency contacts settings.');
        }
      }, 350);
    } else if (result.trigger === 'delete-account') {
      setTimeout(() => {
        alert('Account delete requires contacting support@devqor.in.');
      }, 350);
    } else if (result.trigger === 'logout') {
      logout();
    }

    if (result.focusId) {
      setTimeout(() => {
        const elem = document.getElementById(result.focusId);
        if (elem) {
          elem.focus();
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          elem.classList.add('ring-2', 'ring-[#003893]', 'ring-offset-2');
          setTimeout(() => {
            elem.classList.remove('ring-2', 'ring-[#003893]', 'ring-offset-2');
          }, 2000);
        }
      }, 350);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    const allIds = getDynamicNotifications().map(n => n.id);
    setReadNotifIds(allIds);
    localStorage.setItem(`dms_luxe_read_notifications_${user._id}`, JSON.stringify(allIds));
  };

  const handleMarkNotificationRead = (id) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      localStorage.setItem(`dms_luxe_read_notifications_${user._id}`, JSON.stringify(updated));
    }
  };

  // Get notifications dynamically based on system activities (rides, wallet transactions)
  const getDynamicNotifications = () => {
    const list = [];

    // Welcome Notification (always present)
    list.push({
      id: 'welcome',
      title: 'Welcome to DMS Cab Servicese',
      desc: 'Your premium client portal is initialized. Configure your profile settings.',
      time: 'Setup complete',
      read: true,
      type: 'info'
    });

    // Wallet transactions
    transactions.forEach((txn, i) => {
      const id = `wallet-${i}`;
      if (txn.type === 'Added to Wallet') {
        list.push({
          id,
          title: 'Wallet Balance Credited',
          desc: `Successfully added ${txn.amt} to your Swift Wallet account.`,
          time: txn.date,
          read: readNotifIds.includes(id),
          type: 'wallet'
        });
      }
    });

    // Ride events
    ridesList.forEach((ride) => {
      const idStr = ride._id.substring(18, 24).toUpperCase();
      const compId = `ride-comp-${ride._id}`;
      const actId = `ride-act-${ride._id}`;
      if (ride.status === 'completed') {
        list.push({
          id: compId,
          title: `Ride Completed • #RD-${idStr}`,
          desc: `Your trip to ${ride.dropoffLocation.split(',')[0]} is completed. Total fare: ₹${ride.fare}.`,
          time: ride.pickupDate,
          read: readNotifIds.includes(compId),
          type: 'success'
        });
      } else if (['driver_assigned', 'driver_arrived', 'ride_started'].includes(ride.status)) {
        const labels = {
          driver_assigned: 'Chauffeur Assigned',
          driver_arrived: 'Chauffeur Waiting',
          ride_started: 'Trip In Progress'
        };
        const driverName = ride.driver?.fullName || 'Allocated chauffeur';
        list.push({
          id: actId,
          title: `${labels[ride.status]} • #RD-${idStr}`,
          desc: ride.status === 'driver_assigned'
            ? `Your chauffeur ${driverName} is heading to your pickup location.`
            : ride.status === 'driver_arrived'
              ? `Chauffeur is waiting at ${ride.pickupLocation.split(',')[0]}.`
              : `You are in transit to ${ride.dropoffLocation.split(',')[0]}.`,
          time: 'Active Now',
          read: readNotifIds.includes(actId),
          type: 'alert'
        });
      }
    });

    return list;
  };

  const handleAddAddress = () => {
    const label = prompt("Enter Address Label (e.g. Home, Office, Gym):");
    if (!label) return;
    const address = prompt(`Enter Address Details for ${label}:`);
    if (!address) return;

    const newAddr = {
      label,
      address,
      icon: label.toLowerCase().includes('home') ? 'home' : label.toLowerCase().includes('office') ? 'office' : 'heart'
    };

    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    localStorage.setItem(`dms_luxe_addresses_${user._id}`, JSON.stringify(updated));
  };

  const fetchRides = async (force = false) => {
    if (hasFetched.current && !force) return;
    hasFetched.current = true;

    try {
      setRidesLoading(true);
      setRidesError(null);
      const response = await api.get('/rides');
      if (response.data.success) {
        setRidesList(response.data.rides);
      } else {
        throw new Error(response.data.message || 'Failed to fetch rides.');
      }
    } catch (err) {
      console.error('Failed to fetch client rides:', err);
      setRidesError(err.response?.data?.message || err.message || 'Failed to load rides.');
      hasFetched.current = false;
    } finally {
      setRidesLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRides();
  }, [user]);

  // Socket setup
  useEffect(() => {
    if (!user || ridesList.length === 0) return;

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

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
      const response = await api.patch(
        `/rides/${selectedRideId}/rate`,
        {
          rating: userRating,
          feedback: feedbackText
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
      alert(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleResendOtp = async (rideId) => {
    setResendingOtpId(rideId);
    try {
      const response = await api.post(
        `/rides/${rideId}/resend-otp`,
        {}
      );
      if (response.data.success) {
        alert('A verification OTP has been emailed to you.');
      }
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      alert(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResendingOtpId(null);
    }
  };

  const getAddressIcon = (iconName) => {
    switch (iconName) {
      case 'home':
        return Heart;
      case 'office':
        return Navigation;
      default:
        return MapPin;
    }
  };

  // Active ride to track
  const activeRide = ridesList.find(
    r => ['pending', 'driver_assigned', 'driver_arrived', 'ride_started'].includes(r.status)
  );

  const prevActiveRideIdRef = useRef(null);

  useEffect(() => {
    if (activeRide) {
      prevActiveRideIdRef.current = activeRide._id;
    } else if (prevActiveRideIdRef.current) {
      const lastRideId = prevActiveRideIdRef.current;
      const lastRide = ridesList.find(r => r._id === lastRideId);
      if (lastRide && lastRide.status === 'completed' && !lastRide.rating) {
        handleOpenRatingModal(lastRideId);
      }
      prevActiveRideIdRef.current = null;
    }
  }, [activeRide, ridesList]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003893] font-serif text-sm tracking-wider uppercase animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Format dynamic stats
  const totalRidesCount = ridesList.length;
  const completedRides = ridesList.filter(r => r.status === 'completed');
  const totalSpentAmount = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
  const loyaltyPoints = Math.floor(totalSpentAmount / 20);

  const renderActiveRideCard = (ride) => {
    if (!ride) return null;

    const isPending = ride.status === 'pending';
    const isAssigned = ride.status === 'driver_assigned';
    const isArrived = ride.status === 'driver_arrived';
    const isStarted = ride.status === 'ride_started';

    let statusText = 'Processing reservation...';
    let statusDesc = 'We are locating an elite chauffeur near you.';
    let progressPercent = 10;

    if (isPending) {
      statusText = 'Finding Chauffeur...';
      statusDesc = 'Dispatching to nearby luxury vehicles.';
      progressPercent = 25;
    } else if (isAssigned) {
      statusText = 'Chauffeur En Route';
      statusDesc = 'Your chauffeur is traveling to your location.';
      progressPercent = 50;
    } else if (isArrived) {
      statusText = 'Chauffeur Arrived';
      statusDesc = 'Your vehicle has arrived at the pickup location.';
      progressPercent = 75;
    } else if (isStarted) {
      statusText = 'En Route';
      statusDesc = 'Enjoy your luxury journey to destination.';
      progressPercent = 100;
    }

    return (
      <div className="bg-[#0b1019] border border-[#003893]/35 text-white rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden text-left">
        {/* Luxury top border highlight */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#003893] via-[#F8C301] to-[#003893]"></div>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[9px] text-[#F8C301] font-bold uppercase tracking-wider">Live Journey Tracker</span>
            <h4 className="text-base font-serif font-bold text-white">{statusText}</h4>
            <p className="text-[10px] text-gray-400">{statusDesc}</p>
          </div>
          <div className="text-right">
            <span className="inline-block text-[8px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-white/10 text-white border border-white/20">
              {ride.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#003893] to-[#F8C301] h-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Route Details */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
          <div className="flex items-start space-x-3 text-xs">
            <div className="flex flex-col items-center mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></div>
              <div className="w-[1.5px] h-6 bg-white/20 my-1"></div>
              <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/20"></div>
            </div>
            <div className="flex-grow space-y-2">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Pickup</p>
                <p className="text-xs text-white font-medium truncate max-w-[280px]">{ride.pickupLocation}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#d4af37] uppercase tracking-wider font-bold">Destination</p>
                <p className="text-xs text-[#d4af37] font-semibold truncate max-w-[280px]">{ride.dropoffLocation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chauffeur Details */}
        {!isPending && ride.driver && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3.5 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#003893]/15 border border-[#003893]/30 flex items-center justify-center text-[#F8C301] font-bold text-sm">
                {ride.driver.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{ride.driver.fullName}</p>
                <p className="text-[10px] text-gray-400 font-medium">{ride.driver.vehicleType || 'Luxury Class'}</p>
                <p className="text-[9px] font-bold tracking-widest text-[#F8C301] uppercase mt-0.5">{ride.driver.vehicleNumber}</p>
              </div>
            </div>
            
            <a 
              href={`tel:${ride.driver.phone || ''}`}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
            >
              <Phone size={14} />
            </a>
          </div>
        )}

        {/* OTP Display Card (if assigned or arrived) */}
        {(isAssigned || isArrived) && (
          <div className="bg-gradient-to-r from-[#003893]/10 to-[#F8C301]/10 border border-[#003893]/20 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[9px] text-[#F8C301] font-bold uppercase tracking-wider">Start Verification Code</span>
            
            {ride.rideOtp ? (
              <div className="text-2xl font-bold font-mono tracking-[4px] text-[#F8C301] bg-black/40 border border-[#003893]/30 px-6 py-1.5 rounded-lg shadow-inner">
                {ride.rideOtp}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">
                Generating verification code...
              </div>
            )}
            
            <p className="text-[10px] text-gray-400 max-w-[250px] leading-relaxed">
              Tell this code to your chauffeur to authorize and start the journey.
            </p>
            
            <button
              onClick={() => handleResendOtp(ride._id)}
              disabled={resendingOtpId === ride._id}
              className="text-[10px] font-bold text-[#F8C301] hover:text-white uppercase tracking-wider transition-colors disabled:opacity-40 mt-1 cursor-pointer"
            >
              {resendingOtpId === ride._id ? 'Sending...' : 'Resend Code via Email'}
            </button>
          </div>
        )}

        {/* Action button */}
        {isPending && (
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to cancel this booking?')) {
                try {
                  const response = await api.put(`/rides/${ride._id}/cancel`);
                  if (response.data.success) {
                    alert('Booking cancelled successfully.');
                    fetchRides(true);
                    
                    // Fetch fresh profile data to update wallet balance if refunded
                    try {
                      const meResponse = await getMe();
                      if (meResponse.success && meResponse.user) {
                        updateUser(meResponse.user);
                      }
                    } catch (e) {
                      console.error('Failed to refresh user profile:', e);
                    }
                  }
                } catch (err) {
                  alert(err.response?.data?.message || 'Failed to cancel booking.');
                }
              }
            }}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel Booking
          </button>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // DECOMPOSED COMPONENT RENDERING
  // ----------------------------------------------------

  const renderMobileHome = () => (
    <ClientOverview
      user={user}
      activeRide={activeRide}
      savedAddresses={savedAddresses}
      ridesList={ridesList}
      totalRidesCount={totalRidesCount}
      navigate={navigate}
      handleTabChange={handleTabChange}
      renderActiveRideCard={renderActiveRideCard}
      getAddressIcon={getAddressIcon}
    />
  );

  const renderMobileActivity = () => (
    <ClientActivity
      ridesList={ridesList}
      ridesLoading={ridesLoading}
      resendingOtpId={resendingOtpId}
      searchQuery={searchQuery}
      getFilteredRides={getFilteredRides}
      handleResendOtp={handleResendOtp}
      handleOpenRatingModal={handleOpenRatingModal}
      navigate={navigate}
    />
  );

  const renderMobileWallet = () => (
    <ClientWallet
      user={user}
      walletBalance={walletBalance}
      transactions={transactions}
      upiId={upiId}
      upiInput={upiInput}
      setUpiInput={setUpiInput}
      handleLinkUpi={handleLinkUpi}
      getFilteredTransactions={getFilteredTransactions}
      searchQuery={searchQuery}
      updateUser={updateUser}
      onBalanceUpdate={(newBal) => setWalletBalance(newBal)}
    />
  );

  const renderMobileProfile = () => (
    <ClientProfile
      user={user}
      profileForm={profileForm}
      setProfileForm={setProfileForm}
      handleSaveProfile={handleSaveProfile}
      profileSaving={profileSaving}
      savedAddresses={savedAddresses}
      handleAddAddress={handleAddAddress}
      handleDeleteAccount={handleDeleteAccount}
      setIsProfileOpen={setIsProfileOpen}
      totalRidesCount={totalRidesCount}
    />
  );

  const renderDesktopHome = () => renderMobileHome();
  const renderDesktopWallet = () => renderMobileWallet();
  const renderDesktopActivity = () => renderMobileActivity();
  const renderDesktopProfile = () => renderMobileProfile();

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action will deactivate your profile and log you out, but your ride history will be preserved for compliance."
    );
    if (!confirmDelete) return;

    try {
      const response = await deleteAccount();
      alert(response.message || 'Account deleted successfully.');

      // Clear session storage context
      sessionStorage.removeItem('dms_luxe_user');
      sessionStorage.removeItem('dms_luxe_tab_id');
      window.name = '';

      // Redirect to home
      window.location.replace('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert(err.response?.data?.message || 'Failed to delete account. Please try again.');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[76px]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003893] font-serif text-xs tracking-widest uppercase animate-pulse font-bold">Verifying Security Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-white text-slate-900 pt-[76px]">
      {isMobileViewport ? (
        // Mobile Layout (Page 1 & 2)
        <div className="flex flex-col min-h-screen pb-20">
          {/* Mobile Top Header */}
          <header className="flex justify-between items-center px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm hidden">
            <button className="text-slate-500 hover:text-slate-800">
              <Menu size={20} />
            </button>
            <ImageWithFallback src="/logo.png" alt="DMS" className="h-8 object-contain" />
            <button onClick={() => setIsProfileOpen(true)} className="w-8 h-8 rounded-full bg-[#003893]/10 flex items-center justify-center border border-[#003893]/20 text-[#003893] font-bold text-sm">
              {user.fullName?.charAt(0).toUpperCase() || 'A'}
            </button>
          </header>

          {/* Active Tab View */}
          <main className="flex-grow p-4">
            {activeTab === 'dashboard' && renderMobileHome()}
            {activeTab === 'activity' && renderMobileActivity()}
            {activeTab === 'wallet' && renderMobileWallet()}
            {activeTab === 'profile' && renderMobileProfile()}
          </main>

          {/* Bottom Tab Bar */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-6 flex justify-between items-center z-40 shadow-lg">
            {[
              { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
              { id: 'activity', label: 'ACTIVITY', icon: Clock },
              { id: 'wallet', label: 'WALLET', icon: Wallet },
              { id: 'profile', label: 'PROFILE', icon: User }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex flex-col items-center space-y-1.5 focus:outline-none"
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
        // Desktop Layout (Page 4)
        <div className="flex min-h-[calc(100vh-76px)]">
          {/* Left Sidebar */}
          <aside className="w-72 bg-slate-50 border-r border-slate-200/60 flex flex-col justify-between p-6 shrink-0 h-[calc(100vh-76px)] sticky top-[76px]">
            <div className="space-y-8 text-left">

              {/* Navigation Links */}
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'activity', label: 'Activity', icon: Clock },
                  { id: 'wallet', label: 'Wallet', icon: Wallet },
                  { id: 'profile', label: 'Profile', icon: User }
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all text-left ${isActive
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
                  {user.fullName?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 truncate max-w-[110px]">{user.fullName || 'Pritam Mondal'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.role || 'CLIENT'}</p>
                </div>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Logout">
                <X size={16} />
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Top Search & Profile Bar */}
            <header className="h-16 border-b border-slate-200 px-8 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="relative w-72 text-left">
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-full px-5 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                />

                <AnimatePresence>
                  {isSearchFocused && searchQuery.trim() && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsSearchFocused(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-40 text-left"
                      >
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Results</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                          {getSearchResults().length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 text-center">No results matching "{searchQuery}"</p>
                          ) : (
                            getSearchResults().map((res, index) => (
                              <button
                                key={index}
                                onClick={() => handleSearchResultClick(res)}
                                className="w-full p-3 hover:bg-slate-50 transition-colors flex items-start space-x-2 text-left group cursor-pointer"
                              >
                                <span className="text-sm shrink-0">{res.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#003893] transition-colors truncate">{res.title}</p>
                                  <p className="text-[9px] text-slate-400 truncate">{res.desc}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center space-x-4">
                {/* Settings Cogwheel Button */}
                <button
                  onClick={() => handleTabChange('profile')}
                  className="text-[#9f94e8] hover:text-[#7f74df] transition-colors p-2 hover:bg-slate-100/50 rounded-full cursor-pointer"
                  title="Account Settings"
                >
                  <SettingsIcon size={18} />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-[#ffb700] hover:text-[#e5ad04] transition-colors p-2 hover:bg-slate-100/50 rounded-full relative cursor-pointer"
                    title="Alerts"
                  >
                    <BellIcon size={18} fill="currentColor" />
                    {getDynamicNotifications().filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-50 text-left"
                        >
                          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                            <div className="flex items-center space-x-2">
                              {getDynamicNotifications().filter(n => !n.read).length > 0 && (
                                <button
                                  onClick={handleMarkAllNotificationsRead}
                                  className="text-[9px] text-[#003893] hover:underline uppercase font-bold cursor-pointer"
                                >
                                  Mark all as read
                                </button>
                              )}
                              {getDynamicNotifications().filter(n => !n.read).length > 0 && (
                                <span className="text-[10px] bg-[#003893]/10 text-[#003893] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {getDynamicNotifications().filter(n => !n.read).length} New
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                            {getDynamicNotifications().length === 0 ? (
                              <p className="p-4 text-xs text-slate-400 text-center">No alerts logged yet.</p>
                            ) : (
                              getDynamicNotifications().map((notif) => (
                                <button
                                  key={notif.id}
                                  onClick={() => {
                                    handleMarkNotificationRead(notif.id);
                                    setShowNotifications(false);
                                    if (notif.type === 'wallet') handleTabChange('wallet');
                                    else if (notif.type === 'success' || notif.type === 'alert') handleTabChange('activity');
                                    else handleTabChange('profile');
                                  }}
                                  className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-start space-x-3 group cursor-pointer"
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${notif.read
                                      ? 'bg-slate-50 text-slate-400'
                                      : notif.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : notif.type === 'alert'
                                          ? 'bg-amber-50 text-amber-600'
                                          : notif.type === 'wallet'
                                            ? 'bg-blue-50 text-[#003893]'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {notif.type === 'success' ? (
                                      <span>✔️</span>
                                    ) : notif.type === 'alert' ? (
                                      <Navigation size={14} />
                                    ) : notif.type === 'wallet' ? (
                                      <Wallet size={14} />
                                    ) : (
                                      <User size={14} />
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className={`text-xs text-slate-800 group-hover:text-[#003893] transition-colors ${notif.read ? 'font-medium' : 'font-bold'}`}>{notif.title}</p>
                                    <p className="text-[10px] text-slate-500 leading-normal">{notif.desc}</p>
                                    <p className="text-[9px] text-slate-400">{notif.time}</p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-px h-6 bg-slate-200" />
                <button onClick={() => setIsProfileOpen(true)} className="flex items-center space-x-2 text-left group">
                  <div className="w-8 h-8 rounded-full bg-[#003893]/10 border border-[#003893]/30 flex items-center justify-center text-[#003893] font-bold text-xs">
                    {user.fullName?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">{user.fullName || 'Pritam Mondal'}</span>
                </button>
              </div>
            </header>

            {/* Main content body */}
            <main className="flex-grow p-8 overflow-y-auto">
              {activeTab === 'dashboard' && renderDesktopHome()}
              {activeTab === 'wallet' && renderDesktopWallet()}
              {activeTab === 'activity' && renderDesktopActivity()}
              {activeTab === 'profile' && renderDesktopProfile()}
            </main>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Premium Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Visual Blue Bar at top */}
            <div className="absolute left-0 right-0 top-0 h-1.5 bg-[#003893]" />

            <h3 className="text-xl font-serif text-slate-800 mb-2 font-bold">Rate Your Journey with {driverNameForRating}</h3>
            <p className="text-xs text-slate-500 mb-6">Your feedback helps us maintain our peak chauffeur service standards.</p>

            <form onSubmit={handleSubmitRating} className="space-y-6">
              {/* Stars */}
              <div className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Select Rating</p>
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
                        className="p-1 transition-transform active:scale-95 cursor-pointer animate-none"
                      >
                        <Star
                          size={32}
                          className={`transition-colors duration-200 ${isLit
                              ? 'text-[#f2b705] fill-[#f2b705]'
                              : 'text-slate-300 hover:text-slate-400'
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-[#003893] mt-2 h-4">
                  {userRating === 5 && 'Exceeded Expectations • 5/5'}
                  {userRating === 4 && 'Very Satisfied • 4/5'}
                  {userRating === 3 && 'Good Service • 3/5'}
                  {userRating === 2 && 'Needs Improvement • 2/5'}
                  {userRating === 1 && 'Unsatisfactory • 1/5'}
                </span>
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Chauffeur & Journey Comments</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share details about the cleanliness, driving safety, or courtesy..."
                  className="w-full h-24 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003893] transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ratingSubmitting}
                  className="flex-1 bg-[#003893] text-white hover:bg-[#002d72] py-3 rounded-xl text-xs font-bold transition-colors shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center"
                >
                  {ratingSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
