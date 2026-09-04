'use client';

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/glass/glass-toast';
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

  // Setup Supabase Realtime Channels (PostgreSQL CDC)
  useEffect(() => {
    if (!user || !supabase) return;

    const userChannel = supabase
      .channel(`user-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload: any) => {
          const updatedUser = payload.new;
          if (updatedUser) {
            refreshUser();
            emitLocalEvent('BALANCE_UPDATED', {
              availableBalance: Number(updatedUser.available_balance),
              totalEarned: Number(updatedUser.total_earned),
              points: Number(updatedUser.points),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const notif = payload.new;
          if (notif) {
            gold(notif.title || 'New Alert', notif.message || 'You received a new update.');
            emitLocalEvent('NOTIFICATION_RECEIVED', notif);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'withdrawal_requests', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const wdr = payload.new;
          if (wdr) {
            emitLocalEvent('WITHDRAWAL_STATUS_CHANGED', wdr);
            if (wdr.status === 'APPROVED' || wdr.status === 'COMPLETED') {
              success('Withdrawal Approved', `Your withdrawal of ${wdr.amount_usdt} USDT is on the way!`);
            } else if (wdr.status === 'REJECTED') {
              error('Withdrawal Rejected', `Your withdrawal of ${wdr.amount_usdt} USDT was refunded.`);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'recharge_requests', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const rch = payload.new;
          if (rch) {
            emitLocalEvent('RECHARGE_STATUS_CHANGED', rch);
            if (rch.status === 'APPROVED') {
              gold('Deposit Credited!', `+${rch.amount_usdt} USDT has been credited to your balance.`);
              refreshUser();
            }
          }
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Admin Realtime Channel (Protected by database RLS)
    let adminChannel: any = null;
    if (user.role === 'SUPER_ADMIN') {
      adminChannel = supabase
        .channel('admin-ops-sync')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'recharge_requests' },
          (payload: any) => {
            info('New Recharge Pending', `New deposit request #${payload.new?.id?.substring(0, 8)} submitted.`);
            emitLocalEvent('RECHARGE_SUBMITTED', payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'withdrawal_requests' },
          (payload: any) => {
            info('New Withdrawal Pending', `New payout request #${payload.new?.id?.substring(0, 8)} submitted.`);
            emitLocalEvent('WITHDRAWAL_REQUESTED', payload.new);
          }
        )
        .subscribe();
    }

    // Visibility Heartbeat: Re-sync immediately when user switches back to browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(userChannel);
      if (adminChannel) supabase.removeChannel(adminChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshUser, emitLocalEvent, gold, success, error, info]);

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
