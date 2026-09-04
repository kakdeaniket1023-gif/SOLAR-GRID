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

    // Prevent IDOR: regular users only get their own referral tree
    const targetUserId = auth.user.role === 'SUPER_ADMIN' && requestedUserId ? requestedUserId : auth.user.id;
    const targetUser = await SupabaseDatabaseService.getUserById(targetUserId);

    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Build hierarchy tree for target user
    const allUsers = await SupabaseDatabaseService.getAllUsers();
    const directs = allUsers.filter(u => u.sponsorId === targetUser.id);

    const tree = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      referralCode: targetUser.referralCode,
      leadershipLevel: targetUser.leadershipLevel,
      points: targetUser.points,
      directCount: directs.length,
      children: directs.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        role: d.role,
        referralCode: d.referralCode,
        leadershipLevel: d.leadershipLevel,
        points: d.points,
        directCount: allUsers.filter(u => u.sponsorId === d.id).length,
        children: allUsers.filter(u => u.sponsorId === d.id).map(d2 => ({
          id: d2.id,
          name: d2.name,
          email: d2.email,
          role: d2.role,
          referralCode: d2.referralCode,
          leadershipLevel: d2.leadershipLevel,
          points: d2.points,
          directCount: allUsers.filter(u => u.sponsorId === d2.id).length,
          children: [],
        })),
      })),
    };

    return NextResponse.json({ success: true, tree });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch MLM tree' }, { status: 500 });
  }
}
