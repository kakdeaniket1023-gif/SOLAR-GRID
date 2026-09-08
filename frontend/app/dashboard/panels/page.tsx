'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import { useRealtime } from '@/frontend/contexts/realtime-context';
import { useToast } from '@/frontend/glass/glass-toast';
import { SolarPlan, SolarUnit } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Clock,
  FileText,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

const DEFAULT_PANELS: SolarPlan[] = [
  {
    id: 'p1',
    code: 'P1',
    name: 'P1 Panel',
    description: '1 KW Distributed Solar Unit',
    priceUsdt: 35,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 0.80,
    grossEarningUsdt: 34.40,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 30.96,
    capacityKw: 1,
    imageUrl: '/images/panel-p1.jpg',
    features: [],
    displayOrder: 1,
    status: 'ACTIVE',
    projectLocation: 'Sonoran Clean Solar Park',
  },
  {
    id: 'p2',
    code: 'P2',
    name: 'P2 Panel',
    description: '5 KW High-Yield Solar Unit',
    priceUsdt: 150,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 3.40,
    grossEarningUsdt: 146.20,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 131.58,
    capacityKw: 5,
    imageUrl: '/images/panel-p2.jpg',
    features: [],
    displayOrder: 2,
    status: 'ACTIVE',
    projectLocation: 'Sonoran Clean Solar Park',
  },
  {
    id: 'p3',
    code: 'P3',
    name: 'P3 Panel',
    description: '10 KW Commercial Solar Unit',
    priceUsdt: 300,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 7.20,
    grossEarningUsdt: 309.60,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 278.64,
    capacityKw: 10,
    imageUrl: '/images/panel-p3.jpg',
    features: [],
    displayOrder: 3,
    status: 'ACTIVE',
    projectLocation: 'Sonoran Clean Solar Park',
  },
  {
    id: 'p4',
    code: 'P4',
    name: 'P4 Panel',
    description: '20 KW Industrial Solar Unit',
    priceUsdt: 600,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 15.00,
    grossEarningUsdt: 645.00,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 580.50,
    capacityKw: 20,
    imageUrl: '/images/panel-p4.jpg',
    features: [],
    displayOrder: 4,
    status: 'ACTIVE',
    projectLocation: 'Sonoran Clean Solar Park',
  },
  {
    id: 'p5',
    code: 'P5',
    name: 'P5 Panel',
    description: '50 KW Grid-Tier Solar Unit',
    priceUsdt: 1500,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 40.00,
    grossEarningUsdt: 1720.00,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 1548.00,
    capacityKw: 50,
    imageUrl: '/images/panel-p5.jpg',
    features: [],
    displayOrder: 5,
    status: 'ACTIVE',
    projectLocation: 'Sonoran Clean Solar Park',
  },
  {
    id: 'p6',
    code: 'P6',
    name: 'P6 Panel',
    description: '100 KW National Interconnect Unit',
    priceUsdt: 3000,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 85.00,
    grossEarningUsdt: 3655.00,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 3289.50,
    capacityKw: 100,
    imageUrl: '/images/panel-p6.jpg',
    features: [],
    displayOrder: 6,
    status: 'ACTIVE',
    projectLocation: 'Sonoran Clean Solar Park',
  },
];

const ADMIN_DEPOSIT_ADDRESSES: { [key: string]: string } = {
  'USDT-TRC20': 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
  'USDT-BEP20': '0x71C568b892F1c37E1542aB6d71b3058a9e401b2a',
  'USDT-ERC20': '0x71C568b892F1c37E1542aB6d71b3058a9e401b2a',
};

