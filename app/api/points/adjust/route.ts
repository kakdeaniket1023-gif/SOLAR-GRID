import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetId = body.userId || body.targetUserId;
    const delta = body.pointsDelta !== undefined ? body.pointsDelta : body.pointsChange;
    const reasonText = body.reason || 'Admin manual point adjustment';

    if (!targetId || delta === undefined) {
      return NextResponse.json({ success: false, message: 'userId and pointsDelta are required' }, { status: 400 });
    }

    const user = await SupabaseDatabaseService.getUserById(targetId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const pointsBefore = user.points;
    const pointsAfter = Math.max(0, Math.min(100, pointsBefore + Number(delta)));

    await SupabaseDatabaseService.updateUser(user.id, { points: pointsAfter });

    await SupabaseDatabaseService.addPointsLedgerEntry({
      userId: user.id,
      type: Number(delta) >= 0 ? 'BONUS' : 'DEDUCTION',
      pointsChange: Number(delta),
      balanceBefore: pointsBefore,
      balanceAfter: pointsAfter,
      reason: reasonText,
    });

    await SupabaseDatabaseService.addAuditLog({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: 'SUPER_ADMIN',
      action: 'POINT_ADJUSTMENT',
      target: 'USER_POINTS',
      targetId: user.id,
      details: {
        oldState: String(pointsBefore),
        newState: String(pointsAfter),
        reason: reasonText,
      },
      reason: reasonText,
    });

    return NextResponse.json({
      success: true,
      message: `Points updated successfully: ${pointsBefore} -> ${pointsAfter}`,
      pointsBefore,
      pointsAfter,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to adjust points' }, { status: 500 });
  }
}
