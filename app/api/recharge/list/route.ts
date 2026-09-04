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

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Prevent IDOR: regular users only get their own records
    const targetUserId = auth.user.role === 'SUPER_ADMIN' && requestedUserId ? requestedUserId : auth.user.id;

    const recharges = await SupabaseDatabaseService.getRecharges(targetUserId);
    return NextResponse.json({ success: true, recharges });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch recharges' }, { status: 500 });
  }
}
