'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WithdrawalRequest } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { useRealtime } from '@/frontend/contexts/realtime-context';
import { useToast } from '@/frontend/glass/glass-toast';

export default function AdminWithdrawalsPage() {
  const { executeOptimisticMutation, subscribeToEvent, emitLocalEvent } = useRealtime();
  const { success, error } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    withdrawal: WithdrawalRequest | null;
    action: 'APPROVE' | 'PROCESS' | 'COMPLETE' | 'REJECT';
  }>({
    open: false,
    withdrawal: null,
    action: 'APPROVE',
  });
  const [txHash, setTxHash] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openAction = (w: WithdrawalRequest, action: 'APPROVE' | 'PROCESS' | 'COMPLETE' | 'REJECT') => {
    setActionModal({ open: true, withdrawal: w, action });
    setTxHash(w.txHash || '');
    setAdminNotes('');
    setFeedback(null);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      const data = await res.json();
      if (data.success && data.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadData();

    const unsub = subscribeToEvent('WITHDRAWAL_REQUESTED', () => {
      loadData();
    });

    return () => {
      unsub();
    };
  }, [loadData, subscribeToEvent]);

  const filtered = withdrawals.filter((w) => statusFilter === 'ALL' || w.status === statusFilter);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.withdrawal) return;

    if (actionModal.action === 'COMPLETE' && !txHash.trim()) {
      setFeedback({ type: 'error', text: 'Valid blockchain transaction hash is required to complete withdrawal.' });
      return;
    }

    setProcessing(true);
    setFeedback(null);
    const targetWdr = actionModal.withdrawal;
    const nextStatus =
      actionModal.action === 'APPROVE'
        ? 'APPROVED'
        : actionModal.action === 'COMPLETE'
        ? 'COMPLETED'
        : actionModal.action === 'PROCESS'
        ? 'PROCESSING'
        : 'REJECTED';

    await executeOptimisticMutation({
      optimisticAction: () => {
        const previousList = [...withdrawals];
        setWithdrawals((prev) =>
          prev.map((w) => (w.id === targetWdr.id ? { ...w, status: nextStatus as any } : w))
        );
        return { previousList };
      },
      serverAction: async (idempotencyKey) => {
        const res = await fetch('/api/admin/withdrawals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            withdrawalId: targetWdr.id,
            action: actionModal.action,
            txHash: actionModal.action === 'COMPLETE' ? txHash : undefined,
            adminNotes,
            idempotencyKey,
          }),
        });
        const data = await res.json();
        return { success: data.success, data, message: data.message };
      },
      onRollback: (snapshot, err) => {
        setWithdrawals(snapshot.previousList);
        setFeedback({ type: 'error', text: err });
      },
      onSuccess: () => {
        setFeedback({ type: 'success', text: `Withdrawal successfully marked as ${nextStatus}` });
        if (actionModal.action === 'COMPLETE') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFC83D', '#FF9F1C', '#3B82F6'],
          });
        }
        emitLocalEvent('WITHDRAWAL_STATUS_CHANGED', { id: targetWdr.id, status: nextStatus });
        loadData();
        setActionModal({ open: false, withdrawal: null, action: 'APPROVE' });
      },
      successTitle: `Withdrawal ${nextStatus}`,
      successMessage: `Request #${targetWdr.id.substring(0, 8)} transitioned to ${nextStatus}.`,
    });

    setProcessing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-white">Withdrawal Review & Liquidity Queue</h1>
          <p className="text-xs text-slate-400">
            Authorize disbursements, broadcast on-chain transaction hashes, or reject with automated ledger refunds.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-mono flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-solar-gold/15 border border-solar-gold/40 text-solar-gold'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {['ALL', 'PENDING', 'PROCESSING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl transition-colors whitespace-nowrap ${
              statusFilter === st
                ? 'bg-solar-gold text-[#050B18] font-bold shadow-gold-glow'
                : 'bg-[#0B1426] text-slate-400 border border-white/[0.08] hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Withdrawals Queue Table */}
      <div className="glass-1 rounded-3xl border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060D1A]/90 text-slate-400">
                <th className="p-4 font-semibold">REQUEST DATE</th>
                <th className="p-4 font-semibold">USER & EMAIL</th>
                <th className="p-4 font-semibold">REQUESTED</th>
                <th className="p-4 font-semibold">FEE</th>
                <th className="p-4 font-semibold">NET DISBURSEMENT</th>
                <th className="p-4 font-semibold">DESTINATION WALLET</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 font-semibold text-right">ADMIN ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-slate-400">{new Date(w.requestedAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{w.userName || w.userId}</div>
                    <div className="text-[10px] text-slate-400">{w.userEmail || ''}</div>
                  </td>
                  <td className="p-4 text-white font-bold font-mono-num">${(w.amountUsdt || w.amount || 0).toFixed(2)}</td>
                  <td className="p-4 text-rose-400 font-mono-num">-${(w.feeAmountUsdt || w.feeAmount || 0).toFixed(2)} ({w.feePercent}%)</td>
                  <td className="p-4 text-solar-gold font-bold font-mono-num">${(w.netAmountUsdt || w.netAmount || 0).toFixed(2)}</td>
                  <td className="p-4 text-slate-300">
                    <div className="font-bold">{w.network}</div>
                    <div className="text-slate-500 text-[10px] truncate max-w-xs">{w.walletAddress}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        w.status === 'COMPLETED'
                          ? 'bg-solar-gold/15 text-solar-gold border-solar-gold/30'
                          : w.status === 'PENDING'
                          ? 'bg-solar-amber/20 text-solar-amber border-solar-amber/30'
                          : w.status === 'PROCESSING'
                          ? 'bg-solar-blue/15 text-solar-blue border-solar-blue/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    {w.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openAction(w, 'PROCESS')}
                          className="px-2.5 py-1 rounded-xl bg-solar-blue/15 hover:bg-solar-blue/30 border border-solar-blue/40 text-solar-blue font-bold text-[11px]"
                        >
                          Process
                        </button>
                        <button
                          onClick={() => openAction(w, 'COMPLETE')}
                          className="px-2.5 py-1 rounded-xl bg-solar-gold/15 hover:bg-solar-gold/30 border border-solar-gold/40 text-solar-gold font-bold text-[11px]"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => openAction(w, 'REJECT')}
                          className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 font-bold text-[11px]"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {w.status === 'PROCESSING' && (
                      <button
                        onClick={() => openAction(w, 'COMPLETE')}
                        className="px-3 py-1 rounded-xl bg-solar-gold hover:bg-amber-400 text-[#050B18] font-bold text-[11px] shadow-gold-glow"
                      >
                        Complete with Tx
                      </button>
                    )}
                    {w.status === 'COMPLETED' && (
                      <span className="text-[10px] text-solar-gold font-bold">Disbursed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Processing Modal */}
      {actionModal.open && actionModal.withdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B18]/85 backdrop-blur-md animate-in fade-in">
          <div className="glass-1 p-6 sm:p-8 rounded-3xl border border-solar-gold/50 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActionModal({ open: false, withdrawal: null, action: 'APPROVE' })}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-solar-gold font-bold uppercase tracking-wider">
                ADMIN DISBURSEMENT ACTION
              </span>
              <h3 className="text-lg font-bold text-white">
                {actionModal.action} Withdrawal #{actionModal.withdrawal.id.substring(0, 8)}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                User: <strong className="text-white">{actionModal.withdrawal.userName || actionModal.withdrawal.userId}</strong> • Net Amount:{' '}
                <strong className="text-solar-gold font-mono-num">${(actionModal.withdrawal.netAmountUsdt || actionModal.withdrawal.netAmount || 0).toFixed(2)} USDT</strong>
              </p>
            </div>

            <form onSubmit={handleExecuteAction} className="space-y-4 text-xs font-mono">
              {actionModal.action === 'COMPLETE' && (
                <div>
                  <label className="block text-slate-300 mb-1">On-Chain Transaction Reference (TxHash)</label>
                  <input
                    type="text"
                    required
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2 text-white"
                    placeholder="0x..."
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1">Audit Notes / Reason</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2 text-white"
                  placeholder="Notes for audit log and user notification..."
                />
              </div>

              {actionModal.action === 'REJECT' && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px]">
                  Rejecting will immediately refund {(actionModal.withdrawal.amountUsdt || actionModal.withdrawal.amount || 0).toFixed(2)} USDT back to the user&apos;s available balance with an ADJUSTMENT ledger record.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, withdrawal: null, action: 'APPROVE' })}
                  className="flex-1 py-2.5 rounded-2xl bg-[#0B1426] border border-white/[0.08] text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold shadow-gold-glow"
                >
                  {processing ? 'Executing...' : `Confirm ${actionModal.action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
