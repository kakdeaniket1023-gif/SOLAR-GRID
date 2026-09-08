'use client';

import React, { useState } from 'react';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || 'Failed to send message. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      <main className="flex-1 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Contact Support
          </h1>
          <p className="text-sm text-slate-400">
            Have questions about your solar panels, deposits, or withdrawals? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-6">
            <h3 className="text-lg font-bold text-white">Support Channels</h3>
            
            <div className="space-y-4 text-xs text-slate-400">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-white block">Email Support</strong>
                  <span>support@solargrid.io</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-white block">Phone</strong>
                  <span>+1 (800) 555-7652</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-white block">Office</strong>
                  <span>SolarGrid Energy Operations, San Francisco, CA</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#090A0F] border border-white/[0.06] text-xs text-slate-400">
              <strong className="text-white block mb-1">Response Time:</strong>
              Average response time is under 2 hours during weekday hours (Monday through Friday, 9:00 AM – 6:00 PM UTC).
            </div>
          </div>

          {/* Form */}
          <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07]">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Message Sent</h4>
                <p className="text-xs text-slate-400">
                  Thank you! Our support team will respond to your email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-white border-white/[0.08]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-white border-white/[0.08]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Question about withdrawals or plans"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-white border-white/[0.08]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you today?"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-white border-white/[0.08]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-xs transition-colors shadow-sm"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
