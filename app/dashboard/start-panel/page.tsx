'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/auth-context';
import { useRealtime } from '@/lib/realtime/realtime-context';
import { useToast } from '@/components/glass/glass-toast';
import { SolarUnit, GenerationLog } from '@/types';
import confetti from 'canvas-confetti';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  RotateCw,
  X,
  Layers,
  Check,
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

const RUN_DURATION_SECONDS = 3 * 3600; // 3 hours = 10,800 seconds

interface PanelRunState {
  startedAtTimestamp?: number;
  isRunning: boolean;
  isReadyToReceive: boolean;
  isReceived: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercent: number;
}

export default function StartPanelPage() {
  const { user, refreshUser } = useAuth();
  const { executeOptimisticMutation, emitLocalEvent } = useRealtime();
  const { success, error } = useToast();

  const [units, setUnits] = useState<SolarUnit[]>([]);
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Start Code Modal State
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [activeUnitForStart, setActiveUnitForStart] = useState<SolarUnit | null>(null);
  const [startCodeInput, setStartCodeInput] = useState('SOLAR888');
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Receiving state
  const [receivingUnitId, setReceivingUnitId] = useState<string | null>(null);

  // Client-side ticking clock for 1s intervals
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(() => {
    if (user) {
      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUnits(data.units || []);
            setLogs(data.logs || []);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Running State, Countdown, and Progress for a Panel
  const getPanelState = useCallback(
    (unit: SolarUnit): PanelRunState => {
      const todayLog = logs.find((l) => l.unitId === unit.id && l.generationDate === todayStr);

      // Check if already received
      const isReceived =
        todayLog?.status === 'RECEIVED' ||
        (unit.lastOperatedDate === todayStr && !unit.isReceivable && (unit.todayEarnedUsdt || 0) > 0);

      if (isReceived) {
        return {
          isRunning: false,
          isReadyToReceive: false,
          isReceived: true,
          elapsedSeconds: RUN_DURATION_SECONDS,
          remainingSeconds: 0,
          progressPercent: 100,
        };
      }

      // Check if currently running or receivable
      if (unit.isReceivable || todayLog?.status === 'PENDING_RECEIVE' || (todayLog as any)?.status === 'STARTED') {
        const startedTime = (todayLog as any)?.startedAt
          ? new Date((todayLog as any).startedAt).getTime()
          : todayLog?.operatedAt
          ? new Date(todayLog.operatedAt).getTime()
          : Date.now() - 60000; // fallback

        const elapsedSeconds = Math.max(0, Math.floor((currentTime - startedTime) / 1000));
        const remainingSeconds = Math.max(0, RUN_DURATION_SECONDS - elapsedSeconds);
        const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / RUN_DURATION_SECONDS) * 100)));

        // If 3 hours elapsed OR if isReceivable is true, it is ready to receive
        const isReadyToReceive = Boolean(remainingSeconds === 0 || unit.isReceivable);

        return {
          startedAtTimestamp: startedTime,
          isRunning: remainingSeconds > 0 && !isReadyToReceive,
          isReadyToReceive: isReadyToReceive,
          isReceived: false,
          elapsedSeconds,
          remainingSeconds,
          progressPercent: isReadyToReceive ? 100 : progressPercent,
        };
      }

      // Idle State
      return {
        isRunning: false,
        isReadyToReceive: false,
        isReceived: false,
        elapsedSeconds: 0,
        remainingSeconds: RUN_DURATION_SECONDS,
        progressPercent: 0,
      };
    },
    [logs, todayStr, currentTime]
  );

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOpenStartModal = (unit: SolarUnit) => {
    setActiveUnitForStart(unit);
    setStartCodeInput('SOLAR888');
    setStartError(null);
    setStartModalOpen(true);
  };

  const handleConfirmStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnitForStart || !user) return;

    if (!startCodeInput.trim()) {
      setStartError('Please enter the required panel start code.');
      return;
    }

    setStarting(true);
    setStartError(null);

    try {
      const res = await fetch('/api/solar/operate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: activeUnitForStart.id,
          action: 'START',
          startCode: startCodeInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        success('Panel Started!', `${activeUnitForStart.planName} is running for 3 hours! +2 points awarded.`);
        setStartModalOpen(false);
        refreshUser();
        loadData();
        emitLocalEvent('SOLAR_GENERATED', { unitId: activeUnitForStart.id });
      } else {
        setStartError(data.message || 'Invalid start code or start verification failed.');
      }
    } catch {
      setStartError('Network error while attempting to start panel.');
    } finally {
      setStarting(false);
    }
  };

  const handleReceive = async (unitId: string) => {
    if (!user) return;
    setReceivingUnitId(unitId);

    try {
      const res = await fetch('/api/solar/operate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          action: 'RECEIVE',
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#FFC83D', '#10B981', '#38BDF8'],
        });

        success('Daily Earning Received!', `+${(data.creditedAmount || 0).toFixed(2)} USDT credited directly to your balance.`);
        refreshUser();
        loadData();
        emitLocalEvent('BALANCE_UPDATED', {});
      } else {
        error('Receive Failed', data.message || 'Could not collect daily earnings.');
      }
    } catch {
      error('Receive Failed', 'Network error while collecting earnings.');
    } finally {
      setReceivingUnitId(null);
    }
  };

  // Build Daily Earning Entries list for Receive System
  const earningEntries = useMemo(() => {
    return units.map((unit, idx) => {
      const state = getPanelState(unit);
      const todayYield = unit.todayEarnedUsdt || unit.receivableAmountUsdt || (unit.capacityKw ? unit.capacityKw * 0.8 : 0.8);

      return {
        entryNumber: `Entry ${idx + 1}`,
        unitId: unit.id,
        planCode: unit.planCode,
        planName: unit.planName,
        yieldUsdt: todayYield,
        state,
      };
    });
  }, [units, getPanelState]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
            Start Panel & Operations
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Start your owned photovoltaic panels for a 3-hour generation cycle and receive daily USDT yields.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-xs font-mono font-bold flex items-center gap-1.5 shadow-gold-glow">
            <Clock className="w-3.5 h-3.5" />
            <span>3-HOUR RUN TIME</span>
          </div>
        </div>
      </div>

      {/* OWNED PANELS LIST */}
      {units.length === 0 ? (
        <GlassCard elevation={2} className="p-10 rounded-3xl border-white/[0.08] text-center space-y-4">
          <Layers className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Solar Panels Owned Yet</h3>
            <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
              You must purchase an active solar panel (P1 to P6) before you can start daily energy generation operations.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/panels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow hover:scale-105 transition-transform"
            >
              <Zap className="w-4 h-4 fill-[#050B18]" />
              <span>Explore & Buy Panels</span>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {units.map((unit) => {
            const state = getPanelState(unit);
            const isReceiving = receivingUnitId === unit.id;
            const grossIncome = (unit.lifetimeEarnedUsdt || 0) + (unit.todayEarnedUsdt || 0);

            return (
              <GlassCard
                key={unit.id}
                elevation={2}
                className="p-6 rounded-3xl border-white/[0.08] hover:border-solar-gold/40 transition-all space-y-5 flex flex-col justify-between"
              >
                {/* Top Info Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-solar-gold/20 border border-solar-gold/40 flex items-center justify-center text-solar-gold font-bold font-mono">
                        {unit.planCode}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">{unit.planName}</h2>
                        <span className="text-[10px] font-mono text-slate-400">
                          Capacity: <strong className="text-white">{unit.capacityKw} KW</strong>
                        </span>
                      </div>
                    </div>

                    {/* Running State Badge */}
                    <GlassBadge
                      variant={
                        state.isReceived
                          ? 'emerald'
                          : state.isReadyToReceive
                          ? 'gold'
                          : state.isRunning
                          ? 'blue'
                          : 'gold'
                      }
                      size="sm"
                    >
                      {state.isReceived
                        ? 'COMPLETED'
                        : state.isReadyToReceive
                        ? 'READY TO RECEIVE'
                        : state.isRunning
                        ? 'RUNNING'
                        : 'IDLE'}
                    </GlassBadge>
                  </div>

                  {/* Panel Metrics: Rental Price, Gross Income, Running State */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#050B18] border border-white/[0.06] font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Rental Price</span>
                      <strong className="text-white">${(unit.purchasePriceUsdt || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Gross Income</span>
                      <strong className="text-solar-gold">${grossIncome.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Daily Yield</span>
                      <strong className="text-emerald-400">
                        +${(unit.todayEarnedUsdt || unit.receivableAmountUsdt || 0.8).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Countdown Timer & Progress Bar */}
                  <div className="space-y-2 pt-1 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-solar-gold" />
                        Countdown Timer:
                      </span>
                      <span className="font-bold text-solar-gold">
                        {state.isReceived
                          ? 'Cycle Complete'
                          : state.isReadyToReceive
                          ? 'Ready to Collect'
                          : state.isRunning
                          ? formatCountdown(state.remainingSeconds)
                          : '03:00:00 (Idle)'}
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-[#050B18] border border-white/[0.08] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          state.isReceived
                            ? 'bg-emerald-400'
                            : state.isReadyToReceive
                            ? 'bg-gradient-to-r from-solar-gold to-emerald-400'
                            : state.isRunning
                            ? 'bg-gradient-to-r from-solar-amber to-solar-gold animate-pulse'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${state.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Progress: {state.progressPercent}%</span>
                      <span>Target: 3 Hours</span>
                    </div>
                  </div>
                </div>

                {/* Start Button & Receive Button */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
                  {/* Start Button */}
                  <button
                    onClick={() => handleOpenStartModal(unit)}
                    disabled={state.isRunning || state.isReadyToReceive || state.isReceived}
                    className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      state.isRunning || state.isReadyToReceive || state.isReceived
                        ? 'bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed'
                        : 'bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] shadow-gold-glow hover:scale-[1.02]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{state.isRunning ? 'Running...' : 'Start Panel'}</span>
                  </button>

                  {/* Receive Button */}
                  <button
                    onClick={() => handleReceive(unit.id)}
                    disabled={!state.isReadyToReceive || state.isReceived || isReceiving}
                    className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      state.isReceived
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default'
                        : state.isReadyToReceive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#050B18] shadow-lg hover:scale-[1.02] animate-bounce'
                        : 'bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed'
                    }`}
                  >
                    {state.isReceived ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Received ✓</span>
                      </>
                    ) : isReceiving ? (
                      <span>Crediting...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Receive Yield</span>
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* 2. RECEIVE SYSTEM SECTION (Daily Earning Entries) */}
      <div className="space-y-4 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-solar-gold" />
            <h2 className="text-lg font-bold font-display text-white">
              Daily Receive System
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {earningEntries.length} Active Generation Entries
          </span>
        </div>

        <GlassCard elevation={1} className="rounded-3xl border-white/[0.08] overflow-hidden">
          {earningEntries.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-mono">
              No daily earning entries available. Purchase and start a panel to generate earnings.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableCell isHeader>ENTRY</GlassTableCell>
                    <GlassTableCell isHeader>PANEL</GlassTableCell>
                    <GlassTableCell isHeader>ESTIMATED REVENUE</GlassTableCell>
                    <GlassTableCell isHeader>STATUS</GlassTableCell>
                    <GlassTableCell isHeader>ACTION</GlassTableCell>
                  </GlassTableRow>
                </GlassTableHeader>
                <tbody>
                  {earningEntries.map((entry) => {
                    const isReceiving = receivingUnitId === entry.unitId;

                    return (
                      <GlassTableRow key={entry.unitId}>
                        <GlassTableCell>
                          <span className="font-bold text-white font-mono">{entry.entryNumber}</span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <span className="font-mono text-slate-300 text-xs">{entry.planName} ({entry.planCode})</span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <strong className="font-mono text-emerald-400 text-xs">
                            +${entry.yieldUsdt.toFixed(2)} USDT
                          </strong>
                        </GlassTableCell>
                        <GlassTableCell>
                          <GlassBadge
                            variant={
                              entry.state.isReceived
                                ? 'emerald'
                                : entry.state.isReadyToReceive
                                ? 'gold'
                                : entry.state.isRunning
                                ? 'blue'
                                : 'blue'
                            }
                            size="sm"
                          >
                            {entry.state.isReceived
                              ? 'RECEIVED'
                              : entry.state.isReadyToReceive
                              ? 'READY'
                              : entry.state.isRunning
                              ? 'RUNNING'
                              : 'IDLE'}
                          </GlassBadge>
                        </GlassTableCell>
                        <GlassTableCell>
                          {entry.state.isReceived ? (
                            <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Received
                            </span>
                          ) : (
                            <button
                              onClick={() => handleReceive(entry.unitId)}
                              disabled={!entry.state.isReadyToReceive || isReceiving}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                                entry.state.isReadyToReceive
                                  ? 'bg-emerald-500 text-[#050B18] shadow-md hover:scale-105'
                                  : 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {isReceiving ? 'Receiving...' : 'Receive'}
                            </button>
                          )}
                        </GlassTableCell>
                      </GlassTableRow>
                    );
                  })}
                </tbody>
              </GlassTable>
            </div>
          )}
        </GlassCard>
      </div>

      {/* START CODE MODAL */}
      {startModalOpen && activeUnitForStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <GlassCard
            elevation={3}
            className="w-full max-w-md p-6 rounded-3xl border-solar-gold/40 shadow-2xl space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-solar-gold fill-solar-gold" />
                <h3 className="text-base font-bold text-white font-display">
                  Start {activeUnitForStart.planName}
                </h3>
              </div>
              <button
                onClick={() => setStartModalOpen(false)}
                className="p-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Enter your panel start authorization code to initiate today&apos;s 3-hour generation run. You will receive +2 reward points upon successful start.
            </p>

            <form onSubmit={handleConfirmStart} className="space-y-4 font-mono text-xs">
              {startError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{startError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">
                  Start Authorization Code:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOLAR888"
                  value={startCodeInput}
                  onChange={(e) => setStartCodeInput(e.target.value.toUpperCase())}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm tracking-wider font-bold"
                />
                <span className="text-[10px] text-slate-400 block pt-1">
                  Default Authorization Code: <strong className="text-solar-gold">SOLAR888</strong>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#050B18] border border-white/[0.06] space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Cycle Duration:</span>
                  <strong className="text-white">3 Hours</strong>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Reward Bonus:</span>
                  <strong className="text-solar-gold">+2 Points</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStartModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-center font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={starting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {starting ? 'Validating...' : 'Confirm & Start'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
