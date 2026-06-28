import React, { useEffect } from 'react';
import { CreditCard, ArrowLeft } from '../utils/icons';
import { Link } from 'react-router-dom';

const PaymentPolicyPage = () => {
  useEffect(() => {
    document.title = "Payment Policy | DMS Cab Services Chauffeur Services";
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
        <div className="bg-[#003893] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl mb-10 text-center md:text-left flex flex-col items-center md:items-start">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 space-y-4 flex flex-col items-center md:items-start">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mx-auto md:mx-0">
              <CreditCard size={32} className="text-[#FFC107]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-center md:text-left">Payment & Billing Policy</h1>
            <p className="text-slate-200 text-sm max-w-xl text-center md:text-left">
              Last Updated: June 28, 2026. Review our secure transaction methods, fare structures, cancellation terms, and refund processing commitments.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center md:text-left space-y-8 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center justify-center md:justify-start space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>1. Secured Transaction Standards</span>
            </h2>
            <p className="text-slate-600 text-sm text-center md:text-left">
              DMS Cab Services handles payments with maximum digital security. All card, netbanking, and UPI transactions are processed through verified payment gateways (such as Razorpay). We utilize industry-standard SSL/TLS connections and military-grade AES-256 ledger encryption. No CVV code or raw credit card credentials are stored on DMS Cab Services servers.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>2. Wallet Operations & Fund Transfers</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Our digital wallet platform offers a seamless executive transport experience:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li><strong>Wallet Top-ups:</strong> Add funds directly via credit/debit card, UPI, or netbanking. Quick presets of ₹500, ₹1000, ₹2000, and ₹5000 are available for ease of use.</li>
              <li><strong>P2P Wallet Transfers:</strong> Users can transfer wallet balances instantly to any active DMS user (by specifying the registered email or phone number).</li>
              <li><strong>UPI Withdrawals:</strong> Funds can be transferred directly to your linked UPI ID. Link your UPI ID on your user dashboard to request payouts.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>3. Fare Calculations & Dynamic Pricing</span>
            </h2>
            <p className="text-slate-600 text-sm">
              All bookings are calculated using a structured, transparent formula:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li><strong>Base Rate:</strong> Standard minimum charge based on the chosen vehicle class (Premium Sedan, Executive SUV, Premium XL).</li>
              <li><strong>Distance & Duration Rates:</strong> A fixed rate per kilometer and per minute of trip duration.</li>
              <li><strong>Surcharges & High-Demand Multipliers:</strong> Fares may dynamically adjust during high-demand peak hours or severe weather alerts. Any active multiplier is displayed clearly before you book.</li>
              <li><strong>Tolls & Parking:</strong> State border taxes, airport parking fees, and road tolls incurred during active rides are added directly to the final invoice.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>4. Cancellation & Wait-Time Fees</span>
            </h2>
            <p className="text-slate-600 text-sm">
              To protect the schedules of our professional chauffeurs, we enforce the following fees:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 space-y-3">
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Free Cancellation:</strong> Bookings can be cancelled without charge before a chauffeur accepts the pickup, or within 2 minutes of chauffeur dispatch.</li>
                <li><strong>Late Cancellation Fee:</strong> Cancellations after the 2-minute grace period will trigger a nominal cancellation fee, deducted automatically from your wallet balance.</li>
                <li><strong>Chauffeur Wait Time:</strong> Once the chauffeur arrives at the requested location, the first 5 minutes of waiting are free. Beyond 5 minutes, wait-time fees accrue per minute. If the passenger fails to arrive within 10 minutes, the chauffeur may cancel, and a standard cancellation fee plus accumulated wait fees will be billed.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>5. Refunds & Dispute Resolution</span>
            </h2>
            <p className="text-slate-600 text-sm">
              If you experience a transaction failure or billing discrepancy:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li><strong>Failed Bank Deductions:</strong> If money is debited from your bank account but doesn't reflect in your DMS wallet, payment processors automatically reverse the charge within 5-7 business days.</li>
              <li><strong>Wallet Refund SLA:</strong> Authorized refunds for trip adjustments or service disputes are processed to your digital wallet instantly, or returned to the original payment source within 5-7 business days.</li>
              <li><strong>Dispute Submissions:</strong> For fare reviews, contact our billing headquarters within 48 hours of trip completion. Provide your Ride ID and transaction reference number.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>6. Cleaning & Vehicle Damage Charges</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Clients are expected to maintain cleanliness inside our executive vehicles. If a passenger causes structural damage or leaves the vehicle in a state requiring deep cleaning, a standard cleaning surcharge or repair fee will be assessed. Chauffeurs must upload photographic evidence and a cleaning receipt for review, after which the authorized amount will be debited from the passenger's wallet or registered account.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>7. Billing Contact Support</span>
            </h2>
            <p className="text-slate-600 text-sm">
              For billing questions, invoice requests, or transaction support, please reach out to our dedicated finance desk:
            </p>
            <div className="bg-slate-50 rounded-2xl p-5 text-xs text-slate-500 font-medium space-y-1">
              <p className="text-[#003893] font-bold text-sm">DMS Cab Services Finance Desk</p>
              <p>Email: contact@dmscabservices.com</p>
              <p>Phone: +91 9903941219</p>
              <p>Address: Cabin 19, 8th Floor, Delta Tower (Awfis), Sector V, Salt Lake Bypass, Bidhannagar, Kolkata, West Bengal – 700091</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PaymentPolicyPage;
