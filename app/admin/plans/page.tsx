'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SolarPlan } from '@/types';
import { Edit3, CheckCircle2, Save, X } from 'lucide-react';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SolarPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SolarPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/solar/plans');
      const data = await res.json();
      if (data.success && data.plans) {
        setPlans(data.plans);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const res = await fetch('/api/solar/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editingPlan.code,
          plan: editingPlan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingPlan(null);
        setSaved(true);
        loadPlans();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    }
  };

  const calculatedGross = editingPlan
    ? Math.round(Number(editingPlan.dailyEarningUsdt || 0) * Number(editingPlan.workingDaysTotal || 0) * 100) / 100
    : 0;
  const calculatedNet = editingPlan
    ? Math.round(calculatedGross * (1 - Number(editingPlan.withdrawalFeePercent || 0) / 100) * 100) / 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-white">Solar Plan Configuration (CRUD)</h1>
          <p className="text-xs text-slate-400">
            Database single source of truth for all solar plans. Modify pricing, daily weekday yields, working days, withdrawal fees, and operating windows.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-xs font-mono flex items-center gap-2 shadow-gold-glow">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Plan configuration updated live in database. All public and user portals synchronized immediately.</span>
        </div>
      )}

      {/* Plans Table */}
      <div className="glass-1 rounded-3xl border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060D1A]/90 text-slate-400">
                <th className="p-4 font-semibold">CODE</th>
                <th className="p-4 font-semibold">PLAN NAME</th>
                <th className="p-4 font-semibold">PRICE (USDT)</th>
                <th className="p-4 font-semibold">CAPACITY</th>
                <th className="p-4 font-semibold">DAILY YIELD</th>
                <th className="p-4 font-semibold">WORKING DAYS</th>
                <th className="p-4 font-semibold">GROSS YIELD</th>
                <th className="p-4 font-semibold">FEE (%)</th>
                <th className="p-4 font-semibold">EST. NET</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {plans.map((p) => {
                const gross = Math.round(p.dailyEarningUsdt * p.workingDaysTotal * 100) / 100;
                const net = Math.round(gross * (1 - (p.withdrawalFeePercent || 0) / 100) * 100) / 100;

                return (
                  <tr key={p.code} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-solar-gold font-mono-num">{p.code}</td>
                    <td className="p-4 font-bold text-white">{p.name}</td>
                    <td className="p-4 text-solar-gold font-bold font-mono-num">${p.priceUsdt}.00</td>
                    <td className="p-4 text-slate-300">{p.capacityKw} kW</td>
                    <td className="p-4 text-solar-gold font-bold font-mono-num">${p.dailyEarningUsdt.toFixed(2)}/day</td>
                    <td className="p-4 text-slate-300 font-mono-num">{p.workingDaysTotal} Days</td>
                    <td className="p-4 text-solar-amber font-mono-num">${gross.toFixed(2)}</td>
                    <td className="p-4 text-white font-bold font-mono-num">{p.withdrawalFeePercent}%</td>
                    <td className="p-4 text-solar-gold font-bold font-mono-num">${net.toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-solar-gold/20 text-solar-gold border border-solar-gold/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setEditingPlan({ ...p })}
                        className="px-3 py-1.5 rounded-xl bg-solar-gold/15 hover:bg-solar-gold/30 border border-solar-gold/40 text-solar-gold font-bold inline-flex items-center gap-1 shadow-gold-glow"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Plan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B18]/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="glass-1 p-6 sm:p-8 rounded-3xl border border-solar-gold/50 max-w-2xl w-full space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setEditingPlan(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-solar-gold font-bold uppercase tracking-wider">
                LIVE SOLAR PLAN SPEC EDITOR
              </span>
              <h3 className="text-xl font-bold text-white">
                Edit {editingPlan.name} ({editingPlan.code})
              </h3>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-5 text-xs font-mono">
              {/* Basic Details */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#050B18]/70 border border-white/[0.06]">
                <span className="text-[10px] text-solar-gold font-bold uppercase">Basic Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Plan Status</label>
                    <select
                      value={editingPlan.status}
                      onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as any })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold bg-[#0B1426]"
                    >
                      <option value="ACTIVE">ACTIVE (Publicly Visible)</option>
                      <option value="DISABLED">DISABLED (Hidden)</option>
                      <option value="COMING_SOON">COMING SOON</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Pricing, Capacity, Validity */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#050B18]/70 border border-white/[0.06]">
                <span className="text-[10px] text-solar-gold font-bold uppercase">Pricing & Solar Capacity</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Price (USDT)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editingPlan.priceUsdt}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priceUsdt: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Capacity (kW)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editingPlan.capacityKw}
                      onChange={(e) => setEditingPlan({ ...editingPlan, capacityKw: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Calendar Days</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editingPlan.validityDays}
                      onChange={(e) => setEditingPlan({ ...editingPlan, validityDays: parseInt(e.target.value, 10) || 0 })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Working Days</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editingPlan.workingDaysTotal}
                      onChange={(e) => setEditingPlan({ ...editingPlan, workingDaysTotal: parseInt(e.target.value, 10) || 0 })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Earnings & Operation Schedule */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#050B18]/70 border border-white/[0.06]">
                <span className="text-[10px] text-solar-gold font-bold uppercase">Daily Earning & Fees</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Daily Earning (USDT)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingPlan.dailyEarningUsdt}
                      onChange={(e) => setEditingPlan({ ...editingPlan, dailyEarningUsdt: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Withdrawal Fee (%)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editingPlan.withdrawalFeePercent}
                      onChange={(e) => setEditingPlan({ ...editingPlan, withdrawalFeePercent: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 mb-1">Operation Start Time</label>
                    <input
                      type="text"
                      value={editingPlan.operationStartTime || '12:00 PM'}
                      onChange={(e) => setEditingPlan({ ...editingPlan, operationStartTime: e.target.value })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Operation End Time</label>
                    <input
                      type="text"
                      value={editingPlan.operationEndTime || '3:00 PM'}
                      onChange={(e) => setEditingPlan({ ...editingPlan, operationEndTime: e.target.value })}
                      className="w-full glass-input border-white/[0.08] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                {/* Auto Calculated Projected Preview */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-solar-gold/15 to-solar-amber/10 border border-solar-gold/30 mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">AUTO-CALCULATED GROSS YIELD:</span>
                    <span className="text-base font-bold text-solar-amber font-mono-num">
                      ${calculatedGross.toFixed(2)} USDT ({editingPlan.dailyEarningUsdt} × {editingPlan.workingDaysTotal})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">NET AFTER FEE:</span>
                    <span className="text-base font-bold text-solar-gold font-mono-num">
                      ${calculatedNet.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 py-3 rounded-2xl bg-[#0B1426] border border-white/[0.08] text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold shadow-gold-glow flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform"
                >
                  <Save className="w-4 h-4" /> Save Live Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
