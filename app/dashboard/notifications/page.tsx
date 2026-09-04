'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Notification, NotificationGroup } from '@/types';
import {
  Bell,
  CheckCheck,
  Sun,
  DollarSign,
  Award,
  Users,
  Shield,
  ArrowRight,
  Zap,
  ArrowDownToLine,
  Headphones,
} from 'lucide-react';
import Link from 'next/link';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassTabs,
} from '@/components/glass';

export default function DashboardNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const loadData = useCallback(() => {
    if (user) {
      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.notifications) {
            setNotifications(data.notifications);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      });
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', notificationId: id }),
      });
    } catch {
      // ignore
    }
  };

  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'SOLAR', label: 'Panel' },
    { id: 'EARNINGS', label: 'Earnings' },
    { id: 'RECHARGES', label: 'Recharge' },
    { id: 'WITHDRAWALS', label: 'Withdrawal' },
    { id: 'SECURITY', label: 'Security' },
    { id: 'SUPPORT', label: 'Support' },
    { id: 'SYSTEM', label: 'System' },
  ];

  const filtered = notifications.filter((n) => selectedGroup === 'ALL' || n.group === selectedGroup);

  const getCategoryIcon = (group: NotificationGroup) => {
    switch (group) {
      case 'SOLAR':
        return Sun;
      case 'EARNINGS':
        return DollarSign;
      case 'RECHARGES':
        return Zap;
      case 'WITHDRAWALS':
        return ArrowDownToLine;
      case 'SECURITY':
        return Shield;
      case 'SUPPORT':
        return Headphones;
      case 'LEADERSHIP':
        return Award;
      case 'REFERRAL':
      case 'TEAM':
        return Users;
      default:
        return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <GlassCard elevation={2} className="p-5 sm:p-6 border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GlassBadge variant="gold" dot>
                NOTIFICATIONS CENTER
              </GlassBadge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Alerts & Updates</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time generation telemetry, commissions, deposits, and system dispatches.
            </p>
          </div>

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={CheckCheck}
          >
            Mark All Read
          </GlassButton>
        </div>
      </GlassCard>

      {/* 2. Category Filter Tabs */}
      <GlassTabs
        tabs={categories}
        activeTab={selectedGroup}
        onChange={setSelectedGroup}
        size="sm"
      />

      {/* 3. Notifications List */}
      <div className="space-y-2.5">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const Icon = getCategoryIcon(item.group);

            return (
              <GlassCard
                key={item.id}
                elevation={item.read ? 1 : 2}
                variant={item.read ? 'default' : 'gold'}
                onClick={() => handleMarkRead(item.id)}
                className={`p-4 transition-all cursor-pointer flex items-start justify-between gap-4 border-white/[0.08] ${
                  !item.read ? 'border-solar-gold/40 shadow-gold-glow' : 'opacity-85'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      !item.read
                        ? 'bg-solar-gold/20 text-solar-gold border-solar-gold/40 shadow-gold-glow'
                        : 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h3>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-solar-gold animate-pulse shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.message}</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()} at{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {item.linkUrl && (
                  <Link
                    href={item.linkUrl}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-solar-gold text-xs shrink-0 flex items-center gap-1 font-mono transition-colors"
                  >
                    <span className="hidden sm:inline">View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </GlassCard>
            );
          })
        ) : (
          <GlassCard elevation={1} className="p-10 text-center text-slate-400 font-mono text-xs border-white/[0.08]">
            No notifications in this category.
          </GlassCard>
        )}
      </div>
    </div>
  );
}
