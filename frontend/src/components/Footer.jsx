import React from 'react';
import ImageWithFallback from './ImageWithFallback';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin } from '../utils/icons';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');

  return (
    <footer className={`bg-[#0B3D91] pt-12 pb-8 ${isDashboard ? 'pb-28 lg:pb-8' : ''} border-t border-white/5 relative overflow-hidden`}>
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#FFC107]/30 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Column 1: Explore */}
          <div className="text-center md:text-left">
            <h3 className="text-white font-serif text-base mb-4 flex items-center justify-center md:justify-start">
              <span className="w-4 h-[1px] bg-[#FFC107] mr-3"></span>
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">Our Heritage</Link>
              </li>
              <li>
                <Link to="/fleet" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">The Fleet</Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">Premium Services</Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">Contact Headquarters</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Services */}
          <div className="text-center md:text-left">
            <h3 className="text-white font-serif text-base mb-4 flex items-center justify-center md:justify-start">
              <span className="w-4 h-[1px] bg-[#FFC107] mr-3"></span>
              Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="/services" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">Airport Transfers</a>
              </li>
              <li>
                <a href="/services" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">Corporate Accounts</a>
              </li>
              <li>
                <a href="/services" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">Event Transportation</a>
              </li>
              <li>
                <a href="/services" className="text-slate-300 hover:text-[#FFC107] transition-colors inline-block">Hourly Charters</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Inquiries */}
          <div className="text-center md:text-left">
            <h3 className="text-white font-serif text-base mb-4 flex items-center justify-center md:justify-start">
              <span className="w-4 h-[1px] bg-[#FFC107] mr-3"></span>
              Inquiries
            </h3>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              <li className="flex flex-col items-center text-center space-y-1 space-x-0 md:flex-row md:items-start md:text-left md:space-x-3 md:space-y-0">
                <Phone size={15} className="text-[#FFC107] mt-0.5 shrink-0" />
                <span className="text-slate-300">+91 9903941219<br />Available 24/7</span>
              </li>
              <li className="flex flex-col items-center text-center space-y-1 space-x-0 md:flex-row md:items-start md:text-left md:space-x-3 md:space-y-0">
                <Mail size={15} className="text-[#FFC107] mt-0.5 shrink-0" />
                <span className="text-slate-300">contact@dmscabservices.com</span>
              </li>
              <li className="flex flex-col items-center text-center space-y-1 space-x-0 md:flex-row md:items-start md:text-left md:space-x-3 md:space-y-0">
                <MapPin size={15} className="text-[#FFC107] mt-0.5 shrink-0" />
                <span className="text-slate-300 leading-relaxed">Cabin 19, 8th Floor, Delta Tower (Awfis), Sector V, Salt Lake Bypass, Bidhannagar, Kolkata – 700091</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Brand & Socials (Aligned Right on Desktop) */}
          <div className="flex flex-col items-center md:items-start lg:items-end justify-between text-center md:text-left lg:text-right">
            <Link to="/" className="inline-block mb-4 mx-auto md:mx-0 lg:mr-0">
              <ImageWithFallback src="/logoo.png" alt="DMS Logo" className="h-[90px] w-auto object-contain rounded-xl" />
            </Link>
            <div className="flex items-center justify-center lg:justify-end space-x-3 mx-auto md:mx-0 lg:mr-0">
              {/* Instagram SVG */}
              <a href="#" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#FFC107] hover:border-[#FFC107]/50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              {/* LinkedIn SVG */}
              <a href="#" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#FFC107] hover:border-[#FFC107]/50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              {/* Twitter SVG */}
              <a href="#" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#FFC107] hover:border-[#FFC107]/50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs">
            &copy; {currentYear} DMS Cab Services. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-xs text-slate-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link to="/payment-policy" className="hover:text-white transition-colors">Payment Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
