'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightElement?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, helperText, leftIcon: LeftIcon, rightElement, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-mono font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full glass-input rounded-xl text-sm px-3.5 py-2.5 placeholder-slate-500 font-sans border-white/[0.08]',
                LeftIcon ? 'pl-9' : '',
                rightElement ? 'pr-10' : '',
                error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' : '',
                className
              )
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] font-mono text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] font-mono text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, helperText, className, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-mono font-medium text-slate-300">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full glass-input rounded-xl text-sm px-3.5 py-2.5 bg-[#0B1426] text-white font-sans cursor-pointer border-white/[0.08]',
              error ? 'border-rose-500/50' : '',
              className
            )
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[11px] font-mono text-rose-400">{error}</p>}
      </div>
    );
  }
);
GlassSelect.displayName = 'GlassSelect';
