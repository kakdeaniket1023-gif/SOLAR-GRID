'use client';

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
import { useToast } from '@/frontend/glass/glass-toast';
import { User, Notification, SolarUnit, EarningsLedgerEntry, WithdrawalRequest, RechargeRecord } from '@/types';

type RealtimeEventType =
  | 'BALANCE_UPDATED'
  | 'SOLAR_GENERATED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_STATUS_CHANGED'
  | 'RECHARGE_SUBMITTED'
  | 'RECHARGE_STATUS_CHANGED'
  | 'PLAN_PURCHASED'
  | 'PLAN_UPGRADED'
  | 'POINTS_REDEEMED'
  | 'NOTIFICATION_RECEIVED';

type EventListener = (payload: any) => void;

interface OptimisticMutationParams<TSnapshot, TResult> {
  idempotencyKey?: string;
  optimisticAction: () => TSnapshot;
  serverAction: (idempotencyKey: string) => Promise<{ success: boolean; data?: TResult; message?: string }>;
  onRollback: (snapshot: TSnapshot, errorMsg: string) => void;
  onSuccess?: (result: TResult) => void;
  successTitle?: string;
  successMessage?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  emitLocalEvent: (event: RealtimeEventType, payload?: any) => void;
  subscribeToEvent: (event: RealtimeEventType, callback: EventListener) => () => void;
  executeOptimisticMutation: <TSnapshot, TResult>(
    params: OptimisticMutationParams<TSnapshot, TResult>
  ) => Promise<{ success: boolean; data?: TResult; message?: string }>;
  generateIdempotencyKey: (prefix?: string) => string;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const { showToast, gold, success, error, info } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<RealtimeEventType, Set<EventListener>>>(new Map());

  const generateIdempotencyKey = useCallback((prefix: string = 'IDEMP') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const emitLocalEvent = useCallback((event: RealtimeEventType, payload?: any) => {
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in realtime listener for ${event}:`, err);
        }
      });
    }
  }, []);

  const subscribeToEvent = useCallback((event: RealtimeEventType, callback: EventListener) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  // Two-phase Optimistic Mutation Dispatcher with Snapshot Rollback
  const executeOptimisticMutation = useCallback(
    async <TSnapshot, TResult>({
      idempotencyKey,
      optimisticAction,
      serverAction,
      onRollback,
      onSuccess,
      successTitle,
      successMessage,
    }: OptimisticMutationParams<TSnapshot, TResult>): Promise<{ success: boolean; data?: TResult; message?: string }> => {
      const key = idempotencyKey || generateIdempotencyKey();
      
      // Phase 1: Capture state snapshot and execute optimistic update instantly (0ms)
      const snapshot = optimisticAction();

      try {
        // Phase 2: Dispatch server action
        const res = await serverAction(key);

        if (!res.success) {
          // Phase 3A: Server error -> Automatic rollback to snapshot
          const errMessage = res.message || 'Action rejected by server.';
          onRollback(snapshot, errMessage);
          error('Operation Failed', errMessage);
          await refreshUser(); // re-sync authoritative user profile
          return { success: false, message: errMessage };
        }

        // Phase 3B: Success -> Commit & broadcast
        if (onSuccess && res.data) {
          onSuccess(res.data);
        }

        if (successTitle || successMessage) {
          success(successTitle || 'Success', successMessage || res.message || 'Operation completed successfully.');
        }

        return { success: true, data: res.data, message: res.message };
      } catch (err: any) {
        // Phase 3C: Network timeout / exception -> Rollback
        const errMessage = err.message || 'Network error during operation.';
        onRollback(snapshot, errMessage);
        error('Network Timeout', 'Changes reverted. Please check your connection.');
        await refreshUser();
        return { success: false, message: errMessage };
      }
    },
    [generateIdempotencyKey, refreshUser, success, error]
  );

  // Setup heartbeat and visibility listener
  useEffect(() => {
    setIsConnected(true);
    if (!user) return;

    // Visibility Heartbeat: Re-sync immediately when user switches back to browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic re-sync every 30 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [user, refreshUser]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        emitLocalEvent,
        subscribeToEvent,
        executeOptimisticMutation,
        generateIdempotencyKey,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
