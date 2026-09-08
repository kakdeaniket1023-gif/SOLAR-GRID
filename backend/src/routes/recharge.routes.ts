import { Router, Response } from 'express';
import { z } from 'zod';
import { requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';

const router = Router();

const RechargeSubmitSchema = z
  .object({
    amountUsdt: z.number().positive('Recharge amount must be greater than 0').optional(),
    amount: z.number().positive('Recharge amount must be greater than 0').optional(),
    network: z.string().optional().default('USDT-TRC20'),
    currency: z.string().optional().default('USDT-TRC20'),
    destinationAddress: z.string().optional(),
    txReference: z.string().min(6, 'Valid blockchain transaction hash/reference is required'),
    proofImageUrl: z.string().optional(),
    idempotencyKey: z.string().optional(),
  })
  .refine((data) => data.amountUsdt !== undefined || data.amount !== undefined, {
    message: 'Recharge amount is required and must be greater than 0',
  });

/**
 * GET /api/recharge/list
 */
router.get('/list', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedUserId = req.query.userId as string | undefined;

    const targetUserId = user.role === 'SUPER_ADMIN' && requestedUserId ? requestedUserId : user.id;
    const recharges = await DatabaseService.getRecharges(targetUserId);

    return res.status(200).json({ success: true, recharges });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch recharges' });
  }
});

/**
 * POST /api/recharge/submit
 */
router.post('/submit', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = RechargeSubmitSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid parameters',
      });
    }

    const finalAmount = parseResult.data.amountUsdt ?? parseResult.data.amount!;
    const finalCurrency = parseResult.data.currency || parseResult.data.network || 'USDT-TRC20';
    const { destinationAddress, txReference, proofImageUrl } = parseResult.data;

    const newRecord = await DatabaseService.createRecharge({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amountUsdt: finalAmount,
      currency: finalCurrency,
      destinationAddress: destinationAddress || 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      txReference,
      proofImageUrl,
    });

    return res.status(200).json({
      success: true,
      message: `Recharge request #${newRecord.id} for ${newRecord.amountUsdt.toFixed(2)} USDT submitted successfully. Status: PENDING review.`,
      record: newRecord,
    });
  } catch (err: any) {
    if (err.message?.includes('duplicate key') || err.message?.includes('unq') || err.message?.includes('tx_hash')) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_TRANSACTION',
        message: 'This blockchain transaction hash has already been submitted and is under review.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to submit recharge request',
    });
  }
});

export default router;
