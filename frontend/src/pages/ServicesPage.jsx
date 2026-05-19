import React from 'react';
import Services from '../components/Services';

const ServicesPage = () => {
  return (
    <div className="bg-[#060a11] min-h-screen">
      {/* Services Page Header */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200" 
            alt="DMS Services" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a11] via-[#060a11]/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 mb-4 animate-fade-in-up">
            <div className="w-8 h-[1px] bg-[#d4af37]"></div>
            <span className="text-[#d4af37] text-sm font-semibold tracking-[0.2em] uppercase">Our Offerings</span>
            <div className="w-8 h-[1px] bg-[#d4af37]"></div>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 animate-fade-in-up animation-delay-100">
            World-Class Chauffeur <span className="text-[#d4af37] italic">Services</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            From airport transfers to VIP protection, explore our comprehensive range of luxury transportation solutions designed for your utmost comfort and security.
          </p>
        </div>
      </section>

      {/* Render the Services Component */}
      <div className="-mt-10">
        <Services />
      </div>
    </div>
  );
};

export default ServicesPage;
