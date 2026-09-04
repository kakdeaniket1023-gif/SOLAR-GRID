'use client';

import React from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { Sun, Shield, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-[#F8FAFC]">
      <Navigation />

      <main className="flex-1 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-solar-gold/10 border border-solar-gold/30 text-solar-gold text-xs font-mono font-semibold shadow-gold-glow">
            ABOUT SOLARGRID
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white">
            Digital Solar Infrastructure
          </h1>
          <p className="text-base text-slate-400">
            Bridging institutional renewable energy generation with decentralized community incentives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-1 p-8 rounded-3xl border-white/[0.08] space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-solar-gold/10 border border-solar-gold/30 flex items-center justify-center text-solar-gold shadow-gold-glow">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Our Mission</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accelerating global transition to 100% renewable power by democratizing access to institutional photovoltaic infrastructure and telemetry.
            </p>
          </div>

          <div className="glass-1 p-8 rounded-3xl border-white/[0.08] space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-solar-amber/10 border border-solar-amber/30 flex items-center justify-center text-solar-amber shadow-amber-glow">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Our Values</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Total ledger transparency, verified daily physical generation, zero hidden maintenance deductions, and institutional security standards.
            </p>
          </div>

          <div className="glass-1 p-8 rounded-3xl border-white/[0.08] space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-solar-blue/10 border border-solar-blue/30 flex items-center justify-center text-solar-blue shadow-blue-glow">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Global Reach</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Managing 286+ MW of active solar arrays across North America, Latin America, and Europe with contributors from over 45 countries.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
