import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuthenticatedUser, requireSuperAdmin, AuthenticatedRequest } from '@/backend/auth/guards';
import { WithdrawalService } from '@/backend/engines/withdrawal-engine';
import { verifyUserTransactionPin } from '@/backend/auth/transaction-pin';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/backend/security/rate-limiter';
import { DatabaseService } from '@/backend/db';

const router = Router();

const WithdrawalSchema = z
  .object({
    amountUsdt: z.number().min(10, 'Minimum withdrawal amount is 10 USDT').optional(),
    amount: z.number().min(10, 'Minimum withdrawal amount is 10 USDT').optional(),
    walletAddress: z.string().min(10, 'Valid USDT destination wallet address is required'),
    network: z.string().optional().default('USDT-TRC20'),
    transactionPassword: z.string().min(4).optional(),
    transactionPin: z.string().min(4).optional(),
    pin: z.string().min(4).optional(),
    idempotencyKey: z.string().optional(),
  })
  .refine((data) => data.amountUsdt !== undefined || data.amount !== undefined, {
    message: 'Withdrawal amount is required (min 10 USDT)',
  })
  .refine((data) => Boolean(data.transactionPassword || data.transactionPin || data.pin), {
    message: 'Mandatory transaction PIN is required',
  });

/**
 * GET /api/withdrawals/request
 */
router.get('/request', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const withdrawals = await DatabaseService.getWithdrawals(user.id);
    return res.status(200).json({ success: true, withdrawals });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
});

/**
 * POST /api/withdrawals/request
 */
router.post('/request', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.withdrawal, res)) return;

    const user = req.user!;
    const parseResult = WithdrawalSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid withdrawal parameters',
      });
    }

    const finalAmount = parseResult.data.amountUsdt ?? parseResult.data.amount!;
    const finalPin = (parseResult.data.transactionPassword || parseResult.data.transactionPin || parseResult.data.pin)!;
    const { walletAddress, network } = parseResult.data;

    const pinCheck = await verifyUserTransactionPin(user.id, finalPin, clientIp);
    if (!pinCheck.success) {
      return res.status(pinCheck.locked ? 423 : 401).json({
        success: false,
        error: pinCheck.locked ? 'LOCKED' : 'INVALID_PIN',
        message: pinCheck.message,
        remainingAttempts: pinCheck.remainingAttempts,
      });
    }

    const result = await WithdrawalService.requestWithdrawal(
      user.id,
      finalAmount,
      walletAddress,
      network || 'USDT-TRC20'
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message, request: result.request });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to submit withdrawal' });
  }
});

/**
 * POST /api/withdrawals/process (Super Admin only)
 */
router.post('/process', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { withdrawalId, action, txHash, adminNotes } = req.body || {};

    if (!withdrawalId || !action) {
      return res.status(400).json({ success: false, message: 'withdrawalId and action are required' });
    }

    const result = await WithdrawalService.processAdminAction(
      withdrawalId,
      action,
      admin.id,
      admin.name,
      txHash,
      adminNotes
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message, request: result.request });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Internal error processing withdrawal' });
  }
});

export default router;
