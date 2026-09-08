import { Router, Response } from 'express';
import { requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';

const router = Router();

/**
 * GET /api/notifications
 */
router.get('/', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const notifications = await DatabaseService.getNotifications(user.id);
    return res.status(200).json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch notifications',
    });
  }
});

/**
 * POST /api/notifications
 */
router.post('/', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { action, notificationId } = req.body || {};

    if (action === 'MARK_ALL_READ') {
      await DatabaseService.markAllNotificationsRead(user.id);
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }

    if (action === 'MARK_READ' && notificationId) {
      await DatabaseService.markNotificationRead(notificationId, user.id);
      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update notifications',
    });
  }
});

export default router;
