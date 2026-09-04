import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { User } from '@/types';

export class MLMService {
  static async getUplineChain(userId: string): Promise<{
    l1?: User;
    l2?: User;
    l3?: User;
  }> {
    const visited = new Set<string>([userId]);
    const user = await SupabaseDatabaseService.getUserById(userId);
    if (!user || !user.sponsorId) return {};

    // Level 1 Sponsor
    const l1 = await SupabaseDatabaseService.getUserById(user.sponsorId);
    if (!l1 || visited.has(l1.id)) return {};
    visited.add(l1.id);

    // Level 2 Sponsor
    let l2: User | undefined;
    if (l1.sponsorId && !visited.has(l1.sponsorId)) {
      const foundL2 = await SupabaseDatabaseService.getUserById(l1.sponsorId);
      if (foundL2) {
        l2 = foundL2;
        visited.add(l2.id);
      }
    }

    // Level 3 Sponsor
    let l3: User | undefined;
    if (l2 && l2.sponsorId && !visited.has(l2.sponsorId)) {
      const foundL3 = await SupabaseDatabaseService.getUserById(l2.sponsorId);
      if (foundL3) l3 = foundL3;
    }

    return { l1, l2, l3 };
  }

  static async distributeCommissions(
    downlineUserId: string,
    earningAmountUsdt: number,
    unitId: string
  ): Promise<void> {
    if (earningAmountUsdt <= 0) return;

    const downlineUser = await SupabaseDatabaseService.getUserById(downlineUserId);
    if (!downlineUser) return;

    const upline = await this.getUplineChain(downlineUserId);
    const payouts = [
      { user: upline.l1, level: 1, percent: 10.0, type: 'L1_REFERRAL_REWARD' },
      { user: upline.l2, level: 2, percent: 5.0, type: 'L2_REFERRAL_REWARD' },
      { user: upline.l3, level: 3, percent: 2.0, type: 'L3_REFERRAL_REWARD' },
    ];

    for (const p of payouts) {
      if (!p.user || p.user.status !== 'ACTIVE') continue;

      const commissionAmount = Math.round(earningAmountUsdt * (p.percent / 100) * 10000) / 10000;
      if (commissionAmount <= 0) continue;

      const creditRes = await SupabaseDatabaseService.atomicCreditBalance(
        p.user.id,
        commissionAmount,
        commissionAmount
      );

      if (!creditRes.success) continue;

      await SupabaseDatabaseService.addLedgerEntry({
        userId: p.user.id,
        type: p.type as any,
        amount: commissionAmount,
        direction: 'CREDIT',
        balanceBefore: creditRes.balanceBefore,
        balanceAfter: creditRes.balanceAfter,
        sourceEvent: 'COMMISSION_PAYOUT',
        referenceId: unitId,
        description: `Level ${p.level} Community Commission (${p.percent}%) from ${downlineUser.name} solar generation`,
        actor: 'SYSTEM',
      });

      await SupabaseDatabaseService.createNotification({
        userId: p.user.id,
        title: `L${p.level} Referral Reward Credited`,
        message: `Received +${commissionAmount.toFixed(4)} USDT (${p.percent}%) override from ${downlineUser.name}'s solar unit.`,
        link: '/dashboard/earnings',
      });
    }
  }

  static async getNetworkStats(userId: string) {
    const allUsers = await SupabaseDatabaseService.getAllUsers();
    const directs = allUsers.filter((u) => u.sponsorId === userId);
    const l1Ids = directs.map((d) => d.id);
    const l2Users = allUsers.filter((u) => u.sponsorId && l1Ids.includes(u.sponsorId));
    const l2Ids = l2Users.map((u) => u.id);
    const l3Users = allUsers.filter((u) => u.sponsorId && l2Ids.includes(u.sponsorId));

    const allDownlines = [...directs, ...l2Users, ...l3Users];
    const activeDownlines = allDownlines.filter((u) => u.status === 'ACTIVE');
    const qualifiedDownlines = allDownlines.filter((u) => u.points >= 70 && u.totalEarned > 0);

    const userLedger = await SupabaseDatabaseService.getLedger(userId);
    const totalCommissionUsdt = userLedger
      .filter((l) => ['L1_REFERRAL_REWARD', 'L2_REFERRAL_REWARD', 'L3_REFERRAL_REWARD'].includes(l.type))
      .reduce((sum, l) => sum + (l.amountUsdt || 0), 0);

    return {
      directCount: directs.length,
      l2Count: l2Users.length,
      l3Count: l3Users.length,
      totalTeamCount: allDownlines.length,
      activeCount: activeDownlines.length,
      qualifiedCount: qualifiedDownlines.length,
      totalCommissionUsdt: Math.round(totalCommissionUsdt * 100) / 100,
      directReferrals: directs,
      l2Referrals: l2Users,
      l3Referrals: l3Users,
      funnel: {
        visitors: directs.length * 6 + 18,
        signups: directs.length * 2 + 5,
        activated: directs.length,
        qualified: qualifiedDownlines.length,
      },
    };
  }
}
