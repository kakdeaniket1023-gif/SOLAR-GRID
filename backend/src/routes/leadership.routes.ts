import { Router, Response } from 'express';
import { requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';

const router = Router();

/**
 * GET /api/leadership/progress
 */
router.get('/progress', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.user!;
    const requestedUserId = req.query.userId as string | undefined;

    const targetUserId = authUser.role === 'SUPER_ADMIN' && requestedUserId ? requestedUserId : authUser.id;
    const targetUser = await DatabaseService.getUserById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const allUsers = await DatabaseService.getAllUsers();
    const directs = allUsers.filter((u) => u.sponsorId === targetUser.id);
    const levels = await DatabaseService.getLeadershipLevels();

    const currentLevelConfig = levels.find((l) => l.level === targetUser.leadershipLevel) || levels[0];
    const currentIndex = levels.findIndex((l) => l.level === targetUser.leadershipLevel);
    const nextLevelConfig = currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    const progress = {
      user: targetUser,
      currentLevel: targetUser.leadershipLevel,
      currentLevelConfig,
      nextLevelConfig,
      directCount: directs.length,
      activeTeamCount: directs.length,
      points: targetUser.points,
      eligibleForPromotion: nextLevelConfig
        ? directs.length >= nextLevelConfig.minDirectTeam && targetUser.points >= nextLevelConfig.minPoints
        : false,
    };

    return res.status(200).json({ success: true, progress });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to evaluate leadership progress' });
  }
});

/**
 * POST /api/leadership/promote
 */
router.post('/promote', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.user!;
    const { userId } = req.body || {};
    const targetUserId = authUser.role === 'SUPER_ADMIN' && userId ? userId : authUser.id;

    const user = await DatabaseService.getUserById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const levels = await DatabaseService.getLeadershipLevels();
    const currentIndex = levels.findIndex((l) => l.level === user.leadershipLevel);
    if (currentIndex >= levels.length - 1) {
      return res.status(400).json({ success: false, message: 'User has reached maximum leadership rank.' });
    }

    const nextLevel = levels[currentIndex + 1];
    const allUsers = await DatabaseService.getAllUsers();
    const directs = allUsers.filter((u) => u.sponsorId === user.id);

    if (authUser.role !== 'SUPER_ADMIN') {
      if (directs.length < nextLevel.minDirectTeam || user.points < nextLevel.minPoints) {
        return res.status(400).json({
          success: false,
          message: `Requirements not met. Requires ${nextLevel.minDirectTeam} directs and ${nextLevel.minPoints} points.`,
        });
      }
    }

    const updated = await DatabaseService.updateUser(user.id, { leadershipLevel: nextLevel.level });

    await DatabaseService.createNotification({
      userId: user.id,
      title: 'Leadership Rank Promotion! 🌟',
      message: `Congratulations! You have advanced to ${nextLevel.title}.`,
      link: '/dashboard/leadership',
    });

    return res.status(200).json({
      success: true,
      message: `Promoted to ${nextLevel.title}!`,
      newLevel: nextLevel.level,
      user: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to process promotion' });
  }
});

export default router;
