import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Car, Clock, ChevronRight, Users } from '../utils/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LazyViewportSection from '../components/LazyViewportSection';

// Lazy load below-the-fold components to accelerate initial paint (FCP/LCP)
const HomeAbout = lazy(() => import('../components/HomeAbout'));
const Services = lazy(() => import('../components/Services'));
const HomeFleet = lazy(() => import('../components/HomeFleet'));
const HomeContact = lazy(() => import('../components/HomeContact'));

// Height-preserving dark skeleton fallback to eliminate Cumulative Layout Shift (CLS)
const SectionSkeleton = () => (
  <div className="py-24 bg-[#060a11] border-t border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
      <div className="flex justify-center mb-4">
        <div className="h-4 w-28 bg-[#d4af37]/10 rounded border border-[#d4af37]/20"></div>
      </div>
      <div className="h-8 w-96 bg-white/5 rounded mx-auto"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <div className="h-64 bg-[#0a0f18] rounded-2xl border border-white/5"></div>
        <div className="h-64 bg-[#0a0f18] rounded-2xl border border-white/5"></div>
        <div className="h-64 bg-[#0a0f18] rounded-2xl border border-white/5"></div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'driver') return '/driver/dashboard';
    return '/client/dashboard';
  };

  const shouldShowBooking = () => {
    return !user || user.role === 'client';
  };

  return (
    <div className="bg-[#060a11]">
      <div className="relative min-h-screen overflow-x-hidden flex flex-col justify-between pt-20 md:pt-28 pb-8 md:pb-0">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/dms-bg.avif')" }}
        >
          {/* Gradient Overlay to darken the left side and bottom */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060a11] via-[#060a11]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a11] via-[#060a11]/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex items-center">
          <div className="max-w-2xl mt-6 md:mt-0">
            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 sm:space-x-4 mb-4 md:mb-6"
            >
              <div className="w-8 sm:w-12 h-[1px] bg-[#d4af37]"></div>
              <span className="text-[#d4af37] text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.1em] sm:tracking-[0.2em] uppercase">Premium Chauffeur Service</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-7xl font-serif text-[#d4af37] leading-[1.1] mb-4 md:mb-6"
            >
              Executive Rides,<br />On Your Schedule
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-300 text-base md:text-xl max-w-xl mb-6 md:mb-10 font-light leading-relaxed"
            >
              Book your premium chauffeur minimum 12 hours in advance and travel with comfort, class and complete peace of mind.
            </motion.p>

            {/* Feature Icons Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:flex md:flex-wrap gap-3 sm:gap-4 mb-8 md:mb-12"
            >
              {/* Feature 1 */}
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/5 border border-white/10 rounded-xl p-2.5 px-3 sm:p-3 sm:px-4 backdrop-blur-sm">
                <User className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" size={20} strokeWidth={1.5} />
                <span className="text-[10px] sm:text-xs text-gray-300 leading-tight">Professional<br />Chauffeurs</span>
              </div>
              {/* Feature 2 */}
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/5 border border-white/10 rounded-xl p-2.5 px-3 sm:p-3 sm:px-4 backdrop-blur-sm">
                <ShieldCheck className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" size={20} strokeWidth={1.5} />
                <span className="text-[10px] sm:text-xs text-gray-300 leading-tight">Safety &<br />Reliability</span>
              </div>
              {/* Feature 3 */}
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/5 border border-white/10 rounded-xl p-2.5 px-3 sm:p-3 sm:px-4 backdrop-blur-sm">
                <Car className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" size={20} strokeWidth={1.5} />
                <span className="text-[10px] sm:text-xs text-gray-300 leading-tight">Luxury<br />Vehicles</span>
              </div>
              {/* Feature 4 */}
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/5 border border-white/10 rounded-xl p-2.5 px-3 sm:p-3 sm:px-4 backdrop-blur-sm">
                <Clock className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" size={20} strokeWidth={1.5} />
                <span className="text-[10px] sm:text-xs text-gray-300 leading-tight">Punctual<br />& On-Time</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-row items-center gap-4 sm:gap-8 flex-wrap"
            >
              {shouldShowBooking() ? (
                <Link to="/get-started" className="flex items-center justify-center space-x-2 bg-[#ffe392] text-black px-5 py-3 sm:px-8 sm:py-3.5 rounded-lg hover:bg-[#e6c87a] transition-colors font-semibold text-sm sm:text-base w-auto">
                  <span>Get Started</span>
                  <ChevronRight size={18} strokeWidth={2.5} />
                </Link>
              ) : (
                <Link to={getDashboardPath()} className="flex items-center justify-center space-x-2 bg-[#ffe392] text-black px-5 py-3 sm:px-8 sm:py-3.5 rounded-lg hover:bg-[#e6c87a] transition-colors font-semibold text-sm sm:text-base w-auto">
                  <span>Go to Dashboard</span>
                  <ChevronRight size={18} strokeWidth={2.5} />
                </Link>
              )}
              <Link to="/learn-more" className="flex items-center justify-center space-x-2 text-[#d4af37] hover:text-[#ffe392] transition-colors font-medium text-sm sm:text-base py-2">
                <span>Learn More</span>
                <ChevronRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8 pt-8 md:pt-16"
        >
          <div className="bg-[#111620]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 sm:p-6 md:p-8 grid grid-cols-2 md:flex md:flex-row justify-between items-center gap-6 sm:gap-8 md:gap-4 shadow-2xl">
            {/* Stat 1 */}
            <div className="flex items-center space-x-2 sm:space-x-4 justify-start md:justify-start">
              <Users className="text-[#d4af37] w-7 h-7 sm:w-9 sm:h-9" size={28} strokeWidth={1.5} />
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#d4af37] mb-0.5">10K+</div>
                <div className="text-[10px] sm:text-xs text-gray-400">Happy Clients</div>
              </div>
            </div>
            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-white/10"></div>
            {/* Stat 2 */}
            <div className="flex items-center space-x-2 sm:space-x-4 justify-start md:justify-center">
              <Car className="text-[#d4af37] w-7 h-7 sm:w-9 sm:h-9" size={28} strokeWidth={1.5} />
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#d4af37] mb-0.5">500+</div>
                <div className="text-[10px] sm:text-xs text-gray-400">Premium Vehicles</div>
              </div>
            </div>
            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-white/10"></div>
            {/* Stat 3 */}
            <div className="flex items-center space-x-2 sm:space-x-4 justify-start md:justify-center">
              <ShieldCheck className="text-[#d4af37] w-7 h-7 sm:w-9 sm:h-9" size={28} strokeWidth={1.5} />
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#d4af37] mb-0.5">99.9%</div>
                <div className="text-[10px] sm:text-xs text-gray-400">Safety Record</div>
              </div>
            </div>
            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-white/10"></div>
            {/* Stat 4 */}
            <div className="flex items-center space-x-2 sm:space-x-4 justify-start md:justify-end">
              <Clock className="text-[#d4af37] w-7 h-7 sm:w-9 sm:h-9" size={28} strokeWidth={1.5} />
              <div>
                <div className="text-xl sm:text-2xl font-serif text-[#d4af37] mb-0.5">24/7</div>
                <div className="text-[10px] sm:text-xs text-gray-400">Customer Support</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Brief About Section */}
      <LazyViewportSection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <HomeAbout />
        </Suspense>
      </LazyViewportSection>

      {/* Services Section */}
      <LazyViewportSection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <Services />
        </Suspense>
      </LazyViewportSection>

      {/* Brief Fleet Section */}
      <LazyViewportSection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <HomeFleet />
        </Suspense>
      </LazyViewportSection>

      {/* Brief Contact Section */}
      <LazyViewportSection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <HomeContact />
        </Suspense>
      </LazyViewportSection>
    </div>
  );
};

export default Home;
