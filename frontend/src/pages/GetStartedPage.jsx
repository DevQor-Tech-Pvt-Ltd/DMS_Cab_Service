import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Clock, Car, User,
  ArrowRight, ArrowLeft, CreditCard, DollarSign,
  Smartphone, Shield, CheckCircle2, ChevronRight, Wallet, AlertCircle
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/authService';
import { isMobile } from '../utils/motion';

const fleetOptions = [
  {
    name: 'Mercedes-Benz S-Class',
    category: 'Executive Sedan',
    image: 'Mercedes-Benz S-Class.webp',
    passengers: 3,
    luggage: 2,
    baseFare: 1501,
    features: ['Free WiFi', 'Water & Mints', 'Leather Seats'],
    description: 'The pinnacle of luxury sedans. Perfect for high-profile business transfers and absolute comfort.'
  },
  {
    name: 'Range Rover Autobiography',
    category: 'Luxury SUV',
    image: 'Range Rover Autobiography.webp',
    passengers: 4,
    luggage: 4,
    baseFare: 1,
    features: ['Free WiFi', 'Panoramic Roof', 'Extra Legroom'],
    description: 'Commanding presence with exceptional space. Ideal for rough roads, events and styling arrival.'
  },
  {
    name: 'Mercedes-Benz V-Class',
    category: 'Premium Van',
    image: 'Mercedes-Benz V-Class.webp',
    passengers: 7,
    luggage: 6,
    baseFare: 1,
    features: ['Conference Seating', 'Privacy Glass', 'Climate Control'],
    description: 'Spacious and versatile luxury for group travel, family outings without losing executive elegance.'
  }
];

