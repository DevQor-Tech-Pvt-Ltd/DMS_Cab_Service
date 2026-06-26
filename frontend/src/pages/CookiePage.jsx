import React, { useEffect } from 'react';
import { Award, Compass, Shield, Clock, ArrowLeft } from '../utils/icons';
import { Link } from 'react-router-dom';

const CookiePage = () => {
  useEffect(() => {
    document.title = "Cookie Policy | DMS Cab Services Chauffeur Services";
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
              <Compass size={32} className="text-[#FFC107]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-center md:text-left">Cookie Policy</h1>
            <p className="text-slate-200 text-sm max-w-xl text-center md:text-left">
              Last Updated: May 30, 2026. This policy explains how DMS Cab Services uses cookies and storage tokens to deliver a secure and smooth platform.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center md:text-left space-y-8 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center justify-center md:justify-start space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>1. What Are Cookies and Storage Technologies?</span>
            </h2>
            <p className="text-slate-655 text-sm text-center md:text-left">
              Cookies are small text files placed on your computer or mobile device when you browse websites. In addition to standard cookies, DMS Cab Services uses browser storage mechanisms such as **sessionStorage** and **localStorage** to store session markers, user tokens, and security states directly in your web browser.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>2. Why We Use Them</span>
            </h2>
            <p className="text-slate-600 text-sm mb-2">
              We use these storage technologies to verify your identity, maintain platform stability, and secure your session against unauthorized copying. Specifically:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li><strong>Session Authentication:</strong> Storing JWT security tokens so you remain authenticated while navigating tabs or pages.</li>
              <li><strong>Multi-Tab Security Guard:</strong> We run tab-binding checks using a unique ID stored in `window.name` matched with `sessionStorage`. If a session is copied to an unauthenticated tab or duplicated window, we immediately purge the token context to prevent session hijack loops.</li>
              <li><strong>Offline Connection:</strong> Storing temporary socket and real-time state mappings to ensure stable connection with Leaflet map markers.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>3. Storage Key Elements We Manage</span>
            </h2>
            <p className="text-slate-600 text-sm">
              The following key browser storage records are maintained during your application usage:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse mt-3 min-w-[550px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">Storage Key</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-[#003893]">dms_luxe_token</td>
                    <td className="py-2.5">sessionStorage</td>
                    <td className="py-2.5">Authenticates client/chauffeur API requests. purged on deactivation or logout.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-[#003893]">dms_luxe_user</td>
                    <td className="py-2.5">sessionStorage</td>
                    <td className="py-2.5">Caches profile name, email, and role for instant frontend dashboard loads.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-[#003893]">dms_luxe_tab_id</td>
                    <td className="py-2.5">sessionStorage</td>
                    <td className="py-2.5">Unique ID matched with `window.name` to block session copying between tabs.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-[#003893]">dms_luxe_read_notifications</td>
                    <td className="py-2.5">localStorage</td>
                    <td className="py-2.5">Remembers which read alerts you have cleared to keep your notification count accurate.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>4. Third-Party Integrations</span>
            </h2>
            <p className="text-slate-600 text-sm">
              We leverage trusted third-party resources for maps and real-time sockets. These include the **Leaflet API CDN** (delivering layout assets, map tiles) and **Socket.io** web socket libraries. These services may log basic caching configurations or IP packets to stream connection updates during ride dispatching.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-[#FFC107] rounded-full inline-block"></span>
              <span>5. Managing Cookies & Local Storage</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Most web browsers automatically accept cookies and support storage interfaces. You can instruct your browser (via privacy settings) to clear active local storage keys, deny new cookies, or delete existing session markers. Note that blocking essential credentials like `dms_luxe_token` will break authentication, meaning you will not be able to log in or book chauffeur rides.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePage;
