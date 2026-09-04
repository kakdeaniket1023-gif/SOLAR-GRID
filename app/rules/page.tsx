'use client';

import React from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { Shield, PlusCircle, MinusCircle } from 'lucide-react';

const POINT_RULES = [
  { id: 'PR-01', title: 'Daily Solar Generation Active', description: 'Complete consecutive daily generation cycles during 12:00 PM - 3:00 PM', points: 1, type: 'REWARD' },
  { id: 'PR-02', title: 'Direct Contributor Activation (L1)', description: 'Direct referral acquires and activates any photovoltaic panel (P1/P2/P3)', points: 2, type: 'REWARD' },
  { id: 'PR-03', title: 'Team Growth Milestone', description: 'Team network reaches 10 active operational solar units', points: 5, type: 'REWARD' },
  { id: 'PR-04', title: 'Regional Workshop Host', description: 'Host verified regional or online community clean energy seminar', points: 10, type: 'REWARD' },
  { id: 'PR-05', title: 'Missed Daily Operation Window', description: 'Failure to initiate operational cycle during weekday operating window', points: -1, type: 'DEDUCTION' },
  { id: 'PR-06', title: 'Withdrawal Cancellation Spike', description: 'Repeatedly initiating and canceling withdrawal requests', points: -3, type: 'DEDUCTION' },
  { id: 'PR-07', title: 'Malicious Multi-Accounting Attempt', description: 'Detected creating unauthorized self-referral rings without genuine capacity', points: -20, type: 'DEDUCTION' },
  { id: 'PR-08', title: 'Severe Compliance Infraction', description: 'Violating platform community standards or engaging in deceptive promotion', points: -50, type: 'DEDUCTION' },
];

export default function RulesPage() {
  const rewardRules = POINT_RULES.filter((r) => r.type === 'REWARD');
  const deductionRules = POINT_RULES.filter((r) => r.type === 'DEDUCTION');

  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-[#F8FAFC]">
      <Navigation />

      <main className="flex-1 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-solar-gold/10 border border-solar-gold/30 text-solar-gold text-xs font-mono font-semibold shadow-gold-glow">
            PLATFORM GOVERNANCE & CODE OF CONDUCT
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white">
            SolarGrid Operating Rules
          </h1>
          <p className="text-base text-slate-400">
            Complete transparency on point impacts, earning ratio thresholds, community reward rules, and deduction policies.
          </p>
        </div>

        {/* 1. Point Performance Multipliers */}
        <div className="glass-1 p-8 rounded-3xl border-white/[0.08] space-y-6 shadow-xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-solar-gold" />
            Point Score to Daily Generation Performance Ratio
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every user is initialized with a baseline score of <strong>70 Points (100% earning power)</strong>. Maintaining active generation habits and community engagement preserves your full daily yield.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#050B18]/70 p-5 rounded-2xl border border-solar-gold/40 space-y-1 text-center shadow-gold-glow">
              <div className="text-xs font-mono text-slate-400">SCORE: 70+ POINTS</div>
              <div className="text-3xl font-extrabold font-mono text-solar-gold font-mono-num">100%</div>
              <div className="text-[11px] text-slate-400">Full Daily Earning Power</div>
            </div>
            <div className="bg-[#050B18]/70 p-5 rounded-2xl border border-solar-amber/40 space-y-1 text-center shadow-amber-glow">
              <div className="text-xs font-mono text-slate-400">SCORE: 61 – 69 POINTS</div>
              <div className="text-3xl font-extrabold font-mono text-solar-amber font-mono-num">80%</div>
              <div className="text-[11px] text-slate-400">Slight Performance Drop</div>
            </div>
            <div className="bg-[#050B18]/70 p-5 rounded-2xl border border-orange-500/40 space-y-1 text-center">
              <div className="text-xs font-mono text-slate-400">SCORE: 31 – 60 POINTS</div>
              <div className="text-3xl font-extrabold font-mono text-orange-400 font-mono-num">50%</div>
              <div className="text-[11px] text-slate-400">Moderate Earning Impact</div>
            </div>
            <div className="bg-[#050B18]/70 p-5 rounded-2xl border border-rose-500/40 space-y-1 text-center">
              <div className="text-xs font-mono text-slate-400">SCORE: BELOW 30</div>
              <div className="text-3xl font-extrabold font-mono text-rose-400 font-mono-num">10%</div>
              <div className="text-[11px] text-slate-400">Severe Penalty Multiplier</div>
            </div>
          </div>
        </div>

        {/* 2. Rewards vs Deductions Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rewards */}
          <div className="glass-1 p-6 sm:p-8 rounded-3xl border-solar-gold/30 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-solar-gold" />
              Point Reward Policies
            </h3>
            <div className="space-y-3">
              {rewardRules.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.06] flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-solar-gold/20 border border-solar-gold/40 text-solar-gold font-mono font-bold text-xs shrink-0 shadow-gold-glow">
                    +{r.points} Pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div className="glass-1 p-6 sm:p-8 rounded-3xl border-rose-500/30 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MinusCircle className="w-5 h-5 text-rose-400" />
              Point Deduction Policies
            </h3>
            <div className="space-y-3">
              {deductionRules.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.06] flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-xs shrink-0">
                    {r.points} Pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
