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
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const allLedger = await SupabaseDatabaseService.getAllLedger();
    const total = allLedger.length;
    const paginatedLedger = allLedger.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      ledger: paginatedLedger,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch ledger' }, { status: 500 });
  }
}
