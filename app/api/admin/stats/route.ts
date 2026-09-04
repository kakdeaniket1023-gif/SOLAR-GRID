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

  const users = await SupabaseDatabaseService.getAllUsers();
  const units = await SupabaseDatabaseService.getAllUnits();
  const ledger = await SupabaseDatabaseService.getAllLedger();
  const withdrawals = await SupabaseDatabaseService.getAllWithdrawals();
  const auditLogs = await SupabaseDatabaseService.getAuditLogs();

  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const activeUnits = units.filter((u) => u.status === 'ACTIVE').length;
  const totalCapacityKw = units
    .filter((u) => u.status === 'ACTIVE')
    .reduce((sum, u) => sum + u.capacityKw, 0);

  const totalEarningsDistributed = ledger
    .filter((l) => l.type === 'DAILY_SOLAR_EARNING' || l.type.includes('REWARD'))
    .reduce((sum, l) => sum + (l.amountUsdt || l.amount || 0), 0);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING').length;
  const pendingWithdrawalVolume = withdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + (w.amountUsdt || w.amount || 0), 0);

  const leadershipDistribution = {
    SOLAR_MEMBER: users.filter((u) => u.leadershipLevel === 'SOLAR_MEMBER').length,
    SOLAR_BUILDER: users.filter((u) => u.leadershipLevel === 'SOLAR_BUILDER').length,
    ENERGY_COORDINATOR: users.filter((u) => u.leadershipLevel === 'ENERGY_COORDINATOR').length,
    SOLAR_LEADER: users.filter((u) => u.leadershipLevel === 'SOLAR_LEADER').length,
    GRID_LEADER: users.filter((u) => u.leadershipLevel === 'GRID_LEADER').length,
    ENERGY_AMBASSADOR: users.filter((u) => u.leadershipLevel === 'ENERGY_AMBASSADOR').length,
  };

  const planDistribution = {
    P1: units.filter((u) => u.planCode === 'P1').length,
    P2: units.filter((u) => u.planCode === 'P2').length,
    P3: units.filter((u) => u.planCode === 'P3').length,
  };

  return NextResponse.json({
    success: true,
    stats: {
      totalUsers: users.length,
      activeUsers,
      activeUnits,
      totalCapacityKw: Math.round(totalCapacityKw * 10) / 10,
      totalEarningsDistributed: Math.round(totalEarningsDistributed * 100) / 100,
      pendingWithdrawals,
      pendingWithdrawalVolume: Math.round(pendingWithdrawalVolume * 100) / 100,
      openTickets: 0,
      leadershipDistribution,
      planDistribution,
    },
    auditLogs: auditLogs.slice(0, 10),
  });
}
