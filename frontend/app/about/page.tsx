'use client';

import React from 'react';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';
import { Sun, Shield, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      <main className="flex-1 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            Our Story
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            About SolarGrid
          </h1>
          <p className="text-sm text-slate-400">
            Making clean solar energy accessible, transparent, and rewarding for everyday people around the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Our Mission</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We connect members directly to utility-scale solar farms. By sharing the daily returns from clean energy generation, we help accelerate the transition to sustainable energy.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Transparency First</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every solar panel tracks real working days, daily generation logs, and verifiable balances. No hidden deductions or sudden fee changes.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Global Community</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              With members participating across dozens of countries, our community shares daily earnings, invites friends, and grows clean energy together.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
