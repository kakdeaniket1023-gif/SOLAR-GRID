import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { SolarGenerationService } from '@/lib/solar-engine';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function GET() {
  try {
    const status = SolarGenerationService.getSolarOperationStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch solar operation status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (!auth.authorized || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
          { status: 401 }
        )
      );
    }

    const { unitId, action, startCode } = await request.json().catch(() => ({}));
    if (!unitId) {
      return NextResponse.json({ success: false, message: 'unitId is required' }, { status: 400 });
    }

    const unit = await SupabaseDatabaseService.getUnitById(unitId);
    if (!unit) {
      return NextResponse.json({ success: false, message: 'Solar unit not found' }, { status: 404 });
    }

    // Enforce ownership
    if (unit.userId !== auth.user.id && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: '403 Forbidden: You do not own this solar unit.' },
        { status: 403 }
      );
    }

    if (action === 'SETTLE') {
      const result = await SolarGenerationService.settleDailyOperation(unitId, auth.user.id);
      if (!result.success && !result.alreadySettled) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        alreadySettled: result.alreadySettled || false,
        message: result.message,
        creditedAmount: result.creditedAmount,
        newBalance: result.balanceAfter,
        log: result.log,
        unit: result.unit,
      });
    }

    if (action === 'START') {
      const result = await SolarGenerationService.startDailyOperation(unitId, auth.user.id, startCode);
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        receivableAmount: result.receivableAmount,
        kwhGenerated: result.kwhGenerated,
        startedAt: result.startedAt,
        log: result.log,
      });
    }

    if (action === 'RECEIVE') {
      const result = await SolarGenerationService.receiveDailyEarning(unitId, auth.user.id);
      if (!result.success || result.alreadySettled) {
        return NextResponse.json(
          { success: false, message: result.message || 'Daily generation already settled for today.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        creditedAmount: result.creditedAmount,
        newBalance: result.balanceAfter,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action. Must be SETTLE, START, or RECEIVE' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to process solar operation' }, { status: 500 });
  }
}
