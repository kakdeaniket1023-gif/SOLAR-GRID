import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

const RechargeSubmitSchema = z.object({
  amountUsdt: z.number().positive('Recharge amount must be greater than 0').optional(),
  amount: z.number().positive('Recharge amount must be greater than 0').optional(),
  network: z.string().optional().default('USDT-TRC20'),
  currency: z.string().optional().default('USDT-TRC20'),
  destinationAddress: z.string().optional(),
  txReference: z.string().min(6, 'Valid blockchain transaction hash/reference is required'),
  proofImageUrl: z.string().optional(),
  idempotencyKey: z.string().optional(),
}).refine(data => data.amountUsdt !== undefined || data.amount !== undefined, {
  message: 'Recharge amount is required and must be greater than 0',
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = RechargeSubmitSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid parameters',
        },
        { status: 400 }
      );
    }

    const finalAmount = parseResult.data.amountUsdt ?? parseResult.data.amount!;
    const finalCurrency = parseResult.data.currency || parseResult.data.network || 'USDT-TRC20';
    const { destinationAddress, txReference, proofImageUrl } = parseResult.data;

    const newRecord = await SupabaseDatabaseService.createRecharge({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      amountUsdt: finalAmount,
      currency: finalCurrency,
      destinationAddress: destinationAddress || 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      txReference,
      proofImageUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Recharge request #${newRecord.id} for ${newRecord.amountUsdt.toFixed(2)} USDT submitted successfully. Status: PENDING review.`,
      record: newRecord,
    });
  } catch (err: any) {
    if (err.message?.includes('duplicate key') || err.message?.includes('unq') || err.message?.includes('tx_hash')) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_TRANSACTION',
          message: 'This blockchain transaction hash has already been submitted and is under review.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to submit recharge request' },
      { status: 500 }
    );
  }
}
