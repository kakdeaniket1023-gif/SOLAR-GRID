'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'gold';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
  gold: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = 'info', duration = 4500 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { id, title, message, type, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message: string) => showToast({ title, message, type: 'success' }), [showToast]);
  const error = useCallback((title: string, message: string) => showToast({ title, message, type: 'error' }), [showToast]);
  const info = useCallback((title: string, message: string) => showToast({ title, message, type: 'info' }), [showToast]);
  const gold = useCallback((title: string, message: string) => showToast({ title, message, type: 'gold' }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, gold }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto p-4 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300 transform translate-y-0 flex items-start gap-3',
              t.type === 'success' && 'bg-[#061510]/90 border-emerald-500/40 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.2)]',
              t.type === 'error' && 'bg-[#180608]/90 border-rose-500/40 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.2)]',
              t.type === 'gold' && 'bg-[#181105]/95 border-amber-400/50 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.25)]',
              t.type === 'info' && 'bg-[#050C1B]/90 border-blue-500/40 text-blue-100 shadow-[0_0_25px_rgba(59,130,246,0.2)]'
            )}
          >
            <div className="shrink-0 pt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === 'gold' && <Zap className="w-5 h-5 text-solar-gold" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                {t.title}
              </h4>
              <p className="text-xs font-sans text-slate-300 mt-0.5 leading-relaxed break-words">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
