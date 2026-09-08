'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import { useRealtime } from '@/frontend/contexts/realtime-context';
import { useToast } from '@/frontend/glass/glass-toast';
import { WithdrawalRequest, Profile } from '@/types';
import confetti from 'canvas-confetti';
import {
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  Lock,
  Wallet,
  Check,
  ArrowRight,
  Clock,
  Shield,
} from 'lucide-react';

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
      // 1. Fetch Profile & Wallets
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setProfile(data.profile);

            const wallets: ConfiguredWallet[] = [];

            if (data.profile.walletAddress) {
              wallets.push({
                id: 'primary-wallet',
                network: data.profile.walletNetwork || 'USDT-TRC20',
                address: data.profile.walletAddress,
                label: 'Primary Payout Wallet',
              });
            }

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

    if (!selectedWallet) {
      setErrorMessage('Please select a destination wallet address.');
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
      setErrorMessage('Please enter your transaction password (minimum 4 digits).');
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
          colors: ['#FBBF24', '#38BDF8'],
        });

        setSuccessMessage(
          `Withdrawal request for ${amount.toFixed(2)} USDT submitted. Net ${netAmountUsdt.toFixed(2)} USDT will be sent after review.`
        );
        success('Withdrawal Submitted', `Net ${netAmountUsdt.toFixed(2)} USDT queued for processing.`);
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Withdraw Funds
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Transfer your available balance to your external USDT wallet address.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.07] text-xs font-mono">
          <span className="text-zinc-400 block text-[10px] uppercase">Available</span>
          <strong className="text-white text-base">${(user?.availableBalance || 0).toFixed(2)} USDT</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WITHDRAWAL FORM */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-5">
          <h2 className="text-base font-semibold text-white">Withdrawal Request</h2>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitWithdrawal} className="space-y-4 text-xs">
            {/* 1. WALLET SELECTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-medium">Destination Wallet:</label>
                <Link
                  href="/dashboard/profile"
                  className="text-amber-400 hover:text-amber-300 font-medium text-[11px]"
                >
                  Manage Wallets →
                </Link>
              </div>

              {configuredWallets.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.1] text-center space-y-2">
                  <p className="text-zinc-400 text-xs">
                    No payout wallet address configured yet.
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors"
                  >
                    <span>Set up wallet address</span>
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
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-400/10 border-amber-400/40 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] text-zinc-400'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs">{w.label}</span>
                            <span className="px-1.5 py-0.2 rounded bg-white/[0.05] text-amber-400 text-[10px] font-mono">
                              {w.network}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono truncate">
                            {w.address}
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-amber-400 border-amber-400 text-black'
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
              <label className="text-zinc-300 font-medium">Amount (USDT):</label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="10"
                  max={user?.availableBalance || 0}
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setAmount(Math.floor(user?.availableBalance || 0))}
                  className="absolute right-2.5 top-2 px-2 py-1 rounded-lg bg-white/[0.05] text-amber-400 text-[10px] font-semibold hover:bg-white/[0.1]"
                >
                  MAX
                </button>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 pt-0.5">
                <span>Minimum: 10.00 USDT</span>
                <span>Available: ${(user?.availableBalance || 0).toFixed(2)} USDT</span>
              </div>
            </div>

            {/* 3. TRANSACTION PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Transaction Password:</span>
              </label>
              <input
                type="password"
                required
                placeholder="Enter transaction password"
                value={transactionPassword}
                onChange={(e) => setTransactionPassword(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-zinc-500 block">
                Required for security verification on all withdrawals.
              </span>
            </div>

            {/* Fee Breakdown */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Withdrawal Amount:</span>
                <span className="text-white font-mono">${amount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Platform Fee ({feePercent}%):</span>
                <span className="text-zinc-400 font-mono">-${feeAmountUsdt.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-white font-semibold pt-1 border-t border-white/[0.05]">
                <span>Net You Receive:</span>
                <span className="font-mono text-emerald-400">${netAmountUsdt.toFixed(2)} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || configuredWallets.length === 0}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <ArrowDownToLine className="w-3.5 h-3.5 text-black" />
                  <span>Request Withdrawal of ${netAmountUsdt.toFixed(2)} USDT</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RULES & HISTORY */}
        <div className="lg:col-span-5 space-y-5">
          {/* Rules Card */}
          <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-3">
            <h3 className="text-sm font-semibold text-white">Withdrawal Information</h3>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>Withdrawal fee is a flat 10% across all plans and balance levels.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>Minimum withdrawal amount is 10.00 USDT.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>Payouts are processed to your saved and verified wallet address.</span>
              </li>
            </ul>
          </div>

          {/* Recent Withdrawals */}
          <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-3">
            <h3 className="text-sm font-semibold text-white">Recent Withdrawals</h3>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No withdrawal records yet.</p>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {withdrawals.slice(0, 5).map((wd) => (
                  <div key={wd.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-white font-mono">
                        ${wd.amountUsdt.toFixed(2)} USDT
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {wd.createdAt ? new Date(wd.createdAt).toLocaleDateString() : 'Recent'} · Net: ${(wd.netAmountUsdt || wd.amountUsdt * 0.9).toFixed(2)}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        wd.status === 'APPROVED'
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : wd.status === 'PENDING'
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      }`}
                    >
                      {wd.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
