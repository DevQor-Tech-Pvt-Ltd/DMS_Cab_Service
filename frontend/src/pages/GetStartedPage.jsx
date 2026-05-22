import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Clock, Car, User,
  ArrowRight, ArrowLeft, CreditCard, DollarSign,
  Smartphone, Shield, CheckCircle2, ChevronRight
} from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdRide, setCreatedRide] = useState(null);

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
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
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

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dms_luxe_token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/rides`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const { ride, razorpayOrder } = response.data;

        // If Razorpay order was generated on the server, launch Razorpay Checkout UI
        if (razorpayOrder) {
          if (!window.Razorpay) {
            alert('Razorpay payment gateway is currently loading. Please try again in 3 seconds.');
            setLoading(false);
            return;
          }

          const options = {
            key: razorpayOrder.key,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'DMS Luxe Chauffeur',
            description: `Elite Transfer: ${ride.pickupLocation.substring(0, 15)}... ➔ ${ride.dropoffLocation.substring(0, 15)}...`,
            order_id: razorpayOrder.id,
            handler: async (paymentResponse) => {
              try {
                setLoading(true);
                const verifyResponse = await axios.post(
                  `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/payment/verify`,
                  {
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_signature: paymentResponse.razorpay_signature
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }
                );

                if (verifyResponse.data.success) {
                  setCreatedRide(verifyResponse.data.ride);
                  setBookingSuccess(true);
                }
              } catch (verifyError) {
                console.error('Payment verification failed:', verifyError);
                alert(verifyError.response?.data?.message || 'Payment verification failed. Please try again or contact support.');
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
              color: '#d4af37' // Luxury gold signature branding
            },
            modal: {
              ondismiss: () => {
                setLoading(false);
                alert('Payment was cancelled. You can complete it from your bookings.');
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Standard cash reservation
          setCreatedRide(ride);
          setBookingSuccess(true);
        }
      }
    } catch (error) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.message || 'Booking confirmation failed. Please try again.');
      setLoading(false);
    }
  };

  const getSelectedVehicle = () => {
    return fleetOptions.find(f => f.name === formData.vehicleType) || fleetOptions[0];
  };

  return (
    <div className="bg-[#060a11] min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : { duration: 0.5 }}
            className="flex items-center justify-center space-x-4 mb-3"
          >
            <div className="w-12 h-[1px] bg-[#d4af37]"></div>
            <span className="text-[#d4af37] text-xs font-semibold tracking-[0.25em] uppercase">Reservation</span>
            <div className="w-12 h-[1px] bg-[#d4af37]"></div>
          </motion.div>
          <motion.h1
            initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : { delay: 0.05, duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-2"
          >
            {bookingSuccess ? 'Booking Confirmed' : 'Book Your Journey'}
          </motion.h1>
          <motion.p
            initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : { delay: 0.1, duration: 0.5 }}
            className="text-gray-400 text-sm"
          >
            {bookingSuccess ? 'Your premium chauffeur has been notified' : 'Experience the pinnacle of luxury transportation.'}
          </motion.p>
        </div>

        {/* Success Screen */}
        {bookingSuccess ? (
          <motion.div
            initial={isMobile ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={isMobile ? { duration: 0 } : { duration: 0.4 }}
            className="bg-[#0a0f18] border border-[#d4af37]/20 rounded-2xl p-8 text-center shadow-2xl space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20">
              <CheckCircle2 size={44} className="animate-bounce" />
            </div>

            <h3 className="text-2xl font-serif text-white">Reservation Confirmed!</h3>
            <p className="text-gray-400 max-w-md mx-auto text-sm">
              Your ride is now in our system. A notification has been sent to nearby luxury chauffeurs. Once a driver confirms, your live status will update.
            </p>

            {createdRide && (
              <div className="bg-[#111620] border border-white/5 rounded-xl p-5 max-w-md mx-auto text-left space-y-3 font-sans">
                <div className="flex justify-between text-xs border-b border-white/5 pb-2 text-gray-400">
                  <span>Booking ID: <strong className="text-white font-mono">{createdRide._id}</strong></span>
                  <span className="text-[#d4af37] font-semibold uppercase">{createdRide.paymentMethod}</span>
                </div>
                <div className="text-sm space-y-2">
                  <p className="text-gray-300"><strong className="text-[#d4af37]">Vehicle:</strong> {createdRide.vehicleType}</p>
                  <p className="text-gray-300"><strong className="text-[#d4af37]">Passenger:</strong> {createdRide.passengerDetails.fullName}</p>
                  <p className="text-gray-300"><strong className="text-[#d4af37]">Route:</strong> {createdRide.pickupLocation} ➔ {createdRide.dropoffLocation}</p>
                  <p className="text-gray-300"><strong className="text-[#d4af37]">Fare:</strong> ₹{createdRide.fare.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/client/dashboard"
                className="bg-[#d4af37] text-[#060a11] px-8 py-3.5 rounded-xl font-bold hover:bg-[#ffe392] transition-colors shadow-lg shadow-[#d4af37]/10"
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
                className="border border-white/10 hover:border-white/30 text-white px-8 py-3.5 rounded-xl font-bold transition-all"
              >
                Book Another Ride
              </button>
            </div>
          </motion.div>
        ) : (
          /* Multi-step Widget */
          <motion.div
            initial={isMobile ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={isMobile ? { duration: 0 } : { delay: 0.1, duration: 0.4 }}
            className="bg-[#0a0f18] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Progress Steps */}
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10"></div>
              {[
                { num: 1, label: 'Route' },
                { num: 2, label: 'Vehicle' },
                { num: 3, label: 'Details' },
                { num: 4, label: 'Payment' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center bg-[#0a0f18] px-2 sm:px-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-serif text-sm sm:text-lg mb-1 transition-all ${step >= s.num ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20 font-bold' : 'bg-[#111620] border border-white/10 text-gray-500'}`}>
                    {s.num}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${step >= s.num ? 'text-[#d4af37]' : 'text-gray-500'}`}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Step 1: Route Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pick-up Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                      <input
                        type="text"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleInputChange}
                        className="w-full bg-[#111620] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                        placeholder="Enter pick-up address or airport"
                      />
                    </div>
                    {formErrors.pickupLocation && <p className="text-red-400 text-xs mt-1.5">{formErrors.pickupLocation}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Drop-off Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        name="dropoffLocation"
                        value={formData.dropoffLocation}
                        onChange={handleInputChange}
                        className="w-full bg-[#111620] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                        placeholder="Enter drop-off address"
                      />
                    </div>
                    {formErrors.dropoffLocation && <p className="text-red-400 text-xs mt-1.5">{formErrors.dropoffLocation}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        className="w-full bg-[#111620] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    {formErrors.pickupDate && <p className="text-red-400 text-xs mt-1.5">{formErrors.pickupDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                      <input
                        type="time"
                        name="pickupTime"
                        value={formData.pickupTime}
                        onChange={handleInputChange}
                        className="w-full bg-[#111620] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    {formErrors.pickupTime && <p className="text-red-400 text-xs mt-1.5">{formErrors.pickupTime}</p>}
                  </div>
                </div>

                <div className="pt-6 text-right border-t border-white/5">
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 bg-[#ffe392] text-black px-8 py-3.5 rounded-xl hover:bg-[#e6c87a] transition-all font-semibold shadow-lg shadow-[#ffe392]/5 text-sm"
                  >
                    <span>Continue to Vehicle Selection</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Selection */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-serif text-white mb-1">Select Your Premium Vehicle</h3>
                <p className="text-gray-400 text-xs mb-4">Choose a model suited to your requirements. Pricing is flat & calculated transparently.</p>

                {formErrors.vehicleType && <p className="text-red-400 text-xs">{formErrors.vehicleType}</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {fleetOptions.map((car) => {
                    const isSelected = formData.vehicleType === car.name;
                    return (
                      <div
                        key={car.name}
                        onClick={() => selectVehicle(car.name)}
                        className={`bg-[#111620] border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col group ${isSelected ? 'border-[#d4af37] shadow-xl shadow-[#d4af37]/5 scale-[1.01]' : 'border-white/5 hover:border-white/20'}`}
                      >
                        <div className="relative h-40 overflow-hidden bg-black/40">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                            <span className="text-[#d4af37] text-[9px] font-semibold tracking-wider uppercase">{car.category}</span>
                          </div>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="text-sm font-serif text-white font-semibold mb-1">{car.name}</h4>
                            <p className="text-gray-400 text-[10px] line-clamp-2 leading-relaxed">{car.description}</p>
                          </div>
                          <div className="border-t border-white/5 pt-2.5 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">{car.passengers} Pax / {car.luggage} Bags</span>
                            <span className="text-xs font-bold text-[#d4af37]">₹{car.baseFare.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 flex justify-between border-t border-white/5">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 bg-[#ffe392] text-black px-8 py-3.5 rounded-xl hover:bg-[#e6c87a] transition-all font-semibold text-sm"
                  >
                    <span>Continue to Details</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Passenger Information */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-serif text-white mb-1">Final Details & Passenger Info</h3>
                <p className="text-gray-400 text-xs mb-4">Complete your booking by entering passenger contact information below.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={16} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.passengerDetails.fullName}
                        onChange={handlePassengerChange}
                        className="w-full bg-[#111620] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                        placeholder="Passenger's complete name"
                      />
                    </div>
                    {formErrors.fullName && <p className="text-red-400 text-xs mt-1.5">{formErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={16} />
                      <input
                        type="email"
                        name="email"
                        value={formData.passengerDetails.email}
                        onChange={handlePassengerChange}
                        className="w-full bg-[#111620] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                        placeholder="Email for reservation alerts"
                      />
                    </div>
                    {formErrors.email && <p className="text-red-400 text-xs mt-1.5">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={16} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.passengerDetails.phone}
                        onChange={handlePassengerChange}
                        className="w-full bg-[#111620] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                        placeholder="Chauffeur call-up number"
                      />
                    </div>
                    {formErrors.phone && <p className="text-red-400 text-xs mt-1.5">{formErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Special Instructions (Optional)</label>
                  <textarea
                    name="specialInstructions"
                    rows={3}
                    value={formData.passengerDetails.specialInstructions}
                    onChange={handlePassengerChange}
                    className="w-full bg-[#111620] border border-white/10 rounded-xl p-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors text-sm"
                    placeholder="Specific requests, flight numbers, child seat requirements, or luggage notes..."
                  />
                </div>

                <div className="pt-6 flex justify-between border-t border-white/5">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 bg-[#ffe392] text-black px-8 py-3.5 rounded-xl hover:bg-[#e6c87a] transition-all font-semibold text-sm"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment selection */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-serif text-white mb-1">Choose Payment Method</h3>
                <p className="text-gray-400 text-xs mb-4">Review booking details and select your payment configuration to finalize reservations.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Details */}
                  <div className="md:col-span-2 space-y-4 bg-[#111620]/60 border border-white/5 p-5 rounded-xl">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-[#d4af37] mb-2">Trip Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-mono">Date & Time</p>
                        <p className="text-gray-200 mt-0.5">{formData.pickupDate} at {formData.pickupTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-mono">Selected Fleet Type</p>
                        <p className="text-gray-200 mt-0.5">{formData.vehicleType}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 text-[10px] uppercase font-mono">Route Details</p>
                        <p className="text-gray-200 mt-0.5">{formData.pickupLocation} ➔ {formData.dropoffLocation}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-mono">Passenger Contact</p>
                        <p className="text-gray-200 mt-0.5">{formData.passengerDetails.fullName} ({formData.passengerDetails.phone})</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-mono">Total Estimated Fare</p>
                        <p className="text-white font-bold text-lg mt-0.5">₹{getSelectedVehicle().baseFare.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Choices */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">Payment Options</h4>

                    {/* Cash */}
                    <button
                      onClick={() => selectPayment('cash')}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.paymentMethod === 'cash' ? 'bg-[#d4af37]/10 border-[#d4af37] text-white' : 'bg-[#111620] border-white/5 text-gray-400 hover:border-white/10'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'bg-white/5 text-gray-400'}`}>
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Cash Pickup</p>
                          <p className="text-[10px] text-gray-500">Pay directly to Chauffeur</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'border-[#d4af37]' : 'border-gray-600'}`}>
                        {formData.paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-[#d4af37]"></div>}
                      </div>
                    </button>

                    {/* Credit Card */}
                    <button
                      onClick={() => selectPayment('card')}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.paymentMethod === 'card' ? 'bg-[#d4af37]/10 border-[#d4af37] text-white' : 'bg-[#111620] border-white/5 text-gray-400 hover:border-white/10'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.paymentMethod === 'card' ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-gray-400'}`}>
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Credit / Debit Card</p>
                          <p className="text-[10px] text-gray-500">Mock Premium Checkout</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentMethod === 'card' ? 'border-[#d4af37]' : 'border-gray-600'}`}>
                        {formData.paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-[#d4af37]"></div>}
                      </div>
                    </button>

                    {/* UPI */}
                    <button
                      onClick={() => selectPayment('upi')}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.paymentMethod === 'upi' ? 'bg-[#d4af37]/10 border-[#d4af37] text-white' : 'bg-[#111620] border-white/5 text-gray-400 hover:border-white/10'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.paymentMethod === 'upi' ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-gray-400'}`}>
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">UPI / Netbanking</p>
                          <p className="text-[10px] text-gray-500">Instant Mobile Pay</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentMethod === 'upi' ? 'border-[#d4af37]' : 'border-gray-600'}`}>
                        {formData.paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-[#d4af37]"></div>}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-6 flex justify-between border-t border-white/5 items-center">
                  <button
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={handleConfirmBooking}
                    disabled={loading}
                    className="inline-flex items-center space-x-2 bg-[#d4af37] text-[#060a11] px-10 py-4 rounded-xl hover:bg-[#ffe392] disabled:opacity-50 transition-all font-bold shadow-lg shadow-[#d4af37]/15 text-sm"
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
    </div>
  );
};

export default GetStartedPage;
