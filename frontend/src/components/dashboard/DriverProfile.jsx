import React from 'react';
import { Car } from '../../utils/icons';

const DriverProfile = ({
  profileForm,
  setProfileForm,
  handleSaveProfile,
  profileSaving,
  profileError,
  profileSuccess,
  user,
  handleDeleteAccount
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-7xl mx-auto">
      {/* Left: Chauffeur Profile details form */}
      <div className="lg:col-span-8 space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Account Settings</h2>
          <p className="text-xs text-slate-400 mt-1">Manage your premium chauffeur profile credentials.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          {/* Header info */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-[#003893]/10 flex items-center justify-center text-[#003893] border-2 border-[#003893] text-2xl font-bold font-serif relative">
              {profileForm.fullName?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Personal Information</h4>
              <p className="text-[10px] text-slate-400">Update your details and how we contact you.</p>
            </div>
          </div>

          {/* Fields form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contact Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-800 transition-all"
                required
              />
            </div>
          </div>

          {profileError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">{profileError}</div>
          )}
          {profileSuccess && (
            <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">{profileSuccess}</div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="bg-[#003893] hover:bg-[#002d72] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
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
        </form>
      </div>

      {/* Right Sidebar: Vehicle verification + Danger Zone */}
      <div className="lg:col-span-4 space-y-6">
        {/* Vehicle Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Car size={18} className="text-[#003893]" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Your Vehicle Details</h4>
          </div>

          <div className="space-y-3.5 text-xs text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Current City</span>
              <span className="text-slate-800 font-semibold">{user.currentCity || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Car Number</span>
              <span className="text-slate-800 font-semibold font-mono">{user.vehicleNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Vehicle Model & Year</span>
              <span className="text-slate-800 font-semibold">{user.vehicleModelYear || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Driving License Number</span>
              <span className="text-slate-800 font-semibold font-mono">{user.licenseNumber || 'N/A'}</span>
            </div>
            {user.aadhaarNumber && (
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Aadhaar Number</span>
                <span className="text-slate-800 font-semibold">{user.aadhaarNumber}</span>
              </div>
            )}
            {user.driverNameIfVendor && (
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Driver Name (if Vendor)</span>
                <span className="text-slate-800 font-semibold">{user.driverNameIfVendor}</span>
              </div>
            )}
            {user.driverContactNumber && (
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Driver Contact Number</span>
                <span className="text-slate-800 font-semibold">{user.driverContactNumber}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">RC Copy Available</span>
              <span className="text-slate-800 font-semibold">{user.rcCopyAvailable || 'No'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Insurance Valid Till</span>
              <span className="text-slate-800 font-semibold">{user.insuranceValidTill || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Preferred Service Area</span>
              <span className="text-slate-800 font-semibold">{user.preferredServiceArea || 'N/A'}</span>
            </div>
            {user.previousExperience && (
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Previous Experience</span>
                <span className="text-slate-800 font-semibold">{user.previousExperience}</span>
              </div>
            )}
            <div className="pt-2">
              <span className="bg-emerald-100 border border-emerald-200 text-emerald-600 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full">
                Verified Chauffeur
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 space-y-4 text-left">
          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Danger Zone</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
            Once you delete your account, your profile will be permanently deactivated. Your historical ride log and earnings statements are legally retained for financial compliance.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-white hover:bg-red-600 border border-red-200 hover:border-red-600 text-red-650 hover:text-white py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
          >
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
