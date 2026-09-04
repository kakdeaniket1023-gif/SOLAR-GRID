'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Sun,
  LayoutDashboard,
  Layers,
  Play,
  Share2,
  User,
  Zap,
  ArrowDownToLine,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

export const USER_SIDEBAR_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/panels', label: 'Panels', icon: Layers, exact: false },
  { href: '/dashboard/start-panel', label: 'Start Panel', icon: Play, exact: false },
  { href: '/dashboard/invite', label: 'Invite', icon: Share2, exact: false },
  { href: '/dashboard/profile', label: 'Profile', icon: User, exact: false },
];

export function GlassUserSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/[0.08] bg-[#070E1E]/95 backdrop-blur-xl shadow-2xl z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.08] justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-solar-gold via-solar-amber to-amber-900 border border-solar-gold/40 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
            <Sun className="w-5 h-5 text-[#050B18] fill-[#050B18]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold font-display text-white tracking-tight">
              Solar<span className="text-solar-gold text-glow-gold">Grid</span>
            </span>
            <span className="text-[9px] font-mono text-solar-amber tracking-widest uppercase font-bold">
              SOLAR INFRASTRUCTURE
            </span>
          </div>
        </Link>
      </div>

      {/* Account Quick Balance & Actions Card */}
      <div className="p-4 border-b border-white/[0.08]">
        <div className="p-3.5 rounded-2xl bg-[#0B152A] border border-white/[0.08] shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              Available Balance
            </span>
            <span className="text-[10px] font-mono text-solar-gold font-bold px-1.5 py-0.5 rounded bg-solar-gold/10 border border-solar-gold/30">
              USDT
            </span>
          </div>

          <div className="text-2xl font-extrabold font-mono text-solar-gold font-mono-num text-glow-gold">
            ${(user?.availableBalance || 0).toFixed(2)}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/dashboard/recharge"
              className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs flex items-center justify-center gap-1 shadow-gold-glow hover:scale-[1.02] transition-transform"
            >
              <Zap className="w-3.5 h-3.5" />
              Recharge
            </Link>
            <Link
              href="/dashboard/withdrawal"
              className="py-1.5 px-2 rounded-xl bg-[#050B18] hover:bg-white/[0.06] border border-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-solar-blue" />
              Withdraw
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          Main Navigation
        </div>

        {USER_SIDEBAR_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative',
                isActive
                  ? 'bg-gradient-to-r from-solar-gold/20 via-solar-gold/10 to-transparent text-white font-bold border-l-2 border-solar-gold shadow-[inset_0_0_12px_rgba(255,200,61,0.08)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
                  isActive
                    ? 'bg-solar-gold/20 text-solar-gold border border-solar-gold/40'
                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Points */}
      <div className="p-4 border-t border-white/[0.08] bg-[#050B18]/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-solar-gold/20 border border-solar-gold/40 flex items-center justify-center text-solar-gold font-bold text-xs font-mono shrink-0">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'SG'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">
                {user?.name || 'Solar Member'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate">
                {user?.email || 'user@solargrid.io'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-solar-gold/10 border border-solar-gold/30 text-solar-gold text-[10px] font-mono font-bold shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>{user?.points ?? 100} pts</span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/30 text-slate-400 text-xs font-mono font-semibold border border-white/[0.08] flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
