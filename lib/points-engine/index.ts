import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { PointsLedgerEntry } from '@/types';

export class PointsService {
  static getEfficiencyMultiplier(points: number): number {
    if (points >= 70) return 1.0;
    if (points >= 61) return 0.8;
    if (points >= 31) return 0.5;
    return 0.1;
  }

  static async adjustPoints(
    userId: string,
    pointsDelta: number,
    reason: string,
    adminId: string,
    adminName: string
  ): Promise<{ success: boolean; message: string; entry?: PointsLedgerEntry }> {
    const user = await SupabaseDatabaseService.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'A descriptive audit reason of at least 5 characters is required' };
    }

    const balanceBefore = user.points;
    const balanceAfter = Math.max(0, balanceBefore + pointsDelta);

    const entry = await SupabaseDatabaseService.addPointsLedgerEntry({
      userId: user.id,
      type: 'ADMIN_ADJUSTMENT',
      pointsChange: pointsDelta,
      balanceBefore,
      balanceAfter,
      reason: `Admin adjustment by ${adminName}: ${reason}`,
    });

    await SupabaseDatabaseService.updateUser(user.id, { points: balanceAfter });

    await SupabaseDatabaseService.addAuditLog({
      actorId: adminId,
      actorEmail: adminName,
      actorRole: 'SUPER_ADMIN',
      action: 'ADJUST_POINTS',
      targetType: 'USER_POINTS',
      targetId: userId,
      details: { balanceBefore, balanceAfter, delta: pointsDelta, reason },
    });

    return {
      success: true,
      message: `Successfully adjusted points by ${pointsDelta}. New balance: ${balanceAfter}`,
      entry,
    };
  }

  static async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await SupabaseDatabaseService.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const rewards = await SupabaseDatabaseService.getRewards();
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || reward.status !== 'AVAILABLE') {
      return { success: false, message: 'Reward item is not available' };
    }

    if (user.points < reward.pointsCost) {
      return {
        success: false,
        message: `Insufficient points. You have ${user.points} pts, but ${reward.pointsCost} pts are required.`,
      };
    }

    const balanceBefore = user.points;
    const balanceAfter = Math.max(0, user.points - reward.pointsCost);

    // If redeeming a cash balance voucher, credit user balance atomically
    let voucherCreditAmount = 0;
    if (reward.id === 'rew-5usdt') {
      voucherCreditAmount = 5;
    } else if (reward.id === 'rew-20usdt') {
      voucherCreditAmount = 20;
    }

    if (voucherCreditAmount > 0) {
      const creditRes = await SupabaseDatabaseService.atomicCreditBalance(user.id, voucherCreditAmount);
      if (creditRes.success) {
        await SupabaseDatabaseService.addLedgerEntry({
          userId: user.id,
          type: 'REDEMPTION',
          amount: voucherCreditAmount,
          direction: 'CREDIT',
          balanceBefore: creditRes.balanceBefore,
          balanceAfter: creditRes.balanceAfter,
          sourceEvent: 'REWARD_VOUCHER_REDEEMED',
          referenceId: `RED-${reward.id}-${Date.now()}`,
          description: `Reward Voucher: +$${voucherCreditAmount.toFixed(2)} USDT credited (${reward.title})`,
          actor: user.name,
        });
      }
    }

    await SupabaseDatabaseService.addPointsLedgerEntry({
      userId: user.id,
      type: 'REDEMPTION',
      pointsChange: -reward.pointsCost,
      balanceBefore,
      balanceAfter,
      reason: `Redeemed milestone: ${reward.title}. -${reward.pointsCost} points deducted.`,
    });

    await SupabaseDatabaseService.updateUser(user.id, { points: balanceAfter });

    await SupabaseDatabaseService.createNotification({
      userId: user.id,
      title: 'Reward Redemption Confirmed!',
      message: voucherCreditAmount > 0
        ? `Your voucher "${reward.title}" was redeemed successfully and +$${voucherCreditAmount.toFixed(2)} USDT credited to your balance!`
        : `Your redemption request for "${reward.title}" has been submitted successfully.`,
      type: 'SUCCESS',
      link: '/dashboard/rewards',
    });

    return {
      success: true,
      message: voucherCreditAmount > 0
        ? `Successfully redeemed "${reward.title}"! +$${voucherCreditAmount.toFixed(2)} USDT credited to your balance.`
        : `Successfully redeemed "${reward.title}". Points updated to ${balanceAfter} pts.`,
    };
  }
}
