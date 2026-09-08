'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Download,
} from 'lucide-react';
import { EarningsLedgerEntry } from '@/types';
import { GlassCard } from '@/frontend/glass';

export default function AdminGlobalLedgerPage() {
  const [ledger, setLedger] = useState<EarningsLedgerEntry[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const loadLedger = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ledger');
      const data = await res.json();
      if (data.success && data.ledger) {
        setLedger(data.ledger);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const filtered = ledger.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        (item.userId && item.userId.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.referenceId && item.referenceId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Transaction ID', 'User ID', 'Type', 'Amount USDT', 'Balance Before', 'Balance After', 'Description', 'Reference ID', 'Timestamp'];
    const rows = filtered.map((l) => [
      l.id,
      l.userId,
      l.type,
      (l.amount || 0).toFixed(4),
      (l.balanceBefore || 0).toFixed(4),
      (l.balanceAfter || 0).toFixed(4),
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.referenceId || '',
      new Date(l.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SolarGrid_Global_Audit_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-solar-gold/15 text-solar-gold border border-solar-gold/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            GLOBAL FINANCIAL INTEGRITY DESK
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Master Transaction Ledger</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Immutable system-wide ledger of every financial event, generation yield, referral payout, and deposit.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#050B18] hover:bg-[#0B1426] border border-white/[0.08] text-white font-mono text-xs font-bold transition-all shadow-md"
        >
          <Download className="w-4 h-4 text-solar-gold" />
          Export Global CSV
        </button>
      </GlassCard>

      {/* Main Table Card */}
      <GlassCard elevation={1} className="rounded-3xl p-6 space-y-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              'ALL',
              'RECHARGE',
              'PLAN_PURCHASE',
              'PLAN_UPGRADE',
              'DAILY_SOLAR_EARNING',
              'L1_REFERRAL_REWARD',
              'LEADERSHIP_REWARD',
              'WITHDRAWAL',
            ].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-mono font-bold transition-all ${
                  filterType === t
                    ? 'bg-solar-gold text-[#050B18] font-extrabold shadow-gold-glow'
                    : 'bg-[#050B18]/70 border border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TX ID, user ID, description..."
              className="w-full glass-input border-white/[0.08] pl-10 pr-4 py-2 rounded-xl text-white text-xs font-mono"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase">
                <th className="pb-3 pr-4">Tx ID</th>
                <th className="pb-3 px-4">User ID</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Description</th>
                <th className="pb-3 px-4 text-right">Amount</th>
                <th className="pb-3 px-4 text-right">Balance After</th>
                <th className="pb-3 pl-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length > 0 ? (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 text-solar-gold font-bold select-all font-mono-num">{entry.id}</td>
                    <td className="py-3.5 px-4 text-slate-300 select-all font-mono-num">{entry.userId}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#050B18] border border-white/[0.08] text-solar-gold">
                        {entry.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 max-w-xs truncate">{entry.description}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold whitespace-nowrap font-mono-num ${
                        (entry.amount || 0) >= 0 ? 'text-solar-gold' : 'text-rose-400'
                      }`}
                    >
                      {(entry.amount || 0) >= 0 ? `+${(entry.amount || 0).toFixed(4)}` : (entry.amount || 0).toFixed(4)} USDT
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-mono-num">${(entry.balanceAfter || 0).toFixed(2)}</td>
                    <td className="py-3.5 pl-4 text-right text-slate-400 text-[11px]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No transactions matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
