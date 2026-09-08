'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BusinessRule } from '@/types';
import { Save, CheckCircle2, AlertCircle, Sun, GitFork, DollarSign, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GlassCard } from '@/frontend/glass';

export default function AdminSettingsPage() {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [activeTab, setActiveTab] = useState<'MLM' | 'SOLAR' | 'FINANCIAL'>('MLM');
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [schedule, setSchedule] = useState({
    operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    startTime: '12:00 PM',
    endTime: '3:00 PM',
    durationHours: 3,
    verificationCode: 'SOLAR888',
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rules');
      const data = await res.json();
      if (data.success && data.rules) {
        setRules(data.rules);
        const initial: { [key: string]: any } = {};
        data.rules.forEach((item: BusinessRule) => {
          initial[item.key] = item.value;
        });
        setEditingValues(initial);

        const daysRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATING_DAYS');
        const startRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATION_START_TIME');
        const endRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATION_END_TIME');
        const durationRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_OPERATION_DURATION_HOURS');
        const codeRule = data.rules.find((item: BusinessRule) => item.key === 'SOLAR_VERIFICATION_CODE');

        setSchedule({
          operatingDays: daysRule?.value || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          startTime: startRule?.value || '12:00 PM',
          endTime: endRule?.value || '3:00 PM',
          durationHours: durationRule?.value || 3,
          verificationCode: codeRule?.value || 'SOLAR888',
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdateRule = async (key: string) => {
    setSavingKey(key);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editingValues[key] }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `Rule ${key} updated successfully.` });
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
        loadSettings();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to update rule' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error updating rule' });
    } finally {
      setSavingKey(null);
    }
  };

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
          body: JSON.stringify({ key: 'SOLAR_OPERATION_DURATION_HOURS', value: Number(schedule.durationHours) }),
        }),
        fetch('/api/admin/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'SOLAR_VERIFICATION_CODE', value: schedule.verificationCode }),
        }),
      ]);

      setFeedback({ type: 'success', text: 'Solar daily run rules updated successfully.' });
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
      loadSettings();
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update schedule settings' });
    } finally {
      setSavingSchedule(false);
    }
  };

  const mlmRules = [
    { key: 'COMMISSION_L1_PERCENT', label: 'Level 1 Direct Referral Commission (%)', description: 'Percentage override credited to direct sponsor upon downline panel purchase.', defaultValue: 10 },
    { key: 'COMMISSION_L2_PERCENT', label: 'Level 2 Indirect Referral Commission (%)', description: 'Percentage override credited to secondary upline sponsor.', defaultValue: 3 },
    { key: 'COMMISSION_L3_PERCENT', label: 'Level 3 Extended Referral Commission (%)', description: 'Percentage override credited to third-tier community sponsor.', defaultValue: 1 },
    { key: 'STARTING_POINTS', label: 'Baseline Registration Points', description: 'Initial loyalty reward points granted to newly registered members.', defaultValue: 100 },
    { key: 'DAILY_RUN_BONUS_POINTS', label: 'Daily Verification Bonus Points', description: 'Bonus points granted when a user enters SOLAR888 during 3-hour operation.', defaultValue: 2 },
  ];

  const financialRules = [
    { key: 'MINIMUM_WITHDRAWAL_USDT', label: 'Minimum Allowed Withdrawal (USDT)', description: 'Smallest withdrawal amount that members can request from their available balance.', defaultValue: 10 },
    { key: 'WITHDRAWAL_FEE_PERCENT', label: 'Withdrawal Processing Fee (%)', description: 'Percentage deducted from member withdrawal requests as protocol fee.', defaultValue: 10 },
    { key: 'DEPOSIT_WALLET_TRC20', label: 'Official USDT-TRC20 Deposit Address', description: 'The primary TRON network address shown to users for balance recharges.', defaultValue: 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v' },
    { key: 'DEPOSIT_WALLET_BEP20', label: 'Official USDT-BEP20 Deposit Address', description: 'The primary Binance Smart Chain address shown to users for balance recharges.', defaultValue: '0x7f83b194a2b84c90e1f72384a59d8c91a3e82b71' },
  ];

  return (
    <div className="space-y-8 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/25 text-solar-gold text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Platform Business Governance
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">MLM & System Operational Settings</h1>
          <p className="text-xs text-slate-400">Configure multi-tier referral commissions, daily 3-hour solar run rules, verification code, and wallet parameters.</p>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-solar-gold/15 border border-solar-gold/40 text-solar-gold' : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'MLM', label: '1. MLM & Referral Rules', icon: GitFork },
          { id: 'SOLAR', label: '2. Solar Daily Run Rules', icon: Sun },
          { id: 'FINANCIAL', label: '3. Financial & Wallet Config', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isActive ? 'bg-solar-gold text-slate-950 shadow-gold-glow' : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'MLM' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mlmRules.map((rule) => {
              const currentValue = editingValues[rule.key] ?? rule.defaultValue;
              const isSaving = savingKey === rule.key;
              return (
                <GlassCard key={rule.key} elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-4 bg-[#0B1426]">
                  <div className="space-y-1">
                    <span className="text-[10px] text-solar-gold font-bold uppercase block">{rule.key}</span>
                    <h3 className="text-sm font-bold text-white">{rule.label}</h3>
                    <p className="text-[11px] text-slate-400">{rule.description}</p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3">
                    <input type="number" step="any" value={currentValue} onChange={(e) => setEditingValues({ ...editingValues, [rule.key]: parseFloat(e.target.value) || 0 })} className="flex-1 glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold text-sm font-mono" />
                    <button onClick={() => handleUpdateRule(rule.key)} disabled={isSaving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105 shrink-0">
                      <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'SOLAR' && (
        <GlassCard elevation={2} className="p-6 sm:p-8 rounded-3xl border-white/[0.08] space-y-6 bg-[#0B1426] max-w-2xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-display text-white">Daily Solar Run & Timer Engine</h2>
            <p className="text-xs text-slate-400">Configure the mandatory 3-hour operation run timer and the required verification code.</p>
          </div>
          <form onSubmit={handleSaveSchedule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Run Duration (Hours):</label>
                <input type="number" value={schedule.durationHours} onChange={(e) => setSchedule({ ...schedule, durationHours: parseInt(e.target.value, 10) || 3 })} className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Daily Verification Code:</label>
                <input type="text" value={schedule.verificationCode} onChange={(e) => setSchedule({ ...schedule, verificationCode: e.target.value.toUpperCase() })} className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-amber-400 font-bold text-sm tracking-wider" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Operation Window Start:</label>
                <input type="text" value={schedule.startTime} onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })} className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Operation Window End:</label>
                <input type="text" value={schedule.endTime} onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })} className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm" />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={savingSchedule} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105">
                <Save className="w-3.5 h-3.5" /> {savingSchedule ? 'Saving...' : 'Save Solar Operations Schedule'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {activeTab === 'FINANCIAL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {financialRules.map((rule) => {
              const currentValue = editingValues[rule.key] ?? rule.defaultValue;
              const isSaving = savingKey === rule.key;
              return (
                <GlassCard key={rule.key} elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-4 bg-[#0B1426]">
                  <div className="space-y-1">
                    <span className="text-[10px] text-solar-gold font-bold uppercase block">{rule.key}</span>
                    <h3 className="text-sm font-bold text-white">{rule.label}</h3>
                    <p className="text-[11px] text-slate-400">{rule.description}</p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3">
                    <input type={typeof rule.defaultValue === 'number' ? 'number' : 'text'} value={currentValue} onChange={(e) => setEditingValues({ ...editingValues, [rule.key]: typeof rule.defaultValue === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} className="flex-1 glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold text-xs font-mono" />
                    <button onClick={() => handleUpdateRule(rule.key)} disabled={isSaving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105 shrink-0">
                      <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
