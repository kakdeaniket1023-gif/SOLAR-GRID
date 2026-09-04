'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, LogIn, UserPlus } from 'lucide-react';

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#050B18]/85 backdrop-blur-2xl transition-all shadow-2xl">
      {/* Operational Ticker Bar */}
      <div className="bg-[#0B1426]/90 border-b border-white/[0.06] py-1.5 px-4 text-[11px] flex items-center justify-between text-slate-300 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-solar-gold font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-solar-gold animate-ping" />
            DIGITAL SOLAR INFRASTRUCTURE PROJECT
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-solar-amber font-medium hidden sm:inline">3-HOUR OPERATION CYCLES</span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">DAILY USDT SETTLEMENTS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-[10px] uppercase">● Grid Status: Optimal</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar-gold via-solar-amber to-amber-900 border border-solar-gold/40 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
            <Sun className="w-5 h-5 text-[#050B18] fill-[#050B18]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-1">
              Solar<span className="text-solar-gold text-glow-gold">Grid</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">
              Photovoltaic Infrastructure
            </span>
          </div>
        </Link>

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#050B18] bg-gradient-to-r from-solar-gold to-solar-amber shadow-gold-glow hover:scale-[1.02] transition-transform"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
