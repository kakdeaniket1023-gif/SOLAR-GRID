import { DatabaseService } from '@/backend/db';
import { LeadershipTier, UserLeadershipProgress } from '@/types';
import { TreeEngine } from '@/backend/engines/tree-engine';

export class LeadershipService {
  static async evaluateProgress(userId: string): Promise<UserLeadershipProgress | null> {
    const user = await DatabaseService.getUserById(userId);
    if (!user) return null;

    const levels = (await DatabaseService.getLeadershipLevels()).sort((a, b) => a.order - b.order);
    const currentLevelConfig = levels.find((l) => l.level === user.leadershipLevel) || levels[0];
    const currentIndex = levels.findIndex((l) => l.level === user.leadershipLevel);
    const nextLevelConfig = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    const teamStats = await TreeEngine.getTeamStats(userId);
    const personalPv = user.personalPv || 0;
    const groupPv = user.groupPv || teamStats.groupPv;

    if (!nextLevelConfig) {
      return {
        currentLevel: user.leadershipLevel,
        nextLevel: null,
        directTeamCount: teamStats.level1Count,
        directTeamTarget: currentLevelConfig?.minDirectTeam || 0,
        qualifiedTeamCount: teamStats.verifiedKycCount,
        qualifiedTeamTarget: currentLevelConfig?.minQualifiedTeam || 0,
        activePlan: 'DirectSelling',
        requiredPlan: 'None',
        currentPoints: personalPv,
        requiredPoints: currentLevelConfig?.minPoints || 0,
        progressPercentage: 100,
        isEligibleForPromotion: false,
      };
    }

    const directProgress = Math.min(100, (teamStats.level1Count / (nextLevelConfig.minDirectTeam || 1)) * 100);
    const teamProgress = Math.min(100, (teamStats.verifiedKycCount / (nextLevelConfig.minQualifiedTeam || 1)) * 100);
    // Point progress maps to personal PV or points
    const pointProgress = Math.min(100, (personalPv / (nextLevelConfig.minPoints || 1)) * 100);

    const overallProgress = Math.round(
      directProgress * 0.4 + teamProgress * 0.3 + pointProgress * 0.3
    );

    const isEligible =
      teamStats.level1Count >= nextLevelConfig.minDirectTeam &&
      teamStats.verifiedKycCount >= (nextLevelConfig.minQualifiedTeam || 0) &&
      (personalPv >= nextLevelConfig.minPoints || user.points >= nextLevelConfig.minPoints);

    return {
      currentLevel: user.leadershipLevel,
      nextLevel: nextLevelConfig.level as any,
      directTeamCount: teamStats.level1Count,
      directTeamTarget: nextLevelConfig.minDirectTeam,
      qualifiedTeamCount: teamStats.verifiedKycCount,
      qualifiedTeamTarget: nextLevelConfig.minQualifiedTeam,
      activePlan: 'DirectSelling',
      requiredPlan: nextLevelConfig.requiredActivePlan,
      currentPoints: personalPv,
      requiredPoints: nextLevelConfig.minPoints,
      progressPercentage: Math.min(100, overallProgress),
      isEligibleForPromotion: isEligible,
    };
  }

  static async promoteUser(userId: string): Promise<{ success: boolean; message: string; newLevel?: LeadershipTier }> {
    const user = await DatabaseService.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const progress = await this.evaluateProgress(userId);
    if (!progress || !progress.isEligibleForPromotion || !progress.nextLevel) {
      return { success: false, message: 'User does not meet all qualification metrics for rank promotion' };
    }

    const levels = await DatabaseService.getLeadershipLevels();
    const nextLevelConfig = levels.find((l) => l.level === progress.nextLevel)!;

    const previousLevel = user.leadershipLevel;
    const newLevel = nextLevelConfig.level as LeadershipTier;

    await DatabaseService.updateUser(user.id, { leadershipLevel: newLevel });

    // Compliance: One-time rank milestone achievement bonus (bonusUsdt), not daily yield
    const rankBonus = nextLevelConfig.bonusUsdt || 0;
    if (rankBonus > 0) {
      const balanceBefore = user.availableBalance;
      const balanceAfter = Math.round((balanceBefore + rankBonus) * 10000) / 10000;

      await DatabaseService.addLedgerEntry({
        userId: user.id,
        type: 'LEADERSHIP_REWARD',
        amount: rankBonus,
        direction: 'CREDIT',
        balanceBefore,
        balanceAfter,
        sourceEvent: 'LEADERSHIP_PROMOTION',
        referenceId: nextLevelConfig.id,
        description: `Leadership Rank Advancement Bonus: Promoted to ${nextLevelConfig.title}`,
        actor: 'SYSTEM',
      });

      await DatabaseService.updateUser(user.id, {
        availableBalance: balanceAfter,
        totalEarned: user.totalEarned + rankBonus,
      });
    }

    await DatabaseService.addAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LEADERSHIP_PROMOTION',
      targetType: 'USER_LEADERSHIP',
      targetId: user.id,
      details: { previousLevel, newLevel, rankBonus },
    });

    await DatabaseService.createNotification({
      userId: user.id,
      title: `Promoted to ${nextLevelConfig.title}!`,
      message: `Congratulations! You have reached ${nextLevelConfig.title} in the direct-selling community.`,
      link: '/dashboard/leadership',
    });

    return {
      success: true,
      message: `Successfully promoted to ${nextLevelConfig.title}!`,
      newLevel,
    };
  }
}
