'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  TrendingUp,
  DollarSign,
  ArrowDownToLine,
  GitFork,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { GlassCard, GlassBadge } from '@/frontend/glass';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          if (data.auditLogs) {
            setRecentAudits(data.auditLogs.slice(0, 6));
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
      }
    };

    fetchStats();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  // Commission Tiers breakdown
  const commissionTierData = [
    {
      name: 'Level 1 Direct (10%)',
      amount: stats?.l1CommissionsPaid || 97.0,
      color: '#FFC83D',
    },
    {
      name: 'Level 2 Indirect (3%)',
      amount: stats?.l2CommissionsPaid || 23.55,
      color: '#38BDF8',
    },
    {
      name: 'Level 3 Extended (1%)',
      amount: stats?.l3CommissionsPaid || 0.35,
      color: '#A855F7',
    },
  ];

  // Package distribution (P1 to P6)
  const packageData = [
    { name: 'P1 ($35)', count: stats?.planDistribution?.P1 || 3, fill: '#FFC83D' },
    { name: 'P2 ($150)', count: stats?.planDistribution?.P2 || 2, fill: '#FF9F1C' },
    { name: 'P3 ($300)', count: stats?.planDistribution?.P3 || 1, fill: '#38BDF8' },
    { name: 'P4 ($600)', count: stats?.planDistribution?.P4 || 1, fill: '#34D399' },
    { name: 'P5 ($1500)', count: stats?.planDistribution?.P5 || 0, fill: '#818CF8' },
    { name: 'P6 ($3000)', count: stats?.planDistribution?.P6 || 0, fill: '#F472B6' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/25 text-solar-gold text-xs font-semibold">
            <GitFork className="w-3.5 h-3.5" />
            SolarGrid MLM Administration
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            MLM Network Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Network hierarchy, multi-tier commissions, member acquisition velocity, and liquidity approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/mlm"
            className="px-4 py-2 rounded-2xl bg-solar-gold/15 hover:bg-solar-gold/25 text-solar-gold border border-solar-gold/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-gold-glow"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Genealogy Tree</span>
          </Link>
          <Link
            href="/admin/recharges"
            className="px-4 py-2 rounded-2xl bg-solar-gold hover:bg-amber-400 text-[#050B18] text-xs font-mono font-extrabold shadow-gold-glow transition-all"
          >
            Recharges ({stats?.pendingRecharges || 0})
          </Link>
          <Link
            href="/admin/withdrawals"
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-solar-amber to-amber-500 hover:from-amber-400 hover:to-solar-amber text-[#050B18] text-xs font-mono font-extrabold shadow-amber-glow transition-all"
          >
            Withdrawals ({stats?.pendingWithdrawals || 0})
          </Link>
        </div>
      </div>

      {/* Global Unified Search Bar */}
      <GlassCard elevation={2} className="p-4 sm:p-5 rounded-3xl border-white/[0.08]">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MLM Network: Member Name, Email, Referral Code, Sponsor, Wallet..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input border-white/[0.08] text-white text-xs font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-extrabold text-xs font-mono shadow-gold-glow transition-all"
          >
            {isSearching ? 'Searching...' : 'Search Network'}
          </button>
        </form>

        {/* Search Results Drawer */}
        {searchResults && (
          <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Search Query: &quot;{searchResults.query}&quot;</span>
              <button onClick={() => setSearchResults(null)} className="text-solar-gold hover:underline">
                Close Results
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Users */}
              <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
                <span className="text-[10px] text-solar-gold font-bold block mb-1.5">
                  MATCHED MEMBERS ({searchResults.users?.length || 0})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.users?.map((u: any) => (
                    <Link
                      key={u.id}
                      href={`/admin/users?id=${u.id}`}
                      className="block p-1.5 hover:bg-white/[0.05] rounded text-[11px] text-slate-200"
                    >
                      {u.name} ({u.referralCode || u.email})
                    </Link>
                  ))}
                  {searchResults.users?.length === 0 && (
                    <span className="text-slate-500 text-[10px]">No matches</span>
                  )}
                </div>
              </div>

              {/* Units */}
              <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
                <span className="text-[10px] text-solar-gold font-bold block mb-1.5">
                  MATCHED PACKAGES ({searchResults.units?.length || 0})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.units?.map((u: any) => (
                    <Link
                      key={u.id}
                      href={`/admin/units?id=${u.id}`}
                      className="block p-1.5 hover:bg-white/[0.05] rounded text-[11px] text-slate-200"
                    >
                      {u.id} - {u.planName}
                    </Link>
                  ))}
                  {searchResults.units?.length === 0 && (
                    <span className="text-slate-500 text-[10px]">No matches</span>
                  )}
                </div>
              </div>

              {/* Transactions */}
              <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
                <span className="text-[10px] text-solar-blue font-bold block mb-1.5">
                  MATCHED TRANSACTIONS ({searchResults.transactions?.length || 0})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.transactions?.map((t: any) => (
                    <div key={t.id} className="p-1.5 text-[11px] text-slate-300 truncate">
                      ${t.amountUsdt || t.amount} USDT ({t.type})
                    </div>
                  ))}
                  {searchResults.transactions?.length === 0 && (
                    <span className="text-slate-500 text-[10px]">No matches</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* 6 Core MLM KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
        {/* 1. Total Members */}
        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">TOTAL MEMBERS</div>
          <div className="text-xl font-bold text-white mt-1 font-mono-num">
            {stats?.totalUsers || 8}
          </div>
          <div className="text-[9px] text-solar-gold font-mono-num">
            {stats?.activeUsers || 8} Active Investors
          </div>
        </GlassCard>

        {/* 2. Total Network Investment */}
        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">NETWORK VOLUME</div>
          <div className="text-xl font-bold text-solar-gold mt-1 font-mono-num">
            ${(stats?.totalNetworkInvestment || 1085).toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 font-mono-num">
            P1–P6 Active Purchases
          </div>
        </GlassCard>

        {/* 3. Total MLM Commissions */}
        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">COMMISSIONS PAID</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono-num">
            ${(stats?.totalCommissionsPaid || 120.9).toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-400 font-mono-num">
            L1 (10%) + L2 (3%) + L3 (1%)
          </div>
        </GlassCard>

        {/* 4. Daily Earnings Disbursed */}
        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">SOLAR RUN YIELDS</div>
          <div className="text-xl font-bold text-solar-amber mt-1 font-mono-num">
            ${(stats?.dailyEarningsDisbursed || 240.0).toFixed(2)}
          </div>
          <div className="text-[9px] text-solar-blue font-semibold">
            Member Operation Payouts
          </div>
        </GlassCard>

        {/* 5. Pending Recharges */}
        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">PENDING RECHARGES</div>
          <div className="text-xl font-bold text-solar-gold mt-1 font-mono-num">
            ${(stats?.pendingRechargeVolume || 150.0).toFixed(2)}
          </div>
          <div className="text-[9px] text-solar-gold font-mono-num">
            {stats?.pendingRecharges || 1} Awaiting Approval
          </div>
        </GlassCard>

        {/* 6. Pending Withdrawals */}
        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">PENDING PAYOUTS</div>
          <div className="text-xl font-bold text-rose-400 mt-1 font-mono-num">
            ${(stats?.pendingWithdrawalVolume || 120.0).toFixed(2)}
          </div>
          <div className="text-[9px] text-rose-400 font-mono-num">
            {stats?.pendingWithdrawals || 1} Requests in Queue
          </div>
        </GlassCard>
      </div>

      {/* MLM Charts: Commission Tiers & Package Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Commission Tiers Breakdown */}
        <GlassCard elevation={1} className="lg:col-span-5 rounded-3xl p-6 space-y-4 border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-display text-white">Commission Tiers Breakdown</h2>
              <p className="text-[11px] text-slate-400">Direct vs Multi-Tier Overrides</p>
            </div>
            <GlassBadge variant="gold" size="sm">
              L1 / L2 / L3
            </GlassBadge>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commissionTierData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {commissionTierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)} USDT`, 'Distributed']}
                  contentStyle={{
                    backgroundColor: '#0B1426',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#F8FAFC',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center">
            {commissionTierData.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block truncate">{item.name.split(' ')[0]}</span>
                <span className="font-bold text-white">${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Package Subscriptions Bar Chart */}
        <GlassCard elevation={1} className="lg:col-span-7 rounded-3xl p-6 space-y-4 border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-display text-white">Solar Package Subscriptions</h2>
              <p className="text-[11px] text-slate-400">Member distribution across P1–P6 packages</p>
            </div>
            <Link href="/admin/plans" className="text-solar-gold text-[11px] hover:underline flex items-center gap-1">
              <span>Manage Plans</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1426',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {packageData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Top Network Leaders Leaderboard & Live MLM Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Top Leaders Leaderboard */}
        <GlassCard elevation={1} className="lg:col-span-8 rounded-3xl p-6 space-y-4 border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-solar-gold" />
              <div>
                <h2 className="text-base font-bold font-display text-white">Top Network Recruiters & Leaders</h2>
                <p className="text-[11px] text-slate-400">Ranked by direct referrals and commission performance</p>
              </div>
            </div>
            <Link href="/admin/users" className="text-solar-gold text-[11px] hover:underline">
              All Members →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase">
                  <th className="pb-3 font-semibold">Rank</th>
                  <th className="pb-3 font-semibold">Member</th>
                  <th className="pb-3 font-semibold">Code</th>
                  <th className="pb-3 font-semibold text-center">Directs (L1)</th>
                  <th className="pb-3 font-semibold text-right">Commissions</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {(stats?.topLeaders || []).map((leader: any, idx: number) => (
                  <tr key={leader.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold text-solar-gold">
                      #{idx + 1}
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-white">{leader.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{leader.email}</div>
                    </td>
                    <td className="py-3 font-mono text-solar-gold font-bold">
                      {leader.referralCode}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-solar-gold/15 text-solar-gold text-[10px] font-bold border border-solar-gold/25">
                        {leader.directsCount} directs
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-400 font-mono-num">
                      +${Number(leader.commissionsEarned || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/mlm?userId=${leader.id}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-[10px] font-semibold border border-white/[0.08]"
                      >
                        Inspect Tree
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Live MLM Activity Stream */}
        <GlassCard elevation={1} className="lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between border-white/[0.08]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-white">Live MLM Stream</h2>
              <Link href="/admin/commissions" className="text-[11px] text-solar-gold hover:underline">
                Commissions →
              </Link>
            </div>

            <div className="space-y-3">
              {(stats?.recentActivity || []).map((act: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#050B18]/70 border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="space-y-0.5 max-w-[210px]">
                    <span className="font-bold text-white text-[11px] block truncate">{act.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{act.description}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 whitespace-nowrap">
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <div className="py-6 text-center text-slate-500 text-[11px]">
                  No recent network events recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08] flex justify-between items-center text-[11px] text-slate-400">
            <span>Network Status: <strong className="text-emerald-400">100% Operational</strong></span>
            <Link href="/admin/audit" className="text-solar-gold hover:underline font-semibold">
              Audit Logs →
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
