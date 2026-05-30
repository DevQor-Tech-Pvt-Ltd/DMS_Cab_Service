import React from 'react';
import { Phone, Mail, ArrowRight } from '../utils/icons';
import { Link } from 'react-router-dom';

const HomeContact = () => {
  return (
    <section className="bg-slate-50 py-24 md:py-32 relative overflow-hidden border-t border-slate-100">
      {/* Subtle Yellow Glow Background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#f2b705]/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left: Luxury Image */}
          <div className="w-full lg:w-1/2 relative group">
            {/* Glowing Border Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#003893]/10 to-transparent rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200">
              <img
                src="/Range Rover Autobiography.webp"
                alt="Range Rover Autobiography"
                className="w-full h-[300px] sm:h-[450px] lg:h-[600px] object-cover scale-100 group-hover:scale-103 transition-transform duration-[800ms] ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

              {/* Overlay Quote */}
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 border-l-2 border-[#f2b705] pl-5">
                <p className="text-white font-serif text-xl sm:text-2xl md:text-3xl italic tracking-wide">
                  "Excellence is not an act,<br />but a habit."
                </p>
              </div>
            </div>
          </div>

          {/* Right: High-End Content */}
          <div className="w-full lg:w-1/2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-[1px] bg-[#003893]"></div>
              <span className="text-[#003893] text-sm font-semibold tracking-[0.2em] uppercase">Private Concierge</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-slate-900 mb-8 leading-[1.1]">
              At Your <br /><span className="text-[#003893] italic">Service.</span>
            </h2>

            <p className="text-slate-650 text-lg mb-14 font-light leading-relaxed max-w-lg">
              Experience the pinnacle of personal transportation. Our dedicated concierge team is available 24 hours a day to orchestrate your perfect journey.
            </p>

            <div className="space-y-8">
              {/* Direct Line */}
              <div className="flex items-start space-x-6 pb-8 border-b border-slate-200 group">
                <div className="w-14 h-14 rounded-full border border-[#003893]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#003893]/10 transition-colors">
                  <Phone size={22} className="text-[#003893]" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2 font-semibold">Direct Line</div>
                  <div className="text-2xl md:text-3xl font-serif text-slate-900 group-hover:text-[#003893] transition-colors">
                    +91 7439885351
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-6 pb-8 border-b border-slate-200 group">
                <div className="w-14 h-14 rounded-full border border-[#003893]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#003893]/10 transition-colors">
                  <Mail size={22} className="text-[#003893]" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2 font-semibold">Private Inquiries</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-serif text-slate-900 group-hover:text-[#003893] transition-colors break-all sm:break-normal">
                    pritam.mondal@devqor.in
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14">
              <Link
                to="/contact"
                className="inline-flex items-center space-x-4 border border-[#003893] px-8 py-4 text-[#003893] hover:bg-[#003893] hover:text-white transition-all duration-300 uppercase tracking-[0.15em] text-sm font-semibold group"
              >
                <span>Contact Headquarters</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeContact;
