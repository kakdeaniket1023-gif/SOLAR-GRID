'use client';

import React from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-[#F8FAFC]">
      <Navigation />

      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-mono text-solar-gold font-semibold uppercase">Data Protection</span>
          <h1 className="text-3xl font-extrabold text-white font-display">Privacy Policy</h1>
          <p className="text-xs text-slate-400">Last updated: August 2026</p>
        </div>

        <div className="glass-1 p-8 rounded-3xl border-white/[0.08] space-y-6 text-xs text-slate-400 leading-relaxed shadow-xl">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono text-solar-gold">1. Information We Collect</h2>
            <p>
              We collect user account information (name, email, referral sponsor affiliation, preferred wallet payout addresses) solely for managing clean-energy telemetry, referral attribution, and ledger settlement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono text-solar-gold">2. Cryptographic Security</h2>
            <p>
              All sensitive credentials, session tokens, and payout addresses are protected with industry-standard encryption. We do not sell or share private member data with third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono text-solar-gold">3. On-Chain Transparency</h2>
            <p>
              USDT withdrawal disbursements are broadcast to public blockchains (TRC20, ERC20, BEP20) and recorded with immutable transaction hashes for complete auditability.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
