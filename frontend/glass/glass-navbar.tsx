'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import { Sun, Bell, Shield } from 'lucide-react';

export function GlassNavbar({ unreadCount = 0 }: { unreadCount?: number }) {
  const { user } = useAuth();

  return (
    <header className="h-16 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between bg-[#0A0B10]/80 backdrop-blur-md border-b border-white/[0.07] rounded-2xl mb-4 sm:mb-6">
      {/* Brand & Logo on Mobile, Status on Desktop */}
      <div className="flex items-center gap-2.5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            Solar<span className="text-amber-400">Grid</span>
          </span>
        </Link>
        <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-300">System Normal</span>
          <span className="text-zinc-600">·</span>
          <span>Daily Cycle: Mon–Fri</span>
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {user && (
          <>
            {/* Live USDT Balance Pill */}
            <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs font-mono">
              <span className="text-zinc-400 text-[10px] uppercase font-medium">Balance:</span>
              <span className="font-bold text-white">
                ${user.availableBalance.toFixed(2)}{' '}
                <span className="text-[10px] text-zinc-400 font-normal">USDT</span>
              </span>
            </div>

            {/* Admin Switcher Button (Strictly only if SUPER_ADMIN) */}
            {user.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-semibold font-mono transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Notification Bell */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/[0.07] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-mono font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Avatar link */}
            <Link
              href="/dashboard/profile"
              className="p-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] flex items-center gap-2 group transition-colors"
              aria-label="User Profile"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'SG'}
              </div>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
