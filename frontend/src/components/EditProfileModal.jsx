import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, Car, CreditCard, Upload, FileText, X } from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import { updateProfile } from '../services/authService.js';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [rcDocument, setRcDocument] = useState('');
  const [licenseDocument, setLicenseDocument] = useState('');
  const [rcFileName, setRcFileName] = useState('');
  const [licenseFileName, setLicenseFileName] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize fields with current user data
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setVehicleNumber(user.vehicleNumber || '');
      setLicenseNumber(user.licenseNumber || '');
      setRcDocument(user.rcDocument || '');
      setLicenseDocument(user.licenseDocument || '');
      setRcFileName(user.rcDocument ? 'Uploaded RC Document' : '');
      setLicenseFileName(user.licenseDocument ? 'Uploaded License Document' : '');
      setProfilePicture(user.profilePicture || '');
      
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

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

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result);
    };
    reader.onerror = () => {
      setError('Failed to read profile picture file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Name, email, and phone are required.');
      return;
    }

    if (user.role === 'driver') {
      if (!vehicleNumber.trim() || !licenseNumber.trim()) {
        setError('Vehicle number and license number are required.');
        return;
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName,
        email,
        phone,
        profilePicture,
        ...(user.role === 'driver' && { vehicleNumber, licenseNumber, rcDocument, licenseDocument }),
        ...(newPassword && { currentPassword, newPassword }),
      };

      const response = await updateProfile(payload);
      updateUser(response.user);
      setSuccess('Profile updated successfully!');
      
      // Clear password inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to update profile';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          {/* Modal Backdrop overlay click to close */}
          <div className="absolute inset-0 cursor-default" onClick={onClose}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-[#0b0e14] border border-[#d4af37]/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-white/10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#d4af37] transition-colors p-1.5 hover:bg-white/5 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-serif text-white mb-1.5">Edit Profile</h2>
              <p className="text-gray-400 text-sm">Update your personal and vehicle information details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Picture Upload Section */}
              <div className="flex flex-col items-center mb-6 pt-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-[#d4af37]/40 bg-[#111620] flex items-center justify-center relative">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-gray-500 w-10 h-10" />
                    )}
                    {/* Hover Overlay */}
                    <label
                      htmlFor="profile-pic-upload"
                      className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-1"
                    >
                      <Upload className="text-[#d4af37] w-4 h-4 mb-0.5" />
                      <span className="text-[9px] text-white font-medium uppercase tracking-wider">Change</span>
                    </label>
                  </div>
                  <input
                    type="file"
                    id="profile-pic-upload"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                  {profilePicture && (
                    <button
                      type="button"
                      onClick={() => setProfilePicture('')}
                      className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-colors border border-[#0b0e14]"
                      title="Remove Photo"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">Recommended: Square image, max 2MB</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Driver Fields */}
              {user?.role === 'driver' && (
                <div className="pt-2 border-t border-white/5 space-y-4">
                  <h3 className="text-sm font-serif text-[#d4af37] tracking-wide">Vehicle & License Details</h3>
                  
                  {/* Vehicle Number */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Vehicle Number</label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        required
                        className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                        placeholder="WB-02-AB-1234"
                      />
                    </div>
                  </div>

                  {/* License Number */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">License Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                        className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                        placeholder="DL-1234567890"
                      />
                    </div>
                  </div>

                  {/* RC Document */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">RC Document</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="modal-rc-upload"
                        onChange={(e) => handleFileChange(e, setRcDocument, setRcFileName)}
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                      />
                      <label
                        htmlFor="modal-rc-upload"
                        className="flex items-center space-x-3 w-full bg-[#111620] border border-white/10 hover:border-[#d4af37]/50 rounded-lg py-2.5 px-4 text-white cursor-pointer transition-colors"
                      >
                        <Upload className="text-[#d4af37] shrink-0" size={18} />
                        <span className="text-gray-400 truncate flex-1 text-sm">
                          {rcFileName || 'Upload New RC File...'}
                        </span>
                        {rcFileName && <FileText className="text-emerald-400" size={16} />}
                      </label>
                    </div>
                  </div>

                  {/* License Document */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">License Document</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="modal-license-upload"
                        onChange={(e) => handleFileChange(e, setLicenseDocument, setLicenseFileName)}
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                      />
                      <label
                        htmlFor="modal-license-upload"
                        className="flex items-center space-x-3 w-full bg-[#111620] border border-white/10 hover:border-[#d4af37]/50 rounded-lg py-2.5 px-4 text-white cursor-pointer transition-colors"
                      >
                        <Upload className="text-[#d4af37] shrink-0" size={18} />
                        <span className="text-gray-400 truncate flex-1 text-sm">
                          {licenseFileName || 'Upload New License File...'}
                        </span>
                        {licenseFileName && <FileText className="text-emerald-400" size={16} />}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className="pt-2 border-t border-white/5 space-y-4">
                <h3 className="text-sm font-serif text-[#d4af37] tracking-wide">Change Password (Optional)</h3>
                
                {/* Current Password */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-11 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                      placeholder="Current Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#d4af37] transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-11 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#d4af37] transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-[#111620] border border-white/10 rounded-lg py-2.5 pl-11 pr-11 text-sm text-white focus:border-[#d4af37] focus:outline-none transition-colors"
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#d4af37] transition-colors"
                    >
                      {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl bg-[#3d1717]/80 border border-red-600/50 px-4 py-2.5 text-xs text-red-300">
                  {error}
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="rounded-xl bg-[#143d24]/80 border border-emerald-600/50 px-4 py-2.5 text-xs text-emerald-300">
                  {success}
                </div>
              )}

              {/* Submit / Action Buttons */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 border border-white/10 hover:bg-white/5 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#ffe392] text-black hover:bg-[#e6c87a] disabled:opacity-50 font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-[#ffe392]/5"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
