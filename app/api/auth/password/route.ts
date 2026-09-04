import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const ChangePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: z.string({ required_error: 'New password is required' }).min(6, 'New password must be at least 6 characters long'),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitRes = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.passwordReset);
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
    const parseResult = ChangePasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid input data',
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;
    const supabase = await getSupabaseServerClient();

    // Re-authenticate using current password to ensure session ownership
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: auth.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CURRENT_PASSWORD',
          message: 'The current password provided is incorrect.',
        },
        { status: 401 }
      );
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTH_ERROR',
          message: updateError.message || 'Failed to update password in Supabase Auth.',
        },
        { status: 400 }
      );
    }

    await SupabaseDatabaseService.addAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'PASSWORD_CHANGED',
      targetType: 'AUTH',
      targetId: auth.user.id,
      details: { updated: true },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: 'Login password updated successfully. Your account is secured.',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while updating your password.',
      },
      { status: 500 }
    );
  }
}
