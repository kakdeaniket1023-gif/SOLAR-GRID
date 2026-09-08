'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  ArrowLeft,
} from 'lucide-react';
import { RechargeRecord } from '@/types';
import { GlassCard } from '@/frontend/glass';

export default function RechargeHistoryPage() {
  const { user } = useAuth();
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetch('/api/recharge/list')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.recharges) {
            setRecharges(data.recharges);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const filtered = recharges.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        (r.txReference && r.txReference.toLowerCase().includes(q)) ||
        r.destinationAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/records"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Records Center
        </Link>
        <Link
          href="/dashboard/recharge"
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow transition-all"
        >
          + New Deposit
        </Link>
      </div>

      <GlassCard elevation={2} className="p-6 sm:p-8 space-y-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-display text-white">Recharge History</h1>
            <p className="text-xs text-slate-400 font-mono">On-chain deposits submitted to your SolarGrid account</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Tx reference..."
              className="px-3.5 py-1.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.08] text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-solar-gold/50"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-mono font-semibold transition-all ${
                    statusFilter === s
                      ? 'bg-solar-gold text-[#050B18] font-bold shadow-gold-glow'
                      : 'bg-[#050B18]/70 border border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase">
                <th className="pb-3 pr-4">Recharge ID</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Network / Asset</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Tx Reference</th>
                <th className="pb-3 px-4">Admin Note</th>
                <th className="pb-3 pl-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 text-white font-bold select-all font-mono-num">{r.id}</td>
                    <td className="py-3.5 px-4 text-solar-gold font-extrabold font-mono-num">+${r.amountUsdt.toFixed(2)} USDT</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.currency}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          r.status === 'APPROVED' || r.status === 'COMPLETED'
                            ? 'bg-solar-gold/20 text-solar-gold border-solar-gold/40 shadow-gold-glow'
                            : r.status === 'PENDING' || r.status === 'UNDER_REVIEW'
                            ? 'bg-solar-amber/20 text-solar-amber border-solar-amber/40 shadow-amber-glow'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-[140px] truncate select-all">
                      {r.txReference || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{r.adminNotes || '—'}</td>
                    <td className="py-3.5 pl-4 text-right text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No recharge records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
