'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { User, UserStatus } from '@/types';
import {
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  Unlock,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pointModal, setPointModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [pointsDelta, setPointsDelta] = useState<number>(5);
  const [pointReason, setPointReason] = useState<string>('Exemplary regional solar workshop organizing');
  const [adjusting, setAdjusting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointModal.user) return;
    setAdjusting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/points/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pointModal.user.id,
          pointsDelta: Number(pointsDelta),
          reason: pointReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        loadUsers();
        setPointModal({ open: false, user: null });
        setPointReason('');
      } else {
        setFeedback({ type: 'error', text: data.message });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Adjustment failed. Please retry.' });
    } finally {
      setAdjusting(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    const newStatus: UserStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: u.id,
          status: newStatus,
          reason: `Administrative manual status toggle to ${newStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-white">User Accounts & Fleet Governance</h1>
          <p className="text-xs text-slate-400">
            Inspect all contributor profiles, adjust points with mandatory audit logging, and manage access statuses.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-mono flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-solar-gold/15 border border-solar-gold/40 text-solar-gold'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <GlassCard elevation={1} className="p-4 rounded-3xl border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or referral code..."
            className="w-full glass-input border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white"
          >
            <option value="ALL" className="bg-[#0B1426]">All Roles</option>
            <option value="USER" className="bg-[#0B1426]">USER</option>
            <option value="SUPER_ADMIN" className="bg-[#0B1426]">SUPER_ADMIN</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white"
          >
            <option value="ALL" className="bg-[#0B1426]">All Statuses</option>
            <option value="ACTIVE" className="bg-[#0B1426]">ACTIVE</option>
            <option value="SUSPENDED" className="bg-[#0B1426]">SUSPENDED</option>
          </select>
        </div>
      </GlassCard>

      {/* Users Data Table */}
      <div className="glass-1 rounded-3xl border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060D1A]/90 text-slate-400">
                <th className="p-4 font-semibold">MEMBER & EMAIL</th>
                <th className="p-4 font-semibold">REF CODE</th>
                <th className="p-4 font-semibold">SPONSOR</th>
                <th className="p-4 font-semibold text-center">DIRECTS (L1)</th>
                <th className="p-4 font-semibold">LEADERSHIP RANK</th>
                <th className="p-4 font-semibold">POINTS</th>
                <th className="p-4 font-semibold">BALANCE</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 font-semibold text-right">MLM ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.slice(0, 50).map((u: any) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4 text-solar-gold font-bold">{u.referralCode}</td>
                  <td className="p-4">
                    <span className="text-slate-300 block">{u.sponsorName || 'Genesis'}</span>
                    {u.sponsorCode && (
                      <span className="text-[10px] text-slate-500 font-mono">({u.sponsorCode})</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-solar-gold/15 text-solar-gold text-[10px] font-bold border border-solar-gold/25">
                      {u.directsCount || 0}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{u.leadershipLevel?.replace('_', ' ') || 'MEMBER'}</td>
                  <td className="p-4">
                    <span className="font-bold text-solar-gold font-mono-num">{u.points || 100} PTS</span>
                  </td>
                  <td className="p-4 text-white font-bold font-mono-num">${(u.availableBalance || 0).toFixed(2)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.status === 'ACTIVE'
                          ? 'bg-solar-gold/15 text-solar-gold border-solar-gold/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <Link
                      href={`/admin/mlm?userId=${u.id}`}
                      className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                      title="Inspect Genealogy Tree"
                    >
                      <span>Tree</span>
                    </Link>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                      title="360 Profile"
                    >
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => setPointModal({ open: true, user: u })}
                      className="px-2.5 py-1 rounded-xl bg-solar-gold/15 hover:bg-solar-gold/30 border border-solar-gold/40 text-solar-gold text-[11px] font-bold inline-flex items-center gap-1 shadow-gold-glow transition-all"
                      title="Adjust Points"
                    >
                      <Sparkles className="w-3 h-3" /> Pts
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`p-1.5 rounded-xl border text-[11px] inline-flex items-center transition-all ${
                        u.status === 'ACTIVE'
                          ? 'border-rose-500/40 text-rose-400 hover:bg-rose-500/15'
                          : 'border-solar-gold/40 text-solar-gold hover:bg-solar-gold/15'
                      }`}
                      title={u.status === 'ACTIVE' ? 'Suspend Member' : 'Restore Member'}
                    >
                      {u.status === 'ACTIVE' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Point Adjustment Modal */}
      {pointModal.open && pointModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B18]/85 backdrop-blur-md animate-in fade-in">
          <div className="glass-1 p-6 sm:p-8 rounded-3xl border border-solar-gold/50 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setPointModal({ open: false, user: null })}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-solar-gold font-bold uppercase tracking-wider">
                ADMIN POINT ADJUSTMENT (AUDITED)
              </span>
              <h3 className="text-lg font-bold text-white">
                Adjust Points for {pointModal.user.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Current Balance: <strong className="text-solar-gold font-mono-num">{pointModal.user.points} Points</strong>
              </p>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Points Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(parseInt(e.target.value, 10))}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-bold text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mandatory Audit Reason</label>
                <textarea
                  rows={3}
                  required
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  placeholder="Provide explicit operational rationale for this adjustment..."
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] text-[11px] text-slate-400">
                New resulting score: <strong className="text-solar-gold font-mono-num">{Math.max(0, pointModal.user.points + pointsDelta)} Points</strong>. An immutable audit record will be logged.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPointModal({ open: false, user: null })}
                  className="flex-1 py-2.5 rounded-2xl bg-[#0B1426] border border-white/[0.08] text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting || !pointReason.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold shadow-gold-glow disabled:opacity-50"
                >
                  {adjusting ? 'Applying...' : 'Execute Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
