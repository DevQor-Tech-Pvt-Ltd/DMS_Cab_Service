import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plane,
  Clock,
  Briefcase,
  CalendarDays,
  Building,
  Gem,
  Users,
  ShieldCheck,
  ArrowRight,
  Phone,
  X
} from '../utils/icons';

const services = [
  {
    title: 'Airport Transfers',
    description: 'Reliable and punctual airport transfers with meet & greet service for a seamless travel experience.',
    extendedDescription: 'Experience stress-free airport transit with real-time flight tracking and a dedicated professional chauffeur awaiting your arrival.',
    features: [
      'Real-time flight arrival monitoring and adjustment',
      '60 minutes complimentary terminal waiting time',
      'Meet & Greet service with customized paging board',
      'Luggage handling and vehicle loading assistance'
    ],
    icon: Plane
  },
  {
    title: 'Hourly Chauffeur',
    description: 'Book by the hour and enjoy the flexibility to travel at your own pace with a dedicated chauffeur.',
    extendedDescription: 'Enjoy total itinerary flexibility with a dedicated professional chauffeur at your disposal for unlimited stops and destinations.',
    features: [
      'Flexible scheduling with unlimited stopovers',
      'Vetted, highly-trained local professional chauffeurs',
      'Real-time route optimization and updates',
      'Premium refreshments and device chargers on board'
    ],
    icon: Clock
  },
  {
    title: 'Corporate Travel',
    description: 'Professional ground transportation for business meetings, roadshows and corporate events.',
    extendedDescription: 'Reliable and confidential ground transportation solutions tailored for executives, roadshows, and business delegations.',
    features: [
      'Strict confidentiality and non-disclosure compliance',
      'High-speed Wi-Fi and mobile office connectivity',
      'Priority scheduling and premium fleet access',
      'Monthly consolidated corporate billing options'
    ],
    icon: Briefcase
  },
  {
    title: 'Outstation Rides',
    description: 'Comfortable and safe intercity travel with luxury vehicles and experienced chauffeurs.',
    extendedDescription: 'Travel comfortably and safely between cities in luxury sedans and premium SUVs with experienced long-distance chauffeurs.',
    features: [
      'Toll and state highway permit management included',
      'Experienced dual drivers for long-distance safety',
      'Door-to-door intercity navigation and transit',
      'Real-time GPS tracking for passenger safety'
    ],
    icon: CalendarDays
  },
  {
    title: 'Hotel Transfers',
    description: 'Luxury transfers to and from hotels with a focus on comfort, discretion and reliability.',
    extendedDescription: 'Flawless door-to-door transfers connecting airports, stations, and major luxury hotels with unmatched punctuality.',
    features: [
      'Direct synchronization with hotel concierge desks',
      'Luggage boarding and front-lobby assistance',
      'Flexible check-in / check-out scheduling',
      'Discreet and private passenger handling'
    ],
    icon: Building
  },
  {
    title: 'Special Occasions',
    description: 'Weddings, anniversaries or any special event – we make every moment extraordinary.',
    extendedDescription: 'Celebrate weddings, anniversaries, and red-carpet galas with specialized luxury vehicles and premium driving service.',
    features: [
      'Complimentary vehicle floral decor option',
      'Red carpet passenger entry and exit protocol',
      'Chauffeur dress-code matching (tuxedo/suit)',
      'Pre-planned photoshoot stops and event coordination'
    ],
    icon: Gem
  },
  {
    title: 'Group Travel',
    description: 'Spacious luxury vehicles for group travel with exceptional comfort and convenience.',
    extendedDescription: 'Spacious multi-passenger luxury vans and SUVs designed to provide the ultimate comfort and convenience for groups.',
    features: [
      'Mercedes-Benz Sprinter and luxury MPV options',
      'Multi-zone individual climate controls',
      'Spacious storage bays for oversized luggage',
      'Centralized group travel manager booking'
    ],
    icon: Users
  },
  {
    title: 'VIP Protection',
    description: 'Discreet and professional protection for VIPs, dignitaries and high-profile individuals.',
    extendedDescription: 'Discreet personal security escort and armored transport solutions for high-profile figures, diplomats, and executives.',
    features: [
      'Highly trained close protection security drivers',
      'Pre-route reconnaissance and planning',
      'Discreet close escort security personnel options',
      'Premium armored vehicle options available'
    ],
    icon: ShieldCheck
  }
];

