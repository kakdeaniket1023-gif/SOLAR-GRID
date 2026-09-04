import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { verifyUserTransactionPin, setUserTransactionPin } from '@/lib/auth/transaction-pin';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const PinSchema = z.object({
  action: z.enum(['VERIFY', 'SET', 'CHANGE']),
  transactionPassword: z.string().optional(),
  newTransactionPassword: z.string().regex(/^\d{4,8}$/, 'Transaction PIN must be 4 to 8 numeric digits').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitRes = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.transactionPin);
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
    const parseResult = PinSchema.safeParse(body);

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

    const { action, transactionPassword, newTransactionPassword } = parseResult.data;

    if (action === 'VERIFY') {
      if (!transactionPassword) {
        return NextResponse.json(
          { success: false, error: 'VALIDATION_ERROR', message: 'Transaction PIN is required' },
          { status: 400 }
        );
      }

      const verifyResult = await verifyUserTransactionPin(auth.user.id, transactionPassword, clientIp);
      if (!verifyResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: verifyResult.locked ? 'LOCKED' : 'INVALID_PIN',
            message: verifyResult.message,
            locked: verifyResult.locked,
            remainingAttempts: verifyResult.remainingAttempts,
          },
          { status: verifyResult.locked ? 423 : 401 }
        );
      }

      return NextResponse.json({ success: true, message: 'Transaction PIN verified successfully' });
    }

    if (action === 'SET' || action === 'CHANGE') {
      if (!newTransactionPassword) {
        return NextResponse.json(
          { success: false, error: 'VALIDATION_ERROR', message: 'New transaction PIN is required' },
          { status: 400 }
        );
      }

      // If changing, verify current PIN first
      if (action === 'CHANGE') {
        if (!transactionPassword) {
          return NextResponse.json(
            { success: false, error: 'VALIDATION_ERROR', message: 'Current transaction PIN is required' },
            { status: 400 }
          );
        }

        const verifyResult = await verifyUserTransactionPin(auth.user.id, transactionPassword, clientIp);
        if (!verifyResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: verifyResult.locked ? 'LOCKED' : 'INVALID_PIN',
              message: verifyResult.message,
            },
            { status: verifyResult.locked ? 423 : 401 }
          );
        }
      }

      const setResult = await setUserTransactionPin(auth.user.id, newTransactionPassword, clientIp);
      if (!setResult.success) {
        return NextResponse.json(
          { success: false, error: 'UPDATE_FAILED', message: setResult.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction PIN configured successfully. Financial operations are secured.',
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to process transaction PIN operation' },
      { status: 500 }
    );
  }
}
