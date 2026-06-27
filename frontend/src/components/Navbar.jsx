import React, { useState } from 'react';
import ImageWithFallback from './ImageWithFallback';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, User, LayoutDashboard, LogOut } from '../utils/icons';
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

  const isLinkActive = (link) => {
    const linkUrl = new URL(link.path, window.location.origin);
    const linkPath = linkUrl.pathname;
    const linkParams = linkUrl.searchParams;

    if (linkPath !== location.pathname) return false;

    // For Home link (no query params), only active on exact path with no tab/redirect and no hash
    if (link.name === 'Home') {
      return location.pathname === '/' && !location.search && !location.hash;
    }

    // For Activity/Wallet: match query params (tab= or redirect=)
    if (linkParams.has('tab')) {
      const currentParams = new URLSearchParams(location.search);
      return currentParams.get('tab') === linkParams.get('tab');
    }
    if (linkParams.has('redirect')) {
      const currentParams = new URLSearchParams(location.search);
      return currentParams.get('redirect') === linkParams.get('redirect');
    }

    // For Fleet and other simple path links
    return !linkParams.toString();
  };

  return (
    <nav className="fixed w-full left-0 top-0 z-[100] bg-white h-[76px] border-b border-[#F1F5F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <Link to="/" className="flex items-center">
            <img src="/logoo.png" alt="DMS Logo" className="h-[75px] w-auto object-contain" />
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => {
                  if (location.pathname === link.path.split('?')[0]) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`text-[16px] xl:text-[18px] font-medium transition-colors relative pb-1 whitespace-nowrap ${isLinkActive(link)
                  ? 'text-[#0B3D91]'
                  : 'text-[#0F172A] hover:text-[#0B3D91]'
                  }`}
              >
                {link.name}
                {isLinkActive(link) && (
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-[10px] w-[36px] h-[3px] rounded-[999px] bg-[#FFC107]"></span>
                )}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 xl:gap-6 min-h-[46px]">
            {loading && !user ? (
              <div className="flex items-center space-x-6 animate-pulse">
                <div className="w-16 h-8 bg-slate-100 rounded-lg"></div>
              </div>
            ) : (
              <>
                {user ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className="flex items-center space-x-2 text-[14px] xl:text-[16px] text-[#0F172A] hover:text-[#0B3D91] cursor-pointer transition-colors font-medium relative group"
                      title="Edit Profile"
                    >
                      {user.profilePicture ? (
                        <ImageWithFallback
                          src={user.profilePicture}
                          alt={user.fullName}
                          className="w-10 h-10 border-2 border-[#FFC107] rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 border-2 border-[#FFC107] rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] text-xs font-bold shrink-0">
                          <User size={14} />
                        </div>
                      )}
                      <span className="whitespace-nowrap">Hello, {user.fullName?.split(' ')[0] || 'Guest'}</span>
                    </button>
                    <Link
                      to={getDashboardPath()}
                      className="flex items-center space-x-1.5 bg-[#0B3D91] hover:bg-[#093073] text-white h-[40px] xl:h-[46px] px-4 xl:px-[20px] rounded-[10px] shadow-md transition-colors font-bold text-xs xl:text-sm tracking-wide whitespace-nowrap"
                    >
                      <LayoutDashboard size={15} />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1.5 text-[#64748B] hover:text-[#0F172A] transition-colors font-semibold text-xs xl:text-sm cursor-pointer whitespace-nowrap"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link to="/auth" className="bg-white border border-[#0B3D91] text-[#0B3D91] hover:bg-[#0B3D91]/5 h-[40px] xl:h-[46px] px-4 xl:px-5 rounded-[10px] flex items-center justify-center transition-all font-semibold tracking-wider text-xs xl:text-sm uppercase whitespace-nowrap">
                    Sign In
                  </Link>
                )}
                {shouldShowBooking() && (
                  <Link to="/get-started" className="flex items-center justify-center space-x-1.5 bg-[#FFC107] hover:bg-[#e5ad04] text-[#0B3D91] h-[40px] xl:h-[46px] px-4 xl:px-5 rounded-[10px] transition-colors font-bold text-xs xl:text-sm tracking-wide whitespace-nowrap">
                    <span>Book Now</span>
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </Link>
                )}
              </>
            )}
          </div>

          <button className="lg:hidden text-slate-800" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="lg:hidden fixed top-[76px] left-0 w-full h-[calc(100vh-76px)] bg-white border-t border-slate-100 overflow-y-auto z-[99] flex flex-col justify-between px-6 py-6 pb-28"
            >
              <div className="space-y-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`block text-[18px] font-bold py-3 text-center transition-colors border-b border-slate-100 ${isLinkActive(link)
                      ? 'text-[#0B3D91]'
                      : 'text-[#0F172A] hover:text-[#0B3D91]'
                      }`}
                    onClick={() => {
                      setIsOpen(false);
                      if (location.pathname === link.path.split('?')[0]) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="pt-4 space-y-4">
                  {loading && !user ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="flex items-center justify-center space-x-2 py-1">
                        <div className="w-6 h-6 rounded-full bg-slate-100"></div>
                        <div className="h-4 w-24 bg-slate-100 rounded"></div>
                      </div>
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
                            className="flex items-center justify-center space-x-3 text-center w-full text-[#0B3D91] hover:text-[#093073] py-3 font-bold border-b border-slate-100"
                          >
                            {user.profilePicture ? (
                              <ImageWithFallback
                                src={user.profilePicture}
                                alt={user.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-[#0B3D91]/30"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] border border-[#0B3D91]/20 text-xs font-bold">
                                <User size={12} />
                              </div>
                            )}
                            <span className="text-[16px]">Edit Profile</span>
                          </button>
                          <Link
                            to={getDashboardPath()}
                            className="block text-center text-[#0B3D91] hover:text-[#093073] py-3 font-bold border-b border-slate-100 text-[16px]"
                            onClick={() => setIsOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setIsOpen(false);
                            }}
                            className="block text-center w-full text-slate-500 hover:text-slate-800 py-3 font-bold text-[16px]"
                          >
                            Logout
                          </button>
                        </>
                      ) : (
                        <Link
                          to="/auth"
                          className="block text-center text-[#0B3D91] hover:text-[#093073] py-3 font-bold border-b border-slate-100 text-[16px]"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign In / Sign Up
                        </Link>
                      )}
                      {shouldShowBooking() && (
                        <Link
                          to="/get-started"
                          className="flex items-center justify-center space-x-2 bg-[#FFC107] hover:bg-[#e5ad04] text-[#0B3D91] py-3.5 px-6 rounded-xl font-bold text-center mt-6 transition-colors shadow-md"
                          onClick={() => setIsOpen(false)}
                        >
                          <span>Book Now</span>
                          <ChevronRight size={18} strokeWidth={2.5} />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Copyright at the bottom of the mobile menu */}
              <div className="mt-auto pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs font-semibold">
                  &copy; {new Date().getFullYear()} DMS Cab Services Chauffeur Services. All rights reserved.
                </p>
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
