'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  DollarSign,
  Search,
} from 'lucide-react';
import { RechargeRecord } from '@/types';
import { GlassCard } from '@/frontend/glass';

import { useRealtime } from '@/frontend/contexts/realtime-context';
import { useToast } from '@/frontend/glass/glass-toast';

export default function AdminRechargeDeskPage() {
  const { user } = useAuth();
  const { executeOptimisticMutation, subscribeToEvent, emitLocalEvent } = useRealtime();
  const { success, error } = useToast();
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [selectedRecharge, setSelectedRecharge] = useState<RechargeRecord | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/recharges');
      const data = await res.json();
      if (data.success && data.recharges) {
        setRecharges(data.recharges);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadData();

    const unsub = subscribeToEvent('RECHARGE_SUBMITTED', () => {
      loadData();
    });

    return () => {
      unsub();
    };
  }, [loadData, subscribeToEvent]);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRecharge || !user) return;
    setIsProcessing(true);
    const targetRch = selectedRecharge;
    const nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await executeOptimisticMutation({
      optimisticAction: () => {
        const previousList = [...recharges];
        setRecharges((prev) =>
          prev.map((r) => (r.id === targetRch.id ? { ...r, status: nextStatus as any } : r))
        );
        return { previousList };
      },
      serverAction: async (idempotencyKey) => {
        const res = await fetch('/api/admin/recharges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rechargeId: targetRch.id,
            action,
            adminNotes: adminNote || (action === 'APPROVE' ? 'Approved on-chain verified deposit' : 'Deposit rejected by finance desk'),
            idempotencyKey,
          }),
        });
        const data = await res.json();
        return { success: data.success, data, message: data.message };
      },
      onRollback: (snapshot, err) => {
        setRecharges(snapshot.previousList);
        error('Action Failed', err);
      },
      onSuccess: () => {
        setSelectedRecharge(null);
        setAdminNote('');
        emitLocalEvent('RECHARGE_STATUS_CHANGED', { id: targetRch.id, status: nextStatus });
        loadData();
      },
      successTitle: `Deposit ${nextStatus}`,
      successMessage: `Recharge #${targetRch.id.substring(0, 8)} (${targetRch.amountUsdt} USDT) marked as ${nextStatus}.`,
    });

    setIsProcessing(false);
  };

  const filtered = recharges.filter((r) => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        (r.userName && r.userName.toLowerCase().includes(q)) ||
        (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
        (r.txReference && r.txReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = recharges.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-solar-gold/15 text-solar-gold border border-solar-gold/30 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            CAPITAL DEPOSIT OPERATIONS
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Recharge Processing Desk</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Review submitted on-chain deposit hashes, verify blockchain settlements, and credit balances.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-solar-gold/40 text-center font-mono shadow-gold-glow">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Pending Review Queue</span>
          <span className="text-xl font-bold text-solar-gold font-mono-num">{pendingCount} Requests</span>
        </div>
      </GlassCard>

      {/* Main Table Card */}
      <GlassCard elevation={1} className="rounded-3xl p-6 space-y-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-mono font-bold transition-all ${
                  filter === f
                    ? 'bg-solar-gold text-[#050B18] font-extrabold shadow-gold-glow'
                    : 'bg-[#050B18]/70 border border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, TX hash, deposit ID..."
              className="w-full glass-input border-white/[0.08] pl-10 pr-4 py-2 rounded-xl text-white text-xs font-mono"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase">
                <th className="pb-3 pr-4">Deposit ID</th>
                <th className="pb-3 px-4">User</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Network</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Tx Reference</th>
                <th className="pb-3 px-4">Submitted At</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 text-solar-gold font-bold select-all font-mono-num">{r.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{r.userName || r.userId}</span>
                      <span className="text-[10px] text-slate-400 block">{r.userEmail || ''}</span>
                    </td>
                    <td className="py-3.5 px-4 text-solar-gold font-extrabold text-sm font-mono-num">
                      +${r.amountUsdt.toFixed(2)} USDT
                    </td>
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
                      {r.txReference || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      {r.status === 'PENDING' || r.status === 'UNDER_REVIEW' ? (
                        <button
                          onClick={() => setSelectedRecharge(r)}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-extrabold text-[11px] shadow-gold-glow transition-all"
                        >
                          Review Desk
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No recharge records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Review Modal */}
      {selectedRecharge && (
        <div className="fixed inset-0 z-50 bg-[#050B18]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl glass-1 border border-solar-gold/50 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white font-display">Review Deposit #{selectedRecharge.id}</h3>
              <button onClick={() => setSelectedRecharge(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 font-mono text-xs p-4 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <div className="flex justify-between">
                <span className="text-slate-400">User Account:</span>
                <span className="text-white font-bold">{selectedRecharge.userName || selectedRecharge.userId} ({selectedRecharge.userEmail || ''})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit Amount:</span>
                <span className="text-solar-gold font-extrabold text-sm font-mono-num">+${selectedRecharge.amountUsdt.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network & Protocol:</span>
                <span className="text-solar-amber font-bold">{selectedRecharge.currency}</span>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.08]">
                <span className="text-slate-400 text-[10px] font-semibold">TRANSACTION HASH / PROOF:</span>
                <span className="text-slate-200 select-all break-all bg-black/50 p-2 rounded-xl border border-white/10 text-[11px]">
                  {selectedRecharge.txReference || 'No hash provided'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1 font-semibold">Auditor Review Notes</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Optional verification notes (e.g. Block confirmation verified)..."
                rows={2}
                className="w-full p-3 rounded-xl glass-input border-white/[0.08] text-white text-xs font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleAction('REJECT')}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-2xl bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/40 text-rose-400 font-bold text-xs transition-colors"
              >
                Reject Deposit
              </button>
              <button
                onClick={() => handleAction('APPROVE')}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-extrabold text-xs shadow-gold-glow transition-all"
              >
                Approve & Credit Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
