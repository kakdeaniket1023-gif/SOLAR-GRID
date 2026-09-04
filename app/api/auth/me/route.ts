import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
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

    const profile = await SupabaseDatabaseService.getProfile(auth.user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        phone: auth.user.phone,
        country: auth.user.country,
        avatarUrl: auth.user.avatarUrl,
        role: auth.user.role,
        status: auth.user.status,
        referralCode: auth.user.referralCode,
        sponsorId: auth.user.sponsorId,
        leadershipLevel: auth.user.leadershipLevel,
        points: auth.user.points,
        availableBalance: auth.user.availableBalance,
        totalEarned: auth.user.totalEarned,
        createdAt: auth.user.createdAt,
      },
      profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to retrieve authenticated user profile.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const { name, phone, country, avatarUrl, bio, walletAddress, walletNetwork, preferredCurrency, telegramHandle } = body;

    // Update safe user fields
    if (name || phone || country || avatarUrl !== undefined) {
      await SupabaseDatabaseService.updateUser(auth.user.id, {
        ...(name ? { name: String(name).trim() } : {}),
        ...(phone ? { phone: String(phone).trim() } : {}),
        ...(country ? { country: String(country).trim() } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: String(avatarUrl).trim() } : {}),
      });
    }

    // Update safe profile fields
    const updatedProfile = await SupabaseDatabaseService.updateProfile(auth.user.id, {
      ...(bio !== undefined ? { bio: String(bio) } : {}),
      ...(walletAddress !== undefined ? { walletAddress: String(walletAddress).trim() } : {}),
      ...(walletNetwork !== undefined ? { walletNetwork: String(walletNetwork).trim() as any } : {}),
      ...(preferredCurrency !== undefined ? { preferredCurrency: String(preferredCurrency).trim() } : {}),
      ...(telegramHandle !== undefined ? { telegramHandle: String(telegramHandle).trim() } : {}),
    });

    const updatedUser = await SupabaseDatabaseService.getUserById(auth.user.id);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      profile: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
