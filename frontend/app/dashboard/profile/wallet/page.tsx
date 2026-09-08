'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import { Profile } from '@/types';

export default function UserWalletManagementPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState<'USDT-TRC20' | 'USDT-BEP20' | 'USDT-ERC20'>('USDT-TRC20');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(() => {
    if (user) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setProfile(data.profile);
            if (data.profile.walletAddress) setWalletAddress(data.profile.walletAddress);
            if (data.profile.walletNetwork) setNetwork(data.profile.walletNetwork);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!walletAddress || walletAddress.trim().length < 10) {
      setErrorMessage('Please enter a valid payout wallet address.');
      return;
    }

    if (!transactionPassword || !/^\d{4,8}$/.test(transactionPassword.trim())) {
      setErrorMessage('Please enter your transaction password to confirm changes.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Verify Transaction PIN
      const txRes = await fetch('/api/auth/transaction-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', transactionPassword: transactionPassword.trim() }),
      });
      const txData = await txRes.json();
      if (!txData.success) {
        setErrorMessage(txData.message || 'Invalid Transaction PIN');
        setIsSaving(false);
        return;
      }

      // 2. Update Profile in Database via API
      const patchRes = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress.trim(),
          walletNetwork: network,
          transactionPin: transactionPassword.trim(),
        }),
      });

      const patchData = await patchRes.json();
      if (patchData.success) {
        setProfile(patchData.profile || null);
        setSuccessMessage('Withdrawal wallet address updated successfully.');
        setTransactionPassword('');
      } else {
        setErrorMessage(patchData.message || 'Failed to update wallet address');
      }
    } catch {
      setErrorMessage('Failed to save wallet address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back link & Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Payout Wallet Address
        </h1>
        <p className="text-xs text-zinc-400">
          Configure the external wallet address where your withdrawal requests will be sent.
        </p>
      </div>

      {/* Wallet Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveWallet} className="space-y-4 text-xs">
          {/* Network */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium">Wallet Network:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                    network === net
                      ? 'bg-amber-400/10 border-amber-400 text-amber-400 font-semibold'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                >
                  {net.replace('USDT-', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium">Destination Wallet Address:</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Enter TRC20 or BEP20 USDT wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              {walletAddress && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-2.5 top-2 px-2 py-1 rounded-lg bg-white/[0.05] text-zinc-300 text-[10px] hover:bg-white/[0.1] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Transaction PIN */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Transaction Password:</span>
            </label>
            <input
              type="password"
              required
              placeholder="Enter transaction password to confirm"
              value={transactionPassword}
              onChange={(e) => setTransactionPassword(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-zinc-500 block">
              Required for security authorization whenever updating withdrawal destination.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving Address...' : 'Save Payout Wallet'}
          </button>
        </form>
      </div>
    </div>
  );
}
