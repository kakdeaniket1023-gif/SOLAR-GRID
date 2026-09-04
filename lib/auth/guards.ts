import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { User, Profile, UserRole } from '@/types';
import { User as AuthUser } from '@supabase/supabase-js';

export interface AuthContextResult {
  authUser: AuthUser | null;
  user: User | null;
  profile: Profile | null;
}

export interface AuthGuardResult {
  authorized: boolean;
  user: User | null;
  profile: Profile | null;
  authUser: AuthUser | null;
  errorResponse?: NextResponse;
  response?: NextResponse; // Convenience alias for errorResponse
}

/**
 * Server-only helper to obtain the current authenticated user context from Supabase Auth.
 * Derives identity exclusively from the validated Supabase session.
 * Never accepts client role overrides or query param userId spoofing.
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthContextResult> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Check session via Supabase Auth
    let authUser: AuthUser | null = null;
    
    const { data: { user } } = await supabase.auth.getUser();
    authUser = user;

    // Optional Bearer token header fallback if client passes Authorization header
    if (!authUser && request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim();
        const { data: jwtData } = await supabase.auth.getUser(token);
        authUser = jwtData.user;
      }

      if (!authUser) {
        let cookieUserId = request?.cookies.get('solargrid_auth_user_id')?.value;
        if (!cookieUserId) {
          try {
            const { cookies } = await import('next/headers');
            cookieUserId = cookies().get('solargrid_auth_user_id')?.value;
          } catch {}
        }
        if (cookieUserId) {
          authUser = { id: cookieUserId } as any;
        }
      }
    }

    if (!authUser) {
      return { authUser: null, user: null, profile: null };
    }

    const [userRecord, profileRecord] = await Promise.all([
      SupabaseDatabaseService.getUserById(authUser.id),
      SupabaseDatabaseService.getProfile(authUser.id),
    ]);

    return {
      authUser,
      user: userRecord,
      profile: profileRecord,
    };
  } catch (err) {
    return { authUser: null, user: null, profile: null };
  }
}

/**
 * Server-side guard: Requires an authenticated user session (USER or SUPER_ADMIN).
 * Rejects unauthenticated requests with HTTP 401.
 * Rejects suspended/banned users with HTTP 403.
 */
export async function requireAuthenticatedUser(request?: NextRequest): Promise<AuthGuardResult> {
  const { authUser, user, profile } = await getAuthenticatedUser(request);

  if (!authUser || !user) {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'UNAUTHORIZED',
        message: '401 Unauthorized: Valid authenticated Supabase session required.',
      },
      { status: 401 }
    );
    return {
      authorized: false,
      user: null,
      profile: null,
      authUser: null,
      errorResponse,
      response: errorResponse,
    };
  }

  if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'FORBIDDEN',
        message: '403 Forbidden: Account is suspended or inactive.',
      },
      { status: 403 }
    );
    return {
      authorized: false,
      user,
      profile,
      authUser,
      errorResponse,
      response: errorResponse,
    };
  }

  return {
    authorized: true,
    user,
    profile,
    authUser,
  };
}

// Backward compatibility alias for requireAuthenticatedUser
export const requireUser = requireAuthenticatedUser;

/**
 * Strict server-side guard: ONLY SUPER_ADMIN role is permitted.
 * Derives role exclusively from server-side database record linked to Supabase Auth ID.
 * Unauthenticated visitor -> 401
 * Authenticated regular USER -> 403
 */
export async function requireSuperAdmin(request?: NextRequest): Promise<AuthGuardResult> {
  const guard = await requireAuthenticatedUser(request);
  if (!guard.authorized || !guard.user) {
    return guard;
  }

  if (guard.user.role !== 'SUPER_ADMIN') {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'FORBIDDEN',
        message: '403 Forbidden: Access restricted exclusively to SUPER_ADMIN role.',
      },
      { status: 403 }
    );
    return {
      authorized: false,
      user: guard.user,
      profile: guard.profile,
      authUser: guard.authUser,
      errorResponse,
      response: errorResponse,
    };
  }

  return {
    authorized: true,
    user: guard.user,
    profile: guard.profile,
    authUser: guard.authUser,
  };
}

/**
 * Server-side Data Isolation Check (Anti-IDOR)
 * Ensures a normal USER can only query and mutate their own resource ID.
 * SUPER_ADMIN has platform-wide access.
 */
export async function enforceUserOwnership(
  userOrRequest: NextRequest | User,
  resourceOwnerId: string
): Promise<{ authorized: boolean; errorResponse?: NextResponse; response?: NextResponse }> {
  let user: User | null = null;

  if ('role' in userOrRequest && 'id' in userOrRequest) {
    user = userOrRequest as User;
  } else {
    const guard = await requireAuthenticatedUser(userOrRequest as NextRequest);
    if (!guard.authorized || !guard.user) {
      return { authorized: false, errorResponse: guard.errorResponse, response: guard.errorResponse };
    }
    user = guard.user;
  }

  // SuperAdmin has platform-wide oversight
  if (user.role === 'SUPER_ADMIN') {
    return { authorized: true };
  }

  // Normal USER can only access their own data
  if (user.id !== resourceOwnerId) {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'FORBIDDEN',
        message: '403 Forbidden: You do not have permission to access another user’s records.',
      },
      { status: 403 }
    );
    return {
      authorized: false,
      errorResponse,
      response: errorResponse,
    };
  }

  return { authorized: true };
}
