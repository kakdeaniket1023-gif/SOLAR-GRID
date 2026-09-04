import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const userId = auth.user.id;
    const units = await SupabaseDatabaseService.getUnits(userId);
    const logs = await SupabaseDatabaseService.getGenerationLogs(userId);
    const ledger = await SupabaseDatabaseService.getLedger(userId);
    const notifications = await SupabaseDatabaseService.getNotifications(userId);

    return NextResponse.json({
      success: true,
      user: auth.user,
      units,
      logs,
      recentLedger: ledger.slice(0, 10),
      notifications: notifications.slice(0, 50),
      unreadNotificationsCount: notifications.filter(n => !n.read).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
