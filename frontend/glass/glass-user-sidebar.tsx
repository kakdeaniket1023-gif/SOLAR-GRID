'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  Sun,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ShieldCheck,
  FileText,
  Share2,
  Headphones,
  LogOut,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

export const USER_SIDEBAR_NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/shop', label: 'Solar Shop', icon: ShoppingBag, exact: false },
  { href: '/dashboard/orders', label: 'My Orders', icon: Package, exact: false },
  { href: '/dashboard/network', label: 'Network Tree', icon: Users, exact: false },
  { href: '/dashboard/earnings', label: 'Commissions', icon: TrendingUp, exact: false },
  { href: '/dashboard/wallet', label: 'Wallet & KYC', icon: ShieldCheck, exact: false },
  { href: '/dashboard/records', label: 'History & Records', icon: FileText, exact: false },
  { href: '/dashboard/invite', label: 'Invite Friends', icon: Share2, exact: false },
  { href: '/dashboard/support', label: 'Support & Help', icon: Headphones, exact: false },
];

export function GlassUserSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const kycStatus = user?.kycStatus || 'UNVERIFIED';

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/[0.07] bg-[#0A0B10] select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.07] justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center group-hover:border-amber-400/60 transition-colors">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">
              Solar<span className="text-amber-400">Grid</span>
            </span>
            <span className="text-[10px] text-zinc-400 tracking-wide">
              Direct-Selling Solar Network
            </span>
          </div>
        </Link>
      </div>

      {/* Account Balance & KYC Card */}
      <div className="p-4 border-b border-white/[0.07]">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase text-zinc-400 font-medium tracking-wider">
              Available Balance
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              USDT
            </span>
          </div>

          <div className="text-2xl font-bold font-mono text-white">
            ${(user?.availableBalance || 0).toFixed(2)}
          </div>

          {/* KYC Status Indicator */}
          <div className="flex items-center justify-between pt-1 pb-0.5 px-2 py-1 rounded-lg bg-black/40 border border-white/[0.05]">
            <span className="text-[11px] text-zinc-400">KYC Status:</span>
            {kycStatus === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            ) : kycStatus === 'PENDING' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                <Clock className="w-3 h-3" />
                Pending
              </span>
            ) : (
              <Link
                href="/dashboard/wallet"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-400/10 px-1.5 py-0.5 rounded border border-rose-400/20 transition-colors"
              >
                <AlertCircle className="w-3 h-3" />
                Verify Now
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Link
              href="/dashboard/shop"
              className="py-1.5 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 fill-black" />
              Shop Solar
            </Link>
            <Link
              href="/dashboard/wallet"
              className="py-1.5 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              Payouts
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 pb-2 pt-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
          Community Portal
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-amber-400/10 text-amber-400 font-semibold border border-amber-400/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-amber-400' : 'text-zinc-400 group-hover:text-zinc-200'
                )}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              )}
            </Link>
          );
        })}

        <div className="pt-3 px-3">
          <Link
            href="/income-disclosure"
            target="_blank"
            className="flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-300 py-1 transition-colors"
          >
            <span>Income Disclosure</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </Link>
        </div>
      </nav>

      {/* User Profile / Logout Footer */}
      <div className="p-3 border-t border-white/[0.07] bg-[#0A0B10]">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
          <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-amber-400">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {user?.name || 'Distributor'}
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {user?.email}
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
