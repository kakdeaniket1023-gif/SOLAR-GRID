'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import {
  Sun,
  ShoppingBag,
  BatteryCharging,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function PublicProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', 'Solar Equipment', 'Panels', 'Inverters', 'Storage'];

  const filtered = products.filter((p) => {
    if (category === 'ALL') return true;
    return p.category.toLowerCase().includes(category.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#07080C] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Solar<span className="text-amber-400">Grid</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/income-disclosure"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Income Disclosure
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold border border-white/[0.08] transition-colors"
            >
              Distributor Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors"
            >
              Register Free
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0D0E15] border border-white/[0.08] relative overflow-hidden space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Certified Tier-1 Clean Energy Hardware
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Commercial & Residential <span className="text-amber-400">Solar Equipment</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Engineered for high efficiency, durability, and maximum grid yield. Distributed worldwide through our verified network of independent clean energy partners.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-amber-400 text-black'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-300'
              }`}
            >
              {cat === 'ALL' ? 'All Hardware' : cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((prod) => (
              <GlassCard
                key={prod.id}
                elevation={1}
                className="p-6 rounded-3xl border-white/[0.07] bg-[#0D0E15] flex flex-col justify-between group hover:border-amber-400/30 transition-all"
              >
                <div className="space-y-4">
                  <div className="h-44 rounded-2xl bg-black/50 border border-white/[0.05] flex items-center justify-center relative overflow-hidden group-hover:bg-amber-400/5 transition-colors">
                    {prod.category.includes('Storage') ? (
                      <BatteryCharging className="w-16 h-16 text-amber-400/80" />
                    ) : prod.category.includes('Inverter') ? (
                      <Cpu className="w-16 h-16 text-sky-400/80" />
                    ) : (
                      <Sun className="w-16 h-16 text-amber-400/80" />
                    )}
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono text-zinc-300">
                      SKU: {prod.sku}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/25 text-[10px] font-mono font-bold text-amber-400">
                      {prod.commissionableValue} PV
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      {prod.category}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/[0.06] mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase">Retail Price</div>
                    <div className="text-xl font-bold font-mono text-white">
                      ${prod.retailPrice.toFixed(2)} <span className="text-xs text-zinc-400 font-sans font-normal">USDT</span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/shop"
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Order in Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
