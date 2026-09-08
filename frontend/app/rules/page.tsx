'use client';

import React from 'react';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';
import { Shield, PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

const POINT_RULES = [
  { id: 'PR-01', title: 'Daily Panel Start Bonus', description: 'Earned every time you start your panels on a weekday', points: 2, type: 'REWARD' },
  { id: 'PR-02', title: 'Direct Referral Activation', description: 'When a friend you invited activates their first solar panel', points: 2, type: 'REWARD' },
  { id: 'PR-03', title: 'Community Milestone', description: 'Your team network reaches 10 active operational solar panels', points: 5, type: 'REWARD' },
  { id: 'PR-04', title: 'Community Meetup Host', description: 'Organize or participate in a local green-energy meetup with 5+ people', points: 10, type: 'REWARD' },
  { id: 'PR-05', title: 'Consecutive Inactivity', description: 'Failing to start panels for 5 consecutive weekdays', points: -2, type: 'DEDUCTION' },
  { id: 'PR-06', title: 'Withdrawal Cancellation Spam', description: 'Repeatedly initiating and canceling withdrawal requests', points: -3, type: 'DEDUCTION' },
  { id: 'PR-07', title: 'Fake Multi-Account Creation', description: 'Attempting to create duplicate fake accounts for referral manipulation', points: -20, type: 'DEDUCTION' },
  { id: 'PR-08', title: 'Terms Violation', description: 'Violating platform community standards or abusive behavior', points: -50, type: 'DEDUCTION' },
];

export default function RulesPage() {
  const rewardRules = POINT_RULES.filter((r) => r.type === 'REWARD');
  const deductionRules = POINT_RULES.filter((r) => r.type === 'DEDUCTION');

  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      <main className="flex-1 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            Platform Rules
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Operating Rules & Points System
          </h1>
          <p className="text-sm text-slate-400">
            Clear guidelines on operating hours, point performance scores, and community rewards.
          </p>
        </div>

        {/* 1. Point Multipliers */}
        <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            Points Efficiency Multiplier
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every user starts with <strong>100 Points</strong>. Maintaining at least 70 points ensures you receive 100% of your advertised daily solar earnings.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#090A0F] p-4 rounded-xl border border-amber-500/30 text-center space-y-1">
              <div className="text-xs text-slate-400 font-medium">70 – 100+ Points</div>
              <div className="text-2xl font-bold text-amber-400">100%</div>
              <div className="text-[11px] text-slate-400">Full Daily Returns</div>
            </div>
            <div className="bg-[#090A0F] p-4 rounded-xl border border-white/[0.08] text-center space-y-1">
              <div className="text-xs text-slate-400 font-medium">61 – 69 Points</div>
              <div className="text-2xl font-bold text-white">80%</div>
              <div className="text-[11px] text-slate-400">Partial Returns</div>
            </div>
            <div className="bg-[#090A0F] p-4 rounded-xl border border-white/[0.08] text-center space-y-1">
              <div className="text-xs text-slate-400 font-medium">31 – 60 Points</div>
              <div className="text-2xl font-bold text-slate-300">50%</div>
              <div className="text-[11px] text-slate-400">Reduced Returns</div>
            </div>
            <div className="bg-[#090A0F] p-4 rounded-xl border border-rose-500/30 text-center space-y-1">
              <div className="text-xs text-slate-400 font-medium">0 – 30 Points</div>
              <div className="text-2xl font-bold text-rose-400">10%</div>
              <div className="text-[11px] text-slate-400">Minimum Returns</div>
            </div>
          </div>
        </div>

        {/* 2. Earning & Losing Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rewards */}
          <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Ways to Earn Points
            </h3>
            <div className="space-y-3">
              {rewardRules.map((rule) => (
                <div key={rule.id} className="p-3 rounded-xl bg-[#090A0F] border border-white/[0.05] flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">{rule.title}</div>
                    <div className="text-[11px] text-slate-400">{rule.description}</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">
                    +{rule.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div className="p-6 rounded-2xl bg-[#11131C] border border-white/[0.07] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-rose-400" />
              Point Deductions
            </h3>
            <div className="space-y-3">
              {deductionRules.map((rule) => (
                <div key={rule.id} className="p-3 rounded-xl bg-[#090A0F] border border-white/[0.05] flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">{rule.title}</div>
                    <div className="text-[11px] text-slate-400">{rule.description}</div>
                  </div>
                  <span className="text-xs font-bold text-rose-400 shrink-0 font-mono">
                    {rule.points} pts
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
