import { Router, Response } from 'express';
import { MLMService } from '@/backend/engines/mlm-engine';
import { TreeEngine } from '@/backend/engines/tree-engine';
import { DatabaseService } from '@/backend/db';
import { requireUser, AuthenticatedRequest } from '@/backend/auth/guards';

const router = Router();

/**
 * GET /api/mlm/stats
 */
router.get('/stats', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const queryUserId = req.query.userId as string | undefined;

    let targetUserId = user.id;
    if (queryUserId && user.role === 'SUPER_ADMIN') {
      targetUserId = queryUserId;
    }

    const stats = await MLMService.getNetworkStats(targetUserId);
    return res.status(200).json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch MLM stats' });
  }
});

/**
 * GET /api/mlm/tree
 */
router.get('/tree', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedUserId = req.query.userId as string | undefined;
    const searchQuery = (req.query.search as string | undefined)?.trim();
    const rawDepth = req.query.depth ? parseInt(req.query.depth as string, 10) : 4;
    const depth = isNaN(rawDepth) ? 4 : Math.min(Math.max(rawDepth, 1), 10);

    let targetUserId = user.id;

    if (user.role === 'SUPER_ADMIN') {
      if (searchQuery) {
        const allUsers = await DatabaseService.getAllUsers();
        const found = allUsers.find(
          (u) =>
            u.email.toLowerCase() === searchQuery.toLowerCase() ||
            (u.referralCode && u.referralCode.toLowerCase() === searchQuery.toLowerCase()) ||
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.id === searchQuery
        );
        if (found) {
          targetUserId = found.id;
        } else {
          return res.status(404).json({ success: false, message: 'Member not found for query' });
        }
      } else if (requestedUserId) {
        targetUserId = requestedUserId;
      }
    }

    const targetUser = await DatabaseService.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { root, totalDirects } = await TreeEngine.getTree(targetUserId, { depth });

    return res.status(200).json({
      success: true,
      tree: root,
      totalDirects,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch MLM tree',
      error: err.message,
    });
  }
});

export default router;
