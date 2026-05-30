import React from 'react';
import Fleet from '../components/Fleet';

const FleetPage = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Fleet Page Header */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 z-0 opacity-25">
          <img 
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80" 
            alt="DMS Fleet" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 mb-4 animate-fade-in-up">
            <div className="w-8 h-[1px] bg-[#003893]"></div>
            <span className="text-[#003893] text-sm font-semibold tracking-[0.2em] uppercase">Premium Vehicles</span>
            <div className="w-8 h-[1px] bg-[#003893]"></div>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif text-slate-900 mb-6 animate-fade-in-up animation-delay-100">
            Our Exclusive <span className="text-[#003893] italic">Fleet</span>
          </h1>

          <p className="text-slate-650 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Explore our curated selection of top-tier executive sedans, luxury SUVs, and premium vans. All meticulously maintained to provide an impeccable journey.
          </p>
        </div>
      </section>

      {/* Render the Fleet Component */}
      <div className="flex-grow -mt-10">
        <Fleet />
      </div>
    </div>
  );
};

export default FleetPage;
