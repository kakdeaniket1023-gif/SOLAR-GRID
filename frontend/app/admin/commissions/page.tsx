'use client';

import React, { useState, useEffect } from 'react';
import { DirectCommission, DirectCommissionStatus } from '@/types';
import {
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  Layers,
  Shield,
  Download,
} from 'lucide-react';
import { GlassCard, GlassBadge } from '@/frontend/glass';

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<DirectCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/admin/commissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCommissions(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = commissions.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (levelFilter === 'L1' && c.level !== 1) return false;
    if (levelFilter === 'L2' && c.level !== 2) return false;
    if (levelFilter === 'L3' && c.level !== 3) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const orderMatch = (c.orderNo || c.orderId).toLowerCase().includes(q);
      const benMatch = (c.beneficiaryName || c.beneficiaryId).toLowerCase().includes(q);
      const buyerMatch = (c.buyerName || '').toLowerCase().includes(q);
      return orderMatch || benMatch || buyerMatch;
    }
    return true;
  });

  const totalCommissionsUsdt = commissions
    .filter((c) => c.status === 'APPROVED' || c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  const l1TotalUsdt = commissions
    .filter((c) => (c.status === 'APPROVED' || c.status === 'PAID') && c.level === 1)
    .reduce((sum, c) => sum + c.amount, 0);

  const l2TotalUsdt = commissions
    .filter((c) => (c.status === 'APPROVED' || c.status === 'PAID') && c.level === 2)
    .reduce((sum, c) => sum + c.amount, 0);

  const clawedBackTotalUsdt = commissions
    .filter((c) => c.status === 'CLAWED_BACK')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] bg-[#0B1426]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/25 text-solar-gold text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              MLM Direct-Selling Overrides
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-2">
              Referral Commissions Audit Ledger
            </h1>
            <p className="text-xs text-slate-400">
              Audit all multi-tier MLM referral commissions generated from solar panel purchases (Level 1: 10%, Level 2: 3%, Level 3: 1%).
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08]">
          <span className="text-[11px] text-slate-400 font-medium">Total Paid / Approved</span>
          <div className="text-2xl font-bold font-mono text-solar-gold mt-1">
            ${totalCommissionsUsdt.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDT</span>
          </div>
          <span className="text-[10px] text-emerald-400">All MLM Tier Overrides</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08]">
          <span className="text-[11px] text-slate-400 font-medium">Level 1 Direct (10%)</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            ${l1TotalUsdt.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDT</span>
          </div>
          <span className="text-[10px] text-slate-400">Direct Sponsor Commission</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08]">
          <span className="text-[11px] text-slate-400 font-medium">Level 2 Indirect (3%)</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            ${l2TotalUsdt.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDT</span>
          </div>
          <span className="text-[10px] text-slate-400">Second-Tier Sponsor Override</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08]">
          <span className="text-[11px] text-slate-400 font-medium">Level 3 Extended (1%)</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            ${commissions.filter(c => (c.status === 'APPROVED' || c.status === 'PAID') && c.level === 3).reduce((s, c) => s + c.amount, 0).toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDT</span>
          </div>
          <span className="text-[10px] text-purple-400">Third-Tier Community Bonus</span>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase mr-1">Status:</span>
          {['ALL', 'APPROVED', 'PAID', 'CLAWED_BACK'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-solar-gold text-slate-950 shadow-sm'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}

          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase ml-3 mr-1">Tier:</span>
          {[
            { id: 'ALL', label: 'All Tiers' },
            { id: 'L1', label: 'L1 (10%)' },
            { id: 'L2', label: 'L2 (3%)' },
            { id: 'L3', label: 'L3 (1%)' },
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setLevelFilter(tier.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                levelFilter === tier.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, beneficiary, buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B1426] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-gold/50"
          />
        </div>
      </div>

      {/* Table */}
      <GlassCard elevation={1} className="rounded-3xl border-white/[0.08] overflow-hidden bg-[#0B1426]">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading commissions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No direct commissions matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Commission ID</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Beneficiary</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((comm) => (
                  <tr key={comm.id} className="hover:bg-white/[0.02] text-slate-300">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {comm.id.substring(0, 10)}...
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      #{comm.orderNo || comm.orderId.substring(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-solar-gold font-mono">L{comm.level}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{comm.rate}%</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{comm.beneficiaryName || 'Distributor'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{comm.beneficiaryId.substring(0, 8)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      ${comm.amount.toFixed(2)} USDT
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          comm.status === 'APPROVED' || comm.status === 'PAID'
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                            : comm.status === 'CLAWED_BACK'
                            ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                            : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        }`}
                      >
                        {comm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(comm.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
