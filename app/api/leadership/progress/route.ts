
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Prevent IDOR: regular users only get their own progress
    const targetUserId = auth.user.role === 'SUPER_ADMIN' && requestedUserId ? requestedUserId : auth.user.id;
    const targetUser = await SupabaseDatabaseService.getUserById(targetUserId);

    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const allUsers = await SupabaseDatabaseService.getAllUsers();
    const directs = allUsers.filter(u => u.sponsorId === targetUser.id);
    const levels = await SupabaseDatabaseService.getLeadershipLevels();

    const currentLevelConfig = levels.find(l => l.level === targetUser.leadershipLevel) || levels[0];
    const currentIndex = levels.findIndex(l => l.level === targetUser.leadershipLevel);
    const nextLevelConfig = currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    const progress = {
      user: targetUser,
      currentLevel: targetUser.leadershipLevel,
      currentLevelConfig,
      nextLevelConfig,
      directCount: directs.length,
      activeTeamCount: directs.length,
      points: targetUser.points,
      eligibleForPromotion: nextLevelConfig ? (directs.length >= nextLevelConfig.minDirectTeam && targetUser.points >= nextLevelConfig.minPoints) : false,
    };

    return NextResponse.json({ success: true, progress });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to evaluate leadership progress' }, { status: 500 });
  }
}
