'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { GlassCard } from '@/components/glass';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
      }
    };
    fetchStats();
  }, []);

  const monthlyGeneration = [
    { month: 'Mar', mwHours: 124, earnings: 14200 },
    { month: 'Apr', mwHours: 168, earnings: 19400 },
    { month: 'May', mwHours: 215, earnings: 24800 },
    { month: 'Jun', mwHours: 280, earnings: 32500 },
    { month: 'Jul', mwHours: 340, earnings: 39100 },
    { month: 'Aug', mwHours: stats?.totalGeneratedKwh ? Math.round(stats.totalGeneratedKwh / 100) : 412, earnings: stats?.totalEarningsDistributed ? Math.round(stats.totalEarningsDistributed) : 47800 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-white">System Analytics & Financial Reporting</h1>
          <p className="text-xs text-slate-400">
            Macro-level energy generation yield curves, network community expansion velocity, and platform liquidity.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-xs">
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-1">
          <div className="text-slate-400 font-semibold">GLOBAL CAPACITY</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono-num">
            {stats ? (stats.totalCapacityKw / 1000).toFixed(1) : '286.3'} <span className="text-xs font-normal text-slate-400">MW</span>
          </div>
          <div className="text-[10px] text-solar-gold font-semibold">{stats ? `${stats.activeUnits} Active Units` : 'Active Utility Farms'}</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-1">
          <div className="text-slate-400 font-semibold">TOTAL USERS</div>
          <div className="text-2xl font-bold text-solar-gold mt-1 font-mono-num">
            {stats ? stats.totalUsers : 1240}
          </div>
          <div className="text-[10px] text-solar-amber font-semibold">{stats ? `${stats.activeUsers} Verified Active` : '+21% from last month'}</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-1">
          <div className="text-slate-400 font-semibold">TOTAL DISBURSEMENTS</div>
          <div className="text-2xl font-bold text-solar-gold mt-1 font-mono-num">
            ${stats ? stats.totalEarningsDistributed.toLocaleString() : '47,800'} <span className="text-xs font-normal text-slate-400">USDT</span>
          </div>
          <div className="text-[10px] text-slate-400">Settled to member wallets</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-1">
          <div className="text-slate-400 font-semibold">PENDING VOLUME</div>
          <div className="text-2xl font-bold text-solar-blue mt-1 font-mono-num">
            ${stats ? (stats.pendingWithdrawalsVolume || 0).toLocaleString() : '0'} <span className="text-xs font-normal text-slate-400">USDT</span>
          </div>
          <div className="text-[10px] text-slate-400">{stats ? `${stats.pendingWithdrawals} requests pending` : 'In review queue'}</div>
        </GlassCard>
      </div>

      {/* Generation Curve */}
      <GlassCard elevation={1} className="p-6 sm:p-8 rounded-3xl border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Cumulative Generation Yield Curve (USDT)</h3>
            <p className="text-xs text-slate-400 font-mono">6-month macro energy production settlements</p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-solar-gold/15 text-solar-gold text-xs font-mono font-bold border border-solar-gold/30 shadow-gold-glow">
            $47.8k Peak Volume
          </span>
        </div>

        <div className="h-72 w-full pt-4 font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyGeneration}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC83D" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FFC83D" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} fontStyle="bold" />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1426',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#F8FAFC',
                }}
              />
              <Area type="monotone" dataKey="earnings" stroke="#FFC83D" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
