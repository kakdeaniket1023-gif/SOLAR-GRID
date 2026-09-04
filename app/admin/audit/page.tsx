'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuditLog } from '@/types';
import { Search, Download } from 'lucide-react';
import { GlassCard } from '@/components/glass';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.auditLogs) {
        setLogs(data.auditLogs);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.targetType && l.targetType.toLowerCase().includes(q)) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
      (l.actorId && l.actorId.toLowerCase().includes(q))
    );
  });

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor ID', 'Actor Role', 'Action', 'Target Type', 'Target ID', 'Details'];
    const rows = filtered.map((l) => [
      l.createdAt,
      `"${l.actorEmail || l.actorId}"`,
      l.actorRole,
      l.action,
      l.targetType,
      l.targetId,
      `"${JSON.stringify(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `solargrid_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-white">Append-Only Audit Trail</h1>
          <p className="text-xs text-slate-400">
            Cryptographically sealed and immutable log of all administrative actions, rule modifications, and financial approvals.
          </p>
        </div>

        <button
          onClick={exportAuditCSV}
          className="px-4 py-2.5 rounded-2xl bg-[#050B18] hover:bg-[#0B1426] border border-white/[0.08] text-xs font-mono font-bold text-solar-gold flex items-center gap-2 self-start sm:self-auto transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          Export Audit Trail CSV
        </button>
      </GlassCard>

      {/* Search Bar */}
      <GlassCard elevation={1} className="p-4 rounded-3xl border-white/[0.08] text-xs font-mono">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs by actor, action, or target..."
            className="w-full glass-input border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-white"
          />
        </div>
      </GlassCard>

      {/* Audit Log Table */}
      <div className="glass-1 rounded-3xl border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060D1A]/90 text-slate-400">
                <th className="p-4 font-semibold">TIMESTAMP</th>
                <th className="p-4 font-semibold">ACTOR</th>
                <th className="p-4 font-semibold">ACTION</th>
                <th className="p-4 font-semibold">TARGET</th>
                <th className="p-4 font-semibold">AUDIT DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{l.actorEmail || l.actorId}</div>
                    <div className="text-[10px] text-solar-gold font-bold">{l.actorRole}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-solar-gold/15 text-solar-gold border border-solar-gold/40">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-bold">
                    {l.targetType} <span className="text-slate-400 text-[10px]">({l.targetId})</span>
                  </td>
                  <td className="p-4 text-slate-300 max-w-md truncate">{JSON.stringify(l.details || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
