'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Sun, Bell, Shield, Sparkles } from 'lucide-react';
import { GlassBadge } from './glass-badge';

export function GlassNavbar({ unreadCount = 0 }: { unreadCount?: number }) {
  const { user } = useAuth();

  return (
    <header className="h-16 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between glass-2 border-b border-white/[0.08] rounded-b-2xl mb-4 sm:mb-6 shadow-2xl">
      {/* Brand & Logo on Mobile, Page Header on Desktop */}
      <div className="flex items-center gap-2.5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-solar-gold via-solar-amber to-amber-900 border border-solar-gold/40 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
            <Sun className="w-4 h-4 text-[#050B18] fill-[#050B18]" />
          </div>
          <span className="text-sm font-bold font-display text-white tracking-tight">
            Solar<span className="text-solar-gold text-glow-gold">Grid</span>
          </span>
        </Link>
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-solar-gold font-bold">● LIVE</span>
          <span>Photovoltaic Infrastructure Platform</span>
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <>
            {/* Live USDT Balance Pill */}
            <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1426]/90 border border-white/[0.08] text-xs font-mono shadow-inner">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Balance:</span>
              <span className="font-bold text-solar-gold font-mono-num">
                {user.availableBalance.toFixed(2)}{' '}
                <span className="text-[10px] text-slate-400 font-normal">USDT</span>
              </span>
            </div>


            {/* Admin Switcher Button (Strictly only if SUPER_ADMIN) */}
            {user.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-solar-amber/20 hover:bg-solar-amber/30 text-amber-300 border border-solar-amber/40 text-xs font-semibold font-mono transition-colors shadow-sm"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Center</span>
              </Link>
            )}

            {/* Notification Bell */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-solar-gold text-[#050B18] text-[9px] font-mono font-bold flex items-center justify-center animate-pulse shadow-gold-glow">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Avatar link */}
            <Link
              href="/dashboard/profile"
              className="p-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center gap-2 group transition-colors"
              aria-label="User Profile"
            >
              <div className="w-7 h-7 rounded-lg bg-solar-gold/20 border border-solar-gold/40 flex items-center justify-center text-solar-gold font-bold text-xs font-mono">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'SG'}
              </div>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
