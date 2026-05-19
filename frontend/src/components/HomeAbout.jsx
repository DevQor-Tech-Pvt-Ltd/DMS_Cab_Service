import React from 'react';
import { ChevronRight, Shield, Award } from '../utils/icons';
import { Link } from 'react-router-dom';

const HomeAbout = () => {
  return (
    <section className="bg-[#060a11] py-24 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Image Side - Purged framer-motion script check for instant painting */}
          <div className="w-full lg:w-1/2 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-[#d4af37]/20 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
              <img
                src="/about_car.avif"
                alt="DMS Luxe Chauffeur"
                className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover scale-100 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060a11] via-transparent to-transparent"></div>
            </div>

            {/* Floating Experience Badge */}
            <div className="absolute -bottom-6 -right-6 bg-[#111620] border border-[#d4af37]/40 p-6 rounded-xl shadow-2xl hidden md:flex flex-col items-center justify-center w-40 h-40 transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-serif text-[#d4af37] mb-2 font-semibold">15+</div>
              <div className="text-xs text-center text-gray-400 uppercase tracking-widest font-semibold">Years of<br />Excellence</div>
            </div>
          </div>

          {/* Text Content Side */}
          <div className="w-full lg:w-1/2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-[1px] bg-[#d4af37]"></div>
              <span className="text-[#d4af37] text-sm font-semibold tracking-[0.2em] uppercase">Who We Are</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
              Setting the Standard in <span className="text-[#d4af37] italic">Luxury</span> Travel
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed mb-8 font-light">
              DMS LUXE is not just a transportation service; it is a commitment to uncompromising excellence. For over a decade, we have been the premier choice for discerning executives, dignitaries, and private individuals who demand nothing but the absolute best.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#d4af37]/20 transition-colors">
                  <Shield className="text-[#d4af37]" size={20} />
                </div>
                <div>
                  <h4 className="text-white font-serif text-lg mb-1">Total Discretion</h4>
                  <p className="text-sm text-gray-500">Your privacy is guaranteed on every journey.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#d4af37]/20 transition-colors">
                  <Award className="text-[#d4af37]" size={20} />
                </div>
                <div>
                  <h4 className="text-white font-serif text-lg mb-1">Elite Fleet</h4>
                  <p className="text-sm text-gray-500">Only the latest, meticulously maintained vehicles.</p>
                </div>
              </div>
            </div>

            <Link to="/about" className="inline-flex items-center space-x-3 border-b-2 border-[#d4af37] text-[#d4af37] pb-1 hover:text-white hover:border-white transition-colors duration-300 font-semibold tracking-wider uppercase text-sm group">
              <span>Discover Our Story</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeAbout;
