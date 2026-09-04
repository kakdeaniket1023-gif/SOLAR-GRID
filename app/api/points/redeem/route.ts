import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-engine';
import { requireUser } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json({ success: false, message: '401 Unauthorized: Valid session required' }, { status: 401 })
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId, rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ success: false, message: 'rewardId is required' }, { status: 400 });
    }

    // Anti-IDOR: Regular users can ONLY redeem for their own account
    let targetUserId = auth.user.id;
    if (userId && userId !== auth.user.id) {
      if (auth.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Cannot redeem points on behalf of another user' },
          { status: 403 }
        );
      }
      targetUserId = userId;

      // Log admin override action to audit_logs
      await SupabaseDatabaseService.addAuditLog({
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: 'ADMIN_POINTS_REDEEM',
        targetType: 'POINTS',
        targetId: targetUserId,
        details: { rewardId, targetUserId },
      });
    }

    const result = await PointsService.redeemReward(targetUserId, rewardId);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to redeem reward' }, { status: 500 });
  }
}
