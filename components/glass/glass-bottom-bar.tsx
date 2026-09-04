'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, Play, Share2, User } from 'lucide-react';
import { clsx } from 'clsx';

export const USER_BOTTOM_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/panels', label: 'Panels', icon: Layers, exact: false },
  { href: '/dashboard/start-panel', label: 'Start Panel', icon: Play, exact: false, highlight: true },
  { href: '/dashboard/invite', label: 'Invite', icon: Share2, exact: false },
  { href: '/dashboard/profile', label: 'Profile', icon: User, exact: false },
];

export function GlassBottomBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="User Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden glass-bottom-bar"
    >
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {USER_BOTTOM_NAV_ITEMS.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 select-none group',
                isActive ? 'text-solar-gold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {/* Active Backlight Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-solar-gold/15 border border-solar-gold/35 rounded-2xl shadow-[0_0_16px_rgba(255,200,61,0.2)] animate-in zoom-in-90 duration-200" />
              )}

              {/* Special central Operation Button Highlight */}
              {item.highlight ? (
                <div
                  className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md',
                    isActive
                      ? 'bg-gradient-to-tr from-solar-gold to-solar-amber text-[#050B18] shadow-gold-glow scale-105 font-bold'
                      : 'bg-solar-gold/20 text-solar-gold border border-solar-gold/40 group-hover:scale-105'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              ) : (
                <div className="relative p-1">
                  <Icon
                    className={clsx(
                      'w-5 h-5 transition-transform duration-200 group-active:scale-90',
                      isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,200,61,0.5)] text-solar-gold' : ''
                    )}
                  />
                </div>
              )}

              <span
                className={clsx(
                  'text-[10px] font-medium tracking-tight mt-0.5 relative z-10 transition-colors',
                  isActive ? 'font-bold text-white' : 'text-slate-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
