'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  Gift,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Star,
  Award,
} from 'lucide-react';
import { useToast } from '@/frontend/glass/glass-toast';

export default function RewardsPage() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const points = user?.points ?? 100;

  const rewardVouchers = [
    {
      id: 'voucher-fee-discount',
      title: '5% Withdrawal Fee Discount Voucher',
      pointsCost: 50,
      description: 'Applies a 50% discount to your next withdrawal fee (reduced from 10% to 5%).',
      icon: Zap,
    },
    {
      id: 'voucher-daily-boost',
      title: '+0.20 USDT Bonus Daily Yield',
      pointsCost: 100,
      description: 'Adds a bonus 0.20 USDT to your next completed 3-hour generation cycle.',
      icon: Sparkles,
    },
    {
      id: 'voucher-vip-badge',
      title: 'Solar Ambassador Community Badge',
      pointsCost: 200,
      description: 'Unlocks the VIP community ambassador status with priority customer desk routing.',
      icon: Award,
    },
  ];

  const handleRedeem = (voucher: typeof rewardVouchers[0]) => {
    if (points < voucher.pointsCost) {
      error('Insufficient Points', `You need ${voucher.pointsCost} points to claim this reward.`);
      return;
    }

    setRedeemingId(voucher.id);
    setTimeout(() => {
      success('Reward Claimed!', `You have successfully redeemed ${voucher.title}.`);
      setRedeemingId(null);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Member Rewards & Points
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Earn +2 reward points every time you start and collect daily panel generation cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 font-mono text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>{points} Total Points</span>
        </div>
      </div>

      {/* Points Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0E15] border border-white/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-medium">YOUR ACCUMULATED POINTS</span>
            <div className="text-3xl sm:text-4xl font-bold font-mono text-amber-400">
              {points}{' '}
              <span className="text-sm font-normal text-zinc-400 font-sans">Points</span>
            </div>
            <p className="text-xs text-zinc-400 pt-1">
              Automatically awarded for every daily solar generation cycle and community invitation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-zinc-400 text-[11px] block">Cycle Bonus</span>
              <strong className="text-white font-mono">+2 pts</strong>
              <span className="text-[10px] text-zinc-500 block">per daily run</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-zinc-400 text-[11px] block">Invite Bonus</span>
              <strong className="text-white font-mono">+10 pts</strong>
              <span className="text-[10px] text-zinc-500 block">per referral</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Rewards Catalog */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Redeemable Rewards</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rewardVouchers.map((v) => {
            const Icon = v.icon;
            const canAfford = points >= v.pointsCost;
            const isRedeeming = redeemingId === v.id;

            return (
              <div
                key={v.id}
                className="p-5 rounded-3xl bg-[#0D0E15] border border-white/[0.07] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{v.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{v.description}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-amber-400">
                    {v.pointsCost} Points
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRedeem(v)}
                    disabled={!canAfford || isRedeeming}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 text-black'
                        : 'bg-white/[0.02] border border-white/[0.05] text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? 'Claiming...' : canAfford ? 'Claim Reward' : 'Need Points'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
