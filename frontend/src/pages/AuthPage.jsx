import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Briefcase, Eye, EyeOff, Car, CreditCard, Upload, FileText } from '../utils/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { login as loginRequest, register as registerRequest } from '../services/authService.js';

const AuthPage = () => {
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
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFileChange = (e, setFile, setFileName) => {
    const file = e.target.files[0];
    if (!file) return;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (!isLogin) {
      if (!fullName.trim() || !phone.trim()) {
        setError('Full name and phone number are required for sign up.');
        return;
      }

      if (!role) {
        setError('Please select a role.');
        return;
      }

      if (role === 'driver') {
        if (!vehicleNumber.trim() || !licenseNumber.trim()) {
          setError('Vehicle number and license number are required for drivers.');
          return;
        }
        if (!rcDocument) {
          setError('Please upload vehicle RC file as document.');
          return;
        }
        if (!licenseDocument) {
          setError('Please upload license as document.');
          return;
        }
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName,
        email,
        phone,
        role,
        password,
        confirmPassword,
        ...(role === 'driver' && { vehicleNumber, licenseNumber, rcDocument, licenseDocument }),
      };

      const response = isLogin
        ? await loginRequest({ email, password })
        : await registerRequest(payload);

      if (response.approvalRequired) {
        setError('Registration successful! Your account is pending admin approval.');
        setIsLogin(true);
      } else {
        login(response.user, response.token);
        navigate('/');
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Unable to authenticate';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a11] flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-1/2 relative bg-black overflow-hidden">
        <img
          src="/dms-bg.png"
          alt="Luxury Chauffeur Interior"
          loading="lazy"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a11] via-[#060a11]/40 to-transparent"></div>

        <div className="absolute bottom-20 left-12 right-12">
          <Link to="/" className="text-3xl font-serif tracking-[0.2em] text-[#d4af37] font-bold uppercase mb-6 inline-block">
            DMS LUXE
          </Link>
          <h2 className="text-4xl font-serif text-white mb-4 leading-tight">
            Elevate Your <br />
            <span className="text-[#d4af37] italic">Journey</span>
          </h2>
          <p className="text-gray-300 max-w-md">
            Join our exclusive clientele and experience the world's most premium chauffeur service. Manage bookings, save preferences, and ride in absolute luxury.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center p-8 sm:p-12 md:p-16 xl:p-24 relative min-h-screen">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link to="/" className="text-xl font-serif tracking-[0.2em] text-[#d4af37] font-bold uppercase">
            DMS LUXE
          </Link>
        </div>

        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-serif text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-gray-400">
                {isLogin
                  ? 'Enter your credentials to access your account.'
                  : 'Join DMS LUXE for premium travel experiences.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <motion.div layout>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
              )}

              <motion.div layout>
                <label className="block text-sm text-gray-400 mb-2 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </motion.div>

              {!isLogin && (
                <motion.div layout>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </motion.div>
              )}

              {!isLogin && (
                <motion.div layout>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Account Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="client">Client / Passenger</option>
                      <option value="driver">Chauffeur / Driver</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {!isLogin && role === 'driver' && (
                <>
                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Vehicle Number</label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        required
                        className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                        placeholder="WB-02-AB-1234"
                      />
                    </div>
                  </motion.div>

                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">License Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                        className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                        placeholder="DL-1234567890"
                      />
                    </div>
                  </motion.div>

                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">RC File (Vehicle Registration Document)</label>
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
                        className="flex items-center space-x-3 w-full bg-[#111620] border border-white/10 hover:border-[#d4af37]/50 rounded-lg py-3 px-4 text-white cursor-pointer transition-colors"
                      >
                        <Upload className="text-[#d4af37] shrink-0" size={20} />
                        <span className="text-gray-400 truncate flex-1 text-sm">
                          {rcFileName || 'Upload RC File (Image or PDF)...'}
                        </span>
                        {rcFileName && <FileText className="text-emerald-400" size={18} />}
                      </label>
                    </div>
                  </motion.div>

                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <label className="block text-sm text-gray-400 mb-2 font-medium">License Document</label>
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
                        className="flex items-center space-x-3 w-full bg-[#111620] border border-white/10 hover:border-[#d4af37]/50 rounded-lg py-3 px-4 text-white cursor-pointer transition-colors"
                      >
                        <Upload className="text-[#d4af37] shrink-0" size={20} />
                        <span className="text-gray-400 truncate flex-1 text-sm">
                          {licenseFileName || 'Upload License File (Image or PDF)...'}
                        </span>
                        {licenseFileName && <FileText className="text-emerald-400" size={18} />}
                      </label>
                    </div>
                  </motion.div>
                </>
              )}

              <motion.div layout>
                <label className="block text-sm text-gray-400 mb-2 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-12 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#d4af37] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>

              {!isLogin && (
                <motion.div layout>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={20} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-[#111620] border border-white/10 rounded-lg py-3 pl-12 pr-12 text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#d4af37] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="rounded-xl bg-[#3d1717] border border-red-600 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ffe392] text-black font-semibold py-3.5 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#e6c87a] transition-colors mt-6 shadow-lg shadow-[#ffe392]/10 disabled:opacity-60"
              >
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-8 text-center text-gray-400 text-sm">
              {isLogin ? "Don't have an account yet?" : 'Already have an account?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-2 text-[#d4af37] font-semibold hover:text-white transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <div className="w-1/3 h-[1px] bg-white/10"></div>
              <span className="text-xs text-gray-500 uppercase tracking-widest">Or continue with</span>
              <div className="w-1/3 h-[1px] bg-white/10"></div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center space-x-2 bg-[#111620] border border-white/10 py-3 rounded-lg hover:border-[#d4af37]/50 transition-colors text-sm text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-[#111620] border border-white/10 py-3 rounded-lg hover:border-[#d4af37]/50 transition-colors text-sm text-white">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.95.83 3.82 2.15-3.14 1.83-2.61 5.92.51 7.15-.71 1.48-1.58 2.76-2.98 3.71M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25" />
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
