'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navigation } from '@/components/ui/navigation';
import { SolarPlan } from '@/types';
import {
  Sun,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/glass';

export default function HomePage() {
  const [plans, setPlans] = useState<SolarPlan[]>([]);

  useEffect(() => {
    fetch('/api/solar/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.plans) {
          setPlans(data.plans.filter((p: SolarPlan) => p.status === 'ACTIVE'));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-[#F8FAFC]">
      <Navigation />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-24 overflow-hidden solar-grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-solar-gold/10 border border-solar-gold/30 text-solar-gold text-xs font-mono font-semibold shadow-gold-glow">
                <span className="w-2 h-2 rounded-full bg-solar-gold animate-ping" />
                DIGITAL PHOTOVOLTAIC INFRASTRUCTURE
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
                Empowering Clean Energy Through{' '}
                <span className="bg-gradient-to-r from-solar-gold via-solar-amber to-amber-300 bg-clip-text text-transparent text-glow-gold">
                  Solar Technology.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-sans">
                Participate in utility-grade digital solar capacity. Activate high-efficiency photovoltaic panels, run scheduled 3-hour clean power generation cycles, and collect daily USDT settlements directly to your account.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/signup"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-solar-gold via-solar-amber to-amber-500 text-[#050B18] font-extrabold text-sm shadow-gold-glow flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <span>Start Solar Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-2xl bg-[#0B1426] hover:bg-[#111E38] border border-white/[0.1] text-white font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <span>Access Dashboard</span>
                </Link>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.08] font-mono">
                <div>
                  <div className="text-2xl font-bold text-solar-gold">6 Tiers</div>
                  <div className="text-[11px] text-slate-400">P1 to P6 Capacity</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">3 Hours</div>
                  <div className="text-[11px] text-slate-400">Daily Run Window</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">100%</div>
                  <div className="text-[11px] text-slate-400">Verified Settlements</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5">
              <GlassCard elevation={2} className="p-3 rounded-3xl border-solar-gold/30 shadow-2xl relative overflow-hidden group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0B1426]">
                  <Image
                    src="/images/hero-solar-farm.jpg"
                    alt="Sonoran Solar Farm Infrastructure"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050B18] via-transparent to-transparent opacity-80" />

                  {/* Live Status Overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050B18]/85 backdrop-blur-md border border-white/[0.1] text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white font-bold">Sonoran Solar Basin Hub</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#050B18]/90 backdrop-blur-md border border-white/[0.08] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">OPERATIONAL CAPACITY</span>
                      <span className="text-solar-gold font-bold text-sm">186.4 MW Active</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">DAILY YIELD STATUS</span>
                      <span className="text-emerald-400 font-bold text-sm">Online & Generating</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOLAR PROJECT OVERVIEW */}
      <section className="py-16 bg-[#070E1E] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase text-solar-gold tracking-widest font-bold">
              PROJECT ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
              The SolarGrid Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Engineered with tier-1 monocrystalline photovoltaic cells and smart inverters, the project allocates dedicated digital solar units directly to verified contributors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-solar-gold/20 border border-solar-gold/40 flex items-center justify-center text-solar-gold">
                <Sun className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1. Select Solar Panel</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Choose from P1 (1 KW) to P6 (100 KW) based on your clean energy generation goals with transparent unit pricing starting from 35 USDT.
              </p>
            </GlassCard>

            <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-solar-amber/20 border border-solar-amber/40 flex items-center justify-center text-solar-amber">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">2. Run 3-Hour Cycle</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Start your owned panels with your secure start code. Track the 3-hour generation cycle in real time with high-precision telemetry and countdown timers.
              </p>
            </GlassCard>

            <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">3. Receive Daily Yield</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Collect generated earnings directly to your available USDT balance with automated one-click settlement and transparent blockchain withdrawals.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 3. SIX SOLAR PANELS PREVIEW */}
      <section className="py-16 bg-[#050B18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-solar-gold tracking-widest font-bold">
                PANEL TIERS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Solar Generation Panels (P1–P6)
              </h2>
            </div>
            <Link
              href="/signup"
              className="text-xs font-mono text-solar-gold hover:text-amber-300 font-bold flex items-center gap-1 group"
            >
              <span>View in Dashboard</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(plans.length > 0 ? plans : [
              { code: 'P1', name: 'P1 Solar Panel', priceUsdt: 35, dailyEarningUsdt: 0.8, capacityKw: 1, imageUrl: '/images/panel-p1.jpg' },
              { code: 'P2', name: 'P2 Solar Panel', priceUsdt: 150, dailyEarningUsdt: 3.4, capacityKw: 5, imageUrl: '/images/panel-p2.jpg' },
              { code: 'P3', name: 'P3 Solar Panel', priceUsdt: 300, dailyEarningUsdt: 7.2, capacityKw: 10, imageUrl: '/images/panel-p3.jpg' },
              { code: 'P4', name: 'P4 Solar Panel', priceUsdt: 600, dailyEarningUsdt: 15.0, capacityKw: 20, imageUrl: '/images/panel-p4.jpg' },
              { code: 'P5', name: 'P5 Solar Panel', priceUsdt: 1500, dailyEarningUsdt: 40.0, capacityKw: 50, imageUrl: '/images/panel-p5.jpg' },
              { code: 'P6', name: 'P6 Solar Panel', priceUsdt: 3000, dailyEarningUsdt: 85.0, capacityKw: 100, imageUrl: '/images/panel-p6.jpg' },
            ]).map((panel) => (
              <GlassCard
                key={panel.code}
                elevation={1}
                className="p-5 rounded-3xl border-white/[0.08] hover:border-solar-gold/40 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0A1222] border border-white/[0.06]">
                  <Image
                    src={panel.imageUrl || `/images/panel-${panel.code.toLowerCase()}.jpg`}
                    alt={panel.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#050B18]/90 border border-white/[0.1] text-xs font-mono font-bold text-solar-gold">
                    {panel.code} • {panel.capacityKw} KW
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{panel.name}</h3>
                    <span className="text-lg font-mono font-bold text-solar-gold">
                      ${panel.priceUsdt} <span className="text-xs text-slate-400 font-normal">USDT</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#070E1E] border border-white/[0.06] flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">Daily Revenue:</span>
                    <span className="text-emerald-400 font-bold">+{panel.dailyEarningUsdt.toFixed(2)} USDT / day</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-solar-gold hover:text-[#050B18] text-white font-bold text-xs font-mono text-center border border-white/[0.08] transition-all"
                >
                  Buy {panel.code}
                </Link>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#050B18] py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-solar-gold" />
            <span className="text-white font-bold">SolarGrid Infrastructure</span>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-solar-gold transition-colors">
              User Sign In
            </Link>
            <span>•</span>
            <Link href="/signup" className="hover:text-solar-gold transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
