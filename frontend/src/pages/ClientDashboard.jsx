import React, { useState, useEffect, useRef } from 'react';
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
import axios from 'axios';
import { updateProfile, deleteAccount } from '../services/authService';
import NotFoundPage from './NotFoundPage';

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

  // Load wallet details from localStorage
  useEffect(() => {
    if (!user) return;

    // Balance
    const savedBalance = localStorage.getItem(`dms_luxe_wallet_balance_${user._id}`);
    if (savedBalance !== null) {
      setWalletBalance(parseFloat(savedBalance));
    } else {
      const defaultBalance = 1500.00;
      setWalletBalance(defaultBalance);
      localStorage.setItem(`dms_luxe_wallet_balance_${user._id}`, defaultBalance.toString());
    }

    // UPI ID
    const savedUpi = localStorage.getItem(`dms_luxe_upi_${user._id}`);
    if (savedUpi !== null) {
      setUpiId(savedUpi);
      setUpiInput(savedUpi);
    } else {
      setUpiId('');
      setUpiInput('');
    }

    // Transactions
    const savedTxns = localStorage.getItem(`dms_luxe_transactions_${user._id}`);
    if (savedTxns !== null) {
      setTransactions(JSON.parse(savedTxns));
    } else {
      const defaultTxns = [
        { type: 'Initial Welcome Bonus', desc: 'Welcome bonus credit', amt: '+ ₹500.00', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString(), minus: false, value: 500 },
        { type: 'Added to Wallet', desc: 'Top-up via Visa card', amt: '+ ₹1,000.00', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(), minus: false, value: 1000 }
      ];
      setTransactions(defaultTxns);
      localStorage.setItem(`dms_luxe_transactions_${user._id}`, JSON.stringify(defaultTxns));
    }
  }, [user]);

  const handleAddMoney = () => {
    const amountStr = prompt("Enter the amount you would like to top up (INR):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    const newBalance = walletBalance + amount;
    setWalletBalance(newBalance);
    localStorage.setItem(`dms_luxe_wallet_balance_${user._id}`, newBalance.toString());

    // Add transaction
    const newTxn = {
      type: 'Added to Wallet',
      desc: 'Top-up via Card/UPI',
      amt: `+ ₹${amount.toLocaleString()}`,
      date: new Date().toLocaleString(),
      minus: false,
      value: amount
    };
    const updatedTxns = [newTxn, ...transactions];
    setTransactions(updatedTxns);
    localStorage.setItem(`dms_luxe_transactions_${user._id}`, JSON.stringify(updatedTxns));
    alert(`Successfully added ₹${amount.toLocaleString()} to your wallet!`);
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

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

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
      const token = sessionStorage.getItem('dms_luxe_token');
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
      alert(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleResendOtp = async (rideId) => {
    setResendingOtpId(rideId);
    try {
      const token = sessionStorage.getItem('dms_luxe_token');
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

  // ----------------------------------------------------
  // MOBILE SCREEN RENDERERS (Page 1 & 2)
  // ----------------------------------------------------

  const renderMobileHome = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="space-y-6">
        {/* Weather / Time / Kolkata header row */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
          {/* Weather */}
          <div className="space-y-1">
            <div className="text-xs text-[#003893] font-medium flex items-center justify-center space-x-1">
              <span>☀️</span>
              <span>28°C</span>
            </div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase">Partly Cloudy</div>
          </div>
          {/* Time */}
          <div className="space-y-1 border-x border-slate-200">
            <div className="text-xs text-slate-800 font-mono font-semibold">{formattedTime}</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase">{formattedDate}</div>
          </div>
          {/* Location */}
          <div className="space-y-1">
            <div className="text-xs text-[#003893] font-medium truncate px-1">Kolkata</div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase">West Bengal</div>
          </div>
        </div>

        {/* Map */}
        <div className="relative bg-slate-50 border border-slate-200 rounded-2xl h-80 overflow-hidden shadow-inner">
          <TrackingMap role="client" />
        </div>

        {/* Bottom sheet layout "Where to?" */}
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
      </div>
    );
  };

  const renderMobileActivity = () => {
    return (
      <div className="space-y-6">
        <div className="text-left space-y-1">
          <h2 className="text-2xl font-serif font-bold text-slate-800">Activity</h2>
          <p className="text-xs text-slate-400">Track and manage your journeys</p>
        </div>

        {/* Tab switcher: Past / Upcoming */}
        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-full">
          <button className="flex-1 py-2 text-xs font-bold bg-[#003893]/10 border border-[#003893]/20 text-[#003893] rounded-full">
            Past
          </button>
          <button onClick={() => navigate('/get-started')} className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-[#003893] rounded-full">
            Upcoming
          </button>
        </div>

        {/* Activity list */}
        <div className="space-y-4">
          {ridesList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Car size={32} className="mx-auto mb-2 opacity-35" />
              <p className="text-xs">No journeys logged yet.</p>
            </div>
          ) : (
            ridesList.map((ride, idx) => (
              <div key={ride._id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#003893]/10 flex items-center justify-center border border-[#003893]/20">
                      <Car size={14} className="text-[#003893]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase">{ride.vehicleType || 'Premium XL'}</h4>
                      <p className="text-[9px] text-slate-400">{ride.pickupDate} • {ride.pickupTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">₹{ride.fare || 450}</p>
                    <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${ride.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                        : ride.status === 'cancelled'
                          ? 'bg-red-100 text-red-600 border border-red-200'
                          : 'bg-amber-100 text-amber-600 border border-amber-200 animate-pulse'
                      }`}>
                      {ride.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 relative pl-4 border-l border-slate-200 ml-4 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Pickup</span>
                    <p className="text-slate-600 truncate max-w-[240px]">{ride.pickupLocation}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Dropoff</span>
                    <p className="text-slate-600 truncate max-w-[240px]">{ride.dropoffLocation}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMobileWallet = () => {
    return (
      <div className="space-y-6">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-[#003893] to-[#002d72] border border-[#003893]/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute right-4 top-4 bg-white/10 p-2 rounded-full border border-white/20">
            <ShieldCheck size={18} className="text-white" />
          </div>

          <div className="space-y-4 text-left">
            <div>
              <p className="text-[10px] text-[#f2b705] font-bold tracking-widest uppercase">Total Balance</p>
              <h2 className="text-3xl font-bold font-serif text-white mt-1">₹{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>

            <button onClick={handleAddMoney} className="bg-white text-[#003893] hover:bg-slate-50 px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all">
              <span>+ Add Money</span>
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-serif font-bold text-slate-800 uppercase tracking-wider">Payment Methods</h3>
            <button className="text-[10px] text-slate-400 hover:text-[#003893] uppercase font-bold tracking-wider">Manage</button>
          </div>

          <div className="space-y-3">
            {/* Card */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">HDFC Credit Card</p>
                  <p className="text-[10px] text-slate-400">•••• 8829</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            {/* UPI */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#003893]/10 flex items-center justify-center text-[#003893] border border-[#003893]/20">
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Linked UPI ID</p>
                  <p className="text-[10px] text-slate-400">{upiId || 'Not linked yet'}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-serif font-bold text-slate-800 uppercase tracking-wider">Recent Transactions</h3>
            <button className="text-slate-400 hover:text-[#003893]">
              <History size={16} />
            </button>
          </div>

          <div className="space-y-1 divide-y divide-slate-100">
            {getMergedTransactions().length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No transactions found.</p>
            ) : (
              getMergedTransactions().slice(0, 5).map((txn, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${txn.minus ? 'bg-red-100 text-red-500 border border-red-200' : 'bg-emerald-100 text-emerald-550 border border-emerald-200'}`}>
                      <Car size={14} className={txn.minus ? 'text-red-500' : 'text-emerald-500'} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{txn.type}</p>
                      <p className="text-[9px] text-slate-400 truncate max-w-[200px]">{txn.desc} • {txn.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${txn.minus ? 'text-red-500' : 'text-emerald-600'}`}>{txn.amt}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMobileProfile = () => {
    return (
      <div className="space-y-6 text-left">
        {/* Profile details header */}
        <div className="bg-gradient-to-b from-[#003893]/10 to-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#003893]/10 flex items-center justify-center text-[#003893] border-2 border-[#003893] text-3xl font-bold font-serif">
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => setIsProfileOpen(true)} className="absolute bottom-0 right-0 w-6 h-6 bg-[#003893] text-white rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-[10px]">✏️</span>
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 font-serif">{user.fullName || 'Rajesh Kumar'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{user.phone || '+91 98765 43210'}</p>
            </div>
          </div>

          {/* Rating, Rides, Member Since row */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 mt-6 text-center text-xs">
            <div>
              <p className="text-slate-800 font-bold">4.9</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Rating</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-slate-800 font-bold">{totalRidesCount}</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Rides</p>
            </div>
            <div>
              <p className="text-slate-800 font-bold">3 yrs</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Member</p>
            </div>
          </div>
        </div>

        {/* Options list */}
        <div className="space-y-1">
          {[
            { label: 'Edit Profile', action: () => setIsProfileOpen(true) },
            { label: 'Saved Locations', action: handleAddAddress },
            { label: 'Emergency Contacts', action: () => alert('Manage emergency contacts settings.') },
            { label: 'Settings', action: () => alert('Settings menu details.') },
            { label: 'Support', action: () => alert('Support tickets and requests.') },
            { label: 'Legal', action: () => alert('Legal notices.') }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-all text-left group"
            >
              <span className="text-xs font-semibold text-slate-600 group-hover:text-[#003893] transition-colors">{item.label}</span>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-[#003893] transition-colors" />
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-500 py-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all"
        >
          <span>Logout</span>
        </button>
      </div>
    );
  };

  // ----------------------------------------------------
  // DESKTOP LAYOUT RENDERERS (Page 4)
  // ----------------------------------------------------

  const renderDesktopHome = () => {
    return (
      <div className="space-y-6 text-left">
        <div>
          <h2 className="text-3xl font-bold font-serif text-slate-800">Welcome back, {user.fullName?.split(' ')[0] || 'Alex'}.</h2>
          <p className="text-slate-400 text-sm mt-1">Your next premium ride is just a tap away.</p>
        </div>

        {/* Stats boxes */}
        <div className="grid grid-cols-3 gap-5">
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Rides</span>
            <h3 className="text-3xl font-serif text-slate-800 font-bold mt-2">{totalRidesCount || 128}</h3>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
            <span className="text-[10px] text-[#003893] font-bold uppercase tracking-widest">Member Status</span>
            <h3 className="text-3xl font-serif text-[#003893] font-bold mt-2">Gold</h3>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reward Points</span>
            <h3 className="text-3xl font-serif text-slate-800 font-bold mt-2">4,250</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map & Go Home/Office shortcut buttons */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative bg-slate-50 border border-slate-200 rounded-2xl h-96 overflow-hidden">
              <TrackingMap role="client" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/get-started', { state: { pickupLocation: '', dropoffLocation: '221B, Southern Avenue, Kalighat' } })}
                className="bg-slate-50 border border-slate-200 hover:border-[#003893]/30 p-5 rounded-2xl flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#003893]/10 flex items-center justify-center text-[#003893]">
                    <Heart size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Go Home</h4>
                    <p className="text-[10px] text-slate-400">221B, Southern Avenue, Kalighat</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-[#003893] transition-all" />
              </button>

              <button
                onClick={() => navigate('/get-started', { state: { pickupLocation: '', dropoffLocation: 'TCS Tower, Action Area II, New Town' } })}
                className="bg-slate-50 border border-slate-200 hover:border-[#003893]/30 p-5 rounded-2xl flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Office</h4>
                    <p className="text-[10px] text-slate-400">TCS Tower, Action Area II, New Town</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-[#003893] transition-all" />
              </button>
            </div>
          </div>

          {/* Swift Wallet card & Recent Activity & Refer block */}
          <div className="lg:col-span-4 space-y-6">
            {/* Swift Wallet card */}
            <div className="bg-gradient-to-br from-[#003893] to-[#002d72] border border-[#003893]/30 rounded-2xl p-6 text-left relative overflow-hidden shadow-md">
              <p className="text-[9px] text-[#f2b705] font-bold uppercase tracking-widest">Swift Wallet</p>
              <div className="mt-4">
                <span className="text-xs text-white/70 uppercase">Total Balance</span>
                <h3 className="text-3xl font-serif text-white font-bold mt-1">₹{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-white/50">INR</span></h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={handleAddMoney} className="bg-white text-[#003893] hover:bg-slate-50 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all">Top Up</button>
                <button onClick={() => handleTabChange('wallet')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all">Details</button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Activity</h4>
              <div className="space-y-4">
                {getMergedTransactions().length === 0 ? (
                  <p className="text-xs text-slate-400">No recent activity.</p>
                ) : (
                  getMergedTransactions().slice(0, 3).map((act, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 truncate max-w-[150px]">{act.type}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{act.desc} • {act.date}</p>
                      </div>
                      <span className={act.minus ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>{act.amt}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Refer a friend block */}
            <div className="bg-gradient-to-r from-[#003893]/5 to-transparent border border-[#003893]/10 rounded-2xl p-5 text-left relative overflow-hidden">
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

  const renderDesktopWallet = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* Left Side: Balance card, credit card, transaction history */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800">Wallet Dashboard</h2>

          {/* Balance card */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available Balance</span>
              <div className="flex items-center space-x-2 mt-2">
                <h3 className="text-3xl font-serif text-slate-800 font-bold">₹{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <span className="bg-emerald-100 border border-emerald-200 text-emerald-600 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">Secured</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button id="wallet-add-money-btn" onClick={handleAddMoney} className="bg-[#003893] hover:bg-[#002d72] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md">+ Add Money</button>
              <button onClick={() => alert('Transfer functionality is coming soon!')} className="bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-800 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">Transfer</button>
            </div>
          </div>

          {/* Credit card design */}
          <div className="bg-gradient-to-br from-[#003893] to-[#002d72] border border-[#003893]/20 rounded-2xl p-6 relative overflow-hidden h-48 flex flex-col justify-between max-w-sm shadow-md">
            <div className="flex justify-between items-start">
              <div className="text-[10px] text-white/80 uppercase tracking-widest font-mono">DMS CAB SERVICES</div>
              <div className="w-8 h-6 bg-yellow-500/20 rounded border border-yellow-500/30" />
            </div>
            <div className="text-lg font-mono text-white tracking-widest font-bold">•••• •••• •••• 8842</div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] text-white/50 uppercase">Card Holder</p>
                <p className="text-xs text-white font-medium">{profileForm.fullName || user.fullName || 'Pritam Mondal'}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-white/50 uppercase">Expires</p>
                <p className="text-xs text-white font-mono">12/28</p>
              </div>
            </div>
          </div>

          {/* Transaction history list */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Transaction History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-left">
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Reference</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {getFilteredTransactions().length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-400">
                        {searchQuery ? `No transactions match: "${searchQuery}"` : 'No transactions recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    getFilteredTransactions().map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-100/50 transition-colors">
                        <td className="py-3.5 font-medium text-slate-800">{t.type}</td>
                        <td className="py-3.5 text-slate-400">{t.date}</td>
                        <td className="py-3.5 font-mono text-slate-400 truncate max-w-[150px]">{t.desc}</td>
                        <td className={`py-3.5 font-bold text-right ${t.minus ? 'text-red-500' : 'text-emerald-600'}`}>{t.amt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: rewards, link upi, security */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rewards Points */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Rewards Points</span>
            <div className="text-4xl font-serif font-bold text-[#003893]">{Math.floor(ridesList.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.fare || 0), 0) / 20)} <span className="text-xs text-slate-400">pts</span></div>
            <p className="text-[10px] text-slate-400">Earn 5 points for every ₹100 spent</p>
            <button onClick={() => alert('Rewards store coming soon!')} className="w-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all">Redeem for Rides</button>
          </div>

          {/* Link UPI ID */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Link UPI ID</h4>
            <div className="flex space-x-2">
              <input
                id="wallet-upi-input"
                type="text"
                placeholder="alex.rivera@upi"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800"
              />
              <button id="wallet-upi-link-btn" onClick={handleLinkUpi} className="bg-[#003893] hover:bg-[#002d72] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm">Link</button>
            </div>
          </div>

          {/* Trust & Security info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Trust & Security</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">Your credit card data is encrypted using military-grade AES-256 standard protocols. DMS Cab Services never stores CVV code records on its servers.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopActivity = () => {
    const getVehicleImage = (type) => {
      const t = (type || '').toLowerCase();
      if (t.includes('v-class') || t.includes('v class') || t.includes('van')) return '/Mercedes-Benz V-Class.webp';
      if (t.includes('range rover') || t.includes('rover') || t.includes('suv')) return '/Range Rover Autobiography.webp';
      return '/Mercedes-Benz S-Class.webp';
    };

    return (
      <div className="space-y-6 text-left">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">Ride Activity</h2>
            <p className="text-xs text-slate-400 mt-1">Review your recent movements and trip expenses.</p>
          </div>

          <div className="flex space-x-3">
            <button onClick={() => fetchRides(true)} className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold">Refresh</button>
            <button onClick={() => alert('PDF export coming soon!')} className="bg-[#003893] hover:bg-[#002d72] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm">Export PDF</button>
          </div>
        </div>

        {/* Activity list table */}
        <div className="space-y-4">
          {ridesLoading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-8 h-8 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs">Loading rides history...</p>
            </div>
          ) : ridesList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
              <Car size={32} className="mx-auto mb-2 opacity-35 animate-none" />
              <p className="text-xs">No journeys logged yet.</p>
              <button onClick={() => navigate('/get-started')} className="text-xs text-[#003893] font-bold mt-2 hover:underline">Book your first ride now</button>
            </div>
          ) : getFilteredRides().length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
              <p className="text-xs">No journeys match your search query: "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} className="text-xs text-[#003893] font-bold mt-2 hover:underline">Clear search filter</button>
            </div>
          ) : (
            getFilteredRides().map((ride, idx) => {
              const hasDriver = ride.driver && ride.driver.fullName;
              const isCompleted = ride.status === 'completed';
              const isCancelled = ride.status === 'cancelled';
              const isRated = !!ride.rating;

              return (
                <div key={ride._id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-[#003893]/20 transition-all shadow-sm">
                  {/* Map/Image */}
                  <div className="w-full md:w-48 h-40 md:h-auto overflow-hidden relative bg-black/5 shrink-0">
                    <img src={getVehicleImage(ride.vehicleType)} alt={ride.vehicleType} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-[#003893] px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-white">{ride.vehicleType || 'Premium XL'}</div>
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

                    <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-medium">
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
                          <span className="text-amber-500 font-bold text-[9px] uppercase tracking-wider flex items-center">
                            ⭐ {ride.rating}/5 Rated
                          </span>
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

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action will deactivate your profile and log you out, but your ride history will be preserved for compliance."
    );
    if (!confirmDelete) return;

    try {
      const response = await deleteAccount();
      alert(response.message || 'Account deleted successfully.');

      // Clear session storage context
      sessionStorage.removeItem('dms_luxe_token');
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

  const renderDesktopProfile = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* Left Form: Personal Information */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">Account Settings</h2>
            <p className="text-xs text-slate-400 mt-1">Manage your premium profile and preferences.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
            {/* Header info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#003893]/10 flex items-center justify-center text-[#003893] border-2 border-[#003893] text-2xl font-bold font-serif relative">
                {profileForm.fullName?.charAt(0).toUpperCase()}
                <button onClick={() => setIsProfileOpen(true)} className="absolute bottom-0 right-0 w-5 h-5 bg-[#003893] text-white rounded-full flex items-center justify-center border border-white text-[8px] font-bold shadow-sm">✏️</button>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Personal Information</h4>
                <p className="text-[10px] text-slate-400">Update your details and how we address you.</p>
              </div>
            </div>

            {/* Fields form */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <input
                  id="profile-fullname"
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                <input
                  id="profile-phone"
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Language</label>
                <select
                  id="profile-language"
                  value={profileForm.language}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                >
                  <option>English (US)</option>
                  <option>Spanish (ES)</option>
                  <option>French (FR)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                id="profile-save-btn"
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="bg-[#003893] hover:bg-[#002d72] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center space-x-2"
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

        {/* Right Side Column: emergency, locations, notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Emergency Contact */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Emergency Contact</h4>
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 border border-red-200 font-bold text-xs">SM</div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Sarah Miller</p>
                  <p className="text-[9px] text-slate-400">Partner • +1 555-9876</p>
                </div>
              </div>
              <button className="text-xs text-[#003893] font-bold">✏️</button>
            </div>
            <button id="profile-emergency-add" className="w-full bg-transparent border border-dashed border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700 py-2.5 rounded-xl text-xs font-semibold"><span>+ Add New Contact</span></button>
          </div>

          {/* Saved Locations */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Saved Locations</h4>
            <div className="space-y-2 text-xs">
              {savedAddresses.map((addr) => (
                <div key={addr.label} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">{addr.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{addr.address}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              ))}
            </div>
            <button id="profile-location-add" onClick={handleAddAddress} className="w-full text-center text-[#003893] font-bold text-xs pt-2 block hover:underline">+ Add New Location</button>
          </div>

          {/* Notification Preferences */}
          <div id="profile-notifications-pref" className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notification Preferences</h4>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Ride Updates</span>
                <input type="checkbox" defaultChecked className="accent-[#003893]" />
              </div>
              <div className="flex justify-between items-center">
                <span>Email Receipts</span>
                <input type="checkbox" defaultChecked className="accent-[#003893]" />
              </div>
              <div className="flex justify-between items-center">
                <span>Offers & News</span>
                <input type="checkbox" className="accent-[#003893]" />
              </div>
            </div>
          </div>

          {/* Delete Account */}
          <button
            onClick={handleDeleteAccount}
            className="w-full bg-red-50 hover:bg-red-500 border border-slate-200 hover:border-red-500 text-red-500 hover:text-white py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
          >
            Delete Account
          </button>
        </div>
      </div>
    );
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
            <img src="/logo.png" alt="DMS" className="h-8 object-contain" />
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

            <h3 className="text-xl font-serif text-slate-800 mb-2 font-bold">Rate Your Journey</h3>
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
