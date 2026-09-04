'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { GlassNavbar, GlassBottomBar, GlassUserSidebar } from '@/components/glass';

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
    <div className="min-h-screen bg-[#050B18] solar-grid-bg text-[#F8FAFC] flex selection:bg-solar-gold selection:text-[#050B18]">
      {/* Desktop Fixed Glass Sidebar */}
      <GlassUserSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Glass Navbar */}
        <div className="max-w-5xl mx-auto w-full px-3 sm:px-6 pt-2">
          <GlassNavbar unreadCount={unreadNotifsCount} />
        </div>

        {/* Dynamic Page Content Canvas */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pb-28 lg:pb-12 pt-1">
          {children}
        </main>

        {/* Floating Glass Bottom Navigation Bar (Mobile only) */}
        <GlassBottomBar />
      </div>
    </div>
  );
}

