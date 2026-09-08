'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
import { GlassNavbar, GlassBottomBar, GlassUserSidebar } from '@/frontend/glass';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.unreadNotificationsCount === 'number') {
            setUnreadNotifsCount(data.unreadNotificationsCount);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#07080C] text-[#F8FAFC] flex selection:bg-amber-400 selection:text-black">
      {/* Desktop Fixed Sidebar */}
      <GlassUserSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
          <GlassNavbar unreadCount={unreadNotifsCount} />
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-28 lg:pb-12">
          {children}
        </main>

        {/* Floating Bottom Navigation Bar (Mobile only) */}
        <GlassBottomBar />
      </div>
    </div>
  );
}
