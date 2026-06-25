import React from 'react';
import { ChevronRight } from '../../utils/icons';

const ClientProfile = ({
  user,
  profileForm,
  setProfileForm,
  handleSaveProfile,
  profileSaving,
  savedAddresses,
  handleAddAddress,
  handleDeleteAccount,
  setIsProfileOpen,
  totalRidesCount
}) => {
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
            <div className="w-16 h-16 rounded-full bg-[#003893]/10 flex items-center justify-center text-[#003893] border-2 border-[#003893] text-2xl font-bold font-serif relative shrink-0">
              {profileForm.fullName?.charAt(0).toUpperCase()}
              <button onClick={() => setIsProfileOpen(true)} className="absolute bottom-0 right-0 w-5 h-5 bg-[#003893] text-white rounded-full flex items-center justify-center border border-white text-[8px] font-bold shadow-sm">✏️</button>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{profileForm.fullName || user.fullName}</h3>
              <p className="text-xs text-slate-400">{user.role?.toUpperCase()} • Member</p>
            </div>
          </div>

          {/* Fields form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        </div>
      </div>

      {/* Right Side Column: emergency, locations, notifications */}
      <div className="lg:col-span-4 space-y-6">


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

        {/* Delete Account */}
        <button
          onClick={handleDeleteAccount}
          className="w-full bg-red-50 hover:bg-red-500 border border-slate-200 hover:border-red-500 text-red-500 hover:text-white py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer font-sans"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default ClientProfile;
