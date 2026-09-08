'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';
import { SolarPlan } from '@/types';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function PlansPage() {
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

      <main className="flex-1 py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            Transparent Pricing
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Solar Plans & Daily Earnings
          </h1>
          <p className="text-sm text-slate-400">
            Choose a plan that fits your budget. Each plan generates daily returns for 43 working days (Monday to Friday).
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <GlassCard
              key={plan.id}
              className="p-6 rounded-2xl border-white/[0.07] bg-[#11131C] flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold font-mono text-xs">
                    {plan.code}
                  </span>
                  <span className="text-xs text-slate-400">
                    {plan.workingDaysTotal || 43} weekdays
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-2 text-3xl font-extrabold text-white">
                    ${plan.priceUsdt} <span className="text-xs font-normal text-slate-400">USDT</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/[0.06] text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Daily Return:</span>
                    <span className="font-bold text-emerald-400">
                      +${plan.dailyEarningUsdt.toFixed(2)} USDT / day
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Gross Return:</span>
                    <span className="font-bold text-amber-400">
                      ${plan.grossEarningUsdt.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Net Return (after 10% fee):</span>
                    <span className="font-bold text-white">
                      ${plan.netAfterFeeUsdt.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Run Window:</span>
                    <span className="text-slate-300">3 Hours / Weekday</span>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="pt-3 border-t border-white/[0.06] space-y-1.5 text-xs text-slate-400">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                href={`/signup?plan=${plan.code}`}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs text-center transition-colors shadow-sm"
              >
                Choose {plan.code} Plan
              </Link>
            </GlassCard>
          ))}
        </div>

        {/* Operating Rules Summary Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#11131C] border border-white/[0.06] space-y-4 text-xs text-slate-400">
          <h3 className="text-sm font-bold text-white">Plan Terms & How Earnings Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong className="text-slate-200 block mb-1">Weekday Operations:</strong>
              Solar panels generate revenue Monday through Friday. Weekends are reserved for maintenance and grid alignment.
            </div>
            <div>
              <strong className="text-slate-200 block mb-1">3-Hour Daily Run:</strong>
              Click &ldquo;Start Panel&rdquo; once each weekday. After 3 hours, your daily return is credited to your balance.
            </div>
            <div>
              <strong className="text-slate-200 block mb-1">Low 10% Withdrawal Fee:</strong>
              A standard 10% fee applies when you withdraw money to your USDT (TRC20) address.
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
