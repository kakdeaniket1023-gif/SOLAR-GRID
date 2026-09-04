import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { MLMService } from '@/lib/mlm-engine';

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const user = await SupabaseDatabaseService.getUserById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const [units, recharges, withdrawals, ledger, auditLogs, networkStats] = await Promise.all([
      SupabaseDatabaseService.getUnits(id),
      SupabaseDatabaseService.getRecharges(id),
      SupabaseDatabaseService.getWithdrawals(id),
      SupabaseDatabaseService.getLedger(id),
      SupabaseDatabaseService.getAuditLogs().then((logs) =>
        logs.filter((a) => a.targetId === id || a.actorId === id)
      ),
      MLMService.getNetworkStats(id),
    ]);

    return NextResponse.json({
      success: true,
      user,
      units,
      recharges,
      withdrawals,
      ledger,
      auditLogs,
      networkStats,
    });
  }

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  const allUsers = await SupabaseDatabaseService.getAllUsers();
  const total = allUsers.length;
  const paginatedUsers = allUsers.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

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
    const { userId, status, reason } = await request.json().catch(() => ({}));
    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const user = await SupabaseDatabaseService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updated = await SupabaseDatabaseService.updateUser(userId, {
      status: status || user.status,
    });

    await SupabaseDatabaseService.addAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_USER_ACCOUNT',
      targetType: 'USER_ACCOUNT',
      targetId: userId,
      details: {
        oldStatus: user.status,
        newStatus: status || user.status,
        reason: reason || 'Super Admin user modification',
      },
    });

    return NextResponse.json({ success: true, user: updated, message: 'User updated successfully' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
  }
}
