import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Timer, CheckCircle, ArrowRight } from '../utils/icons';
import { api } from '../services/authService';

const DriverOtpVerification = ({ bookingId, clientName, onVerificationSuccess, onCancel }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  
  // Timer setup for client OTP expiry
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes default in seconds
  
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer for the OTP validity
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace handles focusing back
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post(
        `/rides/${bookingId}/resend-otp`,
        {}
      );
      if (response.data.success) {
        alert('A fresh verification OTP has been emailed to the client.');
        setTimeLeft(900); // Reset timer to 15 minutes (900 seconds)
        setOtp(['', '', '', '']); // Clear inputs
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otp.join('');
    
    if (fullOtp.length < 4) {
      setError('Please enter all 4 digits of the OTP.');
      return;
    }

    if (timeLeft === 0) {
      setError('OTP code has expired. Client must request a resend.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/rides/verify-otp',
        { bookingId, otp: fullOtp }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerificationSuccess(response.data.ride);
        }, 1500);
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      const msg = err.response?.data?.message || 'Verification failed. Try again.';
      setError(msg);
      
      // Calculate attempts remaining if API returns attempt details
      if (msg.includes('attempts remaining') || msg.includes('Attempts remaining')) {
        const match = msg.match(/\d+/);
        if (match) {
          setAttemptsRemaining(parseInt(match[0]));
        }
      } else {
        setAttemptsRemaining(prev => Math.max(0, prev - 1));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Decorative luxury gradient outline */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#003893] to-transparent"></div>

      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-[#003893]/10 rounded-full flex items-center justify-center text-[#003893] mx-auto mb-4 border border-[#003893]/20">
          <ShieldCheck size={28} />
        </div>
        <h3 className="text-xl font-serif text-slate-800 font-semibold">Start Luxury Journey</h3>
        <p className="text-slate-500 text-xs mt-1">
          Verify the 4-digit code provided by <span className="text-[#003893] font-semibold">{clientName}</span> to start route navigation.
        </p>
      </div>

      {success ? (
        <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-3 border border-emerald-500/20">
            <CheckCircle size={24} className="animate-pulse" />
          </div>
          <h4 className="text-lg text-slate-800 font-medium">OTP Verified</h4>
          <p className="text-slate-500 text-xs mt-1">Starting ride and initiating billing track...</p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-4">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className="w-14 h-16 text-center text-2xl font-bold bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:border-[#003893] focus:outline-none transition-colors"
                placeholder="-"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center space-x-1.5">
              <Timer size={14} className={timeLeft < 180 ? "text-red-500" : "text-[#003893]"} />
              <span className={timeLeft < 180 ? "text-red-500 font-semibold" : "text-slate-600 font-medium"}>
                Expires in {formatTime(timeLeft)}
              </span>
            </div>
            <div>
              Attempts remaining: <span className="text-slate-800 font-semibold">{attemptsRemaining}</span>
            </div>
          </div>

          <div className="flex justify-center text-xs pt-1">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="text-[#003893] hover:text-[#002d72] hover:underline font-bold transition-colors disabled:opacity-40 cursor-pointer"
            >
              Client didn't get it? Resend OTP Email
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003893] text-white py-3.5 rounded-xl font-bold hover:bg-[#002d72] transition-colors shadow-lg shadow-[#003893]/15 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Verify and Start Ride</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full bg-transparent text-slate-500 hover:text-slate-800 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              Dismiss
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DriverOtpVerification;
