import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, User, LayoutDashboard } from '../utils/icons';
import { useAuth } from '../context/AuthContext.jsx';
import EditProfileModal from './EditProfileModal.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user, loading, logout } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'driver') return '/driver/dashboard';
    return '/client/dashboard';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Fleet', path: '/fleet' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const shouldShowBooking = () => {
    return !user || user.role === 'client';
  };

  return (
    <nav className="fixed w-full z-50 bg-[#060a11] py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl sm:text-2xl font-serif tracking-[0.1em] sm:tracking-[0.2em] text-[#d4af37] font-bold uppercase">
            DMS LUXE
          </Link>

          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => {
                  if (location.pathname === link.path) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`text-[15px] transition-colors relative pb-1 ${location.pathname === link.path
                    ? 'text-[#d4af37]'
                    : 'text-gray-300 hover:text-white'
                  }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#d4af37]"></span>
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-6 min-h-[46px]">
            {loading && !user ? (
              <div className="flex items-center space-x-6 animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10"></div>
                  <div className="h-4 w-20 bg-white/5 rounded"></div>
                </div>
                <div className="w-24 h-9 bg-white/5 border border-white/10 rounded-lg"></div>
                <div className="w-16 h-4 bg-white/5 rounded"></div>
              </div>
            ) : (
              <>
                {user ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className="flex items-center space-x-2 text-sm text-gray-200 hover:text-[#d4af37] cursor-pointer transition-colors font-medium relative group"
                      title="Edit Profile"
                    >
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/40"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/30 text-xs font-bold font-serif">
                          {user.fullName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>Hello, {user.fullName?.split(' ')[0] || 'Guest'}</span>
                      <span className="absolute bottom-0 left-9 w-0 h-[1px] bg-[#d4af37] group-hover:w-[calc(100%-2.25rem)] transition-all duration-300"></span>
                    </button>
                    <Link
                      to={getDashboardPath()}
                      className="flex items-center space-x-1 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] px-4 py-2 rounded-lg hover:bg-[#d4af37]/20 transition-colors font-medium text-sm"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1 text-gray-300 hover:text-[#d4af37] transition-colors font-medium"
                    >
                      <User size={18} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link to="/auth" className="flex items-center space-x-1 text-gray-300 hover:text-[#d4af37] transition-colors font-medium">
                    <User size={18} />
                    <span>Sign In</span>
                  </Link>
                )}
                {shouldShowBooking() && (
                  <Link to="/get-started" className="flex items-center space-x-1 bg-[#ffe392] text-black px-6 py-2.5 rounded-md hover:bg-[#e6c87a] transition-colors font-medium">
                    <span>Book Now</span>
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </Link>
                )}
              </>
            )}
          </div>

          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden mt-4 pb-4 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block text-gray-300 hover:text-[#d4af37] px-2 py-1"
                  onClick={() => {
                    setIsOpen(false);
                    if (location.pathname === link.path) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 space-y-4">
                {loading && !user ? (
                  <div className="space-y-4 animate-pulse px-2">
                    <div className="flex items-center space-x-2 py-1">
                      <div className="w-6 h-6 rounded-full bg-white/5"></div>
                      <div className="h-4 w-24 bg-white/5 rounded"></div>
                    </div>
                    <div className="h-4 w-20 bg-white/5 rounded"></div>
                    <div className="h-4 w-16 bg-white/5 rounded"></div>
                  </div>
                ) : (
                  <>
                    {user ? (
                      <>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            setIsProfileOpen(true);
                          }}
                          className="flex items-center space-x-2 text-left w-full text-[#d4af37] hover:text-white px-2 py-1 font-medium"
                        >
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.fullName}
                              className="w-6 h-6 rounded-full object-cover border border-[#d4af37]/40"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/30 text-[10px] font-bold font-serif">
                              {user.fullName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>Edit Profile</span>
                        </button>
                        <Link
                          to={getDashboardPath()}
                          className="block text-gray-300 hover:text-[#d4af37] px-2 py-1 font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                          }}
                          className="block text-left w-full text-gray-300 hover:text-[#d4af37] px-2 py-1"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        className="block text-gray-300 hover:text-[#d4af37] px-2 py-1"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign In / Sign Up
                      </Link>
                    )}
                    {shouldShowBooking() && (
                      <Link
                        to="/get-started"
                        className="block text-center bg-[#ffe392] text-black px-6 py-2.5 rounded-md font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        Book Now
                      </Link>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </nav>
  );
};

export default Navbar;
