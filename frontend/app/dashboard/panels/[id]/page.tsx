'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  ArrowLeft,
  Activity,
  Clock,
  CheckCircle2,
  Play,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SolarUnit } from '@/types';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassChartContainer,
} from '@/frontend/glass';

export default function PanelDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const panelId = params.id as string;

  const [unit, setUnit] = useState<SolarUnit | null>(null);

  useEffect(() => {
    if (panelId && user) {
      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.units) {
            const found = data.units.find((u: SolarUnit) => u.id === panelId);
            if (found) setUnit(found);
          }
        })
        .catch(() => {});
    }
  }, [panelId, user]);

  if (!unit) {
    return (
      <GlassCard elevation={1} className="py-16 text-center space-y-3 border-white/[0.08]">
        <h2 className="text-lg font-bold text-white">Solar Unit Not Found</h2>
        <p className="text-xs text-slate-400 font-mono">The requested panel ID ({panelId}) was not found.</p>
        <Link href="/dashboard/panels">
          <GlassButton variant="primary" size="sm" leftIcon={ArrowLeft} className="font-bold text-[#050B18]">
            Back to My Panels
          </GlassButton>
        </Link>
      </GlassCard>
    );
  }

  const getPanelImage = (unitObj?: any) => {
    if (unitObj?.imageUrl) return unitObj.imageUrl;
    const planCode = unitObj?.planCode || 'P1';
    if (planCode === 'P3') return '/images/panel-p3.jpg';
    if (planCode === 'P2') return '/images/panel-p2.jpg';
    return '/images/panel-p1.jpg';
  };

  const chartData = [
    { date: 'Aug 18', kwh: 7.6, usdt: 3.5 },
    { date: 'Aug 19', kwh: 8.1, usdt: 3.5 },
    { date: 'Aug 20', kwh: 7.9, usdt: 3.5 },
    { date: 'Aug 21', kwh: 8.4, usdt: 3.5 },
    { date: 'Aug 22', kwh: 8.6, usdt: 3.5 },
    { date: 'Aug 23', kwh: 8.2, usdt: 3.5 },
    { date: 'Aug 24', kwh: 8.5, usdt: 3.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/panels"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Panels
        </Link>

        <Link href="/dashboard/panel-operation">
          <GlassButton variant="primary" size="sm" leftIcon={Play} className="font-bold text-[#050B18] shadow-gold-glow">
            Daily Operation
          </GlassButton>
        </Link>
      </div>

      {/* 1. Header Card: Large Graphic + Key Telemetry */}
      <GlassCard elevation={2} className="p-5 sm:p-6 border-white/[0.08]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Panel Render */}
          <div className="md:col-span-5 relative aspect-[16/10] sm:aspect-square w-full rounded-3xl overflow-hidden border border-white/15 bg-black shadow-2xl">
            <Image
              src={getPanelImage(unit)}
              alt={unit.planName}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-xl bg-[#050B18]/85 backdrop-blur-md border border-solar-gold text-[10px] font-mono font-extrabold text-solar-gold shadow-gold-glow">
              {unit.planCode} INFRASTRUCTURE
            </div>
            <div className="absolute bottom-2.5 inset-x-2.5 px-3 py-1.5 rounded-xl bg-[#050B18]/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-center text-slate-200 truncate">
              📍 {unit.location}
            </div>
          </div>

          {/* Details & Specs */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GlassBadge variant={unit.status === 'ACTIVE' ? 'gold' : 'neutral'} size="sm">
                  {unit.status}
                </GlassBadge>
                <span className="text-xs font-mono text-slate-400">ID: {unit.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">{unit.planName}</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {unit.projectName || unit.planName} • {unit.capacityKw} kW Monocrystalline Array
              </p>
            </div>

            {/* Lifecycle Progress */}
            <div className="p-3.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.08] space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">LIFECYCLE PROGRESS</span>
                <span className="text-solar-gold font-bold font-mono-num">
                  {unit.workingDaysCompleted} / {unit.workingDaysTotal || 43} Days ({Math.max(0, (unit.workingDaysTotal || 43) - unit.workingDaysCompleted)} Left)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#050B18] border border-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-solar-gold to-solar-amber rounded-full shadow-gold-glow"
                  style={{ width: `${Math.min(100, (unit.workingDaysCompleted / (unit.workingDaysTotal || 43)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics 4-Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-semibold">TODAY OUTPUT</span>
                <span className="font-bold text-white mt-0.5 block font-mono-num">{unit.todayGeneratedKwh || 8.52} kWh</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-semibold">TODAY YIELD</span>
                <span className="font-bold text-solar-gold mt-0.5 block font-mono-num">
                  +${(unit.todayEarnedUsdt || 1.2).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-semibold">LIFETIME YIELD</span>
                <span className="font-bold text-solar-gold mt-0.5 block font-mono-num">
                  ${(unit.totalEarnedUsdt || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-semibold">CAPACITY</span>
                <span className="font-bold text-solar-blue mt-0.5 block font-mono-num">
                  {unit.capacityKw} kW
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. Generation & Earnings Telemetry Chart */}
      <GlassChartContainer
        title="Photovoltaic Generation Telemetry"
        subtitle="Daily Monday-Friday solar output in kilowatt-hours (kWh)"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorKwhMidnight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748B" fontSize={10} fontFamily="monospace" />
            <YAxis stroke="#64748B" fontSize={10} fontFamily="monospace" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B1426',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
            />
            <Area
              type="monotone"
              dataKey="kwh"
              name="Energy Output (kWh)"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorKwhMidnight)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassChartContainer>

      {/* 3. Panel Lifecycle Timeline */}
      <GlassCard elevation={1} className="p-5 sm:p-6 space-y-4 border-white/[0.08]">
        <h2 className="text-sm font-bold font-display text-white">Unit Lifecycle Milestones</h2>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-white/10">
          <div className="flex items-start gap-3 relative">
            <div className="w-6 h-6 rounded-full bg-solar-gold/20 border border-solar-gold flex items-center justify-center text-solar-gold shrink-0 z-10 shadow-gold-glow">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Array Purchase & Smart Allocation</span>
                <span className="text-[10px] font-mono text-slate-400">{new Date(unit.purchaseDate || unit.activatedAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Allocated {unit.capacityKw} kW capacity at {unit.location}.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 relative">
            <div className="w-6 h-6 rounded-full bg-solar-amber/20 border border-solar-amber flex items-center justify-center text-solar-amber shrink-0 z-10 shadow-amber-glow">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Daily Operational Cycles</span>
                <span className="text-[10px] font-mono text-solar-gold font-bold font-mono-num">{unit.workingDaysCompleted} Cycles</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generated {unit.lifetimeGeneratedKwh?.toFixed(2) || '0.00'} kWh clean solar energy to date.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 relative">
            <div className="w-6 h-6 rounded-full bg-[#0B1426] border border-white/20 flex items-center justify-center text-slate-400 shrink-0 z-10">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Target Plan Expiry</span>
                <span className="text-[10px] font-mono text-slate-400">{new Date(unit.expiryDate || unit.expiresAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatic completion after {unit.workingDaysTotal || 43} active working days.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
