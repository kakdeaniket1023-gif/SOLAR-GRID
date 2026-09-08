'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  ArrowLeft,
} from 'lucide-react';
import { WithdrawalRequest } from '@/types';
import { GlassCard } from '@/frontend/glass';

export default function WithdrawalRecordsPage() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (user) {
      fetch('/api/withdrawals/request')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.withdrawals) {
            setWithdrawals(data.withdrawals);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const filtered = withdrawals.filter((w) => {
    if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
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
          href="/dashboard/withdrawal"
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow transition-all"
        >
          + Request Withdrawal
        </Link>
      </div>

      <GlassCard elevation={2} className="p-6 sm:p-8 space-y-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-display text-white">Withdrawal Records</h1>
            <p className="text-xs text-slate-400 font-mono">Disbursement requests, fee deductions, and on-chain tx hashes</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'PENDING', 'PROCESSING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map((s) => (
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

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase">
                <th className="pb-3 pr-4">Request ID</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Fee (%)</th>
                <th className="pb-3 px-4">Net Payout</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Receiving Wallet</th>
                <th className="pb-3 px-4">Tx Hash</th>
                <th className="pb-3 pl-4 text-right">Requested At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length > 0 ? (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 text-white font-bold select-all font-mono-num">{w.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-mono-num">${w.amountUsdt.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-rose-400 font-mono-num">-${w.feeAmountUsdt.toFixed(2)} ({w.feePercent}%)</td>
                    <td className="py-3.5 px-4 text-solar-gold font-extrabold font-mono-num">${w.netAmountUsdt.toFixed(2)} USDT</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          w.status === 'COMPLETED' || w.status === 'APPROVED'
                            ? 'bg-solar-gold/20 text-solar-gold border-solar-gold/40 shadow-gold-glow'
                            : w.status === 'PENDING' || w.status === 'PROCESSING'
                            ? 'bg-solar-amber/20 text-solar-amber border-solar-amber/40 shadow-amber-glow'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-[120px] truncate select-all">{w.walletAddress}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-[120px] truncate select-all font-mono-num">{w.txHash || 'Pending'}</td>
                    <td className="py-3.5 pl-4 text-right text-slate-400 text-[11px]">
                      {new Date(w.requestedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No withdrawal requests found.
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
