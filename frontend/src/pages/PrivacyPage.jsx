import React, { useEffect } from 'react';
import { Shield, Eye, Lock, FileText, ArrowLeft } from '../utils/icons';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | DMS Cab Services Chauffeur Services";
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
              <Shield size={32} className="text-[#FFC107]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-center md:text-left">Privacy Policy</h1>
            <p className="text-slate-200 text-sm max-w-xl text-center md:text-left">
              Last Updated: May 30, 2026. Your privacy and trust are paramount. Learn how DMS Cab Services protects, processes, and respects your personal data.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center md:text-left space-y-8 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center justify-center md:justify-start space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>1. Introduction</span>
            </h2>
            <p className="text-slate-655 text-sm text-center md:text-left">
              Welcome to DMS Cab Services ("we," "us," "our"). We provide elite executive chauffeur services. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our mobile-responsive web applications, websites, and associated transportation services. By accessing our platform, you consent to the data practices described in this policy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>2. Information We Collect</span>
            </h2>
            <p className="text-slate-600 text-sm mb-2">
              To deliver a premium executive transport experience, we collect information that falls into the following categories:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li><strong>Account Credentials:</strong> Full name, email address, phone number, and password hashes created during registration.</li>
              <li><strong>Chauffeur Verification:</strong> For driver accounts, we collect and store vehicle models, license plate numbers, commercial driving licenses, and registration certificates (RC) for verification.</li>
              <li><strong>Real-time Geolocation Data:</strong> During active rides, we track coordinates of the vehicle and device to display live route routing on maps for passengers and chauffeurs.</li>
              <li><strong>Financial Logs:</strong> Wallet balances, linked UPI handles, and payment transaction references. We do not store raw credit card numbers or security CVV codes.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>3. How We Use Your Data</span>
            </h2>
            <p className="text-slate-600 text-sm">
              We process your data strictly to execute our services, maintain security, and optimize performance:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>Matching clients with verified executive chauffeurs.</li>
              <li>Verifying Secure OTP codes to authorize and initiate the journey.</li>
              <li>Processing wallet updates and delivering electronic invoice receipts.</li>
              <li>Preventing unauthorized sessions by checking unique browser tab identities.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>4. Data Retention & Soft Deactivation</span>
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 space-y-3">
              <p className="font-semibold text-slate-800">Account Deletion Policy (Uber & Ola Standards):</p>
              <p>
                When you initiate a **"Delete My Account"** request, DMS Cab Services does not instantly scrub all audit logs from the database. To comply with legal tax reporting, transaction auditing, and dispute resolution guidelines:
              </p>
              <ul className="list-decimal pl-5 space-y-1.5 mt-2">
                <li>Your profile is instantly set to inactive, blocking all logins and API authorization requests.</li>
                <li>Your email and phone number are anonymized (e.g. `deactivated_17829283_user@domain.com`) to disconnect your identity while releasing the original credentials for any future registrations.</li>
                <li>Historical ride records, fares, and transaction receipts are securely locked and retained in our audit log database for standard compliance timeframes.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>5. Data Protection Rights</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Depending on your location, you may have rights under local privacy laws (e.g., GDPR, CCPA) regarding your data. These include the right to access, rectify, or request a summary of the personal information stored in our database, or limit how we use it. Contact our privacy officer at the details below to submit a inquiry.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>6. Contact Information</span>
            </h2>
            <p className="text-slate-600 text-sm">
              For any questions regarding this policy or our data safety procedures, reach out to our team at:
            </p>
            <div className="bg-slate-50 rounded-2xl p-5 text-xs text-slate-500 font-medium space-y-1">
              <p className="text-[#003893] font-bold text-sm">DMS Cab Services Corporate HQ</p>
              <p>Email: contact@dmscabservices.com</p>
              <p>Phone: +91 9903941219</p>
              <p>Address: Cabin 19, 8th Floor, Delta Tower (Awfis), Sector V, Bidhannagar, Kolkata, West Bengal – 700091</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
