'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BusinessRule } from '@/types';
import { Save, CheckCircle2, AlertCircle, Sun } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GlassCard } from '@/components/glass';

const ALL_WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function AdminSettingsPage() {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [schedule, setSchedule] = useState({
    operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    startTime: '12:00 PM',
    endTime: '3:00 PM',
    durationHours: 3,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rules');
      const data = await res.json();
      if (data.success && data.rules) {
        const r: BusinessRule[] = data.rules.filter(
          (item: BusinessRule) => !item.category?.includes('MLM') && !item.category?.includes('POINTS')
        );
        setRules(r);
        const initial: { [key: string]: any } = {};
        r.forEach((item: BusinessRule) => {
          initial[item.key] = item.value;
        });
        setEditingValues(initial);

        const daysRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATING_DAYS');
        const startRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATION_START_TIME');
        const endRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATION_END_TIME');
        const durationRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATION_DURATION_HOURS');

        setSchedule({
          operatingDays: daysRule?.value || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          startTime: startRule?.value || '12:00 PM',
          endTime: endRule?.value || '3:00 PM',
          durationHours: durationRule?.value || 3,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    setFeedback(null);

    try {
      await Promise.all([
        fetch('/api/admin/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'SOLAR_OPERATING_DAYS', value: schedule.operatingDays }),
        }),
        fetch('/api/admin/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'SOLAR_OPERATION_START_TIME', value: schedule.startTime }),
        }),
        fetch('/api/admin/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'SOLAR_OPERATION_END_TIME', value: schedule.endTime }),
        }),
        fetch('/api/admin/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'SOLAR_OPERATION_DURATION_HOURS', value: schedule.durationHours }),
        }),
      ]);

      setFeedback({
        type: 'success',
        text: `Solar Operation Settings updated! User dashboard now reflects ${schedule.startTime} → ${schedule.endTime} (${schedule.operatingDays.join(', ')}).`,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFC83D', '#FF9F1C', '#3B82F6'],
      });

      loadSettings();
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update solar operation settings' });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleToggleDay = (day: string) => {
    setSchedule((prev) => {
      const exists = prev.operatingDays.includes(day);
      const newDays = exists
        ? prev.operatingDays.filter((d) => d !== day)
        : [...prev.operatingDays, day];
      return { ...prev, operatingDays: newDays };
    });
  };

  const handleUpdateRule = async (key: string) => {
    setSavingKey(key);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: editingValues[key],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        loadSettings();
      } else {
        setFeedback({ type: 'error', text: data.message });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update business rule' });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-display text-white">Solar Operation Settings & Business Rules</h1>
        <p className="text-xs text-slate-400">
          Configure live solar operating schedules, generation windows, and financial constants without redeploying code.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-mono flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-solar-gold/15 border border-solar-gold/40 text-solar-gold shadow-gold-glow'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. DEDICATED SOLAR OPERATION SETTINGS CARD */}
      <GlassCard elevation={2} className="p-6 sm:p-8 rounded-3xl border-solar-gold/40 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-solar-gold font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-solar-gold" /> LIVE OPERATING SCHEDULE
            </span>
            <h2 className="text-xl font-bold font-display text-white">Solar Operation Settings</h2>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#050B18] border border-white/[0.08] text-xs font-mono font-bold text-solar-gold">
            {schedule.startTime} → {schedule.endTime}
          </span>
        </div>

        <form onSubmit={handleSaveSchedule} className="space-y-6 text-xs font-mono">
          {/* Operating Days Selector */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold uppercase text-[11px]">
              Configured Operating Days (Select Active Generation Days):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ALL_WEEKDAYS.map((day) => {
                const isSelected = schedule.operatingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleToggleDay(day)}
                    className={`py-2.5 px-2 rounded-xl text-center font-bold border transition-all ${
                      isSelected
                        ? 'bg-solar-gold/20 border-solar-gold text-solar-gold shadow-gold-glow'
                        : 'bg-[#050B18] border-white/[0.08] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time and Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Start Time</label>
              <input
                type="text"
                required
                placeholder="12:00 PM"
                value={schedule.startTime}
                onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">e.g. 12:00 PM or 10:00 AM</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">End Time</label>
              <input
                type="text"
                required
                placeholder="3:00 PM"
                value={schedule.endTime}
                onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">e.g. 3:00 PM or 2:00 PM</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Operation Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                required
                value={schedule.durationHours}
                onChange={(e) => setSchedule({ ...schedule, durationHours: parseFloat(e.target.value) || 0 })}
                className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">e.g. 3 Hours</span>
            </div>
          </div>

          {/* Live Preview on User Dashboard */}
          <div className="p-4 rounded-2xl bg-[#050B18]/90 border border-white/[0.08] space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              User Dashboard Live Display Preview:
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1 font-mono">
              <div className="text-white">
                TODAY&apos;S SOLAR OPERATION • <strong className="text-solar-gold">{schedule.startTime} → {schedule.endTime}</strong>
              </div>
              <div className="text-slate-400">
                Operating Days: <strong className="text-slate-200">{schedule.operatingDays.join(', ')}</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSchedule}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-solar-gold via-solar-amber to-amber-500 text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <Save className="w-4 h-4" />
              {savingSchedule ? 'Saving Live Schedule...' : 'Save Solar Operation Schedule'}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* 2. OTHER FINANCIAL & OPERATING RULES */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-display text-white">General Platform Financial Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {rules
            .filter((r) => !r.key.startsWith('SOLAR_OPERATION_') && r.key !== 'SOLAR_OPERATING_DAYS')
            .map((rule) => {
              const isSaving = savingKey === rule.key;

              return (
                <GlassCard
                  key={rule.key}
                  elevation={1}
                  className="p-6 rounded-3xl border-white/[0.08] space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#050B18] border border-white/[0.08] text-solar-gold">
                        {rule.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{rule.key}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{rule.label}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{rule.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] space-y-3">
                    <div>
                      <label className="block text-slate-300 text-[10px] mb-1 font-semibold">Configured Database Value:</label>
                      {typeof rule.value === 'boolean' ? (
                        <select
                          value={editingValues[rule.key]?.toString()}
                          onChange={(e) =>
                            setEditingValues({ ...editingValues, [rule.key]: e.target.value === 'true' })
                          }
                          className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold bg-[#0B1426]"
                        >
                          <option value="true">True (Active)</option>
                          <option value="false">False (Inactive)</option>
                        </select>
                      ) : (
                        <input
                          type="number"
                          step="any"
                          value={editingValues[rule.key] ?? rule.value}
                          onChange={(e) =>
                            setEditingValues({ ...editingValues, [rule.key]: parseFloat(e.target.value) })
                          }
                          className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold font-mono"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        Updated {new Date(rule.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleUpdateRule(rule.key)}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Updating...' : 'Save Rule'}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
        </div>
      </div>
    </div>
  );
}
