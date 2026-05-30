import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { api } from './services/authService';

// Scroll to top on page change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};


// Lazy load pages for premium performance and code-splitting
const Home = lazy(() => import('./pages/Home'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const FleetPage = lazy(() => import('./pages/FleetPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const GetStartedPage = lazy(() => import('./pages/GetStartedPage'));
const LearnMorePage = lazy(() => import('./pages/LearnMorePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CookiePage = lazy(() => import('./pages/CookiePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Premium DMS Cab Servicese Micro-Loader shown while dynamic page chunks are fetched
const PageLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-10 h-10 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto"></div>
      <p className="text-[#003893] font-serif text-xs tracking-widest uppercase animate-pulse">Initializing DMS Cab Services...</p>
    </div>
  </div>
);

const AppContent = () => {
  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-[#f2b705] selection:text-[#003893] flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/fleet" element={<FleetPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/learn-more" element={<LearnMorePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiePage />} />
            {/* Security/Catch-all Route for any undefined paths */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  useEffect(() => {
    // Wake up the Render backend container in the background as soon as user lands
    api.get('/').catch((err) => console.log('Backend wake-up ping:', err.message));
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
