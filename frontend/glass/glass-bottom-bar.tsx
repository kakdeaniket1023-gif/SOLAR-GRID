'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Users, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export const USER_BOTTOM_NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/shop', label: 'Shop', icon: ShoppingBag, exact: false, highlight: true },
  { href: '/dashboard/orders', label: 'Orders', icon: Package, exact: false },
  { href: '/dashboard/network', label: 'Network', icon: Users, exact: false },
  { href: '/dashboard/wallet', label: 'Wallet', icon: ShieldCheck, exact: false },
];

export function GlassBottomBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#0A0B10]/95 backdrop-blur-lg border-t border-white/[0.08]"
    >
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
        {USER_BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 select-none group',
                isActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {item.highlight ? (
                <div
                  className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm',
                    isActive
                      ? 'bg-amber-400 text-black font-bold scale-105'
                      : 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                  )}
                >
                  <Icon className="w-4 h-4 fill-current" />
                </div>
              ) : (
                <div className="p-1">
                  <Icon className="w-5 h-5" />
                </div>
              )}

              <span
                className={clsx(
                  'text-[10px] font-medium tracking-tight mt-0.5',
                  isActive ? 'text-amber-400 font-semibold' : 'text-zinc-400'
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
