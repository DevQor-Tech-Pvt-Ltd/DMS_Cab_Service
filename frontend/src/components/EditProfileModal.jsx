import React, { useState, useEffect } from 'react';
import ImageWithFallback from './ImageWithFallback';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, Car, CreditCard, Upload, FileText, X, MapPin, Calendar, Map, Award } from '../utils/icons';
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
  const [currentCity, setCurrentCity] = useState('');
  const [vehicleModelYear, setVehicleModelYear] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [driverNameIfVendor, setDriverNameIfVendor] = useState('');
  const [driverContactNumber, setDriverContactNumber] = useState('');
  const [rcCopyAvailable, setRcCopyAvailable] = useState('No');
  const [insuranceValidTill, setInsuranceValidTill] = useState('');
  const [preferredServiceArea, setPreferredServiceArea] = useState('');
  const [previousExperience, setPreviousExperience] = useState('');
  
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
      setCurrentCity(user.currentCity || '');
      setVehicleModelYear(user.vehicleModelYear || '');
      setAadhaarNumber(user.aadhaarNumber || '');
      setDriverNameIfVendor(user.driverNameIfVendor || '');
      setDriverContactNumber(user.driverContactNumber || '');
      setRcCopyAvailable(user.rcCopyAvailable || 'No');
      setInsuranceValidTill(user.insuranceValidTill || '');
      setPreferredServiceArea(user.preferredServiceArea || '');
      setPreviousExperience(user.previousExperience || '');
      
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

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedPicTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedPicTypes.includes(file.type)) {
      setError('Unsupported file format. Profile picture must be a JPEG or PNG image.');
      return;
    }

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
      if (!currentCity.trim()) {
        setError('Current City is required.');
        return;
      }
      if (!vehicleNumber.trim()) {
        setError('Car Number is required.');
        return;
      }
      if (!vehicleModelYear.trim()) {
        setError('Vehicle Model & Year is required.');
        return;
      }
      if (!licenseNumber.trim()) {
        setError('Driving License Number is required.');
        return;
      }
      if (rcCopyAvailable === 'Yes' && !rcDocument) {
        setError('Please upload vehicle RC document.');
        return;
      }
      if (!insuranceValidTill.trim()) {
        setError('Insurance Validity Date is required.');
        return;
      }
      if (!preferredServiceArea.trim()) {
        setError('Preferred Service Area is required.');
        return;
      }
      if (!licenseDocument) {
        setError('Please upload license document.');
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
      const isAlphanumeric = /^(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword);
      if (!isAlphanumeric) {
        setError('New password must be alphanumeric (contain both letters and numbers).');
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
        ...(user.role === 'driver' && { 
          vehicleNumber, 
          licenseNumber, 
          rcDocument, 
          licenseDocument,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
          {/* Modal Backdrop overlay click to close */}
          <div className="absolute inset-0 cursor-default" onClick={onClose}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#003893] transition-colors p-1.5 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-serif text-slate-800 mb-1.5 font-bold">Edit Profile</h2>
              <p className="text-slate-500 text-sm">Update your personal and vehicle information details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Picture Upload Section */}
              <div className="flex flex-col items-center mb-6 pt-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative">
                    {profilePicture ? (
                      <ImageWithFallback
                        src={profilePicture}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-slate-400 w-10 h-10" />
                    )}
                    {/* Hover Overlay */}
                    <label
                      htmlFor="profile-pic-upload"
                      className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-1"
                    >
                      <Upload className="text-[#003893] w-4 h-4 mb-0.5" />
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
                      className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-colors border border-white"
                      title="Remove Photo"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Recommended: Square image, max 2MB</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Driver Fields */}
              {user?.role === 'driver' && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-serif text-[#003893] tracking-wide font-bold">Chauffeur & Vehicle Details</h3>
                  
                  {/* Current City */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Current City</label>
                    <div className="relative">
                      <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={currentCity}
                        onChange={(e) => setCurrentCity(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="Current City"
                      />
                    </div>
                  </div>

                  {/* Vehicle Number (Car Number) */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Car Number</label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="WB-02-AB-1234"
                      />
                    </div>
                  </div>

                  {/* Vehicle Model & Year */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Vehicle Model & Year</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={vehicleModelYear}
                        onChange={(e) => setVehicleModelYear(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="e.g. Toyota Innova Crysta 2022"
                      />
                    </div>
                  </div>

                  {/* Driving License Number */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Driving License Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="DL-1234567890"
                      />
                    </div>
                  </div>

                  {/* Aadhaar Number */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Aadhaar Number</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="Enter 12-digit Aadhaar Number"
                      />
                    </div>
                  </div>

                  {/* Driver Name (if Vendor) */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Driver Name (if Vendor)</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={driverNameIfVendor}
                        onChange={(e) => setDriverNameIfVendor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="Driver Name (if Vendor)"
                      />
                    </div>
                  </div>

                  {/* Driver Contact Number */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Driver Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="tel"
                        value={driverContactNumber}
                        onChange={(e) => setDriverContactNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="Driver Contact Number"
                      />
                    </div>
                  </div>

                  {/* RC Copy Available */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">RC Copy Available</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <select
                        value={rcCopyAvailable}
                        onChange={(e) => {
                          setRcCopyAvailable(e.target.value);
                          if (e.target.value === 'No') {
                            setRcDocument('');
                            setRcFileName('');
                          }
                        }}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors appearance-none"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  {/* RC Document */}
                  {rcCopyAvailable === 'Yes' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">RC Document</label>
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
                          className="flex items-center space-x-3 w-full bg-slate-50 border border-slate-200 hover:border-[#003893]/50 rounded-lg py-2.5 px-4 text-slate-800 cursor-pointer transition-colors"
                        >
                          <Upload className="text-[#003893] shrink-0" size={18} />
                          <span className="text-slate-500 truncate flex-1 text-sm">
                            {rcFileName || 'Upload New RC File...'}
                          </span>
                          {rcFileName && <FileText className="text-emerald-500" size={16} />}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Insurance Valid Till */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Insurance Valid Till</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="date"
                        value={insuranceValidTill}
                        onChange={(e) => setInsuranceValidTill(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Preferred Service Area */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Preferred Service Area</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={preferredServiceArea}
                        onChange={(e) => setPreferredServiceArea(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="e.g. Airport, New Town, Salt Lake"
                      />
                    </div>
                  </div>

                  {/* Previous Experience */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Previous Experience (if any)</label>
                    <div className="relative">
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                      <input
                        type="text"
                        value={previousExperience}
                        onChange={(e) => setPreviousExperience(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                        placeholder="e.g. 5 Years as Chauffeur"
                      />
                    </div>
                  </div>

                  {/* License Document */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">License Document</label>
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
                        className="flex items-center space-x-3 w-full bg-slate-50 border border-slate-200 hover:border-[#003893]/50 rounded-lg py-2.5 px-4 text-slate-800 cursor-pointer transition-colors"
                      >
                        <Upload className="text-[#003893] shrink-0" size={18} />
                        <span className="text-slate-500 truncate flex-1 text-sm">
                          {licenseFileName || 'Upload New License File...'}
                        </span>
                        {licenseFileName && <FileText className="text-emerald-500" size={16} />}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-serif text-[#003893] tracking-wide font-bold">Change Password (Optional)</h3>
                
                {/* Current Password */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-11 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                      placeholder="Current Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003893] transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-11 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003893] transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003893]" size={18} />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-11 pr-11 text-sm text-slate-800 focus:border-[#003893] focus:outline-none transition-colors"
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003893] transition-colors"
                    >
                      {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-600">
                  {success}
                </div>
              )}

              {/* Submit / Action Buttons */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#003893] text-white hover:bg-[#002d72] disabled:opacity-50 font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-[#003893]/15"
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
