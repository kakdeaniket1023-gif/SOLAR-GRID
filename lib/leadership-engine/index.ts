import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { LeadershipTier, UserLeadershipProgress } from '@/types';
import { MLMService } from '@/lib/mlm-engine';

export class LeadershipService {
  static async evaluateProgress(userId: string): Promise<UserLeadershipProgress | null> {
    const user = await SupabaseDatabaseService.getUserById(userId);
    if (!user) return null;

    const levels = (await SupabaseDatabaseService.getLeadershipLevels()).sort((a, b) => a.order - b.order);
    const currentLevelConfig = levels.find((l) => l.level === user.leadershipLevel) || levels[0];
    const currentIndex = levels.findIndex((l) => l.level === user.leadershipLevel);
    const nextLevelConfig = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    const networkStats = await MLMService.getNetworkStats(userId);
    const userUnits = await SupabaseDatabaseService.getUnits(userId);
    const activePlan = userUnits.find((u) => u.status === 'ACTIVE')?.planCode || 'None';

    if (!nextLevelConfig) {
      return {
        currentLevel: user.leadershipLevel,
        nextLevel: null,
        directTeamCount: networkStats.directCount,
        directTeamTarget: currentLevelConfig?.minDirectTeam || 0,
        qualifiedTeamCount: networkStats.qualifiedCount,
        qualifiedTeamTarget: currentLevelConfig?.minQualifiedTeam || 0,
        activePlan,
        requiredPlan: currentLevelConfig?.requiredActivePlan || 'P1',
        currentPoints: user.points,
        requiredPoints: currentLevelConfig?.minPoints || 70,
        progressPercentage: 100,
        isEligibleForPromotion: false,
      };
    }

    const directProgress = Math.min(100, (networkStats.directCount / (nextLevelConfig.minDirectTeam || 1)) * 100);
    const teamProgress = Math.min(100, (networkStats.qualifiedCount / (nextLevelConfig.minQualifiedTeam || 1)) * 100);
    const pointProgress = Math.min(100, (user.points / (nextLevelConfig.minPoints || 1)) * 100);

    const planCodeOrder = { None: 0, P1: 1, P2: 2, P3: 3 };
    const userPlanWeight = planCodeOrder[activePlan as keyof typeof planCodeOrder] || 0;
    const reqPlanWeight = planCodeOrder[nextLevelConfig.requiredActivePlan as keyof typeof planCodeOrder] || 1;
    const planSatisfied = userPlanWeight >= reqPlanWeight;

    const overallProgress = Math.round(
      directProgress * 0.35 + teamProgress * 0.35 + pointProgress * 0.2 + (planSatisfied ? 100 : 0) * 0.1
    );

    const isEligible =
      networkStats.directCount >= nextLevelConfig.minDirectTeam &&
      networkStats.qualifiedCount >= nextLevelConfig.minQualifiedTeam &&
      user.points >= nextLevelConfig.minPoints &&
      planSatisfied;

    return {
      currentLevel: user.leadershipLevel,
      nextLevel: nextLevelConfig.level as any,
      directTeamCount: networkStats.directCount,
      directTeamTarget: nextLevelConfig.minDirectTeam,
      qualifiedTeamCount: networkStats.qualifiedCount,
      qualifiedTeamTarget: nextLevelConfig.minQualifiedTeam,
      activePlan,
      requiredPlan: nextLevelConfig.requiredActivePlan,
      currentPoints: user.points,
      requiredPoints: nextLevelConfig.minPoints,
      progressPercentage: Math.min(100, overallProgress),
      isEligibleForPromotion: isEligible,
    };
  }

  static async promoteUser(userId: string): Promise<{ success: boolean; message: string; newLevel?: LeadershipTier }> {
    const user = await SupabaseDatabaseService.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const progress = await this.evaluateProgress(userId);
    if (!progress || !progress.isEligibleForPromotion || !progress.nextLevel) {
      return { success: false, message: 'User does not meet all qualification metrics for rank promotion' };
    }

    const levels = await SupabaseDatabaseService.getLeadershipLevels();
    const nextLevelConfig = levels.find((l) => l.level === progress.nextLevel)!;

    const previousLevel = user.leadershipLevel;
    const newLevel = nextLevelConfig.level as LeadershipTier;

    await SupabaseDatabaseService.updateUser(user.id, { leadershipLevel: newLevel });

    if (nextLevelConfig.dailyBonusUsdt > 0) {
      const balanceBefore = user.availableBalance;
      const bonus = nextLevelConfig.dailyBonusUsdt * 10;
      const balanceAfter = Math.round((balanceBefore + bonus) * 10000) / 10000;

      await SupabaseDatabaseService.addLedgerEntry({
        userId: user.id,
        type: 'LEADERSHIP_REWARD',
        amount: bonus,
        direction: 'CREDIT',
        balanceBefore,
        balanceAfter,
        sourceEvent: 'LEADERSHIP_PROMOTION',
        referenceId: nextLevelConfig.id,
        description: `Leadership Rank Advancement Bonus: Promoted to ${nextLevelConfig.title}`,
        actor: 'SYSTEM',
      });

      await SupabaseDatabaseService.updateUser(user.id, {
        availableBalance: balanceAfter,
        totalEarned: user.totalEarned + bonus,
      });
    }

    await SupabaseDatabaseService.addAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LEADERSHIP_PROMOTION',
      targetType: 'USER_LEADERSHIP',
      targetId: user.id,
      details: { previousLevel, newLevel },
    });

    await SupabaseDatabaseService.createNotification({
      userId: user.id,
      title: `Promoted to ${nextLevelConfig.title}!`,
      message: `Congratulations! You have reached ${nextLevelConfig.title}.`,
      link: '/dashboard/leadership',
    });

    return {
      success: true,
      message: `Successfully promoted to ${nextLevelConfig.title}!`,
      newLevel,
    };
  }
}
