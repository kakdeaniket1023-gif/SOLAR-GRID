import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { WithdrawalService } from '@/lib/withdrawal-engine';
import { verifyUserTransactionPin } from '@/lib/auth/transaction-pin';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (!auth.authorized || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
          { status: 401 }
        )
      );
    }

    const withdrawals = await SupabaseDatabaseService.getWithdrawals(auth.user.id);
    return NextResponse.json({ success: true, withdrawals });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitRes = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.withdrawal);
    if (rateLimitRes) return rateLimitRes;

    const auth = await requireAuthenticatedUser(request);
    if (!auth.authorized || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
          { status: 401 }
        )
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = WithdrawalSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid withdrawal parameters',
        },
        { status: 400 }
      );
    }

    const finalAmount = parseResult.data.amountUsdt ?? parseResult.data.amount!;
    const finalPin = (parseResult.data.transactionPassword || parseResult.data.transactionPin || parseResult.data.pin)!;
    const { walletAddress, network } = parseResult.data;

    // Verify transaction PIN with rate-limiting and lockout enforcement
    const pinCheck = await verifyUserTransactionPin(auth.user.id, finalPin, clientIp);
    if (!pinCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: pinCheck.locked ? 'LOCKED' : 'INVALID_PIN',
          message: pinCheck.message,
          remainingAttempts: pinCheck.remainingAttempts,
        },
        { status: pinCheck.locked ? 423 : 401 }
      );
    }

    const result = await WithdrawalService.requestWithdrawal(
      auth.user.id,
      finalAmount,
      walletAddress,
      network || 'USDT-TRC20'
    );

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message, request: result.request });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to submit withdrawal' }, { status: 500 });
  }
}