export default function PanelsPage() {
  const { user, refreshUser } = useAuth();
  const { emitLocalEvent } = useRealtime();
  const { success, error } = useToast();

  const [plans, setPlans] = useState<SolarPlan[]>(DEFAULT_PANELS);
  const [userUnits, setUserUnits] = useState<SolarUnit[]>([]);
  const [purchasingCode, setPurchasingCode] = useState<string | null>(null);

  // Insufficient Balance Payment Modal State
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [selectedPlanForRecharge, setSelectedPlanForRecharge] = useState<SolarPlan | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<'USDT-TRC20' | 'USDT-BEP20' | 'USDT-ERC20'>('USDT-TRC20');
  const [txHashInput, setTxHashInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [submittingRecharge, setSubmittingRecharge] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    // Load Plans
    fetch('/api/solar/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.plans && data.plans.length > 0) {
          setPlans(data.plans.filter((p: SolarPlan) => p.status === 'ACTIVE'));
        }
      })
      .catch(() => {});

    // Load User Owned Units
    if (user) {
      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.units) {
            setUserUnits(data.units);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getOwnedQuantity = (code: string) => {
    return userUnits.filter((u) => u.planCode.toUpperCase() === code.toUpperCase()).length;
  };

  const handleBuyClick = async (plan: SolarPlan) => {
    if (!user) return;

    const availableBalance = user.availableBalance || 0;

    if (availableBalance < plan.priceUsdt) {
      setSelectedPlanForRecharge(plan);
      setTxHashInput('');
      setRechargeSuccess(null);
      setRechargeError(null);
      setInsufficientModalOpen(true);
      return;
    }

    setPurchasingCode(plan.code);

    try {
      const res = await fetch('/api/solar/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode: plan.code }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FBBF24', '#10B981', '#38BDF8'],
        });

        success('Panel Activated!', `Activated ${plan.name} (${plan.capacityKw} KW). +2 points awarded!`);
        refreshUser();
        loadData();
        emitLocalEvent('BALANCE_UPDATED', {});
      } else {
        error('Purchase Failed', data.message || 'Could not complete panel purchase.');
      }
    } catch {
      error('Purchase Failed', 'Network error while completing panel purchase.');
    } finally {
      setPurchasingCode(null);
    }
  };

  const handleCopyDepositAddress = () => {
    const addr = ADMIN_DEPOSIT_ADDRESSES[selectedNetwork];
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitModalRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForRecharge || !user) return;

    const depositAddress = ADMIN_DEPOSIT_ADDRESSES[selectedNetwork];
    const neededAmount = Math.max(10, selectedPlanForRecharge.priceUsdt - (user.availableBalance || 0));

    if (!txHashInput.trim() || txHashInput.trim().length < 8) {
      setRechargeError('Please enter a valid transaction ID.');
      return;
    }

    setSubmittingRecharge(true);
    setRechargeError(null);

    try {
      const res = await fetch('/api/recharge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsdt: neededAmount,
          network: selectedNetwork,
          depositAddress,
          txHash: txHashInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRechargeSuccess(
          `Deposit request of ${neededAmount.toFixed(2)} USDT submitted. Once approved, your balance will update automatically.`
        );
        emitLocalEvent('RECHARGE_SUBMITTED', {});
      } else {
        setRechargeError(data.message || 'Failed to submit deposit.');
      }
    } catch {
      setRechargeError('Network error while submitting deposit.');
    } finally {
      setSubmittingRecharge(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Solar Panels
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Choose a panel capacity from 1 KW to 100 KW. Earn daily returns over a 60-day cycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.07] text-xs font-mono">
            <span className="text-zinc-400">Available: </span>
            <strong className="text-white">${(user?.availableBalance || 0).toFixed(2)} USDT</strong>
          </div>
          <Link
            href="/dashboard/recharge"
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>Add Funds</span>
          </Link>
        </div>
      </div>

      {/* 6 SOLAR PANELS GRID (P1 to P6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((panel) => {
          const quantity = getOwnedQuantity(panel.code);
          const isPurchasing = purchasingCode === panel.code;

          return (
            <div
              key={panel.code}
              className="p-5 rounded-3xl bg-[#0D0E15] border border-white/[0.07] hover:border-white/[0.15] transition-colors flex flex-col justify-between group space-y-4"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06]">
                <Image
                  src={panel.imageUrl || `/images/panel-${panel.code.toLowerCase()}.jpg`}
                  alt={panel.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={panel.code === 'P1'}
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/[0.1] text-xs font-mono font-semibold text-amber-400">
                  {panel.name} · {panel.capacityKw} KW
                </div>
              </div>

              {/* Panel Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{panel.name}</h3>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase block">PRICE</span>
                    <span className="text-lg font-bold text-white font-mono">
                      ${panel.priceUsdt} <span className="text-xs font-normal text-zinc-400">USDT</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 block">DAILY RETURN</span>
                    <strong className="text-emerald-400 font-mono font-bold text-sm">
                      +${panel.dailyEarningUsdt.toFixed(2)}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 block">OWNED</span>
                    <strong className="text-white font-mono font-bold text-sm">
                      {quantity} <span className="text-[10px] font-normal text-zinc-400">units</span>
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-0.5">
                  <span>Term: 60 Days</span>
                  <span>Withdrawal fee: 10%</span>
                </div>
              </div>

              {/* Buy Button */}
              <button
                onClick={() => handleBuyClick(panel)}
                disabled={isPurchasing}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isPurchasing ? (
                  <span>Activating...</span>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>Rent {panel.name} (${panel.priceUsdt} USDT)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* MY PANELS SECTION */}
      <div className="space-y-4 pt-6 border-t border-white/[0.07]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              My Active Solar Panels
            </h2>
          </div>
          <span className="text-xs text-zinc-400">
            Total: <strong className="text-white">{userUnits.length} panels</strong>
          </span>
        </div>

        <div className="rounded-2xl bg-[#0D0E15] border border-white/[0.07] overflow-hidden">
          {userUnits.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-zinc-400 text-xs">
              <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
              <p>You have not rented any panels yet. Choose a panel above to begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {userUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 font-bold font-mono text-xs">
                      {unit.planCode}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {unit.planName} · {unit.capacityKw} KW
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Rented: {unit.purchaseDate ? new Date(unit.purchaseDate).toLocaleDateString() : 'Active'} · ${unit.purchasePriceUsdt} USDT
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        +${(unit.lifetimeEarnedUsdt || 0).toFixed(2)} USDT
                      </div>
                      <div className="text-[10px] text-zinc-400">Lifetime earned</div>
                    </div>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                      {unit.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* INSUFFICIENT BALANCE RECHARGE MODAL */}
      {insufficientModalOpen && selectedPlanForRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.1] shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-semibold text-white">
                  Add Funds for {selectedPlanForRecharge.name}
                </h3>
              </div>
              <button
                onClick={() => setInsufficientModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price breakdown */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Panel Price:</span>
                <strong className="text-white font-mono">${selectedPlanForRecharge.priceUsdt.toFixed(2)} USDT</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Current Balance:</span>
                <strong className="text-white font-mono">${(user?.availableBalance || 0).toFixed(2)} USDT</strong>
              </div>
              <div className="flex justify-between text-amber-400 font-semibold pt-1 border-t border-white/[0.05]">
                <span>Amount to Add:</span>
                <span className="font-mono">
                  ${Math.max(10, selectedPlanForRecharge.priceUsdt - (user?.availableBalance || 0)).toFixed(2)} USDT
                </span>
              </div>
            </div>

            {rechargeSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p>{rechargeSuccess}</p>
                <button
                  onClick={() => setInsufficientModalOpen(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitModalRecharge} className="space-y-4 text-xs">
                {rechargeError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{rechargeError}</span>
                  </div>
                )}

                {/* Network Selection */}
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Select Network:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setSelectedNetwork(net)}
                        className={`py-2 px-2 rounded-xl border text-center transition-colors ${
                          selectedNetwork === net
                            ? 'bg-amber-400/10 border-amber-400 text-amber-400 font-semibold'
                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {net.replace('USDT-', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deposit Address */}
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Deposit Address:</label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-mono text-[11px] text-zinc-300 truncate flex-1">
                      {ADMIN_DEPOSIT_ADDRESSES[selectedNetwork]}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyDepositAddress}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Tx Hash */}
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Transaction ID / Hash:</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste transaction ID after sending"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setInsufficientModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRecharge}
                    className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    {submittingRecharge ? 'Submitting...' : 'Submit Deposit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
