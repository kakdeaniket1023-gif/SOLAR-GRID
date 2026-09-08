import { Router, Response } from 'express';
import { requireSuperAdmin, requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';
import { PointsService } from '@/backend/engines/points-engine';

const router = Router();

/**
 * POST /api/points/adjust (Super admin)
 */
router.post('/adjust', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const body = req.body || {};
    const targetId = body.userId || body.targetUserId;
    const delta = body.pointsDelta !== undefined ? body.pointsDelta : body.pointsChange;
    const reasonText = body.reason || 'Admin manual point adjustment';

    if (!targetId || delta === undefined) {
      return res.status(400).json({ success: false, message: 'userId and pointsDelta are required' });
    }

    const user = await DatabaseService.getUserById(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pointsBefore = user.points;
    const pointsAfter = Math.max(0, Math.min(100, pointsBefore + Number(delta)));

    await DatabaseService.updateUser(user.id, { points: pointsAfter });

    await DatabaseService.addPointsLedgerEntry({
      userId: user.id,
      type: Number(delta) >= 0 ? 'BONUS' : 'DEDUCTION',
      pointsChange: Number(delta),
      balanceBefore: pointsBefore,
      balanceAfter: pointsAfter,
      reason: reasonText,
    });

    await DatabaseService.addAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: 'SUPER_ADMIN',
      action: 'POINT_ADJUSTMENT',
      target: 'USER_POINTS',
      targetId: user.id,
      details: {
        oldState: String(pointsBefore),
        newState: String(pointsAfter),
        reason: reasonText,
      },
      reason: reasonText,
    });

    return res.status(200).json({
      success: true,
      message: `Points updated successfully: ${pointsBefore} -> ${pointsAfter}`,
      pointsBefore,
      pointsAfter,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to adjust points' });
  }
});

/**
 * POST /api/points/redeem
 */
router.post('/redeem', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = req.body || {};
    const { userId, rewardId } = body;

    if (!rewardId) {
      return res.status(400).json({ success: false, message: 'rewardId is required' });
    }

    let targetUserId = user.id;
    if (userId && userId !== user.id) {
      if (user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: '403 Forbidden: Cannot redeem points on behalf of another user',
        });
      }
      targetUserId = userId;

      await DatabaseService.addAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'ADMIN_POINTS_REDEEM',
        targetType: 'POINTS',
        targetId: targetUserId,
        details: { rewardId, targetUserId },
      });
    }

    const result = await PointsService.redeemReward(targetUserId, rewardId);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to redeem reward' });
  }
});

export default router;
