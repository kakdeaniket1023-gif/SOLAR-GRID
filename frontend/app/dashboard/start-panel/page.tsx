'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import { useRealtime } from '@/frontend/contexts/realtime-context';
import { useToast } from '@/frontend/glass/glass-toast';
import { SolarUnit, GenerationLog } from '@/types';
import confetti from 'canvas-confetti';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  X,
  Layers,
  Check,
  ArrowRight,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

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
  const { emitLocalEvent } = useRealtime();
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

      if (unit.isReceivable || todayLog?.status === 'PENDING_RECEIVE' || (todayLog as any)?.status === 'STARTED') {
        const startedTime = (todayLog as any)?.startedAt
          ? new Date((todayLog as any).startedAt).getTime()
          : todayLog?.operatedAt
          ? new Date(todayLog.operatedAt).getTime()
          : Date.now() - 60000;

        const elapsedSeconds = Math.max(0, Math.floor((currentTime - startedTime) / 1000));
        const remainingSeconds = Math.max(0, RUN_DURATION_SECONDS - elapsedSeconds);
        const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / RUN_DURATION_SECONDS) * 100)));

        const isReadyToReceive = Boolean(remainingSeconds === 0 || unit.isReceivable);

        return {
          startedAtTimestamp: startedTime,
          isRunning: remainingSeconds > 0 && !isReadyToReceive,
          isReadyToReceive,
          isReceived: false,
          elapsedSeconds,
          remainingSeconds,
          progressPercent: isReadyToReceive ? 100 : progressPercent,
        };
      }

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
      setStartError('Please enter the activation code.');
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
        success('Panel Started!', `${activeUnitForStart.planName} is running its 3-hour generation cycle.`);
        setStartModalOpen(false);
        refreshUser();
        loadData();
        emitLocalEvent('SOLAR_GENERATED', { unitId: activeUnitForStart.id });
      } else {
        setStartError(data.message || 'Invalid activation code.');
      }
    } catch {
      setStartError('Network error while starting panel.');
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
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#FBBF24', '#10B981', '#38BDF8'],
        });

        success('Earnings Collected!', `+${(data.creditedAmount || 0).toFixed(2)} USDT added to your balance.`);
        refreshUser();
        loadData();
        emitLocalEvent('BALANCE_UPDATED', {});
      } else {
        error('Collection Failed', data.message || 'Could not collect earnings.');
      }
    } catch {
      error('Collection Failed', 'Network error while collecting earnings.');
    } finally {
      setReceivingUnitId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Daily Power Cycle
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Start your solar panels once every weekday for a 3-hour cycle, then collect your daily earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>3-Hour Generation Hold</span>
          </div>
        </div>
      </div>

      {/* OWNED PANELS GRID */}
      {units.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0D0E15] border border-white/[0.07] text-center space-y-4">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No Panels Owned Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Rent an active solar panel to start earning daily clean energy income.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/panels"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Browse Solar Panels</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {units.map((unit) => {
            const state = getPanelState(unit);
            const isReceiving = receivingUnitId === unit.id;
            const grossIncome = (unit.lifetimeEarnedUsdt || 0) + (unit.todayEarnedUsdt || 0);
            const dailyReturn = unit.todayEarnedUsdt || unit.receivableAmountUsdt || (unit.capacityKw ? unit.capacityKw * 0.8 : 0.8);

            return (
              <div
                key={unit.id}
                className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] hover:border-white/[0.12] transition-colors space-y-5 flex flex-col justify-between"
              >
                {/* Top Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
                        {unit.planCode}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{unit.planName}</h3>
                        <span className="text-xs text-zinc-400">
                          {unit.capacityKw} KW Capacity · 60-day term
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${
                        state.isReceived
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : state.isReadyToReceive
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : state.isRunning
                          ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                          : 'bg-zinc-800 text-zinc-400 border border-white/[0.06]'
                      }`}
                    >
                      {state.isReceived
                        ? 'COLLECTED'
                        : state.isReadyToReceive
                        ? 'READY TO COLLECT'
                        : state.isRunning
                        ? 'GENERATING'
                        : 'READY TO START'}
                    </span>
                  </div>

                  {/* Panel Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block">Cost</span>
                      <strong className="text-white font-mono">${(unit.purchasePriceUsdt || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block">Total Earned</span>
                      <strong className="text-white font-mono">${grossIncome.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block">Daily Return</span>
                      <strong className="text-emerald-400 font-mono">+${dailyReturn.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Timer & Progress Bar */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Timer
                      </span>
                      <span className="font-mono font-medium text-white">
                        {state.isReceived
                          ? 'Complete for today'
                          : state.isReadyToReceive
                          ? 'Cycle complete'
                          : state.isRunning
                          ? formatCountdown(state.remainingSeconds)
                          : '03:00:00'}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          state.isReceived
                            ? 'bg-emerald-400'
                            : state.isReadyToReceive
                            ? 'bg-amber-400'
                            : state.isRunning
                            ? 'bg-blue-400'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${state.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions: Start / Collect */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleOpenStartModal(unit)}
                    disabled={state.isRunning || state.isReadyToReceive || state.isReceived}
                    className={`py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      state.isRunning || state.isReadyToReceive || state.isReceived
                        ? 'bg-white/[0.02] text-zinc-600 border border-white/[0.04] cursor-not-allowed'
                        : 'bg-amber-400 hover:bg-amber-300 text-black'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{state.isRunning ? 'Generating...' : 'Start Cycle'}</span>
                  </button>

                  <button
                    onClick={() => handleReceive(unit.id)}
                    disabled={!state.isReadyToReceive || state.isReceived || isReceiving}
                    className={`py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      state.isReceived
                        ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 cursor-default'
                        : state.isReadyToReceive
                        ? 'bg-emerald-400 hover:bg-emerald-300 text-black'
                        : 'bg-white/[0.02] text-zinc-600 border border-white/[0.04] cursor-not-allowed'
                    }`}
                  >
                    {state.isReceived ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Collected</span>
                      </>
                    ) : isReceiving ? (
                      <span>Collecting...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Collect ${dailyReturn.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* START ACTIVATION MODAL */}
      {startModalOpen && activeUnitForStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.1] shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-semibold text-white">
                  Start {activeUnitForStart.planName}
                </h3>
              </div>
              <button
                onClick={() => setStartModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter the activation code to begin today&apos;s 3-hour generation cycle. Once started, your returns will be ready to collect when the cycle finishes.
            </p>

            <form onSubmit={handleConfirmStart} className="space-y-4 text-xs">
              {startError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{startError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs">
                  Activation Code:
                </label>
                <input
                  type="text"
                  required
                  placeholder="SOLAR888"
                  value={startCodeInput}
                  onChange={(e) => setStartCodeInput(e.target.value.toUpperCase())}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-zinc-400 block pt-0.5">
                  Standard Code: <strong className="text-amber-400">SOLAR888</strong>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Cycle Duration:</span>
                  <strong className="text-white">3 Hours</strong>
                </div>
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Reward Points:</span>
                  <strong className="text-amber-400">+2 Points</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStartModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={starting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {starting ? 'Starting...' : 'Start Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
