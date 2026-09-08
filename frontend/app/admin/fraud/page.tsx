'use client';

import React, { useState, useEffect } from 'react';
import { FraudSignal, FraudSeverity } from '@/types';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function AdminFraudSignalsPage() {
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [scanning, setScanning] = useState(false);
  const [scanSummary, setScanSummary] = useState<string | null>(null);

  const loadSignals = () => {
    fetch('/api/admin/fraud')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSignals(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSignals();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    setScanSummary(null);

    try {
      const res = await fetch('/api/admin/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SCAN' }),
      });

      const data = await res.json();
      if (data.success) {
        setScanSummary(
          `Graph scan finished: detected ${data.data.circularLoops} circular loop(s) and ${data.data.duplicatePayouts} shared payout address alert(s).`
        );
        loadSignals();
      }
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (signalId: string) => {
    try {
      const res = await fetch('/api/admin/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE', signalId }),
      });

      const data = await res.json();
      if (data.success) {
        loadSignals();
      }
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  const filtered = signals.filter((s) => {
    if (statusFilter === 'ACTIVE') return !s.resolved;
    if (statusFilter === 'RESOLVED') return s.resolved;
    return true;
  });

  const getSeverityBadge = (sev: FraudSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] bg-[#0B1426]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-400/10 border border-rose-400/25 text-rose-400 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              Automated Risk & Compliance Heuristics
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-2">
              Fraud & Graph Anomaly Signals
            </h1>
            <p className="text-xs text-slate-400">
              Heuristic detection of circular sponsor loops, commission churning, rapid refunds, and shared payout addresses.
            </p>
          </div>

          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="px-5 py-2.5 rounded-2xl bg-solar-gold hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Auditing Graph...' : 'Run Network Graph Scan'}</span>
          </button>
        </div>
      </GlassCard>

      {scanSummary && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scanSummary}</span>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {(['ACTIVE', 'RESOLVED', 'ALL'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === filter
                ? 'bg-solar-gold text-slate-950 shadow-sm'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300'
            }`}
          >
            {filter === 'ACTIVE' ? 'Active Alerts' : filter === 'RESOLVED' ? 'Resolved History' : 'All Signals'}
          </button>
        ))}
      </div>

      {/* Signals List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading fraud signals...</div>
      ) : filtered.length === 0 ? (
        <GlassCard elevation={1} className="p-12 text-center rounded-3xl border-white/[0.08] space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Compliance Alerts</h3>
          <p className="text-xs text-slate-400">All direct-selling network graphs and payout destinations are clean.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((sig) => (
            <GlassCard
              key={sig.id}
              elevation={1}
              className="p-5 rounded-2xl border-white/[0.08] bg-[#0B1426] space-y-3 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {getSeverityBadge(sig.severity)}
                  <span className="text-xs font-mono font-bold text-white">{sig.signalType}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(sig.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Target User:</span>
                  <span className="font-semibold text-white">{sig.userName || sig.userId}</span>
                  {sig.userEmail && <span className="text-slate-400">({sig.userEmail})</span>}
                </div>
                {sig.details?.description && (
                  <p className="text-slate-300 text-[11px] leading-relaxed pt-1">
                    {sig.details.description}
                  </p>
                )}
                {sig.details?.clawbackReason && (
                  <p className="text-rose-400 text-[11px]">
                    Deficit: ${sig.details.deficitAmount} USDT · Reason: {sig.details.clawbackReason}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  Signal ID: {sig.id.substring(0, 14)}...
                </span>
                {!sig.resolved ? (
                  <button
                    onClick={() => handleResolve(sig.id)}
                    className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors"
                  >
                    Mark as Resolved
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
