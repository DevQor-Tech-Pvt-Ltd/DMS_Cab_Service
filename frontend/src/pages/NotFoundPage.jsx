import React from 'react';
import { ShieldAlert, ArrowLeft } from '../utils/icons';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#060a11] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background styling */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 text-center max-w-lg animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#111620] border border-[#d4af37]/30 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <ShieldAlert size={40} className="text-[#d4af37]" />
          </div>
        </div>
        
        <h1 className="text-8xl font-serif text-[#d4af37] font-bold mb-4">404</h1>
        
        <h2 className="text-2xl md:text-3xl font-serif text-white mb-4">
          Access Restricted or Page Not Found
        </h2>
        
        <p className="text-gray-400 mb-10 leading-relaxed font-light">
          The destination you are trying to reach does not exist or you do not have the required clearance to view this route.
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center space-x-3 bg-[#ffe392] text-black font-semibold px-8 py-3.5 rounded-lg hover:bg-[#e6c87a] transition-colors shadow-lg shadow-[#ffe392]/10"
        >
          <ArrowLeft size={18} />
          <span>Return to Headquarters</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
