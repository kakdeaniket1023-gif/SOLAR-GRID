'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useRealtime } from '@/lib/realtime/realtime-context';
import { useToast } from '@/components/glass/glass-toast';
import { WithdrawalRequest, Profile } from '@/types';
import confetti from 'canvas-confetti';
import {
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  Lock,
  Wallet,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassTable,
  GlassTableHeader,
  GlassTableRow,
  GlassTableCell,
} from '@/components/glass';

interface ConfiguredWallet {
  id: string;
  network: string;
  address: string;
  label?: string;
}

export default function WithdrawalPage() {
  const { user, refreshUser } = useAuth();
  const { emitLocalEvent } = useRealtime();
  const { success, error } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [configuredWallets, setConfiguredWallets] = useState<ConfiguredWallet[]>([]);

  // Form Fields
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState<number>(50);
  const [transactionPassword, setTransactionPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (user) {
      // 1. Fetch Profile & Configured Wallets
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setProfile(data.profile);

            const wallets: ConfiguredWallet[] = [];

            // Primary wallet from profile
            if (data.profile.walletAddress) {
              wallets.push({
                id: 'primary-wallet',
                network: data.profile.walletNetwork || 'USDT-TRC20',
                address: data.profile.walletAddress,
                label: 'Primary Payout Wallet',
              });
            }

            // Check if extra wallets stored in bio / metadata
            if (data.profile.bio && data.profile.bio.startsWith('{')) {
              try {
                const parsed = JSON.parse(data.profile.bio);
                if (Array.isArray(parsed.extraWallets)) {
                  parsed.extraWallets.forEach((w: any, idx: number) => {
                    if (w.address && w.address !== data.profile.walletAddress) {
                      wallets.push({
                        id: `wallet-${idx + 1}`,
                        network: w.network || 'USDT-TRC20',
                        address: w.address,
                        label: w.label || `Wallet #${idx + 2}`,
                      });
                    }
                  });
                }
              } catch {}
            }

            setConfiguredWallets(wallets);
            if (wallets.length > 0 && !selectedWalletId) {
              setSelectedWalletId(wallets[0].id);
            }
          }
        })
        .catch(() => {});

      // 2. Fetch Withdrawal History
      fetch('/api/withdrawals/request')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.withdrawals) {
            setWithdrawals(data.withdrawals);
          }
        })
        .catch(() => {});
    }
  }, [user, selectedWalletId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedWallet = configuredWallets.find((w) => w.id === selectedWalletId);

  // Fee calculation (standard 10%)
  const feePercent = 10;
  const feeAmountUsdt = Math.round(((amount * feePercent) / 100) * 100) / 100;
  const netAmountUsdt = Math.max(0, Math.round((amount - feeAmountUsdt) * 100) / 100);

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Wallet selection validation
    if (!selectedWallet) {
      setErrorMessage('Please select a destination wallet address before submitting.');
      return;
    }

    if (!amount || isNaN(amount) || amount < 10) {
      setErrorMessage('Minimum withdrawal amount is 10.00 USDT.');
      return;
    }

    if (amount > (user.availableBalance || 0)) {
      setErrorMessage(`Insufficient balance. Your available balance is ${(user.availableBalance || 0).toFixed(2)} USDT.`);
      return;
    }

    if (!transactionPassword || transactionPassword.trim().length < 4) {
      setErrorMessage('Please enter your valid transaction password (minimum 4 digits).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsdt: amount,
          walletAddress: selectedWallet.address,
          network: selectedWallet.network,
          transactionPassword: transactionPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FFC83D', '#38BDF8'],
        });

        setSuccessMessage(
          `Withdrawal request #${data.withdrawal?.id || 'SUBMITTED'} of ${amount.toFixed(2)} USDT submitted successfully. Status: PENDING verification.`
        );
        success('Withdrawal Request Submitted', `Net ${netAmountUsdt.toFixed(2)} USDT dispatched to queue.`);
        setTransactionPassword('');
        refreshUser();
        loadData();
        emitLocalEvent('WITHDRAWAL_STATUS_CHANGED', {});
      } else {
        setErrorMessage(data.message || 'Withdrawal submission failed. Please check your transaction password.');
      }
    } catch {
      setErrorMessage('Network error while processing withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
            USDT Withdrawal
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Request on-chain settlements to your verified destination wallet addresses.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-[#0B152A] border border-white/[0.08] text-xs font-mono">
          <span className="text-slate-400">Available: </span>
          <strong className="text-solar-gold font-mono-num">${(user?.availableBalance || 0).toFixed(2)} USDT</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* WITHDRAWAL FORM */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard elevation={2} className="p-6 sm:p-7 rounded-3xl border-white/[0.08] shadow-2xl space-y-5">
            <h2 className="text-base font-bold font-display text-white border-b border-white/[0.08] pb-3 flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-solar-gold" />
              <span>Withdrawal Form</span>
            </h2>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-solar-gold" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitWithdrawal} className="space-y-5 font-mono text-xs">
              {/* 1. WALLET SELECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold uppercase text-[10px] flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-solar-gold" />
                    <span>Select Destination Wallet Address:</span>
                  </label>
                  <Link
                    href="/dashboard/profile"
                    className="text-[10px] text-solar-gold hover:underline font-bold"
                  >
                    + Add/Edit Wallets
                  </Link>
                </div>

                {configuredWallets.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#050B18] border border-dashed border-amber-500/40 text-center space-y-2">
                    <p className="text-amber-300 text-[11px]">
                      No withdrawal wallet address configured yet.
                    </p>
                    <Link
                      href="/dashboard/profile"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-[10px] font-bold"
                    >
                      <span>Configure Wallet in Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {configuredWallets.map((w) => {
                      const isSelected = selectedWalletId === w.id;

                      return (
                        <div
                          key={w.id}
                          onClick={() => setSelectedWalletId(w.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-solar-gold/15 border-solar-gold shadow-gold-glow'
                              : 'bg-[#050B18] border-white/[0.08] hover:border-slate-500'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{w.label}</span>
                              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-solar-gold text-[9px] font-bold">
                                {w.network}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              {w.address}
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-solar-gold border-solar-gold text-[#050B18]'
                                : 'border-white/[0.2]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. WITHDRAWAL AMOUNT */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">
                  Withdrawal Amount (USDT):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max={user?.availableBalance || 0}
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(Math.floor(user?.availableBalance || 0))}
                    className="absolute right-2.5 top-2 px-2.5 py-1 rounded-lg bg-solar-gold/20 text-solar-gold text-[10px] font-bold hover:bg-solar-gold/30"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Minimum: 10.00 USDT</span>
                  <span>Available: ${(user?.availableBalance || 0).toFixed(2)} USDT</span>
                </div>
              </div>

              {/* 3. TRANSACTION PASSWORD */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-solar-gold" />
                  <span>Enter Transaction Password:</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter 4–8 digit transaction password"
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm"
                />
                <span className="text-[10px] text-slate-500 block">
                  Configured in Profile Settings. Used to authenticate all withdrawals.
                </span>
              </div>

              {/* Breakdown Summary */}
              <div className="p-3.5 rounded-2xl bg-[#050B18] border border-white/[0.06] space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Withdrawal:</span>
                  <span className="text-white">${amount.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Standard Platform Fee ({feePercent}%):</span>
                  <span className="text-rose-400">-${feeAmountUsdt.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-white/[0.06] text-xs">
                  <span>Net Expected Receipt:</span>
                  <span>${netAmountUsdt.toFixed(2)} USDT</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || configuredWallets.length === 0}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-solar-gold via-solar-amber to-amber-500 text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Transmitting Request...</span>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Confirm & Submit Withdrawal</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* SIDE INSTRUCTIONS */}
        <div className="lg:col-span-5 space-y-5">
          <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Withdrawal Policy</span>
            </h3>
            <ul className="space-y-2 text-slate-400 text-[11px] font-sans">
              <li className="flex items-start gap-1.5">
                <span className="text-solar-gold font-bold">•</span>
                <span>Withdrawals are processed Monday through Friday during operating hours.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-solar-gold font-bold">•</span>
                <span>Minimum withdrawal threshold is 10.00 USDT.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-solar-gold font-bold">•</span>
                <span>Strict transaction password verification prevents unauthorized withdrawals.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-solar-gold font-bold">•</span>
                <span>Destination wallet addresses must be verified and configured in your profile.</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* WITHDRAWAL RECORDS / HISTORY */}
      <div className="space-y-4 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-solar-gold" />
            <h2 className="text-lg font-bold font-display text-white">
              Withdrawal Records & History
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {withdrawals.length} Total Requests
          </span>
        </div>

        <GlassCard elevation={1} className="rounded-3xl border-white/[0.08] overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-mono">
              No withdrawal records yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableCell isHeader>REQUEST ID</GlassTableCell>
                    <GlassTableCell isHeader>AMOUNT</GlassTableCell>
                    <GlassTableCell isHeader>NET RECEIPT</GlassTableCell>
                    <GlassTableCell isHeader>DESTINATION WALLET</GlassTableCell>
                    <GlassTableCell isHeader>DATE / TIME</GlassTableCell>
                    <GlassTableCell isHeader>STATUS</GlassTableCell>
                  </GlassTableRow>
                </GlassTableHeader>
                <tbody>
                  {withdrawals.map((w) => (
                    <GlassTableRow key={w.id}>
                      <GlassTableCell>
                        <span className="font-mono text-xs text-slate-400">{w.id.substring(0, 8)}...</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <strong className="font-mono text-white text-xs">${w.amountUsdt.toFixed(2)} USDT</strong>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="font-mono text-emerald-400 font-bold text-xs">
                          ${(w.netAmountUsdt || w.amountUsdt).toFixed(2)} USDT
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <div className="text-[11px] font-mono text-slate-300 max-w-[180px] truncate">
                          {w.walletAddress}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">{w.network}</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {new Date(w.requestedAt || (w as any).createdAt).toLocaleString()}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <GlassBadge
                          variant={
                            w.status === 'COMPLETED' || w.status === 'APPROVED'
                              ? 'emerald'
                              : w.status === 'PENDING' || w.status === 'PROCESSING'
                              ? 'amber'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {w.status}
                        </GlassBadge>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </tbody>
              </GlassTable>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
