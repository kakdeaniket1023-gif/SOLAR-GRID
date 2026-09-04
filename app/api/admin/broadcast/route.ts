import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { requireSuperAdmin } from '@/lib/auth/guards';

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return (
      auth.errorResponse ||
      NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' },
        { status: 403 }
      )
    );
  }

  try {
    const { title, message, targetAudience } = await request.json().catch(() => ({}));
    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'Title and message are required' }, { status: 400 });
    }

    const users = await SupabaseDatabaseService.getAllUsers();
    let targetUsers = users;

    if (targetAudience === 'ACTIVE_PLAN_HOLDERS') {
      const units = await SupabaseDatabaseService.getAllUnits();
      const activeUserIds = new Set(units.filter((u) => u.status === 'ACTIVE').map((u) => u.userId));
      targetUsers = users.filter((u) => activeUserIds.has(u.id));
    } else if (targetAudience === 'LEADERS_ONLY') {
      targetUsers = users.filter((u) =>
        ['SOLAR_LEADER', 'GRID_LEADER', 'ENERGY_AMBASSADOR'].includes(u.leadershipLevel)
      );
    }

    await Promise.all(
      targetUsers.map((u) =>
        SupabaseDatabaseService.createNotification({
          userId: u.id,
          title,
          message,
          type: 'INFO',
          link: '/dashboard',
        })
      )
    );

    await SupabaseDatabaseService.addAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BROADCAST_DISPATCH',
      targetType: 'COMMUNICATION_HUB',
      targetId: targetAudience || 'ALL_USERS',
      details: { title, message, recipientCount: targetUsers.length },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast dispatched successfully to ${targetUsers.length} active contributor accounts.`,
      count: targetUsers.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to dispatch broadcast' }, { status: 500 });
  }
}