const GetStartedPage = () => {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdRide, setCreatedRide] = useState(null);
  
  // Payment states and toast notifications (Ola/Uber standard)
  const [paymentState, setPaymentState] = useState('idle'); // 'idle', 'initiating', 'checkout', 'verifying', 'success', 'failed'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    // Automatically clear errors/info after 5 seconds, success after 3
    setTimeout(() => {
      setToast(null);
    }, type === 'success' ? 3000 : 5000);
  };

  // Route Guard: Redirect drivers or admins trying to access the booking screen
  useEffect(() => {
    if (user && user.role !== 'client') {
      const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/driver/dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [user, navigate]);

  // Load Razorpay SDK script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    pickupLocation: location.state?.pickupLocation || '',
    dropoffLocation: location.state?.dropoffLocation || '',
    pickupDate: location.state?.pickupDate || '',
    pickupTime: location.state?.pickupTime || '',
    vehicleType: '',
    passengerDetails: {
      fullName: '',
      email: '',
      phone: '',
      specialInstructions: ''
    },
    paymentMethod: 'cash'
  });

  const [formErrors, setFormErrors] = useState({});

  // Autopopulate user passenger info if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        passengerDetails: {
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          specialInstructions: prev.passengerDetails.specialInstructions || ''
        }
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePassengerChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      passengerDetails: {
        ...prev.passengerDetails,
        [name]: value
      }
    }));
    // Clear error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const selectVehicle = (name) => {
    setFormData(prev => ({ ...prev, vehicleType: name }));
    if (formErrors.vehicleType) {
      setFormErrors(prev => ({ ...prev, vehicleType: null }));
    }
  };

  const selectPayment = (method) => {
    setFormData(prev => ({ ...prev, paymentMethod: method }));
  };

  // Validations
  const validateStep1 = () => {
    const errors = {};
    if (!formData.pickupLocation.trim()) errors.pickupLocation = 'Pick-up address is required';
    if (!formData.dropoffLocation.trim()) errors.dropoffLocation = 'Drop-off address is required';
    if (!formData.pickupDate) errors.pickupDate = 'Date is required';
    if (!formData.pickupTime) errors.pickupTime = 'Time is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.vehicleType) errors.vehicleType = 'Please select a premium vehicle';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.passengerDetails.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.passengerDetails.email.trim()) errors.email = 'Email is required';
    if (!formData.passengerDetails.phone.trim()) errors.phone = 'Phone number is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getWalletBalance = () => {
    const localVal = localStorage.getItem(`dms_luxe_wallet_balance_${user?._id}`);
    if (localVal !== null) {
      return parseFloat(localVal);
    }
    return user?.walletBalance || 0;
  };

  const handleConfirmBooking = async () => {
    const estFare = getSelectedVehicle().baseFare;
    if (formData.paymentMethod === 'wallet') {
      const balance = getWalletBalance();
      if (balance < estFare) {
        showToast(
          `Insufficient wallet balance. Your balance is ₹${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}, but the fare is ₹${estFare.toLocaleString()}. Please choose another payment method or top up your wallet.`,
          'error'
        );
        return;
      }
    }

    setLoading(true);
    setPaymentState('initiating');
    try {
      const response = await api.post(
        '/rides',
        formData
      );

      if (response.data.success) {
        const { ride, razorpayOrder, user: updatedUser } = response.data;

        if (updatedUser) {
          updateUser(updatedUser);
          localStorage.setItem(`dms_luxe_wallet_balance_${updatedUser._id}`, updatedUser.walletBalance.toString());
          
          const localTxns = localStorage.getItem(`dms_luxe_transactions_${updatedUser._id}`);
          const txnsList = localTxns ? JSON.parse(localTxns) : [];
          const newTxn = {
            type: 'Ride Payment',
            desc: `${ride.vehicleType || 'Premium Cab'} • ${ride.pickupLocation.split(',')[0]} to ${ride.dropoffLocation.split(',')[0]}`,
            amt: `- ₹${(ride.fare || 0).toLocaleString()}`,
            date: new Date().toLocaleString(),
            minus: true,
            value: ride.fare || 0
          };
          localStorage.setItem(`dms_luxe_transactions_${updatedUser._id}`, JSON.stringify([newTxn, ...txnsList]));
        }

        // If Razorpay order was generated on the server, launch Razorpay Checkout UI
        if (razorpayOrder) {
          if (!window.Razorpay) {
            showToast('Razorpay payment gateway is currently loading. Please try again in 3 seconds.', 'error');
            setLoading(false);
            setPaymentState('idle');
            return;
          }

          setPaymentState('checkout');

          const options = {
            key: razorpayOrder.key,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'DMS Cab Services Chauffeur',
            description: `Elite Transfer: ${ride.pickupLocation.substring(0, 15)}... ➔ ${ride.dropoffLocation.substring(0, 15)}...`,
            order_id: razorpayOrder.id,
            handler: async (paymentResponse) => {
              try {
                setLoading(true);
                setPaymentState('verifying');
                const verifyResponse = await api.post(
                  '/payment/verify',
                  {
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_signature: paymentResponse.razorpay_signature
                  }
                );

                if (verifyResponse.data.success) {
                  setCreatedRide(verifyResponse.data.ride);
                  setBookingSuccess(true);
                  setPaymentState('success');
                  showToast('Payment verified successfully and booking active', 'success');
                }
              } catch (verifyError) {
                console.error('Payment verification failed:', verifyError);
                showToast(verifyError.response?.data?.message || 'Payment verification failed.', 'error');
                setPaymentState('failed');
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: formData.passengerDetails.fullName,
              email: formData.passengerDetails.email,
              contact: formData.passengerDetails.phone
            },
            theme: {
              color: '#003893' // Brand blue
            },
            modal: {
              ondismiss: () => {
                setLoading(false);
                setPaymentState('idle');
                showToast('Payment was cancelled.', 'info');
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Standard cash or wallet reservation
          setCreatedRide(ride);
          setBookingSuccess(true);
          setPaymentState('success');
        }
      }
    } catch (error) {
      console.error('Booking failed:', error);
      showToast(error.response?.data?.message || 'Booking confirmation failed.', 'error');
      setLoading(false);
      setPaymentState('failed');
    }
  };

  const getSelectedVehicle = () => {
    return fleetOptions.find(f => f.name === formData.vehicleType) || fleetOptions[0];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003893] font-serif text-xs tracking-widest uppercase animate-pulse">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white min-h-screen pt-28 pb-20 text-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 border border-[#003893]/15 text-[#003893] rounded-full flex items-center justify-center mx-auto shadow-md">
            <User size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-slate-900">Authentication Required</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Unauthenticated booking is disabled. You must be signed in as a client to reserve premium DMS chauffeur services.
            </p>
          </div>
          <button
            onClick={() => navigate('/auth?redirect=get-started')}
            className="w-full bg-[#003893] hover:bg-[#002d72] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            <span>Sign In to Book Ride</span>
            <ArrowRight size={14} />
          </button>
          <p className="text-[11px] text-slate-400">
            Don't have an account? <Link to="/auth?redirect=get-started" className="text-[#003893] font-bold hover:underline">Register now</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-28 pb-20 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center space-x-4 mb-3"
          >
            <div className="w-12 h-[1px] bg-[#003893]"></div>
            <span className="text-[#003893] text-xs font-semibold tracking-[0.25em] uppercase">Reservation</span>
            <div className="w-12 h-[1px] bg-[#003893]"></div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-900 mb-2 font-bold"
          >
            {bookingSuccess ? 'Booking Confirmed' : 'Book Your Journey'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-slate-500 text-sm"
          >
            {bookingSuccess ? 'Your premium chauffeur has been notified' : 'Experience the pinnacle of luxury transportation.'}
          </motion.p>
        </div>

        {/* Success Screen */}
        {bookingSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center shadow-2xl space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-200">
              <CheckCircle2 size={44} className="animate-bounce" />
            </div>

            <h3 className="text-2xl font-serif text-slate-900 font-bold">Reservation Confirmed!</h3>
            <p className="text-slate-600 max-w-md mx-auto text-sm">
              Your ride is now in our system. A notification has been sent to nearby luxury chauffeurs. Once a driver confirms, your live status will update.
            </p>

            {createdRide && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-md mx-auto text-left space-y-3 font-sans shadow-sm">
                <div className="flex justify-between text-xs border-b border-slate-100 pb-2 text-slate-500">
                  <span>Booking ID: <strong className="text-slate-900 font-mono">{createdRide._id}</strong></span>
                  <span className="text-[#003893] font-bold uppercase">{createdRide.paymentMethod}</span>
                </div>
                <div className="text-sm space-y-2">
                  <p className="text-slate-700"><strong className="text-[#003893]">Vehicle:</strong> {createdRide.vehicleType}</p>
                  <p className="text-slate-700"><strong className="text-[#003893]">Passenger:</strong> {createdRide.passengerDetails.fullName}</p>
                  <p className="text-slate-700"><strong className="text-[#003893]">Route:</strong> {createdRide.pickupLocation} ➔ {createdRide.dropoffLocation}</p>
                  <p className="text-slate-700"><strong className="text-[#003893]">Fare:</strong> ₹{createdRide.fare.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/client/dashboard"
                className="bg-[#003893] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#002d72] transition-colors shadow-lg"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setBookingSuccess(false);
                  setStep(1);
                  setFormData({
                    pickupLocation: '',
                    dropoffLocation: '',
                    pickupDate: '',
                    pickupTime: '',
                    vehicleType: '',
                    passengerDetails: { fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '', specialInstructions: '' },
                    paymentMethod: 'cash'
                  });
                }}
                className="border border-slate-200 hover:bg-slate-100 text-slate-800 px-8 py-3.5 rounded-xl font-bold transition-all"
              >
                Book Another Ride
              </button>
            </div>
          </motion.div>
        ) : (
          /* Multi-step Widget */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Progress Steps */}
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-200 -z-10"></div>
              {[
                { num: 1, label: 'Route' },
                { num: 2, label: 'Vehicle' },
                { num: 3, label: 'Details' },
                { num: 4, label: 'Payment' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center bg-slate-50 px-2 sm:px-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-serif text-sm sm:text-lg mb-1 transition-all ${step >= s.num ? 'bg-[#003893] text-white shadow-lg shadow-[#003893]/20 font-bold' : 'bg-white border border-slate-200 text-slate-400'}`}>
                    {s.num}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${step >= s.num ? 'text-[#003893]' : 'text-slate-400'}`}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Step 1: Route Selection */}
            {step === 1 && (
              <div className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Pick-up Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-slate-900 transition-colors text-sm"
                        placeholder="Enter pick-up address or airport"
                      />
                    </div>
                    {formErrors.pickupLocation && <p className="text-red-500 text-xs mt-1.5">{formErrors.pickupLocation}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Drop-off Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="dropoffLocation"
                        value={formData.dropoffLocation}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-slate-900 transition-colors text-sm"
                        placeholder="Enter drop-off address"
                      />
                    </div>
                    {formErrors.dropoffLocation && <p className="text-red-500 text-xs mt-1.5">{formErrors.dropoffLocation}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-slate-900 transition-colors text-sm"
                      />
                    </div>
                    {formErrors.pickupDate && <p className="text-red-500 text-xs mt-1.5">{formErrors.pickupDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="time"
                        name="pickupTime"
                        value={formData.pickupTime}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-slate-900 transition-colors text-sm"
                      />
                    </div>
                    {formErrors.pickupTime && <p className="text-red-500 text-xs mt-1.5">{formErrors.pickupTime}</p>}
                  </div>
                </div>

                <div className="pt-6 text-right border-t border-slate-200">
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 bg-[#003893] text-white px-8 py-3.5 rounded-xl hover:bg-[#002d72] transition-all font-semibold shadow-lg text-sm"
                  >
                    <span>Continue to Vehicle Selection</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Selection */}
            {step === 2 && (
              <div className="space-y-6 text-left">
                <h3 className="text-xl font-serif text-slate-900 font-bold">Select Your Premium Vehicle</h3>
                <p className="text-slate-500 text-xs mb-4">Choose a model suited to your requirements. Pricing is flat & calculated transparently.</p>

                {formErrors.vehicleType && <p className="text-red-500 text-xs">{formErrors.vehicleType}</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {fleetOptions.map((car) => {
                    const isSelected = formData.vehicleType === car.name;
                    return (
                      <div
                        key={car.name}
                        onClick={() => selectVehicle(car.name)}
                        className={`bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col group ${isSelected ? 'border-[#003893] shadow-xl scale-[1.01]' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="relative h-40 overflow-hidden bg-black/5">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 bg-[#003893] px-2 py-0.5 rounded text-white border border-[#003893]/10">
                            <span className="text-[9px] font-semibold tracking-wider uppercase">{car.category}</span>
                          </div>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="text-sm font-serif text-slate-900 font-bold mb-1">{car.name}</h4>
                            <p className="text-slate-500 text-[10px] line-clamp-2 leading-relaxed">{car.description}</p>
                          </div>
                          <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">{car.passengers} Pax / {car.luggage} Bags</span>
                            <span className="text-xs font-bold text-[#003893]">₹{car.baseFare.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 flex justify-between border-t border-slate-200">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 bg-[#003893] text-white px-8 py-3.5 rounded-xl hover:bg-[#002d72] transition-all font-semibold text-sm"
                  >
                    <span>Continue to Details</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Passenger Information */}
            {step === 3 && (
              <div className="space-y-6 text-left">
                <h3 className="text-xl font-serif text-slate-900 font-bold">Final Details & Passenger Info</h3>
                <p className="text-slate-500 text-xs mb-4">Complete your booking by entering passenger contact information below.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={16} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.passengerDetails.fullName}
                        onChange={handlePassengerChange}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:border-[#003893] focus:outline-none transition-colors text-sm"
                        placeholder="Passenger's complete name"
                      />
                    </div>
                    {formErrors.fullName && <p className="text-red-500 text-xs mt-1.5">{formErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={16} />
                      <input
                        type="email"
                        name="email"
                        value={formData.passengerDetails.email}
                        onChange={handlePassengerChange}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:border-[#003893] focus:outline-none transition-colors text-sm"
                        placeholder="Email for reservation alerts"
                      />
                    </div>
                    {formErrors.email && <p className="text-red-500 text-xs mt-1.5">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={16} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.passengerDetails.phone}
                        onChange={handlePassengerChange}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:border-[#003893] focus:outline-none transition-colors text-sm"
                        placeholder="Chauffeur call-up number"
                      />
                    </div>
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1.5">{formErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Special Instructions (Optional)</label>
                  <textarea
                    name="specialInstructions"
                    rows={3}
                    value={formData.passengerDetails.specialInstructions}
                    onChange={handlePassengerChange}
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 focus:border-[#003893] focus:outline-none transition-colors text-sm"
                    placeholder="Specific requests, flight numbers, child seat requirements, or luggage notes..."
                  />
                </div>

                <div className="pt-6 flex justify-between border-t border-slate-200">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 bg-[#003893] text-white px-8 py-3.5 rounded-xl hover:bg-[#002d72] transition-all font-semibold text-sm"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment selection */}
            {step === 4 && (
              <div className="space-y-6 text-left">
                <h3 className="text-xl font-serif text-slate-900 font-bold">Choose Payment Method</h3>
                <p className="text-slate-500 text-xs mb-4">Review booking details and select your payment configuration to finalize reservations.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Details */}
                  <div className="md:col-span-2 space-y-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#003893] mb-2">Trip Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-mono">Date & Time</p>
                        <p className="text-slate-800 mt-0.5">{formData.pickupDate} at {formData.pickupTime}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-mono">Selected Fleet Type</p>
                        <p className="text-slate-800 mt-0.5">{formData.vehicleType}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 text-[10px] uppercase font-mono">Route Details</p>
                        <p className="text-slate-800 mt-0.5">{formData.pickupLocation} ➔ {formData.dropoffLocation}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-mono">Passenger Contact</p>
                        <p className="text-slate-800 mt-0.5">{formData.passengerDetails.fullName} ({formData.passengerDetails.phone})</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-mono">Total Estimated Fare</p>
                        <p className="text-[#003893] font-bold text-lg mt-0.5">₹{getSelectedVehicle().baseFare.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Choices */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Payment Options</h4>

                    {/* Cash */}
                    <button
                      onClick={() => selectPayment('cash')}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.paymentMethod === 'cash' ? 'bg-[#003893]/5 border-[#003893] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'bg-[#003893] text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Cash Pickup</p>
                          <p className="text-[10px] text-slate-400">Pay directly to Chauffeur</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'border-[#003893]' : 'border-slate-300'}`}>
                        {formData.paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-[#003893]"></div>}
                      </div>
                    </button>

                    {/* Credit Card */}
                    <button
                      onClick={() => selectPayment('card')}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.paymentMethod === 'card' ? 'bg-[#003893]/5 border-[#003893] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.paymentMethod === 'card' ? 'bg-[#003893] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Credit / Debit Card</p>
                          <p className="text-[10px] text-slate-400">Mock Premium Checkout</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentMethod === 'card' ? 'border-[#003893]' : 'border-slate-300'}`}>
                        {formData.paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-[#003893]"></div>}
                      </div>
                    </button>

                    {/* UPI */}
                    <button
                      onClick={() => selectPayment('upi')}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.paymentMethod === 'upi' ? 'bg-[#003893]/5 border-[#003893] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.paymentMethod === 'upi' ? 'bg-[#003893] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">UPI / Netbanking</p>
                          <p className="text-[10px] text-slate-400">Instant Mobile Pay</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentMethod === 'upi' ? 'border-[#003893]' : 'border-slate-300'}`}>
                        {formData.paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-[#003893]"></div>}
                      </div>
                    </button>

                    {/* Wallet */}
                    <button
                      onClick={() => selectPayment('wallet')}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.paymentMethod === 'wallet' ? 'bg-[#003893]/5 border-[#003893] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.paymentMethod === 'wallet' ? 'bg-[#003893] text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                          <Wallet size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">DMS Wallet</p>
                          <p className="text-[10px] text-slate-400">Balance: ₹{getWalletBalance().toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentMethod === 'wallet' ? 'border-[#003893]' : 'border-slate-300'}`}>
                        {formData.paymentMethod === 'wallet' && <div className="w-2 h-2 rounded-full bg-[#003893]"></div>}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-6 flex justify-between border-t border-slate-200 items-center">
                  <button
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={handleConfirmBooking}
                    disabled={loading}
                    className="inline-flex items-center space-x-2 bg-[#f2b705] text-[#003893] px-10 py-4 rounded-xl hover:bg-[#e5ad04] disabled:opacity-50 transition-all font-extrabold shadow-lg text-sm"
                  >
                    {loading ? (
                      <span>Reserving Journeys...</span>
                    ) : (
                      <>
                        <Shield size={16} />
                        <span>Confirm Luxury Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </div>

      {/* Full-screen Payment/Booking Loader Overlay */}
      <AnimatePresence>
        {loading && paymentState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-slate-100"
            >
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-[#003893]/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-[#003893] rounded-full animate-spin"></div>
                <Shield className="text-[#003893]" size={30} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {paymentState === 'initiating' && 'Securing Chauffeur Ride...'}
                  {paymentState === 'checkout' && 'Awaiting Payment Completion...'}
                  {paymentState === 'verifying' && 'Verifying Secured Transaction...'}
                  {paymentState === 'success' && 'Transaction Approved!'}
                  {paymentState === 'failed' && 'Transaction Failed'}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                  {paymentState === 'initiating' && 'Creating booking order on secured servers. Please hold.'}
                  {paymentState === 'checkout' && 'Please complete the payment in the opened Razorpay portal.'}
                  {paymentState === 'verifying' && 'Validating signature ledger and updating booking status. Do not refresh.'}
                  {paymentState === 'success' && 'Your premium transfer has been confirmed.'}
                  {paymentState === 'failed' && 'An error occurred during verification. Please contact support.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-sans min-w-[320px] max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />}
            {toast.type === 'success' && <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />}
            {toast.type === 'info' && <AlertCircle className="text-blue-500 flex-shrink-0" size={18} />}
            <div className="flex-grow">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-lg">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GetStartedPage;
