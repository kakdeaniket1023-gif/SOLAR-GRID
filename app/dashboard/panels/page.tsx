'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useRealtime } from '@/lib/realtime/realtime-context';
import { useToast } from '@/components/glass/glass-toast';
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
  ArrowRight,
  ShieldCheck,
  FileText,
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

const DEFAULT_PANELS: SolarPlan[] = [
  {
    id: 'p1',
    code: 'P1',
    name: 'P1',
    description: '1 KW Distributed Solar Module',
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
    name: 'P2',
    description: '5 KW High-Yield Solar Module',
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
    name: 'P3',
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
    name: 'P4',
    description: '20 KW Industrial Solar Array',
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
    name: 'P5',
    description: '50 KW Grid-Tier Solar Array',
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
    name: 'P6',
    description: '100 KW National Interconnect Array',
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
  const { executeOptimisticMutation, emitLocalEvent } = useRealtime();
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

    // Load User Owned Units / Purchase Records
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

  // Equipment Quantity owned by the user for a plan
  const getOwnedQuantity = (code: string) => {
    return userUnits.filter((u) => u.planCode.toUpperCase() === code.toUpperCase()).length;
  };

  const handleBuyClick = async (plan: SolarPlan) => {
    if (!user) return;

    const availableBalance = user.availableBalance || 0;

    // First priority: Check available account balance
    if (availableBalance < plan.priceUsdt) {
      // Insufficient balance: open dynamic USDT payment/recharge modal
      setSelectedPlanForRecharge(plan);
      setTxHashInput('');
      setRechargeSuccess(null);
      setRechargeError(null);
      setInsufficientModalOpen(true);
      return;
    }

    // Sufficient balance: complete purchase
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
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FFC83D', '#FF9F1C', '#10B981'],
        });

        success('Panel Purchased Successfully', `Activated ${plan.name} (${plan.capacityKw} KW). +2 points awarded!`);
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
      setRechargeError('Please enter a valid on-chain transaction hash.');
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
          `Recharge request of ${neededAmount.toFixed(2)} USDT submitted! Once verified by finance, your balance will be credited and you can complete the purchase.`
        );
        emitLocalEvent('RECHARGE_SUBMITTED', {});
      } else {
        setRechargeError(data.message || 'Failed to submit deposit verification.');
      }
    } catch {
      setRechargeError('Network error while transmitting recharge request.');
    } finally {
      setSubmittingRecharge(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
            Solar Generation Panels
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Choose your photovoltaic panel capacity (P1 to P6). Direct daily USDT revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0B152A] border border-white/[0.08] text-xs font-mono">
            <span className="text-slate-400">Available: </span>
            <strong className="text-solar-gold font-mono-num">${(user?.availableBalance || 0).toFixed(2)} USDT</strong>
          </div>
          <Link
            href="/dashboard/recharge"
            className="px-3 py-1.5 rounded-xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold font-mono text-xs font-bold flex items-center gap-1 hover:bg-solar-gold/25 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Recharge</span>
          </Link>
        </div>
      </div>

      {/* 6 SOLAR PANELS GRID (P1 to P6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((panel) => {
          const quantity = getOwnedQuantity(panel.code);
          const isPurchasing = purchasingCode === panel.code;

          return (
            <GlassCard
              key={panel.code}
              elevation={1}
              className="p-5 rounded-3xl border-white/[0.08] hover:border-solar-gold/40 transition-all flex flex-col justify-between group space-y-4"
            >
              {/* Panel Image ONLY */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0A1222] border border-white/[0.06]">
                <Image
                  src={panel.imageUrl || `/images/panel-${panel.code.toLowerCase()}.jpg`}
                  alt={panel.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority={panel.code === 'P1'}
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#050B18]/90 border border-white/[0.1] text-xs font-mono font-bold text-solar-gold">
                  {panel.name} • {panel.capacityKw} KW
                </div>
              </div>

              {/* Panel Information: ONLY Name, Equipment Price, Daily Revenue, Equipment Quantity */}
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white tracking-tight">{panel.name}</h2>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-normal text-[10px] uppercase">EQUIPMENT PRICE</span>
                    <span className="text-lg font-bold text-solar-gold font-mono-num">
                      ${panel.priceUsdt} <span className="text-xs font-normal text-slate-400">USDT</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#070E1E] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">DAILY REVENUE</span>
                    <strong className="text-emerald-400 font-bold text-sm">
                      +{panel.dailyEarningUsdt.toFixed(2)} <span className="text-[10px] font-normal">USDT</span>
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#070E1E] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">OWNED QUANTITY</span>
                    <strong className="text-white font-bold text-sm">
                      {quantity} <span className="text-[10px] font-normal text-slate-400">units</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Buy Button */}
              <button
                onClick={() => handleBuyClick(panel)}
                disabled={isPurchasing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-solar-gold via-solar-amber to-amber-500 text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isPurchasing ? (
                  <span>Processing Activation...</span>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-[#050B18]" />
                    <span>Buy {panel.name} (${panel.priceUsdt} USDT)</span>
                  </>
                )}
              </button>
            </GlassCard>
          );
        })}
      </div>

      {/* PANEL PURCHASE RECORDS SECTION */}
      <div className="space-y-4 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-solar-gold" />
            <h2 className="text-lg font-bold font-display text-white">
              Panel Purchase Records
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Purchased: <strong className="text-white">{userUnits.length} panels</strong>
          </span>
        </div>

        <GlassCard elevation={1} className="rounded-3xl border-white/[0.08] overflow-hidden">
          {userUnits.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-slate-400 text-xs font-mono">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No panels purchased yet. Select a panel above to begin operations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableCell isHeader>PANEL NAME</GlassTableCell>
                    <GlassTableCell isHeader>CAPACITY</GlassTableCell>
                    <GlassTableCell isHeader>PURCHASE PRICE</GlassTableCell>
                    <GlassTableCell isHeader>PURCHASE DATE</GlassTableCell>
                    <GlassTableCell isHeader>LIFETIME EARNED</GlassTableCell>
                    <GlassTableCell isHeader>STATUS</GlassTableCell>
                  </GlassTableRow>
                </GlassTableHeader>
                <tbody>
                  {userUnits.map((unit) => (
                    <GlassTableRow key={unit.id}>
                      <GlassTableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{unit.planName || unit.planCode}</span>
                          <span className="px-2 py-0.5 rounded bg-solar-gold/15 text-solar-gold text-[10px] font-mono font-bold">
                            {unit.planCode}
                          </span>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="font-mono text-slate-300 text-xs">{unit.capacityKw} KW</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="font-mono text-solar-gold font-bold text-xs">
                          ${(unit.purchasePriceUsdt || 0).toFixed(2)} USDT
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {unit.purchaseDate ? new Date(unit.purchaseDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="font-mono text-emerald-400 font-bold text-xs">
                          +${(unit.lifetimeEarnedUsdt || 0).toFixed(2)} USDT
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <GlassBadge
                          variant={unit.status === 'ACTIVE' ? 'gold' : 'blue'}
                          size="sm"
                        >
                          {unit.status}
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

      {/* INSUFFICIENT BALANCE RECHARGE MODAL */}
      {insufficientModalOpen && selectedPlanForRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <GlassCard
            elevation={3}
            className="w-full max-w-lg p-6 sm:p-7 rounded-3xl border-solar-gold/40 shadow-2xl relative space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-display">
                  Insufficient Balance for {selectedPlanForRecharge.name}
                </h3>
              </div>
              <button
                onClick={() => setInsufficientModalOpen(false)}
                className="p-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pricing Summary */}
            <div className="p-3.5 rounded-2xl bg-[#050B18] border border-white/[0.08] font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Panel Price:</span>
                <strong className="text-white">${selectedPlanForRecharge.priceUsdt.toFixed(2)} USDT</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Your Available Balance:</span>
                <strong className="text-solar-gold">${(user?.availableBalance || 0).toFixed(2)} USDT</strong>
              </div>
              <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-white/[0.06]">
                <span>Recharge Amount Needed:</span>
                <span>
                  ${Math.max(10, selectedPlanForRecharge.priceUsdt - (user?.availableBalance || 0)).toFixed(2)} USDT
                </span>
              </div>
            </div>

            {rechargeSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p>{rechargeSuccess}</p>
                <button
                  onClick={() => setInsufficientModalOpen(false)}
                  className="mt-2 px-5 py-2 rounded-xl bg-emerald-500 text-[#050B18] font-bold text-xs"
                >
                  Close & Refresh
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitModalRecharge} className="space-y-4 font-mono text-xs">
                {rechargeError && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px]">
                    {rechargeError}
                  </div>
                )}

                {/* USDT Network Selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold uppercase text-[10px]">
                    Select USDT Network:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                      <button
                        type="button"
                        key={net}
                        onClick={() => setSelectedNetwork(net)}
                        className={`py-2 px-2 rounded-xl text-center font-bold border transition-all text-[11px] ${
                          selectedNetwork === net
                            ? 'bg-solar-gold/20 border-solar-gold text-solar-gold shadow-gold-glow'
                            : 'bg-[#050B18] border-white/[0.08] text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {net.replace('USDT-', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Configured QR Code & Address */}
                <div className="p-4 rounded-2xl bg-[#050B18] border border-white/[0.08] flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shrink-0 shadow-md">
                    <QRCodeSVG value={ADMIN_DEPOSIT_ADDRESSES[selectedNetwork]} size={85} />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Admin Configured {selectedNetwork} Deposit Address:
                    </span>
                    <div className="text-[11px] font-mono text-slate-200 break-all bg-white/[0.04] p-2 rounded-lg border border-white/[0.06]">
                      {ADMIN_DEPOSIT_ADDRESSES[selectedNetwork]}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDepositAddress}
                      className="inline-flex items-center gap-1 text-[11px] text-solar-gold font-bold hover:underline"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
                    </button>
                  </div>
                </div>

                {/* Transaction Hash Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold uppercase text-[10px]">
                    Enter On-Chain Transaction Hash:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter blockchain transaction hash / TxID"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/dashboard/recharge"
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-center font-bold text-xs"
                  >
                    Open Recharge Page
                  </Link>
                  <button
                    type="submit"
                    disabled={submittingRecharge}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform"
                  >
                    {submittingRecharge ? 'Submitting...' : 'Submit Deposit'}
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
