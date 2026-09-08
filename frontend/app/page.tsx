'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';
import { SolarPlan } from '@/types';
import {
  Sun,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function HomePage() {
  const [plans, setPlans] = useState<SolarPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/solar/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.plans) {
          setPlans(data.plans.filter((p: SolarPlan) => p.status === 'ACTIVE'));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Solar Energy Community
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Clean solar energy.{' '}
            <span className="text-amber-400">Simple daily returns.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Choose a solar panel plan, turn it on once a day (Monday to Friday), and receive real daily USDT earnings directly into your balance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/plans"
              className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white font-medium text-sm transition-colors"
            >
              <span>View Solar Plans</span>
            </Link>
          </div>

          {/* Quick 3 Stat Pills */}
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-xl bg-[#11131C] border border-white/[0.06] text-center">
              <div className="text-2xl font-bold text-white">$35</div>
              <div className="text-xs text-slate-400 mt-0.5">Starting Plan</div>
            </div>
            <div className="p-4 rounded-xl bg-[#11131C] border border-white/[0.06] text-center">
              <div className="text-2xl font-bold text-amber-400">3 Hours</div>
              <div className="text-xs text-slate-400 mt-0.5">Daily Run Time</div>
            </div>
            <div className="p-4 rounded-xl bg-[#11131C] border border-white/[0.06] text-center">
              <div className="text-2xl font-bold text-emerald-400">43 Days</div>
              <div className="text-xs text-slate-400 mt-0.5">Weekday Generation Cycle</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="py-16 border-t border-white/[0.06] bg-[#0C0E14]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How It Works
            </h2>
            <p className="text-sm text-slate-400">
              Three simple steps to start earning daily returns from clean solar power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-semibold text-white">Pick a Solar Plan</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose a solar panel plan that matches your budget, from Starter (P1 at $35) to Premium (P6 at $2,500).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-semibold text-white">Run Your Panel</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click &ldquo;Start Panel&rdquo; each weekday. Your solar panel runs for 3 hours, then your earnings are ready to collect.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-semibold text-white">Withdraw Earnings</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your daily USDT returns are added to your balance. Withdraw directly to your USDT (TRC20) wallet anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOLAR PLANS SHOWCASE */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Solar Plans
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Fixed costs, predictable daily returns, active for 43 working days.
              </p>
            </div>
            <Link
              href="/plans"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Compare all plans</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.slice(0, 6).map((plan) => (
              <GlassCard
                key={plan.id}
                className="p-6 rounded-2xl border-white/[0.07] bg-[#11131C] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono">
                      {plan.code}
                    </span>
                    <span className="text-xs text-slate-400">
                      {plan.workingDaysTotal || 43} weekdays
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cost:</span>
                      <span className="font-bold text-white">${plan.priceUsdt} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Return:</span>
                      <span className="font-bold text-emerald-400">
                        +${plan.dailyEarningUsdt.toFixed(2)} USDT / day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Return:</span>
                      <span className="font-bold text-amber-400">
                        ${plan.grossEarningUsdt.toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/signup?plan=${plan.code}`}
                  className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-amber-400 hover:text-neutral-950 border border-white/[0.08] hover:border-amber-400 text-white font-semibold text-xs text-center transition-all"
                >
                  Choose {plan.code}
                </Link>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. REFERRAL COMMUNITY SECTION */}
      <section className="py-16 border-t border-white/[0.06] bg-[#0C0E14]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-2xl bg-[#11131C] border border-white/[0.07] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <Users className="w-3.5 h-3.5" />
                Community Referral Program
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Invite friends and earn together
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Share your personal referral link. Whenever friends in your network run their solar panels, you earn a percentage of their daily generation:
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-amber-400 font-bold text-lg">5%</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Level 1 (Direct)</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-amber-400 font-bold text-lg">3%</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Level 2</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-amber-400 font-bold text-lg">2%</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Level 3</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6 rounded-xl bg-[#090A0F] border border-white/[0.06] text-xs">
              <div className="font-semibold text-white text-sm">Key Operating Rules</div>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Panels generate energy Monday through Friday only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Each generation cycle runs for 3 hours before earnings can be claimed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Flat 10% fee on all withdrawals to cover network processing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Withdrawals processed quickly via USDT (TRC20).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA BANNER */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to start earning from clean solar energy?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Join thousands of members earning weekday solar returns with SolarGrid.
          </p>
          <div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm shadow-sm transition-all"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
