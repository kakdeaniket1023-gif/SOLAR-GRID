'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  ArrowLeft,
  ArrowUpRight,
} from 'lucide-react';
import { SolarUnit } from '@/types';
import { GlassCard } from '@/frontend/glass';

export default function PurchaseRecordsPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState<SolarUnit[]>([]);

  useEffect(() => {
    if (user) {
      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.units) {
            setUnits(data.units);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const getPlanImage = (planCode: string) => {
    if (planCode === 'P3') return '/images/panel-p3.jpg';
    if (planCode === 'P2') return '/images/panel-p2.jpg';
    return '/images/panel-p1.jpg';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/records"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Records Center
        </Link>
        <Link
          href="/dashboard/panels"
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow transition-all"
        >
          + Acquire Panel
        </Link>
      </div>

      <GlassCard elevation={2} className="p-6 sm:p-8 space-y-6 border-white/[0.08]">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Panel Purchase & Activation Records</h1>
          <p className="text-xs text-slate-400 font-mono">Detailed registry of your acquired solar arrays, top-up upgrades, and validity terms</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase">
                <th className="pb-3 pr-4">Panel Unit ID</th>
                <th className="pb-3 px-4">Model / Plan</th>
                <th className="pb-3 px-4">Capacity</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Activated Date</th>
                <th className="pb-3 px-4">Expiration Date</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {units.length > 0 ? (
                units.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4 text-white font-bold select-all font-mono-num">{u.id}</td>
                    <td className="py-3.5 px-4 font-bold text-solar-gold">
                      <div className="flex items-center gap-2">
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
                          <Image src={getPlanImage(u.planCode)} alt={u.planName} fill className="object-cover" />
                        </div>
                        <span>{u.planName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-mono-num">{u.capacityKw} kW</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-solar-gold/20 text-solar-gold border border-solar-gold/40">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{new Date(u.purchaseDate || u.activatedAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(u.expiryDate || u.expiresAt).toLocaleDateString()}</td>
                    <td className="py-3.5 pl-4 text-right">
                      <Link
                        href={`/dashboard/panels/${u.id}`}
                        className="inline-flex items-center gap-1 text-solar-gold hover:underline font-bold"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No panel purchase records found.
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
