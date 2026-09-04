'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'amber' | 'blue' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
}

export function GlassButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  children,
  disabled,
  ...props
}: GlassButtonProps) {
  const baseClasses =
    'relative inline-flex items-center justify-center font-semibold font-sans rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050B18] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 h-10',
    lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5 h-12',
    icon: 'w-10 h-10 p-0 flex items-center justify-center rounded-xl',
  }[size];

  const variantClasses = {
    primary:
      'glass-button focus:ring-solar-gold/50 shadow-gold-glow',
    gold:
      'glass-button-gold focus:ring-solar-gold/50',
    amber:
      'bg-solar-amber/15 hover:bg-solar-amber/25 text-amber-200 border border-solar-amber/35 backdrop-blur-md shadow-amber-glow active:scale-98 focus:ring-solar-amber/50',
    blue:
      'glass-button-blue focus:ring-solar-blue/50 shadow-blue-glow',
    secondary:
      'bg-white/[0.06] hover:bg-white/[0.12] text-slate-100 border border-white/10 hover:border-white/20 backdrop-blur-md shadow-sm active:scale-98 focus:ring-white/30',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30 backdrop-blur-md shadow-sm active:scale-98 focus:ring-rose-500/50',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white border-transparent active:scale-98 focus:ring-white/20',
  }[variant];

  return (
    <button
      className={twMerge(clsx(baseClasses, sizeClasses, variantClasses, className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />}
          {children}
          {RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
