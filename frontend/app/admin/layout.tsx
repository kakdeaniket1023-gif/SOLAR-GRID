'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  Shield,
  LayoutDashboard,
  Users,
  Layers,
  Sun,
  DollarSign,
  ArrowDownToLine,
  Radio,
  Headphones,
  Sliders,
  FileText,
  BarChart3,
  Menu,
  X,
  Lock,
  Sparkles,
  Clock,
  GitFork,
} from 'lucide-react';
import { GlassBadge } from '@/frontend/glass';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminNavGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { href: '/admin', label: 'MLM Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'MLM NETWORK & COMMUNITY',
      items: [
        { href: '/admin/mlm', label: 'Genealogy Tree', icon: GitFork },
        { href: '/admin/users', label: 'Member Directory', icon: Users },
        { href: '/admin/commissions', label: 'Commissions Ledger', icon: DollarSign },
      ],
    },
    {
      label: 'SOLAR INVESTMENTS',
      items: [
        { href: '/admin/plans', label: 'Solar Plans P1–P6', icon: Layers },
        { href: '/admin/units', label: 'Member Active Panels', icon: Sun },
      ],
    },
    {
      label: 'FINANCIAL DESKS',
      items: [
        { href: '/admin/recharges', label: 'Recharge Approvals', icon: DollarSign },
        { href: '/admin/withdrawals', label: 'Withdrawal Queue', icon: ArrowDownToLine },
        { href: '/admin/points', label: 'Community Points', icon: Sparkles },
        { href: '/admin/ledger', label: 'Global Ledger Audit', icon: FileText },
      ],
    },
    {
      label: 'GOVERNANCE & SYSTEM',
      items: [
        { href: '/admin/settings', label: 'MLM & System Settings', icon: Sliders },
        { href: '/admin/broadcasts', label: 'Member Broadcasts', icon: Radio },
        { href: '/admin/support', label: 'Support Desk', icon: Headphones },
        { href: '/admin/audit', label: 'Audit Trail', icon: FileText },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col lg:flex-row text-[#F8FAFC]">
      {/* Desktop Fixed Admin Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/[0.08] bg-[#0B1426]/95 backdrop-blur-xl shrink-0 h-screen sticky top-0 shadow-2xl">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.08] justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-solar-gold to-amber-600 border border-solar-gold/40 flex items-center justify-center shadow-gold-glow">
              <Shield className="w-4 h-4 text-[#050B18]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold font-display text-white">
                Solar<span className="text-solar-gold">Grid</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-solar-gold uppercase font-bold">
                ADMIN CONSOLE
              </span>
            </div>
          </Link>
          <GlassBadge variant="gold" size="sm">
            SUPER_ADMIN
          </GlassBadge>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {adminNavGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                {group.label}
              </div>
              {group.items.map(item => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
                      isActive
                        ? 'bg-solar-gold/15 text-solar-gold border border-solar-gold/30 font-bold shadow-gold-glow'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-solar-gold' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/[0.08] text-[11px] font-mono text-slate-400">
          <div className="text-white font-semibold">{user?.name || 'Administrator'}</div>
          <div className="text-[10px] text-solar-gold truncate">{user?.email || 'admin@solargrid.io'}</div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-[#0B1426] border-b border-white/[0.08] flex items-center justify-between px-4 sticky top-0 z-30">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-solar-gold" />
          <span className="font-bold font-display text-white text-sm">SolarGrid Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#050B18]/95 backdrop-blur-2xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <span className="font-bold text-white text-sm">Admin Navigation</span>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4 pt-4">
            {adminNavGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">{group.label}</div>
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-mono text-slate-300 hover:bg-white/[0.06]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
