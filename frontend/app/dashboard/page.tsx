'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  Sun,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

interface TeamStats {
  level1Count: number;
  level2Count: number;
  totalTeamCount: number;
  personalPv: number;
  groupPv: number;
  level1Pv: number;
  level2Pv: number;
  activeMembersCount: number;
  verifiedKycCount: number;
  totalDirectSellingCommissionUsdt: number;
  l1CommissionUsdt: number;
  l2CommissionUsdt: number;
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    if (user) {
      Promise.all([
        fetch('/api/network/stats').then((res) => res.json()),
        fetch('/api/orders').then((res) => res.json()),
      ])
        .then(([statsRes, ordersRes]) => {
          if (statsRes.success) setStats(statsRes.data);
          if (ordersRes.success) setOrders(ordersRes.data || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${user?.referralCode || ''}`
    : '';

  const copyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const kycStatus = user?.kycStatus || 'UNVERIFIED';

  return (
    <div className="space-y-6">
      {/* 1. DISTRIBUTOR WELCOME HERO */}
      <GlassCard
        elevation={1}
        className="rounded-3xl border-white/[0.07] p-6 sm:p-8 bg-[#0D0E15] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">
                <Sun className="w-3.5 h-3.5" />
                SolarGrid Independent Distributor Portal
              </div>

              {/* KYC Status Badge */}
              {kycStatus === 'VERIFIED' ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/25 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  KYC Verified
                </div>
              ) : kycStatus === 'PENDING' ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  KYC Under Review
                </div>
              ) : (
                <Link
                  href="/dashboard/wallet"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-400/10 hover:bg-rose-400/20 border border-rose-400/25 text-rose-400 text-xs font-medium transition-colors"
                >
                  <AlertCircle className="w-3 h-3" />
                  Verify KYC for Withdrawals
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Welcome back, <span className="text-amber-400">{user?.name || 'Distributor'}</span>
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
              Grow your clean energy enterprise. Earn direct commissions on certified solar equipment sales across up to 2 levels of your distribution network.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard/shop"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <ShoppingBag className="w-4 h-4 fill-black" />
                <span>Shop Solar Products</span>
              </Link>

              <Link
                href="/dashboard/network"
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium text-xs flex items-center gap-2 transition-colors"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Network Tree</span>
              </Link>

              <Link
                href="/dashboard/orders"
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-colors"
              >
                <Package className="w-4 h-4 text-amber-400" />
                <span>My Orders</span>
              </Link>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="lg:col-span-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">Free Sponsor Invitation</span>
                <span className="text-[10px] text-amber-400 uppercase font-mono tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Zero Join Fee
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Share your personalized distributor link. New members register 100% free with no joining fee.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink || `Code: ${user?.referralCode || '...'}`}
                  className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 truncate focus:outline-none"
                />
                <button
                  onClick={copyReferral}
                  className="px-3 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. DIRECT SELLING VOLUME & COMMISSION METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Personal PV */}
        <GlassCard elevation={1} className="p-5 rounded-2xl border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Personal Volume (PV)</span>
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats ? stats.personalPv.toLocaleString() : (user?.personalPv || 0).toLocaleString()} <span className="text-xs text-zinc-400 font-sans font-normal">PV</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            From verified personal customer equipment orders
          </div>
        </GlassCard>

        {/* Group PV */}
        <GlassCard elevation={1} className="p-5 rounded-2xl border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Group Volume (GV)</span>
            <div className="p-2 rounded-xl bg-sky-400/10 border border-sky-400/20">
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats ? stats.groupPv.toLocaleString() : (user?.groupPv || 0).toLocaleString()} <span className="text-xs text-zinc-400 font-sans font-normal">GV</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            Level 1 ({stats?.level1Pv || 0} PV) + Level 2 ({stats?.level2Pv || 0} PV)
          </div>
        </GlassCard>

        {/* Direct Commissions Earned */}
        <GlassCard elevation={1} className="p-5 rounded-2xl border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Direct Commissions</span>
            <div className="p-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${stats ? stats.totalDirectSellingCommissionUsdt.toFixed(2) : '0.00'} <span className="text-xs text-zinc-400 font-sans font-normal">USDT</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            L1 (10%): ${stats?.l1CommissionUsdt.toFixed(2) || '0.00'} · L2 (5%): ${stats?.l2CommissionUsdt.toFixed(2) || '0.00'}
          </div>
        </GlassCard>

        {/* Available Balance / Wallet */}
        <GlassCard elevation={1} className="p-5 rounded-2xl border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Available Payout Balance</span>
            <div className="p-2 rounded-xl bg-purple-400/10 border border-purple-400/20">
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${(user?.availableBalance || 0).toFixed(2)} <span className="text-xs text-zinc-400 font-sans font-normal">USDT</span>
          </div>
          <div className="pt-0.5">
            <Link
              href="/dashboard/wallet"
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>Manage Payouts & Withdraw</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* 3. TWO-TIER COMPLIANCE BREAKDOWN & RECENT ORDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network & Compliance Summary */}
        <GlassCard elevation={1} className="lg:col-span-6 p-6 rounded-3xl border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Distribution Network (Max 2 Levels)
              </h2>
            </div>
            <Link
              href="/dashboard/network"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>Interactive Tree</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="text-xs text-zinc-400 font-medium">Level 1 Direct Team</div>
              <div className="text-xl font-bold font-mono text-white">
                {stats?.level1Count || 0} <span className="text-xs text-zinc-400 font-normal">Distributors</span>
              </div>
              <div className="text-[11px] text-amber-400">Commission Rate: 10% on Order PV</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="text-xs text-zinc-400 font-medium">Level 2 Indirect Team</div>
              <div className="text-xl font-bold font-mono text-white">
                {stats?.level2Count || 0} <span className="text-xs text-zinc-400 font-normal">Distributors</span>
              </div>
              <div className="text-[11px] text-sky-400">Commission Rate: 5% on Order PV</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Verified Team KYC Rate</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {stats?.totalTeamCount
                  ? `${Math.round((stats.verifiedKycCount / stats.totalTeamCount) * 100)}%`
                  : '100%'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{
                  width: `${stats?.totalTeamCount ? Math.min(100, Math.round((stats.verifiedKycCount / stats.totalTeamCount) * 100)) : 100}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-zinc-400">
              Only verified KYC distributors are eligible for payout releases.
            </div>
          </div>
        </GlassCard>

        {/* Recent Product Orders */}
        <GlassCard elevation={1} className="lg:col-span-6 p-6 rounded-3xl border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Product Orders
              </h2>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-xs text-zinc-400">No solar equipment orders placed yet.</p>
              <Link
                href="/dashboard/shop"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold text-xs transition-colors hover:bg-amber-300"
              >
                Browse Solar Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">
                        #{order.orderNo}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          order.status === 'PAID'
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                            : order.status === 'REFUNDED'
                            ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                            : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {order.items?.length || 1} item(s) · {order.totalPv} PV
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono text-white">
                      ${order.totalAmount.toFixed(2)} USDT
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* 4. COMPLIANCE & LEGAL NOTICE CARD */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.07] bg-[#0A0B10] space-y-3">
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Direct-Selling Platform Compliance Notice
          </h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          SolarGrid operates as a legitimate direct-selling clean energy platform. All commissions are earned exclusively from the retail sale of bona fide solar products (panels, inverters, battery storage). Joining SolarGrid is 100% free; zero commissions are paid for the recruitment or registration of participants. No guaranteed daily returns, fixed yields, or passive investment contracts are offered.
        </p>
        <div className="flex items-center gap-4 pt-1">
          <Link
            href="/income-disclosure"
            target="_blank"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span>Read Full Income Disclosure Statement</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
