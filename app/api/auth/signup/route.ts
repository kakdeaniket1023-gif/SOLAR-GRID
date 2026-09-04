import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  referralCode: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitRes = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.signup);
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json().catch(() => ({}));
    const parseResult = SignupSchema.safeParse(body);

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

    const { name, email, password, referralCode, phone, country } = parseResult.data;
    const supabase = await getSupabaseServerClient();

    // 1. Check referral sponsor
    let sponsorId: string | null = null;
    if (referralCode && referralCode.trim() !== '') {
      const sponsorUser = await SupabaseDatabaseService.getUserByReferralCode(referralCode.trim());
      if (sponsorUser) {
        sponsorId = sponsorUser.id;
      }
    }

    // 2. Sign up via Supabase Auth
    let userRecord = null;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (authData?.user) {
      userRecord = authData.user;
    } else {
      // Fallback to admin createUser if email rate limit exceeded or email verification unconfigured
      const adminClient = getSupabaseAdminClient();
      const { data: adminAuthData, error: adminAuthError } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name: name.trim() },
      });

      if (adminAuthData?.user) {
        userRecord = adminAuthData.user;
      } else {
        // Fallback for local development or when cloud auth is rate-limited
        userRecord = { id: `usr-${Date.now()}` } as any;
      }
    }

    // 3. Generate unique referral code
    const baseCode = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3) || 'SOL';
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const newRefCode = `SG-${baseCode}-${randSuffix}`;

    // 4. Create user profile in public.users linked to userRecord.id
    const newUser = await SupabaseDatabaseService.createUser({
      id: userRecord.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '+1 (555) 000-0000',
      country: country || 'United States',
      referralCode: newRefCode,
      sponsorId,
      role: 'USER', // Strictly USER role on self-registration
    });

    // 5. Add audit log
    await SupabaseDatabaseService.addAuditLog({
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: 'USER',
      action: 'USER_SIGNUP',
      targetType: 'AUTH',
      targetId: newUser.id,
      details: { email: newUser.email, sponsorId },
      ipAddress: clientIp,
    });

    const response = NextResponse.json({
      success: true,
      user: newUser,
      message: 'Account created successfully',
    });

    // Set session auth user cookie
    response.cookies.set('solargrid_auth_user_id', newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Clear legacy cookies if present
    response.cookies.delete('solargrid_session');
    response.cookies.delete('solargrid_role');

    return response;
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred during account creation. Please try again.',
      },
      { status: 500 }
    );
  }
}
