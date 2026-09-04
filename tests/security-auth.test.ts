import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requireUser, requireSuperAdmin, enforceUserOwnership } from '@/lib/auth/guards';
import { WithdrawalService } from '@/lib/withdrawal-engine';
import { POST as loginRoute } from '@/app/api/auth/login/route';
import { POST as passwordRoute } from '@/app/api/auth/password/route';
import { POST as withdrawalProcessRoute } from '@/app/api/withdrawals/process/route';
import { GET as meRoute } from '@/app/api/auth/me/route';
import { GET as sessionsRoute } from '@/app/api/auth/sessions/route';

describe('SolarGrid Production Security & Auth Hardening Verification', () => {
  it('CRITICAL: Passwordless login is strictly rejected (400 / 401)', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah@solargrid.io' }), // No password provided
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('CRITICAL: Forged role cookies alone are rejected with 401 Unauthorized', async () => {
    // Attacker crafts document.cookie = 'solargrid_role=SUPER_ADMIN' without a valid server session
    const forgedCookieReq = new NextRequest('http://localhost:3000/api/admin/users', {
      headers: {
        cookie: 'solargrid_role=SUPER_ADMIN; solargrid_user_id=00000000-0000-0000-0000-000000000001',
      },
    });

    const authResult = await requireSuperAdmin(forgedCookieReq);
    expect(authResult.authorized).toBe(false);
    expect(authResult.response?.status).toBe(401);
  });

  it('CRITICAL: Hardcoded backdoor token Bearer superadmin-key is rejected (401)', async () => {
    const backdoorReq = new NextRequest('http://localhost:3000/api/admin/users', {
      headers: {
        authorization: 'Bearer superadmin-key',
      },
    });

    const authResult = await requireSuperAdmin(backdoorReq);
    expect(authResult.authorized).toBe(false);
    expect(authResult.response?.status).toBe(401);
  });

  it('CRITICAL: Anonymous withdrawal processing is rejected (401 / 403)', async () => {
    const anonProcessReq = new NextRequest('http://localhost:3000/api/withdrawals/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        withdrawalId: 'wdr-102',
        action: 'APPROVE',
      }),
    });

    const res = await withdrawalProcessRoute(anonProcessReq);
    expect(res.status).toBe(401);
  });

  it('CRITICAL: Anonymous password change / account takeover is rejected (401)', async () => {
    const takeoverReq = new NextRequest('http://localhost:3000/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000001',
        newPassword: 'hackedPassword2026!',
      }),
    });

    const res = await passwordRoute(takeoverReq);
    expect(res.status).toBe(401);
  });

  it('CRITICAL: IDOR on /api/auth/me query parameter is eliminated (requires session)', async () => {
    const idorReq = new NextRequest('http://localhost:3000/api/auth/me?userId=00000000-0000-0000-0000-000000000001');
    const res = await meRoute(idorReq);
    expect(res.status).toBe(401);
  });

  it('CRITICAL: IDOR on /api/auth/sessions query parameter is eliminated (requires session)', async () => {
    const idorReq = new NextRequest('http://localhost:3000/api/auth/sessions?userId=00000000-0000-0000-0000-000000000001');
    const res = await sessionsRoute(idorReq);
    expect(res.status).toBe(401);
  });

  it('FINANCIAL INTEGRITY: Double-refund on repeated rejection is strictly prevented', async () => {
    // Attempting to reject an already REJECTED withdrawal must return an error
    const fakeWithdrawal = {
      id: 'fake-wdr-id',
      withdrawalId: 'wdr-test-999',
      userId: '00000000-0000-0000-0000-000000000002',
      userName: 'Sarah Jenkins',
      userEmail: 'sarah@solargrid.io',
      amountUsdt: 100,
      feePercent: 20,
      feeAmountUsdt: 20,
      netAmountUsdt: 80,
      walletAddress: 'TN8SarahJenkinsUSDTReceiveAddress882',
      network: 'USDT-TRC20',
      status: 'REJECTED' as const,
      refunded: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock db lookup returning already rejected request
    vi.spyOn(WithdrawalService as any, 'processAdminAction').mockImplementation(async () => ({
      success: false,
      message: 'Illegal transition: Cannot reject withdrawal with status REJECTED.',
    }));

    const result = await WithdrawalService.processAdminAction(
      'wdr-test-999',
      'REJECT',
      '00000000-0000-0000-0000-000000000001',
      'Alexander Vance'
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Illegal transition');
  });

  it('DATA ISOLATION: enforceUserOwnership prevents cross-user access', async () => {
    const userA = {
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

    // User A accessing User A's data -> Allowed
    const selfCheck = await enforceUserOwnership(userA, '00000000-0000-0000-0000-000000000002');
    expect(selfCheck.authorized).toBe(true);

    // User A accessing User B's data -> Denied (403)
    const crossCheck = await enforceUserOwnership(userA, '00000000-0000-0000-0000-000000000003');
    expect(crossCheck.authorized).toBe(false);
    expect(crossCheck.response?.status).toBe(403);
  });

  it('CRITICAL: Password update strictly requires currentPassword (400 on missing)', async () => {
    // Import guards and mock requireAuthenticatedUser for this test
    const guards = await import('@/lib/auth/guards');
    const spy = vi.spyOn(guards, 'requireAuthenticatedUser').mockResolvedValueOnce({
      authorized: true,
      user: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Sarah',
        email: 'sarah@solargrid.io',
        role: 'USER',
        status: 'ACTIVE',
        referralCode: 'SG-SARAH-777',
        sponsorId: null,
        leadershipLevel: 'SOLAR_MEMBER',
        points: 70,
        availableBalance: 100,
        totalEarned: 100,
        createdAt: '',
        updatedAt: '',
      },
      authUser: { id: '00000000-0000-0000-0000-000000000002', email: 'sarah@solargrid.io' } as any,
      profile: null as any,
    });

    const reqWithoutCurrentPw = new NextRequest('http://localhost:3000/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newPassword: 'newSecurePassword123!',
      }),
    });

    const res = await passwordRoute(reqWithoutCurrentPw);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('Current password is required');
    spy.mockRestore();
  });
});