const Services = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [visibleCount, setVisibleCount] = useState(2);

  return (
    <section className="bg-white py-24 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16">
          <h4 className="text-[#003893] text-sm font-bold tracking-widest uppercase mb-4">
            What We Offer
          </h4>
          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6">
            Exceptional Services For Every Occasion
          </h2>

          {/* Decorative Divider */}
          <div className="flex items-center justify-center space-x-2">
            <div className="h-[1px] w-12 bg-[#003893]/30"></div>
            <div className="w-2 h-2 rotate-45 border border-[#003893]"></div>
            <div className="h-[1px] w-12 bg-[#003893]/30"></div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => (
            <div
              key={index}
              className={`${index >= visibleCount ? 'hidden lg:block' : 'block'
                } bg-slate-50 border border-slate-200/60 rounded-2xl p-8 text-center hover:border-[#003893]/40 hover:bg-slate-100/50 hover:shadow-md transition-all duration-300 group transform hover:-translate-y-1`}
            >
              <div className="w-16 h-16 mx-auto rounded-full border border-[#003893]/30 flex items-center justify-center mb-6 group-hover:bg-[#003893]/10 transition-colors">
                <service.icon className="text-[#003893]" size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-serif text-slate-900 mb-4">{service.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 font-light">
                {service.description}
              </p>
              <button
                onClick={() => setSelectedService(service)}
                className="text-[#003893] hover:text-[#002d72] text-sm font-semibold flex items-center justify-center mx-auto space-x-2 group/btn cursor-pointer"
              >
                <span>Learn More</span>
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        {/* Show More Button */}
        {visibleCount < services.length && (
          <div className="flex justify-center mb-20 lg:hidden">
            <button
              onClick={() => setVisibleCount(prev => prev + 2)}
              className="px-8 py-3.5 border border-[#003893] text-[#003893] hover:bg-[#003893] hover:text-white rounded-lg transition-all duration-300 font-semibold flex items-center space-x-2 cursor-pointer group"
            >
              <span>Show More Services</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-lg">
          {/* Image Side */}
          <div className="md:w-5/12 h-64 md:h-auto relative">
            <img
              src="/car-homeContact.avif"
              alt="Luxury Car Interior"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Gradient Overlay for blending */}
            {/* <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-slate-50 to-transparent"></div> */}
          </div>

          {/* Content Side */}
          <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
            <h3 className="text-3xl font-serif text-[#003893] mb-4">
              Ready To Experience Luxury?
            </h3>
            <p className="text-slate-650 mb-8 max-w-xl text-sm md:text-base font-light">
              Book your premium chauffeur service today and travel in comfort, style and complete peace of mind.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <a
                href="/get-started"
                className="bg-[#f2b705] text-[#003893] hover:bg-[#e5ad04] px-8 py-3.5 rounded-lg transition-colors font-extrabold flex items-center justify-center space-x-2 w-full sm:w-auto shadow-md"
              >
                <span>Book Your Ride Now</span>
                <ArrowRight size={18} />
              </a>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full border border-[#003893]/30 flex items-center justify-center">
                  <Phone className="text-[#003893]" size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Call Us Anytime</div>
                  <div className="text-slate-900 font-semibold">+91 7439885351</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Service Detail Modal */}
      {selectedService && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="absolute inset-0 cursor-default" onClick={() => setSelectedService(null)}></div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative z-10 animate-scaleUp max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 translate-y-6 md:translate-y-8">
            {/* Close Button */}
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-slate-100 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Icon & Title */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-full border border-[#003893]/30 flex items-center justify-center bg-[#003893]/5 shrink-0">
                <selectedService.icon className="text-[#003893]" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-slate-900">{selectedService.title}</h3>
                <span className="text-xs text-[#003893] tracking-wider uppercase font-semibold">Premium Inclusion</span>
              </div>
            </div>

            {/* Detailed Description / Inclusions */}
            <div className="space-y-4 text-slate-700 text-sm mb-8 leading-relaxed">
              <p className="font-light">{selectedService.extendedDescription}</p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4">
                <h4 className="text-xs font-semibold uppercase text-[#003893] tracking-wider mb-3">Key Features:</h4>
                <ul className="space-y-2.5 text-xs text-slate-650">
                  {selectedService.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f2b705] shrink-0"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedService(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-750 font-medium py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
              <a
                href="/get-started"
                className="flex-1 bg-[#f2b705] text-[#003893] hover:bg-[#e5ad04] font-semibold py-2.5 rounded-lg text-sm text-center transition-colors shadow-md flex items-center justify-center"
              >
                Book Service
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Services;
