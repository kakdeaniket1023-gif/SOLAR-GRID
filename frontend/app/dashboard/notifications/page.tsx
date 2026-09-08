'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
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
    { id: 'SOLAR', label: 'Panels' },
    { id: 'EARNINGS', label: 'Earnings' },
    { id: 'RECHARGES', label: 'Deposits' },
    { id: 'WITHDRAWALS', label: 'Withdrawals' },
    { id: 'SECURITY', label: 'Security' },
    { id: 'SUPPORT', label: 'Support' },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Activity updates on your panel runs, earnings, deposits, and account security.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-x-auto">
        {categories.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedGroup(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedGroup === tab.id
                ? 'bg-amber-400 text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const Icon = getCategoryIcon(item.group);

            return (
              <div
                key={item.id}
                onClick={() => handleMarkRead(item.id)}
                className={`p-4 rounded-2xl bg-[#0D0E15] border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                  !item.read
                    ? 'border-amber-400/30 bg-amber-400/[0.02]'
                    : 'border-white/[0.06] opacity-80'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      !item.read
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        : 'bg-white/[0.03] text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-white truncate">{item.title}</h3>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.message}</p>
                    <div className="text-[10px] text-zinc-500 pt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()} at{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {item.linkUrl && (
                  <Link
                    href={item.linkUrl}
                    className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-amber-400 text-xs shrink-0 flex items-center gap-1 transition-colors"
                  >
                    <span className="hidden sm:inline">View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 rounded-3xl bg-[#0D0E15] border border-white/[0.07] text-center text-zinc-500 text-xs">
            No notifications in this category.
          </div>
        )}
      </div>
    </div>
  );
}
