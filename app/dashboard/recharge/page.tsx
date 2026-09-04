'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RechargeRecord } from '@/types';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassInput,
} from '@/components/glass';

import { useRealtime } from '@/lib/realtime/realtime-context';
import { useToast } from '@/components/glass/glass-toast';

export default function RechargePage() {
  const { user, refreshUser } = useAuth();
  const { executeOptimisticMutation, subscribeToEvent, emitLocalEvent } = useRealtime();
  const { success, error } = useToast();
  const [amount, setAmount] = useState<number>(60);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('60');
  const [network, setNetwork] = useState<'USDT-TRC20' | 'USDT-BEP20' | 'USDT-ERC20'>('USDT-TRC20');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentRecharges, setRecentRecharges] = useState<RechargeRecord[]>([]);

  const depositAddresses = {
    'USDT-TRC20': 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
    'USDT-BEP20': '0x71C568b892F1c37E1542aB6d71b3058a9e401b2a',
    'USDT-ERC20': '0x71C568b892F1c37E1542aB6d71b3058a9e401b2a',
  };

  const depositAddress = depositAddresses[network];

  const loadData = useCallback(() => {
    if (user) {
      fetch('/api/recharge/list')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.recharges) {
            setRecentRecharges(data.recharges);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    loadData();

    // Subscribe to live Realtime events
    const unsub = subscribeToEvent('RECHARGE_STATUS_CHANGED', () => {
      loadData();
      refreshUser();
    });

    return () => {
      unsub();
    };
  }, [loadData, subscribeToEvent, refreshUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPreset = (val: number) => {
    setIsCustom(false);
    setAmount(val);
    setCustomAmountInput(val.toString());
    setErrorMessage(null);
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    const num = parseFloat(customAmountInput);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmountInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      setAmount(parsed);
      setErrorMessage(null);
    } else if (val === '') {
      setAmount(0);
    }
  };

  const handleSubmitRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!amount || isNaN(amount) || amount < 10) {
      setErrorMessage('Minimum recharge amount is 10.00 USDT. Please enter a valid deposit amount.');
      return;
    }

    if (!txHash || txHash.trim().length < 8) {
      setErrorMessage('Please enter a valid on-chain transaction hash or transfer reference.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    await executeOptimisticMutation({
      optimisticAction: () => {
        const previousRecharges = [...recentRecharges];
        const optimisticEntry: RechargeRecord = {
          id: `opt-rch-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          amountUsdt: amount,
          currency: network,
          method: 'CRYPTO_TRANSFER',
          destinationAddress: depositAddress,
          txReference: txHash.trim(),
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        setRecentRecharges([optimisticEntry, ...previousRecharges]);
        return { previousRecharges };
      },
      serverAction: async (idempotencyKey) => {
        const res = await fetch('/api/recharge/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountUsdt: amount,
            currency: network,
            destinationAddress: depositAddress,
            txReference: txHash.trim(),
            idempotencyKey,
          }),
        });
        const data = await res.json();
        return { success: data.success, data, message: data.message };
      },
      onRollback: (snapshot, err) => {
        setRecentRecharges(snapshot.previousRecharges);
        setErrorMessage(err);
      },
      onSuccess: () => {
        setSuccessMessage(`Deposit request for ${amount.toFixed(2)} USDT submitted. It will be verified by the admin desk.`);
        setTxHash('');
        emitLocalEvent('RECHARGE_SUBMITTED', { amount });
        loadData();
      },
      successTitle: 'Deposit Submitted',
      successMessage: `Recharge #${txHash.substring(0, 8)}... has been submitted for automated blockchain confirmation.`,
    });

    setIsSubmitting(false);
  };

  const formattedAmount = amount > 0 ? amount.toString() : '0';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <GlassCard elevation={2} className="p-5 sm:p-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GlassBadge variant="gold" dot>
                DEPOSIT GATEWAY
              </GlassBadge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Recharge Balance</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Deposit USDT on-chain to fund solar panel acquisitions and upgrade top-ups.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-[#050B18]/70 border border-white/[0.08] font-mono text-xs shadow-inner">
            <span className="text-slate-400 text-[10px] uppercase block font-semibold">AVAILABLE BALANCE</span>
            <span className="text-lg font-bold text-solar-gold font-mono-num">${(user?.availableBalance || 0).toFixed(2)} USDT</span>
          </div>
        </div>
      </GlassCard>

      {/* 2. Main Recharge Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Deposit Flow */}
        <GlassCard elevation={1} className="md:col-span-7 p-5 sm:p-6 space-y-5 border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-white">Deposit Details</h2>
            <span className="text-xs font-mono text-solar-gold font-bold font-mono-num">
              Recharge {formattedAmount} USDT
            </span>
          </div>

          {/* Amount Selector with Presets & Custom Option */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase block font-semibold">Select Amount (USDT)</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 font-mono">
              {[30, 60, 160, 300].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectPreset(val)}
                  className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                    !isCustom && amount === val
                      ? 'bg-solar-gold text-[#050B18] border-solar-gold shadow-gold-glow'
                      : 'bg-[#050B18]/70 border-white/[0.08] text-slate-300 hover:text-white hover:border-solar-gold/40'
                  }`}
                >
                  ${val}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSelectCustom}
                className={`py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  isCustom
                    ? 'bg-solar-gold text-[#050B18] border-solar-gold shadow-gold-glow'
                    : 'bg-[#050B18]/70 border-white/[0.08] text-slate-300 hover:text-white hover:border-solar-gold/40'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Custom
              </button>
            </div>

            {/* Custom Amount Input Field */}
            {isCustom && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between mb-1 text-xs font-mono">
                  <span className="text-solar-gold font-bold">Enter Custom Amount (USDT)</span>
                  <span className="text-[10px] text-slate-400">Min 10.00 USDT</span>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-solar-gold font-mono font-bold text-sm">
                    $
                  </div>
                  <input
                    type="number"
                    min="10"
                    step="any"
                    value={customAmountInput}
                    onChange={handleCustomAmountChange}
                    placeholder="Enter custom amount e.g. 125"
                    autoFocus
                    className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-[#050B18]/80 border border-solar-gold/50 focus:border-solar-gold text-white text-sm font-mono font-bold outline-none transition-all shadow-inner focus:ring-1 focus:ring-solar-gold/40"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    USDT
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Network Selector */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase block mb-1.5 font-semibold">Blockchain Network</label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-2.5 rounded-2xl font-bold border transition-all ${
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

          {/* Address & QR */}
          <div className="p-4 rounded-3xl bg-[#050B18]/80 border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-solar-gold uppercase">Official Destination Address</span>
              <GlassBadge variant="gold" size="sm">Verified</GlassBadge>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="p-2 bg-white rounded-2xl shadow-lg shrink-0">
                <QRCodeSVG value={depositAddress} size={90} />
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="p-2.5 rounded-xl bg-[#0B1426] border border-white/[0.08] font-mono text-xs text-slate-200 break-all select-all">
                  {depositAddress}
                </div>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleCopy}
                  leftIcon={copied ? Check : Copy}
                >
                  {copied ? 'Address Copied' : 'Copy Destination Address'}
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Deposit Confirmation Details Pill */}
          <div className="p-3.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.08] space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Network:</span>
              <span className="text-white font-bold">{network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deposit Amount:</span>
              <span className="text-solar-gold font-bold font-mono-num">${formattedAmount} USDT</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/[0.08] font-bold">
              <span className="text-slate-300">Balance Credited Upon Approval:</span>
              <span className="text-solar-gold text-sm font-mono-num text-glow-gold">+${formattedAmount} USDT</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitRecharge} className="space-y-4 pt-1">
            <GlassInput
              label="Transaction Hash / Transfer Reference"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="e.g. 0x8f2a... or TRON TX ID"
              required
            />

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
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
              isLoading={isSubmitting}
            >
              Recharge {formattedAmount} USDT
            </GlassButton>
          </form>
        </GlassCard>

        {/* Side Panel: Guidelines & Recent Recharges */}
        <div className="md:col-span-5 space-y-5">
          <GlassCard elevation={1} className="p-5 space-y-3 font-mono text-xs border-white/[0.08]">
            <h3 className="text-sm font-bold font-display text-white">Deposit Instructions</h3>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-solar-gold font-bold">•</span>
                <span>Send only {network} to the indicated address.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-solar-gold font-bold">•</span>
                <span>Minimum deposit is 10.00 USDT.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-solar-gold font-bold">•</span>
                <span>Audited and verified by the Super Admin operations desk.</span>
              </li>
            </ul>
          </GlassCard>

          {/* Recharge Records & History */}
          <GlassCard elevation={1} className="p-5 space-y-3 border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-white">Recharge Records & History</h3>
              <span className="text-[11px] font-mono text-slate-400">
                {recentRecharges.length} Total
              </span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {recentRecharges.length > 0 ? (
                recentRecharges.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-2xl bg-[#050B18]/80 border border-white/[0.06] space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono-num text-sm">
                        +${rec.amountUsdt.toFixed(2)} USDT
                      </span>
                      <GlassBadge
                        variant={rec.status === 'APPROVED' ? 'gold' : rec.status === 'PENDING' ? 'amber' : 'danger'}
                        size="sm"
                      >
                        {rec.status}
                      </GlassBadge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(rec.createdAt).toLocaleString()}</span>
                      <span className="text-solar-gold">{rec.currency}</span>
                    </div>
                    {rec.txReference && (
                      <div className="text-[10px] text-slate-500 truncate font-mono bg-white/[0.02] px-2 py-1 rounded">
                        Tx: {rec.txReference}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  No recharge records yet.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
