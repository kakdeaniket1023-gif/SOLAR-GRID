'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Shield,
} from 'lucide-react';

export default function InvitePage() {
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const referralCode = user?.referralCode || 'SOLAR-DEMO';
  const [origin, setOrigin] = useState('https://solargrid.io');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralLink = `${origin}/signup?ref=${referralCode}`;

  useEffect(() => {
    if (user) {
      fetch('/api/mlm/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.stats) {
            setStats(data.stats);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const directs = stats?.directReferrals || [];
  const totalCommission = stats?.totalCommissionEarned || 0;
  const teamSize = stats?.teamSize || directs.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Invite Friends
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Share SolarGrid with friends and earn rewards when they participate in clean solar energy.
          </p>
        </div>

        <button
          onClick={handleCopyLink}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Link Copied' : 'Copy Invite Link'}</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D0E15] border border-white/[0.07] space-y-1">
          <span className="text-zinc-400 text-xs font-medium">TOTAL EARNED REWARDS</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${totalCommission.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-400">USDT</span>
          </div>
          <p className="text-xs text-zinc-500">Commission from your invited members</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D0E15] border border-white/[0.07] space-y-1">
          <span className="text-zinc-400 text-xs font-medium">DIRECT REFERRALS</span>
          <div className="text-2xl font-bold font-mono text-white">
            {directs.length}{' '}
            <span className="text-xs font-normal text-zinc-400 font-sans">members</span>
          </div>
          <p className="text-xs text-zinc-500">People who registered with your code</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D0E15] border border-white/[0.07] space-y-1">
          <span className="text-zinc-400 text-xs font-medium">COMMUNITY TIERS</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            10% / 3% / 1%
          </div>
          <p className="text-xs text-zinc-500">Level 1, 2, and 3 referral rewards</p>
        </div>
      </div>

      {/* Invite Code & Link & QR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code & Link */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-5">
          <h2 className="text-base font-semibold text-white">Your Invitation Details</h2>

          <div className="space-y-4">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Your Referral Code:</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-amber-400 font-mono font-bold text-lg tracking-wider">
                  {referralCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Link */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Direct Invitation Link:</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-300 font-mono text-xs truncate">
                  {referralLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reward Rules */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <h4 className="text-xs font-semibold text-white">How Referral Rewards Work</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-amber-400">Level 1: 10%</span>
                <p className="text-zinc-400 text-[11px]">When someone directly signs up with your link.</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-300">Level 2: 3%</span>
                <p className="text-zinc-400 text-[11px]">When your referrals invite their own friends.</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-400">Level 3: 1%</span>
                <p className="text-zinc-400 text-[11px]">Extended community network bonus.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: QR Code */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-md">
            <QRCodeSVG value={referralLink} size={130} level="M" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white">Scan to Register</div>
            <p className="text-[11px] text-zinc-400">Share in person or on mobile</p>
          </div>
        </div>
      </div>

      {/* Direct Referrals List */}
      <div className="space-y-4 pt-4 border-t border-white/[0.07]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              Invited Members ({directs.length})
            </h2>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0D0E15] border border-white/[0.07] overflow-hidden">
          {directs.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No invited members yet. Share your link above to start building your community.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {directs.map((d: any) => (
                <div
                  key={d.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{d.name}</div>
                    <div className="text-[11px] text-zinc-400">{d.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-[11px]">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                      {d.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
