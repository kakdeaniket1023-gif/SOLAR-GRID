'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '@/components/glass';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;
    setLoading(true);

    try {
      // Dispatch public inquiry
      await new Promise((r) => setTimeout(r, 600));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-[#F8FAFC]">
      <Navigation />

      <main className="flex-1 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-solar-gold/10 border border-solar-gold/30 text-solar-gold text-xs font-mono font-semibold shadow-gold-glow">
            GLOBAL OPERATIONS DESK
          </span>
          <h1 className="text-4xl font-extrabold font-display text-white">
            Contact SolarGrid
          </h1>
          <p className="text-sm text-slate-400">
            Have questions about enterprise solar capacity allocation, leadership hub hosting, or technical support?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="glass-1 p-8 rounded-3xl border-white/[0.08] space-y-6 shadow-xl">
            <h3 className="text-xl font-bold text-white">Operations Headquarters</h3>
            
            <div className="space-y-4 text-xs text-slate-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-solar-gold mt-0.5" />
                <span>SolarGrid Global Energy Complex, 100 Innovation Parkway, San Francisco, CA 94107</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-solar-gold" />
                <span>support@solargrid.io</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-solar-blue" />
                <span>+1 (800) 555-SOLAR</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#050B18]/70 border border-white/[0.06] text-xs text-slate-400">
              <strong className="text-white block mb-1">Support Response Time:</strong>
              Average ticket turnaround: &lt; 2 hours for active members and instant priority routing for Energy Coordinators & Leaders.
            </div>
          </div>

          {/* Form */}
          <div className="glass-1 p-8 rounded-3xl border-white/[0.08] shadow-xl">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-solar-gold mx-auto" />
                <h4 className="text-lg font-bold text-white">Message Dispatched</h4>
                <p className="text-xs text-slate-400">
                  Our grid operations team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
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
                    placeholder="e.g. name@company.com"
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
                    placeholder="e.g. Institutional Solar Capacity Inquiry"
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
                    placeholder="How can we assist you?"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-white border-white/[0.08]"
                  />
                </div>
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  className="w-full font-bold text-[#050B18] shadow-gold-glow"
                >
                  Dispatch Inquiry
                </GlassButton>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
