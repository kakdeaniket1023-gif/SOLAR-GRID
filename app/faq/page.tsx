'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { ChevronRight } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does SolarGrid generate daily energy earnings?',
      a: 'When you activate a solar plan (such as P1, P2, or P3), physical capacity is allocated to your unit. Every Monday through Friday during the configured operating window, your solar unit operates and generates daily energy credits deposited in USDT.',
    },
    {
      q: 'What are the operating days and hours?',
      a: 'SolarGrid operates on a Monday through Friday schedule during active daytime hours (typically 12:00 PM to 3:00 PM, configured by administrators). Weekends are reserved for maintenance and do not generate daily earnings.',
    },
    {
      q: 'How are gross and net earnings calculated?',
      a: 'Projected Gross Earnings = Daily Earning × Total Working Days. Estimated Net Receivable = Gross Earnings × (1 - Withdrawal Fee / 100). All values are dynamically calculated based on live database configurations.',
    },
    {
      q: 'How does the Plan Upgrade system work?',
      a: 'Upgrades use a straight price-difference model. If you hold an active unit and wish to upgrade to a higher tier plan, you pay only the difference in price between the plans.',
    },
    {
      q: 'What are the withdrawal fees and terms?',
      a: 'Withdrawals are processed in USDT. The P1 Starter Plan incurs a 10% platform maintenance fee, while P2 Growth and P3 Pro tiers feature a 20% fee. Minimum withdrawal is 10 USDT.',
    },
    {
      q: 'Can I own multiple solar units simultaneously?',
      a: 'Yes, users can deploy multiple solar units, with each unit maintaining independent working day tracking, lifecycle progress, and daily settlement logs.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-[#F8FAFC]">
      <Navigation />

      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-solar-gold/10 border border-solar-gold/30 text-solar-gold text-xs font-mono font-semibold shadow-gold-glow">
            KNOWLEDGE BASE
          </span>
          <h1 className="text-4xl font-extrabold font-display text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-slate-400">
            Everything you need to know about SolarGrid operations, working day cycles, and daily energy settlements.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="glass-1 rounded-2xl border-white/[0.08] overflow-hidden shadow-md">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-solar-gold transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-solar-gold' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/[0.06] pt-3 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
