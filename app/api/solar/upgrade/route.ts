import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { SolarGenerationService } from '@/lib/solar-engine';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const { unitId, targetPlanCode } = await request.json().catch(() => ({}));
    if (!unitId || !targetPlanCode) {
      return NextResponse.json({ success: false, message: 'unitId and targetPlanCode are required' }, { status: 400 });
    }

    const result = await SolarGenerationService.upgradeUnit(auth.user.id, unitId, targetPlanCode);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message, unit: result.unit, topUpCostUsdt: result.topUpCostUsdt });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to process plan upgrade' }, { status: 500 });
  }
}
