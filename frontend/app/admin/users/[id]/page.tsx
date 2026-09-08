'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  User,
  SolarUnit,
  RechargeRecord,
  WithdrawalRequest,
  EarningsLedgerEntry,
  UserSession,
  SupportTicket,
  Notification,
  AuditLog,
} from '@/types';
import {
  ArrowLeft,
  Smartphone,
} from 'lucide-react';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassTabs,
  GlassTable,
  GlassTableHeader,
  GlassTableRow,
  GlassTableCell,
} from '@/frontend/glass';

export default function SuperAdminUser360Page() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Related Sub-entities
  const [units, setUnits] = useState<SolarUnit[]>([]);
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [ledger, setLedger] = useState<EarningsLedgerEntry[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);

  // Status mutation state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadUserData = useCallback(async () => {
    if (userId) {
      try {
        const res = await fetch(`/api/admin/users?id=${userId}`);
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setUnits(data.units || []);
          setRecharges(data.recharges || []);
          setWithdrawals(data.withdrawals || []);
          setLedger(data.ledger || []);
          setAuditLogs(data.auditLogs || []);
          setNetworkStats(data.networkStats || null);
        }
      } catch {
        // ignore
      }
    }
  }, [userId]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (!user) {
    return (
      <GlassCard elevation={1} className="py-16 text-center space-y-3 border-white/[0.08]">
        <h2 className="text-lg font-bold text-white">User Not Found</h2>
        <p className="text-xs text-slate-400 font-mono">No user found with ID: {userId}</p>
        <Link href="/admin/users">
          <GlassButton variant="primary" size="sm" leftIcon={ArrowLeft}>
            Back to Users List
          </GlassButton>
        </Link>
      </GlassCard>
    );
  }

  const tabs = [
    { id: 'OVERVIEW', label: '1. Overview' },
    { id: 'FINANCIAL', label: '2. Financial' },
    { id: 'PANELS', label: '3. Panels Fleet' },
    { id: 'MLM', label: '4. MLM Network' },
    { id: 'SECURITY', label: '5. Security & Devices' },
    { id: 'SUPPORT', label: '6. Support Desk' },
    { id: 'NOTIFICATIONS', label: '7. Notifications' },
    { id: 'AUDIT', label: '8. Audit Timeline' },
  ];

  const handleToggleStatus = async (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: newStatus,
          reason: `Admin toggle status to ${newStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadUserData();
      }
    } catch {
      // ignore
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const activePanel = units.find((u) => u.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* 1. Header Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Users
        </Link>

        <div className="flex items-center gap-2">
          {user.status === 'ACTIVE' ? (
            <GlassButton
              variant="danger"
              size="sm"
              onClick={() => handleToggleStatus('SUSPENDED')}
              isLoading={isUpdatingStatus}
            >
              Suspend Account
            </GlassButton>
          ) : (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => handleToggleStatus('ACTIVE')}
              isLoading={isUpdatingStatus}
            >
              Reactivate Account
            </GlassButton>
          )}
        </div>
      </div>

      {/* 2. Top Identity Hero Card */}
      <GlassCard elevation={2} className="p-5 sm:p-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-solar-gold/30 to-solar-amber/20 border border-solar-gold/40 flex items-center justify-center text-xl font-bold font-mono text-white shadow-gold-glow">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white">{user.name}</h1>
                <GlassBadge variant={user.role === 'SUPER_ADMIN' ? 'gold' : 'blue'} size="sm">
                  {user.role}
                </GlassBadge>
                <GlassBadge variant={user.status === 'ACTIVE' ? 'gold' : 'danger'} size="sm">
                  {user.status}
                </GlassBadge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: <span className="text-slate-200 font-bold select-all font-mono-num">{user.id}</span> • Registered on{' '}
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#050B18]/90 border border-white/[0.08] text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">AVAILABLE BALANCE</span>
              <span className="text-sm font-bold text-solar-gold font-mono-num">
                ${(user.availableBalance || 0).toFixed(2)} USDT
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#050B18]/90 border border-white/[0.08] text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">TOTAL EARNED</span>
              <span className="text-sm font-bold text-solar-amber font-mono-num">
                ${(user.totalEarned || 0).toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 3. 8-Tab Segmented View Navigation */}
      <GlassTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        size="sm"
      />

      {/* 4. Tab Views */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlassCard elevation={1} className="p-5 space-y-4 font-mono text-xs border-white/[0.08]">
            <h3 className="text-sm font-bold font-display text-white">Identity & Account Attributes</h3>
            <div className="space-y-2.5 divide-y divide-white/[0.04]">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">User ID:</span>
                <span className="text-white font-bold select-all font-mono-num">{user.id}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Full Name:</span>
                <span className="text-white font-bold">{user.name}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Email Address:</span>
                <span className="text-slate-200">{user.email}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{user.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Country:</span>
                <span className="text-slate-200">{user.country || 'Global'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Role:</span>
                <span className="text-solar-gold font-bold">{user.role}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard elevation={1} className="p-5 space-y-4 font-mono text-xs border-white/[0.08]">
            <h3 className="text-sm font-bold font-display text-white">Ecosystem Standing</h3>
            <div className="space-y-2.5 divide-y divide-white/[0.04]">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Referral Code:</span>
                <span className="text-solar-gold font-bold font-mono-num">{user.referralCode}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Sponsor ID:</span>
                <span className="text-slate-200 font-mono-num">{user.sponsorId || 'Genesis (None)'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Leadership Rank:</span>
                <span className="text-solar-gold font-bold">{user.leadershipLevel.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Loyalty Points:</span>
                <span className="text-white font-bold font-mono-num">{user.points} PTS</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Active Solar Unit:</span>
                <span className="text-solar-gold font-bold">
                  {activePanel ? `${activePanel.planName} (${activePanel.capacityKw} kW)` : 'None'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Total Solar Units Owned:</span>
                <span className="text-white font-bold font-mono-num">{units.length}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: FINANCIAL */}
      {activeTab === 'FINANCIAL' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Available Balance</span>
              <span className="text-lg font-bold text-solar-gold mt-1 block font-mono-num">
                ${(user.availableBalance || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Earned</span>
              <span className="text-lg font-bold text-white mt-1 block font-mono-num">
                ${(user.totalEarned || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Recharges</span>
              <span className="text-lg font-bold text-solar-amber mt-1 block font-mono-num">
                {recharges.length} Deposits
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Withdrawals</span>
              <span className="text-lg font-bold text-solar-blue mt-1 block font-mono-num">
                {withdrawals.length} Requests
              </span>
            </div>
          </div>

          {/* Ledger table */}
          <GlassCard elevation={1} className="p-5 space-y-3 border-white/[0.08]">
            <h3 className="text-sm font-bold font-display text-white">Double-Entry Ledger Records ({ledger.length})</h3>
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableCell isHeader>Transaction ID</GlassTableCell>
                  <GlassTableCell isHeader>Type</GlassTableCell>
                  <GlassTableCell isHeader>Description</GlassTableCell>
                  <GlassTableCell isHeader align="right">Amount</GlassTableCell>
                  <GlassTableCell isHeader align="right">Balance After</GlassTableCell>
                  <GlassTableCell isHeader align="right">Timestamp</GlassTableCell>
                </GlassTableRow>
              </GlassTableHeader>
              <tbody>
                {ledger.map((tx) => (
                  <GlassTableRow key={tx.id}>
                    <GlassTableCell className="font-mono text-slate-400 font-mono-num">{tx.id.substring(0, 10)}</GlassTableCell>
                    <GlassTableCell>
                      <GlassBadge variant={(tx.amount || 0) >= 0 ? 'gold' : 'danger'} size="sm">
                        {tx.type}
                      </GlassBadge>
                    </GlassTableCell>
                    <GlassTableCell className="text-slate-200 truncate max-w-xs">{tx.description}</GlassTableCell>
                    <GlassTableCell align="right" className={`font-mono font-bold font-mono-num ${(tx.amount || 0) >= 0 ? 'text-solar-gold' : 'text-rose-400'}`}>
                      {(tx.amount || 0) >= 0 ? `+${(tx.amount || 0).toFixed(2)}` : (tx.amount || 0).toFixed(2)} USDT
                    </GlassTableCell>
                    <GlassTableCell align="right" className="font-mono text-slate-300 font-mono-num">
                      ${(tx.balanceAfter || 0).toFixed(2)}
                    </GlassTableCell>
                    <GlassTableCell align="right" className="font-mono text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </GlassTableCell>
                  </GlassTableRow>
                ))}
              </tbody>
            </GlassTable>
          </GlassCard>
        </div>
      )}

      {/* TAB 3: PANELS */}
      {activeTab === 'PANELS' && (
        <GlassCard elevation={1} className="p-5 space-y-4 border-white/[0.08]">
          <h3 className="text-sm font-bold font-display text-white">Photovoltaic Fleets & Units ({units.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {units.map((u) => (
              <div key={u.id} className="p-4 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{u.planName} ({u.planCode})</span>
                  <GlassBadge variant={u.status === 'ACTIVE' ? 'gold' : 'neutral'} size="sm">
                    {u.status}
                  </GlassBadge>
                </div>
                <div className="text-slate-400 text-[11px]">
                  ID: {u.id} • {u.capacityKw} kW • {u.location}
                </div>
                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">DAYS</span>
                    <span className="font-bold text-white font-mono-num">{u.workingDaysCompleted}/{u.workingDaysTotal || 43}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">TODAY YIELD</span>
                    <span className="font-bold text-solar-gold font-mono-num">+${(u.todayEarnedUsdt || 1.2).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">LIFETIME YIELD</span>
                    <span className="font-bold text-solar-amber font-mono-num">${(u.totalEarnedUsdt || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* TAB 4: MLM */}
      {activeTab === 'MLM' && (
        <div className="space-y-5 font-mono text-xs">
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Direct (L1)</span>
              <span className="text-xl font-bold text-solar-gold mt-1 block font-mono-num">
                {networkStats?.directCount || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Level 2</span>
              <span className="text-xl font-bold text-solar-amber mt-1 block font-mono-num">
                {networkStats?.l2Count || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Level 3</span>
              <span className="text-xl font-bold text-solar-blue mt-1 block font-mono-num">
                {networkStats?.l3Count || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#050B18]/90 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Downline</span>
              <span className="text-xl font-bold text-white mt-1 block font-mono-num">
                {networkStats?.totalTeamCount || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-white">Direct Referrals (L1 Members)</h3>
            <Link
              href={`/admin/mlm?userId=${user.id}`}
              className="px-3 py-1.5 rounded-xl bg-solar-gold/15 hover:bg-solar-gold/25 border border-solar-gold/30 text-solar-gold font-bold text-xs flex items-center gap-1.5 transition-all shadow-gold-glow"
            >
              <span>Inspect Full Genealogy Tree →</span>
            </Link>
          </div>

          <GlassCard elevation={1} className="p-5 space-y-3 border-white/[0.08]">
            <div className="space-y-2">
              {(networkStats?.directReferrals || []).map((refUser: User) => (
                <div key={refUser.id} className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{refUser.name}</span>
                    <span className="text-[10px] text-slate-400 block">{refUser.email} • Code: {refUser.referralCode}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono font-bold text-[11px]">{refUser.points || 100} PTS</span>
                    <GlassBadge variant="gold" size="sm">{refUser.leadershipLevel.replace('_', ' ')}</GlassBadge>
                    <Link
                      href={`/admin/mlm?userId=${refUser.id}`}
                      className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px]"
                    >
                      Tree
                    </Link>
                  </div>
                </div>
              ))}
              {(!networkStats?.directReferrals || networkStats.directReferrals.length === 0) && (
                <div className="py-6 text-center text-slate-500 text-xs">
                  This member does not have any direct referrals yet.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-5 font-mono text-xs">
          <GlassCard elevation={1} className="p-5 space-y-3 border-white/[0.08]">
            <h3 className="text-sm font-bold font-display text-white">Authorized Device Sessions ({sessions.length})</h3>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-bold text-white">{s.operatingSystem} ({s.browser})</span>
                      <span className="text-[10px] text-slate-400 block">IP: {s.ipAddress} • {s.location}</span>
                    </div>
                  </div>
                  <GlassBadge variant={s.sessionStatus === 'ACTIVE' ? 'gold' : 'neutral'} size="sm">
                    {s.sessionStatus}
                  </GlassBadge>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 6: SUPPORT */}
      {activeTab === 'SUPPORT' && (
        <GlassCard elevation={1} className="p-5 space-y-3 font-mono text-xs border-white/[0.08]">
          <h3 className="text-sm font-bold font-display text-white">Support Tickets ({tickets.length})</h3>
          <div className="space-y-2">
            {tickets.length > 0 ? (
              tickets.map((t) => (
                <div key={t.id} className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{t.subject}</span>
                    <span className="text-[10px] text-slate-400 block">{t.category} • Created {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <GlassBadge variant={t.status === 'RESOLVED' ? 'gold' : 'amber'} size="sm">
                    {t.status}
                  </GlassBadge>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400">No support tickets filed by this user.</div>
            )}
          </div>
        </GlassCard>
      )}

      {/* TAB 7: NOTIFICATIONS */}
      {activeTab === 'NOTIFICATIONS' && (
        <GlassCard elevation={1} className="p-5 space-y-3 font-mono text-xs border-white/[0.08]">
          <h3 className="text-sm font-bold font-display text-white">Dispatched Notifications ({notifications.length})</h3>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">{n.title}</span>
                  <p className="text-slate-300 text-[11px] font-sans mt-0.5">{n.message}</p>
                </div>
                <GlassBadge variant={n.read ? 'neutral' : 'gold'} size="sm">
                  {n.read ? 'Read' : 'Unread'}
                </GlassBadge>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* TAB 8: AUDIT */}
      {activeTab === 'AUDIT' && (
        <GlassCard elevation={1} className="p-5 space-y-3 font-mono text-xs border-white/[0.08]">
          <h3 className="text-sm font-bold font-display text-white">Security & Regulatory Audit Events ({auditLogs.length})</h3>
          <div className="space-y-2">
            {auditLogs.map((a) => (
              <div key={a.id} className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">{a.action}</span>
                  <span className="text-[10px] text-slate-400 block">
                    Actor: {a.actorRole} ({a.actorEmail || a.actorId})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
