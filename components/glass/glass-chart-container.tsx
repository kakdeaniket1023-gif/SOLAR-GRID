'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GlassCard } from './glass-card';

export function GlassChartContainer({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard elevation={1} className={twMerge('p-5 sm:p-6 flex flex-col border-white/[0.08]', className)}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            {title && <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-solar-blue shadow-blue-glow inline-block" />
              {title}
            </h3>}
            {subtitle && <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="w-full flex-1 min-h-[220px] relative">{children}</div>
    </GlassCard>
  );
}
