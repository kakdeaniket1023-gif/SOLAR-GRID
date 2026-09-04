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

    const notifications = await SupabaseDatabaseService.getNotifications(auth.user.id);
    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, notificationId } = body;

    if (action === 'MARK_ALL_READ') {
      await SupabaseDatabaseService.markAllNotificationsRead(auth.user.id);
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (action === 'MARK_READ' && notificationId) {
      await SupabaseDatabaseService.markNotificationRead(notificationId);
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
