import React from 'react';
import { Users, Briefcase, Wifi, ChevronRight } from '../utils/icons';

const fleetData = [
  {
    id: 1,
    name: 'Mercedes-Benz S-Class',
    category: 'Executive Sedan',
    image: '/Mercedes-Benz S-Class.png',
    passengers: 3,
    luggage: 2,
    features: ['Free WiFi', 'Water & Mints', 'Leather Seats'],
    description: 'The pinnacle of luxury sedans. Perfect for corporate travel and airport transfers with unmatched comfort.'
  },
  {
    id: 2,
    name: 'Range Rover Autobiography',
    category: 'Luxury SUV',
    image: "/Range Rover Autobiography.png",
    passengers: 4,
    luggage: 4,
    features: ['Free WiFi', 'Panoramic Roof', 'Extra Legroom'],
    description: 'Commanding presence with exceptional space. Ideal for outstation rides and arriving in absolute style.'
  },
  {
    id: 3,
    name: 'Mercedes-Benz V-Class',
    category: 'Premium Van',
    image: '/Mercedes-Benz V-Class.png',
    passengers: 7,
    luggage: 6,
    features: ['Conference Seating', 'Privacy Glass', 'Climate Control'],
    description: 'Spacious and versatile luxury for group travel, roadshows, and family excursions without compromising on elegance.'
  }
];

const Fleet = () => {
  return (
    <section className="bg-[#060a11] py-24 relative z-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-4 animate-fade-in-up">
            <div className="w-12 h-[1px] bg-[#d4af37]"></div>
            <span className="text-[#d4af37] text-sm font-semibold tracking-[0.2em] uppercase">The Fleet</span>
            <div className="w-12 h-[1px] bg-[#d4af37]"></div>
          </div>

          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 animate-fade-in-up animation-delay-100">
            Uncompromising Luxury & Comfort
          </h2>
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fleetData.map((car, index) => (
            <div
              key={car.id}
              className="bg-[#0a0f18] border border-white/5 rounded-2xl overflow-hidden hover:border-[#d4af37]/40 transition-colors duration-300 flex flex-col shadow-xl group animate-fade-in-up"
              style={{ animationDelay: `${(index + 2) * 150}ms` }}
            >
              {/* Car Image container */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <span className="text-[#d4af37] text-xs font-semibold tracking-wider uppercase">{car.category}</span>
                </div>
              </div>

              {/* Car Details */}
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-serif text-white mb-3">{car.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                  {car.description}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-4 border-t border-b border-white/5 py-5 mb-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Users className="text-[#d4af37]" size={20} />
                    <span className="text-xs text-gray-400">Max {car.passengers}</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-2 border-l border-r border-white/5">
                    <Briefcase className="text-[#d4af37]" size={20} />
                    <span className="text-xs text-gray-400">{car.luggage} Bags</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Wifi className="text-[#d4af37]" size={20} />
                    <span className="text-xs text-gray-400">Free WiFi</span>
                  </div>
                </div>

                {/* Button */}
                <button className="w-full flex items-center justify-center space-x-2 bg-transparent border border-[#d4af37] text-[#d4af37] px-6 py-3 rounded-lg hover:bg-[#d4af37] hover:text-black transition-all font-semibold group/btn">
                  <span>Reserve Vehicle</span>
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Fleet;
