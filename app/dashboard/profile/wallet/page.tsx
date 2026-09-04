'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Copy,
  Check,
} from 'lucide-react';
import { Profile } from '@/types';
import { GlassCard, GlassButton } from '@/components/glass';

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

    if (!transactionPassword || !/^\d{6}$/.test(transactionPassword)) {
      setErrorMessage('Please enter your 6-digit Transaction PIN to confirm wallet modification.');
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
        body: JSON.stringify({ action: 'VERIFY', transactionPassword }),
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
        }),
      });

      const patchData = await patchRes.json();
      if (patchData.success) {
        setProfile(patchData.profile || null);
        setSuccessMessage('Receiving wallet address updated and verified successfully.');
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile & Security
        </Link>
      </div>

      {/* Main Card */}
      <GlassCard elevation={2} className="p-6 sm:p-8 space-y-6 border-white/[0.08]">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
          <div className="w-10 h-10 rounded-2xl bg-solar-gold/20 border border-solar-gold/40 flex items-center justify-center text-solar-gold shadow-gold-glow">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-white">Payout Receiving Wallet</h1>
            <p className="text-xs text-slate-400 font-mono">Protected by 6-digit Transaction Password</p>
          </div>
        </div>

        {/* Current Verified Address Pill */}
        {profile?.walletAddress ? (
          <div className="p-4 rounded-2xl bg-[#050B18]/90 border border-solar-gold/40 space-y-2 font-mono text-xs shadow-gold-glow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-solar-gold font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Payout Destination
              </span>
              <span className="text-[10px] text-slate-400">{profile.walletNetwork || 'USDT-TRC20'}</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0B1426] border border-white/[0.08] text-slate-200 break-all select-all">
              <span>{profile.walletAddress}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-solar-gold" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#050B18]/70 border border-solar-gold/40 text-xs font-mono text-solar-gold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>No receiving wallet currently registered. Please configure your address below.</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSaveWallet} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase block mb-1.5 font-semibold">Network Protocol</label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-2 rounded-2xl font-bold border transition-all ${
                    network === net
                      ? 'bg-solar-gold/20 text-solar-gold border-solar-gold/60 shadow-gold-glow'
                      : 'bg-[#050B18]/70 border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 uppercase block mb-1.5 font-semibold">USDT Receiving Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="e.g. TRON TRC-20 Address (starts with T) or BEP-20 (0x...)"
              required
              className="w-full px-4 py-3 rounded-xl glass-input border-white/[0.08] text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-solar-gold uppercase block mb-1.5 flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" /> 6-Digit Transaction PIN Confirmation
            </label>
            <input
              type="password"
              maxLength={6}
              value={transactionPassword}
              onChange={(e) => setTransactionPassword(e.target.value)}
              placeholder="•••••• (6 digits)"
              required
              className="w-full px-4 py-3 rounded-xl bg-[#050B18]/80 border border-solar-gold/40 focus:border-solar-gold text-white text-center tracking-widest text-base font-mono outline-none shadow-inner"
            />
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Required to authorize any wallet address modification.
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <GlassButton
            variant="primary"
            size="lg"
            className="w-full font-bold text-[#050B18] shadow-gold-glow"
            type="submit"
            isLoading={isSaving}
          >
            Save & Verify Payout Address
          </GlassButton>
        </form>

        <div className="p-3 rounded-2xl bg-[#050B18]/60 border border-white/[0.06] text-[10px] font-mono text-slate-400 text-center">
          Security Note: Private keys and seed phrases are never stored or requested by SolarGrid.
        </div>
      </GlassCard>
    </div>
  );
}
