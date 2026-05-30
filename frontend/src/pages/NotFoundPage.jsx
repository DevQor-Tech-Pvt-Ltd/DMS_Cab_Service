import React from 'react';
import { ShieldAlert, ArrowLeft } from '../utils/icons';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background styling */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#003893]/5 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 text-center max-w-lg animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-slate-50 border border-[#003893]/20 flex items-center justify-center shadow-md">
            <ShieldAlert size={40} className="text-[#003893]" />
          </div>
        </div>
        
        <h1 className="text-8xl font-serif text-[#003893] font-bold mb-4">404</h1>
        
        <h2 className="text-2xl md:text-3xl font-serif text-slate-900 mb-4">
          Access Restricted or Page Not Found
        </h2>
        
        <p className="text-slate-600 mb-10 leading-relaxed font-light">
          The destination you are trying to reach does not exist or you do not have the required clearance to view this route.
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center space-x-3 bg-[#f2b705] text-[#003893] font-bold px-8 py-3.5 rounded-lg hover:bg-[#e5ad04] transition-colors shadow-md"
        >
          <ArrowLeft size={18} />
          <span>Return to Headquarters</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
