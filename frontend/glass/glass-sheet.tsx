'use client';

import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export function GlassDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#050B18]/85 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Glass Dialog Surface (Level 3) */}
      <div
        className={twMerge(
          clsx(
            'relative w-full glass-3 rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 border border-white/[0.12]',
            maxWidth,
            className
          )
        )}
      >
        {/* Top glow refraction */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-solar-gold/40 to-transparent pointer-events-none" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h3 className="text-lg font-bold text-white font-display">{title}</h3>}
            {description && <p className="text-xs text-slate-400 font-sans mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors border border-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function GlassDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-xl',
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
  className?: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#050B18]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Surface */}
      <div
        className={twMerge(
          clsx(
            'relative w-full h-full glass-3 border-l border-white/[0.12] shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300',
            width,
            className
          )
        )}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div>
            {title && <h2 className="text-base sm:text-lg font-bold text-white font-display">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function GlassSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#050B18]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Surface */}
      <div
        className={twMerge(
          clsx(
            'relative w-full max-w-lg glass-3 rounded-t-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 border-t border-white/[0.15] pb-10',
            className
          )
        )}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white font-display">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
