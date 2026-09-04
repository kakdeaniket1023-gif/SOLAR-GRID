'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SolarUnit } from '@/types';
import { Search } from 'lucide-react';
import { GlassCard } from '@/components/glass';

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
      (u.location && u.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-white">Global Solar Units Fleet Monitor</h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry, operating status, and daily energy outputs for all deployed contributor panels.
          </p>
        </div>
      </div>

      {/* Search */}
      <GlassCard elevation={1} className="p-4 rounded-3xl border-white/[0.08] text-xs font-mono">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Unit ID, location, or plan..."
            className="w-full glass-input border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-white"
          />
        </div>
      </GlassCard>

      {/* Fleet Table */}
      <div className="glass-1 rounded-3xl border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060D1A]/90 text-slate-400">
                <th className="p-4 font-semibold">UNIT ID</th>
                <th className="p-4 font-semibold">PLAN</th>
                <th className="p-4 font-semibold">LOCATION</th>
                <th className="p-4 font-semibold">CAPACITY</th>
                <th className="p-4 font-semibold">TODAY KWH</th>
                <th className="p-4 font-semibold">WORKING DAYS</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 font-semibold text-right">LIFETIME USDT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.slice(0, 50).map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-solar-gold font-mono-num">#{u.id.substring(0, 12)}</td>
                  <td className="p-4 font-bold text-white">{u.planName} ({u.planCode})</td>
                  <td className="p-4 text-slate-400 truncate max-w-xs">{u.location}</td>
                  <td className="p-4 text-white font-bold font-mono-num">{u.capacityKw} kW</td>
                  <td className="p-4 text-solar-gold font-bold font-mono-num">{u.todayGeneratedKwh || 8.4} kWh</td>
                  <td className="p-4 text-slate-300 font-mono-num">{u.workingDaysCompleted} / {u.workingDaysTotal || 43}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-solar-gold/15 text-solar-gold border border-solar-gold/30">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right text-solar-gold font-bold font-mono-num">${(u.totalEarnedUsdt || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
