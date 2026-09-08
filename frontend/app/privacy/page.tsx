'use client';

import React from 'react';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <span className="text-xs text-amber-400 font-semibold uppercase">Data Protection</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>
        </div>

        <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-6 text-xs text-slate-400 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect your name, email address, password hash, and optional USDT payout wallet address solely for managing your account, daily generation returns, and withdrawal payouts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">2. Account Security</h2>
            <p>
              Your passwords and 6-digit transaction PINs are stored securely using industry-standard bcrypt hashing. We never store plaintext passwords or share private user details with third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">3. Payouts & Blockchain Records</h2>
            <p>
              USDT withdrawal transfers are broadcast to public blockchains (such as TRON / TRC20) and recorded with transaction hashes for verifiable delivery to your wallet.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
