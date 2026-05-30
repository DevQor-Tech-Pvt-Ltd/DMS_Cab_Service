import React from 'react';
import { ChevronRight, ShieldCheck, UserCheck, Star, Map } from '../utils/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LearnMorePage = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'driver') return '/driver/dashboard';
    return '/client/dashboard';
  };

  const shouldShowBooking = () => {
    return !user || user.role === 'client';
  };

  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-4 animate-fade-in-up">
            <div className="w-12 h-[1px] bg-[#003893]/30"></div>
            <span className="text-[#003893] text-sm font-semibold tracking-[0.2em] uppercase">How It Works</span>
            <div className="w-12 h-[1px] bg-[#003893]/30"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6 animate-fade-in-up animation-delay-100">
            The DMS Experience
          </h1>
          <p className="text-slate-650 text-lg leading-relaxed max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            From the moment you book until you reach your destination, every detail is meticulously orchestrated to ensure absolute perfection.
          </p>
        </div>

        {/* Process Steps */}
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-[#003893]/30 hover:shadow-md transition-all animate-fade-in-up animation-delay-300">
            <div className="w-16 h-16 rounded-full bg-[#003893]/10 flex items-center justify-center flex-shrink-0 text-[#003893] border border-[#003893]/20">
              <Map size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-serif text-slate-900 mb-2">1. Request Your Journey</h3>
              <p className="text-slate-600 leading-relaxed">
                Use our secure online platform or contact our 24/7 concierge to outline your itinerary. Select from our premium fleet of vehicles tailored to your specific group size and luggage requirements.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-[#003893]/30 hover:shadow-md transition-all animate-fade-in-up animation-delay-400">
            <div className="w-16 h-16 rounded-full bg-[#003893]/10 flex items-center justify-center flex-shrink-0 text-[#003893] border border-[#003893]/20">
              <UserCheck size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-serif text-slate-900 mb-2">2. Chauffeur Assignment</h3>
              <p className="text-slate-600 leading-relaxed">
                A dedicated, extensively trained professional chauffeur is assigned to your ride. You will receive their contact details and vehicle tracking information well in advance of your pickup.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-[#003893]/30 hover:shadow-md transition-all animate-fade-in-up animation-delay-500">
            <div className="w-16 h-16 rounded-full bg-[#003893]/10 flex items-center justify-center flex-shrink-0 text-[#003893] border border-[#003893]/20">
              <Star size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-serif text-slate-900 mb-2">3. The Premium Ride</h3>
              <p className="text-slate-600 leading-relaxed">
                Your chauffeur arrives 15 minutes early. Enjoy complimentary Wi-Fi, premium refreshments, and complete privacy as you are driven to your destination safely and punctually.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 animate-fade-in animation-delay-500">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-slate-900 mb-4">Frequently Asked Questions</h2>
            <div className="w-16 h-[2px] bg-[#003893] mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-slate-900 font-semibold mb-2">How far in advance should I book?</h4>
              <p className="text-slate-600 text-sm">We recommend booking at least 12 hours in advance to guarantee your preferred vehicle. For major events or holidays, earlier booking is advised.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-slate-900 font-semibold mb-2">Are your chauffeurs vetted?</h4>
              <p className="text-slate-600 text-sm">Absolutely. Every DMS chauffeur undergoes rigorous background checks, advanced defensive driving courses, and continuous professional etiquette training.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center animate-fade-in animation-delay-500">
          {shouldShowBooking() ? (
            <Link to="/get-started" className="inline-flex items-center space-x-2 bg-[#f2b705] text-[#003893] px-8 py-4 rounded-lg hover:bg-[#e5ad04] transition-colors font-extrabold shadow-md">
              <span>Ready to Book? Get Started</span>
              <ChevronRight size={18} />
            </Link>
          ) : (
            <Link to={getDashboardPath()} className="inline-flex items-center space-x-2 bg-[#f2b705] text-[#003893] px-8 py-4 rounded-lg hover:bg-[#e5ad04] transition-colors font-extrabold shadow-md">
              <span>Go to Command Center</span>
              <ChevronRight size={18} />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};

export default LearnMorePage;
