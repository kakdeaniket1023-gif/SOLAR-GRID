'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  Copy,
  Check,
  Share2,
  DollarSign,
  Award,
  Sparkles,
  ShieldCheck,
  TrendingUp,
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

export default function InvitePage() {
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const referralCode = user?.referralCode || 'SOLAR-DEMO';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://solargrid.io';
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard elevation={2} className="p-6 sm:p-8 rounded-3xl border-white/[0.08] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GlassBadge variant="gold" dot>
                COMMUNITY INVITATION PROGRAM
              </GlassBadge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              Invite & Expand Clean Energy
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-sans leading-relaxed">
              Share your personal referral credentials with friends and contributors. Earn recurring commission rewards from community generation operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-2 hover:scale-105 transition-transform"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Referral Credentials & Dynamic QR Code Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Referral Link & Code */}
        <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] md:col-span-8 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Share2 className="w-4 h-4 text-solar-gold" />
            <h2 className="text-sm font-bold uppercase font-mono text-slate-300">
              Your Referral Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Referral Code */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase">
                Your Unique Referral Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3.5 rounded-2xl bg-[#050B18] border border-white/[0.08] text-solar-gold font-mono font-bold text-xl tracking-wider">
                  {referralCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-mono text-xs font-bold border border-white/[0.08] flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Referral Link */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase">
                Direct Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3.5 rounded-2xl bg-[#050B18] border border-white/[0.08] text-slate-300 font-mono text-xs truncate">
                  {referralLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-3.5 rounded-2xl bg-solar-gold/20 hover:bg-solar-gold/30 text-solar-gold font-mono text-xs font-bold border border-solar-gold/40 flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Dynamic QR Code Card */}
        <GlassCard
          elevation={2}
          className="p-6 rounded-3xl border-white/[0.08] md:col-span-4 flex flex-col items-center justify-center text-center space-y-3"
        >
          <div className="p-3 bg-white rounded-2xl shadow-xl">
            <QRCodeSVG value={referralLink} size={135} level="M" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white font-mono">Dynamic Mobile QR</div>
            <div className="text-[10px] text-slate-400 font-mono">Scan to register directly with your code</div>
          </div>
        </GlassCard>
      </div>

      {/* Referral Network Overview */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-solar-gold" />
            <h2 className="text-base font-bold font-display text-white">
              Direct Referral Chain ({directs.length})
            </h2>
          </div>
        </div>

        {directs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-mono">
            No direct referrals yet. Share your link or QR code above to start building your community.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableCell isHeader>MEMBER NAME</GlassTableCell>
                  <GlassTableCell isHeader>EMAIL</GlassTableCell>
                  <GlassTableCell isHeader>JOIN DATE</GlassTableCell>
                  <GlassTableCell isHeader>STATUS</GlassTableCell>
                </GlassTableRow>
              </GlassTableHeader>
              <tbody>
                {directs.map((d: any) => (
                  <GlassTableRow key={d.id}>
                    <GlassTableCell>
                      <strong className="text-white font-mono text-xs">{d.name}</strong>
                    </GlassTableCell>
                    <GlassTableCell>
                      <span className="text-slate-400 font-mono text-xs">{d.email}</span>
                    </GlassTableCell>
                    <GlassTableCell>
                      <span className="text-slate-400 font-mono text-xs">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </GlassTableCell>
                    <GlassTableCell>
                      <GlassBadge variant="emerald" size="sm">
                        {d.status || 'ACTIVE'}
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
  );
}
