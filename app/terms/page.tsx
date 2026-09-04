'use client';

import React from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-[#F8FAFC]">
      <Navigation />

      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-mono text-solar-gold font-semibold uppercase">Legal Framework</span>
          <h1 className="text-3xl font-extrabold text-white font-display">Terms of Infrastructure Allocation</h1>
          <p className="text-xs text-slate-400">Last updated: August 2026</p>
        </div>

        <div className="glass-1 p-8 rounded-3xl border-white/[0.08] space-y-6 text-xs text-slate-400 leading-relaxed shadow-xl">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono text-solar-gold">1. Platform Nature</h2>
            <p>
              SolarGrid facilitates distributed contributor allocation of operational photovoltaic capacity. Yield calculations adhere to actual measured solar irradiation factors, working-day schedules (Monday through Friday), and contributor point scores.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono text-solar-gold">2. Working-Day Earning Schedule</h2>
            <p>
              Each plan carries a 60 calendar-day validity cycle with ~43 active Monday–Friday earning days. Saturday and Sunday generation cycles are reserved for system maintenance and grid telemetry calibration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono text-solar-gold">3. Upgrades & Top-Ups</h2>
            <p>
              Plan upgrades operate strictly on a price-difference top-up model (P1 to P2 top-up $30, P2 to P3 top-up $100). Upgrades adjust unit capacity and daily generation rates immediately upon atomic ledger execution.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono text-solar-gold">4. Withdrawals & Sustainability Fees</h2>
            <p>
              Withdrawals are settled in USDT. P1 Starter plans incur a 10% withdrawal fee. P2 Growth and P3 Pro plans incur a 20% infrastructure maintenance and network sustainability fee as configured in platform business rules.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
