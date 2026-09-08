'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Shield,
  ArrowRight,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { GlassCard, GlassBadge } from '@/frontend/glass';

export default function AdminPointsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Adjustment Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [pointsDelta, setPointsDelta] = useState(5);
  const [reason, setReason] = useState('Community campaign participation reward');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        if (!selectedUserId && data.users.length > 0) {
          setSelectedUserId(data.users[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsAdjusting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/points/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          pointsDelta: Number(pointsDelta),
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || `Successfully adjusted points by ${pointsDelta > 0 ? '+' : ''}${pointsDelta}.`,
        });
        loadData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to adjust points' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to adjust points due to network error' });
    } finally {
      setIsAdjusting(false);
    }
  };

  const totalCirculation = users.reduce((sum, u) => sum + (u.points || 0), 0);
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/25 text-solar-gold text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Reward Points Administration
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Community Loyalty Points Desk
          </h1>
          <p className="text-xs text-slate-400">
            Monitor community points in circulation, grant contest bonuses, and execute audited adjustments.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08] space-y-1">
          <span className="text-[11px] text-slate-400 font-medium uppercase">Total In Circulation</span>
          <div className="text-2xl font-bold text-solar-gold mt-1 font-mono-num">
            {totalCirculation.toLocaleString()} <span className="text-xs text-slate-400 font-normal">PTS</span>
          </div>
          <span className="text-[10px] text-emerald-400">Across all active members</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08] space-y-1">
          <span className="text-[11px] text-slate-400 font-medium uppercase">Baseline Signup Points</span>
          <div className="text-2xl font-bold text-white mt-1 font-mono-num">
            100 <span className="text-xs text-slate-400 font-normal">PTS</span>
          </div>
          <span className="text-[10px] text-slate-400">Credited on registration</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08] space-y-1">
          <span className="text-[11px] text-slate-400 font-medium uppercase">Solar Run Bonus</span>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono-num">
            +2 <span className="text-xs text-slate-400 font-normal">PTS</span>
          </div>
          <span className="text-[10px] text-slate-400">On SOLAR888 daily completion</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08] space-y-1">
          <span className="text-[11px] text-slate-400 font-medium uppercase">Panel Purchase Bonus</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono-num">
            +2 <span className="text-xs text-slate-400 font-normal">PTS</span>
          </div>
          <span className="text-[10px] text-slate-400">On active panel activation</span>
        </GlassCard>
      </div>

      {/* Manual Adjustment Console */}
      <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] space-y-5 bg-[#0B1426]">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-solar-gold" />
          <div>
            <h2 className="text-base font-bold font-display text-white">Execute Audited Points Adjustment</h2>
            <p className="text-xs text-slate-400">
              Directly credit or debit a member&apos;s points balance with a mandatory audit justification.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-solar-gold/15 border border-solar-gold/40 text-solar-gold'
                : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleAdjust} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Select Member:</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white bg-[#060D1A]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0B1426]">
                  {u.name} ({u.points || 100} PTS) • {u.referralCode}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Points Delta (+/-):</label>
            <input
              type="number"
              value={pointsDelta}
              onChange={(e) => setPointsDelta(parseInt(e.target.value, 10) || 0)}
              className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white"
              placeholder="+5 or -5"
            />
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Audit Justification / Reason:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white"
              placeholder="Reason for audit log..."
              required
            />
          </div>

          <div className="sm:col-span-12 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAdjusting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow transition-all"
            >
              {isAdjusting ? 'Executing Adjustment...' : 'Apply Points Adjustment'}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Member Points Ledger Table */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] space-y-4 bg-[#0B1426]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-white">Member Points Ledger</h2>
            <p className="text-xs text-slate-400">Current points distribution per community member</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, code, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#050B18] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-gold/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4">Leadership Rank</th>
                <th className="py-3 px-4 text-center">Points Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-solar-gold font-bold">{u.referralCode}</td>
                  <td className="py-3.5 px-4 text-slate-300">{u.leadershipLevel?.replace('_', ' ') || 'MEMBER'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-solar-gold/15 text-solar-gold font-bold font-mono-num border border-solar-gold/25">
                      {u.points || 100} PTS
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <GlassBadge variant={u.status === 'ACTIVE' ? 'gold' : 'neutral'} size="sm">
                      {u.status}
                    </GlassBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedUserId(u.id);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-solar-gold text-[11px] font-semibold border border-white/[0.08]"
                    >
                      Select to Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

