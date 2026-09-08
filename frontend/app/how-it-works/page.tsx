'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/frontend/ui/navigation';
import { Footer } from '@/frontend/ui/footer';
import { ArrowRight, CheckCircle2, Clock, Wallet, Sun, Users } from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      icon: Wallet,
      title: 'Create an Account & Add Funds',
      desc: 'Sign up in 30 seconds. Deposit USDT (TRC20) to your account balance to get ready for your first solar panel.',
    },
    {
      num: '02',
      icon: Sun,
      title: 'Pick Your Solar Plan',
      desc: 'Choose any panel tier from P1 ($35) to P6 ($2,500). Each panel runs for 43 working days.',
    },
    {
      num: '03',
      icon: Clock,
      title: 'Start Panel Each Weekday',
      desc: 'Log in Monday through Friday and click "Start Panel". The panel runs for 3 hours to complete its daily energy cycle.',
    },
    {
      num: '04',
      icon: CheckCircle2,
      title: 'Collect Returns & Withdraw',
      desc: 'Collect your daily USDT earnings into your balance. Withdraw anytime directly to your external USDT wallet.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F4F5F8]">
      <Navigation />

      <main className="flex-1 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            Simple Guide
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How SolarGrid Works
          </h1>
          <p className="text-sm text-slate-400">
            A step-by-step walkthrough of how you earn daily returns from clean solar power.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <GlassCard
                key={step.num}
                className="p-6 rounded-2xl border-white/[0.07] bg-[#11131C] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-600">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Important Details */}
        <div className="p-8 rounded-2xl bg-[#11131C] border border-white/[0.06] space-y-6">
          <h3 className="text-lg font-bold text-white">Helpful Things to Know</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400">
            <div className="space-y-2">
              <strong className="text-white text-sm block">Weekday Operating Schedule</strong>
              <p className="leading-relaxed">
                Solar energy generation happens Monday through Friday. Weekends are reserved for maintenance and system updates.
              </p>
            </div>
            <div className="space-y-2">
              <strong className="text-white text-sm block">3-Hour Generation Window</strong>
              <p className="leading-relaxed">
                When you click &ldquo;Start Panel&rdquo;, a 3-hour timer begins. Once complete, click &ldquo;Collect Earnings&rdquo; to receive your daily payout.
              </p>
            </div>
            <div className="space-y-2">
              <strong className="text-white text-sm block">10% Withdrawal Fee</strong>
              <p className="leading-relaxed">
                A simple 10% fee is deducted upon withdrawal to cover transaction costs and infrastructure maintenance.
              </p>
            </div>
            <div className="space-y-2">
              <strong className="text-white text-sm block">Referral Rewards (3 Levels)</strong>
              <p className="leading-relaxed">
                Earn ongoing rewards whenever people you invite generate energy: 5% from Level 1, 3% from Level 2, and 2% from Level 3.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pt-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm shadow-sm transition-all"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
