import React from 'react';
import { Shield, Clock, Award, Star, ChevronRight } from '../utils/icons';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 z-0 opacity-25">
          <img 
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80" 
            alt="DMS About Us Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 mb-4 animate-fade-in-up">
            <div className="w-8 h-[1px] bg-[#003893]"></div>
            <span className="text-[#003893] text-sm font-semibold tracking-[0.2em] uppercase">The DMS Legacy</span>
            <div className="w-8 h-[1px] bg-[#003893]"></div>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif text-slate-900 mb-6 animate-fade-in-up animation-delay-100">
            Redefining <span className="text-[#003893] italic">Luxury</span> Travel
          </h1>

          <p className="text-slate-650 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Setting the global standard for executive chauffeur services through uncompromising excellence, unwavering discretion, and absolute reliability.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Image Side */}
            <div className="w-full lg:w-1/2 relative animate-fade-in animation-delay-300">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80" 
                  alt="Professional Chauffeur" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
              </div>
              
              {/* Floating Stat Badge */}
              <div className="absolute -bottom-8 -right-8 bg-white border border-[#003893]/20 p-6 rounded-xl shadow-2xl hidden md:block">
                <div className="text-4xl font-serif text-[#003893] mb-1 font-bold">15+</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Years of Excellence</div>
              </div>
            </div>

            {/* Text Side */}
            <div className="w-full lg:w-1/2 animate-fade-in-up animation-delay-400">
              <h3 className="text-3xl md:text-4xl font-serif text-slate-900 mb-6">Our Commitment to Perfection</h3>
              <p className="text-slate-650 leading-relaxed mb-6">
                Founded on the principles of absolute luxury and reliability, DMS has grown to become the premier choice for discerning travelers, executives, and high-profile individuals across the region.
              </p>
              <p className="text-slate-650 leading-relaxed mb-8">
                We believe that true luxury lies in the details. From the immaculate presentation of our vehicles to the extensive training of our chauffeurs, every aspect of our service is meticulously curated to provide an unparalleled travel experience. When you ride with us, you are not just reaching a destination; you are making a statement.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="border-l-2 border-[#003893] pl-4">
                  <div className="text-2xl font-serif text-slate-900 mb-1 font-bold">Elite</div>
                  <div className="text-sm text-slate-500">Chauffeurs</div>
                </div>
                <div className="border-l-2 border-[#003893] pl-4">
                  <div className="text-2xl font-serif text-slate-900 mb-1 font-bold">Premium</div>
                  <div className="text-sm text-slate-500">Vehicles</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-slate-50 py-24 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-4">The DMS Difference</h2>
            <div className="w-16 h-[2px] bg-[#003893] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Unwavering Safety', desc: 'Your security is our paramount concern. Our fleet undergoes rigorous maintenance and our chauffeurs are highly trained in defensive driving.' },
              { icon: Clock, title: 'Absolute Punctuality', desc: 'We respect your time. Our advanced routing systems ensure we arrive exactly when requested, every single time.' },
              { icon: Star, title: 'Discreet Service', desc: 'Confidentiality is guaranteed. We provide a private, undisturbed environment for you to work, relax, or conduct business.' },
              { icon: Award, title: 'Bespoke Experience', desc: 'Every journey is tailored to your exacting preferences, from cabin temperature to your choice of complimentary refreshments.' }
            ].map((value, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-[#003893]/30 transition-all hover:shadow-md group animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-full bg-[#003893]/10 flex items-center justify-center mb-6 group-hover:bg-[#003893] transition-colors">
                  <value.icon className="text-[#003893] group-hover:text-white transition-colors" size={24} />
                </div>
                <h4 className="text-xl font-serif text-slate-900 mb-3">{value.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-serif text-slate-900 mb-6 animate-fade-in-up">
            Experience The Extraordinary
          </h2>
          <p className="text-slate-650 mb-10 max-w-xl mx-auto animate-fade-in-up animation-delay-100">
            Join the ranks of those who refuse to compromise on quality. Book your first journey with DMS today.
          </p>
          <div className="animate-fade-in-up animation-delay-200">
            <Link to="/get-started" className="inline-flex items-center space-x-2 bg-[#f2b705] text-[#003893] px-8 py-4 rounded-lg hover:bg-[#e5ad04] transition-colors font-extrabold shadow-md">
              <span>Book Your Ride</span>
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
