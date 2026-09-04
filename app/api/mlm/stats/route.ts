import { NextRequest, NextResponse } from 'next/server';
import { MLMService } from '@/lib/mlm-engine';
import { requireUser } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  const searchParams = request.nextUrl.searchParams;
  const queryUserId = searchParams.get('userId');

  // Only SUPER_ADMIN can query network stats for another user.
  // Regular users are strictly scoped to their own authenticated user.id.
  let targetUserId = auth.user.id;
  if (queryUserId && auth.user.role === 'SUPER_ADMIN') {
    targetUserId = queryUserId;
  }

  const stats = await MLMService.getNetworkStats(targetUserId);
  return NextResponse.json({ success: true, stats });
}
