'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  TrendingUp,
  Zap,
  ArrowDownToLine,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Users,
  ArrowRight,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';
import { SolarUnit, GenerationLog } from '@/types';

export default function EarningsPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState<SolarUnit[]>([]);
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [mlmStats, setMlmStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadEarningsData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [overviewRes, mlmRes] = await Promise.all([
        fetch('/api/dashboard/overview').then((r) => r.json()).catch(() => ({})),
        fetch('/api/mlm/stats').then((r) => r.json()).catch(() => ({})),
      ]);

      if (overviewRes.success) {
        setUnits(overviewRes.units || []);
        setLogs(overviewRes.logs || []);
      }

      if (mlmRes.success && mlmRes.stats) {
        setMlmStats(mlmRes.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEarningsData();
  }, [loadEarningsData]);

  // Today's total earned across units
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEarned = logs
    .filter((l) => l.generationDate === todayStr && l.status === 'RECEIVED')
    .reduce((acc, l) => acc + (l.actualEarningUsdt || (l as any).earnedUsdt || 0), 0);

  // Solar generation earnings total
  const solarLifetimeEarned = units.reduce(
    (acc, u) => acc + (u.lifetimeEarnedUsdt || 0) + (u.todayEarnedUsdt || 0),
    0
  );

  // Referral commissions total
  const referralLifetimeEarned = mlmStats?.totalCommissionEarned || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Earnings Summary
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track your daily solar generation yields, referral commissions, and lifetime payout history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/start-panel"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Daily Power</span>
          </Link>
          <Link
            href="/dashboard/withdrawal"
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-zinc-400" />
            <span>Withdraw</span>
          </Link>
        </div>
      </div>

      {/* 4 Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lifetime */}
        <div className="p-5 rounded-2xl bg-[#0D0E15] border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>TOTAL LIFETIME</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            ${(user?.totalEarned || 0).toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-400">USDT</span>
          </div>
          <p className="text-xs text-zinc-400">Cumulative earnings from all sources</p>
        </div>

        {/* Today's Returns */}
        <div className="p-5 rounded-2xl bg-[#0D0E15] border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>TODAY&apos;S RETURNS</span>
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            ${todayEarned.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-400">USDT</span>
          </div>
          <p className="text-xs text-zinc-400">Harvested from today&apos;s active cycles</p>
        </div>

        {/* Solar Generation */}
        <div className="p-5 rounded-2xl bg-[#0D0E15] border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>PANEL GENERATION</span>
            <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            ${solarLifetimeEarned.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-400">USDT</span>
          </div>
          <p className="text-xs text-zinc-400">Direct returns from owned panels</p>
        </div>

        {/* Referral Rewards */}
        <div className="p-5 rounded-2xl bg-[#0D0E15] border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>REFERRAL COMMISSIONS</span>
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
            ${referralLifetimeEarned.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-400">USDT</span>
          </div>
          <p className="text-xs text-zinc-400">Earned from invited community members</p>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel Income Summary */}
        <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Owned Panels Status</h3>
            <Link
              href="/dashboard/panels"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>Manage Panels</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {units.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 space-y-3">
              <p>You do not currently own any solar panels.</p>
              <Link
                href="/dashboard/panels"
                className="inline-block px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors"
              >
                Buy Your First Panel
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {units.map((unit) => {
                const totalUnitEarned = (unit.lifetimeEarnedUsdt || 0) + (unit.todayEarnedUsdt || 0);
                return (
                  <div
                    key={unit.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {unit.planName} ({unit.capacityKw} KW)
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Cost: ${unit.purchasePriceUsdt} USDT · 60-day term
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        +${totalUnitEarned.toFixed(2)} USDT
                      </div>
                      <div className="text-[10px] text-zinc-400">Lifetime earned</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Withdrawal & Settlement Rules */}
        <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-4">
          <div className="pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Settlement & Withdrawal Rules</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Daily Power Cycle
              </span>
              <p className="text-zinc-400 leading-relaxed">
                Panels run for 3 hours once per weekday. Daily yields are ready to collect immediately after the cycle completes.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" /> Standard 10% Withdrawal Fee
              </span>
              <p className="text-zinc-400 leading-relaxed">
                A flat 10% fee applies to all withdrawals to support real-world facility maintenance and operations.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Minimum Withdrawal
              </span>
              <p className="text-zinc-400 leading-relaxed">
                Minimum withdrawal amount is 10.00 USDT. Payouts are delivered to your verified wallet address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
