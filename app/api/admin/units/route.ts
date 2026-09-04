import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { requireSuperAdmin } from '@/lib/auth/guards';

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

  try {
    const units = await SupabaseDatabaseService.getAllUnits();
    return NextResponse.json({ success: true, units });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch units' }, { status: 500 });
  }
}
