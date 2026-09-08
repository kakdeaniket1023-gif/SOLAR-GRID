import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseService } from '@/backend/db';
import { SolarGenerationService } from '@/backend/engines/solar-engine';
import { requireAuthenticatedUser, requireSuperAdmin, requireUser, AuthenticatedRequest } from '@/backend/auth/guards';

const router = Router();

const PurchaseSchema = z.object({
  planCode: z.string().min(1, 'Plan code is required'),
});

/**
 * GET /api/solar/plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const [plans, schedule] = await Promise.all([
      DatabaseService.getPlans(),
      SolarGenerationService.loadDynamicSchedule(),
    ]);

    return res.status(200).json({
      success: true,
      plans,
      schedule: {
        operationWindow: `${schedule.startTime} – ${schedule.endTime}`,
        operatingDays: schedule.operatingDays,
        settlementTime: 'Immediate post-generation',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch solar plans' });
  }
});

/**
 * POST /api/solar/plans (Super admin update)
 */
router.post('/plans', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { code, plan } = req.body || {};
    if (!code || !plan) {
      return res.status(400).json({ success: false, message: 'code and plan are required' });
    }

    const updated = await DatabaseService.updatePlan(code, plan);

    await DatabaseService.addAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_SOLAR_PLAN_CONFIG',
      targetType: 'SOLAR_PLAN',
      targetId: code,
      details: { code, plan },
    });

    return res.status(200).json({ success: true, plan: updated, message: 'Plan updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update plan' });
  }
});

/**
 * POST /api/solar/purchase
 */
router.post('/purchase', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = PurchaseSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid request',
      });
    }

    const result = await SolarGenerationService.purchasePlan(user.id, parseResult.data.planCode);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message, unit: result.unit });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to complete solar purchase' });
  }
});

/**
 * GET /api/solar/operate
 */
router.get('/operate', (req: Request, res: Response) => {
  try {
    const status = SolarGenerationService.getSolarOperationStatus();
    return res.status(200).json({ success: true, ...status });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch solar operation status' });
  }
});

/**
 * POST /api/solar/operate
 */
router.post('/operate', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { unitId, action, startCode } = req.body || {};
    if (!unitId) {
      return res.status(400).json({ success: false, message: 'unitId is required' });
    }

    const unit = await DatabaseService.getUnitById(unitId);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Solar unit not found' });
    }

    // Enforce ownership
    if (unit.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: '403 Forbidden: You do not own this solar unit.',
      });
    }

    if (action === 'SETTLE') {
      const result = await SolarGenerationService.settleDailyOperation(unitId, user.id);
      if (!result.success && !result.alreadySettled) {
        return res.status(400).json({ success: false, message: result.message });
      }
      return res.status(200).json({
        success: true,
        alreadySettled: result.alreadySettled || false,
        message: result.message,
        creditedAmount: result.creditedAmount,
        newBalance: result.balanceAfter,
        log: result.log,
        unit: result.unit,
      });
    }

    if (action === 'START') {
      const result = await SolarGenerationService.startDailyOperation(unitId, user.id, startCode);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }
      return res.status(200).json({
        success: true,
        message: result.message,
        receivableAmount: result.receivableAmount,
        kwhGenerated: result.kwhGenerated,
        startedAt: result.startedAt,
        log: result.log,
      });
    }

    if (action === 'RECEIVE') {
      const result = await SolarGenerationService.receiveDailyEarning(unitId, user.id);
      if (!result.success || result.alreadySettled) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Daily generation already settled for today.',
        });
      }
      return res.status(200).json({
        success: true,
        message: result.message,
        creditedAmount: result.creditedAmount,
        newBalance: result.balanceAfter,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action. Must be SETTLE, START, or RECEIVE',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to process solar operation' });
  }
});

/**
 * POST /api/solar/upgrade
 */
router.post('/upgrade', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { unitId, targetPlanCode } = req.body || {};
    if (!unitId || !targetPlanCode) {
      return res.status(400).json({ success: false, message: 'unitId and targetPlanCode are required' });
    }

    const result = await SolarGenerationService.upgradeUnit(user.id, unitId, targetPlanCode);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      unit: result.unit,
      topUpCostUsdt: result.topUpCostUsdt,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to process plan upgrade' });
  }
});

export default router;
