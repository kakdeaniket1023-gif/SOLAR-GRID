import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const { userId } = await request.json().catch(() => ({}));
    const targetUserId = auth.user.role === 'SUPER_ADMIN' && userId ? userId : auth.user.id;

    const user = await SupabaseDatabaseService.getUserById(targetUserId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const levels = await SupabaseDatabaseService.getLeadershipLevels();
    const currentIndex = levels.findIndex(l => l.level === user.leadershipLevel);
    if (currentIndex >= levels.length - 1) {
      return NextResponse.json({ success: false, message: 'User has reached maximum leadership rank.' }, { status: 400 });
    }

    const nextLevel = levels[currentIndex + 1];
    const allUsers = await SupabaseDatabaseService.getAllUsers();
    const directs = allUsers.filter(u => u.sponsorId === user.id);

    if (auth.user.role !== 'SUPER_ADMIN') {
      if (directs.length < nextLevel.minDirectTeam || user.points < nextLevel.minPoints) {
        return NextResponse.json(
          {
            success: false,
            message: `Requirements not met. Requires ${nextLevel.minDirectTeam} directs and ${nextLevel.minPoints} points.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await SupabaseDatabaseService.updateUser(user.id, { leadershipLevel: nextLevel.level });

    await SupabaseDatabaseService.createNotification({
      userId: user.id,
      title: 'Leadership Rank Promotion! 🌟',
      message: `Congratulations! You have advanced to ${nextLevel.title}.`,
      link: '/dashboard/leadership',
    });

    return NextResponse.json({
      success: true,
      message: `Promoted to ${nextLevel.title}!`,
      newLevel: nextLevel.level,
      user: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to process promotion' }, { status: 500 });
  }
}
