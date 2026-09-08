'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  FileText,
  TrendingUp,
  Zap,
  ArrowDownToLine,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

interface RecordItem {
  id: string;
  type: 'EARNING' | 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION';
  title: string;
  subtitle: string;
  amount: number;
  isCredit: boolean;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED' | 'RUNNING';
  date: string;
  rawDate: number;
}

export default function RecordsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'EARNINGS' | 'DEPOSITS' | 'WITHDRAWALS' | 'COMMISSIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<RecordItem[]>([]);

  const loadAllRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [overviewRes, rechargesRes, withdrawalsRes, mlmRes] = await Promise.all([
        fetch('/api/dashboard/overview').then((r) => r.json()).catch(() => ({})),
        fetch('/api/recharge/list').then((r) => r.json()).catch(() => ({})),
        fetch('/api/withdrawals/request').then((r) => r.json()).catch(() => ({})),
        fetch('/api/mlm/stats').then((r) => r.json()).catch(() => ({})),
      ]);

      const items: RecordItem[] = [];

      // 1. Generation logs (earnings)
      if (overviewRes.success && Array.isArray(overviewRes.logs)) {
        overviewRes.logs.forEach((log: any) => {
          const dateObj = new Date(log.operatedAt || log.generationDate || Date.now());
          items.push({
            id: `gen-${log.id}`,
            type: 'EARNING',
            title: `Solar Generation Yield (${log.planCode || 'Daily'})`,
            subtitle: `Unit #${log.unitId?.slice(0, 8) || 'Solar Unit'}`,
            amount: Number(log.earnedUsdt || 0),
            isCredit: true,
            status: log.status === 'RECEIVED' ? 'COMPLETED' : log.status === 'PENDING_RECEIVE' ? 'RUNNING' : 'COMPLETED',
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rawDate: dateObj.getTime(),
          });
        });
      }

      // 2. Recharges (deposits)
      if (rechargesRes.success && Array.isArray(rechargesRes.recharges)) {
        rechargesRes.recharges.forEach((rec: any) => {
          const dateObj = new Date(rec.createdAt || Date.now());
          items.push({
            id: `rec-${rec.id}`,
            type: 'DEPOSIT',
            title: `Deposit (${rec.network || 'USDT'})`,
            subtitle: rec.txHash ? `Tx: ${rec.txHash.slice(0, 12)}...` : 'Account Top-up',
            amount: Number(rec.amountUsdt || 0),
            isCredit: true,
            status: rec.status === 'APPROVED' ? 'COMPLETED' : rec.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rawDate: dateObj.getTime(),
          });
        });
      }

      // 3. Withdrawals
      if (withdrawalsRes.success && Array.isArray(withdrawalsRes.withdrawals)) {
        withdrawalsRes.withdrawals.forEach((wd: any) => {
          const dateObj = new Date(wd.createdAt || Date.now());
          items.push({
            id: `wd-${wd.id}`,
            type: 'WITHDRAWAL',
            title: `Withdrawal (${wd.network || 'USDT'})`,
            subtitle: `To: ${wd.walletAddress?.slice(0, 10)}... (Fee: ${wd.feeUsdt?.toFixed(2) || '0.00'})`,
            amount: Number(wd.amountUsdt || 0),
            isCredit: false,
            status: wd.status === 'APPROVED' ? 'COMPLETED' : wd.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rawDate: dateObj.getTime(),
          });
        });
      }

      // 4. MLM Referral Commissions
      if (mlmRes.success && Array.isArray(mlmRes.commissions)) {
        mlmRes.commissions.forEach((comm: any) => {
          const dateObj = new Date(comm.createdAt || Date.now());
          items.push({
            id: `comm-${comm.id}`,
            type: 'COMMISSION',
            title: `Referral Reward (Level ${comm.level || 1})`,
            subtitle: `From user: ${comm.sourceUserEmail || 'Team member'}`,
            amount: Number(comm.amountUsdt || 0),
            isCredit: true,
            status: 'COMPLETED',
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rawDate: dateObj.getTime(),
          });
        });
      }

      // Sort newest first
      items.sort((a, b) => b.rawDate - a.rawDate);
      setRecords(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllRecords();
  }, [loadAllRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Tab filter
      if (activeTab === 'EARNINGS' && item.type !== 'EARNING') return false;
      if (activeTab === 'DEPOSITS' && item.type !== 'DEPOSIT') return false;
      if (activeTab === 'WITHDRAWALS' && item.type !== 'WITHDRAWAL') return false;
      if (activeTab === 'COMMISSIONS' && item.type !== 'COMMISSION') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            History & Records
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete transaction record of all your daily earnings, deposits, withdrawals, and rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/recharge"
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white transition-colors"
          >
            Add Funds
          </Link>
          <Link
            href="/dashboard/withdrawal"
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white transition-colors"
          >
            Withdraw
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'EARNINGS', label: 'Daily Earnings' },
            { id: 'DEPOSITS', label: 'Deposits' },
            { id: 'WITHDRAWALS', label: 'Withdrawals' },
            { id: 'COMMISSIONS', label: 'Referrals' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.07] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Records List / Table */}
      <div className="rounded-2xl bg-[#0D0E15] border border-white/[0.07] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">Loading records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-white">No records found</p>
            <p className="text-xs text-zinc-400">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'No transactions match this category yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {filteredRecords.map((item) => {
              return (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors"
                >
                  {/* Left: Icon + Titles */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === 'EARNING'
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : item.type === 'DEPOSIT'
                          ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                          : item.type === 'WITHDRAWAL'
                          ? 'bg-zinc-800 text-zinc-300 border border-white/[0.08]'
                          : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      }`}
                    >
                      {item.type === 'EARNING' && <TrendingUp className="w-4 h-4" />}
                      {item.type === 'DEPOSIT' && <ArrowDownLeft className="w-4 h-4" />}
                      {item.type === 'WITHDRAWAL' && <ArrowUpRight className="w-4 h-4" />}
                      {item.type === 'COMMISSION' && <Users className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount + Status + Date */}
                  <div className="flex flex-col items-end shrink-0">
                    <div
                      className={`text-xs font-bold font-mono ${
                        item.isCredit ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {item.isCredit ? '+' : '-'}${item.amount.toFixed(2)} USDT
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                            : item.status === 'PENDING' || item.status === 'RUNNING'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : 'bg-red-400/10 text-red-400 border border-red-400/20'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-zinc-400">{item.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
