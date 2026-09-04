import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { requireSuperAdmin } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json(
      { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    const users = await SupabaseDatabaseService.getAllUsers();
    const withdrawals = await SupabaseDatabaseService.getAllWithdrawals();
    const recharges = await SupabaseDatabaseService.getAllRecharges();

    const filteredUsers = users.filter(
      u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.referralCode.toLowerCase().includes(q)
    );

    const filteredWithdrawals = withdrawals.filter(
      w => w.id.toLowerCase().includes(q) || w.userName.toLowerCase().includes(q) || w.walletAddress.toLowerCase().includes(q)
    );

    const filteredRecharges = recharges.filter(
      r => r.id.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q) || (r.txReference && r.txReference.toLowerCase().includes(q))
    );

    return NextResponse.json({
      success: true,
      results: {
        users: filteredUsers,
        withdrawals: filteredWithdrawals,
        recharges: filteredRecharges,
      },
      users: filteredUsers,
      withdrawals: filteredWithdrawals,
      recharges: filteredRecharges,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Search failed' }, { status: 500 });
  }
}
