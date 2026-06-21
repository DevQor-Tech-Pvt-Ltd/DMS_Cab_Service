import React from 'react';
import ImageWithFallback from './ImageWithFallback';
import { Users, Briefcase, Wifi, ChevronRight } from '../utils/icons';

const fleetData = [
  {
    id: 1,
    name: 'Ertiga',
    category: 'hatchback',
    image: '/ertiga.jpeg',
    passengers: 3,
    luggage: 2,
    features: ['Free WiFi', 'Water & Mints', 'Leather Seats'],
    description: 'The pinnacle of luxury sedans. Perfect for corporate travel and airport transfers with unmatched comfort.'
  },
  {
    id: 2,
    name: 'Range Rover Autobiography',
    category: 'Luxury SUV',
    image: "/Range Rover Autobiography.webp",
    passengers: 4,
    luggage: 4,
    features: ['Free WiFi', 'Panoramic Roof', 'Extra Legroom'],
    description: 'Commanding presence with exceptional space. Ideal for outstation rides and arriving in absolute style.'
  },
  {
    id: 3,
    name: 'Mercedes-Benz V-Class',
    category: 'Premium Van',
    image: '/Mercedes-Benz V-Class.webp',
    passengers: 7,
    luggage: 6,
    features: ['Conference Seating', 'Privacy Glass', 'Climate Control'],
    description: 'Spacious and versatile luxury for group travel, roadshows, and family excursions without compromising on elegance.'
  }
];

const Fleet = () => {
  return (
    <section className="bg-white py-24 relative z-20 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-4 animate-fade-in-up">
            <div className="w-12 h-[1px] bg-[#003893]/30"></div>
            <span className="text-[#003893] text-sm font-semibold tracking-[0.2em] uppercase">The Fleet</span>
            <div className="w-12 h-[1px] bg-[#003893]/30"></div>
          </div>

          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6 animate-fade-in-up animation-delay-100">
            Uncompromising Luxury & Comfort
          </h2>
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fleetData.map((car, index) => (
            <div
              key={car.id}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden hover:border-[#003893]/40 transition-colors duration-300 flex flex-col shadow-md group animate-fade-in-up"
              style={{ animationDelay: `${(index + 2) * 150}ms` }}
            >
              {/* Car Image container */}
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <ImageWithFallback
                  src={car.image}
                  alt={car.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200">
                  <span className="text-[#003893] text-xs font-semibold tracking-wider uppercase">{car.category}</span>
                </div>
              </div>

              {/* Car Details */}
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-serif text-slate-900 mb-3">{car.name}</h3>
                <p className="text-slate-650 text-sm leading-relaxed mb-6 flex-grow">
                  {car.description}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-200/60 py-5 mb-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Users className="text-[#003893]" size={20} />
                    <span className="text-xs text-slate-500">Max {car.passengers}</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-2 border-l border-r border-slate-200/60">
                    <Briefcase className="text-[#003893]" size={20} />
                    <span className="text-xs text-slate-500">{car.luggage} Bags</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Wifi className="text-[#003893]" size={20} />
                    <span className="text-xs text-slate-500">Free WiFi</span>
                  </div>
                </div>

                {/* Button */}
                <a
                  href="/get-started"
                  className="w-full flex items-center justify-center space-x-2 bg-[#003893] text-white hover:bg-[#002d72] px-6 py-3.5 rounded-lg transition-all font-bold tracking-wider uppercase text-xs group/btn shadow-md shadow-[#003893]/10"
                >
                  <span>Reserve Vehicle</span>
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Fleet;
