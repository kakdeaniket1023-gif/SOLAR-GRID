'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2 | 3 | 4;
  variant?: 'default' | 'gold' | 'amber' | 'blue' | 'emerald' | 'subtle' | 'danger';
  glow?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export function GlassCard({
  elevation = 1,
  variant = 'default',
  glow = false,
  interactive = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  const elevationClass = {
    1: 'glass-1',
    2: 'glass-2',
    3: 'glass-3',
    4: 'glass-4',
  }[elevation];

  const variantClass = {
    default: 'border-white/[0.08] hover:border-white/[0.14]',
    gold: 'border-solar-gold/35 shadow-[0_8px_32px_rgba(255,200,61,0.12)]',
    amber: 'border-solar-amber/35 shadow-[0_8px_32px_rgba(255,159,28,0.12)]',
    blue: 'border-solar-blue/35 shadow-[0_8px_32px_rgba(59,130,246,0.12)]',
    emerald: 'border-solar-gold/35 shadow-[0_8px_32px_rgba(255,200,61,0.12)]', // gold alias
    subtle: 'bg-[#0B1426]/60 border-white/[0.05]',
    danger: 'border-red-500/30 bg-red-950/20 text-red-100',
  }[variant];

  const glowClass = glow
    ? variant === 'blue'
      ? 'border-glow-blue'
      : variant === 'amber'
      ? 'border-glow-amber'
      : 'border-glow-gold'
    : '';

  const interactiveClass = interactive
    ? 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl cursor-pointer hover:border-solar-gold/40'
    : '';

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl p-4 sm:p-6 relative overflow-hidden',
          elevationClass,
          variantClass,
          glowClass,
          interactiveClass,
          className
        )
      )}
      {...props}
    >
      {/* Refined top light refraction edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

export function GlassPanel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <GlassCard elevation={2} className={twMerge('rounded-3xl', className)} {...props}>
      {children}
    </GlassCard>
  );
}

export function GlassMetric({
  label,
  value,
  unit,
  change,
  icon: Icon,
  variant = 'gold',
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  change?: { value: string; positive?: boolean };
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'gold' | 'amber' | 'blue' | 'emerald' | 'cyan' | 'neutral';
  className?: string;
}) {
  const iconColors = {
    gold: 'text-solar-gold bg-solar-gold/10 border-solar-gold/30',
    amber: 'text-solar-amber bg-solar-amber/10 border-solar-amber/30',
    blue: 'text-solar-blue bg-solar-blue/10 border-solar-blue/30',
    emerald: 'text-solar-gold bg-solar-gold/10 border-solar-gold/30', // mapped to gold in theme
    cyan: 'text-solar-blue bg-solar-blue/10 border-solar-blue/30',     // mapped to electric blue
    neutral: 'text-gray-300 bg-white/5 border-white/10',
  }[variant];

  return (
    <GlassCard elevation={1} className={twMerge('p-4 sm:p-5', className)}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm', iconColors)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white font-mono-num">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>
      {change && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-mono">
          <span className={change.positive ? 'text-solar-gold font-bold' : 'text-rose-400 font-medium'}>
            {change.value}
          </span>
        </div>
      )}
    </GlassCard>
  );
}
