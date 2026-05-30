import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2 } from '../utils/icons';
import { submitContactInquiry } from '../services/authService';

const ContactPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await submitContactInquiry(formData);
      setIsSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      console.error('Contact inquiry submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 z-0 opacity-10">
          <img
            src="/map-bg.png"
            alt="Contact DMS"
            className="w-full h-full object-cover filter invert"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 mb-4 animate-fade-in-up">
            <div className="w-8 h-[1px] bg-[#003893]"></div>
            <span className="text-[#003893] text-sm font-semibold tracking-[0.2em] uppercase">Get In Touch</span>
            <div className="w-8 h-[1px] bg-[#003893]"></div>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif text-slate-900 mb-6 animate-fade-in-up animation-delay-100">
            Contact <span className="text-[#003893] italic">DMS</span>
          </h1>

          <p className="text-slate-600 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Our dedicated concierge team is available 24/7 to assist with your reservations, special requests, and general inquiries.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-24 relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">

            {/* Left Column: Contact Info */}
            <div className="w-full lg:w-5/12 animate-fade-in-up animation-delay-100">
              <h2 className="text-3xl font-serif text-slate-900 mb-8">Reach Our Concierge</h2>
              <p className="text-slate-600 mb-12 leading-relaxed">
                Whether you require an immediate airport transfer, a dedicated chauffeur for the day, or have questions about a corporate account, we are at your service.
              </p>

              <div className="space-y-8">
                {/* Contact Item */}
                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 rounded-full bg-[#003893]/10 flex items-center justify-center flex-shrink-0 border border-[#003893]/20">
                    <Phone className="text-[#003893]" size={20} />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-serif text-lg mb-1">Direct Line</h4>
                    <p className="text-slate-600 mb-1">+91 7439885351</p>
                    <p className="text-[#003893] text-sm font-semibold">Available 24/7</p>
                  </div>
                </div>

                {/* Contact Item */}
                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 rounded-full bg-[#003893]/10 flex items-center justify-center flex-shrink-0 border border-[#003893]/20">
                    <Mail className="text-[#003893]" size={20} />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-serif text-lg mb-1">Email Reservations</h4>
                    <p className="text-slate-600 mb-1">pritam.mondal@devqor.in</p>
                    <p className="text-slate-500 text-sm">Typical response within 15 minutes</p>
                  </div>
                </div>

                {/* Contact Item */}
                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 rounded-full bg-[#003893]/10 flex items-center justify-center flex-shrink-0 border border-[#003893]/20">
                    <MapPin className="text-[#003893]" size={20} />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-serif text-lg mb-1">Global Headquarters</h4>
                    <p className="text-slate-600 mb-1">Cabin 19, 8th Floor, Delta Tower (Awfis) Cabin1Sector V, Salt Lake Bypass<br />Bidhannagar Kolkata, West Bengal – 700091</p>
                  </div>
                </div>

                {/* Contact Item */}
                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 rounded-full bg-[#003893]/10 flex items-center justify-center flex-shrink-0 border border-[#003893]/20">
                    <Clock className="text-[#003893]" size={20} />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-serif text-lg mb-1">Operating Hours</h4>
                    <p className="text-slate-600">Chauffeur Services: 24/7<br />Office: 8:00 AM - 8:00 PM (EST)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="w-full lg:w-7/12 animate-fade-in-up animation-delay-200">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-lg relative overflow-hidden">

                {/* Success Overlay */}
                {isSubmitted && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 animate-fade-in">
                    <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
                    <h3 className="text-2xl font-serif text-slate-900 mb-2">Message Sent</h3>
                    <p className="text-slate-600 text-center max-w-xs">Thank you for reaching out. Our concierge team will contact you shortly.</p>
                  </div>
                )}
                
                <h3 className="text-2xl font-serif text-slate-900 mb-8">Send an Inquiry</h3>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2 font-medium">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003893] focus:ring-1 focus:ring-[#003893] transition-colors"
                        placeholder="Enter Your First Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-2 font-medium">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003893] focus:ring-1 focus:ring-[#003893] transition-colors"
                        placeholder="Enter Your Last Name"
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2 font-medium">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003893] focus:ring-1 focus:ring-[#003893] transition-colors"
                        placeholder="Enter Your Email Address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-2 font-medium">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003893] focus:ring-1 focus:ring-[#003893] transition-colors"
                        placeholder="+91 000-000-0000"
                      />
                    </div>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <label className="block text-sm text-slate-600 mb-2 font-medium">Subject / Service of Interest</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003893] focus:ring-1 focus:ring-[#003893] transition-colors appearance-none"
                    >
                      <option value="">Select a subject...</option>
                      <option value="airport">Airport Transfer</option>
                      <option value="corporate">Corporate Account</option>
                      <option value="hourly">Hourly Charter</option>
                      <option value="event">Special Event</option>
                      <option value="other">General Inquiry</option>
                    </select>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-sm text-slate-600 mb-2 font-medium">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003893] focus:ring-1 focus:ring-[#003893] transition-colors resize-none"
                      placeholder="How can we assist you?"
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f2b705] text-[#003893] disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#e5ad04] transition-colors shadow-md shadow-[#f2b705]/10"
                  >
                    <span>{loading ? 'Sending Message...' : 'Send Message'}</span>
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>

              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
