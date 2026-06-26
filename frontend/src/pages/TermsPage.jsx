import React, { useEffect } from 'react';
import { FileText, Award, CalendarCheck, ShieldAlert, ArrowLeft } from '../utils/icons';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  useEffect(() => {
    document.title = "Terms of Service | DMS Cab Services Chauffeur Services";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-28 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#003893] hover:text-[#002d72] mb-8 transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        {/* Page Header */}
        <div className="bg-[#003893] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl mb-10 text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl">
              <FileText size={32} className="text-[#FFC107]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold">Terms of Service</h1>
            <p className="text-slate-200 text-sm max-w-xl">
              Last Updated: May 30, 2026. Please read these terms carefully before scheduling our premium transportation services.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-left space-y-8 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>1. Acceptance of Terms</span>
            </h2>
            <p className="text-slate-600 text-sm">
              These Terms of Service constitute a legally binding agreement between you and DMS Cab Services regarding your access and use of our web booking application, dispatch platform, and premium chauffeur service networks. By registering an account, booking a ride, or operating as a chauffeur on our platform, you agree to be bound by these terms. If you do not agree, you are prohibited from utilizing our service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>2. Account Eligibility & Verification</span>
            </h2>
            <p className="text-slate-600 text-sm">
              To book transportation or list yourself as a chauffeur:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>You must be at least 18 years of age and hold legal capacity to enter binding contracts.</li>
              <li>Chauffeurs must possess valid commercial driving licenses, clean records, and hold all necessary vehicle clearances (RC, commercial permits) verified by our administration prior to dispatch.</li>
              <li>You agree to provide true, accurate, and current profile information. Accounts with fraudulent detail sets will be flagged and terminated immediately.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>3. Booking & Fare Structures</span>
            </h2>
            <p className="text-slate-600 text-sm">
              All bookings are dispatched based on vehicle class (Premium Sedan, Executive SUV, Premium XL) and distance:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>Fares are calculated dynamically based on base rates, distance, peak surcharge hours, and taxes. Estimated fares are presented prior to matching.</li>
              <li>Once matched, the fare is frozen, excluding unexpected route modifications.</li>
              <li>Payments are settled immediately upon ride completion via pre-loaded wallet balances or linked payment routes. Invoices are dispatched to your registered email automatically.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>4. Cancellations & Wait Times</span>
            </h2>
            <p className="text-slate-600 text-sm">
              To protect the schedules of our professional chauffeurs, the following cancellation policy is enforced:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>Clients can cancel bookings without charge before a driver accepts the pickup or within 2 minutes of chauffeur dispatch.</li>
              <li>Cancellations after this grace period will trigger a nominal cancellation fee deducted from the client's wallet.</li>
              <li>If the chauffeur arrives at the pickup spot and the client fails to arrive within 10 minutes, the chauffeur may cancel the pickup, and a standard wait-fee will be charged to the client.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>5. Passenger Code of Conduct</span>
            </h2>
            <p className="text-slate-600 text-sm">
              DMS Cab Services maintains a zero-tolerance policy for abuse, harassment, or damage:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>Passengers must treat chauffeurs and vehicles with complete respect.</li>
              <li>Smoking, illegal substances, and hazardous items are strictly prohibited inside the executive vehicles.</li>
              <li>Clients are fully responsible for any cleaning fees or structural damage caused to the vehicle during their trip, which will be billed to their wallet or account.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>6. Account Termination & Self-Deactivation</span>
            </h2>
            <p className="text-slate-600 text-sm">
              We reserve the right to suspend or terminate accounts that breach these terms. In addition, you have the right to request account deactivation at any time. As outlined in our Privacy Policy, deactivating your account (via the "Delete My Account" option) will instantly block account access and anonymize your credentials, but financial transaction records and ride logs will be kept in our archive for audit purposes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
