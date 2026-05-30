import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LazyViewportSection from '../components/LazyViewportSection';
import {
  Calendar,
  Phone,
  ShieldCheck,
  User,
  Car,
  Clock,
  Plane,
  Star,
  Briefcase,
  Users,
  Tag,
  Smile,
  MapPin,
  Headphones
} from '../utils/icons';

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

// Custom, premium front-facing car icon matching the mockup
const CarFrontIcon = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.65 5H8.35a2 2 0 0 0-1.85 1.3L5 10l-2-2" />
    <path d="M17 14h.01" />
    <path d="M7 14h.01" />
    <path d="M12 18H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H12Z" />
    <path d="M5 18v2a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-2" />
    <path d="M14 18v2a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-2" />
  </svg>
);

// Custom, premium 24/7 Availability clock icon matching the mockup
const Availability247Icon = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l.73-1.19" />
    <text
      x="50%"
      y="58%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="6.2"
      fontWeight="900"
      fill="currentColor"
      letterSpacing="-0.2"
    >
      24/7
    </text>
  </svg>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

const Home = () => {
  const navigate = useNavigate();

  const trustItems = [
    {
      id: 'safety',
      title: 'Safe & Secure',
      description: 'Your safety is our top priority',
      icon: ShieldCheck
    },
    {
      id: 'drivers',
      title: 'Professional Drivers',
      description: 'Experienced, courteous & reliable chauffeurs',
      icon: User
    },
    {
      id: 'fleet',
      title: 'Luxury Fleet',
      description: 'Premium vehicles for maximum comfort',
      icon: CarFrontIcon
    },
    {
      id: 'availability',
      title: '24/7 Availability',
      description: 'Round-the-clock service at your convenience',
      icon: Availability247Icon
    }
  ];

  const offers = [
    {
      id: 'airport',
      title: 'Airport Transfers',
      description: 'Seamless pick-up and drop-off to/from any airport.',
      image: '/about_car.avif',
      icon: Plane
    },
    {
      id: 'vip',
      title: 'VIP Protection',
      description: 'Discreet and professional security for your peace of mind.',
      image: '/car-homeContact.png',
      icon: Star
    },
    {
      id: 'corporate',
      title: 'Corporate Travel',
      description: 'Reliable and punctual travel for your business needs.',
      image: '/Mercedes-Benz S-Class.webp',
      icon: Briefcase
    },
    {
      id: 'hourly',
      title: 'Hourly Chauffeur',
      description: 'Hire by the hour for meetings, events, and more.',
      image: '/Mercedes-Benz V-Class.webp',
      icon: Users
    },
    {
      id: 'special',
      title: 'Special Occasions',
      description: 'Make every occasion memorable with our luxury services.',
      image: '/Range Rover Autobiography.webp',
      icon: Tag
    }
  ];

  const stats = [
    {
      id: 'clients',
      value: '10K+',
      label: 'Happy Clients',
      icon: Smile
    },
    {
      id: 'vehicles',
      value: '500+',
      label: 'Luxury Vehicles',
      icon: Car
    },
    {
      id: 'cities',
      value: '50+',
      label: 'Cities Covered',
      icon: MapPin
    },
    {
      id: 'support',
      value: '24/7',
      label: 'Customer Support',
      icon: Headphones
    }
  ];

  return (
    <div className="bg-white text-[#0F172A] min-h-screen relative font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="relative h-[600px] flex items-center overflow-hidden pt-12"
        style={{
          backgroundImage: "url('/homebg.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundColor: "#ffffff"
        }}
      >
        {/* Mobile/Tablet solid light overlay to guarantee high text contrast */}
        <div className="absolute inset-0 z-0 bg-white/94 md:bg-white/88 lg:hidden pointer-events-none" />

        {/* Desktop premium custom gradient overlay */}
        <div
          className="hidden lg:block absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg,rgba(255,255,255,0.98) 0%,rgba(255,255,255,0.96) 22%,rgba(255,255,255,0.80) 30%,rgba(255,255,255,0.25) 40%,rgba(255,255,255,0.05) 48%,rgba(255,255,255,0) 55%)"
          }}
        />

        {/* Car Layer Animation */}
        <motion.div
          className="hidden lg:block absolute right-[-30px] bottom-[40px] z-[5] pointer-events-none"
          initial={{ x: 500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}>
          <img
            src="/carbg.png"
            alt="Luxury Car"
            className="w-[820px] xl:w-[900px] max-w-none object-contain" />
        </motion.div>

        <div className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center h-full">
          <div className="grid grid-cols-1 lg:grid-cols-[34%_66%] w-full items-center">

            {/* Left Column: Heading, Subheading & Actions (40% Width) */}
            <motion.div
              // className="w-full space-y-5 text-left relative z-10 max-w-[470px] -mt-4 pl-10"
              className="w-full space-y-5 text-left relative z-10 max-w-[420px] -mt-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {/* Premium Capsule */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-[2px] bg-[#FFC107]" />
                <span className="text-[#FFC107] font-bold text-[12px] tracking-[3px] uppercase">
                  Premium. Comfort. Trust.
                </span>
              </div>

              {/* World-Class Chauffeur Services */}
              <h1
                className="text-[52px] xl:text-[58px] font-extrabold leading-[0.95] tracking-[-2px] text-[#0B3D91]"
                style={{ fontWeight: 800 }}
              >
                <span className="whitespace-nowrap">World-Class</span><br />
                Chauffeur<br />
                <span className="text-[#FFC107]">Services</span>
              </h1>

              <p className="text-slate-600 text-[17px] font-normal leading-[1.8] max-w-[390px] mb-2">
                From airport transfers to VIP protection, explore our comprehensive range of luxury transportation solutions designed for your utmost comfort and security.
              </p>

              {/* Action Buttons */}
              {/* <div className="flex flex-wrap items-center gap-[20px] pt-4"> */}
              <div className="flex flex-wrap items-center gap-[16px] pt-0">
                <button
                  onClick={() => navigate('/get-started')}
                  className="h-[54px] bg-[#0B3D91] hover:bg-[#093073] text-white px-[24px] rounded-[12px] font-bold text-[16px] tracking-wide transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Calendar size={18} />
                  <span>Book a Ride</span>
                </button>

                <button
                  onClick={() => navigate('/contact')}
                  className="h-[54px] bg-white border-2 border-[#0B3D91] text-[#0B3D91] hover:bg-[#0B3D91]/5 px-[24px] rounded-[12px] font-bold text-[16px] tracking-wide transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Phone size={18} />
                  <span>Contact Us</span>
                </button>
              </div>
            </motion.div>

            {/* Right Column: Empty spacer (60% Width) to reveal background car and skyline */}
            <div className="hidden lg:block min-h-[400px]" />

          </div>
        </div>

      </section>

      {/* Floating Trust proposition bar container */}
      <div className="relative z-20 -mt-[42px] max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="bg-white rounded-[18px] border border-[#E2E8F0] py-7 px-8"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
            {trustItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex items-center space-x-4 text-left ${idx > 0 ? 'sm:pt-4 md:pt-0 lg:pl-8' : ''}`}
                >
                  <div className="w-[62px] h-[62px] rounded-full bg-[#0B3D91] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-[18px] leading-snug">{item.title}</h3>
                    <p className="text-[#64748B] text-[14px] mt-1 leading-snug">{item.description}</p>
                  </div>
                </div>
              );
            })}
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
