'use client';

import React, { useState } from 'react';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';
import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does SolarGrid work?',
      a: 'You purchase a solar panel plan (from $35 to $2,500). Each weekday (Monday through Friday), you log in and click "Start Panel". Your panel runs for 3 hours and produces clean energy revenue. You then collect your daily earnings in USDT directly into your balance.',
    },
    {
      q: 'When do solar panels operate?',
      a: 'Solar panels operate Monday through Friday during daytime hours. Weekends are reserved for system maintenance, so panels do not run on Saturdays or Sundays.',
    },
    {
      q: 'How long does a plan last?',
      a: 'Each plan operates for 43 working days (approximately 2 calendar months, excluding weekends). After completing 43 working days, the plan finishes its lifecycle.',
    },
    {
      q: 'How do withdrawals work and what are the fees?',
      a: 'You can withdraw your USDT balance to any USDT (TRC20) wallet address. A flat 10% network maintenance fee is deducted upon withdrawal. You will need your 6-digit Transaction PIN to confirm any withdrawal.',
    },
    {
      q: 'Can I own more than one solar panel?',
      a: 'Yes, you can own multiple panels across different tiers at the same time. Each panel tracks its own 43-day cycle and daily earnings independently.',
    },
    {
      q: 'How does the referral program work?',
      a: 'When someone signs up using your referral link, you receive ongoing community rewards from their daily generation: 5% from Level 1 (direct friends), 3% from Level 2 (friends of friends), and 2% from Level 3.',
    },
    {
      q: 'What are Points and how do they affect earnings?',
      a: 'Points represent your account health score. Every new member starts with 100 points. Maintaining 70 points or higher guarantees 100% full daily returns. You earn +2 bonus points simply by starting your panels each day.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            FAQ
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-slate-400">
            Simple answers to common questions about SolarGrid panels, daily returns, and withdrawals.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-white/[0.07] bg-[#11131C] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-amber-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04]">
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
