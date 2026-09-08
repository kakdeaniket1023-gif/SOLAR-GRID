import { Router, Response } from 'express';
import { requireAuthenticatedUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { TreeEngine } from '@/backend/engines/tree-engine';
import { DatabaseService } from '@/backend/db';

const router = Router();

/**
 * GET /api/network/stats
 */
router.get('/stats', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedUserId = req.query.userId as string | undefined;

    let targetUserId = user.id;

    if (requestedUserId && requestedUserId !== user.id) {
      if (user.role !== 'SUPER_ADMIN') {
        const isDownline = await TreeEngine.isDownline(user.id, requestedUserId);
        if (!isDownline) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'You can only view stats within your own downline tree',
          });
        }
      }
      targetUserId = requestedUserId;
    }

    const stats = await TreeEngine.getTeamStats(targetUserId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch team statistics',
    });
  }
});

/**
 * GET /api/network/tree
 */
router.get('/tree', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedUserId = req.query.userId as string | undefined;
    const depthParam = req.query.depth as string | undefined;
    const cursor = (req.query.cursor as string | undefined) || undefined;
    const limitParam = req.query.limit as string | undefined;

    let targetUserId = user.id;

    if (requestedUserId && requestedUserId !== user.id) {
      if (user.role !== 'SUPER_ADMIN') {
        const isDownline = await TreeEngine.isDownline(user.id, requestedUserId);
        if (!isDownline) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'You can only view nodes within your own downline tree',
          });
        }
      }
      targetUserId = requestedUserId;
    }

    const depth = depthParam ? parseInt(depthParam, 10) : 2;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const treeData = await TreeEngine.getTree(targetUserId, {
      depth,
      cursor,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: treeData,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch network tree',
    });
  }
});

/**
 * GET /api/network/genealogy/:userId
 */
router.get('/genealogy/:userId', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const targetUserId = String(req.params.userId);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'User ID is required',
      });
    }

    if (targetUserId !== user.id && user.role !== 'SUPER_ADMIN') {
      const isDownline = await TreeEngine.isDownline(user.id, targetUserId);
      if (!isDownline) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to view this member details',
        });
      }
    }

    const targetUser = await DatabaseService.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Member not found',
      });
    }

    const stats = await TreeEngine.getTeamStats(targetUserId);
    const directs = await DatabaseService.getUsersBySponsorIds([targetUserId]);

    return res.status(200).json({
      success: true,
      data: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        kycStatus: targetUser.kycStatus || 'UNSUBMITTED',
        personalPv: targetUser.personalPv || 0,
        groupPv: targetUser.groupPv || 0,
        sponsorId: targetUser.sponsorId,
        directCount: directs.length,
        createdAt: targetUser.createdAt,
        stats,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch member genealogy',
    });
  }
});

export default router;
