'use client';

import React from 'react';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <span className="text-xs text-amber-400 font-semibold uppercase">Legal Framework</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>
        </div>

        <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-6 text-xs text-slate-400 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">1. Solar Operations & Returns</h2>
            <p>
              SolarGrid allows members to purchase digital solar panel plans. Daily returns are generated Monday through Friday based on clean solar energy production during daytime hours.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">2. Working-Day Earning Schedule</h2>
            <p>
              Each plan operates for 43 working days (Monday through Friday). Saturdays and Sundays are reserved for system maintenance and do not generate returns.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">3. Daily Operation & Generation Hold</h2>
            <p>
              Members must start their panels each weekday. When started, each solar panel operates for a 3-hour generation cycle before earnings can be claimed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">4. Withdrawals & Standard 10% Fee</h2>
            <p>
              Withdrawals are processed in USDT (TRC20). A flat 10% maintenance fee is deducted upon withdrawal to cover blockchain transaction fees and network operations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">5. Account Security & Transaction PIN</h2>
            <p>
              Each user must set a secure 6-digit Transaction PIN. This PIN is strictly required for confirming withdrawals and updating your payout wallet address.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
