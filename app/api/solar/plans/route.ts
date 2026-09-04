import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { SolarGenerationService } from '@/lib/solar-engine';
import { requireSuperAdmin } from '@/lib/auth/guards';

export async function GET() {
  try {
    const [plans, schedule] = await Promise.all([
      SupabaseDatabaseService.getPlans(),
      SolarGenerationService.loadDynamicSchedule(),
    ]);

    return NextResponse.json({
      success: true,
      plans,
      schedule: {
        operationWindow: `${schedule.startTime} – ${schedule.endTime}`,
        operatingDays: schedule.operatingDays,
        settlementTime: 'Immediate post-generation',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch solar plans' }, { status: 500 });
  }
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
    const { code, plan } = await request.json().catch(() => ({}));
    if (!code || !plan) {
      return NextResponse.json({ success: false, message: 'code and plan are required' }, { status: 400 });
    }

    const updated = await SupabaseDatabaseService.updatePlan(code, plan);

    await SupabaseDatabaseService.addAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_SOLAR_PLAN_CONFIG',
      targetType: 'SOLAR_PLAN',
      targetId: code,
      details: { code, plan },
    });

    return NextResponse.json({ success: true, plan: updated, message: 'Plan updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to update plan' }, { status: 500 });
  }
}
