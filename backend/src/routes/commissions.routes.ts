import { Router, Response } from 'express';
import { requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';
import { DirectCommission } from '@/types';

const router = Router();

/**
 * GET /api/commissions
 */
router.get('/', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedLimit = Number(req.query.limit || 100);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 100, 1), 500);

    const commissions = await DatabaseService.getCommissionsByBeneficiaryId(user.id);

    const totals = commissions.reduce(
      (acc: { total: number; clawedBack: number; l1Total: number; l2Total: number }, c: DirectCommission) => {
        if (c.status === 'CLAWED_BACK') {
          acc.clawedBack = Math.round((acc.clawedBack + c.amount) * 100) / 100;
        } else {
          acc.total = Math.round((acc.total + c.amount) * 100) / 100;
        }
        if (c.level === 1) acc.l1Total = Math.round((acc.l1Total + c.amount) * 100) / 100;
        if (c.level === 2) acc.l2Total = Math.round((acc.l2Total + c.amount) * 100) / 100;
        return acc;
      },
      { total: 0, clawedBack: 0, l1Total: 0, l2Total: 0 }
    );

    const sorted = [...commissions]
      .sort((a: DirectCommission, b: DirectCommission) => {
        const ta = (a as any).createdAt instanceof Date ? (a as any).createdAt.toISOString() : String((a as any).createdAt || '');
        const tb = (b as any).createdAt instanceof Date ? (b as any).createdAt.toISOString() : String((b as any).createdAt || '');
        return tb.localeCompare(ta);
      })
      .slice(0, limit);

    return res.status(200).json({ success: true, commissions: sorted, totals });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to load commissions' });
  }
});

export default router;
