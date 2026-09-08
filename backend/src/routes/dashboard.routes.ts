import { Router, Response } from 'express';
import { requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';

const router = Router();

/**
 * GET /api/dashboard/overview
 */
router.get('/overview', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const userId = user.id;

    const [units, logs, ledger, notifications] = await Promise.all([
      DatabaseService.getUnits(userId),
      DatabaseService.getGenerationLogs(userId),
      DatabaseService.getLedger(userId),
      DatabaseService.getNotifications(userId),
    ]);

    return res.status(200).json({
      success: true,
      user,
      units,
      logs,
      recentLedger: ledger.slice(0, 10),
      notifications: notifications.slice(0, 50),
      unreadNotificationsCount: notifications.filter((n) => !n.read).length,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch dashboard data',
    });
  }
});

export default router;
