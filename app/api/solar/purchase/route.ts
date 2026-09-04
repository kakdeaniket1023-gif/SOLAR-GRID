import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';
import { SolarGenerationService } from '@/lib/solar-engine';

const PurchaseSchema = z.object({
  planCode: z.string().min(1, 'Plan code is required'),
});

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
    const parseResult = PurchaseSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const result = await SolarGenerationService.purchasePlan(auth.user.id, parseResult.data.planCode);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message, unit: result.unit });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to complete solar purchase' }, { status: 500 });
  }
}
