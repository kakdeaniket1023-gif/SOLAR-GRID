'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Laptop,
  Search,
} from 'lucide-react';
import { UserSession } from '@/types';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassTable,
  GlassTableHeader,
  GlassTableRow,
  GlassTableCell,
} from '@/frontend/glass';

export default function AdminSessionsCenterPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED' | 'HIGH_RISK'>('ALL');
  const [search, setSearch] = useState('');

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (data.success && data.sessions) {
        setSessions(data.sessions);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVOKE_ONE', sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        loadSessions();
      }
    } catch {
      // ignore
    }
  };

  const filtered = sessions.filter((s) => {
    if (filter === 'ACTIVE' && s.sessionStatus !== 'ACTIVE') return false;
    if (filter === 'REVOKED' && s.sessionStatus !== 'REVOKED') return false;
    if (filter === 'HIGH_RISK' && s.riskScore !== 'HIGH') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (s.userName && s.userName.toLowerCase().includes(q)) ||
        (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
        (s.ipAddress && s.ipAddress.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q)) ||
        (s.browser && s.browser.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = sessions.filter((s) => s.sessionStatus === 'ACTIVE').length;
  const highRiskCount = sessions.filter((s) => s.riskScore === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Banner */}
      <GlassCard elevation={2} className="p-5 sm:p-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GlassBadge variant="gold" dot>
                TELEMETRY & DEVICE SECURITY
              </GlassBadge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
              Sessions & Device Security Center
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time telemetry of authenticated sessions, suspicious IPs, and device fingerprints.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Active Sessions</span>
              <span className="text-base font-bold text-solar-gold font-mono-num">{activeCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
              <span className="text-[10px] text-rose-400 block uppercase font-bold">High Risk Flags</span>
              <span className="text-base font-bold text-rose-400 font-mono-num">{highRiskCount}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. Filter & Search Bar */}
      <GlassCard elevation={1} className="p-5 space-y-4 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'ACTIVE', 'REVOKED', 'HIGH_RISK'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-2xl text-xs font-mono font-bold transition-all ${
                  filter === f
                    ? 'bg-solar-gold text-[#050B18] font-extrabold shadow-gold-glow'
                    : 'bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative max-w-sm w-full">
            <GlassInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, IP, location, device..."
              leftIcon={Search}
            />
          </div>
        </div>

        {/* Sessions Table */}
        <GlassTable>
          <GlassTableHeader>
            <GlassTableRow>
              <GlassTableCell isHeader>User</GlassTableCell>
              <GlassTableCell isHeader>Device & OS</GlassTableCell>
              <GlassTableCell isHeader>IP Address</GlassTableCell>
              <GlassTableCell isHeader>Location</GlassTableCell>
              <GlassTableCell isHeader>Status & Risk</GlassTableCell>
              <GlassTableCell isHeader>Login Time</GlassTableCell>
              <GlassTableCell isHeader align="right">Actions</GlassTableCell>
            </GlassTableRow>
          </GlassTableHeader>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <GlassTableRow key={s.id}>
                  <GlassTableCell>
                    <span className="font-bold text-white block">{s.userName || s.userId}</span>
                    <span className="text-[10px] text-slate-400 block font-mono truncate">{s.userEmail || ''}</span>
                  </GlassTableCell>
                  <GlassTableCell className="font-mono text-slate-200">
                    <div className="flex items-center gap-2">
                      {s.deviceType === 'Mobile' ? (
                        <Smartphone className="w-4 h-4 text-solar-blue shrink-0" />
                      ) : (
                        <Laptop className="w-4 h-4 text-solar-gold shrink-0" />
                      )}
                      <span>{s.operatingSystem} ({s.browser})</span>
                    </div>
                  </GlassTableCell>
                  <GlassTableCell className="font-mono text-slate-300 select-all font-bold font-mono-num">
                    {s.ipAddress}
                  </GlassTableCell>
                  <GlassTableCell className="font-mono text-slate-400 truncate max-w-[140px]">
                    {s.location}
                  </GlassTableCell>
                  <GlassTableCell>
                    <div className="flex items-center gap-1.5">
                      <GlassBadge
                        variant={s.sessionStatus === 'ACTIVE' ? 'gold' : 'neutral'}
                        size="sm"
                      >
                        {s.sessionStatus}
                      </GlassBadge>
                      {s.riskScore === 'HIGH' && (
                        <GlassBadge variant="danger" size="sm">
                          HIGH RISK
                        </GlassBadge>
                      )}
                    </div>
                  </GlassTableCell>
                  <GlassTableCell className="font-mono text-slate-400 text-[11px]">
                    {new Date(s.loginTime).toLocaleTimeString()} • {new Date(s.loginTime).toLocaleDateString()}
                  </GlassTableCell>
                  <GlassTableCell align="right">
                    {s.sessionStatus === 'ACTIVE' ? (
                      <GlassButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleRevoke(s.id)}
                      >
                        Revoke
                      </GlassButton>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Terminated</span>
                    )}
                  </GlassTableCell>
                </GlassTableRow>
              ))
            ) : (
              <GlassTableRow>
                <GlassTableCell colSpan={7} align="center" className="py-12 text-slate-400 font-mono">
                  No sessions matching criteria.
                </GlassTableCell>
              </GlassTableRow>
            )}
          </tbody>
        </GlassTable>
      </GlassCard>
    </div>
  );
}
