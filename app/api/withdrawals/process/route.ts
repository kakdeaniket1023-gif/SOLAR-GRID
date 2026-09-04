import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { WithdrawalService } from '@/lib/withdrawal-engine';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Administrator authorization required' },
        { status: 403 }
      );
    }

    const { withdrawalId, action, txHash, adminNotes } = await request.json().catch(() => ({}));
    if (!withdrawalId || !action) {
      return NextResponse.json({ success: false, message: 'withdrawalId and action are required' }, { status: 400 });
    }

    const result = await WithdrawalService.processAdminAction(
      withdrawalId,
      action,
      auth.user.id,
      auth.user.name,
      txHash,
      adminNotes
    );

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message, request: result.request });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal error processing withdrawal' }, { status: 500 });
  }
}
