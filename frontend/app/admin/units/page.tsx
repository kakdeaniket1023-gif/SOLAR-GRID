'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SolarUnit } from '@/types';
import { Search, Sun, CheckCircle2, Clock, Layers, ArrowRight } from 'lucide-react';
import { GlassCard, GlassBadge } from '@/frontend/glass';

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<SolarUnit[]>([]);
  const [search, setSearch] = useState('');

  const loadUnits = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/units');
      const data = await res.json();
      if (data.success && data.units) {
        setUnits(data.units);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.id.toLowerCase().includes(q) ||
      (u.planName && u.planName.toLowerCase().includes(q)) ||
      (u.planCode && u.planCode.toLowerCase().includes(q)) ||
      (u.userId && u.userId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/25 text-solar-gold text-xs font-semibold">
            <Sun className="w-3.5 h-3.5" />
            Solar Investment Oversight
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Member Active Solar Panels
          </h1>
          <p className="text-xs text-slate-400">
            Monitor member solar package subscriptions (P1–P6), daily 3-hour operation progress, and accumulated yields.
          </p>
        </div>

        <Link
          href="/admin/plans"
          className="px-4 py-2 rounded-2xl bg-solar-gold/15 hover:bg-solar-gold/25 text-solar-gold border border-solar-gold/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-gold-glow"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Edit P1–P6 Plans</span>
        </Link>
      </div>

      {/* Search */}
      <GlassCard elevation={1} className="p-4 rounded-3xl border-white/[0.08] text-xs">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Unit ID, Package Code, or Member ID..."
            className="w-full glass-input border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-white"
          />
        </div>
      </GlassCard>

      {/* Panels Table */}
      <div className="glass-1 rounded-3xl border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060D1A]/90 text-slate-400">
                <th className="p-4 font-semibold">UNIT ID</th>
                <th className="p-4 font-semibold">PACKAGE</th>
                <th className="p-4 font-semibold">PRICE</th>
                <th className="p-4 font-semibold">DAILY YIELD</th>
                <th className="p-4 font-semibold">CYCLE PROGRESS</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 font-semibold text-right">LIFETIME YIELD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.slice(0, 50).map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-solar-gold font-mono-num">#{u.id.substring(0, 14)}</td>
                  <td className="p-4">
                    <span className="font-bold text-white block">{u.planName}</span>
                    <span className="text-[10px] text-solar-gold font-bold">Package {u.planCode}</span>
                  </td>
                  <td className="p-4 text-white font-bold font-mono-num">
                    ${u.purchasePriceUsdt || 35} USDT
                  </td>
                  <td className="p-4 text-emerald-400 font-bold font-mono-num">
                    +${(u.dailyEarningUsdt || 0.8).toFixed(2)}/day
                  </td>
                  <td className="p-4 text-slate-300 font-mono-num">
                    {u.workingDaysCompleted || 14} / {u.workingDaysTotal || 43} days
                  </td>
                  <td className="p-4">
                    <GlassBadge variant={u.status === 'ACTIVE' ? 'gold' : 'neutral'} size="sm">
                      {u.status}
                    </GlassBadge>
                  </td>
                  <td className="p-4 text-right text-solar-gold font-bold font-mono-num">
                    ${(u.totalEarnedUsdt || 0).toFixed(2)} USDT
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

