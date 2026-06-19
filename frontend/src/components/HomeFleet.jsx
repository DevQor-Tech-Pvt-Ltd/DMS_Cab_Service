import React, { useRef } from 'react';
import ImageWithFallback from './ImageWithFallback';
import { ChevronLeft, ChevronRight, User } from '../utils/icons';
import { Link } from 'react-router-dom';

const homeFleetData = [
  {
    id: 1,
    name: 'MERCEDES-BENZ S-CLASS',
    image: "/Mercedes-Benz S-Class.webp",
    seats: 3
  },
  {
    id: 2,
    name: 'RANGE ROVER AUTOBIOGRAPHY',
    image: "/Range Rover Autobiography.webp",
    seats: 4
  },
  {
    id: 3,
    name: 'MERCEDES-BENZ V-CLASS',
    image: "/Mercedes-Benz V-Class.webp",
    seats: 6
  },
  {
    id: 4,
    name: 'BMW X7',
    image: "/Mercedes-Benz S-Class.webp",
    seats: 6
  },
  {
    id: 5,
    name: 'ROLLS ROYCE PHANTOM',
    image: "/Mercedes-Benz V-Class.webp",
    seats: 3
  },
  {
    id: 6,
    name: 'BENTLEY FLYING SPUR',
    image: "/Range Rover Autobiography.webp",
    seats: 3
  },
  {
    id: 7,
    name: 'CADILLAC ESCALADE',
    image: "/Mercedes-Benz V-Class.webp",
    seats: 6
  },
  {
    id: 8,
    name: 'AUDI A8 L',
    image: "/Mercedes-Benz S-Class.webp",
    seats: 3
  }
];

const HomeFleet = () => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300; // adjust based on item width
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="bg-white py-24 relative z-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-12 h-[1px] bg-[#003893]/30"></div>
              <span className="text-[#003893] text-sm font-semibold tracking-[0.2em] uppercase">Our Fleet</span>
              <div className="w-12 h-[1px] bg-[#003893]/30"></div>
            </div>
            {/* Tiny diamond */}
            <div className="w-1.5 h-1.5 rotate-45 border border-[#003893] mt-1"></div>
          </div>

          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6 tracking-wide uppercase">
            PREMIUM FLEET
          </h2>
          <p className="text-slate-650 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Experience unmatched luxury and comfort with our handpicked <br className="hidden md:block" /> collection of premium vehicles.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative mt-16 mb-12">
          {/* Main Border Box */}
          <div className="border border-slate-200 rounded-3xl py-12 px-4 md:px-12 relative shadow-sm bg-slate-50/50">

            {/* Navigation Arrows */}
            <button
              onClick={() => scroll('left')}
              className="hidden md:block absolute left-0 md:-left-5 top-1/2 -translate-y-1/2 text-[#003893] hover:text-[#002d72] transition-colors bg-white border border-slate-200 rounded-full p-2.5 z-10 shadow-md"
              aria-label="Previous fleet item"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:block absolute right-0 md:-right-5 top-1/2 -translate-y-1/2 text-[#003893] hover:text-[#002d72] transition-colors bg-white border border-slate-200 rounded-full p-2.5 z-10 shadow-md"
              aria-label="Next fleet item"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>

            {/* Cars Horizontal Scroll (Carousel) */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-8 md:gap-6 pb-6 pt-4 px-2 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {homeFleetData.map((car) => (
                <div
                  key={car.id}
                  className="flex-shrink-0 w-64 md:w-60 lg:w-64 flex flex-col items-center text-center group snap-center"
                >
                  {/* Circular Image */}
                  <div className="w-56 h-56 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full border-[1.5px] border-[#003893]/30 p-1 mb-8 relative overflow-hidden transition-all duration-500 group-hover:border-[#003893] group-hover:shadow-[0_0_20px_rgba(0,56,147,0.1)] bg-white">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                      <ImageWithFallback
                        src={car.image}
                        alt={car.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </div>

                  {/* Car Name */}
                  <h3 className="text-slate-900 font-serif text-base md:text-lg tracking-wide max-w-[240px] leading-snug h-12 flex items-center justify-center">
                    {car.name}
                  </h3>

                  {/* Faded Divider */}
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#003893]/20 to-transparent my-4"></div>

                  {/* Seats Info */}
                  <div className="flex items-center space-x-2 text-slate-500">
                    <User size={16} className="text-[#003893]" />
                    <span className="text-sm">{car.seats} Seats</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All Vehicles Button */}
        <div className="text-center mt-12">
          <Link to="/fleet" className="inline-flex items-center space-x-3 border-2 border-[#003893] text-[#003893] px-8 py-3 rounded hover:bg-[#003893] hover:text-white transition-all duration-300 font-bold tracking-widest text-sm uppercase group">
            <span>View All Vehicles</span>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HomeFleet;
