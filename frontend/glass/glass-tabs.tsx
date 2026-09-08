'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassTabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export function GlassTabs({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
  accent = 'gold',
}: {
  tabs: GlassTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  accent?: 'gold' | 'blue';
}) {
  return (
    <div
      className={twMerge(
        'flex items-center gap-1.5 p-1.5 bg-[#0B1426]/90 border border-white/[0.08] rounded-2xl backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full shadow-inner',
        className
      )}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        const activeStyles =
          accent === 'blue'
            ? 'bg-solar-blue/20 text-white border-solar-blue/40 shadow-blue-glow font-bold'
            : 'bg-solar-gold/20 text-white border-solar-gold/40 shadow-gold-glow font-bold';

        const activeIconColor = accent === 'blue' ? 'text-solar-blue' : 'text-solar-gold';
        const activeCountBg =
          accent === 'blue'
            ? 'bg-solar-blue text-white'
            : 'bg-solar-gold text-[#050B18] font-bold';

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap select-none shrink-0 border',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm',
              isActive
                ? activeStyles
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
            )}
          >
            {Icon && <Icon className={clsx('w-3.5 h-3.5', isActive ? activeIconColor : 'text-slate-400')} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold',
                  isActive
                    ? activeCountBg
                    : 'bg-white/10 text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
