'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RechargeRecord } from '@/types';
import { useRealtime } from '@/frontend/contexts/realtime-context';
import { useToast } from '@/frontend/glass/glass-toast';

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
      setErrorMessage('Minimum deposit amount is 10.00 USDT.');
      return;
    }

    if (!txHash || txHash.trim().length < 8) {
      setErrorMessage('Please enter a valid transaction ID or transfer hash.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/recharge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsdt: amount,
          currency: network,
          destinationAddress: depositAddress,
          txReference: txHash.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Deposit request for ${amount.toFixed(2)} USDT submitted. Balance will be updated once confirmed.`);
        success('Deposit Submitted', `Request #${txHash.substring(0, 8)}... received.`);
        setTxHash('');
        emitLocalEvent('RECHARGE_SUBMITTED', { amount });
        loadData();
      } else {
        setErrorMessage(data.message || 'Failed to submit deposit.');
      }
    } catch {
      setErrorMessage('Network error while transmitting deposit.');
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
            Add Funds
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Deposit USDT to your account to rent solar panels and begin earning daily returns.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.07] text-xs font-mono">
          <span className="text-zinc-400 block text-[10px] uppercase">Current Balance</span>
          <strong className="text-white text-base">${(user?.availableBalance || 0).toFixed(2)} USDT</strong>
        </div>
      </div>

      {/* Main Grid: Form Left, Instructions Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Deposit Form */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-5">
          <h2 className="text-base font-semibold text-white">Deposit Details</h2>

          {/* Amount Presets */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Select Amount (USDT):</label>
            <div className="grid grid-cols-4 gap-2 font-mono text-xs">
              {[35, 60, 150, 300].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectPreset(val)}
                  className={`py-2.5 rounded-xl font-medium border transition-colors ${
                    !isCustom && amount === val
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:text-white'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="pt-1">
              <input
                type="number"
                min="10"
                step="1"
                placeholder="Or enter custom amount (min $10)"
                value={customAmountInput}
                onChange={handleCustomAmountChange}
                onFocus={handleSelectCustom}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Network Selector */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Select Network:</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-2 rounded-xl border text-center transition-colors ${
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

          {/* Address & QR Code */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl shrink-0">
                <QRCodeSVG value={depositAddress} size={110} />
              </div>

              <div className="space-y-2 w-full min-w-0">
                <span className="text-xs text-zinc-400 block font-medium">Deposit Address ({network}):</span>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] font-mono text-xs text-white break-all select-all">
                  {depositAddress}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmitRecharge} className="space-y-4 pt-1">
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

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Transaction ID / Transfer Hash:</label>
              <input
                type="text"
                required
                placeholder="Paste transaction reference from your wallet"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Submit Deposit of ${amount.toFixed(2)} USDT</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Instructions & Recent Activity */}
        <div className="lg:col-span-5 space-y-5">
          {/* Instructions */}
          <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-3">
            <h3 className="text-sm font-semibold text-white">Deposit Guidelines</h3>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>Only send USDT to the address shown above on your selected network.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>Minimum deposit is 10 USDT. Smaller transfers cannot be credited.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>Once submitted, deposits are typically confirmed and credited within a few minutes.</span>
              </li>
            </ul>
          </div>

          {/* Recent Deposits */}
          <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-3">
            <h3 className="text-sm font-semibold text-white">Recent Deposits</h3>
            {recentRecharges.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No deposit records yet.</p>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {recentRecharges.slice(0, 5).map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-white font-mono">
                        +${rec.amountUsdt.toFixed(2)} USDT
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'Recent'} · {rec.currency}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        rec.status === 'APPROVED'
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : rec.status === 'PENDING'
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      }`}
                    >
                      {rec.status}
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
