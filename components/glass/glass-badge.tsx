'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'amber' | 'blue' | 'emerald' | 'cyan' | 'neutral' | 'danger' | 'warning' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function GlassBadge({
  variant = 'gold',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: GlassBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono',
  }[size];

  const variantClasses = {
    gold: 'bg-solar-gold/15 text-amber-300 border-solar-gold/30',
    amber: 'bg-solar-amber/15 text-orange-300 border-solar-amber/30',
    blue: 'bg-solar-blue/15 text-blue-300 border-solar-blue/30',
    emerald: 'bg-solar-gold/15 text-amber-300 border-solar-gold/30', // mapped to gold
    cyan: 'bg-solar-blue/15 text-blue-300 border-solar-blue/30',     // mapped to blue
    neutral: 'bg-white/10 text-slate-300 border-white/15',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    warning: 'bg-amber-600/15 text-amber-200 border-amber-600/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  }[variant];

  const dotColors = {
    gold: 'bg-solar-gold',
    amber: 'bg-solar-amber',
    blue: 'bg-solar-blue',
    emerald: 'bg-solar-gold',
    cyan: 'bg-solar-blue',
    neutral: 'bg-slate-400',
    danger: 'bg-rose-400',
    warning: 'bg-amber-400',
    purple: 'bg-purple-400',
  }[variant];

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-lg border backdrop-blur-md shadow-sm select-none',
          sizeClasses,
          variantClasses,
          className
        )
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotColors)} />}
      {children}
    </span>
  );
}
