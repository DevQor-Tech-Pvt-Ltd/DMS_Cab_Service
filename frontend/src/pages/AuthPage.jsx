import React, { useState, useEffect } from 'react';
import ImageWithFallback from '../components/ImageWithFallback';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Briefcase, Eye, EyeOff, Car, CreditCard, Upload, FileText, Shield, Clock, Star, MapPin, Calendar, Map, Award } from '../utils/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { login as loginRequest, register as registerRequest, api } from '../services/authService.js';
import { useIsMobile } from '../utils/motion';

const AuthPage = () => {
  const isMobile = useIsMobile();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [rcDocument, setRcDocument] = useState('');
  const [licenseDocument, setLicenseDocument] = useState('');
  const [rcFileName, setRcFileName] = useState('');
  const [licenseFileName, setLicenseFileName] = useState('');
  const [aadhaarDocument, setAadhaarDocument] = useState('');
  const [aadhaarFileName, setAadhaarFileName] = useState('');
  const [panDocument, setPanDocument] = useState('');
  const [panFileName, setPanFileName] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [vehicleModelYear, setVehicleModelYear] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [driverNameIfVendor, setDriverNameIfVendor] = useState('');
  const [driverContactNumber, setDriverContactNumber] = useState('');
  const [rcCopyAvailable, setRcCopyAvailable] = useState('Yes');
  const [insuranceValidTill, setInsuranceValidTill] = useState('');
  const [preferredServiceArea, setPreferredServiceArea] = useState('');
  const [previousExperience, setPreviousExperience] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColdStartWarning, setShowColdStartWarning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const redirect = searchParams.get('redirect');

  const [authMethod, setAuthMethod] = useState('phone'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [signupOtpSent, setSignupOtpSent] = useState(false);

  const handleResendSignupOtp = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/phone-login/send', { phone, email });
      if (response.data?.success) {
        setCountdown(30);
        setOtpCode('');
      } else {
        throw new Error(response.data?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to resend OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleFileChange = (e, setFile, setFileName) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedDocTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedDocTypes.includes(file.type)) {
      setError('Unsupported file format. Please upload JPEG, PNG, or PDF files.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFile(reader.result);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleResendOtp = async () => {
    setError('');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError('Please enter a valid 10-digit Indian phone number starting with 6-9.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/phone-login/send', { phone });
      if (response.data?.success) {
        setCountdown(30);
        setOtpCode('');
      } else {
        throw new Error(response.data?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to resend OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowColdStartWarning(false);

    // Case A: Phone OTP Login & Signup
    if (authMethod === 'phone') {
      if (!phone.trim()) {
        setError('Phone number is required.');
        return;
      }
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.trim())) {
        setError('Please enter a valid 10-digit Indian phone number starting with 6-9.');
        return;
      }

      if (!isLogin) {
        if (!fullName.trim()) {
          setError('Full name is required.');
          return;
        }
        if (!role) {
          setError('Please select a role.');
          return;
        }

        if (role === 'driver') {
          if (!currentCity.trim()) { setError('Current City is required.'); return; }
          if (!vehicleNumber.trim()) { setError('Car Number is required.'); return; }
          if (!vehicleModelYear.trim()) { setError('Vehicle Model & Year is required.'); return; }
          if (!licenseNumber.trim()) { setError('Driving License Number is required.'); return; }
          if (!rcDocument) { setError('Please upload vehicle RC document.'); return; }
          if (!aadhaarDocument) { setError('Please upload Aadhaar Card document.'); return; }
          if (!panDocument) { setError('Please upload PAN Card document.'); return; }
          if (!insuranceValidTill.trim()) { setError('Insurance Validity Date is required.'); return; }
          if (!preferredServiceArea.trim()) { setError('Preferred Service Area is required.'); return; }
          if (!licenseDocument) { setError('Please upload license document.'); return; }
          if (driverContactNumber && !phoneRegex.test(driverContactNumber.trim())) {
            setError('Please enter a valid 10-digit driver contact number starting with 6-9.');
            return;
          }
        }
      }

      setIsSubmitting(true);
      const warningTimeout = setTimeout(() => {
        setShowColdStartWarning(true);
      }, 4000);

      try {
        if (!otpSent) {
          // Request OTP
          const response = await api.post('/auth/phone-login/send', { phone });
          if (response.data?.success) {
            setOtpSent(true);
            setCountdown(30);
          } else {
            throw new Error(response.data?.message || 'Failed to send OTP.');
          }
        } else {
          // Verify OTP
          if (!otpCode.trim()) {
            setError('Please enter the 6-digit OTP verification code.');
            setIsSubmitting(false);
            clearTimeout(warningTimeout);
            return;
          }

          const payload = {
            phone,
            otp: otpCode,
            role,
            ...(!isLogin && {
              fullName,
              ...(role === 'driver' && {
                vehicleNumber,
                licenseNumber,
                rcDocument,
                licenseDocument,
                aadhaarDocument,
                panDocument,
                currentCity,
                vehicleModelYear,
                aadhaarNumber,
                driverNameIfVendor,
                driverContactNumber,
                rcCopyAvailable,
                insuranceValidTill,
                preferredServiceArea,
                previousExperience
              })
            })
          };

          const response = await api.post('/auth/phone-login/verify', payload);
          const data = response.data;

          if (data?.success && data?.user) {
            const userData = {
              ...data.user,
              token: data.token,
              refreshToken: data.refreshToken
            };
            login(userData);
            if (redirect && ['activity', 'wallet'].includes(redirect)) {
              navigate(`/client/dashboard?tab=${redirect}`);
            } else if (redirect === 'get-started') {
              navigate('/get-started');
            } else {
              if (data.user.role === 'admin') {
                navigate('/admin/dashboard');
              } else if (data.user.role === 'driver') {
                navigate('/driver/dashboard');
              } else {
                navigate('/');
              }
            }
          } else {
            throw new Error(data?.message || 'Verification failed.');
          }
        }
      } catch (err) {
        const message = err?.response?.data?.message || err.message || 'Unable to authenticate';
        setError(message);
      } finally {
        clearTimeout(warningTimeout);
        setIsSubmitting(false);
        setShowColdStartWarning(false);
      }
      return;
    }

    // Case B: Standard Email Login & Signup
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (!isLogin) {
      if (!fullName.trim() || !phone.trim()) {
        setError('Full name and phone number are required for sign up.');
        return;
      }

      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.trim())) {
        setError('Please enter a valid 10-digit Indian phone number starting with 6-9.');
        return;
      }

      if (!role) {
        setError('Please select a role.');
        return;
      }

      if (role === 'driver') {
        if (!currentCity.trim()) { setError('Current City is required.'); return; }
        if (!vehicleNumber.trim()) { setError('Car Number is required.'); return; }
        if (!vehicleModelYear.trim()) { setError('Vehicle Model & Year is required.'); return; }
        if (!licenseNumber.trim()) { setError('Driving License Number is required.'); return; }
        if (!rcDocument) { setError('Please upload vehicle RC document.'); return; }
        if (!aadhaarDocument) { setError('Please upload Aadhaar Card document.'); return; }
        if (!panDocument) { setError('Please upload PAN Card document.'); return; }
        if (!insuranceValidTill.trim()) { setError('Insurance Validity Date is required.'); return; }
        if (!preferredServiceArea.trim()) { setError('Preferred Service Area is required.'); return; }
        if (!licenseDocument) { setError('Please upload license document.'); return; }
        if (driverContactNumber && !phoneRegex.test(driverContactNumber.trim())) {
          setError('Please enter a valid 10-digit driver contact number starting with 6-9.');
          return;
        }
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(password);
      if (!isStrongPassword) {
        setError('Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
        return;
      }
    }

    // Process submission
    setIsSubmitting(true);
    const warningTimeout = setTimeout(() => {
      setShowColdStartWarning(true);
    }, 4000);

    try {
      if (isLogin) {
        const response = await loginRequest({ email, password });
        const userData = {
          ...response.user,
          token: response.token,
          refreshToken: response.refreshToken
        };
        login(userData);
        if (redirect && ['activity', 'wallet'].includes(redirect)) {
          navigate(`/client/dashboard?tab=${redirect}`);
        } else if (redirect === 'get-started') {
          navigate('/get-started');
        } else {
          if (response.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (response.user.role === 'driver') {
            navigate('/driver/dashboard');
          } else {
            navigate('/');
          }
        }
      } else {
        // Standard Sign Up - register directly without OTP verification
        const payload = {
          fullName,
          email,
          phone,
          role,
          password,
          confirmPassword,
          ...(role === 'driver' && {
            vehicleNumber,
            licenseNumber,
            rcDocument,
            licenseDocument,
            aadhaarDocument,
            panDocument,
            currentCity,
            vehicleModelYear,
            aadhaarNumber,
            driverNameIfVendor,
            driverContactNumber,
            rcCopyAvailable,
            insuranceValidTill,
            preferredServiceArea,
            previousExperience
          }),
        };

        const response = await registerRequest(payload);
        if (response.approvalRequired) {
          setError('Registration successful! Your account is pending admin approval.');
          setIsLogin(true);
        } else {
          const userData = {
            ...response.user,
            token: response.token,
            refreshToken: response.refreshToken
          };
          login(userData);
          if (redirect && ['activity', 'wallet'].includes(redirect)) {
            navigate(`/client/dashboard?tab=${redirect}`);
          } else if (redirect === 'get-started') {
            navigate('/get-started');
          } else {
            if (response.user.role === 'admin') {
              navigate('/admin/dashboard');
            } else if (response.user.role === 'driver') {
              navigate('/driver/dashboard');
            } else {
              navigate('/');
            }
          }
        }
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Unable to authenticate';
      setError(message);
    } finally {
      clearTimeout(warningTimeout);
      setIsSubmitting(false);
      setShowColdStartWarning(false);
    }
  };

  const redirectMessages = {
    activity: {
      title: 'View Your Ride Activity',
      desc: 'Sign in to access your booking history, track active rides, and manage your trips.',
      icon: Clock
    },
    wallet: {
      title: 'Access Your Wallet',
      desc: 'Sign in to check your wallet balance, view transactions, and manage payments.',
      icon: CreditCard
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-28 pb-16 px-4 sm:px-6 flex items-start justify-center">
      <div className="w-full max-w-5xl mx-auto">
        <motion.div
          initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={isMobile ? { duration: 0 } : { duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-[600px] lg:h-[680px]"
        >
          {/* Left Brand Panel */}
          <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#003893] via-[#002d72] to-[#001a45] overflow-hidden flex-col justify-center space-y-10 p-10">
            {/* Geometric Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#f2b705]/10 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
            <div className="absolute top-1/3 right-8 w-20 h-20 rounded-full border border-white/10" />
            <div className="absolute bottom-1/4 right-1/4 w-3 h-3 rounded-full bg-[#f2b705]/40" />
            <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-white/20" />
            
            {/* Diagonal Lines */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute top-20 -left-10 w-[200%] h-[1px] bg-white/5 rotate-[25deg]" />
              <div className="absolute top-40 -left-10 w-[200%] h-[1px] bg-white/5 rotate-[25deg]" />
              <div className="absolute top-60 -left-10 w-[200%] h-[1px] bg-white/5 rotate-[25deg]" />
            </div>

            {/* Top: Logo */}
            <div className="relative z-10 flex justify-center">
              <Link to="/" className="inline-block">
                <ImageWithFallback src="/logoo.png" alt="DMS Logo" className="h-[100px] w-auto object-contain rounded-xl" />
              </Link>
            </div>

            {/* Center: Tagline */}
            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl xl:text-4xl font-serif text-white leading-tight">
                Elevate Your <br />
                <span className="text-[#f2b705] italic">Journey</span>
              </h2>
              <p className="text-blue-200/80 text-sm leading-relaxed max-w-xs">
                Join our exclusive clientele and experience the region's most premium chauffeur service.
              </p>
            </div>

            {/* Bottom: Feature Highlights */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center space-x-3 text-blue-100/80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Shield size={14} className="text-[#f2b705]" />
                </div>
                <span className="text-xs font-medium tracking-wide">Verified & Safe Rides</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100/80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Clock size={14} className="text-[#f2b705]" />
                </div>
                <span className="text-xs font-medium tracking-wide">24/7 Premium Support</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100/80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Star size={14} className="text-[#f2b705]" />
                </div>
                <span className="text-xs font-medium tracking-wide">4.9★ Rated Fleet</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="w-full lg:w-[55%] flex items-start justify-center p-6 sm:p-10 lg:p-12 xl:p-16 lg:h-full lg:overflow-y-auto">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-6 text-center">
                <Link to="/">
                  <ImageWithFallback src="/logo.png" alt="DMS Logo" className="h-10 w-auto object-contain mx-auto" />
                </Link>
              </div>

              {/* Redirect Context Banner */}
              {redirect && redirectMessages[redirect] && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-[#003893]/5 border border-[#003893]/15 rounded-xl p-4 flex items-start space-x-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#003893]/10 flex items-center justify-center shrink-0 mt-0.5">
                    {React.createElement(redirectMessages[redirect].icon, { size: 18, className: 'text-[#003893]' })}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#003893]">{redirectMessages[redirect].title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{redirectMessages[redirect].desc}</p>
                  </div>
                </motion.div>
              )}

              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 mb-2">
                  {isLogin ? 'Welcome Back' : 'Create an Account'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {isLogin
                    ? 'Enter your credentials to access your account.'
                    : 'Join DMS for premium travel experiences.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Method switcher for login & signup */}
                <div className="flex border border-slate-100 mb-6 bg-slate-50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('phone');
                      setError('');
                      setOtpSent(false);
                      setSignupOtpSent(false);
                      setOtpCode('');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      authMethod === 'phone'
                        ? 'bg-[#003893] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Phone OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('email');
                      setError('');
                      setOtpSent(false);
                      setSignupOtpSent(false);
                      setOtpCode('');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      authMethod === 'email'
                        ? 'bg-[#003893] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Email / Password
                  </button>
                </div>

                {/* 1. Full Name - Only on Sign Up */}
                {!isLogin && (
                  <motion.div layout={!isMobile}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>
                )}

                {/* 2. Email Address - On Sign Up OR Email Login (only for email auth method) */}
                {authMethod === 'email' && (
                  <motion.div layout={!isMobile}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </motion.div>
                )}

                {/* 3. Contact Number - On Sign Up OR Phone OTP Login */}
                {(!isLogin || (isLogin && authMethod === 'phone')) && (
                  <motion.div layout={!isMobile}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        required
                        disabled={isLogin && otpSent}
                        className={`w-full border rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all ${
                          isLogin && otpSent ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-200'
                        }`}
                        placeholder="Enter 10-digit mobile number"
                      />
                      {isLogin && otpSent && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode('');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#003893] hover:underline"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 4. OTP Verification Code Input - Only on Phone OTP Login/Signup when code is sent */}
                {authMethod === 'phone' && otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider">6-Digit Verification Code</label>
                      {countdown > 0 ? (
                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                          <Clock size={12} className="inline animate-spin mr-1 text-[#003893]" />
                          Resend in {countdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-xs font-semibold text-[#003893] hover:underline focus:outline-none"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-center text-xl font-bold tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl py-3 focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all placeholder:text-slate-300"
                        placeholder="000000"
                        required
                      />
                    </div>
                  </motion.div>
                )}


                {/* 5. Account Role - On Sign Up OR Phone OTP Login (to allow registration role routing) */}
                {(!isLogin || (isLogin && authMethod === 'phone')) && (
                  <motion.div layout={!isMobile}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Account Role</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        disabled={isLogin && otpSent}
                        className={`w-full border rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all appearance-none ${
                          isLogin && otpSent ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <option value="client">Client / Passenger</option>
                        <option value="driver">Chauffeur / Driver</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* 6. Chauffeur-specific Details (Only on Signup as Driver) */}
                {!isLogin && role === 'driver' && (
                  <>
                    {/* Current City */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Current City</label>
                      <div className="relative">
                        <Map className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={currentCity}
                          onChange={(e) => setCurrentCity(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="Enter your current city"
                        />
                      </div>
                    </motion.div>

                    {/* Car Number */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Car Number</label>
                      <div className="relative">
                        <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="WB-02-AB-1234"
                        />
                      </div>
                    </motion.div>

                    {/* Vehicle Model & Year */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Vehicle Model & Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={vehicleModelYear}
                          onChange={(e) => setVehicleModelYear(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="e.g. Toyota Innova Crysta 2022"
                        />
                      </div>
                    </motion.div>

                    {/* Driving License Number */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Driving License Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="DL-1234567890"
                        />
                      </div>
                    </motion.div>

                    {/* Aadhaar Number */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Aadhaar Number</label>
                      <div className="relative">
                        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="Enter 12-digit Aadhaar Number"
                        />
                      </div>
                    </motion.div>

                    {/* Driver Name (if Vendor) */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Driver Name (if Vendor)</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={driverNameIfVendor}
                          onChange={(e) => setDriverNameIfVendor(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="Enter driver's name if you are a vendor"
                        />
                      </div>
                    </motion.div>

                    {/* Driver Contact Number */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Driver Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="tel"
                          value={driverContactNumber}
                          onChange={(e) => setDriverContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          maxLength={10}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="Enter driver's 10-digit contact number"
                        />
                      </div>
                    </motion.div>

                    {/* RC File Upload */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">RC File (Vehicle Registration)</label>
                      <div className="relative">
                        <input
                          type="file"
                          id="rc-upload"
                          onChange={(e) => handleFileChange(e, setRcDocument, setRcFileName)}
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                        />
                        <label
                          htmlFor="rc-upload"
                          className="flex items-center space-x-3 w-full bg-slate-50 border border-slate-200 hover:border-[#003893]/50 rounded-xl py-3 px-4 text-slate-900 cursor-pointer transition-colors"
                        >
                          <Upload className="text-[#003893] shrink-0" size={18} />
                          <span className="text-slate-500 truncate flex-1 text-sm">
                            {rcFileName || 'Upload RC File (Image or PDF)...'}
                          </span>
                          {rcFileName && <FileText className="text-emerald-500" size={16} />}
                        </label>
                      </div>
                    </motion.div>

                    {/* Insurance Valid Till */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Insurance Valid Till</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="date"
                          value={insuranceValidTill}
                          onChange={(e) => setInsuranceValidTill(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* Preferred Service Area */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Preferred Service Area</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={preferredServiceArea}
                          onChange={(e) => setPreferredServiceArea(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="e.g. Airport, New Town, Salt Lake"
                        />
                      </div>
                    </motion.div>

                    {/* Previous Experience */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Previous Experience (if any)</label>
                      <div className="relative">
                        <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type="text"
                          value={previousExperience}
                          onChange={(e) => setPreviousExperience(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="e.g. 5 Years as Chauffeur"
                        />
                      </div>
                    </motion.div>

                    {/* License Document */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">License Document</label>
                      <div className="relative">
                        <input
                          type="file"
                          id="license-upload"
                          onChange={(e) => handleFileChange(e, setLicenseDocument, setLicenseFileName)}
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                        />
                        <label
                          htmlFor="license-upload"
                          className="flex items-center space-x-3 w-full bg-slate-50 border border-slate-200 hover:border-[#003893]/50 rounded-xl py-3 px-4 text-slate-900 cursor-pointer transition-colors"
                        >
                          <Upload className="text-[#003893] shrink-0" size={18} />
                          <span className="text-slate-500 truncate flex-1 text-sm">
                            {licenseFileName || 'Upload License File (Image or PDF)...'}
                          </span>
                          {licenseFileName && <FileText className="text-emerald-400" size={16} />}
                        </label>
                      </div>
                    </motion.div>

                    {/* Aadhaar Card Document */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Aadhaar Card Document</label>
                      <div className="relative">
                        <input
                          type="file"
                          id="aadhaar-upload"
                          onChange={(e) => handleFileChange(e, setAadhaarDocument, setAadhaarFileName)}
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                        />
                        <label
                          htmlFor="aadhaar-upload"
                          className="flex items-center space-x-3 w-full bg-slate-50 border border-slate-200 hover:border-[#003893]/50 rounded-xl py-3 px-4 text-slate-900 cursor-pointer transition-colors"
                        >
                          <Upload className="text-[#003893] shrink-0" size={18} />
                          <span className="text-slate-500 truncate flex-1 text-sm">
                            {aadhaarFileName || 'Upload Aadhaar Card (Image or PDF)...'}
                          </span>
                          {aadhaarFileName && <FileText className="text-emerald-500" size={16} />}
                        </label>
                      </div>
                    </motion.div>

                    {/* PAN Card Document */}
                    <motion.div
                      layout={!isMobile}
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
                    >
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">PAN Card Document</label>
                      <div className="relative">
                        <input
                          type="file"
                          id="pan-upload"
                          onChange={(e) => handleFileChange(e, setPanDocument, setPanFileName)}
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                        />
                        <label
                          htmlFor="pan-upload"
                          className="flex items-center space-x-3 w-full bg-slate-50 border border-slate-200 hover:border-[#003893]/50 rounded-xl py-3 px-4 text-slate-900 cursor-pointer transition-colors"
                        >
                          <Upload className="text-[#003893] shrink-0" size={18} />
                          <span className="text-slate-500 truncate flex-1 text-sm">
                            {panFileName || 'Upload PAN Card (Image or PDF)...'}
                          </span>
                          {panFileName && <FileText className="text-emerald-500" size={16} />}
                        </label>
                      </div>
                    </motion.div>
                  </>
                )}

                {/* 7. Password / Confirm Password (Only on Signup OR Email Login, but only if authMethod is email) */}
                {authMethod === 'email' && (
                  <>
                    <motion.div layout={!isMobile}>
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003893] transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </motion.div>

                    {/* Password criteria status display during signup */}
                    {!isLogin && (
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                        <p className="font-semibold text-slate-700 mb-1">Password Requirements:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${password.length >= 8 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`transition-colors ${password.length >= 8 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                              Min 8 characters
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${/[A-Z]/.test(password) ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`transition-colors ${/[A-Z]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                              One uppercase (A-Z)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${/[a-z]/.test(password) ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`transition-colors ${/[a-z]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                              One lowercase (a-z)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${/\d/.test(password) ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`transition-colors ${/\d/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                              One number (0-9)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 sm:col-span-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${/[^a-zA-Z0-9]/.test(password) ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`transition-colors ${/[^a-zA-Z0-9]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                              One special char (e.g., !@#$%^&*)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isLogin && (
                      <motion.div layout={!isMobile}>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-slate-900 text-sm focus:border-[#003893] focus:outline-none focus:ring-1 focus:ring-[#003893]/20 transition-all"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003893] transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {showColdStartWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-[#f2b705]/10 border border-[#f2b705]/30 px-4 py-3 text-xs text-slate-700 leading-relaxed text-center"
                  >
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f2b705] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f2b705]"></span>
                      </span>
                      <strong className="text-slate-900 font-serif uppercase tracking-wider text-[10px]">Server Wake-up in progress</strong>
                    </div>
                    Our free-tier server is spinning up. This may take up to a minute on the first load. Thank you for your patience!
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#f2b705] text-[#003893] font-extrabold py-3.5 rounded-xl flex items-center justify-center space-x-2 hover:bg-[#e5ad04] transition-all mt-4 shadow-lg shadow-[#f2b705]/15 disabled:opacity-60 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-[#003893]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>
                        {isLogin
                          ? authMethod === 'phone'
                            ? otpSent
                              ? 'Verifying...'
                              : 'Sending Code...'
                            : 'Signing In...'
                          : 'Creating Account...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isLogin
                          ? authMethod === 'phone'
                            ? otpSent
                              ? 'Verify & Sign In'
                              : 'Send Verification Code'
                            : 'Sign In'
                          : authMethod === 'phone'
                            ? otpSent
                              ? 'Verify & Create Account'
                              : 'Send Verification Code'
                            : 'Create Account'}
                      </span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-slate-500 text-sm">
                {isLogin ? "Don't have an account yet?" : 'Already have an account?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setOtpSent(false);
                    setSignupOtpSent(false);
                    setOtpCode('');
                  }}
                  className="ml-2 text-[#003893] font-semibold hover:text-[#002d72] transition-colors"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </div>

              </div>
            </div>
          </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
