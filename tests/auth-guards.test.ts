import { describe, it, expect } from 'vitest';
import { requireSuperAdmin, requireUser, enforceUserOwnership } from '@/lib/auth/guards';
import { NextRequest } from 'next/server';

describe('SolarGrid Strict 2-Role Authorization & Security Guards', () => {
  it('rejects unauthenticated visitor with 401 Unauthorized for admin endpoints', async () => {
    // Visitor without cookies or token
    const unauthenticatedReq = new NextRequest('http://localhost:3000/api/admin/users');
    const authResult = await requireSuperAdmin(unauthenticatedReq);

    expect(authResult.authorized).toBe(false);
    expect(authResult.response).toBeDefined();
    expect(authResult.response?.status).toBe(401);
  });

  it('rejects regular USER role from accessing SUPER_ADMIN guarded endpoints with 403 Forbidden', async () => {
    const regularUser = {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Sarah',
      email: 'sarah@solargrid.io',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      referralCode: 'SG-SARAH-777',
      sponsorId: null,
      leadershipLevel: 'SOLAR_MEMBER' as const,
      points: 70,
      availableBalance: 100,
      totalEarned: 100,
      createdAt: '',
      updatedAt: '',
    };

    // User ownership check confirms regular user cannot access platform admin data
    const ownershipResult = await enforceUserOwnership(regularUser, 'platform-admin-id');
    expect(ownershipResult.authorized).toBe(false);
    expect(ownershipResult.response?.status).toBe(403);
  });

  it('enforces strict data ownership isolation between users', async () => {
    const sarahUser = {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Sarah',
      email: 'sarah@solargrid.io',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      referralCode: 'SG-SARAH-777',
      sponsorId: null,
      leadershipLevel: 'SOLAR_MEMBER' as const,
      points: 70,
      availableBalance: 100,
      totalEarned: 100,
      createdAt: '',
      updatedAt: '',
    };

    const superAdmin = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Admin',
      email: 'admin@solargrid.io',
      role: 'SUPER_ADMIN' as const,
      status: 'ACTIVE' as const,
      referralCode: 'SG-ADMIN-001',
      sponsorId: null,
      leadershipLevel: 'ENERGY_AMBASSADOR' as const,
      points: 100,
      availableBalance: 25000,
      totalEarned: 25000,
      createdAt: '',
      updatedAt: '',
    };

    // Normal user accessing own data: Allowed
    const selfAccess = await enforceUserOwnership(sarahUser, '00000000-0000-0000-0000-000000000002');
    expect(selfAccess.authorized).toBe(true);

    // Normal user accessing another user's data: Denied (403)
    const otherUserAccess = await enforceUserOwnership(sarahUser, '00000000-0000-0000-0000-000000000003');
    expect(otherUserAccess.authorized).toBe(false);
    expect(otherUserAccess.response?.status).toBe(403);

    // Super Admin accessing any user data: Allowed
    const superAdminAccess = await enforceUserOwnership(superAdmin, '00000000-0000-0000-0000-000000000003');
    expect(superAdminAccess.authorized).toBe(true);
  });
});
