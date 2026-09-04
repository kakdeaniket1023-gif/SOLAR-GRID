import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
          { status: 401 }
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    let sessions;
    if (auth.user.role === 'SUPER_ADMIN') {
      if (requestedUserId) {
        sessions = await SupabaseDatabaseService.getUserSessions(requestedUserId);
      } else {
        sessions = await SupabaseDatabaseService.getAllSessions();
      }
    } else {
      // Non-admins can only see their own sessions
      sessions = await SupabaseDatabaseService.getUserSessions(auth.user.id);
    }

    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to retrieve sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
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
    const { action, sessionId } = body;

    if (action === 'REVOKE_ONE') {
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: 'VALIDATION_ERROR', message: 'Session ID is required' },
          { status: 400 }
        );
      }

      const success = await SupabaseDatabaseService.revokeSession(sessionId);
      return NextResponse.json({
        success,
        message: success ? 'Session revoked successfully' : 'Session not found',
      });
    }

    if (action === 'REVOKE_ALL') {
      const success = await SupabaseDatabaseService.revokeAllUserSessions(auth.user.id);
      return NextResponse.json({
        success: true,
        message: 'Terminated active sessions across all devices',
      });
    }

    return NextResponse.json(
      { success: false, error: 'INVALID_ACTION', message: 'Invalid session management action' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to process session revocation' },
      { status: 500 }
    );
  }
}
