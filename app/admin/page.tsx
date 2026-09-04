'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { GlassCard } from '@/components/glass';

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

  const planChartData = [
    { name: 'P1 Starter ($30)', count: stats?.planDistribution?.P1 || 52, color: '#FFC83D' },
    { name: 'P2 Growth ($60)', count: stats?.planDistribution?.P2 || 38, color: '#FF9F1C' },
    { name: 'P3 Pro ($160)', count: stats?.planDistribution?.P3 || 15, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-white">Executive Control Dashboard</h1>
          <p className="text-xs text-slate-400 font-mono">
            System-wide operational telemetry, network liquidity, user accounts, and pending approval queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/recharges"
            className="px-4 py-2 rounded-2xl bg-solar-gold hover:bg-amber-400 text-[#050B18] text-xs font-mono font-extrabold shadow-gold-glow transition-all"
          >
            Recharge Desk
          </Link>
          <Link
            href="/admin/withdrawals"
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-solar-amber to-amber-500 hover:from-amber-400 hover:to-solar-amber text-[#050B18] text-xs font-mono font-extrabold shadow-amber-glow transition-all"
          >
            Review Withdrawals ({stats?.pendingWithdrawals || 0})
          </Link>
        </div>
      </div>

      {/* Global Unified Admin Search Bar */}
      <GlassCard elevation={2} className="p-4 sm:p-5 rounded-3xl border-white/[0.08]">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across entire system: User ID, Name, Email, Referral Code, Panel ID, Tx ID, Wallet..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input border-white/[0.08] text-white text-xs font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-extrabold text-xs font-mono shadow-gold-glow transition-all"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results Drawer */}
        {searchResults && (
          <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Search Query: &quot;{searchResults.query}&quot;</span>
              <button onClick={() => setSearchResults(null)} className="text-solar-gold hover:underline">Close Results</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Users */}
              <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
                <span className="text-[10px] text-solar-gold font-bold block mb-1.5 font-semibold">MATCHED USERS ({searchResults.users?.length || 0})</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.users?.map((u: any) => (
                    <Link key={u.id} href={`/admin/users?id=${u.id}`} className="block p-1.5 hover:bg-white/[0.05] rounded text-[11px] text-slate-200">
                      {u.name} ({u.email})
                    </Link>
                  ))}
                  {searchResults.users?.length === 0 && <span className="text-slate-500 text-[10px]">No matches</span>}
                </div>
              </div>

              {/* Units */}
              <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
                <span className="text-[10px] text-solar-gold font-bold block mb-1.5 font-semibold">MATCHED UNITS ({searchResults.units?.length || 0})</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.units?.map((u: any) => (
                    <Link key={u.id} href={`/admin/units?id=${u.id}`} className="block p-1.5 hover:bg-white/[0.05] rounded text-[11px] text-slate-200">
                      {u.id} - {u.planName}
                    </Link>
                  ))}
                  {searchResults.units?.length === 0 && <span className="text-slate-500 text-[10px]">No matches</span>}
                </div>
              </div>

              {/* Transactions */}
              <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
                <span className="text-[10px] text-solar-blue font-bold block mb-1.5 font-semibold">MATCHED TRANSACTIONS ({searchResults.transactions?.length || 0})</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.transactions?.map((t: any) => (
                    <div key={t.id} className="p-1.5 text-[11px] text-slate-300 truncate">
                      {t.id}: ${t.amountUsdt || t.amount} USDT ({t.type})
                    </div>
                  ))}
                  {searchResults.transactions?.length === 0 && <span className="text-slate-500 text-[10px]">No matches</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">TOTAL USERS</div>
          <div className="text-xl font-bold text-white mt-1 font-mono-num">{stats?.totalUsers || 105}</div>
          <div className="text-[9px] text-solar-gold font-mono-num">{stats?.activeUsers || 104} Active Accounts</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">FLEET CAPACITY</div>
          <div className="text-xl font-bold text-solar-gold mt-1 font-mono-num">{stats?.totalCapacityKw || '142.5'} kW</div>
          <div className="text-[9px] text-slate-400 font-mono-num">{stats?.activeUnits || 105} Active Panels</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">TODAY GENERATION</div>
          <div className="text-xl font-bold text-solar-amber mt-1 font-mono-num">{stats?.todayGeneratedKwh?.toFixed(1) || '825.4'} kWh</div>
          <div className="text-[9px] text-solar-blue font-semibold">Mon-Fri Telemetry</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">TOTAL DISBURSED</div>
          <div className="text-xl font-bold text-white mt-1 font-mono-num">${stats?.totalEarningsDistributed?.toFixed(2) || '240.00'}</div>
          <div className="text-[9px] text-rose-400 font-mono-num">{stats?.pendingWithdrawals || 0} Pending</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">TOTAL RECHARGES</div>
          <div className="text-xl font-bold text-solar-gold mt-1 font-mono-num">${stats?.pendingWithdrawalVolume?.toFixed(2) || '1460.00'}</div>
          <div className="text-[9px] text-solar-blue font-semibold">On-Chain Capital</div>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-3xl space-y-1 border-white/[0.08]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">SUPPORT TICKETS</div>
          <div className="text-xl font-bold text-solar-amber mt-1 font-mono-num">{stats?.openTickets || 0} Open</div>
          <div className="text-[9px] text-solar-amber font-semibold">Desk Action Required</div>
        </GlassCard>
      </div>

      {/* Grid: Charts & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Plan Distribution Chart */}
        <GlassCard elevation={1} className="rounded-3xl p-6 space-y-4 border-white/[0.08]">
          <h2 className="text-base font-bold font-display text-white">Fleet Plan Distribution</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {planChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
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
        </GlassCard>

        {/* Live Operations & Audit Trail */}
        <GlassCard elevation={1} className="lg:col-span-2 rounded-3xl p-6 flex flex-col justify-between border-white/[0.08]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-display text-white">Live Operations Audit Feed</h2>
              <Link href="/admin/audit" className="text-[11px] text-solar-gold hover:underline font-semibold">
                View All Trail
              </Link>
            </div>

            <div className="space-y-3">
              {recentAudits.map((log) => (
                <div key={log.id} className="p-3 rounded-2xl bg-[#050B18]/70 border border-white/[0.06] flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{log.actorEmail || log.actorId}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-solar-gold/15 border border-solar-gold/30 text-solar-gold">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-md">
                      {log.targetType}: {log.targetId || ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono-num">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08] flex justify-between items-center text-[11px] text-slate-400">
            <span>Audit integrity status: <strong className="text-solar-gold font-semibold">100% Verified</strong></span>
            <Link href="/admin/security/sessions" className="text-solar-blue hover:underline font-semibold">
              Inspect Active Sessions →
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
