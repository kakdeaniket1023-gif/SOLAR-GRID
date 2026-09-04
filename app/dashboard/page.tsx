'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/auth-context';
import { SolarUnit } from '@/types';
import {
  Sun,
  Zap,
  ArrowDownToLine,
  Play,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { GlassCard } from '@/components/glass';

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [units, setUnits] = useState<SolarUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    if (user) {
      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.units) {
            setUnits(data.units);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeUnits = units.filter((u) => u.status === 'ACTIVE');
  const totalCapacity = activeUnits.reduce((acc, u) => acc + (u.capacityKw || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. PROJECT HERO SECTION */}
      <GlassCard
        elevation={2}
        className="rounded-3xl border-solar-gold/30 shadow-2xl relative overflow-hidden p-6 sm:p-8"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Actions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-xs font-mono font-bold shadow-gold-glow">
              <span className="w-2 h-2 rounded-full bg-solar-gold animate-ping" />
              SONORAN CLEAN SOLAR PARK
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
              Photovoltaic Clean Energy{' '}
              <span className="bg-gradient-to-r from-solar-gold to-amber-300 bg-clip-text text-transparent text-glow-gold">
                Operations
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-xl">
              Welcome back, <strong className="text-white">{user?.name}</strong>. Your account is connected to high-efficiency utility-grade photovoltaic infrastructure. Start your owned panels for scheduled 3-hour daily cycles and collect direct USDT energy yields.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard/start-panel"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 hover:scale-[1.02] transition-transform"
              >
                <Play className="w-3.5 h-3.5 fill-[#050B18]" />
                <span>Start Panel</span>
              </Link>
              <Link
                href="/dashboard/panels"
                className="px-5 py-2.5 rounded-xl bg-[#0B152A] hover:bg-[#111F3D] border border-white/[0.1] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-solar-gold" />
                <span>Buy Panels</span>
              </Link>
              <Link
                href="/dashboard/recharge"
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-solar-amber" />
                <span>Recharge</span>
              </Link>
              <Link
                href="/dashboard/withdrawal"
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-solar-blue" />
                <span>Withdraw</span>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#0A1222] border border-white/[0.1] shadow-lg">
            <Image
              src="/images/hero-solar-farm.jpg"
              alt="Solar Project Infrastructure"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B18] via-transparent to-transparent opacity-70" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono p-2 rounded-xl bg-[#050B18]/90 backdrop-blur-md border border-white/[0.08]">
              <span className="text-slate-400">STATUS: <strong className="text-emerald-400">OPTIMAL</strong></span>
              <span className="text-solar-gold font-bold">MON–FRI GENERATION</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. ACCOUNT & PROJECT METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVAILABLE BALANCE</span>
            <div className="w-7 h-7 rounded-lg bg-solar-gold/15 border border-solar-gold/30 flex items-center justify-center text-solar-gold">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-solar-gold text-glow-gold">
            ${(user?.availableBalance || 0).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">USDT</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Ready for withdrawal or reinvestment</p>
        </GlassCard>

        {/* Total Generated Income */}
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL INCOME</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            ${(user?.totalEarned || 0).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">USDT</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Cumulative energy yield received</p>
        </GlassCard>

        {/* Owned Panels */}
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>OWNED PANELS</span>
            <div className="w-7 h-7 rounded-lg bg-solar-amber/15 border border-solar-amber/30 flex items-center justify-center text-solar-amber">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {units.length}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">
              ({activeUnits.length} active)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {totalCapacity > 0 ? `${totalCapacity} KW total allocated` : 'No active units yet'}
          </p>
        </GlassCard>

        {/* Account Points */}
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>REWARD POINTS</span>
            <div className="w-7 h-7 rounded-lg bg-solar-gold/15 border border-solar-gold/30 flex items-center justify-center text-solar-gold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-solar-gold">
            {user?.points ?? 100}{' '}
            <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">+2 pts per panel purchase & run</p>
        </GlassCard>
      </div>

      {/* 3. PROJECT DETAILS & QUICK ACCESS */}
      <GlassCard elevation={1} className="p-6 sm:p-8 rounded-3xl border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-4 gap-2">
          <div>
            <h2 className="text-lg font-bold font-display text-white">
              Solar Infrastructure Operation Rules
            </h2>
            <p className="text-xs text-slate-400">
              Clean-energy parameters for scheduled operation and yield settlements.
            </p>
          </div>
          <Link
            href="/dashboard/start-panel"
            className="text-xs font-mono text-solar-gold hover:underline flex items-center gap-1 font-bold"
          >
            <span>Open Start Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-[#050B18] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase text-solar-gold font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 3-HOUR RUN DURATION
            </span>
            <p className="text-slate-300 text-[11px] font-sans">
              Panels operate for 3 hours per daily cycle upon entering your start authorization code.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050B18] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> DIRECT RECEIVE SYSTEM
            </span>
            <p className="text-slate-300 text-[11px] font-sans">
              Once completed, daily earning entries appear in the Receive section for immediate account crediting.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050B18] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase text-solar-blue font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> IMMUTABLE LEDGER
            </span>
            <p className="text-slate-300 text-[11px] font-sans">
              Every deposit, yield collection, and on-chain withdrawal is cryptographically logged to your profile.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
